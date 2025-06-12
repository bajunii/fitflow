import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Import your CSS file

import Registration from './components/Registration';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PaymentPage from './components/PaymentPage';
import GoalsPage from './components/GoalsPage';
import ProgressPage from './pages/ProgressPage'; // Import ProgressPage
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import ProfilePage from './components/Profile';

function App() {
  // Basic Navbar for easy navigation during development
  const Navbar = () => (
  <nav>
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <button tabIndex={0}>Pages </button>
        <div className="dropdown-content">
          <Link to="/profile">Profile</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/goals">Goals</Link>
          <Link to="/progress">Progress</Link>
          <Link to="/payment">Payment</Link>
        </div>
      </li>
    </ul>
  </nav>
);
  // Simple Home component
  const Home = () => (
    <div>
      <img 
        src="images/fitness.logo.jpeg" 
        alt="Fitflow Logo" 
        style={{ maxWidth: '200px', marginBottom: '20px' }}
      />
      <h2>Welcome to Fitflow App</h2>
      <p>🚀 Let’s crush your goals together. Register now and make today the day you become unstoppable!"
<br></br>
#NoExcuses #TrainHarder #YouGotThis</p>
      <Link to="/register">
        <button>Register</button>
        </Link>      <span>    </span>
      <Link to="/login">
       <button>Login</button>
      </Link>
    </div>
  );
  // Simple Footer component
  const Footer = () => (
    <footer>
      <p>&copy; {new Date().getFullYear()} Fitflow App</p>
    </footer>
  );
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <header className="App-header">
            <h1>Fitflow App</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/register" element={<Registration />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute />}>
                <Route index element={<Dashboard />} />
              </Route>
              <Route path="/goals" element={<PrivateRoute />}>
                <Route index element={<GoalsPage />} />
              </Route>
              <Route path="/progress" element={<PrivateRoute />}>
                <Route index element={<ProgressPage />} />
              </Route>
              <Route path="/payment" element={<PrivateRoute />}>
                <Route index element={<PaymentPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
