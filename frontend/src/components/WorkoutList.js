import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function WorkoutList({ newWorkout }) { // newWorkout prop to trigger refresh if form is separate
  const [workouts, setWorkouts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  const fetchWorkouts = useCallback(async () => {
    if (!user || !user.userId) {
      setError('User not authenticated. Cannot fetch workouts.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${user.userId}/workouts`,
        { headers: { Authorization: `Bearer ${token}` } } // Assuming backend needs auth
      );
      setWorkouts(response.data.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort by date desc
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to fetch workouts.');
      }
      console.error('Fetch workouts error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts, newWorkout]); // Re-fetch if newWorkout changes (passed from WorkoutForm) or user/token changes

  const handleDelete = async (workoutId) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) return;

    setError('');
    try {
      await axios.delete(
        `${API_BASE_URL}/api/workouts/${workoutId}`,
        { headers: { Authorization: `Bearer ${token}` } } // Assuming backend needs auth
      );
      // Refresh list after delete
      setWorkouts(prevWorkouts => prevWorkouts.filter(w => w._id !== workoutId));
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete workout.');
      }
      console.error('Delete workout error:', err);
    }
  };

  // Function to be passed to WorkoutForm if it's a child of this component
  // Or, if WorkoutForm is a sibling, Dashboard can manage this.
  // For this example, assuming WorkoutForm might be separate and Dashboard coordinates.
  // If WorkoutForm is child of WorkoutList, then this function is how WorkoutForm tells WorkoutList to refresh.
  const handleWorkoutAdded = (addedWorkout) => {
     // Add to list and re-sort, or just refetch. Refetching is simpler.
     fetchWorkouts();
  };


  if (isLoading) return <p>Loading workouts...</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Your Workouts</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {workouts.length === 0 && !isLoading && <p>No workouts recorded yet.</p>}
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {workouts.map(workout => (
          <li key={workout._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
            <p><strong>Type:</strong> {workout.type}</p>
            <p><strong>Duration:</strong> {workout.duration} minutes</p>
            {workout.caloriesBurned && <p><strong>Calories Burned:</strong> {workout.caloriesBurned}</p>}
            <p><strong>Date:</strong> {new Date(workout.date).toLocaleDateString()}</p>
            <button
              onClick={() => handleDelete(workout._id)}
              style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Delete
            </button>
            {/* Placeholder for Edit button */}
            { <button style={{ marginLeft: '10px' }}>Edit</button> }
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WorkoutList;
