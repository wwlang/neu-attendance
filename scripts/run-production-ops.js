/**
 * Production Database Operations via Playwright
 * Runs Firebase operations in browser context against production
 */

const { chromium } = require('@playwright/test');

const PROD_URL = 'https://wwlang.github.io/neu-attendance/';

async function runProductionOps() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to production app...');
  await page.goto(PROD_URL);

  // Wait for Firebase to initialize
  await page.waitForFunction(() => typeof firebase !== 'undefined' && firebase.database, { timeout: 10000 });
  console.log('Firebase initialized.\n');

  // Step 1: Count sessions
  console.log('=== SESSION COUNT ===');
  const counts = await page.evaluate(async () => {
    const testPatterns = ["Test","test","Flicker","QR Test","Empty","Export","Stats Test","History Test","Archive Test","Manual Entry Test","Updated Session"];

    const sessionsSnapshot = await firebase.database().ref('sessions').once('value');
    const sessions = sessionsSnapshot.val() || {};

    let testSessions = [];
    let prodSessions = [];

    for (const [id, session] of Object.entries(sessions)) {
      const className = session.className || '';
      const isTest = testPatterns.some(p => className.toLowerCase().includes(p.toLowerCase()));
      if (isTest) {
        testSessions.push({ id, className, createdAt: session.createdAt, attendanceCount: session.attendanceCount || 0 });
      } else {
        prodSessions.push({ id, className, createdAt: session.createdAt, attendanceCount: session.attendanceCount || 0 });
      }
    }

    return { testSessions, prodSessions, total: Object.keys(sessions).length };
  });

  console.log(`Total sessions: ${counts.total}`);
  console.log(`Test sessions to delete: ${counts.testSessions.length}`);
  console.log(`Production sessions to keep: ${counts.prodSessions.length}`);

  if (counts.testSessions.length > 0) {
    console.log('\nTest sessions to be deleted:');
    counts.testSessions.forEach(s => {
      console.log(`  - "${s.className}" (${s.id.slice(0,8)}..., attendance: ${s.attendanceCount})`);
    });
  }

  if (counts.prodSessions.length > 0) {
    console.log('\nProduction sessions to keep:');
    counts.prodSessions.forEach(s => {
      console.log(`  - "${s.className}" (${s.id.slice(0,8)}..., attendance: ${s.attendanceCount})`);
    });
  }

  // Step 2: Backup
  console.log('\n=== CREATING BACKUP ===');
  const backup = await page.evaluate(async () => {
    const BACKUP_PATHS = ["sessions", "attendance", "failed", "audit"];
    const data = {};
    const summary = {};

    for (const path of BACKUP_PATHS) {
      const snapshot = await firebase.database().ref(path).once('value');
      data[path] = snapshot.val() || {};
      summary[path] = Object.keys(data[path]).length;
    }

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      paths: BACKUP_PATHS,
      summary,
      data
    };
  });

  // Save backup to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = `backups/firebase-backup-${timestamp}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`Backup saved to: ${backupPath}`);
  console.log('Backup summary:');
  for (const [path, count] of Object.entries(backup.summary)) {
    console.log(`  - ${path}: ${count} records`);
  }

  // Step 3: Delete test sessions (if any)
  if (counts.testSessions.length > 0) {
    console.log('\n=== DELETING TEST SESSIONS ===');

    const deleteResult = await page.evaluate(async (testSessions) => {
      let deleted = 0;
      let errors = [];

      for (const session of testSessions) {
        try {
          await firebase.database().ref('attendance/' + session.id).remove();
          await firebase.database().ref('failed/' + session.id).remove();
          await firebase.database().ref('audit/' + session.id).remove();
          await firebase.database().ref('sessions/' + session.id).remove();
          deleted++;
        } catch (err) {
          errors.push({ id: session.id, error: err.message });
        }
      }

      return { deleted, errors };
    }, counts.testSessions);

    console.log(`Deleted ${deleteResult.deleted} of ${counts.testSessions.length} test sessions`);
    if (deleteResult.errors.length > 0) {
      console.log('Errors:', deleteResult.errors);
    }
  } else {
    console.log('\nNo test sessions to delete.');
  }

  // Step 4: Final count
  console.log('\n=== FINAL COUNT ===');
  const finalCount = await page.evaluate(async () => {
    const snapshot = await firebase.database().ref('sessions').once('value');
    return Object.keys(snapshot.val() || {}).length;
  });
  console.log(`Remaining production sessions: ${finalCount}`);

  await browser.close();
  console.log('\nDone!');
}

runProductionOps().catch(console.error);
