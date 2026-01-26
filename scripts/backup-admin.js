#!/usr/bin/env node
/**
 * Firebase Backup Script - Admin SDK Version
 *
 * Creates a backup of all Firebase data using the Admin SDK.
 *
 * Usage:
 *   node scripts/backup-admin.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const BACKUP_PATHS = ['sessions', 'attendance', 'failed', 'audit'];

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'service-account.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://neu-attendance-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
} catch (err) {
  console.error('Error: Could not load service account key.');
  process.exit(1);
}

async function createBackup() {
  const db = admin.database();
  const data = {};

  console.log('Creating Firebase backup...\n');

  for (const path of BACKUP_PATHS) {
    console.log(`Fetching /${path}...`);
    try {
      const snapshot = await db.ref(path).once('value');
      data[path] = snapshot.val() || {};
      const count = Object.keys(data[path]).length;
      console.log(`  - Found ${count} records`);
    } catch (err) {
      console.error(`  - ERROR: ${err.message}`);
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
  const filename = `backups/firebase-backup-${timestamp}.json`;
  const fullPath = path.join(__dirname, '..', filename);

  // Ensure backups directory exists
  const backupsDir = path.dirname(fullPath);
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Write backup
  fs.writeFileSync(fullPath, JSON.stringify(backup, null, 2));

  console.log('\nBackup complete!');
  console.log(`Saved to: ${filename}`);
  console.log('\nSummary:');
  for (const p of BACKUP_PATHS) {
    console.log(`  - ${p}: ${Object.keys(data[p]).length} records`);
  }

  return filename;
}

createBackup()
  .then(filename => {
    console.log(`\nBackup file: ${filename}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
