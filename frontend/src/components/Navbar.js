import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout, onMenuToggle, isMenuOpen }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav
      className="navbar"
      style={{
        '--primary-color': user.primaryColor || '#ff6b6b',
        '--secondary-color': user.secondaryColor || '#4ecdc4'
      }}
    >
      <div className="navbar-left">
        <button
          className="hamburger-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
        </button>
      </div>

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

        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
