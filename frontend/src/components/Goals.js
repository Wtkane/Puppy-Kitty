import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Goals.css';

const Goals = ({ user }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    targetValue: '',
    currentValue: '0',
    unit: '',
    deadline: '',
    priority: 'medium'
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await axios.get('/api/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
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
      const response = await axios.post('/api/goals', formData);
      setGoals([...goals, response.data]);
      setMessage('Goal created successfully! 🎯');
      setMessageType('success');
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'personal',
        targetValue: '',
        currentValue: '0',
        unit: '',
        deadline: '',
        priority: 'medium'
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create goal');
      setMessageType('error');
    }
  };

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      const response = await axios.put(`/api/goals/${goalId}`, { currentValue: newValue });
      setGoals(goals.map(goal =>
        goal._id === goalId ? response.data : goal
      ));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await axios.delete(`/api/goals/${goalId}`);
      setGoals(goals.filter(goal => goal._id !== goalId));
      setMessage('Goal deleted successfully! 🗑️');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to delete goal');
      setMessageType('error');
    }
  };

  const getProgressPercentage = (goal) => {
    const current = parseFloat(goal.currentValue) || 0;
    const target = parseFloat(goal.targetValue) || 1;
    return Math.min((current / target) * 100, 100);
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      personal: '🌟',
      health: '💪',
      career: '💼',
      financial: '💰',
      education: '📚',
      relationships: '❤️',
      other: '🎯'
    };
    return emojis[category] || '🎯';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#96ceb4',
      medium: '#4ecdc4',
      high: '#ff6b6b'
    };
    return colors[priority] || '#4ecdc4';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <span className="heart">🎯</span>
          <p>Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h1 className="goals-title">
          <span className="emoji">🎯</span>
          Your Goals
          <span className="emoji">✨</span>
        </h1>
        <p className="goals-subtitle">Track your progress and achieve your dreams</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
          {message}
        </div>
      )}

      <div className="goals-content">
        {/* Add Goal Button */}
        {!showAddForm && (
          <div className="goals-actions">
            <button
              className="btn btn-primary add-goal-btn"
              onClick={() => setShowAddForm(true)}
            >
              <span>➕</span>
              Add New Goal
            </button>
          </div>
        )}

        {/* Add Goal Form */}
        {showAddForm && (
          <div className="goal-form-container">
            <form onSubmit={handleSubmit} className="goal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="title">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Run a marathon"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="form-input"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="personal">Personal</option>
                    <option value="health">Health & Fitness</option>
                    <option value="career">Career</option>
                    <option value="financial">Financial</option>
                    <option value="education">Education</option>
                    <option value="relationships">Relationships</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your goal in detail..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="targetValue">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    id="targetValue"
                    name="targetValue"
                    className="form-input"
                    value={formData.targetValue}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 26.2"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="unit">
                    Unit
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    className="form-input"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="e.g., miles, books, lbs"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="form-input"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="deadline">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    className="form-input"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="currentValue">
                    Current Progress
                  </label>
                  <input
                    type="number"
                    id="currentValue"
                    name="currentValue"
                    className="form-input"
                    value={formData.currentValue}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
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
                  <span>🎯</span>
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals Grid */}
        <div className="goals-grid">
          {goals.length === 0 ? (
            <div className="no-goals">
              <div className="no-goals-icon">🎯</div>
              <h3>No goals yet</h3>
              <p>Start by creating your first goal to track your progress!</p>
            </div>
          ) : (
            goals.map(goal => (
              <div key={goal._id} className="goal-card">
                <div className="goal-card-header">
                  <div className="goal-main-icon">
                    {getCategoryEmoji(goal.category)}
                  </div>
                  <div className="goal-header-details">
                    <div className="goal-priority-badge" style={{ backgroundColor: getPriorityColor(goal.priority) }}>
                      {goal.priority}
                    </div>
                    <div className="goal-category-label">
                      {goal.category}
                    </div>
                    {goal.deadline && (
                      <div className="goal-deadline-header">
                        <span className="deadline-icon">📅</span>
                        <span className="deadline-text">
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="goal-card-body">
                  <h3 className="goal-card-title">{goal.title}</h3>
                  {goal.description && (
                    <p className="goal-card-description">{goal.description}</p>
                  )}

                  <div className="goal-metrics">
                    <div className="metric-item">
                      <div className="metric-label">Progress</div>
                      <div className="metric-value">
                        {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Completion</div>
                      <div className="metric-value">
                        {Math.round(getProgressPercentage(goal))}%
                      </div>
                    </div>
                  </div>

                  <div className="goal-progress-section">
                    <div className="progress-bar-container">
                      <div className="progress-bar-modern">
                        <div
                          className="progress-fill-modern"
                          style={{
                            width: `${getProgressPercentage(goal)}%`,
                            backgroundColor: getPriorityColor(goal.priority)
                          }}
                        />
                      </div>
                      <div className="progress-percentage">
                        {Math.round(getProgressPercentage(goal))}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="goal-card-footer">
                  <div className="goal-update-section">
                    <label className="update-label">Update Progress:</label>
                    <div className="update-input-group">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={goal.currentValue || 0}
                        onChange={(e) => updateGoalProgress(goal._id, e.target.value)}
                        className="update-input"
                        placeholder="0"
                      />
                      <span className="update-unit">{goal.unit}</span>
                    </div>
                  </div>
                  <button
                    className="goal-delete-btn"
                    onClick={() => deleteGoal(goal._id)}
                    title="Delete Goal"
                  >
                    <span className="delete-icon">🗑️</span>
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

export default Goals;
