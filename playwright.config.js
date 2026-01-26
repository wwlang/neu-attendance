// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * NEU Attendance - Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Test Stability Configuration (2026-01-23):
 * - Serial execution (workers: 1) to prevent database race conditions
 * - fullyParallel: false to ensure tests run sequentially
 * - retries: 2 for transient failures (emulator timing, network)
 * - Global setup resets emulator data before test suite
 */

// E2E tests ALWAYS use Firebase emulator to avoid polluting production database
// The emulator must be running: npm run emulators
const baseURL = 'http://localhost:3000?emulator=true';

module.exports = defineConfig({
  testDir: './tests/integration',

  /* Global setup to verify emulator is running and reset data */
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',

  /* Run tests sequentially to prevent database race conditions */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests (handles transient emulator timing issues) */
  retries: 2,

  /* Single worker to prevent parallel database access race conditions */
  workers: 1,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL - always uses emulator to avoid production database pollution */
    baseURL: baseURL,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Action timeout - prevents hanging on individual actions */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Mock geolocation for all tests (NEU campus area)
        geolocation: { latitude: 21.0285, longitude: 105.8542 },
        permissions: ['geolocation'],
      },
    },
    // Firefox and WebKit disabled for now - focus on chromium stability
    /*
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        geolocation: { latitude: 21.0285, longitude: 105.8542 },
        permissions: ['geolocation'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        geolocation: { latitude: 21.0285, longitude: 105.8542 },
        permissions: ['geolocation'],
      },
    },
    */

    /* Test against mobile viewports - temporarily disabled due to viewport issues
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        geolocation: { latitude: 21.0285, longitude: 105.8542 },
        permissions: ['geolocation'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        geolocation: { latitude: 21.0285, longitude: 105.8542 },
        permissions: ['geolocation'],
      },
    },
    */
  ],

  /* Timeout for each test */
  timeout: 60000,

  /* Expect timeout - increased for Firebase sync operations */
  expect: {
    timeout: 10000
  },

  /* Run local server and Firebase emulator before tests */
  /* Note: For CI, use npm run test:e2e:emulator which handles emulator lifecycle */
  webServer: {
    command: 'npx serve -l 3000 -n',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
  /* IMPORTANT: Firebase emulator must be running separately: npm run emulators */
});
