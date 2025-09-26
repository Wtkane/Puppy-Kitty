import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import TodoList from './components/TodoList';
import Profile from './components/Profile';
import SpecialDates from './components/SpecialDates';
import Goals from './components/Goals';
import Habits from './components/Habits';

// OAuth Callback Component
const OAuthCallback = ({ onLogin }) => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get user info
      axios.get('/api/auth/me')
        .then(response => {
          onLogin(response.data, token);
          window.location.href = '/dashboard';
        })
        .catch(error => {
          console.error('Error getting user info:', error);
          window.location.href = '/login';
        });
    } else {
      window.location.href = '/login';
    }
  }, [onLogin]);

  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <span className="heart">💕</span>
        <p>Authenticating with Google...</p>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <span className="heart">💕</span>
          <p>Loading Puppy & Kitty...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className="main-content">
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/calendar"
              element={user ? <Calendar user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/todos"
              element={user ? <TodoList user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/special-dates"
              element={user ? <SpecialDates user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/goals"
              element={user ? <Goals user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/habits"
              element={user ? <Habits user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />}
            />
            <Route
              path="/auth/callback"
              element={<OAuthCallback onLogin={handleLogin} />}
            />
            <Route
              path="/auth/google/callback"
              element={<OAuthCallback onLogin={handleLogin} />}
            />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
