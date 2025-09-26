import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Calendar.css'; // Reuse Calendar.css for consistent styling

const SpecialDates = ({ user }) => {
  const [specialDates, setSpecialDates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'other',
    isRecurring: false,
    recurringType: 'yearly',
    color: '#ff6b6b',
    notificationEnabled: false,
    notificationDaysBefore: 1
  });
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'upcoming'

  const types = [
    { value: 'birthday', label: 'Birthday', emoji: '🎂' },
    { value: 'anniversary', label: 'Anniversary', emoji: '💑' },
    { value: 'holiday', label: 'Holiday', emoji: '🎉' },
    { value: 'reminder', label: 'Reminder', emoji: '🔔' },
    { value: 'other', label: 'Other', emoji: '📅' }
  ];

  const colors = [
    { value: '#ff6b6b', label: 'Red', emoji: '❤️' },
    { value: '#4ecdc4', label: 'Teal', emoji: '💚' },
    { value: '#45b7d1', label: 'Blue', emoji: '💙' },
    { value: '#96ceb4', label: 'Green', emoji: '💚' },
    { value: '#ffeaa7', label: 'Yellow', emoji: '💛' },
    { value: '#dda0dd', label: 'Purple', emoji: '💜' },
    { value: '#98d8c8', label: 'Mint', emoji: '🤍' }
  ];

  useEffect(() => {
    fetchSpecialDates();
  }, []);

  const fetchSpecialDates = async () => {
    try {
      const response = await axios.get('/api/special-dates');
      setSpecialDates(response.data);
    } catch (error) {
      console.error('Error fetching special dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDate) {
        await axios.put(`/api/special-dates/${editingDate._id}`, formData);
      } else {
        await axios.post('/api/special-dates', formData);
      }

      setShowForm(false);
      setEditingDate(null);
      resetForm();
      fetchSpecialDates();
    } catch (error) {
      console.error('Error saving special date:', error);
    }
  };

  const handleEdit = (specialDate) => {
    setEditingDate(specialDate);
    // Use the date as-is from the database (already in correct format)
    const dateObj = new Date(specialDate.date);
    const localDateString = dateObj.toISOString().split('T')[0];

    setFormData({
      title: specialDate.title,
      description: specialDate.description || '',
      date: localDateString,
      type: specialDate.type,
      isRecurring: specialDate.isRecurring,
      recurringType: specialDate.recurringType || 'yearly',
      color: specialDate.color,
      notificationEnabled: specialDate.notificationEnabled,
      notificationDaysBefore: specialDate.notificationDaysBefore
    });
    setShowForm(true);
  };

  const handleDelete = async (specialDateId) => {
    if (window.confirm('Are you sure you want to delete this special date?')) {
      try {
        await axios.delete(`/api/special-dates/${specialDateId}`);
        fetchSpecialDates();
      } catch (error) {
        console.error('Error deleting special date:', error);
      }
    }
  };

  const clearAllSpecialDates = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL special dates? This cannot be undone!')) {
      try {
        const response = await axios.delete('/api/special-dates');
        const { deletedCount } = response.data;

        fetchSpecialDates();

        alert(`✅ Successfully cleared ${deletedCount} special dates!`);
      } catch (error) {
        console.error('Error clearing special dates:', error);
        alert('Failed to clear special dates. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      type: 'other',
      isRecurring: false,
      recurringType: 'yearly',
      color: '#ff6b6b',
      notificationEnabled: false,
      notificationDaysBefore: 1
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setUTCHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  };

  const groupSpecialDatesByType = (dates) => {
    const grouped = {};
    dates.forEach(date => {
      if (!grouped[date.type]) {
        grouped[date.type] = [];
      }
      grouped[date.type].push(date);
    });
    return grouped;
  };

  const getUpcomingSpecialDates = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setUTCDate(thirtyDaysFromNow.getUTCDate() + 30);

    return specialDates.filter(date => {
      const dateObj = new Date(date.date);
      return dateObj >= today && dateObj <= thirtyDaysFromNow;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getTodaysSpecialDates = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    return specialDates.filter(date => {
      const dateObj = new Date(date.date);
      return dateObj >= today && dateObj < tomorrow;
    });
  };

  const filteredSpecialDates = filterType === 'all'
    ? specialDates
    : specialDates.filter(date => date.type === filterType);

  const groupedSpecialDates = groupSpecialDatesByType(filteredSpecialDates);
  const upcomingDates = getUpcomingSpecialDates();
  const todaysDates = getTodaysSpecialDates();

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading-spinner">
          <span>💕</span>
          <p>Loading your special dates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="calendar-title">
          Dates
        </h1>
        <div className="calendar-actions">
          <div className="view-toggle">
            <button
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <span>📋</span>
              All Dates
            </button>
            <button
              className={`btn ${viewMode === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('upcoming')}
            >
              <span>⏰</span>
              Upcoming
            </button>
          </div>
          <button
            className="btn btn-danger"
            onClick={clearAllSpecialDates}
            title="Clear all special dates"
          >
            <span>🗑️</span>
            Clear All
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <span>➕</span>
            Add Special Date
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDate ? 'Edit Special Date' : 'Add New Special Date'}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingDate(null);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="Special date title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {types.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <select
                    className="form-input"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  >
                    {colors.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.emoji} {color.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notification Days Before</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.notificationDaysBefore}
                    onChange={(e) => setFormData({...formData, notificationDaysBefore: parseInt(e.target.value)})}
                    min="0"
                    max="30"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                  />
                  Recurring event
                </label>
              </div>

              {formData.isRecurring && (
                <div className="form-group">
                  <label className="form-label">Recurring Type</label>
                  <select
                    className="form-input"
                    value={formData.recurringType}
                    onChange={(e) => setFormData({...formData, recurringType: e.target.value})}
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.notificationEnabled}
                    onChange={(e) => setFormData({...formData, notificationEnabled: e.target.checked})}
                  />
                  Enable notifications
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  setEditingDate(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDate ? 'Update Special Date' : 'Create Special Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming View */}
      {viewMode === 'upcoming' && (
        <div className="upcoming-view">
          {todaysDates.length > 0 && (
            <div className="today-section">
              <h2>🎉 Today's Special Dates</h2>
              <div className="event-list">
                {todaysDates.map(date => (
                  <div
                    key={date._id}
                    className="event-card"
                    style={{ borderLeftColor: date.color }}
                  >
                    <div className="event-header">
                      <h3 className="event-title">{date.title}</h3>
                      <div className="event-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(date)}
                          title="Edit special date"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(date._id)}
                          title="Delete special date"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="event-details">
                      <p className="event-type">{types.find(t => t.value === date.type)?.emoji} {types.find(t => t.value === date.type)?.label}</p>
                      {date.description && (
                        <p className="event-description">{date.description}</p>
                      )}
                      {date.isRecurring && (
                        <p className="event-recurring">🔄 Recurring {date.recurringType}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingDates.length > 0 && (
            <div className="upcoming-section">
              <h2>⏰ Upcoming Special Dates (Next 30 Days)</h2>
              <div className="event-list">
                {upcomingDates.map(date => (
                  <div
                    key={date._id}
                    className="event-card"
                    style={{ borderLeftColor: date.color }}
                  >
                    <div className="event-header">
                      <h3 className="event-title">{date.title}</h3>
                      <span className="days-until">{getDaysUntil(date.date)}</span>
                      <div className="event-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(date)}
                          title="Edit special date"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(date._id)}
                          title="Delete special date"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="event-details">
                      <p className="event-date">{formatDate(date.date)}</p>
                      <p className="event-type">{types.find(t => t.value === date.type)?.emoji} {types.find(t => t.value === date.type)?.label}</p>
                      {date.description && (
                        <p className="event-description">{date.description}</p>
                      )}
                      {date.isRecurring && (
                        <p className="event-recurring">🔄 Recurring {date.recurringType}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todaysDates.length === 0 && upcomingDates.length === 0 && (
            <div className="no-events">
              <span className="emoji">🎉</span>
              <h3>No upcoming special dates</h3>
              <p>Add some special dates to see them here!</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="events-container">
          <div className="filter-controls">
            <label className="form-label">Filter by type:</label>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>

          {Object.keys(groupedSpecialDates).length === 0 ? (
            <div className="no-events">
              <span className="emoji">📅</span>
              <h3>No special dates yet</h3>
              <p>Click "Add Special Date" to create your first special date!</p>
            </div>
          ) : (
            Object.entries(groupedSpecialDates).map(([type, dates]) => (
              <div key={type} className="event-day">
                <h2 className="event-date">
                  {types.find(t => t.value === type)?.emoji} {types.find(t => t.value === type)?.label} ({dates.length})
                </h2>
                <div className="event-list">
                  {dates.map(date => (
                    <div
                      key={date._id}
                      className="event-card"
                      style={{ borderLeftColor: date.color }}
                    >
                      <div className="event-header">
                        <h3 className="event-title">{date.title}</h3>
                        <span className="days-until">{getDaysUntil(date.date)}</span>
                        <div className="event-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(date)}
                            title="Edit special date"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(date._id)}
                            title="Delete special date"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="event-details">
                        <p className="event-date">{formatDate(date.date)}</p>
                        {date.description && (
                          <p className="event-description">{date.description}</p>
                        )}
                        {date.isRecurring && (
                          <p className="event-recurring">🔄 Recurring {date.recurringType}</p>
                        )}
                        {date.notificationEnabled && (
                          <p className="event-notification">🔔 Notification: {date.notificationDaysBefore} days before</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating hearts */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">💖</div>
    </div>
  );
};

export default SpecialDates;
