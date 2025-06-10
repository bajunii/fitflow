import React from 'react';
import './App.css';
import Registration from './components/Registration';
import Login from './components/Login';
import WorkoutTracking from './components/WorkoutTracking';
import ClassSchedules from './components/ClassSchedules';
import PaymentPage from './components/PaymentPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Fitness Center App</h1>
      </header>
      <main>
        {/* Example of how components might be used - routing would typically handle this */}
        <Registration />
        <Login />
        <WorkoutTracking />
        <ClassSchedules />
        <PaymentPage />
      </main>
    </div>
  );
}

export default App;
