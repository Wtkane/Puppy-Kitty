const express = require('express');
const Todo = require('../models/Todo');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all todos (filtered by current group context)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('joinedGroups');
    const { members } = req.query; // Optional member filter for group views
    
    let query = {};
    
    if (user.currentGroup === 'personal') {
      // Personal view - only user's own todos
      query.createdBy = req.user.id;
    } else {
      // Group view - todos from all group members
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
      
      query.createdBy = { $in: memberIds };
    }
    
    const todos = await Todo.find(query).populate('createdBy', 'name email').populate('assignedTo', 'name email');
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

// Get todos grouped by user
router.get('/grouped-by-user', auth, async (req, res) => {
  try {
    const todos = await Todo.find().populate('createdBy', 'name email').populate('assignedTo', 'name email');

    // Group todos by user
    const groupedTodos = {};
    todos.forEach(todo => {
      const userId = todo.createdBy._id.toString();
      if (!groupedTodos[userId]) {
        groupedTodos[userId] = {
          user: todo.createdBy,
          todos: []
        };
      }
      groupedTodos[userId].todos.push(todo);
    });

    const result = Object.values(groupedTodos);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Create new todo
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, category } = req.body;

    // Parse date as local date time
    let parsedDueDate = null;
    if (dueDate) {
      const [year, month, day] = dueDate.split('-').map(Number);
      parsedDueDate = new Date(year, month - 1, day);
    }

    const todo = new Todo({
      title,
      description,
      priority,
      dueDate: parsedDueDate,
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

    // Convert dueDate string to Date object if present, parsing as local date time
    if (updates.dueDate) {
      const [year, month, day] = updates.dueDate.split('-').map(Number);
      updates.dueDate = new Date(year, month - 1, day);
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
