// @ts-check
/**
 * Global Setup for Playwright Tests
 *
 * Runs before all tests to:
 * 1. Verify Firebase emulator is healthy
 * 2. Reset emulator data to ensure clean state
 */

const { checkEmulatorHealth, waitForEmulator, resetEmulatorData } = require('./utils/firebase-helpers');

/**
 * @type {import('@playwright/test').GlobalSetup}
 */
async function globalSetup() {
  console.log('Checking Firebase emulator health...');

  const isHealthy = await checkEmulatorHealth();

  if (!isHealthy) {
    console.log('Firebase emulator not immediately available, waiting...');
    const available = await waitForEmulator(10, 1000);

    if (!available) {
      console.error('Firebase emulator is not running!');
      console.error('Please start the emulator first: npm run emulators');
      console.error('Or use: npm run test:e2e:emulator (handles emulator lifecycle)');
      process.exit(1);
    }
  }

  console.log('Firebase emulator is ready.');

  // Reset emulator data before test suite to ensure clean state
  console.log('Resetting emulator data for clean test run...');
  try {
    await resetEmulatorData();
    console.log('Emulator data reset complete.');
  } catch (error) {
    console.warn('Warning: Could not reset emulator data:', error.message);
    // Continue anyway - tests may still work
  }
}

module.exports = globalSetup;
