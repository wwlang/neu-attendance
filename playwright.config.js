// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * NEU Attendance - Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/integration',

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
    /* Base URL for all tests - can be overridden with ENV */
    baseURL: process.env.BASE_URL || 'https://wwlang.github.io/neu-attendance/',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
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

    /* Test against mobile viewports */
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
  ],

  /* Timeout for each test */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000
  },
});
