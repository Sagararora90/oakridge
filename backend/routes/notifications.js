const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/notifications
// @desc    Get user notifications and auto-generate new ones
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // --- AUTO-GENERATION LOGIC ---
    let newNotifications = [];

    // 1. Check for low attendance (below 75%)
    user.subjects.forEach(sub => {
      const pct = sub.total > 0 ? (sub.attended / sub.total) * 100 : 100;
      if (pct < 75) {
        const title = `Low Attendance: ${sub.name}`;
        // Check if a similar unread notification exists for this subject to avoid spamming
        const exists = user.notifications.some(n => n.title === title && !n.read);
        if (!exists) {
          newNotifications.push({
            title,
            message: `Your attendance in ${sub.name} is ${pct.toFixed(1)}%. It's strictly below the 75% requirement.`,
            type: 'Attendance'
          });
        }
      }
    });

    // 2. Check for upcoming exams (within 3 days)
    const today = new Date();
    user.exams.forEach(exam => {
      const examDate = new Date(exam.date);
      const diffTime = examDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 3) {
        const title = `Upcoming Assessment: ${exam.name}`;
        const exists = user.notifications.some(n => n.title === title && !n.read);
        if (!exists) {
            newNotifications.push({
              title,
              message: `Your ${exam.type} "${exam.name}" is scheduled for ${examDate.toLocaleDateString()}. ${diffDays === 0 ? 'It is TODAY!' : `In ${diffDays} days.`}`,
              type: 'Exam'
            });
        }
      }
    });

    if (newNotifications.length > 0) {
      user.notifications.push(...newNotifications);
      await user.save();
    }

    // Return notifications sorted by newest
    const sorted = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
    res.json(sorted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.notifications.forEach(n => n.read = true);
        await user.save();
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
