import React, { useState } from 'react';
import './LeftMenu.css';
import GroupManagement from './GroupManagement';

const LeftMenu = ({ isOpen, onClose, user }) => {
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  return (
    <>
      {/* Overlay */}
      <div
        className={`left-menu-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      {/* Menu */}
      <div className={`left-menu ${isOpen ? 'open' : ''}`}>
        <div className="left-menu-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="left-menu-content">
          {/* Dates Section */}
          <div className="menu-section">
            <h3 className="menu-section-title">
              📅 Dates
            </h3>
            <div className="menu-section-content">
              <a href="/calendar" className="menu-item" onClick={onClose}>
                <span className="menu-icon">📅</span>
                <span>Calendar</span>
              </a>
              <a href="/special-dates" className="menu-item" onClick={onClose}>
                <span className="menu-icon">💕</span>
                <span>Special Dates</span>
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="menu-section">
            <h3 className="menu-section-title">
              ⚡ Quick Actions
            </h3>
            <div className="menu-section-content">
              <a href="/todos" className="menu-item" onClick={onClose}>
                <span className="menu-icon">✅</span>
                <span>Todos</span>
              </a>
              <a href="/habits" className="menu-item" onClick={onClose}>
                <span className="menu-icon">🔥</span>
                <span>Habits</span>
              </a>
              <a href="/goals" className="menu-item" onClick={onClose}>
                <span className="menu-icon">🎯</span>
                <span>Goals</span>
              </a>
              <a href="/focus" className="menu-item" onClick={onClose}>
                <span className="menu-icon">🎧</span>
                <span>Focus</span>
              </a>
            </div>
          </div>

          {/* Groups Section */}
          {user && (
            <div className="menu-section">
              <h3 className="menu-section-title">
                👥 Groups
              </h3>
              <div className="menu-section-content">
                <button 
                  className="menu-item menu-button" 
                  onClick={() => setShowGroupManagement(true)}
                >
                  <span className="menu-icon">👥</span>
                  <span>Manage Groups</span>
                </button>
              </div>
            </div>
          )}

          {/* User Section */}
          {user && (
            <div className="menu-section">
              <h3 className="menu-section-title">
                👤 Account
              </h3>
              <div className="menu-section-content">
                <a href="/profile" className="menu-item" onClick={onClose}>
                  <span className="menu-icon">⚙️</span>
                  <span>Profile Settings</span>
                </a>
                <div className="user-info-small">
                  <div className="user-avatar-small">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-details-small">
                    <div className="user-name">{user.name || 'User'}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group Management Modal */}
      {showGroupManagement && (
        <GroupManagement 
          onClose={() => setShowGroupManagement(false)} 
        />
      )}
    </>
  );
};

export default LeftMenu;
