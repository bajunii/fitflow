const request = require('supertest');
const express = require('express'); // To setup a minimal app for testing if server.js is complex
const mongoose = require('mongoose');

// IMPORTANT: We need to ensure that server.js does not immediately connect to DB upon require,
// or that its connection is mockable/deferrable.
// For this test, we will assume server.js exports the app and its Mongoose connection
// is influenced by the MONGODB_URI set in setup.js.

// Let's try to require the app from server.js.
// This might be problematic if server.js connects to DB immediately.
// A better pattern for testable apps is to have server.js export the app
// and a separate start script that calls app.listen and connects to DB.
let app;

// Delay requiring server.js until after setup.js has run (which sets MONGODB_URI)
beforeAll(() => {
  // Now that MONGODB_URI should be set by setup.js, require the app
  // This assumes server.js uses the MONGODB_URI from process.env for its connection
  app = require('../server');
});


describe('Auth API Endpoints', () => {
  // Test User Registration
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body).toHaveProperty('userId');
    });

    it('should prevent registration with a duplicate username', async () => {
      await request(app) // First registration
        .post('/api/auth/register')
        .send({ username: 'duplicateuser', password: 'password123' });

      const res = await request(app) // Attempt second registration
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          password: 'password456',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('should require username and password for registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser_no_pass',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Username and password are required.');
    });
  });

  // Test User Login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'loginuser', password: 'password123' });
    });

    it('should login an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('username', 'loginuser');
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials (password mismatch)');
    });

    it('should fail login for a non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials (user not found)');
    });
  });
});

// This is a hacky way to ensure mongoose connection is closed after tests
// if server.js is not structured to export its server instance for graceful shutdown.
// Ideally, server.js should export the http.Server instance.
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
