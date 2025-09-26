import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTodos: 0,
    completedTodos: 0,
    upcomingEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentTodos, setRecentTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [eventsRes, todosRes] = await Promise.all([
        axios.get('/api/calendar'),
        axios.get('/api/todos/my-todos')
      ]);

      const events = eventsRes.data;
      const todos = todosRes.data;

      // Calculate stats
      const now = new Date();
      // Create today's date at start of day in local time
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Debug logging
      console.log('Current time:', now.toISOString());
      console.log('Today start:', today.toISOString());
      console.log('Tomorrow start:', tomorrow.toISOString());
      console.log('Total events from API:', events.length);
      events.forEach(event => {
        console.log('Event date:', event.date, 'Event title:', event.title);
      });

      // Filter events to only include current user's events
      const userEvents = events.filter(event => event.createdBy._id === user._id);

      const todaysEvents = userEvents.filter(event => {
        const eventDate = new Date(event.date);
        // Compare date parts only (YYYY-MM-DD) to avoid timezone issues
        const eventDateString = eventDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        const isToday = eventDateString === todayString;
        console.log(`Event "${event.title}" date: ${eventDate.toISOString()}, dateString: ${eventDateString}, todayString: ${todayString}, isToday: ${isToday}`);
        return isToday;
      }).length;

      console.log('Todays events count:', todaysEvents);

      const completedTodos = todos.filter(todo => todo.completed).length;
      const completionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

      setStats({
        totalEvents: todaysEvents, // Changed to show remaining events today instead of total
        totalTodos: todos.length,
        completedTodos,
        upcomingEvents: todaysEvents,
        completionRate
      });

      // Get upcoming events (next 5 events, sorted by date) - only current user's events
      const currentTime = new Date();
      const currentDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
      const upcomingEventsList = userEvents
        .filter(event => new Date(event.date) >= currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

      // Get recent items (last 5, but show only 3)
      setRecentEvents(upcomingEventsList);
      setRecentTodos(todos.slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <span>💕</span>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          <span className="emoji">👋</span>
          Welcome back, {user.name}!
          <span className="emoji">💕</span>
        </h1>
        <p className="welcome-subtitle">
          Here's what's happening in your Puppy & Kitty world today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card events">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalEvents}</h3>
            <p>Remaining Events Today</p>
          </div>
        </div>

        <div className="stat-card todos">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.totalTodos}</h3>
            <p>Total Todos</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <h3>{stats.completedTodos}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card upcoming">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.upcomingEvents}</h3>
            <p>Upcoming</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">
          <span className="emoji">⚡</span>
          Quick Actions
        </h2>
        <div className="actions-grid">
          <Link to="/calendar" className="action-card calendar">
            <div className="action-icon">📅</div>
            <h3>Add Event</h3>
            <p>Schedule something special</p>
          </Link>

          <Link to="/todos" className="action-card todos">
            <div className="action-icon">✅</div>
            <h3>Add Todo</h3>
            <p>Create a new task</p>
          </Link>

          <Link to="/calendar" className="action-card view-calendar">
            <div className="action-icon">👀</div>
            <h3>View Calendar</h3>
            <p>See all your events</p>
          </Link>

          <Link to="/todos" className="action-card view-todos">
            <div className="action-icon">📋</div>
            <h3>View Todos</h3>
            <p>Check your tasks</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h2 className="section-title">
            <span className="emoji">🕐</span>
            Upcoming Events
          </h2>
          {recentEvents.length > 0 ? (
            <div className="activity-list">
              {recentEvents.map(event => (
                <div key={event._id} className="activity-item">
                  <div className="activity-icon">📅</div>
                  <div className="activity-content">
                    <h4>{event.title}</h4>
                    <p>{formatDate(event.date)} at {formatTime(event.startTime)}</p>
                    {event.description && <p className="activity-desc">{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-activity">No upcoming events. <Link to="/calendar">Add your first event!</Link></p>
          )}
        </div>

        <div className="activity-section">
          <h2 className="section-title">
            <span className="emoji">📝</span>
            Recent Todos
          </h2>
          {recentTodos.length > 0 ? (
            <div className="activity-list">
              {recentTodos.map(todo => (
                <div key={todo._id} className="activity-item">
                  <div className="activity-icon">✅</div>
                  <div className="activity-content">
                    <h4 className={todo.completed ? 'completed' : ''}>{todo.title}</h4>
                    <p>Priority: {todo.priority} • Category: {todo.category}</p>
                    {todo.description && <p className="activity-desc">{todo.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-activity">No recent todos. <Link to="/todos">Create your first todo!</Link></p>
          )}
        </div>
      </div>

      {/* Floating hearts */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">💖</div>
      <div className="heart-decoration">💗</div>
    </div>
  );
};

export default Dashboard;
