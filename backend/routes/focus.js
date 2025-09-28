const express = require('express');
const router = express.Router();
const Focus = require('../models/Focus');
const Todo = require('../models/Todo');
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const Trophy = require('../models/Trophy');
const User = require('../models/User');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// Get all focus sessions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let query = { user: req.user.id };
    
    // Apply group filtering if user is in a group
    if (user.currentGroup && user.currentGroup !== 'personal') {
      const group = await Group.findById(user.currentGroup);
      if (group && group.members.includes(req.user.id)) {
        query.user = { $in: group.members };
      }
    }
    
    const focusSessions = await Focus.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(focusSessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create a new focus session
router.post('/', auth, async (req, res) => {
  try {
    const { taskType, taskId, duration } = req.body;

    let taskTitle = '';
    let task = null;

    // Validate task exists and belongs to user
    switch (taskType) {
      case 'todo':
        task = await Todo.findOne({ _id: taskId, createdBy: req.user.id });
        if (task) taskTitle = task.title;
        break;
      case 'goal':
        task = await Goal.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.title;
        break;
      case 'habit':
        task = await Habit.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.name;
        break;
      default:
        return res.status(400).json({ message: 'Invalid task type' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const startTime = new Date(Date.now() - duration * 1000);
    const endTime = new Date();

    const newFocus = new Focus({
      user: req.user.id,
      taskType,
      taskId,
      taskTitle,
      duration,
      startTime,
      endTime
    });

    const focusSession = await newFocus.save();
    
    // Check for new trophies after creating session
    const newTrophies = await checkAndAwardTrophies(req.user.id);
    
    res.json({ focusSession, newTrophies });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create custom focus entry
router.post('/custom', auth, async (req, res) => {
  try {
    const { taskType, taskId, duration, sessionDate, notes } = req.body;

    // Validate session date is not in the future
    const inputDate = new Date(sessionDate);
    const now = new Date();
    if (inputDate > now) {
      return res.status(400).json({ message: 'Cannot add future focus sessions' });
    }

    // Validate duration (max 12 hours)
    if (duration > 43200) {
      return res.status(400).json({ message: 'Maximum session duration is 12 hours' });
    }

    let taskTitle = '';
    let task = null;

    // Validate task exists and belongs to user
    switch (taskType) {
      case 'todo':
        task = await Todo.findOne({ _id: taskId, createdBy: req.user.id });
        if (task) taskTitle = task.title;
        break;
      case 'goal':
        task = await Goal.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.title;
        break;
      case 'habit':
        task = await Habit.findOne({ _id: taskId, user: req.user.id });
        if (task) taskTitle = task.name;
        break;
      default:
        return res.status(400).json({ message: 'Invalid task type' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const startTime = new Date(inputDate.getTime() - duration * 1000);
    const endTime = new Date(inputDate);

    const newFocus = new Focus({
      user: req.user.id,
      taskType,
      taskId,
      taskTitle,
      duration,
      startTime,
      endTime,
      sessionDate: inputDate,
      isCustomEntry: true,
      notes: notes || ''
    });

    const focusSession = await newFocus.save();
    
    // Check for new trophies after creating custom session
    const newTrophies = await checkAndAwardTrophies(req.user.id);
    
    res.json({ focusSession, newTrophies });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get user trophies
router.get('/trophies', auth, async (req, res) => {
  try {
    const trophies = await Trophy.find({ user: req.user.id }).sort({ unlockedAt: -1 });
    res.json(trophies);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get focus statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const user = await User.findById(req.user.id);
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get focus sessions for the period
    const sessions = await Focus.find({
      user: req.user.id,
      sessionDate: { $gte: startDate }
    }).sort({ sessionDate: -1 });

    // Calculate statistics
    const stats = calculateDetailedStats(sessions);
    
    // Get group stats if user is in a group
    let groupStats = null;
    if (user.currentGroup && user.currentGroup !== 'personal') {
      groupStats = await getGroupStats(user.currentGroup, startDate);
    }

    res.json({
      personalStats: stats,
      groupStats,
      period
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get group leaderboard
router.get('/leaderboard/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { period = 'weekly' } = req.query;
    
    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.some(memberId => memberId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied to group' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    // Get all group members' focus sessions
    const leaderboard = await generateGroupLeaderboard(group.members, startDate);
    
    res.json(leaderboard);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Helper function to check and award trophies
async function checkAndAwardTrophies(userId) {
  try {
    const sessions = await Focus.find({ user: userId });
    const trophies = await Trophy.find({ user: userId });
    const existingTrophyIds = new Set(trophies.map(t => t.trophyId));
    
    const newTrophies = [];
    
    // Check each trophy definition
    for (const [trophyId, definition] of Object.entries(Trophy.TROPHY_DEFINITIONS)) {
      if (existingTrophyIds.has(trophyId)) continue;
      
      let earned = false;
      
      switch (definition.category) {
        case 'focus':
          earned = checkFocusTrophies(sessions, trophyId, definition);
          break;
        case 'goal':
          earned = checkGoalTrophies(sessions, trophyId, definition);
          break;
        case 'habit':
          earned = await checkHabitTrophies(sessions, trophyId, definition);
          break;
        case 'todo':
          earned = await checkTodoTrophies(userId, sessions, trophyId, definition);
          break;
      }
      
      if (earned) {
        const trophy = new Trophy({
          user: userId,
          trophyId,
          trophyName: definition.name,
          trophyDescription: definition.description,
          trophyIcon: definition.icon,
          category: definition.category,
          tier: definition.tier,
          value: definition.threshold
        });
        
        await trophy.save();
        newTrophies.push(trophy);
      }
    }
    
    return newTrophies;
  } catch (error) {
    console.error('Error checking trophies:', error);
    return [];
  }
}

// Trophy checking functions
function checkFocusTrophies(sessions, trophyId, definition) {
  switch (trophyId) {
    case 'focus_newbie':
      return sessions.length >= 1;
    case 'focus_warrior':
      return sessions.length >= 10;
    case 'focus_master':
      return sessions.length >= 100;
    case 'focus_legend':
      return sessions.length >= 1000;
    case 'focus_marathon':
      return sessions.some(s => s.duration >= 14400); // 4 hours
    case 'focus_speed':
      // Check if user had 10 sessions in one day
      const sessionsByDate = {};
      sessions.forEach(s => {
        const date = s.sessionDate.toDateString();
        sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
      });
      return Object.values(sessionsByDate).some(count => count >= 10);
    default:
      return false;
  }
}

function checkGoalTrophies(sessions, trophyId, definition) {
  const goalSessions = sessions.filter(s => s.taskType === 'goal');
  const totalGoalTime = goalSessions.reduce((sum, s) => sum + s.duration, 0);
  
  switch (trophyId) {
    case 'goal_bronze':
    case 'goal_silver':
    case 'goal_gold':
    case 'goal_diamond':
    case 'goal_legendary':
      return totalGoalTime >= definition.threshold;
    case 'goal_perfectionist':
      // Check if user spent 10+ hours on a single goal
      const goalTimeByTask = {};
      goalSessions.forEach(s => {
        goalTimeByTask[s.taskId] = (goalTimeByTask[s.taskId] || 0) + s.duration;
      });
      return Object.values(goalTimeByTask).some(time => time >= 36000);
    case 'goal_sprint':
      // Check if user spent 3+ hours on goals in one day
      const goalTimeByDate = {};
      goalSessions.forEach(s => {
        const date = s.sessionDate.toDateString();
        goalTimeByDate[date] = (goalTimeByDate[date] || 0) + s.duration;
      });
      return Object.values(goalTimeByDate).some(time => time >= 10800);
    default:
      return false;
  }
}

async function checkHabitTrophies(sessions, trophyId, definition) {
  const habitSessions = sessions.filter(s => s.taskType === 'habit');
  
  switch (trophyId) {
    case 'habit_starter':
    case 'habit_builder':
    case 'habit_master':
    case 'habit_legend':
    case 'habit_perfectionist':
      // Calculate habit focus streak
      const streak = calculateHabitStreak(habitSessions);
      return streak >= definition.threshold;
    case 'habit_consistency':
      // Check for 5 consecutive days with habit focus
      return calculateConsecutiveDays(habitSessions) >= 5;
    case 'habit_lightning':
      // Check if user focused on 3+ different habits in one day
      const habitsByDate = {};
      habitSessions.forEach(s => {
        const date = s.sessionDate.toDateString();
        if (!habitsByDate[date]) habitsByDate[date] = new Set();
        habitsByDate[date].add(s.taskId.toString());
      });
      return Object.values(habitsByDate).some(habits => habits.size >= 3);
    default:
      return false;
  }
}

async function checkTodoTrophies(userId, sessions, trophyId, definition) {
  // For todo trophies, we need to check completed todos after focus sessions
  const todoSessions = sessions.filter(s => s.taskType === 'todo');
  const todoIds = todoSessions.map(s => s.taskId);
  
  const completedTodos = await Todo.find({
    _id: { $in: todoIds },
    createdBy: userId,
    completed: true
  });
  
  switch (trophyId) {
    case 'todo_starter':
    case 'todo_crusher':
    case 'todo_master':
    case 'todo_legend':
      return completedTodos.length >= definition.threshold;
    case 'todo_perfectionist':
      // 100% completion rate with 20+ focused todos
      return todoSessions.length >= 20 && completedTodos.length === todoSessions.length;
    case 'todo_sprint':
      // Check if user completed 10 todos in one day after focus
      const completionsByDate = {};
      completedTodos.forEach(todo => {
        if (todo.completedAt) {
          const date = todo.completedAt.toDateString();
          completionsByDate[date] = (completionsByDate[date] || 0) + 1;
        }
      });
      return Object.values(completionsByDate).some(count => count >= 10);
    case 'todo_priority':
      const highPriorityCompleted = completedTodos.filter(t => t.priority === 'high');
      return highPriorityCompleted.length >= 50;
    default:
      return false;
  }
}

// Helper functions
function calculateHabitStreak(habitSessions) {
  if (habitSessions.length === 0) return 0;
  
  const dates = [...new Set(habitSessions.map(s => s.sessionDate.toDateString()))].sort();
  let streak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
  }
  
  return maxStreak;
}

function calculateConsecutiveDays(sessions) {
  if (sessions.length === 0) return 0;
  
  const dates = [...new Set(sessions.map(s => s.sessionDate.toDateString()))].sort();
  let consecutive = 1;
  let maxConsecutive = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 1;
    }
  }
  
  return maxConsecutive;
}

function calculateDetailedStats(sessions) {
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const sessionsByType = {
    todo: sessions.filter(s => s.taskType === 'todo'),
    goal: sessions.filter(s => s.taskType === 'goal'),
    habit: sessions.filter(s => s.taskType === 'habit')
  };
  
  return {
    totalTime,
    totalSessions: sessions.length,
    averageSession: sessions.length > 0 ? Math.round(totalTime / sessions.length) : 0,
    longestSession: sessions.length > 0 ? Math.max(...sessions.map(s => s.duration)) : 0,
    todoTime: sessionsByType.todo.reduce((sum, s) => sum + s.duration, 0),
    goalTime: sessionsByType.goal.reduce((sum, s) => sum + s.duration, 0),
    habitTime: sessionsByType.habit.reduce((sum, s) => sum + s.duration, 0),
    todoSessions: sessionsByType.todo.length,
    goalSessions: sessionsByType.goal.length,
    habitSessions: sessionsByType.habit.length
  };
}

async function getGroupStats(groupId, startDate) {
  const group = await Group.findById(groupId).populate('members', 'name');
  const sessions = await Focus.find({
    user: { $in: group.members.map(m => m._id) },
    sessionDate: { $gte: startDate }
  });
  
  return calculateDetailedStats(sessions);
}

async function generateGroupLeaderboard(memberIds, startDate) {
  const leaderboard = [];
  
  for (const memberId of memberIds) {
    const user = await User.findById(memberId);
    const sessions = await Focus.find({
      user: memberId,
      sessionDate: { $gte: startDate }
    });
    
    const stats = calculateDetailedStats(sessions);
    const trophies = await Trophy.find({ user: memberId });
    
    leaderboard.push({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      stats,
      trophyCount: trophies.length,
      rank: 0 // Will be calculated after sorting
    });
  }
  
  // Sort by total time and assign ranks
  leaderboard.sort((a, b) => b.stats.totalTime - a.stats.totalTime);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return leaderboard;
}

module.exports = router;
