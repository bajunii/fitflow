import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale for time-series data
} from 'chart.js';
import 'chartjs-adapter-moment'; // Import adapter for moment.js

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Utility to get the week number for a date (ISO 8601 week date)
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};


function ProgressCharts() {
  const [workoutData, setWorkoutData] = useState([]);
  const [chartData, setChartData] = useState({
    frequency: { labels: [], datasets: [] },
    duration: { labels: [], datasets: [] },
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  const fetchWorkoutData = useCallback(async () => {
    if (!user || !user.userId) {
      setError('User not authenticated.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${user.userId}/workouts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkoutData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch workout data.');
      console.error('Fetch workout data error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchWorkoutData();
  }, [fetchWorkoutData]);

  useEffect(() => {
    if (workoutData.length > 0) {
      // Process data for charts
      const workoutsByWeek = workoutData.reduce((acc, workout) => {
        const week = getWeekNumber(new Date(workout.date));
        if (!acc[week]) {
          acc[week] = { count: 0, totalDuration: 0, dates: [] };
        }
        acc[week].count += 1;
        acc[week].totalDuration += workout.duration || 0;
        acc[week].dates.push(new Date(workout.date));
        return acc;
      }, {});

      // Get the last N weeks (e.g., last 8 weeks)
      const sortedWeeks = Object.keys(workoutsByWeek).sort().slice(-8);

      const frequencyLabels = sortedWeeks;
      const frequencyDataset = sortedWeeks.map(week => workoutsByWeek[week].count);

      const durationLabels = sortedWeeks;
      const durationDataset = sortedWeeks.map(week => workoutsByWeek[week].totalDuration);

      setChartData({
        frequency: {
          labels: frequencyLabels,
          datasets: [{
            label: 'Workouts per Week',
            data: frequencyDataset,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }],
        },
        duration: {
          labels: durationLabels,
          datasets: [{
            label: 'Total Workout Duration (minutes) per Week',
            data: durationDataset,
            fill: false,
            borderColor: 'rgba(255, 99, 132, 1)',
            tension: 0.1,
          }],
        },
      });
    }
  }, [workoutData]);

  if (isLoading) return <p>Loading chart data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (workoutData.length === 0) return <p>No workout data available to display charts.</p>;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Chart Title' } // Generic title, customize per chart
    },
    scales: {
        x: {
            title: { display: true, text: 'Week' }
        },
        y: {
            beginAtZero: true,
            title: { display: true, text: 'Value' }
        }
    }
  };

  const frequencyChartOptions = { ...chartOptions, plugins: {...chartOptions.plugins, title: {display: true, text: "Workout Frequency per Week"}}, scales: {...chartOptions.scales, y: {...chartOptions.scales.y, title: {display: true, text: "Number of Workouts"}}} };
  const durationChartOptions = { ...chartOptions, plugins: {...chartOptions.plugins, title: {display: true, text: "Workout Duration Trend per Week"}}, scales: {...chartOptions.scales, y: {...chartOptions.scales.y, title: {display: true, text: "Total Duration (minutes)"}}} };


  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Your Progress</h3>
      <div style={{ marginBottom: '40px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
        <h4>Workout Frequency</h4>
        {chartData.frequency.labels.length > 0 ? (
          <Bar data={chartData.frequency} options={frequencyChartOptions} />
        ) : <p>Not enough data for frequency chart.</p>}
      </div>
      <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
        <h4>Workout Duration Trend</h4>
         {chartData.duration.labels.length > 0 ? (
          <Line data={chartData.duration} options={durationChartOptions} />
        ) : <p>Not enough data for duration chart.</p>}
      </div>
    </div>
  );
}

export default ProgressCharts;
