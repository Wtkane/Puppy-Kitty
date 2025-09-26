import React, { useState } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Update user profile
      const response = await axios.put(`/api/auth/profile`, formData);
      setUser(response.data);
      setMessage('Profile updated successfully! 💕');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const passwordData = {
      currentPassword: e.target.currentPassword.value,
      newPassword: e.target.newPassword.value,
      confirmPassword: e.target.confirmPassword.value
    };

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      await axios.put('/api/auth/change-password', passwordData);
      setMessage('Password changed successfully! 🔐');
      setMessageType('success');
      e.target.reset();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to change password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">
          <span className="emoji">👤</span>
          Your Profile
          <span className="emoji">✨</span>
        </h1>
        <p className="profile-subtitle">Manage your account settings</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
          {message}
        </div>
      )}

      <div className="profile-content">
        {/* Profile Information */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">📝</span>
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner">💕</span>
                  Updating...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Update Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">🔐</span>
              Change Password
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                className="form-input"
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="form-input"
                required
                minLength="6"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                required
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner">💕</span>
                  Changing...
                </>
              ) : (
                <>
                  <span>🔑</span>
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Account Stats */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">📊</span>
              Account Statistics
            </h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>Member Since</h3>
                <p>{new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💌</div>
              <div className="stat-info">
                <h3>Email</h3>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎭</div>
              <div className="stat-info">
                <h3>Role</h3>
                <p>Shared Account User</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">🎯</span>
              Goals
            </h2>
          </div>

          <div className="goals-content">
            <div className="goal-item">
              <div className="goal-icon">💪</div>
              <div className="goal-info">
                <h3>Stay Active</h3>
                <p>Complete 3 workouts per week</p>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '75%'}}></div>
                  </div>
                  <span className="progress-text">75%</span>
                </div>
              </div>
            </div>

            <div className="goal-item">
              <div className="goal-icon">📚</div>
              <div className="goal-info">
                <h3>Learn Something New</h3>
                <p>Read 2 books this month</p>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '50%'}}></div>
                  </div>
                  <span className="progress-text">50%</span>
                </div>
              </div>
            </div>

            <div className="goal-item">
              <div className="goal-icon">💰</div>
              <div className="goal-info">
                <h3>Save Money</h3>
                <p>Save $500 this month</p>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '30%'}}></div>
                  </div>
                  <span className="progress-text">30%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Habits */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">🔄</span>
              Habits
            </h2>
          </div>

          <div className="habits-content">
            <div className="habit-item">
              <div className="habit-icon">🧘</div>
              <div className="habit-info">
                <h3>Daily Meditation</h3>
                <p>10 minutes of mindfulness</p>
                <div className="habit-streak">
                  <span className="streak-number">7</span>
                  <span className="streak-label">day streak</span>
                </div>
              </div>
            </div>

            <div className="habit-item">
              <div className="habit-icon">💧</div>
              <div className="habit-info">
                <h3>Drink Water</h3>
                <p>8 glasses per day</p>
                <div className="habit-streak">
                  <span className="streak-number">12</span>
                  <span className="streak-label">day streak</span>
                </div>
              </div>
            </div>

            <div className="habit-item">
              <div className="habit-icon">📝</div>
              <div className="habit-info">
                <h3>Journal Writing</h3>
                <p>Write for 5 minutes daily</p>
                <div className="habit-streak">
                  <span className="streak-number">3</span>
                  <span className="streak-label">day streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fun Facts */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">🎉</span>
              Fun Facts
            </h2>
          </div>

          <div className="fun-facts">
            <div className="fact-item">
              <span className="fact-emoji">🐶</span>
              <p>You're part of the Puppy & Kitty family!</p>
            </div>
            <div className="fact-item">
              <span className="fact-emoji">💕</span>
              <p>You've been sharing moments with your loved one</p>
            </div>
            <div className="fact-item">
              <span className="fact-emoji">✨</span>
              <p>Every event and todo brings you closer together</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating hearts */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">💖</div>
      <div className="heart-decoration">💗</div>
      <div className="heart-decoration">💓</div>
    </div>
  );
};

export default Profile;
