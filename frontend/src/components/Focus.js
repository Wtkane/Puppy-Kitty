import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Focus.css';

const Focus = ({ user }) => {
  const [tasks, setTasks] = useState({ todos: [], goals: [], habits: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskType, setTaskType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todo'); // 'todo', 'goal', 'habit'
  const [timerMode, setTimerMode] = useState('countdown'); // 'countdown' or 'countup'
  const [duration, setDuration] = useState(25); // minutes (for countdown mode)
  const [elapsedTime, setElapsedTime] = useState(0); // seconds (for countup mode)
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [focusSessions, setFocusSessions] = useState([]);
  const [currentView, setCurrentView] = useState('timer'); // 'timer' or 'stats'
  const [statsPeriod, setStatsPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [completionMessage, setCompletionMessage] = useState('');
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
              // Record the session
              axios.post('/api/focus', {
                taskType,
                taskId: selectedTask._id,
                duration: targetSeconds
              }).then(() => {
                fetchData();
                setCompletionMessage(`🎉 Focus session completed! You focused for ${formatTime(targetSeconds)}.`);
                setShowCompletionMessage(true);
                setTimeout(() => setShowCompletionMessage(false), 5000);
              }).catch(error => {
                console.error('Error recording focus session:', error);
              });
              return targetSeconds; // Don't go over
            }
            return newTime;
          });
        } else {
          // Countup mode - just keep counting
          setElapsedTime(time => time + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, duration, taskType, selectedTask]);

  const fetchData = async () => {
    try {
      const [todosRes, goalsRes, habitsRes, focusRes] = await Promise.all([
        axios.get('/api/todos/my-todos'),
        axios.get('/api/goals'),
        axios.get('/api/habits'),
        axios.get('/api/focus')
      ]);
      console.log('Fetched todos:', todosRes.data);
      console.log('Fetched goals:', goalsRes.data);
      console.log('Fetched habits:', habitsRes.data);
      console.log('Fetched focus sessions:', focusRes.data);
      setTasks({
        todos: todosRes.data || [],
        goals: goalsRes.data || [],
        habits: habitsRes.data || []
      });
      setFocusSessions(focusRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const stopTimer = () => {
    setIsRunning(false);
    if (timerMode === 'countup') {
      // Record the session for countup mode
      axios.post('/api/focus', {
        taskType,
        taskId: selectedTask._id,
        duration: elapsedTime
      }).then(() => {
        fetchData();
        setCompletionMessage(`🎉 Focus session completed! You focused for ${formatTime(elapsedTime)}.`);
        setShowCompletionMessage(true);
        setTimeout(() => setShowCompletionMessage(false), 5000);
      }).catch(error => {
        console.error('Error recording focus session:', error);
      });
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    // Show completion message if timer was running
    if (isRunning || elapsedTime > 0) {
      // For both modes, elapsedTime represents the actual time spent focusing
      const focusedTime = elapsedTime;
      const minutes = Math.floor(focusedTime / 60);
      const message = `You focused ${minutes} minute${minutes !== 1 ? 's' : ''} on ${selectedTask.title || selectedTask.name}. Good job! 🎉`;
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
    const totalMinutes = Math.min(Math.max(hours * 60 + minutes, 1), 120); // Min 1 min, max 2 hours
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

  const getFilteredTasks = () => {
    console.log('Selected category:', selectedCategory);
    console.log('Tasks:', tasks);
    switch (selectedCategory) {
      case 'todo':
        console.log('Returning incomplete todos:', tasks.todos.filter(todo => !todo.completed));
        // Only show incomplete todos
        return tasks.todos
          .filter(todo => !todo.completed)
          .map(todo => ({ ...todo, type: 'todo' }));
      case 'goal':
        console.log('Returning active goals:', tasks.goals.filter(goal => !goal.completed));
        // Only show incomplete goals
        return tasks.goals
          .filter(goal => !goal.completed)
          .map(goal => ({ ...goal, type: 'goal' }));
      case 'habit':
        console.log('Returning active habits:', tasks.habits);
        // Show all habits (habits are ongoing by nature)
        return tasks.habits.map(habit => ({ ...habit, type: 'habit' }));
      default:
        return [];
    }
  };

  const getTaskOptions = () => {
    const options = [];
    tasks.todos.forEach(todo => options.push({ ...todo, type: 'todo', label: `Todo: ${todo.title}` }));
    tasks.goals.forEach(goal => options.push({ ...goal, type: 'goal', label: `Goal: ${goal.title}` }));
    tasks.habits.forEach(habit => options.push({ ...habit, type: 'habit', label: `Habit: ${habit.title}` }));
    return options;
  };

  const calculateStats = () => {
    const now = new Date();
    let filteredSessions = [];

    switch (statsPeriod) {
      case 'daily':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredSessions = focusSessions.filter(session =>
          new Date(session.createdAt) >= today
        );
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filteredSessions = focusSessions.filter(session =>
          new Date(session.createdAt) >= weekStart
        );
        break;
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredSessions = focusSessions.filter(session =>
          new Date(session.createdAt) >= monthStart
        );
        break;
      case 'yearly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filteredSessions = focusSessions.filter(session =>
          new Date(session.createdAt) >= yearStart
        );
        break;
      default:
        filteredSessions = focusSessions;
    }

    const totalSeconds = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Calculate current streak (consecutive days with focus sessions)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const hasSessionOnDate = focusSessions.some(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate.toDateString() === checkDate.toDateString();
      });

      if (hasSessionOnDate) {
        streak++;
      } else if (i > 0) { // Don't break streak for today if no session yet
        break;
      }
    }

    return {
      totalTime: `${totalHours}h ${totalMinutes}m`,
      sessionsCount: filteredSessions.length,
      currentStreak: streak
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
      .map(session => ({
        ...session,
        time: new Date(session.createdAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }));
  };

  const stats = calculateStats();
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
          className={`view-btn ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentView('stats')}
        >
          📊 View Statistics
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

        {/* Combined Timer Card */}
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
        ) : (
          /* Statistics View */
          <div className="statistics-view">
            {/* Period Toggle */}
            <div className="period-toggle">
              <button
                className={`period-btn ${statsPeriod === 'daily' ? 'active' : ''}`}
                onClick={() => setStatsPeriod('daily')}
              >
                📅 Daily
              </button>
              <button
                className={`period-btn ${statsPeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => setStatsPeriod('weekly')}
              >
                📊 Weekly
              </button>
              <button
                className={`period-btn ${statsPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setStatsPeriod('monthly')}
              >
                📈 Monthly
              </button>
              <button
                className={`period-btn ${statsPeriod === 'yearly' ? 'active' : ''}`}
                onClick={() => setStatsPeriod('yearly')}
              >
                📉 Yearly
              </button>
            </div>

            {/* Statistics Display */}
            <div className="stats-display">
              <h2>Your {statsPeriod.charAt(0).toUpperCase() + statsPeriod.slice(1)} Focus Report</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <h3>Total Focus Time</h3>
                    <p className="stat-value">{stats.totalTime}</p>
                    <p className="stat-label">This {statsPeriod.slice(0, -2)}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <h3>Sessions Completed</h3>
                    <p className="stat-value">{stats.sessionsCount}</p>
                    <p className="stat-label">Focus sessions</p>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="timeline-card">
                <h3>📅 Today's Focus Timeline</h3>
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
                            {session.taskTitle || session.taskName || 'Unknown Task'}
                          </div>
                          <div className="timeline-duration">
                            {Math.floor(session.duration / 60)}m {session.duration % 60}s
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
