const request = require('supertest');
const mongoose = require('mongoose');
let app; // Will be required in beforeAll
let User; // User model
let Workout; // Workout model

let testUser;
let authToken;
let userId;

beforeAll(async () => {
  // Ensure MONGODB_URI is set by setup.js before this runs
  app = require('../server');
  User = mongoose.model('User'); // Get User model after mongoose is connected
  Workout = mongoose.model('Workout'); // Get Workout model
});

// Setup a test user and get a token before running workout tests
beforeEach(async () => {
  // Clear previous test data more explicitly if needed, though afterEach in setup.js should handle it.
  await User.deleteMany({});
  await Workout.deleteMany({});

  const userResponse = await request(app)
    .post('/api/auth/register')
    .send({ username: 'workoutuser', password: 'password123' });
  userId = userResponse.body.userId;

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ username: 'workoutuser', password: 'password123' });
  authToken = loginResponse.body.token;

  // Fetch the user document to use its _id directly for creating workouts
  testUser = await User.findById(userId);
  if (!testUser) {
    throw new Error('Test user could not be created or found for workout tests.');
  }
});


describe('Workout API Endpoints', () => {
  // Test Create Workout
  describe('POST /api/users/:userId/workouts', () => {
    it('should create a new workout for the authenticated user', async () => {
      const res = await request(app)
        .post(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`) // Assuming token-based auth for workout routes
        .send({
          type: 'Running',
          duration: 30,
          caloriesBurned: 300,
          date: new Date().toISOString(),
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.type).toEqual('Running');
      expect(res.body.user.toString()).toEqual(testUser._id.toString()); // Check user association

      // Verify it's in the user's workouts array
      const userWithWorkouts = await User.findById(testUser._id).populate('workouts');
      expect(userWithWorkouts.workouts.length).toBe(1);
      expect(userWithWorkouts.workouts[0].type).toBe('Running');
    });

    it('should return 400 for missing type or duration', async () => {
      const res = await request(app)
        .post(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: 30 }); // Missing type
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Workout type and duration are required');
    });

    it('should return 404 if user not found', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();
        const res = await request(app)
        .post(`/api/users/${nonExistentUserId}/workouts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'Jogging',
          duration: 45,
        });
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });
  });

  // Test Get All Workouts for a User
  describe('GET /api/users/:userId/workouts', () => {
    it('should retrieve all workouts for a user', async () => {
      // Create a workout first
      await request(app)
        .post(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'Cycling', duration: 60 });

      const res = await request(app)
        .get(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].type).toEqual('Cycling');
    });

     it('should return 404 if user not found when getting workouts', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();
        const res = await request(app)
        .get(`/api/users/${nonExistentUserId}/workouts`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  // Test Get Specific Workout
  describe('GET /api/workouts/:workoutId', () => {
    let workoutId;
    it('should retrieve a specific workout by ID', async () => {
      const createdWorkout = await request(app)
        .post(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'Swimming', duration: 45 });
      workoutId = createdWorkout.body._id;

      const res = await request(app)
        .get(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id', workoutId);
      expect(res.body.type).toEqual('Swimming');
      expect(res.body.user._id.toString()).toEqual(testUser._id.toString());
    });

    it('should return 404 for a non-existent workout ID', async () => {
      const nonExistentWorkoutId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/workouts/${nonExistentWorkoutId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  // Test Update Workout
  describe('PUT /api/workouts/:workoutId', () => {
     let workoutIdToUpdate;
    beforeEach(async () => {
        const createdWorkout = await request(app)
        .post(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'Yoga', duration: 60, caloriesBurned: 150 });
        workoutIdToUpdate = createdWorkout.body._id;
    });

    it('should update an existing workout', async () => {
      const res = await request(app)
        .put(`/api/workouts/${workoutIdToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: 75, caloriesBurned: 200 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.duration).toEqual(75);
      expect(res.body.caloriesBurned).toEqual(200);
    });

    it('should return 404 when trying to update a non-existent workout', async () => {
      const nonExistentWorkoutId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/workouts/${nonExistentWorkoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: 30 });
      expect(res.statusCode).toEqual(404);
    });
  });

  // Test Delete Workout
  describe('DELETE /api/workouts/:workoutId', () => {
    let workoutIdToDelete;
     beforeEach(async () => {
        const createdWorkout = await request(app)
        .post(`/api/users/${testUser._id}/workouts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'Hiking', duration: 120 });
        workoutIdToDelete = createdWorkout.body._id;
    });

    it('should delete an existing workout', async () => {
      const res = await request(app)
        .delete(`/api/workouts/${workoutIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Workout deleted successfully');

      // Verify user's workouts array is updated
      const userAfterDelete = await User.findById(testUser._id);
      expect(userAfterDelete.workouts.includes(workoutIdToDelete)).toBe(false);
    });

    it('should return 404 when trying to delete a non-existent workout', async () => {
      const nonExistentWorkoutId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/workouts/${nonExistentWorkoutId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
