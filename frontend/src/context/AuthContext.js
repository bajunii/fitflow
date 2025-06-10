import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user'))); // Store user info if needed

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Optionally, you could verify token with backend here or fetch user details
      // For now, we'll assume the token in localStorage is valid if it exists.
      // If user details are stored, update localStorage as well.
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user'); // Clean up if no user but token exists
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData); // Store user data (like username, id)
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    // Add more robust checks if needed, e.g., token expiration
    return !!token;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
