#!/usr/bin/env node
/**
 * Admin Cleanup Script - Run with Firebase Admin SDK
 *
 * Usage:
 *   node scripts/admin-cleanup.js
 *
 * Requires:
 *   - scripts/service-account.json (download from Firebase Console)
 *   - npm install firebase-admin
 */

const admin = require('firebase-admin');
const path = require('path');

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
  console.error('Please download it from Firebase Console:');
  console.error('  1. Go to Firebase Console → Project Settings → Service Accounts');
  console.error('  2. Click "Generate new private key"');
  console.error('  3. Save as: scripts/service-account.json');
  process.exit(1);
}

const db = admin.database();

// Test session detection patterns
function isTestSession(session) {
  const name = (session.className || '').toLowerCase();
  const testPatterns = [
    /test/i, /empty/i, /export/i, /qr\s/i, /csv/i, /stats/i,
    /increment/i, /decrement/i, /min zero/i, /participation/i,
    /archive/i, /active test/i, /history/i, /manual entry/i,
    /session end/i, /\d{13}$/ // ends with timestamp
  ];
  return testPatterns.some(pattern => pattern.test(name));
}

async function cleanupTestSessions() {
  console.log('Loading sessions...');

  const snapshot = await db.ref('sessions').once('value');
  const sessions = [];

  snapshot.forEach(child => {
    const session = child.val();
    session.id = child.key;
    if (isTestSession(session)) {
      sessions.push(session);
    }
  });

  console.log(`Found ${sessions.length} test sessions to delete.`);

  if (sessions.length === 0) {
    console.log('No test sessions found. Database is clean!');
    return;
  }

  let deleted = 0;
  let errors = 0;

  for (const session of sessions) {
    try {
      await db.ref('sessions/' + session.id).remove();
      await db.ref('attendance/' + session.id).remove();
      await db.ref('failed/' + session.id).remove();
      await db.ref('audit/' + session.id).remove();
      deleted++;

      if (deleted % 50 === 0) {
        console.log(`Progress: ${deleted}/${sessions.length}`);
      }
    } catch (err) {
      console.error(`Failed to delete ${session.id}:`, err.message);
      errors++;
    }
  }

  console.log('\n=== Cleanup Complete ===');
  console.log(`Deleted: ${deleted} test sessions`);
  console.log(`Errors: ${errors}`);
}

async function listSessions() {
  console.log('Loading sessions...');

  const snapshot = await db.ref('sessions').once('value');
  const testSessions = [];
  const realSessions = [];

  snapshot.forEach(child => {
    const session = child.val();
    session.id = child.key;
    if (isTestSession(session)) {
      testSessions.push(session);
    } else {
      realSessions.push(session);
    }
  });

  console.log(`\n=== Real Sessions (${realSessions.length}) ===`);
  realSessions.forEach(s => console.log(`  - ${s.className}`));

  console.log(`\n=== Test Sessions (${testSessions.length}) ===`);
  if (testSessions.length <= 20) {
    testSessions.forEach(s => console.log(`  - ${s.className}`));
  } else {
    console.log(`  (showing first 20)`);
    testSessions.slice(0, 20).forEach(s => console.log(`  - ${s.className}`));
  }
}

// Main
const command = process.argv[2] || 'list';

(async () => {
  try {
    if (command === 'cleanup') {
      await cleanupTestSessions();
    } else if (command === 'list') {
      await listSessions();
    } else {
      console.log('Usage: node scripts/admin-cleanup.js [list|cleanup]');
      console.log('  list    - Show test vs real sessions');
      console.log('  cleanup - Delete all test sessions');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
})();
