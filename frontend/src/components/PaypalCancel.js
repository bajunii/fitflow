import React from 'react';
import { Link } from 'react-router-dom';

function PaypalCancel() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>PayPal Payment Cancelled</h2>
      <p>Your PayPal payment was cancelled or failed.</p>
      <p>If you'd like to try again or choose a different payment method, please go back to the payments page.</p>
      <Link to="/payment">Go to Payment Page</Link>
    </div>
  );
}

export default PaypalCancel;
