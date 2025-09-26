import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Calendar.css';

const Calendar = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    color: '#ff6b6b',
    isAllDay: false
  });
  const [googleEvents, setGoogleEvents] = useState([]);
  const [showGoogleSync, setShowGoogleSync] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

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
    fetchEvents();
    fetchGoogleEvents();
  }, []);

  const fetchGoogleEvents = async () => {
    try {
      const response = await axios.get('/api/calendar/google/events');
      setGoogleEvents(response.data);
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
    }
  };

  const syncGoogleEvents = async () => {
    try {
      const response = await axios.post('/api/calendar/google/sync');
      const { newEvents, updatedEvents, deletedEvents, errors } = response.data;

      fetchEvents(); // Refresh local events after sync

      // Show detailed sync results
      let message = `Google Calendar synced successfully!\n\n`;
      message += `✅ New events: ${newEvents}\n`;
      message += `🔄 Updated events: ${updatedEvents}\n`;
      message += `🗑️ Deleted events: ${deletedEvents}`;

      if (errors && errors.length > 0) {
        message += `\n\n⚠️ ${errors.length} events had issues (check console for details)`;
        console.warn('Sync errors:', errors);
      }

      alert(message);
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      alert('Failed to sync Google Calendar');
    }
  };

  const createGoogleEvent = async (eventData) => {
    try {
      const startDateTime = `${eventData.date}T${eventData.startTime}:00`;
      const endDateTime = `${eventData.date}T${eventData.endTime}:00`;

      await axios.post('/api/calendar/google/events', {
        summary: eventData.title,
        description: eventData.description,
        start: startDateTime,
        end: endDateTime,
        location: ''
      });

      alert('Event created in Google Calendar!');
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      alert('Failed to create event in Google Calendar');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/calendar');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        await axios.put(`/api/calendar/${editingEvent._id}`, formData);
      } else {
        await axios.post('/api/calendar', formData);
      }

      setShowForm(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date).toISOString().split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      color: event.color,
      isAllDay: event.isAllDay
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/calendar/${eventId}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const clearAllEvents = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL events? This cannot be undone!')) {
      try {
        const response = await axios.delete('/api/calendar');
        const { deletedCount } = response.data;

        fetchEvents(); // Refresh the events list

        alert(`✅ Successfully cleared ${deletedCount} events! Your calendar is now clean.`);
      } catch (error) {
        console.error('Error clearing events:', error);
        alert('Failed to clear events. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      color: '#ff6b6b',
      isAllDay: false
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupEventsByDate = (events) => {
    const grouped = {};
    events.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate(events);

  // Calendar grid helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date) => {
    const dateString = date.toDateString();
    return events.filter(event => {
      const eventDate = new Date(event.date).toDateString();
      return eventDate === dateString;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
      const day = prevMonth.getDate() - firstDay + i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      days.push(
        <div key={`empty-${i}`} className="calendar-day other-month">
          <span className="day-number">{day}</span>
        </div>
      );
    }

    // Add cells for each day of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isCurrentMonth(date) ? 'current-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number">{day}</span>
          {dayEvents.length > 0 && (
            <div className="day-events">
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={event._id}
                  className="day-event"
                  style={{ backgroundColor: event.color }}
                  title={event.title}
                >
                  {event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="day-event more-events" title={`${dayEvents.length - 3} more events`}>
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Add empty cells for days after the last day of the month to fill the grid
    const totalCells = days.length;
    const remainingCells = 42 - totalCells; // 6 weeks * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push(
        <div key={`next-${i}`} className="calendar-day other-month">
          <span className="day-number">{i}</span>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading-spinner">
          <span>💕</span>
          <p>Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="calendar-title">
          Calendar
        </h1>
        <div className="calendar-actions">
          <div className="view-toggle">
            <button
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <span>📋</span>
              List View
            </button>
            <button
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('calendar')}
            >
              <span>📅</span>
              Calendar View
            </button>
          </div>
          <button
            className="btn btn-secondary"
            onClick={syncGoogleEvents}
            title="Sync Google Calendar events"
          >
            <span>🔄</span>
            Sync Google
          </button>
          <button
            className="btn btn-danger"
            onClick={clearAllEvents}
            title="Clear all events"
          >
            <span>🗑️</span>
            Clear All
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <span>➕</span>
            Add Event
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
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
                  placeholder="Event title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Event description (optional)"
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({...formData, isAllDay: e.target.checked})}
                  />
                  All day event
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <div className="form-actions-right">
                  <button
                    type="button"
                    className="btn btn-google"
                    onClick={() => createGoogleEvent(formData)}
                    disabled={!formData.title || !formData.date || !formData.startTime || !formData.endTime}
                  >
                    <span>📅</span>
                    Add to Google
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-navigation">
            <button className="btn btn-secondary" onClick={() => navigateMonth(-1)}>
              <span>⬅️</span> Previous
            </button>
            <div className="calendar-title-nav">
              <h2>{formatMonthYear(currentDate)}</h2>
              <button className="btn btn-small btn-primary" onClick={goToToday}>
                Today
              </button>
            </div>
            <button className="btn btn-secondary" onClick={() => navigateMonth(1)}>
              Next <span>➡️</span>
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-header-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-days">
              {renderCalendarGrid()}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="selected-date-events">
              <h3>Events for {formatDate(selectedDate)}</h3>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="no-events-message">No events scheduled for this day</p>
              ) : (
                <div className="event-list">
                  {getEventsForDate(selectedDate).map(event => (
                    <div
                      key={event._id}
                      className="event-card"
                      style={{ borderLeftColor: event.color }}
                    >
                      <div className="event-header">
                        <h4 className="event-title">{event.title}</h4>
                        <div className="event-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(event)}
                            title="Edit event"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(event._id)}
                            title="Delete event"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="event-details">
                        <p className="event-time">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          {event.isAllDay && ' (All day)'}
                        </p>
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
                        <p className="event-creator">Created by {event.createdBy.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="events-container">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="no-events">
              <span className="emoji">📅</span>
              <h3>No events yet</h3>
              <p>Click "Add Event" to create your first shared event!</p>
            </div>
          ) : (
            Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
              <div key={dateKey} className="event-day">
                <h2 className="event-date">{formatDate(dateKey)}</h2>
                <div className="event-list">
                  {dayEvents.map(event => (
                    <div
                      key={event._id}
                      className="event-card"
                      style={{ borderLeftColor: event.color }}
                    >
                      <div className="event-header">
                        <h3 className="event-title">{event.title}</h3>
                        <div className="event-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(event)}
                            title="Edit event"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(event._id)}
                            title="Delete event"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="event-details">
                        <p className="event-time">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          {event.isAllDay && ' (All day)'}
                        </p>
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
                        <p className="event-creator">Created by {event.createdBy.name}</p>
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

export default Calendar;
