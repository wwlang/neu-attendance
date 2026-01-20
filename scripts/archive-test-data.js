/**
 * Archive Test Data Script
 *
 * This script queries and deletes sessions with test-related names from Firebase,
 * including associated data in /attendance/{sessionId}, /failed/{sessionId}, /audit/{sessionId}
 *
 * Usage:
 *   1. Open the attendance app in your browser
 *   2. Open Developer Tools (F12) -> Console
 *   3. Copy and paste the browser script below
 *
 * Firebase URL: https://neu-attendance-default-rtdb.asia-southeast1.firebasedatabase.app
 */

const TEST_PATTERNS = [
  'Test',
  'test',
  'Flicker',
  'QR Test',
  'Empty',
  'Export',
  'Stats Test',
  'History Test',
  'Archive Test',
  'Manual Entry Test',
  'Updated Session'
];

console.log('Archive Test Data Script');
console.log('========================');
console.log('');
console.log('To run this script:');
console.log('1. Open the attendance app in your browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste the code below:');
console.log('');
console.log('------- COPY FROM HERE -------');
console.log(`
// Archive Test Data - Browser Version
// Set isDryRun to false to actually delete data
(async function() {
  const TEST_PATTERNS = ${JSON.stringify(TEST_PATTERNS)};
  const isDryRun = true; // CHANGE TO false TO DELETE DATA

  console.log('Mode:', isDryRun ? 'DRY RUN' : 'LIVE DELETE');
  console.log('Fetching all sessions...');

  const sessionsSnapshot = await firebase.database().ref('sessions').once('value');
  const sessions = sessionsSnapshot.val() || {};

  const testSessions = [];

  for (const [sessionId, session] of Object.entries(sessions)) {
    const className = session.className || '';
    const isTestSession = TEST_PATTERNS.some(pattern =>
      className.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isTestSession) {
      testSessions.push({
        id: sessionId,
        className: className,
        createdAt: session.createdAt,
        attendanceCount: session.attendanceCount || 0
      });
    }
  }

  console.log('Found ' + testSessions.length + ' test sessions:');
  testSessions.forEach(s => {
    console.log('  - ' + s.id + ': "' + s.className + '" (created: ' + s.createdAt + ', attendance: ' + s.attendanceCount + ')');
  });

  if (testSessions.length === 0) {
    console.log('No test sessions found. Done.');
    return;
  }

  if (isDryRun) {
    console.log('');
    console.log('DRY RUN - No changes made.');
    console.log('To delete these sessions, change isDryRun = false and run again.');
    return;
  }

  const confirmed = confirm('Delete ' + testSessions.length + ' test sessions and all associated data?\\n\\nThis will remove:\\n- Session records\\n- Attendance records\\n- Failed attempt records\\n- Audit logs\\n\\nThis cannot be undone!');

  if (!confirmed) {
    console.log('Cancelled by user.');
    return;
  }

  console.log('');
  console.log('Deleting test data...');

  let deletedCount = 0;
  for (const session of testSessions) {
    console.log('Deleting session: ' + session.id + ' ("' + session.className + '")...');

    try {
      // Delete associated data first
      await firebase.database().ref('attendance/' + session.id).remove();
      console.log('  - Deleted attendance data');

      await firebase.database().ref('failed/' + session.id).remove();
      console.log('  - Deleted failed attempts');

      await firebase.database().ref('audit/' + session.id).remove();
      console.log('  - Deleted audit logs');

      // Delete the session itself
      await firebase.database().ref('sessions/' + session.id).remove();
      console.log('  - Deleted session record');

      deletedCount++;
    } catch (err) {
      console.error('  ERROR: ' + err.message);
    }
  }

  console.log('');
  console.log('Done! Deleted ' + deletedCount + ' of ' + testSessions.length + ' test sessions.');
})();
`);
console.log('------- COPY TO HERE -------');
