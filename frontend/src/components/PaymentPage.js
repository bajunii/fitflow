import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function PaymentPage() {
  const { user, token } = useAuth();

  // Mpesa States
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [mpesaError, setMpesaError] = useState('');
  const [isMpesaLoading, setIsMpesaLoading] = useState(false);

  // PayPal States
  const [paypalAmount, setPaypalAmount] = useState('');
  const [paypalMessage, setPaypalMessage] = useState('');
  const [paypalError, setPaypalError] = useState('');
  const [isPaypalLoading, setIsPaypalLoading] = useState(false);

  const handleMpesaSubmit = async (e) => {
    e.preventDefault();
    setMpesaMessage('');
    setMpesaError('');
    setIsMpesaLoading(true);

    if (!user || !user.userId) {
      setMpesaError('User not authenticated.');
      setIsMpesaLoading(false);
      return;
    }
    if (!mpesaPhoneNumber || !mpesaAmount) {
      setMpesaError('Phone number and amount are required for Mpesa payment.');
      setIsMpesaLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/mpesa/stk-push`,
        {
          amount: parseFloat(mpesaAmount),
          phoneNumber: mpesaPhoneNumber,
          userId: user.userId // Pass userId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMpesaMessage(response.data.message || 'STK push initiated successfully. Check your phone.');
      setMpesaPhoneNumber('');
      setMpesaAmount('');
    } catch (err) {
      setMpesaError(err.response?.data?.message || 'Mpesa payment initiation failed.');
      console.error('Mpesa STK push error:', err);
    } finally {
      setIsMpesaLoading(false);
    }
  };

  const handlePaypalSubmit = async (e) => {
    e.preventDefault();
    setPaypalMessage('');
    setPaypalError('');
    setIsPaypalLoading(true);

    if (!user || !user.userId) {
      setPaypalError('User not authenticated.');
      setIsPaypalLoading(false);
      return;
    }
    if (!paypalAmount) {
      setPaypalError('Amount is required for PayPal payment.');
      setIsPaypalLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/paypal/create-order`,
        {
          amount: paypalAmount,
          currency: 'USD', // Fixed currency for now
          userId: user.userId // Pass userId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // The backend sends back an orderID and potentially an approveLink
      // For this simulation, we'll just display a message.
      // In a real app, you'd use PayPal SDK or redirect to response.data.approveLink
      setPaypalMessage(`PayPal order created! Order ID: ${response.data.orderID}. Simulated approve link: ${response.data.approveLink}`);
      // Potentially: window.location.href = response.data.approveLink; (if direct redirect is desired)
      setPaypalAmount('');
    } catch (err) {
      setPaypalError(err.response?.data?.message || 'PayPal order creation failed.');
      console.error('PayPal create order error:', err);
    } finally {
      setIsPaypalLoading(false);
    }
  };

  const sectionStyle = {
    border: '1px solid #ddd',
    padding: '20px',
    marginBottom: '30px',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  };

  const inputStyle = { margin: '5px 0 10px 0', padding: '10px', width: 'calc(100% - 22px)', border: '1px solid #ccc', borderRadius: '4px' };
  const buttonStyle = { padding: '10px 15px', cursor: 'pointer', border: 'none', borderRadius: '4px', color: 'white' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Make a Payment</h2>

      {/* Mpesa Payment Section */}
      <div style={sectionStyle}>
        <h3>Mpesa Payment</h3>
        <form onSubmit={handleMpesaSubmit}>
          <div>
            <label htmlFor="mpesa-phone">Phone Number (e.g., 2547xxxxxxxx):</label>
            <input
              type="tel"
              id="mpesa-phone"
              value={mpesaPhoneNumber}
              onChange={(e) => setMpesaPhoneNumber(e.target.value)}
              placeholder="254712345678"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="mpesa-amount">Amount (KES):</label>
            <input
              type="number"
              id="mpesa-amount"
              value={mpesaAmount}
              onChange={(e) => setMpesaAmount(e.target.value)}
              placeholder="e.g., 100"
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={isMpesaLoading} style={{...buttonStyle, backgroundColor: isMpesaLoading ? '#ccc' : '#4CAF50'}}>
            {isMpesaLoading ? 'Processing...' : 'Pay with Mpesa (STK Push)'}
          </button>
        </form>
        {mpesaMessage && <p style={{ color: 'green', marginTop: '10px' }}>{mpesaMessage}</p>}
        {mpesaError && <p style={{ color: 'red', marginTop: '10px' }}>{mpesaError}</p>}
      </div>

      {/* PayPal Payment Section */}
      <div style={sectionStyle}>
        <h3>PayPal Payment</h3>
        <form onSubmit={handlePaypalSubmit}>
          <div>
            <label htmlFor="paypal-amount">Amount (USD):</label>
            <input
              type="number"
              id="paypal-amount"
              value={paypalAmount}
              onChange={(e) => setPaypalAmount(e.target.value)}
              placeholder="e.g., 10.00"
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={isPaypalLoading} style={{...buttonStyle, backgroundColor: isPaypalLoading ? '#ccc' : '#007bff'}}>
            {isPaypalLoading ? 'Processing...' : 'Create PayPal Order'}
          </button>
        </form>
        {paypalMessage && <p style={{ color: 'blue', marginTop: '10px' }}>{paypalMessage}</p>}
        {paypalError && <p style={{ color: 'red', marginTop: '10px' }}>{paypalError}</p>}
      </div>
    </div>
  );
}

export default PaymentPage;
