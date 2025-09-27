const express = require('express');
const router = express.Router();
const Focus = require('../models/Focus');
const Todo = require('../models/Todo');
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// Get all focus sessions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const focusSessions = await Focus.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 sessions
    res.json(focusSessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create a new focus session
router.post('/', auth, async (req, res) => {
  try {
    const { taskType, taskId, duration } = req.body;

    let taskTitle = '';
    let task = null;

    // Validate task exists and belongs to user
    switch (taskType) {
      case 'todo':
        task = await Todo.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.title;
        break;
      case 'goal':
        task = await Goal.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.title;
        break;
      case 'habit':
        task = await Habit.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.title;
        break;
      default:
        return res.status(400).json({ message: 'Invalid task type' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const startTime = new Date(Date.now() - duration * 1000); // Calculate start time
    const endTime = new Date();

    const newFocus = new Focus({
      user: req.user.id,
      taskType,
      taskId,
      taskTitle,
      duration,
      startTime,
      endTime
    });

    const focusSession = await newFocus.save();
    res.json(focusSession);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
