const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { syncPortalAttendance } = require('../services/ocrService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'portal-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// @route   POST api/subjects/sync-portal
// @desc    Sync attendance from portal screenshot
router.post('/sync-portal', [auth, upload.single('portal')], async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const result = await syncPortalAttendance(req.file.path);
    const user = await User.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updates = [];
    result.attendance.forEach(portalSub => {
      const subject = user.subjects.find(s => 
        s.name.toLowerCase().includes(portalSub.subject.toLowerCase()) ||
        portalSub.subject.toLowerCase().includes(s.name.toLowerCase())
      );

      if (subject) {
        // Update baseline snapshot
        subject.initialAttended = portalSub.attended;
        subject.initialTotal = portalSub.total;
        subject.initialDate = today;
        
        // Recalculate totals (this will effectively lock the past relative to this sync)
        recalculateAttendance(subject);
        updates.push(subject.name);
      }
    });

    await user.save();
    res.json({ message: `Synced ${updates.length} subjects: ${updates.join(', ')}`, subjects: user.subjects });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/subjects
// @desc    Get all subjects for a user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/subjects
// @desc    Add a subject
router.post('/', auth, async (req, res) => {
  const { name, requiredAttendance, color, initialAttended, initialTotal } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const newSubject = { 
      name, 
      requiredAttendance: requiredAttendance || 75, 
      color: color || '#3b82f6', 
      initialAttended: initialAttended || 0,
      initialTotal: initialTotal || 0,
      attended: initialAttended || 0, 
      total: initialTotal || 0, 
      attendanceRecords: [] 
    };
    user.subjects.push(newSubject);
    await user.save();
    res.json(user.subjects[user.subjects.length - 1]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/subjects/:id
// @desc    Update a subject (edit details or mark attendance legacy)
router.put('/:id', auth, async (req, res) => {
  const { attended, total, status, name, requiredAttendance, color, initialAttended, initialTotal, initialDate, credit } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const subject = user.subjects.id(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const increment = credit || 1;

    if (status) {
      subject.attendanceRecords.push({ date: new Date(), status, credit: increment });
      
      // Use the unified recalculation engine
      recalculateAttendance(subject);

      // Streak & Gamification
      if (status === 'Present' || status === 'OD' || status === 'Medical') {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.lastAttendanceDate ? new Date(user.lastAttendanceDate).toISOString().split('T')[0] : null;
        
        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastDate === yesterdayStr) {
            user.streak = (user.streak || 0) + 1;
          } else {
            user.streak = 1;
          }
          user.lastAttendanceDate = new Date();
        }

        // Badge checks
        const existingBadges = new Set((user.badges || []).map(b => b.name));
        if (user.streak >= 7 && !existingBadges.has('Weekly Warrior')) {
          user.badges.push({ name: 'Weekly Warrior', icon: '🔥' });
        }
        if (user.streak >= 30 && !existingBadges.has('Monthly Master')) {
          user.badges.push({ name: 'Monthly Master', icon: '⭐' });
        }
        if (subject.attended >= 50 && !existingBadges.has('Half Century')) {
          user.badges.push({ name: 'Half Century', icon: '💯' });
        }
      }
    } else {
      if (name !== undefined) subject.name = name;
      if (requiredAttendance !== undefined) subject.requiredAttendance = requiredAttendance;
      if (color !== undefined) subject.color = color;
      
      if (initialAttended !== undefined) subject.initialAttended = initialAttended;
      if (initialTotal !== undefined) subject.initialTotal = initialTotal;
      if (initialDate !== undefined) subject.initialDate = initialDate ? new Date(initialDate) : null;

      // Recalculate totals whenever initial values or date change
      if (initialAttended !== undefined || initialTotal !== undefined || initialDate !== undefined) {
        let trackedAttended = 0;
        let trackedTotal = 0;
        const baseDate = subject.initialDate ? new Date(subject.initialDate) : null;

        subject.attendanceRecords.forEach(record => {
          // Only count records ON or AFTER the initialDate
          if (baseDate && record.date && new Date(record.date) < baseDate) return;
          
          const recCredit = record.credit || 1;
          if (record.status === 'Present') {
            trackedAttended += recCredit;
            trackedTotal += recCredit;
          } else if (record.status === 'Absent') {
            trackedTotal += recCredit;
          }
        });
        subject.attended = (subject.initialAttended || 0) + trackedAttended;
        subject.total = (subject.initialTotal || 0) + trackedTotal;
      }
    }

    await user.save();
    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper for Recalculation Engine
const recalculateAttendance = (subject) => {
  let trackedAttended = 0;
  let trackedTotal = 0;
  const baseDate = subject.initialDate ? new Date(subject.initialDate) : null;

  subject.attendanceRecords.forEach(record => {
    // Lock logic: Ignore entries before the snapshot date
    if (baseDate && record.date && new Date(record.date) < baseDate) return;
    
    // Cancelled classes increment NEITHER attended nor total
    if (record.status === 'Cancelled') return;

    const recCredit = record.credit || 1;
    trackedTotal += recCredit;
    
    if (['Present', 'OD', 'Medical'].includes(record.status)) {
      trackedAttended += recCredit;
    }
  });

  subject.attended = (subject.initialAttended || 0) + trackedAttended;
  subject.total = (subject.initialTotal || 0) + trackedTotal;

  // Sync individual counts for completeness
  subject.odCount = subject.attendanceRecords.filter(r => r.status === 'OD').reduce((a, b) => a + (b.credit || 1), 0);
  subject.medicalCount = subject.attendanceRecords.filter(r => r.status === 'Medical').reduce((a, b) => a + (b.credit || 1), 0);
};

// @route   PUT api/subjects/:id/snapshot
// @desc    Set the Baseline Snapshot (locks prior dates)
router.put('/:id/snapshot', auth, async (req, res) => {
  const { initialDate, initialAttended, initialTotal } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const subject = user.subjects.id(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    subject.initialDate = new Date(initialDate);
    subject.initialAttended = initialAttended;
    subject.initialTotal = initialTotal;

    recalculateAttendance(subject);
    await user.save();
    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/subjects/:id/log
// @desc    Add or edit a daily attendance log (Editable Timeline)
router.put('/:id/log', auth, async (req, res) => {
    const { date, status, credit } = req.body; // status: 'Present', 'Absent', 'OD', 'Medical'
    try {
      const user = await User.findById(req.user.id);
      const subject = user.subjects.id(req.params.id);
      if (!subject) return res.status(404).json({ message: 'Subject not found' });
  
      const targetDateStr = new Date(date).toISOString().split('T')[0];
      const baseDateStr = subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : null;
  
      // Lock validation
      if (baseDateStr && targetDateStr < baseDateStr) {
        return res.status(403).json({ message: 'Cannot edit logs before the Snapshot date' });
      }
  
      // Find if a log already exists for this date
      let existingLog = null;
      for (let record of subject.attendanceRecords) {
        if (record.date && new Date(record.date).toISOString().split('T')[0] === targetDateStr) {
          existingLog = record;
          break;
        }
      }
  
      if (existingLog) {
        existingLog.status = status;
        if (credit !== undefined) existingLog.credit = credit;
      } else {
        subject.attendanceRecords.push({ date: new Date(date), status, credit: credit || 1 });
      }
  
      recalculateAttendance(subject);
    await user.save();
    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/subjects/projections
// @desc    Calculate max possible attendance until an end date
router.get('/projections', auth, async (req, res) => {
  const { endDate } = req.query;
  try {
    if (!endDate) return res.status(400).json({ message: 'endDate query parameter is required' });
    
    const user = await User.findById(req.user.id);
    const end = new Date(endDate);
    const start = new Date();
    start.setDate(start.getDate() + 1);
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Build a set of holiday dates for fast lookup
    const holidaySet = new Set(
      (user.holidays || []).map(h => new Date(h.date).toISOString().split('T')[0])
    );
    
    const futureCredits = {};
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (holidaySet.has(dateStr)) continue; // Skip holidays
      
      const dayName = dayNames[d.getDay()];
      const daySchedule = user.timetable.find(t => 
        t.day.toLowerCase().startsWith(dayName.toLowerCase().substring(0, 2))
      );

      if (daySchedule && daySchedule.slots) {
        daySchedule.slots.forEach(slot => {
          if (slot.subject) {
            const subId = slot.subject._id ? slot.subject._id.toString() : slot.subject.toString();
            const credit = slot.credit || 1;
            futureCredits[subId] = (futureCredits[subId] || 0) + credit;
          }
        });
      }
    }

    const projections = user.subjects.map(sub => {
      const remaining = futureCredits[sub._id.toString()] || 0;
      const futureTotal = sub.total + remaining;
      const futureAttended = sub.attended + remaining; // Max possible assumes attending ALL future classes
      
      const maxPossiblePercentage = futureTotal > 0 ? (futureAttended / futureTotal) * 100 : 0;
      const canReachGoal = maxPossiblePercentage >= sub.requiredAttendance;
      
      // How many classes exactly needed to hit required %
      // (attended + X) / (total + remaining) = required/100
      // X = (required/100) * (total + remaining) - attended
      const targetClasses = Math.ceil((sub.requiredAttendance / 100) * futureTotal - sub.attended);

      return {
        subjectId: sub._id,
        name: sub.name,
        currentPercentage: sub.total > 0 ? (sub.attended / sub.total) * 100 : 0,
        remainingClasses: remaining,
        maxPossiblePercentage,
        canReachGoal,
        targetClassesNeeded: Math.max(0, targetClasses)
      };
    });

    res.json(projections);
  } catch (err) {
    console.error('Projection Error:', err.message);
    res.status(500).send('Server error calculating projections');
  }
});

// @route   PUT api/subjects/:id/undo
// @desc    Undo last attendance action
router.put('/:id/undo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const subject = user.subjects.id(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (!subject.attendanceRecords || subject.attendanceRecords.length === 0) {
      return res.status(400).json({ message: 'No actions to undo' });
    }

    const lastRecord = subject.attendanceRecords.pop();
    
    // Use the unified recalculation engine
    recalculateAttendance(subject);

    await user.save();
    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/subjects/batch-mark
// @desc    Mark attendance for multiple days based on timetable
router.post('/batch-mark', auth, async (req, res) => {
  const { startDate, endDate, status } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user.timetable || user.timetable.length === 0) {
      return res.status(400).json({ message: 'Timetable is required for batch marking' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const holidaySet = new Set((user.holidays || []).map(h => new Date(h.date).toISOString().split('T')[0]));

    let markedCount = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (holidaySet.has(dateStr)) continue;

      // Check for day override (e.g., "Tuesday follows Monday schedule")
      const override = (user.extraClasses || []).find(ec => new Date(ec.date).toISOString().split('T')[0] === dateStr);
      const dayToFollow = override ? override.followsDay : dayNames[d.getDay()];
      
      const daySchedule = user.timetable.find(t => t.day.toLowerCase() === dayToFollow.toLowerCase());

      if (daySchedule && daySchedule.slots) {
        daySchedule.slots.forEach(slot => {
          if (slot.subject) {
            const subject = user.subjects.id(slot.subject);
            if (subject) {
              const baseDateStr = subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : null;
              if (baseDateStr && dateStr < baseDateStr) return;

              // Check if already marked
              const exists = subject.attendanceRecords.some(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
              if (!exists) {
                subject.attendanceRecords.push({ date: new Date(d), status, credit: slot.credit || 1 });
                recalculateAttendance(subject);
                markedCount++;
              }
            }
          }
        });
      }
    }

    await user.save();
    res.json({ message: `Successfully auto-filled ${markedCount} classes`, subjects: user.subjects });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/subjects/extra-log
// @desc    Log attendance for an extra/non-scheduled session
router.post('/extra-log', auth, async (req, res) => {
  const { subjectId, status, date, credit } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const subject = user.subjects.id(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    subject.attendanceRecords.push({ 
      date: date ? new Date(date) : new Date(), 
      status, 
      credit: credit || 1 
    });

    recalculateAttendance(subject);
    await user.save();
    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
