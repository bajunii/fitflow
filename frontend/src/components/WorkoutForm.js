import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function WorkoutForm({ onWorkoutAdded }) {
  const [type, setType] = useState('');
  const [duration, setDuration] = useState(''); // in minutes
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Defaults to today
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user, token } = useAuth(); // Get user and token from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!type || !duration) {
      setError('Workout type and duration are required.');
      return;
    }
    if (!user || !user.userId) {
      setError('User not authenticated. Cannot add workout.');
      return;
    }

    try {
      const workoutData = {
        type,
        duration: parseInt(duration, 10),
        caloriesBurned: caloriesBurned ? parseInt(caloriesBurned, 10) : null,
        date,
      };

      // We need to send userId for the backend to associate the workout
      // The backend route is /api/users/:userId/workouts
      // The current backend User model expects workouts to be linked to user's _id
      // The AuthContext stores user.userId which is the MongoDB _id.

      const response = await axios.post(
        `${API_BASE_URL}/api/users/${user.userId}/workouts`,
        workoutData,
        { headers: { Authorization: `Bearer ${token}` } } // Assuming backend needs auth for this
      );

      setMessage('Workout added successfully!');
      setType('');
      setDuration('');
      setCaloriesBurned('');
      setDate(new Date().toISOString().split('T')[0]);

      if (onWorkoutAdded) {
        onWorkoutAdded(response.data); // Pass new workout to parent to update list
      }

      setTimeout(() => setMessage(''), 3000); // Clear message after 3s

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to add workout. Please try again.');
      }
      console.error('Add workout error:', err);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
      <h3>Add New Workout</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="workout-type">Type:</label>
          <input
            type="text"
            id="workout-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            style={{ margin: '5px', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <div>
          <label htmlFor="workout-duration">Duration (minutes):</label>
          <input
            type="number"
            id="workout-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            style={{ margin: '5px', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <div>
          <label htmlFor="workout-calories">Calories Burned (optional):</label>
          <input
            type="number"
            id="workout-calories"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            style={{ margin: '5px', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <div>
          <label htmlFor="workout-date">Date:</label>
          <input
            type="date"
            id="workout-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ margin: '5px', padding: '8px', width: 'calc(100% - 22px)' }}
          />
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '10px 15px', cursor: 'pointer' }}>Add Workout</button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default WorkoutForm;
