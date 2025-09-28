const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// Get all habits (filtered by current group context)
router.get('/', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('joinedGroups');
    const { members } = req.query; // Optional member filter for group views
    
    let query = {};
    
    if (user.currentGroup === 'personal') {
      // Personal view - only user's own habits
      query.user = req.user.id;
    } else {
      // Group view - habits from all group members
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
    
    const habits = await Habit.find(query).populate('user', 'name email').sort({ createdAt: -1 });

    // Calculate current streaks for all habits
    habits.forEach(habit => {
      habit.calculateStreak();
    });

    res.json(habits);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create a new habit
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, frequency } = req.body;

    const newHabit = new Habit({
      user: req.user.id,
      name,
      description,
      frequency
    });

    const habit = await newHabit.save();
    res.json(habit);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Check in to a habit (mark as completed for today) or undo check-in
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    let habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Make sure user owns habit
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    if (habit.isCheckedInToday()) {
      // Remove today's check-in (undo)
      habit.checkIns = habit.checkIns.filter(checkIn => {
        const checkInDate = new Date(checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate.getTime() !== today.getTime();
      });
      habit.calculateStreak();
      await habit.save();
      res.json(habit);
    } else {
      // Add today's check-in
      habit.checkIns.push(new Date());
      habit.calculateStreak();
      await habit.save();
      res.json(habit);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Update a habit
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, frequency, status } = req.body;

    let habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Make sure user owns habit
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    habit.name = name || habit.name;
    habit.description = description || habit.description;
    habit.frequency = frequency || habit.frequency;
    habit.status = status || habit.status;

    habit.calculateStreak();
    await habit.save();

    res.json(habit);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete a habit
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Make sure user owns habit
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Habit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Habit removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
