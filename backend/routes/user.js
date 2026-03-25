const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper for Safe Date Conversion
const toSafeISO = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

// @route   GET api/user/holidays
// @desc    Get all holidays
router.get('/holidays', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.holidays || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/user/holidays
// @desc    Add a holiday
router.post('/holidays', auth, async (req, res) => {
  const { date, label } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.holidays.push({ date: new Date(date), label: label || 'Holiday' });
    await user.save();
    res.json(user.holidays);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/user/holidays/:id
// @desc    Remove a holiday
router.delete('/holidays/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.holidays.pull({ _id: req.params.id });
    await user.save();
    res.json(user.holidays);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/gamification
// @desc    Get streak and badges
router.get('/gamification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      streak: user.streak || 0,
      lastAttendanceDate: user.lastAttendanceDate,
      badges: user.badges || []
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/user/semester-end
// @desc    Update semester end date
router.put('/semester-end', auth, async (req, res) => {
  const { date } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.semesterEndDate = date ? new Date(date) : null;
    await user.save();
    res.json({ semesterEndDate: user.semesterEndDate });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/extra-classes
// @desc    Get all extra class overrides
router.get('/extra-classes', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.extraClasses || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/user/extra-classes
// @desc    Add an extra class override
router.post('/extra-classes', auth, async (req, res) => {
  const { date, followsDay } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.extraClasses.push({ date: new Date(date), followsDay });
    await user.save();
    res.json(user.extraClasses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/user/extra-classes/:id
// @desc    Remove an extra class override
router.delete('/extra-classes/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.extraClasses.pull({ _id: req.params.id });
    await user.save();
    res.json(user.extraClasses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/user/settings
// @desc    Update user settings (notifications, etc)
router.put('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings.toObject(),
        ...req.body.notificationSettings
      };
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/daily-status/:date
// @desc    Get timetable and attendance status for a specific day
router.get('/daily-status/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const dateStr = toSafeISO(date);
    if (!dateStr) return res.status(400).json({ message: 'Invalid date format' });
    
    const targetDate = new Date(date);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Check for holidays
    const holiday = (user.holidays || []).find(h => 
      toSafeISO(h.date) === dateStr
    );
    if (holiday) return res.json({ date: dateStr, isHoliday: true, label: holiday.label });

    // Check for day overrides (extra classes)
    const override = (user.extraClasses || []).find(ec => 
      toSafeISO(ec.date) === dateStr
    );
    const dayToFollow = override ? override.followsDay : dayNames[targetDate.getDay()];

    const daySchedule = user.timetable.find(t => t.day.toLowerCase() === dayToFollow.toLowerCase());
    if (!daySchedule) return res.json({ date: dateStr, day: dayToFollow, sessions: [] });

    const sessions = daySchedule.slots.map(slot => {
      const subject = user.subjects.id(slot.subject);
      // Look for a record on this date
      const record = subject ? subject.attendanceRecords.find(r => 
        toSafeISO(r.date) === dateStr
      ) : null;

      return {
        time: slot.time,
        subjectId: slot.subject,
        subjectName: subject ? subject.name : 'Unknown Subject',
        subjectColor: subject ? subject.color : '#3b82f6',
        professor: subject ? subject.professor : '',
        credit: slot.credit || 1,
        status: record ? record.status : null,
        recordId: record ? record._id : null
      };
    }).filter(s => s.subjectId);

    res.json({ date: dateStr, day: dayToFollow, sessions });
  } catch (err) {
    console.error(`Daily Status Error [${req.params.date}]:`, err.message);
    res.status(500).send('Server error fetching daily status');
  }
});

module.exports = router;
