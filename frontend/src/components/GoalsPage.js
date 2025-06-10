import React, { useState } from 'react';
import GoalForm from './GoalForm';
import GoalList from './GoalList';
import { useAuth } from '../context/AuthContext'; // To display user info, optional

function GoalsPage() {
  const [refreshGoals, setRefreshGoals] = useState(false); // State to trigger GoalList refresh
  const { user } = useAuth();

  const handleGoalAdded = (newGoal) => {
    // When a goal is added, toggle 'refreshGoals' to trigger useEffect in GoalList
    setRefreshGoals(prev => !prev);
    console.log('New goal added, triggering list refresh:', newGoal);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Manage Your Goals</h1>
        {user && <p>Setting and tracking goals for: {user.username}</p>}
      </header>

      <GoalForm onGoalAdded={handleGoalAdded} />
      <GoalList refreshTrigger={refreshGoals} />
    </div>
  );
}

export default GoalsPage;
