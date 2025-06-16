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

## Payment Integration Testing

This section outlines the test plan for M-Pesa and PayPal payment integrations. All tests should be performed in their respective sandbox environments before deploying to production.

### A. M-Pesa Sandbox Testing

**Prerequisites:**
*   Valid M-Pesa sandbox credentials (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY) configured in the backend's `.env` file.
*   The `MPESA_CALLBACK_URL` in `.env` must be publicly accessible (use ngrok for local development).
*   A Safaricom Daraja developer portal account with a registered test MSISDN (phone number) and sufficient test funds.
*   `MPESA_ENVIRONMENT` set to `sandbox`.

**Test Cases:**

1.  **TC-MPESA-001: Successful Payment**
    *   **Description:** Verify a complete successful M-Pesa STK push payment.
    *   **Steps:**
        1.  Navigate to the payment page in the frontend.
        2.  Enter a valid test M-Pesa phone number (e.g., 2547xxxxxxxx) and a valid amount.
        3.  Click "Pay with Mpesa".
        4.  On the registered test phone, receive the STK push prompt.
        5.  Enter the M-Pesa sandbox PIN to approve.
    *   **Expected Results:**
        *   Frontend: Shows an initiation message, then (ideally) a success confirmation.
        *   Backend: A transaction record is created with initial status `pending`.
        *   Backend: M-Pesa callback is received successfully.
        *   Backend: Transaction status updates to `completed`. `mpesaReceiptNumber` and M-Pesa's response are stored in the transaction record.
        *   Database: User's transaction list is updated.

2.  **TC-MPESA-002: User Cancels STK Push**
    *   **Description:** Verify behavior when the user cancels the STK push on their phone.
    *   **Steps:** (Follow TC-MPESA-001 up to step 4)
        5.  On the phone, select the option to cancel the STK push.
    *   **Expected Results:**
        *   Backend: M-Pesa callback is received with a failure/cancellation code.
        *   Backend: Transaction status updates to `failed`.

3.  **TC-MPESA-003: STK Push Timeout**
    *   **Description:** Verify behavior when the STK push times out.
    *   **Steps:** (Follow TC-MPESA-001 up to step 4)
        5.  Do not interact with the STK push on the phone; let it time out (usually 1-2 minutes).
    *   **Expected Results:**
        *   Backend: M-Pesa callback is received indicating a timeout or failure.
        *   Backend: Transaction status updates to `failed`.

4.  **TC-MPESA-004: Invalid Phone Number Format**
    *   **Description:** Test with an incorrectly formatted phone number.
    *   **Steps:**
        1.  Navigate to the payment page.
        2.  Enter an invalid phone number (e.g., "12345") and an amount.
        3.  Click "Pay with Mpesa".
    *   **Expected Results:**
        *   Frontend: Displays a validation error message.
        *   Backend: The request should be rejected by backend validation, or by M-Pesa if it reaches the API. No transaction or a `failed` transaction should result.

5.  **TC-MPESA-005: Payment with Zero or Negative Amount**
    *   **Description:** Test with a zero or negative amount.
    *   **Steps:**
        1.  Navigate to the payment page.
        2.  Enter a valid phone number and a zero or negative amount.
        3.  Click "Pay with Mpesa".
    *   **Expected Results:**
        *   Frontend: Displays a validation error message.
        *   Backend: Request rejected by validation.

### B. PayPal Sandbox Testing

**Prerequisites:**
*   Valid PayPal sandbox credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID) configured in the backend's `.env` file.
*   `PAYPAL_ENVIRONMENT` set to `sandbox`.
*   PayPal developer account with sandbox buyer and seller accounts (ensure buyer account has funds).
*   `PAYPAL_RETURN_URL` and `PAYPAL_CANCEL_URL` correctly configured (e.g., `http://localhost:3000/paypal/success`, `http://localhost:3000/paypal/cancel` for local testing).

**Test Cases:**

1.  **TC-PAYPAL-001: Successful Payment**
    *   **Description:** Verify a complete successful PayPal payment.
    *   **Steps:**
        1.  Navigate to the payment page in the frontend.
        2.  Enter a valid amount for PayPal payment.
        3.  Click "Create PayPal Order".
        4.  User is redirected to the PayPal sandbox site.
        5.  Log in with a sandbox buyer account.
        6.  Approve the payment on the PayPal site.
    *   **Expected Results:**
        *   Backend: Transaction created with status `created` and `paypalOrderId`.
        *   Frontend: User is redirected to the `PAYPAL_RETURN_URL` (e.g., `/paypal/success`).
        *   Frontend (`/paypal/success` page): Displays "Processing payment..." then "Payment completed successfully!".
        *   Backend: `/api/payments/paypal/capture-order/:orderID` endpoint is called by the success page.
        *   Backend: Payment is captured. Transaction status updates to `completed`. `paypalCaptureId` and PayPal's response are stored.
        *   Backend (Webhook): `CHECKOUT.ORDER.APPROVED` webhook is received, transaction status may update to `approved_by_user`.
        *   Backend (Webhook): `PAYMENT.CAPTURE.COMPLETED` webhook is received, transaction status confirms/updates to `completed`.
        *   Database: User's transaction list is updated.

2.  **TC-PAYPAL-002: User Cancels on PayPal Site**
    *   **Description:** Verify behavior when the user cancels the payment on the PayPal site.
    *   **Steps:** (Follow TC-PAYPAL-001 up to step 5)
        6.  On the PayPal site, click the "Cancel and return to merchant" (or similar) link.
    *   **Expected Results:**
        *   Frontend: User is redirected to the `PAYPAL_CANCEL_URL` (e.g., `/paypal/cancel`).
        *   Frontend (`/paypal/cancel` page): Displays a "Payment Cancelled" message.
        *   Backend: Transaction status remains `created` or may be marked `failed` if specific cancellation webhooks are handled. No capture occurs.

3.  **TC-PAYPAL-003: Payment Denied/Failed by PayPal**
    *   **Description:** Test a scenario where PayPal denies the payment (e.g., funding issue - may require specific sandbox card/account setup).
    *   **Steps:** (Follow TC-PAYPAL-001 up to step 6, but ensure the payment is set to fail in PayPal sandbox)
    *   **Expected Results:**
        *   Frontend: User might be redirected to `PAYPAL_RETURN_URL` or `PAYPAL_CANCEL_URL` depending on when the failure occurs.
        *   Frontend: Displays a payment failure message.
        *   Backend (Webhook): `PAYMENT.CAPTURE.DENIED` (or similar) webhook is received.
        *   Backend: Transaction status updates to `failed`.

4.  **TC-PAYPAL-004: Webhook Signature Verification (Requires Full Implementation)**
    *   **Description:** Test the PayPal webhook signature verification. (Note: Current implementation has a placeholder).
    *   **Steps:**
        1.  (Once fully implemented) Send a valid webhook event from PayPal sandbox dashboard to the backend's `/api/payments/paypal/webhook` endpoint.
        2.  (Once fully implemented) Send a webhook event with an invalid/tampered signature or body.
    *   **Expected Results:**
        1.  Valid webhook is processed successfully.
        2.  Invalid webhook is rejected with an HTTP 401 or 403 status.

5.  **TC-PAYPAL-005: Payment with Zero or Negative Amount**
    *   **Description:** Test with a zero or negative amount.
    *   **Steps:**
        1.  Navigate to the payment page.
        2.  Enter a zero or negative amount for PayPal.
        3.  Click "Create PayPal Order".
    *   **Expected Results:**
        *   Frontend: Displays a validation error message.
        *   Backend: Request rejected by validation.

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
