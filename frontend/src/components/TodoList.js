import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TodoList.css';

const TodoList = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    category: 'personal'
  });

  const priorities = [
    { value: 'low', label: 'Low', emoji: '🟢', color: '#96ceb4' },
    { value: 'medium', label: 'Medium', emoji: '🟡', color: '#ffeaa7' },
    { value: 'high', label: 'High', emoji: '🔴', color: '#ff7675' }
  ];

  const categories = [
    { value: 'personal', label: 'Personal', emoji: '👤' },
    { value: 'work', label: 'Work', emoji: '💼' },
    { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { value: 'health', label: 'Health', emoji: '🏥' },
    { value: 'other', label: 'Other', emoji: '📝' }
  ];

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('/api/todos/my-todos');
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTodo) {
        await axios.put(`/api/todos/${editingTodo._id}`, formData);
      } else {
        await axios.post('/api/todos', formData);
      }

      setShowForm(false);
      setEditingTodo(null);
      resetForm();
      fetchTodos();
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };

  const handleToggleComplete = async (todoId) => {
    try {
      await axios.patch(`/api/todos/${todoId}/toggle`);
      fetchTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      category: todo.category
    });
    setShowForm(true);
  };

  const handleDelete = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await axios.delete(`/api/todos/${todoId}`);
        fetchTodos();
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: 'personal'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed;
    if (filter === 'overdue') {
      if (!todo.dueDate || todo.completed) return false;
      return new Date(todo.dueDate) < new Date();
    }
    return todo.priority === filter;
  });

  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.length - completedCount;

  if (loading) {
    return (
      <div className="todos-container">
        <div className="loading-spinner">
          <span>💕</span>
          <p>Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todos-container">
      <div className="todos-header">
        <h1 className="todos-title">
          <span className="emoji">✅</span>
          Shared Todo List
          <span className="emoji">📝</span>
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <span>➕</span>
          Add Todo
        </button>
      </div>

      {/* Stats */}
      <div className="todos-stats">
        <div className="stat-item">
          <span className="stat-number">{todos.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{pendingCount}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{completedCount}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      {/* Filter */}
      <div className="todos-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilter('overdue')}
        >
          Overdue
        </button>
        {priorities.map(priority => (
          <button
            key={priority.value}
            className={`filter-btn priority ${filter === priority.value ? 'active' : ''}`}
            onClick={() => setFilter(priority.value)}
            style={{ backgroundColor: priority.color }}
          >
            {priority.emoji} {priority.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTodo ? 'Edit Todo' : 'Add New Todo'}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingTodo(null);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="todo-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="Todo title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Todo description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.emoji} {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  setEditingTodo(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTodo ? 'Update Todo' : 'Create Todo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="todos-list">
        {filteredTodos.length === 0 ? (
          <div className="no-todos">
            <span className="emoji">📝</span>
            <h3>No todos found</h3>
            <p>
              {filter === 'all'
                ? 'Click "Add Todo" to create your first task!'
                : `No ${filter} todos. Try a different filter!`
              }
            </p>
          </div>
        ) : (
          filteredTodos.map(todo => {
            const priorityInfo = getPriorityInfo(todo.priority);
            const categoryInfo = getCategoryInfo(todo.category);
            const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

            return (
              <div
                key={todo._id}
                className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
              >
                <div className="todo-checkbox-container">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo._id)}
                  />
                </div>

                <div className="todo-content">
                  <div className="todo-header">
                    <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                      {todo.title}
                    </h3>
                    <div className="todo-badges">
                      <span
                        className="todo-priority"
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        {priorityInfo.emoji} {priorityInfo.label}
                      </span>
                      <span className="todo-category">
                        {categoryInfo.emoji} {categoryInfo.label}
                      </span>
                    </div>
                  </div>

                  {todo.description && (
                    <p className="todo-description">{todo.description}</p>
                  )}

                  <div className="todo-meta">
                    {todo.dueDate && (
                      <span className={`todo-due-date ${isOverdue ? 'overdue' : ''}`}>
                        📅 Due: {formatDate(todo.dueDate)}
                      </span>
                    )}
                    <span className="todo-creator">
                      👤 Created by {todo.createdBy.name}
                    </span>
                    {todo.assignedTo && todo.assignedTo._id !== todo.createdBy._id && (
                      <span className="todo-assignee">
                        📋 Assigned to {todo.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="todo-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(todo)}
                    title="Edit todo"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(todo._id)}
                    title="Delete todo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating hearts */}
      <div className="heart-decoration">💕</div>
      <div className="heart-decoration">💖</div>
      <div className="heart-decoration">💗</div>
    </div>
  );
};

export default TodoList;
