import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', formData);
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Google Identity Services
    if (window.google && window.google.accounts) {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: '637473926715-isfgma51aiq5o9ddg8hq9c8q4hf7fubo.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events',
        ux_mode: 'popup',
        callback: handleGoogleCallback,
      });

      // Store client globally for button click
      window.googleClient = client;
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    if (response.code) {
      setLoading(true);
      setError('');

      try {
        // Send code to backend to exchange for tokens
        const result = await api.post('/api/auth/google/exchange', {
          code: response.code
        });

        if (result.data.token) {
          onLogin(result.data.user, result.data.token);
        }
      } catch (error) {
        setError('Google Sign-In failed');
        setLoading(false);
      }
    } else {
      setError('Google Sign-In was cancelled');
    }
  };

  const handleGoogleSignIn = () => {
    if (window.googleClient) {
      window.googleClient.requestCode();
    } else {
      setError('Google Sign-In is not ready yet');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            <span className="emoji">🐶</span>
            Welcome Back
            <span className="emoji">🐱</span>
          </h1>
          <p className="auth-subtitle">Sign in to your Puppy & Kitty account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

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

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner">💕</span>
                Signing In...
              </>
            ) : (
              <>
                <span>🚪</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-signin-container">
          <button
            onClick={handleGoogleSignIn}
            className="google-login-btn"
            disabled={loading}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{marginRight: '8px'}}>
              <path fill="#4285F4" d="M16.51 8.25h-6.01v2.25h3.32c-.14 1.24-.57 2.29-1.21 3.35l1.85 1.43c1.08-1 2.07-2.44 2.07-4.03z"/>
              <path fill="#34A853" d="M9.5 16.5c1.61 0 3.06-.52 4.17-1.41l-1.85-1.43c-.51.34-1.17.54-2.32.54-1.79 0-3.3-1.21-3.84-2.83l-1.93 1.49C4.74 14.97 7.05 16.5 9.5 16.5z"/>
              <path fill="#FBBC05" d="M5.66 10.67c-.14-.42-.22-.87-.22-1.33s.08-.91.22-1.33L3.73 6.52C3.28 7.47 3 8.58 3 9.84s.28 2.37.73 3.32l1.93-1.49z"/>
              <path fill="#EA4335" d="M9.5 5.34c1.01 0 1.91.34 2.62.99l1.97-1.97C12.98 3.28 11.53 2.5 9.5 2.5 7.05 2.5 4.74 4.03 3.73 6.14l1.93 1.49c.54-1.62 2.05-2.83 3.84-2.83z"/>
            </svg>
            {loading ? 'Signing In...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one here 💝
            </Link>
          </p>
        </div>
      </div>

      {/* Floating hearts decoration */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">💖</div>
      <div className="heart-decoration">💗</div>
    </div>
  );
};

export default Login;
