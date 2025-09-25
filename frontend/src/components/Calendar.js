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
  }, []);

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
          <span className="emoji">📅</span>
          Shared Calendar
          <span className="emoji">💕</span>
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <span>➕</span>
          Add Event
        </button>
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
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Floating hearts */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">💖</div>
    </div>
  );
};

export default Calendar;
