const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory store for users (replace with a database in a real application)
const users = [];

// Secret key for JWT (store this securely in a real application)
const JWT_SECRET = 'your_jwt_secret_key_here'; // Replace with a strong, unique key

// Mpesa Configuration (placeholders - use environment variables in production)
const MPESA_BUSINESS_SHORT_CODE = '174379'; // Example ShortCode
const MPESA_PASSKEY = 'your_mpesa_passkey_here'; // Example Passkey

// PayPal Configuration (placeholders - use environment variables in production)
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';
const PAYPAL_CLIENT_SECRET = 'YOUR_PAYPAL_CLIENT_SECRET_HERE';
const PAYPAL_API_BASE_URL = 'https://api-m.sandbox.paypal.com'; // Sandbox URL

const axios = require('axios'); // For making HTTP requests to PayPal (simulated)
const MPESA_TRANSACTION_TYPE = 'CustomerPayBillOnline'; // or 'CustomerBuyGoodsOnline'

// In-memory store for transactions (replace with a database in a real application)
const transactions = [];

// Basic route
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// User Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    if (users.find(user => user.username === username)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Store user (in-memory for now)
    const newUser = { id: users.length + 1, username, password: hashedPassword, workouts: [] }; // Add workouts array
    users.push(newUser);

    console.log('User registered:', newUser); // For debugging

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = users.find(user => user.username === username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, userId: user.id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Mpesa STK Push Simulation Endpoint
app.post('/api/payments/mpesa/stk-push', async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ message: 'Amount and phoneNumber are required' });
    }

    // Basic validation for phone number (simplified)
    if (!/^254\d{9}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format. Expected 254xxxxxxxxx' });
    }

    const moment = require('moment');
    const timestamp = moment().format('YYYYMMDDHHmmss');
    // Password for STK push (Base64 encoded string of ShortCode + Passkey + Timestamp)
    const password = Buffer.from(MPESA_BUSINESS_SHORT_CODE + MPESA_PASSKEY + timestamp).toString('base64');

    // Simulate Mpesa STK Push request parameters
    const stkPushRequest = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: MPESA_TRANSACTION_TYPE,
      Amount: amount,
      PartyA: phoneNumber, // Customer's phone number
      PartyB: MPESA_BUSINESS_SHORT_CODE, // Your Paybill or Till Number
      PhoneNumber: phoneNumber, // Customer's phone number
      CallBackURL: `http://your_ngrok_or_public_url/api/payments/mpesa/callback`, // Replace with your actual callback URL
      AccountReference: 'FitnessCenterPayment', // Optional
      TransactionDesc: 'Payment for fitness services' // Optional
    };

    console.log('Simulating Mpesa STK Push with data:', stkPushRequest);

    // In a real scenario, you would make an HTTP POST request to Mpesa API here.
    // For simulation, we'll assume it's successful and Mpesa will call our callback.

    const newTransaction = {
      id: `txn_${Date.now()}`,
      phoneNumber,
      amount,
      status: 'pending',
      timestamp,
      checkoutRequestID: `chk_${Date.now()}` // Simulate a CheckoutRequestID
    };
    transactions.push(newTransaction);

    // Simulate Mpesa's immediate response to STK push request
    res.status(200).json({
      message: 'STK push initiated successfully. Check your phone to complete payment.',
      checkoutRequestID: newTransaction.checkoutRequestID,
      // In a real response from Safaricom, you'd get MerchantRequestID and CheckoutRequestID etc.
    });

  } catch (error) {
    console.error('Mpesa STK Push error:', error);
    res.status(500).json({ message: 'Server error during Mpesa STK Push' });
  }
});

// Mpesa Callback Endpoint (Simulated)
app.post('/api/payments/mpesa/callback', (req, res) => {
  console.log('Mpesa Callback Received:', JSON.stringify(req.body, null, 2));

  const callbackData = req.body.Body.stkCallback; // Structure based on typical Mpesa callback

  if (!callbackData) {
    console.error('Invalid callback format received');
    return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback format' });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

  const transaction = transactions.find(t => t.checkoutRequestID === CheckoutRequestID);

  if (!transaction) {
    console.error(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
    // Acknowledge receipt to Mpesa even if transaction not found locally to prevent retries from Mpesa
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted by server, but transaction not found locally.' });
  }

  if (ResultCode === 0) {
    // Payment successful
    transaction.status = 'completed';
    transaction.mpesaReceiptNumber = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber').Value;
    console.log(`Payment for ${CheckoutRequestID} successful. Receipt: ${transaction.mpesaReceiptNumber}`);
  } else {
    // Payment failed or cancelled
    transaction.status = 'failed';
    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;
    console.log(`Payment for ${CheckoutRequestID} failed. Reason: ${ResultDesc}`);
  }

  // Acknowledge receipt of the callback to Mpesa
  // In a real scenario, Mpesa expects a specific JSON response.
  // Example: { "ResultCode": 0, "ResultDesc": "Accepted" }
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed successfully by server.' });
});

// --- PayPal Integration ---

// Helper function to get PayPal Access Token (simulated)
async function getPayPalAccessToken() {
  // In a real app, you'd request this from PayPal and cache it.
  // This is a simplified mock.
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error.response ? error.response.data : error.message);
    // Simulate a token for environments where the call might fail due to network restrictions
    if (error.isAxiosError && !error.response) {
        console.warn("Simulating PayPal access token due to potential network restriction in sandbox.")
        return "SIMULATED_PAYPAL_ACCESS_TOKEN";
    }
    throw new Error('Failed to get PayPal access token');
  }
}

// Create PayPal Order Endpoint
app.post('/api/payments/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body; // e.g., amount: "10.00", currency: "USD"

    if (!amount || !currency) {
      return res.status(400).json({ message: 'Amount and currency are required' });
    }

    const accessToken = await getPayPalAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        }
      }],
      application_context: {
        // Replace with your actual frontend URLs
        return_url: `http://localhost:3000/paypal/success`, // User redirected here after approval
        cancel_url: `http://localhost:3000/paypal/cancel`   // User redirected here if they cancel
      }
    };

    // Simulate PayPal API call
    console.log('Simulating PayPal Create Order with payload:', orderPayload);
    // In a real scenario, you would make an HTTP POST request to PayPal's /v2/checkout/orders API.
    // const response = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders`, orderPayload, {
    //   headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    // });

    // Simulated response from PayPal
    const simulatedPayPalOrderId = `pp_ord_${Date.now()}`;
    const newTransaction = {
      id: simulatedPayPalOrderId,
      paymentGateway: 'paypal',
      amount: amount,
      currency: currency,
      status: 'created', // PayPal order status
      timestamp: new Date().toISOString()
    };
    transactions.push(newTransaction);

    console.log('PayPal order created (simulated):', newTransaction);
    res.status(201).json({
      orderID: simulatedPayPalOrderId,
      // The real response.data.links would contain an "approve" link for redirection.
      // For simulation, the frontend would use this orderID to redirect.
      approveLink: `${PAYPAL_API_BASE_URL}/checkoutnow?token=${simulatedPayPalOrderId}` // Example, not a real link structure
    });

  } catch (error) {
    console.error('PayPal Create Order error:', error.message);
    res.status(500).json({ message: 'Server error during PayPal order creation' });
  }
});

// Capture PayPal Order Endpoint
app.post('/api/payments/paypal/capture-order/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params;

    const transaction = transactions.find(t => t.id === orderID && t.paymentGateway === 'paypal');
    if (!transaction) {
      return res.status(404).json({ message: 'Order not found or not a PayPal transaction' });
    }
    if (transaction.status === 'completed') {
        return res.status(400).json({ message: 'Order already captured' });
    }

    const accessToken = await getPayPalAccessToken();

    // Simulate PayPal API call to capture the order
    console.log(`Simulating PayPal Capture Order for orderID: ${orderID}`);
    // In a real scenario, you'd make an HTTP POST request to PayPal's /v2/checkout/orders/${orderID}/capture API.
    // const response = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
    //    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    // });

    // Simulated successful capture
    transaction.status = 'completed'; // Or 'captured'
    transaction.captureTimestamp = new Date().toISOString();
    // transaction.paypalCaptureDetails = response.data; // Store actual capture details

    console.log('PayPal order captured (simulated):', transaction);
    res.status(200).json({
      message: 'Payment captured successfully',
      orderID: orderID,
      status: transaction.status,
      // captureDetails: transaction.paypalCaptureDetails // Send back capture details
    });

  } catch (error) {
    console.error('PayPal Capture Order error:', error.message);
    res.status(500).json({ message: 'Server error during PayPal order capture' });
  }
});

// PayPal Webhook Endpoint (Simulated)
app.post('/api/payments/paypal/webhook', async (req, res) => {
  console.log('PayPal Webhook Received:', JSON.stringify(req.body, null, 2));

  // In a real application, you MUST verify the webhook signature first for security.
  // This involves using the PayPal-Transmission-Id, PayPal-Transmission-Time, PayPal-Auth-Algo,
  // PayPal-Cert-Url, and the webhook ID from your PayPal developer dashboard.
  // For simulation, we'll skip this verification.

  const event = req.body; // The event payload from PayPal

  if (!event || !event.event_type || !event.resource || !event.resource.id) {
    console.error('Invalid PayPal webhook format or missing key information.');
    return res.status(400).send('Invalid webhook data');
  }

  const orderID = event.resource.id; // Assuming the ID in the resource is the order ID.
                                   // This can vary based on event_type.
                                   // For CHECKOUT.ORDER.APPROVED, it's usually the order ID.

  const transaction = transactions.find(t => t.id === orderID && t.paymentGateway === 'paypal');

  if (!transaction) {
    console.warn(`Webhook for orderID ${orderID} received, but no matching transaction found.`);
    // Still return 200 to PayPal to acknowledge receipt and prevent retries.
    return res.status(200).send('Webhook received; no local transaction found.');
  }

  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED':
      // User has approved the payment.
      // You might not need to do much here if you capture immediately on return_url.
      // But good for logging or if capture is delayed.
      transaction.status = 'approved_by_user';
      console.log(`PayPal order ${orderID} approved by user.`);
      break;
    case 'CHECKOUT.ORDER.COMPLETED': // This event might not exist, usually it's CAPTURE.COMPLETED
                                     // Or, for Orders V2, it's often CHECKOUT.ORDER.APPROVED then you capture.
                                     // And then a PAYMENT.CAPTURE.COMPLETED event.
      transaction.status = 'completed';
      transaction.paypalWebhookData = event.resource; // Store relevant data
      console.log(`PayPal order ${orderID} marked as completed via webhook.`);
      break;
    case 'PAYMENT.CAPTURE.COMPLETED':
      transaction.status = 'completed';
      transaction.paypalCaptureDetails = event.resource;
      transaction.paypalTransactionId = event.resource.id; // Capture ID
      console.log(`PayPal payment capture for order ${transaction.id} (PayPal Txn ID: ${event.resource.id}) completed via webhook.`);
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      transaction.status = 'failed';
      transaction.paypalWebhookData = event.resource;
      console.log(`PayPal payment capture for order ${transaction.id} denied. Reason: ${event.resource.status_details?.reason}`);
      break;
    // Add more event types as needed (e.g., REFUNDED, PENDING, etc.)
    default:
      console.log(`Received unhandled PayPal webhook event_type: ${event.event_type}`);
  }

  res.status(200).send('Webhook processed successfully'); // Acknowledge receipt to PayPal
});

// --- Core Fitness Features: Workout Tracking ---

// Helper function to find a user by ID
function findUserById(userId) {
  return users.find(user => user.id === parseInt(userId));
}

// Helper function to find a workout by ID across all users (and its user)
function findWorkoutById(workoutId) {
  for (const user of users) {
    const workout = user.workouts.find(w => w.id === workoutId);
    if (workout) {
      return { user, workout };
    }
  }
  return { user: null, workout: null };
}

// Create Workout for a User
app.post('/api/users/:userId/workouts', (req, res) => {
  const { userId } = req.params;
  const { type, duration, caloriesBurned, date } = req.body; // e.g., type: "Running", duration: 30 (mins), caloriesBurned: 300, date: "2024-07-28"

  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!type || !duration) {
    return res.status(400).json({ message: 'Workout type and duration are required' });
  }

  const newWorkout = {
    id: `wkout_${Date.now()}`, // Simple unique ID
    type,
    duration,
    caloriesBurned: caloriesBurned || null,
    date: date || new Date().toISOString()
  };

  user.workouts.push(newWorkout);
  console.log(`Workout created for user ${userId}:`, newWorkout);
  res.status(201).json(newWorkout);
});

// Retrieve all Workouts for a User
app.get('/api/users/:userId/workouts', (req, res) => {
  const { userId } = req.params;
  const user = findUserById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user.workouts);
});

// Retrieve a Specific Workout
app.get('/api/workouts/:workoutId', (req, res) => {
  const { workoutId } = req.params;
  const { workout } = findWorkoutById(workoutId);

  if (!workout) {
    return res.status(404).json({ message: 'Workout not found' });
  }
  res.status(200).json(workout);
});

// Update a Specific Workout
app.put('/api/workouts/:workoutId', (req, res) => {
  const { workoutId } = req.params;
  const updates = req.body; // e.g., { type, duration, caloriesBurned, date }

  const { user, workout } = findWorkoutById(workoutId);

  if (!workout) {
    return res.status(404).json({ message: 'Workout not found' });
  }

  // Update fields
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && key !== 'id') { // Do not update ID
      workout[key] = updates[key];
    }
  });

  console.log(`Workout ${workoutId} updated:`, workout);
  res.status(200).json(workout);
});

// Delete a Specific Workout
app.delete('/api/workouts/:workoutId', (req, res) => {
  const { workoutId } = req.params;
  const { user, workout } = findWorkoutById(workoutId);

  if (!workout) {
    return res.status(404).json({ message: 'Workout not found' });
  }

  user.workouts = user.workouts.filter(w => w.id !== workoutId);

  console.log(`Workout ${workoutId} deleted for user ${user.id}`);
  res.status(200).json({ message: 'Workout deleted successfully' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
