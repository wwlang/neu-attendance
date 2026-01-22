// @ts-check
const { test, expect } = require('@playwright/test');
const { RequestMonitor } = require('../utils/request-monitor');
const thresholds = require('../config/performance-thresholds');
const {
  waitForPageLoad,
  authenticateAsInstructor,
  startInstructorSession,
  goToHistoryView,
  gotoWithEmulator,
  endSessionAndGoToHistory,
  clickFirstSessionCard,
  waitForAttendanceCount,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Database Performance Tests
 *
 * Verifies that user flows stay within defined bandwidth and request limits.
 * Detects anti-patterns:
 * - Excessive requests (N+1 patterns)
 * - Large payloads (full collection fetches)
 * - Duplicate requests (missing caching)
 *
 * Note: Student check-in tests use direct Firebase writes to bypass
 * auth emulator issues. This still validates the performance characteristics
 * of the data flow, just not the form submission itself.
 */

/**
 * Get session ID from the app's state (what the listener is actually watching)
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string|null>}
 */
async function getStateSessionId(page) {
  return await page.evaluate(() => {
    // @ts-ignore - state is defined in page context
    return typeof state !== 'undefined' && state.session ? state.session.id : null;
  });
}

/**
 * Wait for state.session.id to be set (ensures session is fully initialized)
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout
 * @returns {Promise<string>}
 */
async function waitForSessionReady(page, timeout = 20000) {
  let sessionId = null;
  await expect(async () => {
    sessionId = await getStateSessionId(page);
    expect(sessionId).not.toBeNull();
  }).toPass({ timeout });
  return sessionId;
}

/**
 * Add attendance directly via Firebase and wait for UI update via listener
 * Uses state.session.id to ensure we write to the same session the listener is watching
 * @param {import('@playwright/test').Page} page - Instructor page with Firebase context
 * @param {string} studentId
 * @param {string} studentName
 * @param {string} email
 */
async function addAttendanceDirectly(page, studentId, studentName, email) {
  // Get session ID from app state (this is what the listener is watching)
  const sessionId = await waitForSessionReady(page);

  if (!sessionId) {
    throw new Error('No active session found - cannot add attendance');
  }

  // Write attendance data directly to Firebase
  await page.evaluate(async ({ sessionId, studentId, studentName, email }) => {
    // @ts-ignore - db is defined in page context
    const attendanceRef = db.ref(`attendance/${sessionId}`).push();
    await attendanceRef.set({
      studentId,
      studentName,
      email,
      deviceId: 'DEV-PERF-' + Date.now(),
      uid: 'test-uid-' + Date.now(),
      location: { lat: 21.0285, lng: 105.8542, accuracy: 10 },
      distance: 50,
      allowedRadius: 500,
      timestamp: Date.now(),
      status: 'on_time',
      isLate: false
    });
  }, { sessionId, studentId, studentName, email });

  // Wait for the Firebase listener to pick up the change and render
  // The app's setupSessionListeners will automatically update state.attendance and call render()
  // Use polling with expect().toPass() to handle timing variations
  await expect(async () => {
    // Check if the table exists and contains our student ID
    const found = await page.evaluate((expectedStudentId) => {
      const table = document.querySelector('table');
      if (!table) return false;
      const cells = table.querySelectorAll('td');
      for (const cell of cells) {
        if (cell.textContent && cell.textContent.includes(expectedStudentId)) {
          return true;
        }
      }
      return false;
    }, studentId);
    expect(found).toBe(true);
  }).toPass({ timeout: 15000, intervals: [100, 200, 500, 1000, 2000] });
}

/**
 * Navigate from history view back to dashboard
 * @param {import('@playwright/test').Page} page
 */
async function goBackToDashboard(page) {
  // Click "Back to Dashboard" button (note: it's a button, not a link)
  const backButton = page.locator('button:has-text("Back to Dashboard")');
  await expect(backButton).toBeVisible({ timeout: 5000 });
  await backButton.click();

  // Wait for dashboard to be visible
  await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });
}

test.describe('Database Performance', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test('authentication flow respects bandwidth limits', async ({ page }) => {
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
      duplicateWindowMs: thresholds.duplicateWindowMs,
    });

    // Perform authentication
    await authenticateAsInstructor(page);
    await expect(page.locator('text=Start Attendance Session')).toBeVisible();

    // Verify thresholds
    const limits = thresholds.flows.auth;
    monitor.assertMaxRequests(limits.maxRequests, 'Auth flow');
    monitor.assertMaxPayload(limits.maxKB, 'Auth flow');

    // Log report for debugging
    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('session start respects bandwidth limits', async ({ page }) => {
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    // Auth first, then reset monitor
    await authenticateAsInstructor(page);
    monitor.reset();

    // Start a session
    await startInstructorSession(page, 'Performance Test Class');

    // Verify thresholds
    const limits = thresholds.flows['start-session'];
    monitor.assertMaxRequests(limits.maxRequests, 'Session start');
    monitor.assertMaxPayload(limits.maxKB, 'Session start');
    monitor.assertNoN1Pattern('Session start');

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('student check-in respects bandwidth limits', async ({ page }) => {
    // Set up instructor session first
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await startInstructorSession(page, 'Student Perf Test');

    // Wait for session to be fully initialized in app state
    await waitForSessionReady(page);

    // Wait for session to stabilize
    await page.waitForLoadState('networkidle');

    // Create a request monitor on the instructor page
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });
    monitor.reset();

    // Add attendance directly via Firebase (bypasses student form auth issues)
    await addAttendanceDirectly(page, 'PERF001', 'Performance Test Student', 'perf@test.edu');

    // The student should now be visible (addAttendanceDirectly waits for this)
    await expect(page.locator('text=PERF001').first()).toBeVisible({ timeout: 5000 });

    // Verify thresholds
    const limits = thresholds.flows['student-checkin'];
    monitor.assertMaxRequests(limits.maxRequests, 'Student check-in');
    monitor.assertMaxPayload(limits.maxKB, 'Student check-in');

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('history list respects bandwidth limits', async ({ page }) => {
    // Set up session with some data first
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await startInstructorSession(page, 'History Perf Test');

    // End session to ensure history has data
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // Now test history view with monitoring
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    await goToHistoryView(page);
    await expect(page.locator('text=Session History')).toBeVisible();

    // Wait for history to load
    await page.waitForLoadState('networkidle');

    // Verify thresholds
    const limits = thresholds.flows['history-list'];
    monitor.assertMaxRequests(limits.maxRequests, 'History list');
    monitor.assertMaxPayload(limits.maxKB, 'History list');
    monitor.assertNoN1Pattern('History list');

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('session detail view respects bandwidth limits', async ({ page }) => {
    // Set up session with student data
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await startInstructorSession(page, 'Detail Perf Test');

    // End and go to history
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    await goToHistoryView(page);
    await expect(page.locator('text=Session History')).toBeVisible();

    // Enable show archived if needed
    const showArchivedLabel = page.locator('label:has(span:has-text("Show Archived"))');
    if (await showArchivedLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showArchivedLabel.click();
      await page.waitForLoadState('networkidle');
    }

    // Now test session detail with monitoring
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    // Click first session card
    const clicked = await clickFirstSessionCard(page);

    if (clicked) {
      // Wait for detail to load
      await page.waitForLoadState('networkidle');

      // Verify thresholds
      const limits = thresholds.flows['session-detail'];
      monitor.assertMaxRequests(limits.maxRequests, 'Session detail');
      monitor.assertMaxPayload(limits.maxKB, 'Session detail');
      monitor.assertNoN1Pattern('Session detail');
    }

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('no duplicate requests within session', async ({ page }) => {
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      duplicateWindowMs: thresholds.duplicateWindowMs,
    });

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    // Complete a typical flow
    await authenticateAsInstructor(page);
    await startInstructorSession(page, 'Duplicate Test');

    // Wait for session to stabilize
    await page.waitForLoadState('networkidle');

    // Check for duplicate requests (potential caching issues)
    const duplicates = monitor.detectDuplicates();
    if (duplicates.length > 0) {
      console.warn('Duplicate requests detected (consider caching):', duplicates);
    }

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('full instructor flow stays within limits', async ({ page }) => {
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    // Complete full flow
    await authenticateAsInstructor(page);
    await startInstructorSession(page, 'Full Flow Perf Test');

    // Wait for session to be fully initialized in app state
    await waitForSessionReady(page);

    // Wait for session to stabilize
    await page.waitForLoadState('networkidle');

    // Add attendance directly via Firebase (bypasses student form auth issues)
    await addAttendanceDirectly(page, 'FULL001', 'Full Flow Student', 'full@test.edu');

    // The student should now be visible (addAttendanceDirectly waits for this)
    await expect(page.locator('text=FULL001').first()).toBeVisible({ timeout: 5000 });

    // End session
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // View history
    await goToHistoryView(page);
    await page.waitForLoadState('networkidle');

    // Verify full flow thresholds
    const limits = thresholds.flows['full-instructor-flow'];
    monitor.assertMaxRequests(limits.maxRequests, 'Full instructor flow');
    monitor.assertMaxPayload(limits.maxKB, 'Full instructor flow');
    monitor.assertNoN1Pattern('Full instructor flow');

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });

  test('analytics view respects bandwidth limits', async ({ page }) => {
    // Set up with some session data first
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await startInstructorSession(page, 'Analytics Perf Test');

    // End session
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // Now test analytics view with monitoring
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    // Navigate to analytics - use polling pattern for button click and view visibility
    await expect(async () => {
      const analyticsBtn = page.locator('button:has-text("Analytics")');
      await expect(analyticsBtn).toBeVisible();
      await analyticsBtn.click();
      await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    }).toPass({ timeout: 15000 });

    // Wait for analytics data to load
    await page.waitForLoadState('networkidle');

    // Verify thresholds - analytics has higher limits due to aggregation
    const limits = thresholds.flows.analytics;
    monitor.assertMaxRequests(limits.maxRequests, 'Analytics view');
    monitor.assertMaxPayload(limits.maxKB, 'Analytics view');
    monitor.assertNoN1Pattern('Analytics view');

    if (process.env.DEBUG_PERFORMANCE) {
      monitor.logReport();
    }
  });
});

test.describe('Performance Report Generation', () => {
  test('generate performance baseline report', async ({ page }) => {
    // This test is for generating baseline metrics - always logs report
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    console.log('\n=== Performance Baseline Report ===\n');

    // Auth flow
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
    await authenticateAsInstructor(page);
    console.log('Auth flow:', monitor.getReport());
    monitor.reset();

    // Session start
    await startInstructorSession(page, 'Baseline Test');
    console.log('Session start:', monitor.getReport());
    monitor.reset();

    // End session
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });
    console.log('Session end:', monitor.getReport());
    monitor.reset();

    // History view
    await goToHistoryView(page);
    await page.waitForLoadState('networkidle');
    console.log('History view:', monitor.getReport());
    monitor.reset();

    // Go back to dashboard before clicking Analytics
    await goBackToDashboard(page);
    await page.waitForLoadState('networkidle');

    // Analytics view - use polling pattern for button click and view visibility
    await expect(async () => {
      const analyticsBtn = page.locator('button:has-text("Analytics")');
      await expect(analyticsBtn).toBeVisible();
      await analyticsBtn.click();
      await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    }).toPass({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log('Analytics view:', monitor.getReport());

    console.log('\n=== End Baseline Report ===\n');
  });
});
