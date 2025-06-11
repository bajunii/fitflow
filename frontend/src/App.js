import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

import Registration from './components/Registration';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PaymentPage from './components/PaymentPage';
import GoalsPage from './components/GoalsPage';
import ProgressPage from './pages/ProgressPage'; // Import ProgressPage
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

function App() {
  // Basic Navbar for easy navigation during development
  const Navbar = () => (
    <nav>
      <ul>
        <li><Link to="/">Home (Public)</Link></li>
        <li><Link to="/register">Register</Link></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/goals">Goals</Link></li>
        <li><Link to="/progress">Progress</Link></li> {/* Added Progress link */}
        <li><Link to="/payment">Payment</Link></li>
      </ul>
    </nav>
  );

  // Simple Home component
  const Home = () => (
    <div>
      <h2>Welcome to the Fitflow App</h2>
      <p>This is the public home page.</p>
    </div>
  );

  return (
    <AuthProvider> {/* Wrap routes with AuthProvider */}
      <Router>
        <div className="App">
          <Navbar /> {/* Add Navbar */}
          <header className="App-header">
            <h1>Fitflow App</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} /> {/* Public Home Route */}
              <Route path="/register" element={<Registration />} />
              <Route path="/login" element={<Login />} />
              {/* Protected Route for Dashboard */}
              <Route path="/dashboard" element={<PrivateRoute />}>
                <Route index element={<Dashboard />} />
              </Route>
              <Route path="/goals" element={<PrivateRoute />}>
                <Route index element={<GoalsPage />} />
              </Route>
              <Route path="/progress" element={<PrivateRoute />}> {/* Protected Progress Route */}
                <Route index element={<ProgressPage />} />
              </Route>
              <Route path="/payment" element={<PrivateRoute />}>
                <Route index element={<PaymentPage />} />
              </Route>
              {/* Add other routes here */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
