const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/exams
// @desc    Get all user exams/assignments
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.exams || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/exams
// @desc    Add a new exam/assignment
router.post('/', auth, async (req, res) => {
  const { name, date, type, subjectId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.exams.push({ name, date, type, subject: subjectId });
    await user.save();
    res.json(user.exams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/exams/:id
// @desc    Delete an exam/assignment
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.exams = user.exams.filter(e => e._id.toString() !== req.params.id);
    await user.save();
    res.json(user.exams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
