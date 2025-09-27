const express = require('express');
const Todo = require('../models/Todo');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all todos
router.get('/', auth, async (req, res) => {
  try {
    const todos = await Todo.find().populate('createdBy', 'name email').populate('assignedTo', 'name email');
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get todos by user
router.get('/my-todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ]
    }).populate('createdBy', 'name email').populate('assignedTo', 'name email');

    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Create new todo
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, category } = req.body;

    const todo = new Todo({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo,
      category,
      createdBy: req.user.id
    });

    await todo.save();
    await todo.populate('createdBy', 'name email');
    if (assignedTo) {
      await todo.populate('assignedTo', 'name email');
    }

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update todo
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert dueDate string to Date object if present
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const todo = await Todo.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').populate('assignedTo', 'name email');

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle todo completion
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    await todo.save();
    await todo.populate('createdBy', 'name email');
    if (todo.assignedTo) {
      await todo.populate('assignedTo', 'name email');
    }

    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete todo
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
