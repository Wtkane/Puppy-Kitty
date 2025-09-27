import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    todaysEvents: [],
    upcomingEvents: []
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

      // Get today's events, sorted by start time
      const todaysEventsArray = userEvents.filter(event => {
        const eventDate = new Date(event.date);
        // Compare date parts only (YYYY-MM-DD) to avoid timezone issues
        const eventDateString = eventDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        return eventDateString === todayString;
      }).sort((a, b) => {
        // Sort by start time
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      }).slice(0, 2); // Take first 2 (current and next)

      // Get upcoming events (not today), sorted by date and time, take first 2
      const upcomingEventsArray = userEvents
        .filter(event => {
          const eventDate = new Date(event.date);
          const eventDateString = eventDate.toISOString().split('T')[0];
          const todayString = today.toISOString().split('T')[0];
          return eventDateString > todayString; // Future dates only
        })
        .sort((a, b) => {
          // Sort by date first, then by start time
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return 0;
        })
        .slice(0, 2); // Take 2 most urgent

      // Get most urgent 2 incomplete todos (by priority and due date)
      const urgentTodos = todos
        .filter(todo => !todo.completed)
        .sort((a, b) => {
          // Sort by priority first (High > Medium > Low), then by due date
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          const priorityA = priorityOrder[a.priority] || 0;
          const priorityB = priorityOrder[b.priority] || 0;

          if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
          }

          // If same priority, sort by due date (earliest first)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return 0;
        })
        .slice(0, 2); // Take 2 most urgent

      console.log('Todays events:', todaysEventsArray);
      console.log('Upcoming events:', upcomingEventsArray);
      console.log('Urgent todos:', urgentTodos);

      setStats({
        todaysEvents: todaysEventsArray,
        upcomingEvents: urgentTodos
      });

      // Get upcoming events (next 5 events, sorted by date) - only current user's events
      const currentTime = new Date();
      const currentDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
      const upcomingEventsList = userEvents
        .filter(event => new Date(event.date) >= currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

      // Get recent items (last 5 incomplete todos, but show only 3)
      setRecentEvents(upcomingEventsList);
      setRecentTodos(todos.filter(todo => !todo.completed).slice(-5).reverse());
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
      {/* Today's Message */}
      <div className="today-message">
        <h2>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Let's make it amazing!</h2>
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
            {stats.todaysEvents.length > 0 ? (
              <div>
                {stats.todaysEvents.map((event, index) => (
                  <div key={event._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h4 style={{ fontSize: '1.2rem', margin: '0', fontWeight: '700' }}>
                      {event.title}
                    </h4>
                    <p style={{ fontSize: '0.9rem', margin: '0', opacity: 0.8 }}>
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '2rem', margin: '0' }}>0</h3>
                <p>Events Today</p>
              </div>
            )}
          </div>
        </div>



        <div className="stat-card upcoming">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="stat-content">
            {stats.upcomingEvents.length > 0 ? (
              <div>
                {stats.upcomingEvents.map((todo, index) => (
                  <div key={todo._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: '0', fontWeight: '700' }}>
                      {todo.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', margin: '0', opacity: 0.8 }}>
                      {todo.priority}
                      {todo.dueDate && ` • Due ${formatDate(todo.dueDate)}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '2rem', margin: '0' }}>0</h3>
                <p>Upcoming</p>
              </div>
            )}
          </div>
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
