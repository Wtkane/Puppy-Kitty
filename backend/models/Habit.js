const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  checkIns: [{
    type: Date,
    default: []
  }],
  streak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate current streak
habitSchema.methods.calculateStreak = function() {
  if (this.checkIns.length === 0) {
    this.streak = 0;
    return 0;
  }

  const sortedCheckIns = this.checkIns.sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if checked in today
  const lastCheckIn = new Date(sortedCheckIns[0]);
  lastCheckIn.setHours(0, 0, 0, 0);

  if (lastCheckIn.getTime() !== today.getTime()) {
    // Not checked in today, streak is 0
    this.streak = 0;
    return 0;
  }

  // Count consecutive days
  let currentDate = new Date(today);
  for (let i = 0; i < sortedCheckIns.length; i++) {
    const checkInDate = new Date(sortedCheckIns[i]);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkInDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  this.streak = streak;
  if (streak > this.longestStreak) {
    this.longestStreak = streak;
  }
  return streak;
};

// Check if habit was completed today
habitSchema.methods.isCheckedInToday = function() {
  if (this.checkIns.length === 0) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.checkIns.some(checkIn => {
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === today.getTime();
  });
};

module.exports = mongoose.model('Habit', habitSchema);
