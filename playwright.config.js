// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * NEU Attendance - Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */

// E2E tests ALWAYS use Firebase emulator to avoid polluting production database
// The emulator must be running: npm run emulators
const baseURL = 'http://localhost:3000?emulator=true';

module.exports = defineConfig({
  testDir: './tests/integration',

  /* Global setup to verify emulator is running */
  globalSetup: './tests/global-setup.js',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

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
