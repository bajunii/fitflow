import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { AuthProvider } from '../context/AuthContext'; // To provide context
import WorkoutForm from './WorkoutForm';

jest.mock('axios');

const mockUser = { userId: 'user123', username: 'testuser' };
const mockToken = 'fakeToken';

// Custom render function with AuthProvider
const renderWithAuth = (ui, authProviderProps = { token: mockToken, user: mockUser }) => {
  return render(
    <AuthProvider {...authProviderProps}>
      {/* This default AuthProvider might not have the exact mock values we want for useAuth().
          A better way is to mock useAuth() directly if the component uses it.
          WorkoutForm uses useAuth(), so we need to mock it.
      */}
      {ui}
    </AuthProvider>
  );
};

// Mock useAuth
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'), // Import and retain default behavior
  useAuth: jest.fn(), // Mock useAuth
}));


describe('WorkoutForm Component', () => {
  const mockOnWorkoutAdded = jest.fn();

  beforeEach(() => {
    axios.post.mockReset();
    mockOnWorkoutAdded.mockReset();
    // Setup the mock for useAuth before each test
    require('../context/AuthContext').useAuth.mockReturnValue({
      user: mockUser,
      token: mockToken,
      // Add other functions from useAuth if WorkoutForm uses them, though it primarily needs user and token
    });
  });

  test('renders all form fields correctly', () => {
    render(<WorkoutForm onWorkoutAdded={mockOnWorkoutAdded} />);

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories burned \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add workout/i })).toBeInTheDocument();
  });

  test('allows input changes', async () => {
    const user = userEvent.setup();
    render(<WorkoutForm onWorkoutAdded={mockOnWorkoutAdded} />);

    await user.type(screen.getByLabelText(/type/i), 'Swimming');
    expect(screen.getByLabelText(/type/i)).toHaveValue('Swimming');

    await user.clear(screen.getByLabelText(/duration \(minutes\)/i)); // Clear default or previous value if any
    await user.type(screen.getByLabelText(/duration \(minutes\)/i), '45');
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(45);

    await user.clear(screen.getByLabelText(/calories burned \(optional\)/i));
    await user.type(screen.getByLabelText(/calories burned \(optional\)/i), '400');
    expect(screen.getByLabelText(/calories burned \(optional\)/i)).toHaveValue(400);

    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } }); // userEvent.type might not work well for date inputs
    expect(dateInput).toHaveValue('2024-01-15');
  });

  test('submits form data correctly and calls onWorkoutAdded on success', async () => {
    const user = userEvent.setup();
    const mockWorkoutResponse = { _id: 'workout1', type: 'Running', duration: 30, date: new Date().toISOString() };
    axios.post.mockResolvedValueOnce({ data: mockWorkoutResponse });

    render(<WorkoutForm onWorkoutAdded={mockOnWorkoutAdded} />);

    await user.type(screen.getByLabelText(/type/i), 'Running');
    await user.clear(screen.getByLabelText(/duration \(minutes\)/i));
    await user.type(screen.getByLabelText(/duration \(minutes\)/i), '30');
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2024-01-10' } });

    await user.click(screen.getByRole('button', { name: /add workout/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:5000/api/users/${mockUser.userId}/workouts`,
        {
          type: 'Running',
          duration: 30,
          caloriesBurned: null, // Assuming calories field was left empty
          date: '2024-01-10',
        },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
    });

    await waitFor(() => {
      expect(mockOnWorkoutAdded).toHaveBeenCalledWith(mockWorkoutResponse);
    });

    // Check if form resets (example for one field)
    expect(screen.getByLabelText(/type/i)).toHaveValue('');
  });

  test('shows error message if required fields are missing (client-side)', async () => {
    const user = userEvent.setup();
    render(<WorkoutForm onWorkoutAdded={mockOnWorkoutAdded} />);

    await user.click(screen.getByRole('button', { name: /add workout/i }));

    expect(await screen.findByText('Workout type and duration are required.')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('shows error message from server on submission failure', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Server error adding workout' } } });

    render(<WorkoutForm onWorkoutAdded={mockOnWorkoutAdded} />);

    await user.type(screen.getByLabelText(/type/i), 'Error Test');
    await user.clear(screen.getByLabelText(/duration \(minutes\)/i));
    await user.type(screen.getByLabelText(/duration \(minutes\)/i), '10');

    await user.click(screen.getByRole('button', { name: /add workout/i }));

    expect(await screen.findByText('Server error adding workout')).toBeInTheDocument();
    expect(mockOnWorkoutAdded).not.toHaveBeenCalled();
  });
});
