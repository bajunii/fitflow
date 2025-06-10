# Backend API Test Plan

This document outlines the test plan for the backend APIs of the Fitness Center application. Due to environment limitations, these tests are defined but not executed. Testing would typically be done using tools like Postman, Jest, Mocha & Chai, or other API testing frameworks.

## 1. User Authentication API Tests

Base URL: `/api/auth`

### 1.1. User Registration (`POST /register`)

**Objective:** Verify that new users can register successfully and that error handling for existing users or bad input works correctly.

*   **Test Case 1.1.1: Successful Registration**
    *   **Description:** Register a new user with valid credentials.
    *   **Request Payload:**
        ```json
        {
          "username": "testuser1",
          "password": "password123"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `201 Created`
        *   Body: `{ "message": "User registered successfully" }`
    *   **Verification:**
        *   User is added to the in-memory `users` array (or database).
        *   Password stored is hashed.

*   **Test Case 1.1.2: Registration with Existing Username**
    *   **Description:** Attempt to register a user with a username that already exists.
    *   **Request Payload:**
        ```json
        {
          "username": "testuser1", // Assuming testuser1 was created in 1.1.1
          "password": "password456"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "User already exists" }`

*   **Test Case 1.1.3: Registration with Missing Fields**
    *   **Description:** Attempt to register without providing username or password.
    *   **Request Payload (example: missing password):**
        ```json
        {
          "username": "testuser2"
        }
        ```
    *   **Expected Response:** (Depends on specific validation implemented; assuming server checks)
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Username and password are required" }` (or similar, server.js would need this validation explicitly for the test to pass like this)

### 1.2. User Login (`POST /login`)

**Objective:** Verify that registered users can log in and receive a JWT, and that login fails for invalid credentials or non-existent users.

*   **Test Case 1.2.1: Successful Login**
    *   **Description:** Log in with a registered user's valid credentials.
    *   **Prerequisites:** User "testuser1" registered.
    *   **Request Payload:**
        ```json
        {
          "username": "testuser1",
          "password": "password123"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: Contains `token`, `userId`, `username`. Example:
            ```json
            {
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Actual token
              "userId": 1,
              "username": "testuser1"
            }
            ```

*   **Test Case 1.2.2: Login with Incorrect Password**
    *   **Description:** Attempt to log in with a correct username but incorrect password.
    *   **Request Payload:**
        ```json
        {
          "username": "testuser1",
          "password": "wrongpassword"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Invalid credentials" }`

*   **Test Case 1.2.3: Login with Non-existent User**
    *   **Description:** Attempt to log in with a username that is not registered.
    *   **Request Payload:**
        ```json
        {
          "username": "nouser",
          "password": "password123"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Invalid credentials" }`

## 2. Mpesa Payment API Tests (Simulated)

Base URL: `/api/payments/mpesa`

### 2.1. STK Push Request (`POST /stk-push`)

**Objective:** Verify that the STK push request is initiated correctly (simulated) and that input validation works.

*   **Test Case 2.1.1: Successful STK Push Initiation**
    *   **Description:** Initiate an STK push with valid amount and phone number.
    *   **Request Payload:**
        ```json
        {
          "amount": 10,
          "phoneNumber": "254712345678"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `{ "message": "STK push initiated successfully. Check your phone to complete payment.", "checkoutRequestID": "chk_..." }`
    *   **Verification:**
        *   A transaction is added to the in-memory `transactions` array with status 'pending'.

*   **Test Case 2.1.2: STK Push with Invalid Phone Number**
    *   **Description:** Initiate STK push with an invalid phone number format.
    *   **Request Payload:**
        ```json
        {
          "amount": 10,
          "phoneNumber": "0712345678" // Missing country code or invalid format
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Invalid phone number format. Expected 254xxxxxxxxx" }`

*   **Test Case 2.1.3: STK Push with Missing Amount**
    *   **Description:** Initiate STK push without providing the amount.
    *   **Request Payload:**
        ```json
        {
          "phoneNumber": "254712345678"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Amount and phoneNumber are required" }`

### 2.2. Mpesa Callback (`POST /callback`)

**Objective:** Verify that the backend can process simulated Mpesa callbacks and update transaction status.

*   **Test Case 2.2.1: Successful Payment Callback**
    *   **Description:** Simulate a successful payment callback from Mpesa.
    *   **Prerequisites:** An STK push initiated, and its `checkoutRequestID` is known (e.g., "chk_123").
    *   **Request Payload (Structure based on Safaricom documentation):**
        ```json
        {
          "Body": {
            "stkCallback": {
              "MerchantRequestID": "merchant_req_123",
              "CheckoutRequestID": "chk_123", // Match an existing pending transaction
              "ResultCode": 0,
              "ResultDesc": "The service request is processed successfully.",
              "CallbackMetadata": {
                "Item": [
                  { "Name": "Amount", "Value": 10.00 },
                  { "Name": "MpesaReceiptNumber", "Value": "RCI123ABC456" },
                  { "Name": "TransactionDate", "Value": 20240728123045 },
                  { "Name": "PhoneNumber", "Value": 254712345678 }
                ]
              }
            }
          }
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `{ "ResultCode": 0, "ResultDesc": "Callback processed successfully by server." }`
    *   **Verification:**
        *   The corresponding transaction in `transactions` array has its status updated to 'completed' and `mpesaReceiptNumber` stored.

*   **Test Case 2.2.2: Failed Payment Callback (e.g., User Cancelled)**
    *   **Description:** Simulate a failed payment callback (user cancelled).
    *   **Prerequisites:** `checkoutRequestID` "chk_123" exists.
    *   **Request Payload:**
        ```json
        {
          "Body": {
            "stkCallback": {
              "MerchantRequestID": "merchant_req_123",
              "CheckoutRequestID": "chk_123",
              "ResultCode": 1032, // Example: Request cancelled by user
              "ResultDesc": "Request cancelled by user."
            }
          }
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `{ "ResultCode": 0, "ResultDesc": "Callback processed successfully by server." }`
    *   **Verification:**
        *   Transaction status updated to 'failed', `resultCode` and `resultDesc` stored.

*   **Test Case 2.2.3: Callback for Non-existent Transaction**
    *   **Description:** Simulate a callback for a `CheckoutRequestID` not in the system.
    *   **Request Payload:**
        ```json
        {
          "Body": {
            "stkCallback": {
              "MerchantRequestID": "merchant_req_404",
              "CheckoutRequestID": "chk_NONEXISTENT",
              "ResultCode": 0,
              "ResultDesc": "Success"
              // ... other fields
            }
          }
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK` (Server acknowledges, but logs error)
        *   Body: `{ "ResultCode": 0, "ResultDesc": "Accepted by server, but transaction not found locally." }`

## 3. PayPal Payment API Tests (Simulated)

Base URL: `/api/payments/paypal`

### 3.1. Create PayPal Order (`POST /create-order`)

**Objective:** Verify simulated PayPal order creation.

*   **Test Case 3.1.1: Successful Order Creation**
    *   **Description:** Create a PayPal order with valid amount and currency.
    *   **Request Payload:**
        ```json
        {
          "amount": "20.00",
          "currency": "USD"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `201 Created`
        *   Body: Contains `orderID` and `approveLink`. Example:
            ```json
            {
              "orderID": "pp_ord_...",
              "approveLink": "https://api-m.sandbox.paypal.com/checkoutnow?token=pp_ord_..."
            }
            ```
    *   **Verification:**
        *   Transaction added to `transactions` with `paymentGateway: 'paypal'` and `status: 'created'`.

*   **Test Case 3.1.2: Create Order with Missing Fields**
    *   **Description:** Attempt to create an order without amount or currency.
    *   **Request Payload (example: missing currency):**
        ```json
        {
          "amount": "20.00"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Amount and currency are required" }`

### 3.2. Capture PayPal Order (`POST /capture-order/:orderID`)

**Objective:** Verify simulated PayPal order capture.

*   **Test Case 3.2.1: Successful Order Capture**
    *   **Description:** Capture a previously created PayPal order.
    *   **Prerequisites:** A PayPal order created, `orderID` is known (e.g., "pp_ord_123").
    *   **Request Path:** `/api/payments/paypal/capture-order/pp_ord_123`
    *   **Request Payload:** (Empty, or could contain payer details if needed by API) `{}`
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `{ "message": "Payment captured successfully", "orderID": "pp_ord_123", "status": "completed" }`
    *   **Verification:**
        *   Transaction status for "pp_ord_123" updated to 'completed'.

*   **Test Case 3.2.2: Capture Non-existent Order**
    *   **Description:** Attempt to capture an order that does not exist.
    *   **Request Path:** `/api/payments/paypal/capture-order/pp_ord_INVALID`
    *   **Request Payload:** `{}`
    *   **Expected Response:**
        *   Status Code: `404 Not Found`
        *   Body: `{ "message": "Order not found or not a PayPal transaction" }`

*   **Test Case 3.2.3: Capture Already Captured Order**
    *   **Description:** Attempt to capture an order that has already been completed.
    *   **Prerequisites:** Order "pp_ord_123" has been successfully captured.
    *   **Request Path:** `/api/payments/paypal/capture-order/pp_ord_123`
    *   **Request Payload:** `{}`
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Order already captured" }`

### 3.3. PayPal Webhook (`POST /webhook`)

**Objective:** Verify that the backend can process simulated PayPal webhooks.

*   **Test Case 3.3.1: Webhook for Payment Capture Completed**
    *   **Description:** Simulate a `PAYMENT.CAPTURE.COMPLETED` webhook.
    *   **Prerequisites:** A PayPal order "pp_ord_abc" exists (can be in 'created' or 'approved_by_user' state).
    *   **Request Payload (Simplified PayPal Webhook Structure):**
        ```json
        {
          "event_type": "PAYMENT.CAPTURE.COMPLETED",
          "resource": {
            "id": "capture_id_xyz", // This is the capture ID
            "status": "COMPLETED",
            "amount": { "currency_code": "USD", "value": "20.00" },
            "links": [ // This structure might contain the order_id in a parent object in real webhooks.
                       // For this simulation, we assume event.resource.id refers to order_id if not a capture event,
                       // or we'd need to adjust how we find the transaction for capture events.
                       // The current server.js code uses event.resource.id as orderID.
                       // Let's assume for this test, the webhook refers to the orderID for simplicity.
                       // A better webhook processing would look for `purchase_units[0].reference_id` or similar for custom order ID.
                       // Or, if `event.resource.id` is the *capture* ID, the server logic would need to correlate it back to an order.
                       // For the current code: `event.resource.id` is treated as the Order ID.
                       // So, we'll use the `orderID` here.
                       "id": "pp_ord_abc" // The Order ID
          }
          // ... other webhook details
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `"Webhook processed successfully"`
    *   **Verification:**
        *   Transaction "pp_ord_abc" status updated to 'completed'. `paypalCaptureDetails` and `paypalTransactionId` (capture ID) stored.

*   **Test Case 3.3.2: Webhook for Checkout Order Approved**
    *   **Description:** Simulate a `CHECKOUT.ORDER.APPROVED` webhook.
    *   **Prerequisites:** PayPal order "pp_ord_def" exists, status 'created'.
    *   **Request Payload:**
        ```json
        {
          "event_type": "CHECKOUT.ORDER.APPROVED",
          "resource": {
            "id": "pp_ord_def", // Order ID
            "status": "APPROVED"
            // ...
          }
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
    *   **Verification:**
        *   Transaction "pp_ord_def" status updated to 'approved_by_user'.

*   **Test Case 3.3.3: Webhook with Unhandled Event Type**
    *   **Description:** Send a webhook with an event type not explicitly handled.
    *   **Request Payload:**
        ```json
        {
          "event_type": "SOME.OTHER.EVENT",
          "resource": { "id": "pp_ord_xyz" }
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK` (Server acknowledges, logs "Received unhandled PayPal webhook event_type")
    *   **Verification:**
        *   Transaction status for "pp_ord_xyz" (if exists) remains unchanged by this specific event.

## 4. Workout Tracking API Tests

Base URL: `/api`

User ID for testing: Assume user `id: 1` (e.g., "testuser1") exists.

### 4.1. Create Workout (`POST /users/:userId/workouts`)

*   **Test Case 4.1.1: Successfully Create a Workout**
    *   **Description:** Add a new workout for an existing user.
    *   **Request Path:** `/api/users/1/workouts`
    *   **Request Payload:**
        ```json
        {
          "type": "Running",
          "duration": 30,
          "caloriesBurned": 350,
          "date": "2024-07-28T10:00:00.000Z"
        }
        ```
    *   **Expected Response:**
        *   Status Code: `201 Created`
        *   Body: Matches payload, plus an `id` and default date if not provided. Example:
            ```json
            {
              "id": "wkout_...",
              "type": "Running",
              "duration": 30,
              "caloriesBurned": 350,
              "date": "2024-07-28T10:00:00.000Z"
            }
            ```
    *   **Verification:** Workout added to user 1's `workouts` array.

*   **Test Case 4.1.2: Create Workout for Non-existent User**
    *   **Request Path:** `/api/users/999/workouts` (user 999 does not exist)
    *   **Request Payload:** (Same as 4.1.1)
    *   **Expected Response:**
        *   Status Code: `404 Not Found`
        *   Body: `{ "message": "User not found" }`

*   **Test Case 4.1.3: Create Workout with Missing Required Fields**
    *   **Request Path:** `/api/users/1/workouts`
    *   **Request Payload (missing type):**
        ```json
        {
          "duration": 30
        }
        ```
    *   **Expected Response:**
        *   Status Code: `400 Bad Request`
        *   Body: `{ "message": "Workout type and duration are required" }`

### 4.2. Retrieve All Workouts for User (`GET /users/:userId/workouts`)

*   **Test Case 4.2.1: Get Workouts for User with Workouts**
    *   **Prerequisites:** User 1 has one or more workouts.
    *   **Request Path:** `/api/users/1/workouts`
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: An array of workout objects.

*   **Test Case 4.2.2: Get Workouts for User with No Workouts**
    *   **Prerequisites:** Register a new user (e.g., user 2) who has no workouts.
    *   **Request Path:** `/api/users/2/workouts`
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `[]` (empty array)

*   **Test Case 4.2.3: Get Workouts for Non-existent User**
    *   **Request Path:** `/api/users/999/workouts`
    *   **Expected Response:**
        *   Status Code: `404 Not Found`
        *   Body: `{ "message": "User not found" }`

### 4.3. Retrieve Specific Workout (`GET /workouts/:workoutId`)

*   **Test Case 4.3.1: Get Existing Workout**
    *   **Prerequisites:** A workout exists (e.g., created in 4.1.1, ID "wkout_123").
    *   **Request Path:** `/api/workouts/wkout_123`
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: The workout object "wkout_123".

*   **Test Case 4.3.2: Get Non-existent Workout**
    *   **Request Path:** `/api/workouts/wkout_INVALID`
    *   **Expected Response:**
        *   Status Code: `404 Not Found`
        *   Body: `{ "message": "Workout not found" }`

### 4.4. Update Specific Workout (`PUT /workouts/:workoutId`)

*   **Test Case 4.4.1: Successfully Update Workout**
    *   **Prerequisites:** Workout "wkout_123" exists.
    *   **Request Path:** `/api/workouts/wkout_123`
    *   **Request Payload:**
        ```json
        {
          "duration": 45,
          "caloriesBurned": 400
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: The updated workout object with duration 45 and caloriesBurned 400.
    *   **Verification:** The workout details are changed in the user's `workouts` array.

*   **Test Case 4.4.2: Update Non-existent Workout**
    *   **Request Path:** `/api/workouts/wkout_INVALID`
    *   **Request Payload:** (Same as 4.4.1)
    *   **Expected Response:**
        *   Status Code: `404 Not Found`
        *   Body: `{ "message": "Workout not found" }`

*   **Test Case 4.4.3: Attempt to Update Workout ID (Should be ignored)**
    *   **Prerequisites:** Workout "wkout_123" exists.
    *   **Request Path:** `/api/workouts/wkout_123`
    *   **Request Payload:**
        ```json
        {
          "id": "wkout_cannot_change_this",
          "duration": 50
        }
        ```
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: Workout object with `id: "wkout_123"` and `duration: 50`. The ID should not change.

### 4.5. Delete Specific Workout (`DELETE /workouts/:workoutId`)

*   **Test Case 4.5.1: Successfully Delete Workout**
    *   **Prerequisites:** Workout "wkout_123" exists.
    *   **Request Path:** `/api/workouts/wkout_123`
    *   **Expected Response:**
        *   Status Code: `200 OK`
        *   Body: `{ "message": "Workout deleted successfully" }`
    *   **Verification:** Workout "wkout_123" is removed from the user's `workouts` array.

*   **Test Case 4.5.2: Delete Non-existent Workout**
    *   **Request Path:** `/api/workouts/wkout_INVALID`
    *   **Expected Response:**
        *   Status Code: `404 Not Found`
        *   Body: `{ "message": "Workout not found" }`

---
End of Test Plan.
```
