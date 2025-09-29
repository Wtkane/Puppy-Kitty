import React, { useState, useEffect } from 'react';
import './Diary.css';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedWeather, setSelectedWeather] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);

  // Mood options
  const moodOptions = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😤', label: 'Frustrated' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '🤔', label: 'Thoughtful' },
    { emoji: '😍', label: 'Loving' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😤', label: 'Angry' },
    { emoji: '🤗', label: 'Grateful' },
    { emoji: '😴', label: 'Peaceful' },
    { emoji: '💪', label: 'Motivated' }
  ];

  // Weather options
  const weatherOptions = [
    { emoji: '☀️', label: 'Sunny' },
    { emoji: '⛅', label: 'Partly Cloudy' },
    { emoji: '☁️', label: 'Cloudy' },
    { emoji: '🌧️', label: 'Rainy' },
    { emoji: '⛈️', label: 'Stormy' },
    { emoji: '❄️', label: 'Snowy' },
    { emoji: '🌈', label: 'Rainbow' },
    { emoji: '🌪️', label: 'Windy' },
    { emoji: '🌫️', label: 'Foggy' },
    { emoji: '⚡', label: 'Lightning' }
  ];

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('diaryEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = () => {
    if (!currentEntry.trim()) return;

    const newEntry = {
      id: Date.now(),
      date: selectedDate,
      content: currentEntry,
      mood: selectedMood,
      weather: selectedWeather,
      images: attachedImages,
      timestamp: new Date().toISOString()
    };

    if (isEditing && editingId) {
      // Update existing entry
      setEntries(entries.map(entry =>
        entry.id === editingId
          ? { ...entry, content: currentEntry, date: selectedDate, mood: selectedMood, weather: selectedWeather, images: attachedImages }
          : entry
      ));
      setIsEditing(false);
      setEditingId(null);
    } else {
      // Add new entry
      setEntries([newEntry, ...entries]);
    }

    // Reset form
    setCurrentEntry('');
    setSelectedMood('');
    setSelectedWeather('');
    setAttachedImages([]);
  };

  const handleEditEntry = (entry) => {
    setCurrentEntry(entry.content);
    setSelectedDate(entry.date);
    setIsEditing(true);
    setEditingId(entry.id);
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImages).then(images => {
      setAttachedImages([...attachedImages, ...images]);
    });
  };

  const removeImage = (index) => {
    setAttachedImages(attachedImages.filter((_, i) => i !== index));
  };

  const filteredEntries = entries.filter(entry => entry.date === selectedDate);

  // Get the 3 most recent entries
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  return (
    <div className="diary-container">
      <div className="diary-header">
        <h1>My Diary</h1>
        <p>Record your thoughts, experiences, and reflections</p>
      </div>

      <div className="diary-content">
        {/* Entry Form */}
        <div className="diary-form-section">
          <div className="date-selector">
            <label htmlFor="entry-date">Date:</label>
            <input
              type="date"
              id="entry-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>

          {/* Mood and Weather Selection */}
          <div className="mood-weather-section">
            <div className="mood-selector">
              <label htmlFor="mood-select">How are you feeling?</label>
              <select
                id="mood-select"
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="mood-select"
              >
                <option value="">Select your mood...</option>
                {moodOptions.map((mood, index) => (
                  <option key={index} value={mood.emoji}>
                    {mood.emoji} {mood.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="weather-selector">
              <label htmlFor="weather-select">What's the weather like?</label>
              <select
                id="weather-select"
                value={selectedWeather}
                onChange={(e) => setSelectedWeather(e.target.value)}
                className="weather-select"
              >
                <option value="">Select weather...</option>
                {weatherOptions.map((weather, index) => (
                  <option key={index} value={weather.emoji}>
                    {weather.emoji} {weather.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="image-upload-section">
            <label>Attach Photos (Optional)</label>
            <div className="image-upload-container">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="image-input"
              />
              <label htmlFor="image-upload" className="image-upload-label">
                📷 Choose Images
              </label>
            </div>

            {attachedImages.length > 0 && (
              <div className="attached-images">
                {attachedImages.map((image, index) => (
                  <div key={index} className="attached-image-container">
                    <img
                      src={image}
                      alt={`Attached ${index + 1}`}
                      className="attached-image"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="entry-form">
            <textarea
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              placeholder="Write about your day, thoughts, or anything on your mind..."
              className="entry-textarea"
              rows={8}
            />
            <div className="form-actions">
              <button
                onClick={handleSaveEntry}
                disabled={!currentEntry.trim()}
                className="save-btn"
              >
                {isEditing ? 'Update Entry' : 'Save Entry'}
              </button>
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    setCurrentEntry('');
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Entries Section */}
        {recentEntries.length > 0 && (
          <div className="recent-entries-section">
            <h2>📚 Recent Entries</h2>
            <div className="recent-entries-list">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="recent-entry-card">
                <div className="recent-entry-header">
                  <span className="recent-entry-date">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                    {(entry.mood || entry.weather) && (
                      <span className="recent-entry-indicators">
                        {entry.mood && <span className="entry-mood" title="Mood">{entry.mood}</span>}
                        {entry.weather && <span className="entry-weather" title="Weather">{entry.weather}</span>}
                      </span>
                    )}
                  </span>
                  <span className="recent-entry-time">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                  <div className="recent-entry-content">
                    {entry.content.length > 100
                      ? `${entry.content.substring(0, 100)}...`
                      : entry.content
                    }
                  </div>
                  <div className="recent-entry-actions">
                    <button
                      onClick={() => {
                        setSelectedDate(entry.date);
                        setCurrentEntry(entry.content);
                        setIsEditing(true);
                        setEditingId(entry.id);
                      }}
                      className="recent-edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setViewingEntry(entry)}
                      className="recent-view-btn"
                    >
                      View Full
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed View Card */}
        {viewingEntry && (
          <div className="entry-detail-view">
            <div className="entry-detail-card">
              <div className="entry-detail-header">
                <h3>
                  {new Date(viewingEntry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <button
                  className="close-detail-btn"
                  onClick={() => setViewingEntry(null)}
                >
                  ×
                </button>
              </div>

              <div className="entry-detail-meta">
                <span className="entry-detail-time">
                  {new Date(viewingEntry.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {(viewingEntry.mood || viewingEntry.weather) && (
                  <div className="entry-detail-indicators">
                    {viewingEntry.mood && (
                      <span className="entry-detail-mood" title="Mood">
                        {viewingEntry.mood}
                      </span>
                    )}
                    {viewingEntry.weather && (
                      <span className="entry-detail-weather" title="Weather">
                        {viewingEntry.weather}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {viewingEntry.images && viewingEntry.images.length > 0 && (
                <div className="entry-detail-images">
                  {viewingEntry.images.map((image, index) => (
                    <div key={index} className="entry-detail-image-container">
                      <img
                        src={image}
                        alt={`Diary entry ${index + 1}`}
                        className="entry-detail-image"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="entry-detail-content">
                {viewingEntry.content}
              </div>

              <div className="entry-detail-actions">
                <button
                  onClick={() => {
                    setViewingEntry(null);
                    handleEditEntry(viewingEntry);
                  }}
                  className="edit-from-detail-btn"
                >
                  ✏️ Edit Entry
                </button>
                <button
                  onClick={() => setViewingEntry(null)}
                  className="close-detail-action-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diary;
