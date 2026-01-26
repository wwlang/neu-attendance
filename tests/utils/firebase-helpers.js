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
 *
 * According to Firebase documentation, the correct way to clear Realtime Database
 * is to write `null` to the root reference using PUT, not DELETE.
 * @see https://firebase.google.com/docs/emulator-suite/connect_rtdb
 *
 * IMPORTANT: The databaseName must match the Firebase database URL format,
 * e.g., 'neu-attendance-default-rtdb' (not just 'neu-attendance')
 *
 * @param {string} databaseName - Database name from databaseURL (default: 'neu-attendance-default-rtdb')
 * @returns {Promise<void>}
 */
async function resetEmulatorData(databaseName = 'neu-attendance-default-rtdb') {
  console.log(`[Reset] Clearing all data from emulator (PUT null to ns=${databaseName})...`);
  return new Promise((resolve, reject) => {
    // Firebase RTDB: Clear data by writing null to root (not DELETE)
    // Note: databaseName must match the database URL, e.g., 'neu-attendance-default-rtdb'
    // not just the project ID
    const body = JSON.stringify(null);
    const options = {
      hostname: EMULATOR_HOST,
      port: DATABASE_EMULATOR_PORT,
      path: `/.json?ns=${databaseName}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[Reset] SUCCESS - emulator data cleared (status: ${res.statusCode})`);
          resolve();
        } else {
          console.error(`[Reset] FAILED - status: ${res.statusCode}, response: ${data}`);
          reject(new Error(`Failed to reset emulator data: ${res.statusCode}`));
        }
      });
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

    req.write(body);
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
