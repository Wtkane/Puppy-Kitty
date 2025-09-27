import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalEvents: 0,
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

      setStats({
        totalEvents: todaysEvents, // Changed to show remaining events today instead of total
        upcomingEvents: todaysEvents
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
          Welcome back, {user.name}!
        </h1>
        <p className="welcome-subtitle">
          Here's what's happening in your Puppy & Kitty world today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card events">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.totalEvents}</h3>
            <p>Events Today</p>
          </div>
        </div>



        <div className="stat-card upcoming">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.upcomingEvents}</h3>
            <p>Upcoming</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">
          Quick Actions
        </h2>
        <div className="actions-grid">
          <Link to="/calendar" className="action-card calendar">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
              </svg>
            </div>
            <h3>Add Event</h3>
            <p>Schedule something special</p>
          </Link>

          <Link to="/todos" className="action-card todos">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                <path d="M9 13l2 2 4-4"/>
              </svg>
            </div>
            <h3>Add Todo</h3>
            <p>Create a new task</p>
          </Link>


        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h2 className="section-title">
            Upcoming Events
          </h2>
          {recentEvents.length > 0 ? (
            <div className="activity-list">
              {recentEvents.map(event => (
                <div key={event._id} className="activity-item">
                  <div className="activity-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                    </svg>
                  </div>
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
            Recent Todos
          </h2>
          {recentTodos.length > 0 ? (
            <div className="activity-list">
              {recentTodos.map(todo => (
                <div key={todo._id} className="activity-item">
                  <div className="activity-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                      <path d="M9 13l2 2 4-4"/>
                    </svg>
                  </div>
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


    </div>
  );
};

export default Dashboard;
