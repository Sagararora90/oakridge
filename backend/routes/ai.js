const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { generateDailyBriefing } = require('../services/ocrService');

// @route   GET api/ai/brief
// @desc    Get AI-generated daily briefing
router.get('/brief', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const briefing = await generateDailyBriefing(user);
    res.json({ briefing });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
