import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Focus.css';

const Focus = ({ user }) => {
  const [tasks, setTasks] = useState({ todos: [], goals: [], habits: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskType, setTaskType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todo');
  const [timerMode, setTimerMode] = useState('countdown');
  const [duration, setDuration] = useState(25);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [focusSessions, setFocusSessions] = useState([]);
  const [currentView, setCurrentView] = useState('timer');
  const [statsPeriod, setStatsPeriod] = useState('weekly');
  const [completionMessage, setCompletionMessage] = useState('');
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  
  // New state for enhanced features
  const [trophies, setTrophies] = useState([]);
  const [showCustomEntry, setShowCustomEntry] = useState(false);
  const [showTrophyModal, setShowTrophyModal] = useState(false);
  const [newTrophies, setNewTrophies] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [customEntryForm, setCustomEntryForm] = useState({
    taskType: 'todo',
    taskId: '',
    duration: 1800, // 30 minutes default
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '09:00', // Default start time
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (timerMode === 'countdown') {
          setElapsedTime(time => {
            const newTime = time + 1;
            const targetSeconds = duration * 60;
            if (newTime >= targetSeconds) {
              setIsRunning(false);
              handleTimerComplete(targetSeconds);
              return targetSeconds;
            }
            return newTime;
          });
        } else {
          setElapsedTime(time => time + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, duration, taskType, selectedTask]);

  const fetchData = async () => {
    try {
      const [todosRes, goalsRes, habitsRes, focusRes, trophiesRes] = await Promise.all([
        axios.get('/api/todos'),
        axios.get('/api/goals'),
        axios.get('/api/habits'),
        axios.get('/api/focus'),
        axios.get('/api/focus/trophies')
      ]);
      
      setTasks({
        todos: todosRes.data.filter(todo => !todo.completed) || [],
        goals: goalsRes.data.filter(goal => !goal.completed) || [],
        habits: habitsRes.data || []
      });
      setFocusSessions(focusRes.data || []);
      setTrophies(trophiesRes.data || []);
      
      // Fetch stats and leaderboard
      await fetchStats();
      if (user.currentGroup && user.currentGroup !== 'personal') {
        await fetchLeaderboard();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/focus/stats?period=${statsPeriod}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (user.currentGroup && user.currentGroup !== 'personal') {
        const response = await axios.get(`/api/focus/leaderboard/${user.currentGroup}?period=${statsPeriod}`);
        setLeaderboard(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleTimerComplete = async (focusedTime) => {
    try {
      const response = await axios.post('/api/focus', {
        taskType,
        taskId: selectedTask._id,
        duration: focusedTime
      });
      
      if (response.data.newTrophies && response.data.newTrophies.length > 0) {
        setNewTrophies(response.data.newTrophies);
        setShowTrophyModal(true);
        setTrophies(prev => [...response.data.newTrophies, ...prev]);
      }
      
      await fetchData();
      setCompletionMessage(`🎉 Focus session completed! You focused for ${formatTime(focusedTime)}.`);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 5000);
    } catch (error) {
      console.error('Error recording focus session:', error);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/focus/custom', {
        ...customEntryForm,
        duration: customEntryForm.duration
      });
      
      if (response.data.newTrophies && response.data.newTrophies.length > 0) {
        setNewTrophies(response.data.newTrophies);
        setShowTrophyModal(true);
        setTrophies(prev => [...response.data.newTrophies, ...prev]);
      }
      
      setShowCustomEntry(false);
      setCustomEntryForm({
        taskType: 'todo',
        taskId: '',
        duration: 1800,
        sessionDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        notes: ''
      });
      await fetchData();
      
      setCompletionMessage('✅ Custom focus session added successfully!');
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 3000);
    } catch (error) {
      console.error('Error adding custom entry:', error);
      setCompletionMessage('❌ Error adding custom session');
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 3000);
    }
  };

  const handleTaskSelect = (task, type) => {
    setSelectedTask(task);
    setTaskType(type);
  };

  const startTimer = () => {
    if (!selectedTask) return;
    setElapsedTime(0);
    setIsRunning(true);
  };

  const stopTimer = async () => {
    setIsRunning(false);
    if (timerMode === 'countup') {
      await handleTimerComplete(elapsedTime);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (isRunning || elapsedTime > 0) {
      const focusedTime = elapsedTime;
      const minutes = Math.floor(focusedTime / 60);
      const message = `You focused ${minutes} minute${minutes !== 1 ? 's' : ''} on ${selectedTask?.title || selectedTask?.name}. Good job! 🎉`;
      setCompletionMessage(message);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 5000);
    }

    setIsRunning(false);
    setElapsedTime(0);
    setSelectedTask(null);
    setTaskType('');
  };

  const handleTimeClick = () => {
    if (timerMode === 'countdown' && !isRunning) {
      setIsEditingTime(true);
      const totalMinutes = duration;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setHoursInput(hours.toString());
      setMinutesInput(minutes.toString());
    }
  };

  const handleHoursChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 2)) {
      setHoursInput(value);
    }
  };

  const handleMinutesChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
      setMinutesInput(value);
    }
  };

  const saveTimeInput = () => {
    const hours = parseInt(hoursInput) || 0;
    const minutes = parseInt(minutesInput) || 0;
    const totalMinutes = Math.min(Math.max(hours * 60 + minutes, 1), 120);
    setDuration(totalMinutes);
    setIsEditingTime(false);
    setHoursInput('');
    setMinutesInput('');
  };

  const cancelTimeInput = () => {
    setIsEditingTime(false);
    setHoursInput('');
    setMinutesInput('');
  };

  const handleTimeInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveTimeInput();
    } else if (e.key === 'Escape') {
      cancelTimeInput();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getFilteredTasks = () => {
    switch (selectedCategory) {
      case 'todo':
        return tasks.todos.map(todo => ({ ...todo, type: 'todo' }));
      case 'goal':
        return tasks.goals.map(goal => ({ ...goal, type: 'goal' }));
      case 'habit':
        return tasks.habits.map(habit => ({ ...habit, type: 'habit' }));
      default:
        return [];
    }
  };

  const getTaskOptions = () => {
    const options = [];
    tasks.todos.forEach(todo => options.push({ ...todo, type: 'todo', label: `Todo: ${todo.title}` }));
    tasks.goals.forEach(goal => options.push({ ...goal, type: 'goal', label: `Goal: ${goal.title}` }));
    tasks.habits.forEach(habit => options.push({ ...habit, type: 'habit', label: `Habit: ${habit.name}` }));
    return options;
  };

  const getTrophyTier = (tier) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      diamond: '#B9F2FF',
      legendary: '#FF6B6B'
    };
    return colors[tier] || '#666';
  };

  const calculateStats = () => {
    if (!stats) {
      return {
        totalTime: '0h 0m',
        sessionsCount: 0,
        todoTime: '0m',
        goalTime: '0m',
        habitTime: '0m',
        averageSession: '0m',
        longestSession: '0m'
      };
    }

    // The backend returns personalStats at the top level, not nested
    const personalStats = stats.personalStats || stats;
    const totalSeconds = personalStats.totalTime || 0;
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    return {
      totalTime: `${totalHours}h ${totalMinutes}m`,
      sessionsCount: personalStats.totalSessions || 0,
      todoTime: formatDuration(personalStats.todoTime || 0),
      goalTime: formatDuration(personalStats.goalTime || 0),
      habitTime: formatDuration(personalStats.habitTime || 0),
      averageSession: formatDuration(personalStats.averageSession || 0),
      longestSession: formatDuration(personalStats.longestSession || 0)
    };
  };

  const getTodaysTimeline = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return focusSessions
      .filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= today && sessionDate < tomorrow;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(session => {
        // Get the task title from various possible property names
        let taskTitle = 'Unknown Task';
        if (session.taskTitle) {
          taskTitle = session.taskTitle;
        } else if (session.taskName) {
          taskTitle = session.taskName;
        } else if (session.title) {
          taskTitle = session.title;
        } else if (session.name) {
          taskTitle = session.name;
        }

        return {
          ...session,
          taskTitle,
          time: new Date(session.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };
      });
  };

  const calculatedStats = calculateStats();
  const todaysTimeline = getTodaysTimeline();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <span className="heart">⏰</span>
          <p>Loading Focus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-container">
      <div className="focus-header">
        <h1 className="focus-title">
          <span className="emoji">⏰</span>
          Focus Timer
          <span className="emoji">🎯</span>
        </h1>
        <p className="focus-subtitle">Set a timer and focus on your tasks</p>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`view-btn ${currentView === 'timer' ? 'active' : ''}`}
          onClick={() => setCurrentView('timer')}
        >
          ⏰ Focus Timer
        </button>
        <button
          className={`view-btn ${currentView === 'trophies' ? 'active' : ''}`}
          onClick={() => setCurrentView('trophies')}
        >
          🏆 Trophies
        </button>
        <button
          className={`view-btn ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('stats');
            fetchStats();
            if (user.currentGroup && user.currentGroup !== 'personal') {
              fetchLeaderboard();
            }
          }}
        >
          📊 Statistics
        </button>
      </div>

      <div className="focus-content">
        {currentView === 'timer' ? (
          <>
            {/* Category Toggle */}
            <div className="category-toggle">
              <button
                className={`toggle-btn ${selectedCategory === 'todo' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('todo');
                  setSelectedTask(null);
                  setTaskType('');
                }}
              >
                📝 Todos
              </button>
              <button
                className={`toggle-btn ${selectedCategory === 'goal' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('goal');
                  setSelectedTask(null);
                  setTaskType('');
                }}
              >
                🎯 Goals
              </button>
              <button
                className={`toggle-btn ${selectedCategory === 'habit' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('habit');
                  setSelectedTask(null);
                  setTaskType('');
                }}
              >
                🔥 Habits
              </button>
            </div>

            {/* Task Selection */}
            <div className="task-selection">
              <h2>Select a {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</h2>
              <div className="task-options">
                {getFilteredTasks().length > 0 ? (
                  getFilteredTasks().map(task => (
                    <div
                      key={`${task.type}-${task._id}`}
                      className={`task-option ${selectedTask && selectedTask._id === task._id ? 'selected' : ''}`}
                      onClick={() => handleTaskSelect(task, task.type)}
                    >
                      {task.title || task.name}
                    </div>
                  ))
                ) : (
                  <div className="no-tasks">
                    <p>
                      {selectedCategory === 'todo' && 'No incomplete todos found. Complete some tasks or create new ones!'}
                      {selectedCategory === 'goal' && 'No active goals found. Create some goals to focus on!'}
                      {selectedCategory === 'habit' && 'No habits found. Create some habits to focus on!'}
                    </p>
                    <small>💡 Only incomplete tasks are available for focus sessions</small>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Mode Selection */}
            {selectedTask && (
              <div className="timer-mode-selection">
                <h2>Timer Mode</h2>
                <div className="mode-buttons">
                  <button
                    className={`mode-btn ${timerMode === 'countdown' ? 'active' : ''}`}
                    onClick={() => setTimerMode('countdown')}
                    disabled={isRunning}
                  >
                    ⏱️ Countdown
                  </button>
                  <button
                    className={`mode-btn ${timerMode === 'countup' ? 'active' : ''}`}
                    onClick={() => setTimerMode('countup')}
                    disabled={isRunning}
                  >
                    ⏳ Count Up
                  </button>
                </div>
              </div>
            )}

            {/* Timer Display */}
            {selectedTask && (
              <div className="timer-display">
                <div className="timer-header">
                  <div className="selected-task">
                    {selectedTask.title || selectedTask.name}
                  </div>
                </div>
                <div className="timer-time-display">
                  {isEditingTime ? (
                    <div className="time-input-group">
                      <div className="time-input-wrapper">
                        <input
                          type="text"
                          className="time-input hours-input"
                          value={hoursInput}
                          onChange={handleHoursChange}
                          onKeyPress={handleTimeInputKeyPress}
                          placeholder="0"
                          maxLength="1"
                        />
                        <label className="time-label">Hours</label>
                      </div>
                      <span className="time-separator">:</span>
                      <div className="time-input-wrapper">
                        <input
                          type="text"
                          className="time-input minutes-input"
                          value={minutesInput}
                          onChange={handleMinutesChange}
                          onKeyPress={handleTimeInputKeyPress}
                          placeholder="25"
                          maxLength="2"
                          autoFocus
                        />
                        <label className="time-label">Minutes</label>
                      </div>
                      <div className="time-actions">
                        <button className="time-save-btn" onClick={saveTimeInput}>✓</button>
                        <button className="time-cancel-btn" onClick={cancelTimeInput}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`timer-text ${timerMode === 'countdown' && !isRunning ? 'editable' : ''}`}
                      onClick={handleTimeClick}
                    >
                      {timerMode === 'countdown' ? formatTime(duration * 60 - elapsedTime) : formatTime(elapsedTime)}
                    </div>
                  )}
                </div>
                <div className="timer-info">
                  <p className="timer-mode-label">
                    {timerMode === 'countdown' ? 'Time Remaining' : 'Time Elapsed'}
                  </p>
                </div>
                <div className="timer-controls">
                  {!isRunning ? (
                    <button className="btn btn-primary" onClick={startTimer}>
                      {timerMode === 'countdown' ? 'Start Timer' : 'Start Stopwatch'}
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-secondary" onClick={pauseTimer}>
                        Pause
                      </button>
                      {timerMode === 'countup' && (
                        <button className="btn btn-success" onClick={stopTimer}>
                          Stop & Save
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn btn-danger" onClick={resetTimer}>
                    End Focus
                  </button>
                </div>
              </div>
            )}
          </>
        ) : currentView === 'trophies' ? (
          /* Dedicated Trophies View */
          <div className="trophies-view">
            {/* Trophy Collection Header */}
            <div className="trophy-collection-header">
              <h2>🏆 Your Trophy Collection</h2>
              <p className="trophy-subtitle">Earn trophies by completing focus sessions and achieving milestones!</p>
              <div className="trophy-stats-summary">
                <div className="trophy-stat-item">
                  <span className="trophy-stat-number">{trophies.length}</span>
                  <span className="trophy-stat-label">Total Trophies</span>
                </div>
                <div className="trophy-stat-item">
                  <span className="trophy-stat-number">
                    {trophies.filter(t => t.tier === 'legendary').length}
                  </span>
                  <span className="trophy-stat-label">Legendary</span>
                </div>
                <div className="trophy-stat-item">
                  <span className="trophy-stat-number">
                    {trophies.filter(t => t.tier === 'gold').length}
                  </span>
                  <span className="trophy-stat-label">Gold</span>
                </div>
              </div>
            </div>

            {/* Trophy Gallery */}
            <div className="trophy-gallery-enhanced">
              {trophies.length > 0 ? (
                <>
                  <div className="trophy-grid-enhanced">
                    {trophies.map(trophy => (
                      <div key={trophy._id} className={`trophy-card-enhanced ${trophy.tier}`}>
                        <div className="trophy-visual">
                          <div className="trophy-icon-enhanced" style={{ color: getTrophyTier(trophy.tier) }}>
                            {trophy.trophyIcon}
                          </div>
                          <div className="trophy-glow" style={{ backgroundColor: getTrophyTier(trophy.tier) }}></div>
                        </div>
                        <div className="trophy-info">
                          <h3 className="trophy-name">{trophy.trophyName}</h3>
                          <p className="trophy-description">{trophy.trophyDescription}</p>
                          <div className="trophy-meta">
                            <span className="trophy-tier-badge" style={{ backgroundColor: getTrophyTier(trophy.tier) }}>
                              {trophy.tier.toUpperCase()}
                            </span>
                            <span className="trophy-date">
                              {new Date(trophy.unlockedAt || trophy.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-trophies-enhanced">
                  <div className="empty-state">
                    <span className="empty-icon">🏆</span>
                    <h3>No Trophies Yet!</h3>
                    <p>Complete focus sessions to start earning trophies and unlock achievements!</p>
                    <div className="trophy-suggestions">
                      <div className="suggestion-item">
                        <span className="suggestion-icon">⏰</span>
                        <span className="suggestion-text">Complete your first focus session</span>
                      </div>
                      <div className="suggestion-item">
                        <span className="suggestion-icon">🔥</span>
                        <span className="suggestion-text">Build a focus streak</span>
                      </div>
                      <div className="suggestion-item">
                        <span className="suggestion-icon">📈</span>
                        <span className="suggestion-text">Focus for extended periods</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trophy Categories */}
            {trophies.length > 0 && (
              <div className="trophy-categories">
                <h3>🏆 Trophies by Category</h3>
                <div className="categories-grid">
                  {['bronze', 'silver', 'gold', 'diamond', 'legendary'].map(tier => {
                    const tierTrophies = trophies.filter(t => t.tier === tier);
                    if (tierTrophies.length === 0) return null;

                    return (
                      <div key={tier} className="trophy-category">
                        <div className="category-header" style={{ backgroundColor: getTrophyTier(tier) }}>
                          <h4>{tier.charAt(0).toUpperCase() + tier.slice(1)} Trophies</h4>
                          <span className="category-count">{tierTrophies.length}</span>
                        </div>
                        <div className="category-trophies">
                          {tierTrophies.map(trophy => (
                            <div key={trophy._id} className="mini-trophy">
                              <span className="mini-trophy-icon" style={{ color: getTrophyTier(tier) }}>
                                {trophy.trophyIcon}
                              </span>
                              <span className="mini-trophy-name">{trophy.trophyName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            {trophies.length > 0 && (
              <div className="recent-achievements">
                <h3>🎉 Recent Achievements</h3>
                <div className="achievements-list">
                  {trophies
                    .sort((a, b) => new Date(b.unlockedAt || b.createdAt) - new Date(a.unlockedAt || a.createdAt))
                    .slice(0, 5)
                    .map((trophy, index) => (
                      <div key={trophy._id} className="achievement-item">
                        <div className="achievement-icon" style={{ color: getTrophyTier(trophy.tier) }}>
                          {trophy.trophyIcon}
                        </div>
                        <div className="achievement-content">
                          <div className="achievement-title">{trophy.trophyName}</div>
                          <div className="achievement-description">{trophy.trophyDescription}</div>
                          <div className="achievement-date">
                            {new Date(trophy.unlockedAt || trophy.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="achievement-tier" style={{ backgroundColor: getTrophyTier(trophy.tier) }}>
                          {trophy.tier}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Enhanced Statistics View */
          <div className="statistics-view">
            {/* Period Toggle */}
            <div className="period-toggle">
              <button
                className={`period-btn ${statsPeriod === 'daily' ? 'active' : ''}`}
                onClick={() => {
                  setStatsPeriod('daily');
                  fetchStats();
                  if (user.currentGroup && user.currentGroup !== 'personal') {
                    fetchLeaderboard();
                  }
                }}
              >
                📅 Daily
              </button>
              <button
                className={`period-btn ${statsPeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => {
                  setStatsPeriod('weekly');
                  fetchStats();
                  if (user.currentGroup && user.currentGroup !== 'personal') {
                    fetchLeaderboard();
                  }
                }}
              >
                📊 Weekly
              </button>
              <button
                className={`period-btn ${statsPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => {
                  setStatsPeriod('monthly');
                  fetchStats();
                  if (user.currentGroup && user.currentGroup !== 'personal') {
                    fetchLeaderboard();
                  }
                }}
              >
                📈 Monthly
              </button>
            </div>



            {/* Enhanced Statistics */}
            <div className="stats-display">
              <h2>Your {statsPeriod.charAt(0).toUpperCase() + statsPeriod.slice(1)} Focus Report</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <h3>Total Focus Time</h3>
                    <p className="stat-value">{calculatedStats.totalTime}</p>
                    <p className="stat-label">This {statsPeriod.slice(0, -2)}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <h3>Sessions Completed</h3>
                    <p className="stat-value">{calculatedStats.sessionsCount}</p>
                    <p className="stat-label">Focus sessions</p>
                  </div>
                </div>
              </div>

              {/* Focus Time by Task Type Card */}
              <div className="task-breakdown-card">
                <h3>📈 Focus Time by Task Type</h3>
                <div className="task-type-grid">
                  <div className="task-type-item">
                    <div className="task-type-icon">📝</div>
                    <div className="task-type-info">
                      <div className="task-type-label">Todos</div>
                      <div className="task-type-value">{calculatedStats.todoTime}</div>
                    </div>
                  </div>
                  <div className="task-type-item">
                    <div className="task-type-icon">🎯</div>
                    <div className="task-type-info">
                      <div className="task-type-label">Goals</div>
                      <div className="task-type-value">{calculatedStats.goalTime}</div>
                    </div>
                  </div>
                  <div className="task-type-item">
                    <div className="task-type-icon">🔥</div>
                    <div className="task-type-info">
                      <div className="task-type-label">Habits</div>
                      <div className="task-type-value">{calculatedStats.habitTime}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Leaderboard */}
              {user.currentGroup && user.currentGroup !== 'personal' && leaderboard.length > 0 && (
                <div className="leaderboard-card">
                  <h3>🏆 Group Leaderboard</h3>
                  <div className="leaderboard-list">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div key={entry.user.id} className={`leaderboard-entry ${entry.user.id === user._id ? 'current-user' : ''}`}>
                        <div className="rank">#{entry.rank}</div>
                        <div className="user-info">
                          <span className="user-name">{entry.user.name}</span>
                          <span className="user-stats">{formatDuration(entry.stats.totalTime)} • {entry.trophyCount} 🏆</span>
                        </div>
                        {index < 3 && (
                          <div className="medal">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Card */}
              <div className="timeline-card">
                <div className="timeline-header">
                  <h3>📅 Today's Focus Timeline</h3>
                  <button
                    className="btn btn-secondary timeline-add-btn"
                    onClick={() => setShowCustomEntry(true)}
                  >
                    <span className="btn-icon">➕</span>
                    Add Custom Time
                  </button>
                </div>
                {todaysTimeline.length > 0 ? (
                  <div className="timeline-list">
                    {todaysTimeline.map((session, index) => (
                      <div key={session._id || index} className="timeline-item">
                        <div className="timeline-time">{session.time}</div>
                        <div className="timeline-content">
                          <div className="timeline-task">
                            {session.taskType === 'todo' && '📝 '}
                            {session.taskType === 'goal' && '🎯 '}
                            {session.taskType === 'habit' && '🔥 '}
                            {session.taskTitle || 'Unknown Task'}
                          </div>
                          <div className="timeline-duration">
                            {formatDuration(session.duration)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="timeline-empty">
                    <span className="timeline-empty-icon">📅</span>
                    <p>No focus sessions today yet</p>
                    <small>Complete a focus session to see it here!</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Custom Entry Modal */}
      {showCustomEntry && (
        <div className="modal-overlay custom-entry-overlay" onClick={() => setShowCustomEntry(false)}>
          <div className="custom-entry-modal" onClick={e => e.stopPropagation()}>
            <div className="custom-entry-header">
              <div className="header-icon">⏰</div>
              <div className="header-content">
                <h2>Add Custom Focus Session</h2>
                <p>Manually log a focus session you completed</p>
              </div>
              <button className="close-btn" onClick={() => setShowCustomEntry(false)}>
                <span>✕</span>
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="custom-entry-form">
              {/* Task Selection Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">🎯</span>
                  Task Details
                </h3>
                
                <div className="task-type-selector">
                  <div className="task-type-options">
                    <label className={`task-type-option ${customEntryForm.taskType === 'todo' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="taskType"
                        value="todo"
                        checked={customEntryForm.taskType === 'todo'}
                        onChange={(e) => setCustomEntryForm({...customEntryForm, taskType: e.target.value, taskId: ''})}
                      />
                      <div className="option-content">
                        <span className="option-icon">📝</span>
                        <span className="option-label">Todo</span>
                      </div>
                    </label>
                    <label className={`task-type-option ${customEntryForm.taskType === 'goal' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="taskType"
                        value="goal"
                        checked={customEntryForm.taskType === 'goal'}
                        onChange={(e) => setCustomEntryForm({...customEntryForm, taskType: e.target.value, taskId: ''})}
                      />
                      <div className="option-content">
                        <span className="option-icon">🎯</span>
                        <span className="option-label">Goal</span>
                      </div>
                    </label>
                    <label className={`task-type-option ${customEntryForm.taskType === 'habit' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="taskType"
                        value="habit"
                        checked={customEntryForm.taskType === 'habit'}
                        onChange={(e) => setCustomEntryForm({...customEntryForm, taskType: e.target.value, taskId: ''})}
                      />
                      <div className="option-content">
                        <span className="option-icon">🔥</span>
                        <span className="option-label">Habit</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">
                      {customEntryForm.taskType === 'todo' && '📝'}
                      {customEntryForm.taskType === 'goal' && '🎯'}
                      {customEntryForm.taskType === 'habit' && '🔥'}
                    </span>
                    Select {customEntryForm.taskType.charAt(0).toUpperCase() + customEntryForm.taskType.slice(1)}
                  </label>
                  <select
                    className="form-select"
                    value={customEntryForm.taskId}
                    onChange={(e) => setCustomEntryForm({...customEntryForm, taskId: e.target.value})}
                    required
                  >
                    <option value="">Choose a {customEntryForm.taskType}...</option>
                    {getTaskOptions()
                      .filter(task => task.type === customEntryForm.taskType)
                      .map(task => (
                        <option key={task._id} value={task._id}>
                          {task.title || task.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Time & Duration Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">⏱️</span>
                  Session Timing
                </h3>
                
                <div className="timing-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📅</span>
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={customEntryForm.sessionDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCustomEntryForm({...customEntryForm, sessionDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🕐</span>
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={customEntryForm.startTime}
                      onChange={(e) => setCustomEntryForm({...customEntryForm, startTime: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">⏰</span>
                      Duration (minutes)
                    </label>
                    <div className="duration-input-wrapper">
                      <input
                        type="number"
                        className="form-input duration-input"
                        min="1"
                        max="720"
                        value={Math.floor(customEntryForm.duration / 60)}
                        onChange={(e) => setCustomEntryForm({...customEntryForm, duration: parseInt(e.target.value) * 60})}
                        required
                      />
                      <span className="duration-label">min</span>
                    </div>
                    <div className="duration-suggestions">
                      {[15, 25, 30, 45, 60, 90].map(minutes => (
                        <button
                          key={minutes}
                          type="button"
                          className={`duration-suggestion ${Math.floor(customEntryForm.duration / 60) === minutes ? 'active' : ''}`}
                          onClick={() => setCustomEntryForm({...customEntryForm, duration: minutes * 60})}
                        >
                          {minutes}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Session Preview */}
                {customEntryForm.startTime && customEntryForm.duration && (
                  <div className="session-preview">
                    <div className="preview-header">
                      <span className="preview-icon">👁️</span>
                      Session Preview
                    </div>
                    <div className="preview-content">
                      <div className="preview-item">
                        <span className="preview-label">Start:</span>
                        <span className="preview-value">
                          {new Date(`${customEntryForm.sessionDate}T${customEntryForm.startTime}`).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="preview-item">
                        <span className="preview-label">End:</span>
                        <span className="preview-value">
                          {new Date(new Date(`${customEntryForm.sessionDate}T${customEntryForm.startTime}`).getTime() + customEntryForm.duration * 1000).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="preview-item">
                        <span className="preview-label">Duration:</span>
                        <span className="preview-value">{formatDuration(customEntryForm.duration)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📝</span>
                  Session Notes
                  <span className="optional-badge">Optional</span>
                </h3>
                
                <div className="form-group">
                  <textarea
                    className="form-textarea"
                    value={customEntryForm.notes}
                    onChange={(e) => setCustomEntryForm({...customEntryForm, notes: e.target.value})}
                    placeholder="Add any notes about this focus session... What did you accomplish? How did it go?"
                    rows="4"
                    maxLength="500"
                  />
                  <div className="character-count">
                    {customEntryForm.notes.length}/500 characters
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-large" 
                  onClick={() => setShowCustomEntry(false)}
                >
                  <span className="btn-icon">✕</span>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-large"
                  disabled={!customEntryForm.taskId || !customEntryForm.duration}
                >
                  <span className="btn-icon">✅</span>
                  Add Focus Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trophy Unlock Modal */}
      {showTrophyModal && newTrophies.length > 0 && (
        <div className="modal-overlay trophy-modal-overlay">
          <div className="trophy-modal">
            <div className="trophy-celebration">
              <h2>🎉 New Trophy Unlocked! 🎉</h2>
              {newTrophies.map(trophy => (
                <div key={trophy._id} className="new-trophy-display">
                  <div className="trophy-icon-large" style={{ color: getTrophyTier(trophy.tier) }}>
                    {trophy.trophyIcon}
                  </div>
                  <h3>{trophy.trophyName}</h3>
                  <p>{trophy.trophyDescription}</p>
                  <div className="trophy-tier-badge" style={{ backgroundColor: getTrophyTier(trophy.tier) }}>
                    {trophy.tier.toUpperCase()}
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" onClick={() => setShowTrophyModal(false)}>
                Awesome! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {showCompletionMessage && (
        <div className="completion-message">
          <div className="completion-content">
            <span className="completion-icon">🎉</span>
            <p>{completionMessage}</p>
            <button
              className="completion-close"
              onClick={() => setShowCompletionMessage(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Focus;
