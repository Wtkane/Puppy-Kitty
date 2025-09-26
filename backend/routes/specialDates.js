const express = require('express');
const jwt = require('jsonwebtoken');
const SpecialDates = require('../models/SpecialDates');
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

// Get all special dates
router.get('/', auth, async (req, res) => {
  try {
    const specialDates = await SpecialDates.find({ createdBy: req.userId })
      .populate('createdBy', 'name email')
      .sort({ date: 1 }); // Sort by date ascending

    res.json(specialDates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get special dates by date range
router.get('/range/:start/:end', auth, async (req, res) => {
  try {
    const { start, end } = req.params;
    const specialDates = await SpecialDates.find({
      createdBy: req.userId,
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json(specialDates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get special dates by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const specialDates = await SpecialDates.find({
      createdBy: req.userId,
      type: type
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json(specialDates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new special date
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      type,
      isRecurring,
      recurringType,
      color,
      notificationEnabled,
      notificationDaysBefore
    } = req.body;

    // Ensure date is stored as UTC to avoid timezone issues
    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const specialDate = new SpecialDates({
      title,
      description,
      date: dateObj,
      type,
      isRecurring,
      recurringType,
      color,
      notificationEnabled,
      notificationDaysBefore,
      createdBy: req.userId
    });

    await specialDate.save();
    await specialDate.populate('createdBy', 'name email');

    res.status(201).json(specialDate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update special date
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert date string to Date object if present
    if (updates.date) {
      updates.date = new Date(updates.date);
      updates.date.setUTCHours(0, 0, 0, 0);
    }

    const specialDate = await SpecialDates.findOneAndUpdate(
      { _id: id, createdBy: req.userId },
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!specialDate) {
      return res.status(404).json({ message: 'Special date not found' });
    }

    res.json(specialDate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete special date
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const specialDate = await SpecialDates.findOneAndDelete({
      _id: id,
      createdBy: req.userId
    });

    if (!specialDate) {
      return res.status(404).json({ message: 'Special date not found' });
    }

    res.json({ message: 'Special date deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all special dates for the current user
router.delete('/', auth, async (req, res) => {
  try {
    const result = await SpecialDates.deleteMany({ createdBy: req.userId });

    res.json({
      message: 'All special dates cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming special dates (next 30 days)
router.get('/upcoming/all', auth, async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const specialDates = await SpecialDates.find({
      createdBy: req.userId,
      date: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json(specialDates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get today's special dates
router.get('/today/all', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const specialDates = await SpecialDates.find({
      createdBy: req.userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json(specialDates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
