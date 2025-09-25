const express = require('express');
const jwt = require('jsonwebtoken');
const Calendar = require('../models/Calendar');
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

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Calendar.find().populate('createdBy', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get events by date range
router.get('/range/:start/:end', auth, async (req, res) => {
  try {
    const { start, end } = req.params;
    const events = await Calendar.find({
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    }).populate('createdBy', 'name email');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, color, isAllDay } = req.body;

    const event = new Calendar({
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      color,
      isAllDay,
      createdBy: req.userId
    });

    await event.save();
    await event.populate('createdBy', 'name email');

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert date string to Date object if present
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const event = await Calendar.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Calendar.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
