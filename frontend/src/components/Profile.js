import React, { useState } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ user, setUser, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });
  const [colorData, setColorData] = useState({
    primaryColor: user.primaryColor || '#ff6b6b',
    secondaryColor: user.secondaryColor || '#4ecdc4'
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

  const handleColorChange = (e) => {
    setColorData({
      ...colorData,
      [e.target.name]: e.target.value
    });
  };

  const handleColorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Update user color preferences
      const response = await axios.put(`/api/auth/colors`, colorData);
      setUser(response.data);
      // Update CSS custom properties globally
      document.documentElement.style.setProperty('--primary-color', colorData.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', colorData.secondaryColor);
      setMessage('Color preferences updated successfully! 🎨');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update color preferences');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      // Update user profile
      const response = await axios.put(`/api/auth/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

        {/* Color Customization */}
        <div className="profile-section color-customization-section">
          <div className="section-header color-section-header">
            <h2 className="section-title color-section-title">
              <span className="emoji">🎨</span>
              Color Preferences
            </h2>
            <p className="section-subtitle">Customize your app's color theme</p>
          </div>

          <form onSubmit={handleColorSubmit} className="profile-form color-form">
            <div className="simple-color-pickers">
              <div className="color-picker-item">
                <label htmlFor="primaryColor">Primary Color:</label>
                <div className="color-input-row">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={colorData.primaryColor}
                    onChange={handleColorChange}
                  />
                  <input
                    type="text"
                    className="color-text-input"
                    value={colorData.primaryColor}
                    onChange={handleColorChange}
                    name="primaryColor"
                    placeholder="#ff6b6b"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label htmlFor="secondaryColor">Secondary Color:</label>
                <div className="color-input-row">
                  <input
                    type="color"
                    id="secondaryColor"
                    name="secondaryColor"
                    value={colorData.secondaryColor}
                    onChange={handleColorChange}
                  />
                  <input
                    type="text"
                    className="color-text-input"
                    value={colorData.secondaryColor}
                    onChange={handleColorChange}
                    name="secondaryColor"
                    placeholder="#4ecdc4"
                  />
                </div>
              </div>
            </div>

            <div className="color-preview">
              <h3>Live Preview</h3>
              <div className="preview-navbar" style={{
                background: `linear-gradient(135deg, ${colorData.primaryColor} 0%, ${colorData.secondaryColor} 100%)`,
                height: '50px',
                borderRadius: '10px',
                marginBottom: '1rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
              </div>
              <div className="preview-buttons">
                <button
                  type="button"
                  className="btn btn-preview-primary"
                  style={{ backgroundColor: colorData.primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="btn btn-preview-secondary"
                  style={{ backgroundColor: colorData.secondaryColor }}
                >
                  Secondary Button
                </button>
              </div>
            </div>

            <div className="color-update-section">
              <button
                type="submit"
                className="btn btn-primary color-update-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner">🎨</span>
                    <span>Updating Colors...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✨</span>
                    <span>Update Color Theme</span>
                  </>
                )}
              </button>
              <p className="update-description">Your color preferences will be saved and applied immediately</p>
            </div>
          </form>
        </div>

        {/* Account Stats */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">�</span>
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

        {/* Account Actions */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="emoji">⚙️</span>
              Account Actions
            </h2>
          </div>

          <div className="account-actions">
            <button
              className="btn btn-danger logout-btn"
              onClick={onLogout}
            >
              <span>🚪</span>
              Log Out
            </button>
            <p className="logout-description">
              Sign out of your account. You'll need to log in again to access your data.
            </p>
          </div>
        </div>

      </div>

      {/* Floating hearts */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">�</div>
      <div className="heart-decoration">💗</div>
      <div className="heart-decoration">�</div>
    </div>
  );
};

export default Profile;
