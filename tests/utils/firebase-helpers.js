// @ts-check
/**
 * Firebase Emulator Helpers
 *
 * Utilities for managing Firebase emulator state during tests.
 */

const http = require('http');

const EMULATOR_HOST = 'localhost';
const DATABASE_EMULATOR_PORT = 9000;

/**
 * Check if Firebase emulator is running
 * @returns {Promise<boolean>}
 */
async function checkEmulatorHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: EMULATOR_HOST,
      port: DATABASE_EMULATOR_PORT,
      path: '/.json',
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 401);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Delete all data from the Firebase emulator
 * @param {string} projectId - Firebase project ID (default: 'demo-neu-attendance')
 * @returns {Promise<void>}
 */
async function resetEmulatorData(projectId = 'demo-neu-attendance') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: EMULATOR_HOST,
      port: DATABASE_EMULATOR_PORT,
      path: `/.json?ns=${projectId}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 204) {
        resolve();
      } else {
        reject(new Error(`Failed to reset emulator data: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      // If emulator is not running, just resolve (may be running without data)
      if (err.code === 'ECONNREFUSED') {
        console.warn('Firebase emulator not running - skipping data reset');
        resolve();
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Emulator reset request timed out'));
    });

    req.end();
  });
}

/**
 * Wait for emulator to be ready
 * @param {number} maxAttempts
 * @param {number} delayMs
 * @returns {Promise<boolean>}
 */
async function waitForEmulator(maxAttempts = 30, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkEmulatorHealth();
    if (isHealthy) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

module.exports = {
  checkEmulatorHealth,
  resetEmulatorData,
  waitForEmulator,
  EMULATOR_HOST,
  DATABASE_EMULATOR_PORT,
};
