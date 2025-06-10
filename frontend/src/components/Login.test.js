import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router } from 'react-router-dom'; // Needed because Login uses useNavigate
import axios from 'axios';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Import AuthProvider directly
import Login from './Login';

// Mock axios
jest.mock('axios');

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useNavigate: () => mockNavigate,
}));

// Custom render function to wrap component with AuthProvider and Router
const renderWithProviders = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <Router>
      <AuthProvider {...providerProps}>{ui}</AuthProvider>
    </Router>,
    renderOptions
  );
};

describe('Login Component', () => {
  let mockLoginFn;

  beforeEach(() => {
    // Reset mocks before each test
    axios.post.mockReset();
    mockNavigate.mockReset();
    // Create a fresh mock function for login for each test
    mockLoginFn = jest.fn();
  });

  // Helper to render Login with a specific AuthContext value
  const renderLoginWithAuth = () => {
    // We need to effectively mock useAuth to return our mockLoginFn
    // One way is to have AuthProvider pass down the mocked function if we modify AuthProvider for tests,
    // or to mock the useAuth hook directly.
    // For simplicity here, we'll rely on the fact that AuthProvider will provide a 'login' function,
    // and our AuthProvider is already set up to use its internal 'login'. We will spy on it.
    // A more isolated approach might be to mock useAuth:
    // jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({ login: mockLoginFn });
    // However, for this test, we'll allow the real AuthProvider to be used and just check its effects indirectly or via localStorage.
    // The provided AuthProvider's login function updates localStorage and state. We can test that.

    // Let's use a fresh AuthProvider instance for each render to ensure isolation.
     return render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );
  };


  test('renders login form correctly', () => {
    renderLoginWithAuth();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows typing into input fields', async () => {
    const user = userEvent.setup();
    renderLoginWithAuth();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');

    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  test('handles successful login', async () => {
    const user = userEvent.setup();
    const mockUserData = { token: 'fakeToken123', userId: '1', username: 'testuser' };
    axios.post.mockResolvedValueOnce({ data: mockUserData });

    // To assert that AuthContext's login was called, we'd ideally mock useAuth.
    // For now, we'll check its side effects: localStorage and navigation.
    localStorage.clear(); // Ensure clean state

    renderLoginWithAuth();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        { username: 'testuser', password: 'password123' }
      );
    });

    await waitFor(() => {
      // Check side effects of AuthContext's login
      expect(localStorage.getItem('token')).toBe(mockUserData.token);
      expect(JSON.parse(localStorage.getItem('user'))).toEqual({ userId: mockUserData.userId, username: mockUserData.username });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays error message on failed login (server error)', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLoginWithAuth();

    await user.type(screen.getByLabelText(/username/i), 'wronguser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays error message for missing fields (client-side)', async () => {
    const user = userEvent.setup();
    renderLoginWithAuth();

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Username and password are required.')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
