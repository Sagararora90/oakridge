const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const { parseTimetableImage } = require('../services/ocrService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const path = require('path');

// @route   GET api/timetable
// @desc    Get user timetable
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.timetable);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetable
// @desc    Update whole timetable
router.post('/', auth, async (req, res) => {
  try {
    console.log(`Updating timetable for user: ${req.user.id}`);
    console.log('Incoming data:', JSON.stringify(req.body, null, 2));
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sanitize timetable data before saving
    const sanitizedTimetable = req.body.map(dayEntry => ({
      day: dayEntry.day,
      slots: dayEntry.slots.map(slot => ({
        time: slot.time,
        subject: (slot.subject && slot.subject !== "") ? slot.subject : null,
        credit: slot.credit || 1
      }))
    }));

    user.timetable = sanitizedTimetable;
    
    try {
      await user.save();
      console.log('Timetable saved successfully. New record count:', user.timetable.length);
    } catch (saveError) {
      console.error('Mongoose Save Error:', saveError);
      return res.status(400).json({ message: 'Save validation failed', error: saveError.message });
    }

    res.json(user.timetable);
  } catch (err) {
    console.error('General Server Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetable/upload-ocr
// @desc    Upload timetable image and parse via OCR
router.post('/upload-ocr', [auth, upload.single('timetable')], async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Simulate OCR parsing
    const { subjects, timetable } = await parseTimetableImage(req.file.path);

    const user = await User.findById(req.user.id);
    const existingSubjectNames = user.subjects.map(s => s.name.toUpperCase());
    
    // Combine all known subject names to check for base names
    const allKnownSet = new Set([...existingSubjectNames, ...subjects.map(s => s.toUpperCase())]);
    
    // Pre-scan all slots to gather any additional raw subjects
    timetable.forEach(dayEntry => {
      dayEntry.slots.forEach(slot => {
        if (slot.subject) allKnownSet.add(slot.subject.trim().toUpperCase());
      });
    });

    const finalSubjectsSet = new Set();

    timetable.forEach(dayEntry => {
      // 1. Filter out breaks and empty slots
      dayEntry.slots = dayEntry.slots.filter(slot => {
        if (!slot.subject || slot.subject.trim() === '') return false;
        const subUpper = slot.subject.trim().toUpperCase();
        if (subUpper.includes('BREAK') || subUpper === 'LUNCH' || subUpper === 'NA') return false;
        return true;
      });

      // 2. Normalize Lab subjects
      dayEntry.slots.forEach(slot => {
        let sub = slot.subject.trim();
        const subUpper = sub.toUpperCase();
        
        // If subject ends with 'L' and base name exists, map it to base name
        if (subUpper.length > 2 && subUpper.endsWith('L')) {
          const baseName = subUpper.slice(0, -1);
          if (allKnownSet.has(baseName)) {
            sub = baseName;
          }
        }
        
        // Restore correct casing if it matches an existing user subject
        const existingSub = user.subjects.find(s => s.name.toUpperCase() === sub.toUpperCase());
        if (existingSub) {
          sub = existingSub.name;
        }

        slot.subject = sub;
        finalSubjectsSet.add(sub);
      });
    });

    const normalizedSubjects = Array.from(finalSubjectsSet);

    // 1. Clean up unused subjects and add new ones
    const currentSubjectNames = user.subjects.map(s => s.name);
    
    // Remove subjects that have NO attendance data AND are not in the new OCR result
    user.subjects = user.subjects.filter(s => {
      const hasAttendance = s.total > 0 || s.attended > 0 || 
                            s.initialTotal > 0 || s.initialAttended > 0 ||
                            s.odCount > 0 || s.medicalCount > 0 ||
                            (s.attendanceRecords && s.attendanceRecords.length > 0);
      const inNewTimetable = normalizedSubjects.includes(s.name);
      return hasAttendance || inNewTimetable;
    });

    // Refresh current names after cleanup
    const updatedSubjectNames = user.subjects.map(s => s.name);

    normalizedSubjects.forEach(newSubName => {
      if (!updatedSubjectNames.includes(newSubName)) {
        user.subjects.push({
          name: newSubName,
          requiredAttendance: 75,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16)
        });
      }
    });

    await user.save();

    // 2. Prepare the timetable data (map subject names to IDs)
    const subjectMap = {};
    user.subjects.forEach(s => {
      subjectMap[s.name] = s._id;
    });

    // Helper for credits - improved robustness
    const calculateCredit = (timeStr) => {
      try {
        if (!timeStr || !timeStr.includes('-')) return 1;
        
        // Handle various separators like -, to, —
        const parts = timeStr.split(/[-–—to ]+/).filter(p => p.trim());
        if (parts.length < 2) return 1;

        const parseTime = (s) => {
          const match = s.match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/i);
          if (!match) return null;
          let [_, h, m, meridiem] = match;
          h = parseInt(h);
          m = parseInt(m || 0);
          if (meridiem) {
            if (meridiem.toLowerCase() === 'pm' && h < 12) h += 12;
            if (meridiem.toLowerCase() === 'am' && h === 12) h = 0;
          }
          return h * 60 + m;
        };

        const startMins = parseTime(parts[0]);
        const endMins = parseTime(parts[1]);
        
        if (startMins === null || endMins === null) return 1;

        let duration = endMins - startMins;
        if (duration < 0) duration += 12 * 60; // Crosses 12:00
        
        // Standard session is ~50-60 mins. Lab is ~100-120 mins.
        if (duration > 75) return 2;
        return 1;
      } catch(e) {
        console.warn(`[OCR] Credit calculation failed for "${timeStr}":`, e.message);
        return 1;
      }
    };

    const parsedTimetable = timetable.map(dayEntry => ({
      day: dayEntry.day,
      slots: dayEntry.slots.map(slot => ({
        time: slot.time,
        subject: subjectMap[slot.subject],
        credit: calculateCredit(slot.time)
      }))
    }));

    // CRITICAL FIX: Persist the parsed timetable to the database
    user.timetable = parsedTimetable;
    await user.save();
    console.log(`OCR: Persisted ${parsedTimetable.length} days of schedule data for user ${req.user.id}`);

    res.json({
      message: 'OCR parsing successful',
      subjects: user.subjects,
      timetable: parsedTimetable
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
