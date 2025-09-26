const express = require('express');
const jwt = require('jsonwebtoken');
const Todo = require('../models/Todo');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puppykittysecret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

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
        { createdBy: req.userId },
        { assignedTo: req.userId }
      ]
    }).populate('createdBy', 'name email').populate('assignedTo', 'name email');

    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all todos grouped by user
router.get('/grouped-by-user', auth, async (req, res) => {
  try {
    const todos = await Todo.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort([
        // Sort by completion status (incomplete first)
        ['completed', 1],
        // Then by due date (urgent/overdue first, then by earliest due date)
        ['dueDate', 1],
        // Finally by creation date (newest first)
        ['createdAt', -1]
      ]);

    // Group todos by user (both creators and assignees)
    const userGroups = {};

    todos.forEach(todo => {
      // Add todo to creator's group
      const creatorId = todo.createdBy._id.toString();
      if (!userGroups[creatorId]) {
        userGroups[creatorId] = {
          user: todo.createdBy,
          todos: []
        };
      }
      userGroups[creatorId].todos.push(todo);

      // Add todo to assignee's group if different from creator
      if (todo.assignedTo && todo.assignedTo._id.toString() !== creatorId) {
        const assigneeId = todo.assignedTo._id.toString();
        if (!userGroups[assigneeId]) {
          userGroups[assigneeId] = {
            user: todo.assignedTo,
            todos: []
          };
        }
        userGroups[assigneeId].todos.push(todo);
      }
    });

    // Convert to array and sort by user name
    const groupedTodos = Object.values(userGroups).sort((a, b) =>
      a.user.name.localeCompare(b.user.name)
    );

    res.json(groupedTodos);
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
      createdBy: req.userId
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
