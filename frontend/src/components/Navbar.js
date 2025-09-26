import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="emoji">🐶</span>
        <span>Puppy & Kitty</span>
        <span className="emoji">🐱</span>
      </div>

      <ul className="navbar-nav">
        <li>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            <span>🏠</span>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/calendar" className={isActive('/calendar')}>
            <span>📅</span>
            Calendar
          </Link>
        </li>
        <li>
          <Link to="/todos" className={isActive('/todos')}>
            <span>✅</span>
            Todos
          </Link>
        </li>
        <li>
          <Link to="/special-dates" className={isActive('/special-dates')}>
            <span>🎉</span>
            Dates
          </Link>
        </li>
        <li>
          <Link to="/profile" className={isActive('/profile')}>
            <span>👤</span>
            Profile
          </Link>
        </li>
      </ul>

      <div className="user-info">
        <div className="user-avatar">
          {user.avatar && user.avatar.startsWith('http') ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <span>Welcome, {user.name}! 💕</span>
        <button className="logout-btn" onClick={onLogout}>
          <span>🚪</span>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
