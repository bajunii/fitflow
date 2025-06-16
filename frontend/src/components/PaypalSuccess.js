import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function PaypalSuccess() {
  const [message, setMessage] = useState('Processing your PayPal payment...');
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth(); // Assuming you need auth token to call capture endpoint

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderID = queryParams.get('token'); // PayPal often returns order ID as 'token'
    const payerID = queryParams.get('PayerID'); // PayPal returns PayerID

    if (!orderID || !payerID) {
      setError('Invalid PayPal redirect. Missing order information.');
      setMessage('');
      return;
    }

    const captureOrder = async () => {
      try {
        // Ensure token is available for authenticated endpoint
        if (!token) {
            setError('Authentication required to finalize payment.');
            setMessage('');
            // Optional: redirect to login or show login prompt
            // navigate('/login');
            return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/payments/paypal/capture-order/${orderID}`,
          { payerID }, // Include PayerID if your backend needs it for capture, though often just OrderID is enough for capture itself
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(response.data.message || 'Payment completed successfully!');
        setError('');
        // Optional: Redirect to a dashboard or orders page after a delay
        setTimeout(() => navigate('/dashboard'), 3000); // Example redirect
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to capture PayPal payment.');
        setMessage('');
        console.error('PayPal capture error:', err);
      }
    };

    captureOrder();
  }, [location, navigate, token]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>PayPal Payment Status</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!message && !error && <p>Loading...</p>}
    </div>
  );
}

export default PaypalSuccess;
