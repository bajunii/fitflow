import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function GoalItem({ goal, onGoalUpdate, onGoalDelete }) {
  const [currentValueInput, setCurrentValueInput] = useState(goal.currentValue || 0);
  const [isEditingCurrentValue, setIsEditingCurrentValue] = useState(false);
  const { token } = useAuth();

  const handleUpdateCurrentValue = async () => {
    try {
      const updatedGoal = await axios.put(
        `${API_BASE_URL}/api/goals/${goal._id}`,
        { currentValue: parseFloat(currentValueInput) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGoalUpdate(updatedGoal.data);
      setIsEditingCurrentValue(false);
    } catch (error) {
      console.error('Error updating current value:', error);
      // Handle error display to user if needed
    }
  };

  const handleStatusChange = async (newStatus) => {
     if (!window.confirm(`Are you sure you want to mark this goal as ${newStatus}?`)) return;
    try {
      const updatedGoal = await axios.put(
        `${API_BASE_URL}/api/goals/${goal._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGoalUpdate(updatedGoal.data);
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error);
    }
  };

  const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;

  return (
    <li style={{ border: '1px solid #eee', padding: '15px', marginBottom: '15px', borderRadius: '8px', backgroundColor: goal.status === 'completed' ? '#e6ffe6' : goal.status === 'abandoned' ? '#ffe6e6' : 'white' }}>
      <h4>{goal.description}</h4>
      <p><strong>Type:</strong> {goal.goalType}</p>
      <p><strong>Target:</strong> {goal.targetValue} {goal.unit}</p>
      <p><strong>Current:</strong> {goal.currentValue} {goal.unit}</p>
      <p><strong>Status:</strong> <span style={{fontWeight: 'bold', color: goal.status === 'active' ? 'blue' : goal.status === 'completed' ? 'green' : 'red'}}>{goal.status}</span></p>
      <p><strong>Start Date:</strong> {new Date(goal.startDate).toLocaleDateString()}</p>
      {goal.endDate && <p><strong>End Date:</strong> {new Date(goal.endDate).toLocaleDateString()}</p>}

      <div style={{ margin: '10px 0', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progress >= 100 ? 'green' : 'orange', padding: '5px 0', textAlign: 'center', color: 'white', fontSize: '12px' }}>
          {Math.round(progress)}%
        </div>
      </div>

      {goal.status === 'active' && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={currentValueInput}
            onChange={(e) => setCurrentValueInput(e.target.value)}
            onFocus={() => setIsEditingCurrentValue(true)}
            style={{ padding: '8px', width: '80px' }}
          />
          <button onClick={handleUpdateCurrentValue} style={{ padding: '8px 12px' }}>Update Progress</button>
        </div>
      )}

      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        {goal.status === 'active' && (
          <>
            <button onClick={() => handleStatusChange('completed')} style={{ backgroundColor: 'lightgreen', padding: '8px 12px' }}>Mark Complete</button>
            <button onClick={() => handleStatusChange('abandoned')} style={{ backgroundColor: 'lightcoral', padding: '8px 12px' }}>Abandon</button>
          </>
        )}
        {goal.status !== 'active' && (
             <button onClick={() => handleStatusChange('active')} style={{ backgroundColor: 'lightskyblue', padding: '8px 12px' }}>Reactivate</button>
        )}
        <button onClick={() => onGoalDelete(goal._id)} style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '8px 12px' }}>Delete</button>
      </div>
    </li>
  );
}


function GoalList({ refreshTrigger }) { // refreshTrigger prop to re-fetch when a new goal is added
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  const fetchGoals = useCallback(async () => {
    if (!user || !user.userId) {
      setError('User not authenticated. Cannot fetch goals.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${user.userId}/goals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoals(response.data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))); // Sort by most recent
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch goals.');
      console.error('Fetch goals error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals, refreshTrigger]);

  const handleGoalUpdate = (updatedGoal) => {
    setGoals(prevGoals => prevGoals.map(g => g._id === updatedGoal._id ? updatedGoal : g).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const handleGoalDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/api/goals/${goalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoals(prevGoals => prevGoals.filter(g => g._id !== goalId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete goal.');
      console.error('Delete goal error:', err);
    }
  };

  if (isLoading) return <p>Loading goals...</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Your Goals</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {goals.length === 0 && !isLoading && <p>No goals set yet. Create one above!</p>}
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {goals.map(goal => (
          <GoalItem
            key={goal._id}
            goal={goal}
            onGoalUpdate={handleGoalUpdate}
            onGoalDelete={handleGoalDelete}
          />
        ))}
      </ul>
    </div>
  );
}

export default GoalList;
