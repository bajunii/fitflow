module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/models/' // Models are tested via API, direct unit tests for schemas can be added if complex logic arises
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // Setup files to run before each test file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], // if we create a setup file
  // Test timeout, default is 5000. Increase if needed, especially for DB operations.
  testTimeout: 10000,
};
