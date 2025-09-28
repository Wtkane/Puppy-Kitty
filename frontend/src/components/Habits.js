import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Habits.css';

const Habits = ({ user }) => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily'
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchHabits();
  }, [user]); // Add user as dependency to refresh when group changes

  const fetchHabits = async () => {
    try {
      const response = await axios.get('/api/habits');
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await axios.post('/api/habits', formData);
      setHabits([response.data, ...habits]);
      setMessage('Habit created successfully! 🎯');
      setMessageType('success');
      setShowAddForm(false);
      setFormData({
        name: '',
        description: '',
        frequency: 'daily'
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create habit');
      setMessageType('error');
    }
  };

  const checkInHabit = async (habitId) => {
    try {
      const response = await axios.post(`/api/habits/${habitId}/checkin`);
      const updatedHabit = response.data;
      setHabits(habits.map(habit =>
        habit._id === habitId ? updatedHabit : habit
      ));

      const isNowCheckedIn = updatedHabit.checkIns && updatedHabit.checkIns.some(checkIn => {
        const checkInDate = new Date(checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkInDate.getTime() === today.getTime();
      });

      setMessage(isNowCheckedIn ? 'Checked in successfully! 🔥' : 'Check-in undone! ↩️');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to update check-in');
      setMessageType('error');
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await axios.delete(`/api/habits/${habitId}`);
      setHabits(habits.filter(habit => habit._id !== habitId));
      setMessage('Habit deleted successfully! 🗑️');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to delete habit');
      setMessageType('error');
    }
  };

  const getFrequencyEmoji = (frequency) => {
    const emojis = {
      daily: '📅',
      weekly: '📊',
      monthly: '🗓️'
    };
    return emojis[frequency] || '📅';
  };

  const getStreakColor = (streak) => {
    if (streak === 0) return '#e74c3c';
    if (streak < 7) return '#f39c12';
    if (streak < 30) return '#27ae60';
    return '#8e44ad';
  };

  const isCheckedInToday = (habit) => {
    if (!habit.checkIns || habit.checkIns.length === 0) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return habit.checkIns.some(checkIn => {
      const checkInDate = new Date(checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <span className="heart">🔥</span>
          <p>Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="habits-container">
      <div className="habits-header">
        <h1 className="habits-title">
          <span className="emoji">🔥</span>
          Your Habits
          <span className="emoji">✨</span>
        </h1>
        <p className="habits-subtitle">Build lasting habits and track your streaks</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
          {message}
        </div>
      )}

      <div className="habits-content">
        {/* Add Habit Button */}
        {!showAddForm && (
          <div className="habits-actions">
            <button
              className="btn btn-primary add-habit-btn"
              onClick={() => setShowAddForm(true)}
            >
              <span>➕</span>
              Add New Habit
            </button>
          </div>
        )}

        {/* Add Habit Form */}
        {showAddForm && (
          <div className="habit-form-container">
            <form onSubmit={handleSubmit} className="habit-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Drink 8 glasses of water"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="frequency">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    className="form-input"
                    value={formData.frequency}
                    onChange={handleChange}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your habit..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <span>🔥</span>
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Habits Grid */}
        <div className="habits-grid">
          {habits.length === 0 ? (
            <div className="no-habits">
              <div className="no-habits-icon">🔥</div>
              <h3>No habits yet</h3>
              <p>Start building healthy habits by creating your first one!</p>
            </div>
          ) : (
            habits.map(habit => (
              <div key={habit._id} className="habit-card">
                <div className="habit-header">
                  <div className="habit-frequency">
                    <span className="frequency-name">{habit.frequency}</span>
                  </div>
                  <div className="habit-status">
                    {habit.status === 'active' ? '🟢' : habit.status === 'paused' ? '🟡' : '🔴'}
                  </div>
                </div>

                <div className="habit-content">
                  <h3 className="habit-name">{habit.name}</h3>
                  {habit.description && (
                    <p className="habit-description">{habit.description}</p>
                  )}

                  <div className="habit-stats">
                    <div className="streak-info">
                      <div className="current-streak">
                        <span className="streak-label">Current Streak</span>
                        <span
                          className="streak-value"
                          style={{ color: getStreakColor(habit.streak) }}
                        >
                          {habit.streak} days
                        </span>
                      </div>
                      <div className="longest-streak">
                        <span className="streak-label">Best Streak</span>
                        <span className="streak-value">{habit.longestStreak} days</span>
                      </div>
                    </div>

                    <div className="check-ins">
                      <span className="check-ins-label">Total Check-ins</span>
                      <span className="check-ins-value">{habit.checkIns?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="habit-actions">
                  <button
                    className={`btn checkin-btn ${isCheckedInToday(habit) ? 'checked-in' : ''}`}
                    onClick={() => checkInHabit(habit._id)}
                  >
                    {isCheckedInToday(habit) ? '↩️ Undo Check-in' : '🔥 Check In'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteHabit(habit._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Habits;
