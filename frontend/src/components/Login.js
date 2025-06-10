import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Assume the backend API is running on port 5000 locally for development
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      });

      const { token, userId, username: loggedInUsername } = response.data;
      login(token, { userId, username: loggedInUsername }); // Pass token and user data to context

      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <h1>User Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-username">Username:</label>
          <input
            type="text"
            id="login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="login-password">Password:</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Login;
