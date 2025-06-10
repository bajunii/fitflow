import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const goalTypes = ['weight', 'workoutFrequency', 'caloriesBurned', 'distance', 'duration', 'other'];
const unitsMap = {
  weight: 'kg',
  workoutFrequency: 'sessions',
  caloriesBurned: 'kcal',
  distance: 'km',
  duration: 'minutes',
  other: ''
};

function GoalForm({ onGoalAdded }) {
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState(goalTypes[0]);
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState(unitsMap[goalTypes[0]]);
  const [endDate, setEndDate] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user, token } = useAuth();

  const handleGoalTypeChange = (e) => {
    const newType = e.target.value;
    setGoalType(newType);
    setUnit(unitsMap[newType] || ''); // Set unit based on type, allow manual override if needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!description || !goalType || !targetValue) {
      setError('Description, goal type, and target value are required.');
      return;
    }
    if (!user || !user.userId) {
      setError('User not authenticated. Cannot add goal.');
      return;
    }
    if (goalType !== 'other' && !unit) {
      setError('Unit is required for the selected goal type.');
      return;
    }


    try {
      const goalData = {
        description,
        goalType,
        targetValue: parseFloat(targetValue),
        unit,
        endDate: endDate || null, // Send null if empty
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/users/${user.userId}/goals`,
        goalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Goal added successfully!');
      // Reset form
      setDescription('');
      setGoalType(goalTypes[0]);
      setTargetValue('');
      setUnit(unitsMap[goalTypes[0]]);
      setEndDate('');

      if (onGoalAdded) {
        onGoalAdded(response.data);
      }
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add goal. Please try again.';
      setError(errMsg);
      console.error('Add goal error:', err);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3>Create New Goal</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="goal-description">Description:</label>
          <input
            type="text"
            id="goal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ margin: '5px 0 10px 0', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <div>
          <label htmlFor="goal-type">Goal Type:</label>
          <select
            id="goal-type"
            value={goalType}
            onChange={handleGoalTypeChange}
            required
            style={{ margin: '5px 0 10px 0', padding: '8px', width: '100%' }}
          >
            {goalTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="goal-target">Target Value:</label>
          <input
            type="number"
            id="goal-target"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
            style={{ margin: '5px 0 10px 0', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <div>
          <label htmlFor="goal-unit">Unit:</label>
          <input
            type="text"
            id="goal-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder={goalType === 'other' ? "e.g., reps, hours" : ""}
            required={goalType !== 'other'}
            disabled={goalType !== 'other' && unitsMap[goalType] !== ''} // Disable if predefined unless it's 'other'
            style={{ margin: '5px 0 10px 0', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <div>
          <label htmlFor="goal-endDate">End Date (Optional):</label>
          <input
            type="date"
            id="goal-endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
            style={{ margin: '5px 0 10px 0', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '10px 15px', cursor: 'pointer' }}>Add Goal</button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default GoalForm;
