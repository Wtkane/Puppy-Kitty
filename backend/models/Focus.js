const mongoose = require('mongoose');

const focusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskType: {
    type: String,
    enum: ['todo', 'goal', 'habit'],
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  taskTitle: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: Date.now
  },
  isCustomEntry: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  sessionDate: {
    type: Date,
    default: Date.now // For custom entries, this can be different from createdAt
  }
}, {
  timestamps: true
});

// Index for efficient queries
focusSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Focus', focusSchema);
