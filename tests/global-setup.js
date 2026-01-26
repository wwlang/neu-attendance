// @ts-check
/**
 * Global Setup for Playwright Tests
 *
 * Runs before all tests to:
 * 1. Acquire exclusive lock to prevent concurrent test runs
 * 2. Verify Firebase emulator is healthy
 * 3. Reset emulator data to ensure clean state
 */

const fs = require('fs');
const path = require('path');
const { checkEmulatorHealth, waitForEmulator, resetEmulatorData } = require('./utils/firebase-helpers');

const LOCK_FILE = path.join(__dirname, '..', '.playwright-lock');
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max test run time

/**
 * Acquire exclusive lock for test execution
 * Prevents concurrent test runs from interfering with each other
 * @returns {Promise<boolean>} true if lock acquired, false if another test is running
 */
async function acquireLock() {
  try {
    // Check if lock file exists
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      const lockAge = Date.now() - lockData.timestamp;

      // If lock is stale (older than timeout), remove it
      if (lockAge > LOCK_TIMEOUT_MS) {
        console.log(`Removing stale lock file (${Math.round(lockAge / 1000)}s old)`);
        fs.unlinkSync(LOCK_FILE);
      } else {
        console.error('');
        console.error('='.repeat(60));
        console.error('CONCURRENT TEST RUN DETECTED');
        console.error('='.repeat(60));
        console.error(`Another test run started ${Math.round(lockAge / 1000)}s ago (PID: ${lockData.pid})`);
        console.error('');
        console.error('Options:');
        console.error('  1. Wait for the other test run to complete');
        console.error('  2. Kill it: kill -9 ' + lockData.pid);
        console.error('  3. Remove stale lock: rm .playwright-lock');
        console.error('='.repeat(60));
        return false;
      }
    }

    // Create lock file with our PID and timestamp
    fs.writeFileSync(LOCK_FILE, JSON.stringify({
      pid: process.pid,
      timestamp: Date.now(),
      startedAt: new Date().toISOString()
    }));

    return true;
  } catch (error) {
    console.warn('Warning: Could not manage lock file:', error.message);
    return true; // Continue anyway
  }
}

/**
 * @type {import('@playwright/test').GlobalSetup}
 */
async function globalSetup() {
  // First, acquire exclusive lock
  const lockAcquired = await acquireLock();
  if (!lockAcquired) {
    console.error('Aborting test run to prevent data corruption.');
    process.exit(1);
  }

  console.log('Checking Firebase emulator health...');

  const isHealthy = await checkEmulatorHealth();

  if (!isHealthy) {
    console.log('Firebase emulator not immediately available, waiting...');
    const available = await waitForEmulator(10, 1000);

    if (!available) {
      // Release lock before exiting
      try { fs.unlinkSync(LOCK_FILE); } catch {}
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
