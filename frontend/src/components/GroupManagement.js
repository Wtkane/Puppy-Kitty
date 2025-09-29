import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './GroupManagement.css';

const GroupManagement = ({ onClose }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my-groups');
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showMessage('Error fetching groups', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showMessage('Group name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/groups', createForm);
      
      setGroups([...groups, response.data]);
      setCreateForm({ name: '', description: '' });
      showMessage('Group created successfully!', 'success');
      setActiveTab('my-groups');
    } catch (error) {
      console.error('Error creating group:', error);
      showMessage(error.response?.data?.message || 'Error creating group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showMessage('Invite code is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/groups/join', 
        { inviteCode: joinCode.toUpperCase() }
      );
      
      setGroups([...groups, response.data]);
      setJoinCode('');
      showMessage('Successfully joined group!', 'success');
      setActiveTab('my-groups');
    } catch (error) {
      console.error('Error joining group:', error);
      showMessage(error.response?.data?.message || 'Error joining group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to leave "${groupName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/api/groups/${groupId}/leave`);
      
      setGroups(groups.filter(g => g._id !== groupId));
      showMessage('Left group successfully', 'success');
    } catch (error) {
      console.error('Error leaving group:', error);
      showMessage(error.response?.data?.message || 'Error leaving group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    showMessage('Invite code copied to clipboard!', 'success');
  };

  return (
    <div className="group-management-overlay">
      <div className="group-management-modal">
        <div className="group-management-header">
          <h2>Group Management</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="group-management-tabs">
          <button 
            className={`tab ${activeTab === 'my-groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-groups')}
          >
            My Groups
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Group
          </button>
          <button 
            className={`tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Group
          </button>
        </div>

        <div className="group-management-content">
          {activeTab === 'my-groups' && (
            <div className="my-groups-tab">
              {groups.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't joined any groups yet.</p>
                  <p>Create a new group or join an existing one to get started!</p>
                </div>
              ) : (
                <div className="groups-list">
                  {groups.map(group => (
                    <div key={group._id} className="group-card">
                      <div className="group-info">
                        <h3>{group.name}</h3>
                        {group.description && <p>{group.description}</p>}
                        <div className="group-meta">
                          <span className="member-count">
                            👥 {group.members?.length || 0} members
                          </span>
                          <span className="invite-code">
                            Code: <strong>{group.inviteCode}</strong>
                            <button 
                              className="copy-button"
                              onClick={() => copyInviteCode(group.inviteCode)}
                              title="Copy invite code"
                            >
                              📋
                            </button>
                          </span>
                        </div>
                      </div>
                      <div className="group-actions">
                        <button 
                          className="leave-button"
                          onClick={() => handleLeaveGroup(group._id, group.name)}
                          disabled={loading}
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="create-group-tab">
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label htmlFor="groupName">Group Name *</label>
                  <input
                    type="text"
                    id="groupName"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="Enter group name"
                    maxLength={50}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="groupDescription">Description</label>
                  <textarea
                    id="groupDescription"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    placeholder="Optional group description"
                    maxLength={200}
                    rows={3}
                  />
                </div>
                <button type="submit" className="create-button" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="join-group-tab">
              <form onSubmit={handleJoinGroup}>
                <div className="form-group">
                  <label htmlFor="inviteCode">Invite Code *</label>
                  <input
                    type="text"
                    id="inviteCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character invite code"
                    maxLength={6}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  <small>Ask a group member for the 6-character invite code</small>
                </div>
                <button type="submit" className="join-button" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;
