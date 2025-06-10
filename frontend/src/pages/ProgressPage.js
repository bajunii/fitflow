import React from 'react';
import ProgressCharts from '../components/ProgressCharts'; // Corrected path
import { useAuth } from '../context/AuthContext';

function ProgressPage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Your Progress Overview</h1>
        {user && <p>Visualizing workout trends for: {user.username}</p>}
      </header>

      <ProgressCharts />
    </div>
  );
}

export default ProgressPage;
