# Deployment Guide: Fitness Center Application

This guide outlines the general steps and considerations for deploying the Node.js backend and React frontend of the Fitness Center application. It assumes a transition from the current development setup (with in-memory data stores) to a production-ready environment.

## I. Core Deployment Concepts

### 1. Choosing Hosting Platforms

*   **Backend (Node.js):**
    *   **PaaS (Platform as a Service):** Heroku, AWS Elastic Beanstalk, Google App Engine, Render, Railway. These simplify deployment by managing servers, scaling, and some operational tasks.
    *   **IaaS (Infrastructure as a Service):** AWS EC2, Google Compute Engine, Azure VMs. Offer more control but require manual server management, OS patching, and configuration.
    *   **Containers:** Dockerizing the Node.js application and deploying to services like AWS ECS, Google Kubernetes Engine (GKE), Azure Kubernetes Service (AKS), or Docker Hub + a VM.
*   **Frontend (React):**
    *   **Static Site Hosting:** Vercel (ideal for Next.js/React), Netlify, AWS S3 + CloudFront, GitHub Pages (for simple static sites), Firebase Hosting. These are optimized for serving static assets quickly and often include CI/CD integration.
*   **Database:**
    *   **Managed Database Services:** AWS RDS, Google Cloud SQL, Azure Database services, MongoDB Atlas, ElephantSQL (for PostgreSQL). Recommended for production as they handle backups, scaling, and maintenance.

### 2. Environment Variables

Critical for security and configuration. **Never hardcode credentials or sensitive information.**
*   **Backend:**
    *   `PORT`: Port the server will listen on (often provided by the hosting platform).
    *   `NODE_ENV`: Set to `production`.
    *   `JWT_SECRET`: A strong, unique secret key for signing JSON Web Tokens.
    *   `DATABASE_URL`: Connection string for your chosen persistent database.
    *   `MPESA_BUSINESS_SHORT_CODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL_BASE`: Actual Mpesa credentials and the base URL for your deployed callback.
    *   `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_BASE_URL` (use `https://api-m.paypal.com` for live), `PAYPAL_WEBHOOK_ID`: Actual PayPal credentials and webhook ID.
*   **Frontend:**
    *   `REACT_APP_API_BASE_URL`: The URL of your deployed backend API (e.g., `https://api.yourdomain.com`).
*   **Management:** Hosting platforms provide ways to set environment variables securely. For local development, use `.env` files (and ensure `.env` is in `.gitignore`).

### 3. HTTPS Configuration

Essential for security, especially with login and payment processing.
*   Most PaaS and static hosting providers (Vercel, Netlify, Heroku) offer free, auto-renewing SSL/TLS certificates (often via Let's Encrypt).
*   If using IaaS (like EC2), you'll need to configure HTTPS manually using a reverse proxy like Nginx or Apache with Certbot/Let's Encrypt, or use a load balancer (e.g., AWS ELB) that handles SSL termination.

## II. Backend Deployment (Node.js)

### 1. Database Migration

*   **Current State:** Uses in-memory arrays (`users`, `transactions`). This is **not suitable for production.**
*   **Steps:**
    1.  **Choose a Database:** PostgreSQL, MongoDB, MySQL are common choices for Node.js.
    2.  **Set up Schema:** Define tables/collections based on the structure of `users` (including `workouts` array, which might become a separate related table/collection) and `transactions`.
    3.  **Install Database Driver:** E.g., `pg` for PostgreSQL, `mongodb` for MongoDB.
    4.  **Refactor Code:**
        *   Replace all in-memory array operations (push, find, filter, map, splice) with database queries (SQL or NoSQL methods).
        *   Update `server.js` to connect to the database on startup.
        *   Ensure proper error handling for database operations.
    5.  **Data Migration (Optional):** If there's existing data to preserve (not applicable here), plan a migration strategy.

### 2. Build & Package

*   **Transpilation (if using TypeScript/Babel):** Ensure your build process compiles your code to JavaScript that can run on Node.js. (The current project uses plain JS, so this is less critical).
*   **Dependencies:** `package.json` and `package-lock.json` are crucial. Ensure all production dependencies are listed.
*   **`.gitignore`:** Ensure `node_modules`, `.env` files, and other sensitive or build-specific files are ignored.

### 3. Deployment Process (General Example - Heroku/Render)

1.  **Create an App:** On your chosen hosting platform.
2.  **Connect Git Repository:** Link your GitHub/GitLab repository for CI/CD.
3.  **Set Environment Variables:** Through the platform's dashboard.
4.  **Define Start Script:** Ensure your `package.json` has a `scripts.start` command (e.g., `node server.js`). Platforms often use this.
5.  **Procfile (Heroku specific):** May be needed, e.g., `web: node server.js`.
6.  **Push to Deploy:** Push your code to the designated branch (e.g., `main` or `master`). The platform should auto-build and deploy.
7.  **Check Logs:** Monitor deployment logs for any errors.

### 4. Payment Gateway Callback URLs

*   **Mpesa:**
    *   The `CallBackURL` in `backend/server.js` for STK push must be updated to your deployed backend's public URL (e.g., `https://api.yourdomain.com/api/payments/mpesa/callback`).
    *   You need to register this URL with Safaricom on the Daraja portal for your application.
*   **PayPal:**
    *   **Webhook URL:** The `POST /api/payments/paypal/webhook` endpoint needs to be publicly accessible. You must register this URL (e.g., `https://api.yourdomain.com/api/payments/paypal/webhook`) in your PayPal Developer Dashboard for your application.
    *   **Return/Cancel URLs:** The `return_url` and `cancel_url` in the `create-order` payload should point to your deployed frontend routes that handle these outcomes.

## III. Frontend Deployment (React)

### 1. Build Process

*   Run `npm run build` (or `yarn build`) in your `frontend` directory. This creates an optimized static build in the `frontend/build` (or `frontend/dist`) directory.

### 2. Deployment Process (General Example - Vercel/Netlify)

1.  **Create an App/Site:** On Vercel, Netlify, etc.
2.  **Connect Git Repository:** Link your GitHub/GitLab repository.
3.  **Configure Build Settings:**
    *   **Build Command:** `npm run build` (or `yarn build`).
    *   **Publish Directory:** `frontend/build` (or `frontend/dist`).
    *   **Framework Preset:** Often auto-detected as React/Create React App.
4.  **Set Environment Variables:**
    *   `REACT_APP_API_BASE_URL`: Point to your deployed backend (e.g., `https://api.yourdomain.com`).
    *   Any other build-time variables.
5.  **Push to Deploy:** Push code to the designated branch.
6.  **Domain Configuration:** Assign a custom domain if desired.

## IV. Post-Deployment

### 1. Final Testing (End-to-End)

*   **Crucial Step:** Test all functionalities in the live production environment.
    *   User registration and login.
    *   Workout CRUD operations.
    *   **Payment Gateway Integration:** This is especially important. Perform test transactions with actual Mpesa (using test credentials if possible) and PayPal Sandbox/Live accounts.
        *   Verify STK push and callback processing for Mpesa.
        *   Verify PayPal order creation, user approval flow, payment capture, and webhook processing.
*   Check browser console for frontend errors and server logs for backend issues.

### 2. Monitoring & Logging

*   Set up monitoring and logging services (e.g., Sentry, LogRocket, New Relic, Datadog, or platform-specific tools) to track errors and performance in production.

### 3. Security Considerations Review

*   Ensure all environment variables are secure.
*   Regularly update dependencies.
*   Review security best practices for Node.js, Express, React, and your chosen database.
*   Validate and sanitize all user inputs on the backend.
*   Implement rate limiting and other protections against abuse if necessary.

This guide provides a high-level overview. Specific steps will vary significantly based on the chosen hosting platforms and tools. Always refer to the official documentation of the services you use.
