const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Define collections to clear - add more as needed
const collectionsToClear = ['users', 'workouts', 'goals', 'transactions'];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Set the MONGODB_URI for the test environment
  // This will be used by your server.js when mongoose.connect is called
  process.env.MONGODB_URI = mongoUri;

  // It's important that your main server.js file doesn't automatically connect
  // on require, or that its connection logic can be re-evaluated or is delayed.
  // For this setup, we assume server.js will use process.env.MONGODB_URI when it sets up its connection.
  // If server.js connects immediately upon require, this might be too late.
  // A common pattern is to have a connectDB function exported from server.js or a db.js file.

  // Connect mongoose to the in-memory server for test setup/teardown utilities
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB Memory Server started at ${mongoUri}`);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('MongoDB Memory Server stopped.');
});

// Clear all test data after each test or suite
// Using afterEach to ensure a clean state for every test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (collectionsToClear.includes(key)) { // Only clear specified collections
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Helper function to clear all data if needed manually during a test
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
     if (collectionsToClear.includes(key)) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

module.exports = { clearDatabase };
