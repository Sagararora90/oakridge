const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

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
    user.holidays.id(req.params.id).deleteOne();
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
    user.extraClasses.id(req.params.id).deleteOne();
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

module.exports = router;
