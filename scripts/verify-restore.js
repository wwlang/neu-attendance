#!/usr/bin/env node
/**
 * Restore Verification Script
 *
 * Verifies that a backup JSON file can be restored to Firebase emulator.
 * This script should be run BEFORE any production operations to ensure
 * backups are valid and restorable.
 *
 * Usage:
 *   # Start emulators first (if not already running)
 *   npm run emulators &
 *
 *   # Verify a backup file
 *   node scripts/verify-restore.js backups/firebase-backup-2026-01-23T...json
 *
 * The script will:
 *   1. Clear any existing data in the emulator
 *   2. Import the backup JSON
 *   3. Query to verify data integrity
 *   4. Report success or failure
 */

const fs = require('fs');
const path = require('path');

// Emulator configuration
const EMULATOR_HOST = 'localhost';
const EMULATOR_PORT = 9000;
const DATABASE_URL = `http://${EMULATOR_HOST}:${EMULATOR_PORT}`;

// Expected paths in backup
const BACKUP_PATHS = ['sessions', 'attendance', 'failed', 'audit'];

/**
 * Make HTTP request to Firebase emulator
 */
async function emulatorRequest(method, path, data = null) {
  // Ensure path starts with / and handle empty path
  const normalizedPath = path === '' ? '/' : path;
  const url = `${DATABASE_URL}${normalizedPath}.json`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Emulator request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if emulator is running
 */
async function checkEmulatorRunning() {
  try {
    // Try to read root - will return null or data if emulator is up
    const url = `${DATABASE_URL}/.json`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear all data in emulator
 */
async function clearEmulatorData() {
  console.log('Clearing emulator data...');
  await emulatorRequest('DELETE', '');
  console.log('  - Emulator data cleared');
}

/**
 * Import backup data to emulator
 */
async function importBackup(backupData) {
  console.log('Importing backup data...');

  for (const path of BACKUP_PATHS) {
    const data = backupData.data[path] || {};
    const count = Object.keys(data).length;

    if (count > 0) {
      await emulatorRequest('PUT', `/${path}`, data);
      console.log(`  - Imported ${path}: ${count} records`);
    } else {
      console.log(`  - Skipped ${path}: 0 records`);
    }
  }
}

/**
 * Verify data integrity after import
 */
async function verifyData(originalBackup) {
  console.log('Verifying data integrity...');
  const errors = [];

  for (const path of BACKUP_PATHS) {
    const originalData = originalBackup.data[path] || {};
    const originalCount = Object.keys(originalData).length;

    if (originalCount === 0) {
      console.log(`  - ${path}: Skipped (0 records in backup)`);
      continue;
    }

    // Fetch restored data
    const restoredData = await emulatorRequest('GET', `/${path}`) || {};
    const restoredCount = Object.keys(restoredData).length;

    if (originalCount !== restoredCount) {
      errors.push(`${path}: Expected ${originalCount} records, got ${restoredCount}`);
      console.log(`  - ${path}: FAILED (expected ${originalCount}, got ${restoredCount})`);
    } else {
      console.log(`  - ${path}: OK (${restoredCount} records)`);
    }

    // Verify a sample record
    const originalKeys = Object.keys(originalData);
    if (originalKeys.length > 0) {
      const sampleKey = originalKeys[0];
      const originalRecord = JSON.stringify(originalData[sampleKey]);
      const restoredRecord = JSON.stringify(restoredData[sampleKey]);

      if (originalRecord !== restoredRecord) {
        errors.push(`${path}/${sampleKey}: Record content mismatch`);
        console.log(`  - ${path}/${sampleKey}: CONTENT MISMATCH`);
      }
    }
  }

  return errors;
}

/**
 * Load and validate backup file
 */
function loadBackupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const backup = JSON.parse(content);

  // Validate backup structure
  if (!backup.data || typeof backup.data !== 'object') {
    throw new Error('Invalid backup: missing "data" object');
  }

  if (!backup.version) {
    throw new Error('Invalid backup: missing "version" field');
  }

  if (!backup.exportedAt) {
    throw new Error('Invalid backup: missing "exportedAt" field');
  }

  return backup;
}

/**
 * Print summary statistics
 */
function printSummary(backup) {
  console.log('\nBackup Summary:');
  console.log(`  - Exported at: ${backup.exportedAt}`);
  console.log(`  - Version: ${backup.version}`);

  for (const path of BACKUP_PATHS) {
    const count = Object.keys(backup.data[path] || {}).length;
    console.log(`  - ${path}: ${count} records`);
  }
  console.log('');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/verify-restore.js <backup-file>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/verify-restore.js backups/firebase-backup-2026-01-23T10-30-00.json');
    console.log('');
    console.log('Prerequisites:');
    console.log('  - Firebase emulator must be running: npm run emulators');
    process.exit(1);
  }

  const backupPath = args[0];
  const absolutePath = path.isAbsolute(backupPath)
    ? backupPath
    : path.join(process.cwd(), backupPath);

  console.log('=== Firebase Restore Verification ===\n');

  // Step 1: Check emulator
  console.log('Step 1: Checking emulator...');
  const emulatorRunning = await checkEmulatorRunning();
  if (!emulatorRunning) {
    console.error('ERROR: Firebase emulator is not running.');
    console.error('Start it with: npm run emulators');
    process.exit(1);
  }
  console.log('  - Emulator is running at', DATABASE_URL);
  console.log('');

  // Step 2: Load backup
  console.log('Step 2: Loading backup file...');
  let backup;
  try {
    backup = loadBackupFile(absolutePath);
    console.log(`  - Loaded: ${absolutePath}`);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }

  printSummary(backup);

  // Step 3: Clear emulator
  console.log('Step 3: Clearing emulator...');
  await clearEmulatorData();
  console.log('');

  // Step 4: Import backup
  console.log('Step 4: Importing backup to emulator...');
  await importBackup(backup);
  console.log('');

  // Step 5: Verify data
  console.log('Step 5: Verifying restored data...');
  const errors = await verifyData(backup);
  console.log('');

  // Step 6: Report results
  console.log('=== Verification Results ===\n');

  if (errors.length === 0) {
    console.log('✓ Restore verification PASSED');
    console.log('');
    console.log('The backup file can be successfully restored.');
    console.log('You may proceed with production operations.');
    process.exit(0);
  } else {
    console.log('✗ Restore verification FAILED');
    console.log('');
    console.log('Errors:');
    errors.forEach(err => console.log(`  - ${err}`));
    console.log('');
    console.log('DO NOT proceed with production operations until this is resolved.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
