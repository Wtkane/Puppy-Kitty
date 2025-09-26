const mongoose = require('mongoose');

const specialDatesSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['birthday', 'anniversary', 'holiday', 'reminder', 'other'],
    default: 'other'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['yearly', 'monthly', 'weekly', 'daily'],
    required: function() {
      return this.isRecurring;
    }
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
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8',
      '#4285f4', '#34a853', '#fbbc05', '#ea4335', '#9c27b0', '#00acc1', '#ff7043', '#8bc34a',
      '#ff9800', '#e91e63', '#3f51b5', '#009688', '#ffc107', '#795548', '#607d8b'
    ]
  },
  notificationEnabled: {
    type: Boolean,
    default: false
  },
  notificationDaysBefore: {
    type: Number,
    default: 1,
    min: 0,
    max: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
specialDatesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SpecialDates', specialDatesSchema);
