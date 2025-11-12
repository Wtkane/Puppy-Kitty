const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// Get all goals (filtered by current group context)
router.get('/', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('joinedGroups');
    const { members } = req.query; // Optional member filter for group views
    
    let query = {};
    
    if (user.currentGroup === 'personal') {
      // Personal view - only user's own goals
      query.user = req.user.id;
    } else {
      // Group view - goals from all group members
      const Group = require('../models/Group');
      const group = await Group.findById(user.currentGroup);
      
      if (!group || !group.members.some(memberId => memberId.toString() === req.user.id)) {
        return res.status(403).json({ message: 'Access denied to group' });
      }
      
      let memberIds = group.members;
      
      // Apply member filter if provided
      if (members) {
        const selectedMembers = members.split(',');
        memberIds = memberIds.filter(id => selectedMembers.includes(id.toString()));
      }
      
      query.user = { $in: memberIds };
    }
    
    const goals = await Goal.find(query).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating goal with data:', req.body);
    console.log('User ID:', req.user.id);

    const {
      title,
      description,
      category,
      targetValue,
      currentValue,
      unit,
      deadline,
      priority
    } = req.body;

    // Parse deadline as local date to avoid timezone issues
    let parsedDeadline = null;
    if (deadline) {
      const [year, month, day] = deadline.split('-').map(Number);
      parsedDeadline = new Date(year, month - 1, day);
    }

    const newGoal = new Goal({
      user: req.user.id,
      title,
      description,
      category,
      targetValue,
      currentValue,
      unit,
      deadline: parsedDeadline,
      priority
    });

    console.log('New goal object:', newGoal);
    const goal = await newGoal.save();
    console.log('Goal saved successfully:', goal);
    res.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error.message);
    console.error('Full error:', error);
    res.status(500).send('Server error');
  }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
  try {
    const { currentValue } = req.body;

    let goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Make sure user owns goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    goal.currentValue = currentValue;
    goal = await goal.save();

    res.json(goal);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Make sure user owns goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
