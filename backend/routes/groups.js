const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// @route   POST api/groups
// @desc    Create a new group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newGroup = new Group({
      name,
      description,
      inviteCode,
      creator: req.user.id,
      members: [req.user.id]
    });

    await newGroup.save();
    res.json(newGroup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/groups/join
// @desc    Join a group via invite code
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const group = await Group.findOne({ inviteCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found with this code' });
    }

    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    group.members.push(req.user.id);
    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/groups
// @desc    Get user's groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'name email')
      .populate('creator', 'name');
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/groups/:groupId/leaderboard
// @desc    Get group leaderboard
router.get('/:groupId/leaderboard', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name subjects');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const leaderboard = group.members.map(member => {
      const totalAttended = member.subjects.reduce((a, s) => a + s.attended, 0);
      const totalClasses = member.subjects.reduce((a, s) => a + s.total, 0);
      const score = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
      
      return {
        id: member._id,
        name: member.name,
        score: Math.round(score * 10) / 10
      };
    }).sort((a, b) => b.score - a.score);

    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
