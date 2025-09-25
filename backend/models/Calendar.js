const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: '#ff6b6b',
    enum: [
      // Custom colors
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8',
      // Google Calendar colors
      '#4285f4', '#34a853', '#fbbc05', '#ea4335', '#9c27b0', '#00acc1', '#ff7043', '#8bc34a',
      '#ff9800', '#e91e63', '#3f51b5', '#009688', '#ffc107', '#795548', '#607d8b'
    ]
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Calendar', calendarSchema);
