// @ts-check
/**
 * Global Teardown for Playwright Tests
 *
 * Runs after all tests to:
 * 1. Release the exclusive lock file
 */

const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '..', '.playwright-lock');

/**
 * @type {import('@playwright/test').GlobalTeardown}
 */
async function globalTeardown() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      // Only remove if it's our lock
      if (lockData.pid === process.pid) {
        fs.unlinkSync(LOCK_FILE);
        console.log('Test lock released.');
      }
    }
  } catch (error) {
    console.warn('Warning: Could not release lock file:', error.message);
  }
}

module.exports = globalTeardown;
