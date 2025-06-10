const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Assuming React app runs on port 3000
    supportFile: false, // We are not using a custom support file for this basic setup
    // We can add other configurations here if needed, like viewport size
    // viewportWidth: 1280,
    // viewportHeight: 720,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // (e.g., for tasks, plugins) - not needed for basic stubs
    },
  },
});
