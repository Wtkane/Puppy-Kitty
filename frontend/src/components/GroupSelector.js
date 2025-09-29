import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './GroupSelector.css';

const GroupSelector = ({ user, onGroupChange }) => {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(user?.currentGroup || 'personal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    setCurrentGroup(user?.currentGroup || 'personal');
  }, [user?.currentGroup]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleGroupSwitch = async (groupId) => {
    if (groupId === currentGroup) return;

    setLoading(true);
    try {
      await api.put('/api/groups/switch', { groupId });
      
      setCurrentGroup(groupId);
      if (onGroupChange) {
        onGroupChange(groupId);
      }
    } catch (error) {
      console.error('Error switching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentGroupName = () => {
    if (currentGroup === 'personal') return 'Personal';
    const group = groups.find(g => g._id === currentGroup);
    return group ? group.name : 'Unknown Group';
  };

  return (
    <div className="group-selector">
      <div className="group-selector-dropdown">
        <button
          className="group-selector-button"
          disabled={loading}
        >
          <span className="group-name">{getCurrentGroupName()}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        
        <div className="group-selector-menu">
          <div 
            className={`group-option ${currentGroup === 'personal' ? 'active' : ''}`}
            onClick={() => handleGroupSwitch('personal')}
          >
            <span className="group-icon">👤</span>
            <span>Personal</span>
          </div>
          
          {groups.map(group => (
            <div 
              key={group._id}
              className={`group-option ${currentGroup === group._id ? 'active' : ''}`}
              onClick={() => handleGroupSwitch(group._id)}
            >
              <span className="group-icon">👥</span>
              <span>{group.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;
