// @ts-check
/**
 * Global Setup for Playwright Tests
 *
 * Runs before all tests to verify Firebase emulator is healthy.
 */

const { checkEmulatorHealth, waitForEmulator } = require('./utils/firebase-helpers');

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
}

module.exports = globalSetup;
