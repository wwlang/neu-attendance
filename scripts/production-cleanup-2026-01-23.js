#!/usr/bin/env node
/**
 * Production Database Cleanup Script - 2026-01-23
 *
 * This script performs cleanup operations on the production Firebase database:
 * - Deletes sessions with 0 students
 * - Deletes "Test with Andre" session
 * - Updates session metadata for remaining sessions
 *
 * SAFETY: Always run with 'list' command first to review changes.
 *
 * Usage:
 *   node scripts/production-cleanup-2026-01-23.js list     # Review sessions (read-only)
 *   node scripts/production-cleanup-2026-01-23.js delete   # Delete empty/test sessions
 *   node scripts/production-cleanup-2026-01-23.js update   # Update session metadata
 *   node scripts/production-cleanup-2026-01-23.js verify   # Verify final state
 *
 * Prerequisites:
 *   - scripts/service-account.json (download from Firebase Console)
 *   - npm install firebase-admin
 *   - BACKUP taken and verified via verify-restore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Session metadata updates
const LOCATION = {
  lat: 21.000242803306723,
  lng: 105.84250647224566,
  address: 'Building A1, 2R2R+2X Hai Bà Trưng District, Hanoi, Vietnam'
};

const SCHEDULE = {
  start: '09:30',
  end: '12:15'
};

const SECTION_A_METADATA = {
  className: 'EP09.NHQT1119 Section A',
  code: 'EP09.NHQT1119',
  section: 'A'
};

const SECTION_B_METADATA = {
  className: 'EP09.NHQT1119 Section B',
  code: 'EP09.NHQT1119',
  section: 'B'
};

// Initialize Firebase Admin
function initializeFirebase() {
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://neu-attendance-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
    return admin.database();
  } catch (err) {
    console.error('Error: Could not load service account key.');
    console.error('Please download it from Firebase Console:');
    console.error('  1. Go to Firebase Console → Project Settings → Service Accounts');
    console.error('  2. Click "Generate new private key"');
    console.error('  3. Save as: scripts/service-account.json');
    process.exit(1);
  }
}

/**
 * Get day of week from session timestamp
 */
function getDayOfWeek(session) {
  const timestamp = session.createdAt || session.startedAt;
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return date.getDay(); // 0 = Sunday, 2 = Tuesday, 4 = Thursday
}

/**
 * Check if session should be deleted
 * @param {Object} session - Session object
 * @param {number} actualAttendanceCount - Actual count from attendance records
 */
function shouldDelete(session, actualAttendanceCount) {
  // Delete "Test with Andre" session
  const className = (session.className || '').toLowerCase();
  if (className.includes('test with andre')) {
    return { delete: true, reason: 'Test session' };
  }

  // Delete sessions with 0 attendance (check actual records, not just attendanceCount field)
  if (actualAttendanceCount === 0) {
    return { delete: true, reason: 'Zero attendance' };
  }

  return { delete: false, reason: null };
}

/**
 * List all sessions with categorization
 */
async function listSessions(db) {
  console.log('=== Production Session Analysis ===\n');
  console.log('Loading sessions and attendance...\n');

  const [sessionsSnapshot, attendanceSnapshot] = await Promise.all([
    db.ref('sessions').once('value'),
    db.ref('attendance').once('value')
  ]);

  // Build attendance count map from actual records
  const attendanceCounts = {};
  attendanceSnapshot.forEach(child => {
    const sessionId = child.key;
    const records = child.val() || {};
    attendanceCounts[sessionId] = Object.keys(records).length;
  });

  const sessionsToDelete = [];
  const tuesdaySessions = [];
  const thursdaySessions = [];
  const otherSessions = [];

  sessionsSnapshot.forEach(child => {
    const session = child.val();
    session.id = child.key;
    const dayOfWeek = getDayOfWeek(session);
    const actualAttendance = attendanceCounts[session.id] || 0;

    const deleteCheck = shouldDelete(session, actualAttendance);
    if (deleteCheck.delete) {
      sessionsToDelete.push({ ...session, deleteReason: deleteCheck.reason, actualAttendance });
    } else if (dayOfWeek === 2) {
      tuesdaySessions.push({ ...session, actualAttendance });
    } else if (dayOfWeek === 4) {
      thursdaySessions.push({ ...session, actualAttendance });
    } else {
      otherSessions.push({ ...session, actualAttendance });
    }
  });

  // Print sessions to delete
  console.log(`=== Sessions to DELETE (${sessionsToDelete.length}) ===`);
  if (sessionsToDelete.length === 0) {
    console.log('  (none)');
  } else {
    sessionsToDelete.forEach(s => {
      const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
      console.log(`  - [${s.deleteReason}] ${s.className || 'Unnamed'} (${date}) - ${s.actualAttendance} students`);
    });
  }
  console.log('');

  // Print Tuesday sessions
  console.log(`=== TUESDAY Sessions (${tuesdaySessions.length}) → Section A ===`);
  if (tuesdaySessions.length === 0) {
    console.log('  (none)');
  } else {
    tuesdaySessions.forEach(s => {
      const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
      console.log(`  - ${s.className || 'Unnamed'} (${date}) - ${s.actualAttendance} students`);
    });
  }
  console.log('');

  // Print Thursday sessions
  console.log(`=== THURSDAY Sessions (${thursdaySessions.length}) → Section B ===`);
  if (thursdaySessions.length === 0) {
    console.log('  (none)');
  } else {
    thursdaySessions.forEach(s => {
      const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
      console.log(`  - ${s.className || 'Unnamed'} (${date}) - ${s.actualAttendance} students`);
    });
  }
  console.log('');

  // Print other sessions
  if (otherSessions.length > 0) {
    console.log(`=== OTHER Sessions (${otherSessions.length}) - Manual Review ===`);
    otherSessions.forEach(s => {
      const dayOfWeek = getDayOfWeek(s);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek] || 'Unknown';
      const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
      console.log(`  - [${dayName}] ${s.className || 'Unnamed'} (${date}) - ${s.actualAttendance} students`);
    });
    console.log('');
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`  Total sessions: ${sessionsToDelete.length + tuesdaySessions.length + thursdaySessions.length + otherSessions.length}`);
  console.log(`  To delete: ${sessionsToDelete.length}`);
  console.log(`  Tuesday (Section A): ${tuesdaySessions.length}`);
  console.log(`  Thursday (Section B): ${thursdaySessions.length}`);
  console.log(`  Other: ${otherSessions.length}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Verify backup: node scripts/verify-restore.js backups/<your-backup>.json');
  console.log('  2. Delete: node scripts/production-cleanup-2026-01-23.js delete');
  console.log('  3. Update: node scripts/production-cleanup-2026-01-23.js update');
}

/**
 * Delete empty and test sessions
 */
async function deleteSessions(db) {
  console.log('=== Delete Empty/Test Sessions ===\n');

  // Create pre-delete backup timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`Pre-delete timestamp: ${timestamp}`);
  console.log('REMINDER: Ensure you have a backup before proceeding!\n');

  // Load sessions and attendance
  const [sessionsSnapshot, attendanceSnapshot] = await Promise.all([
    db.ref('sessions').once('value'),
    db.ref('attendance').once('value')
  ]);

  // Build attendance count map from actual records
  const attendanceCounts = {};
  attendanceSnapshot.forEach(child => {
    const sessionId = child.key;
    const records = child.val() || {};
    attendanceCounts[sessionId] = Object.keys(records).length;
  });

  const toDelete = [];

  sessionsSnapshot.forEach(child => {
    const session = child.val();
    session.id = child.key;
    const actualAttendance = attendanceCounts[session.id] || 0;
    const deleteCheck = shouldDelete(session, actualAttendance);
    if (deleteCheck.delete) {
      toDelete.push({ ...session, deleteReason: deleteCheck.reason });
    }
  });

  if (toDelete.length === 0) {
    console.log('No sessions to delete.');
    return;
  }

  console.log(`Found ${toDelete.length} sessions to delete:\n`);
  toDelete.forEach(s => {
    console.log(`  - [${s.deleteReason}] ${s.className || 'Unnamed'} (ID: ${s.id})`);
  });
  console.log('');

  // Perform deletions
  console.log('Deleting...');
  let deleted = 0;
  let errors = 0;

  for (const session of toDelete) {
    try {
      await db.ref('sessions/' + session.id).remove();
      await db.ref('attendance/' + session.id).remove();
      await db.ref('failed/' + session.id).remove();
      await db.ref('audit/' + session.id).remove();
      deleted++;
      console.log(`  ✓ Deleted: ${session.id}`);
    } catch (err) {
      errors++;
      console.log(`  ✗ Failed: ${session.id} - ${err.message}`);
    }
  }

  console.log('\n=== Delete Complete ===');
  console.log(`  Deleted: ${deleted}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Update session metadata
 */
async function updateSessions(db) {
  console.log('=== Update Session Metadata ===\n');

  // Create pre-update backup timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`Pre-update timestamp: ${timestamp}`);
  console.log('REMINDER: Ensure you have a backup before proceeding!\n');

  // Load sessions
  const snapshot = await db.ref('sessions').once('value');
  const tuesdaySessions = [];
  const thursdaySessions = [];

  snapshot.forEach(child => {
    const session = child.val();
    session.id = child.key;
    const dayOfWeek = getDayOfWeek(session);

    // Skip sessions marked for deletion
    const deleteCheck = shouldDelete(session);
    if (deleteCheck.delete) return;

    if (dayOfWeek === 2) {
      tuesdaySessions.push(session);
    } else if (dayOfWeek === 4) {
      thursdaySessions.push(session);
    }
  });

  console.log(`Tuesday sessions to update: ${tuesdaySessions.length}`);
  console.log(`Thursday sessions to update: ${thursdaySessions.length}`);
  console.log('');

  let updated = 0;
  let errors = 0;

  // Update Tuesday sessions (Section A)
  console.log('Updating Tuesday sessions (Section A)...');
  for (const session of tuesdaySessions) {
    try {
      await db.ref('sessions/' + session.id).update({
        ...SECTION_A_METADATA,
        schedule: SCHEDULE,
        location: LOCATION
      });
      updated++;
      console.log(`  ✓ Updated: ${session.id}`);
    } catch (err) {
      errors++;
      console.log(`  ✗ Failed: ${session.id} - ${err.message}`);
    }
  }

  // Update Thursday sessions (Section B)
  console.log('\nUpdating Thursday sessions (Section B)...');
  for (const session of thursdaySessions) {
    try {
      await db.ref('sessions/' + session.id).update({
        ...SECTION_B_METADATA,
        schedule: SCHEDULE,
        location: LOCATION
      });
      updated++;
      console.log(`  ✓ Updated: ${session.id}`);
    } catch (err) {
      errors++;
      console.log(`  ✗ Failed: ${session.id} - ${err.message}`);
    }
  }

  console.log('\n=== Update Complete ===');
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Verify final state
 */
async function verifySessions(db) {
  console.log('=== Verification Checklist ===\n');

  const [sessionsSnapshot, attendanceSnapshot] = await Promise.all([
    db.ref('sessions').once('value'),
    db.ref('attendance').once('value')
  ]);

  // Build attendance count map from actual records
  const attendanceCounts = {};
  attendanceSnapshot.forEach(child => {
    const sessionId = child.key;
    const records = child.val() || {};
    attendanceCounts[sessionId] = Object.keys(records).length;
  });

  const results = {
    emptySessionsDeleted: true,
    testSessionsDeleted: true,
    tuesdayCorrect: true,
    thursdayCorrect: true,
    locationCorrect: true,
    scheduleCorrect: true
  };
  const issues = [];

  sessionsSnapshot.forEach(child => {
    const session = child.val();
    session.id = child.key;
    const dayOfWeek = getDayOfWeek(session);
    const actualAttendance = attendanceCounts[session.id] || 0;

    // Check: No empty sessions (use actual attendance records)
    if (actualAttendance === 0) {
      results.emptySessionsDeleted = false;
      issues.push(`Empty session still exists: ${session.id}`);
    }

    // Check: No test sessions
    const className = (session.className || '').toLowerCase();
    if (className.includes('test with andre')) {
      results.testSessionsDeleted = false;
      issues.push(`Test session still exists: ${session.id}`);
    }

    // Check: Tuesday sessions have correct metadata
    if (dayOfWeek === 2) {
      if (session.className !== SECTION_A_METADATA.className) {
        results.tuesdayCorrect = false;
        issues.push(`Tuesday session ${session.id} has wrong className: ${session.className}`);
      }
      if (session.section !== 'A') {
        results.tuesdayCorrect = false;
        issues.push(`Tuesday session ${session.id} has wrong section: ${session.section}`);
      }
    }

    // Check: Thursday sessions have correct metadata
    if (dayOfWeek === 4) {
      if (session.className !== SECTION_B_METADATA.className) {
        results.thursdayCorrect = false;
        issues.push(`Thursday session ${session.id} has wrong className: ${session.className}`);
      }
      if (session.section !== 'B') {
        results.thursdayCorrect = false;
        issues.push(`Thursday session ${session.id} has wrong section: ${session.section}`);
      }
    }

    // Check: Location
    if (dayOfWeek === 2 || dayOfWeek === 4) {
      if (!session.location || session.location.lat !== LOCATION.lat || session.location.lng !== LOCATION.lng) {
        results.locationCorrect = false;
        issues.push(`Session ${session.id} has incorrect location`);
      }
    }

    // Check: Schedule
    if (dayOfWeek === 2 || dayOfWeek === 4) {
      if (!session.schedule || session.schedule.start !== SCHEDULE.start || session.schedule.end !== SCHEDULE.end) {
        results.scheduleCorrect = false;
        issues.push(`Session ${session.id} has incorrect schedule`);
      }
    }
  });

  // Print results
  console.log('Checklist:');
  console.log(`  [${results.emptySessionsDeleted ? '✓' : '✗'}] All sessions with 0 students deleted`);
  console.log(`  [${results.testSessionsDeleted ? '✓' : '✗'}] "Test with Andre" session deleted`);
  console.log(`  [${results.tuesdayCorrect ? '✓' : '✗'}] Tuesday sessions have className "EP09.NHQT1119 Section A"`);
  console.log(`  [${results.thursdayCorrect ? '✓' : '✗'}] Thursday sessions have className "EP09.NHQT1119 Section B"`);
  console.log(`  [${results.locationCorrect ? '✓' : '✗'}] All sessions have correct location coordinates`);
  console.log(`  [${results.scheduleCorrect ? '✓' : '✗'}] All sessions have schedule { start: "09:30", end: "12:15" }`);
  console.log('');

  if (issues.length === 0) {
    console.log('=== Verification PASSED ===');
    console.log('All cleanup operations completed successfully.');
  } else {
    console.log('=== Verification FAILED ===');
    console.log('\nIssues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\nPlease investigate and resolve these issues.');
  }
}

/**
 * Main
 */
async function main() {
  const command = process.argv[2];

  if (!command || !['list', 'delete', 'update', 'verify'].includes(command)) {
    console.log('Production Database Cleanup - 2026-01-23');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/production-cleanup-2026-01-23.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  list    - Review sessions (read-only)');
    console.log('  delete  - Delete empty/test sessions');
    console.log('  update  - Update session metadata');
    console.log('  verify  - Verify final state');
    console.log('');
    console.log('Recommended order:');
    console.log('  1. Create backup (browser console with backup-firebase.js)');
    console.log('  2. Verify backup: node scripts/verify-restore.js <backup-file>');
    console.log('  3. Review: node scripts/production-cleanup-2026-01-23.js list');
    console.log('  4. Delete: node scripts/production-cleanup-2026-01-23.js delete');
    console.log('  5. Update: node scripts/production-cleanup-2026-01-23.js update');
    console.log('  6. Verify: node scripts/production-cleanup-2026-01-23.js verify');
    process.exit(1);
  }

  const db = initializeFirebase();

  try {
    switch (command) {
      case 'list':
        await listSessions(db);
        break;
      case 'delete':
        await deleteSessions(db);
        break;
      case 'update':
        await updateSessions(db);
        break;
      case 'verify':
        await verifySessions(db);
        break;
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
