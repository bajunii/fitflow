import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkoutForm from './WorkoutForm';
import WorkoutList from './WorkoutList';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // This state will be used to trigger a refresh in WorkoutList when a new workout is added
  const [newlyAddedWorkout, setNewlyAddedWorkout] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // This function will be called by WorkoutForm after a workout is successfully added
  const handleWorkoutAdded = (workout) => {
    setNewlyAddedWorkout(workout); // Update state to trigger WorkoutList refresh
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {user && <p>Welcome, {user.username} (User ID: {user.userId})!</p>}
      <p>Manage your workouts below.</p>

      <WorkoutForm onWorkoutAdded={handleWorkoutAdded} />
      <WorkoutList newWorkout={newlyAddedWorkout} /> {/* Pass the newly added workout or a signal to refresh */}

    </div>
  );
}

export default Dashboard;
