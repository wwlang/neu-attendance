/**
 * Firebase Backup Script
 *
 * Exports all data from Firebase Realtime Database to a timestamped JSON file.
 * Run this before risky operations or periodically for safety.
 *
 * Usage:
 *   Browser Console Method:
 *   1. Open the attendance app in your browser
 *   2. Open Developer Tools (F12) -> Console
 *   3. Copy and paste the browser script below
 *
 *   Node.js Method (requires firebase-admin):
 *   1. Set up service account credentials
 *   2. Run: node scripts/backup-firebase.js
 *
 * Firebase URL: https://neu-attendance-default-rtdb.asia-southeast1.firebasedatabase.app
 */

const BACKUP_PATHS = ['sessions', 'attendance', 'failed', 'audit'];

// Helper functions (also used in unit tests)
function generateBackupFilename(date = new Date()) {
  const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `backups/firebase-backup-${timestamp}.json`;
}

function formatBackupData(data) {
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    paths: BACKUP_PATHS,
    data: data
  };
}

function validateBackupData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  for (const path of BACKUP_PATHS) {
    if (!(path in data)) {
      errors.push(`Missing path: ${path}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

console.log('Firebase Backup Script');
console.log('======================');
console.log('');
console.log('To run this script in the browser:');
console.log('1. Open the attendance app in your browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste the code below:');
console.log('');
console.log('------- COPY FROM HERE -------');
console.log(`
// Firebase Backup - Browser Version
(async function() {
  const BACKUP_PATHS = ${JSON.stringify(BACKUP_PATHS)};

  console.log('Starting Firebase backup...');
  console.log('Paths to backup:', BACKUP_PATHS.join(', '));

  const data = {};

  for (const path of BACKUP_PATHS) {
    console.log('Fetching /' + path + '...');
    try {
      const snapshot = await firebase.database().ref(path).once('value');
      data[path] = snapshot.val() || {};
      const count = Object.keys(data[path]).length;
      console.log('  - Found ' + count + ' records');
    } catch (err) {
      console.error('  - ERROR: ' + err.message);
      data[path] = {};
    }
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    paths: BACKUP_PATHS,
    data: data
  };

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = 'firebase-backup-' + timestamp + '.json';

  // Create download
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('');
  console.log('Backup complete!');
  console.log('Downloaded: ' + filename);
  console.log('');
  console.log('Summary:');
  for (const path of BACKUP_PATHS) {
    console.log('  - ' + path + ': ' + Object.keys(data[path]).length + ' records');
  }
})();
`);
console.log('------- COPY TO HERE -------');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateBackupFilename,
    formatBackupData,
    validateBackupData,
    BACKUP_PATHS
  };
}
