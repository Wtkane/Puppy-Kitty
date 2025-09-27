import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <nav
      className="navbar"
      style={{
        '--primary-color': user.primaryColor || '#ff6b6b',
        '--secondary-color': user.secondaryColor || '#4ecdc4'
      }}
    >
      <div className="navbar-brand">
        <span className="emoji">🐶</span>
        <span>Puppy & Kitty</span>
        <span className="emoji">🐱</span>
      </div>

      <div className="navbar-right">
        <ul className="navbar-nav">
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/calendar" className={isActive('/calendar')}>
              Calendar
            </Link>
          </li>
          <li>
            <Link to="/todos" className={isActive('/todos')}>
              Todos
            </Link>
          </li>
          <li>
            <Link to="/focus" className={isActive('/focus')}>
              Focus
            </Link>
          </li>
          <li>
            <Link to="/goals" className={isActive('/goals')}>
              Goals
            </Link>
          </li>
          <li>
            <Link to="/habits" className={isActive('/habits')}>
              Habits
            </Link>
          </li>
          <li>
            <Link to="/special-dates" className={isActive('/special-dates')}>
              Dates
            </Link>
          </li>
        </ul>

        <div className="user-info">
          <div className="user-avatar" onClick={toggleDropdown}>
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
        </div>
      </div>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            Account Menu
          </div>
          <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
            <span>👤</span>
            Edit Profile
          </Link>
          <button className="dropdown-item logout-item" onClick={() => { closeDropdown(); onLogout(); }}>
            <span>🚪</span>
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
