const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['personal', 'health', 'career', 'financial', 'education', 'relationships', 'other'],
    default: 'personal'
  },
  targetValue: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate progress percentage
goalSchema.methods.getProgressPercentage = function() {
  if (this.targetValue === 0) return 0;
  return Math.min((this.currentValue / this.targetValue) * 100, 100);
};

// Check if goal is completed
goalSchema.methods.isCompleted = function() {
  return this.currentValue >= this.targetValue;
};

module.exports = mongoose.model('Goal', goalSchema);
