const mongoose = require('mongoose');

const trophySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trophyId: {
    type: String,
    required: true
  },
  trophyName: {
    type: String,
    required: true
  },
  trophyDescription: {
    type: String,
    required: true
  },
  trophyIcon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['goal', 'habit', 'todo', 'focus', 'streak'],
    required: true
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'],
    required: true
  },
  value: {
    type: Number,
    required: true // The achievement value (hours, count, streak days, etc.)
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate trophies
trophySchema.index({ user: 1, trophyId: 1 }, { unique: true });

// Trophy definitions
const TROPHY_DEFINITIONS = {
  // Goal Trophies (Time-based)
  'goal_bronze': { name: 'Bronze Goal Grinder', description: '1 hour focused on goals', icon: '🥉', category: 'goal', tier: 'bronze', threshold: 3600 },
  'goal_silver': { name: 'Silver Goal Crusher', description: '5 hours focused on goals', icon: '🥈', category: 'goal', tier: 'silver', threshold: 18000 },
  'goal_gold': { name: 'Gold Goal Master', description: '25 hours focused on goals', icon: '🥇', category: 'goal', tier: 'gold', threshold: 90000 },
  'goal_diamond': { name: 'Diamond Goal Legend', description: '100 hours focused on goals', icon: '💎', category: 'goal', tier: 'diamond', threshold: 360000 },
  'goal_legendary': { name: 'Goal Titan', description: '500 hours focused on goals', icon: '🏆', category: 'goal', tier: 'legendary', threshold: 1800000 },
  'goal_perfectionist': { name: 'Goal Perfectionist', description: '10+ hours on single goal', icon: '⭐', category: 'goal', tier: 'gold', threshold: 36000 },
  'goal_sprint': { name: 'Goal Sprint', description: '3+ hours in one day on goals', icon: '🔥', category: 'goal', tier: 'silver', threshold: 10800 },

  // Habit Trophies (Streak-based)
  'habit_starter': { name: 'Habit Starter', description: '3-day focus streak on habits', icon: '🌱', category: 'habit', tier: 'bronze', threshold: 3 },
  'habit_builder': { name: 'Habit Builder', description: '7-day focus streak on habits', icon: '🌿', category: 'habit', tier: 'silver', threshold: 7 },
  'habit_master': { name: 'Habit Master', description: '30-day focus streak on habits', icon: '🌳', category: 'habit', tier: 'gold', threshold: 30 },
  'habit_legend': { name: 'Habit Legend', description: '100-day focus streak on habits', icon: '🏔️', category: 'habit', tier: 'diamond', threshold: 100 },
  'habit_perfectionist': { name: 'Habit Perfectionist', description: '365-day focus streak on habits', icon: '🌟', category: 'habit', tier: 'legendary', threshold: 365 },
  'habit_consistency': { name: 'Habit Consistency', description: 'Focus on habits 5 days in a row', icon: '🔥', category: 'habit', tier: 'silver', threshold: 5 },
  'habit_lightning': { name: 'Habit Lightning', description: 'Focus on 3+ different habits in one day', icon: '⚡', category: 'habit', tier: 'gold', threshold: 3 },

  // Todo Trophies (Completion-based)
  'todo_starter': { name: 'Task Starter', description: 'Complete 5 todos after focus sessions', icon: '✅', category: 'todo', tier: 'bronze', threshold: 5 },
  'todo_crusher': { name: 'Task Crusher', description: 'Complete 25 todos after focus sessions', icon: '📝', category: 'todo', tier: 'silver', threshold: 25 },
  'todo_master': { name: 'Task Master', description: 'Complete 100 todos after focus sessions', icon: '🎯', category: 'todo', tier: 'gold', threshold: 100 },
  'todo_legend': { name: 'Task Legend', description: 'Complete 500 todos after focus sessions', icon: '💪', category: 'todo', tier: 'diamond', threshold: 500 },
  'todo_perfectionist': { name: 'Task Perfectionist', description: '100% completion rate (20+ focused todos)', icon: '🏆', category: 'todo', tier: 'legendary', threshold: 20 },
  'todo_sprint': { name: 'Task Sprint', description: 'Complete 10 todos in one day after focus', icon: '🚀', category: 'todo', tier: 'gold', threshold: 10 },
  'todo_priority': { name: 'Priority Master', description: 'Complete 50 high-priority todos after focus', icon: '⭐', category: 'todo', tier: 'diamond', threshold: 50 },

  // Universal Focus Trophies
  'focus_newbie': { name: 'Focus Newbie', description: 'First focus session', icon: '⏰', category: 'focus', tier: 'bronze', threshold: 1 },
  'focus_warrior': { name: 'Focus Warrior', description: '10 total focus sessions', icon: '🎯', category: 'focus', tier: 'silver', threshold: 10 },
  'focus_master': { name: 'Focus Master', description: '100 total focus sessions', icon: '🔥', category: 'focus', tier: 'gold', threshold: 100 },
  'focus_legend': { name: 'Focus Legend', description: '1000 total focus sessions', icon: '💎', category: 'focus', tier: 'diamond', threshold: 1000 },
  'focus_marathon': { name: 'Marathon Focuser', description: 'Single 4+ hour session', icon: '🏆', category: 'focus', tier: 'legendary', threshold: 14400 },
  'focus_speed': { name: 'Speed Focuser', description: '10 sessions in one day', icon: '⚡', category: 'focus', tier: 'gold', threshold: 10 }
};

trophySchema.statics.TROPHY_DEFINITIONS = TROPHY_DEFINITIONS;

module.exports = mongoose.model('Trophy', trophySchema);
