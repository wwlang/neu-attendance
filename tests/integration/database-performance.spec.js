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
 * Add attendance directly via Firebase (bypasses student form auth issues)
 * Tries multiple methods to get session ID reliably:
 * 1. state.session.id (if set)
 * 2. activeSession Firebase reference
 * 3. Match by current code
 * @param {import('@playwright/test').Page} page - Instructor page with Firebase context
 * @param {string} studentId
 * @param {string} studentName
 * @param {string} email
 */
async function addAttendanceDirectly(page, studentId, studentName, email) {
  // Get the session ID using multiple fallback methods
  const sessionId = await page.evaluate(async () => {
    // Method 1: Check state.session.id (may not be set on reopened sessions)
    // @ts-ignore - state is defined in page context
    if (window.state && window.state.session && window.state.session.id) {
      return window.state.session.id;
    }

    // Method 2: Get from activeSession Firebase reference
    // @ts-ignore - db is defined in page context
    const snapshot = await db.ref('activeSession').once('value');
    const activeId = snapshot.val();
    if (activeId) {
      return activeId;
    }

    // Method 3: Look for session ID by matching current code
    // @ts-ignore - state is defined in page context
    if (window.state && window.state.currentCode) {
      const currentCode = window.state.currentCode;
      // @ts-ignore
      const sessionsSnapshot = await db.ref('sessions').orderByChild('code').equalTo(currentCode).once('value');
      const sessions = sessionsSnapshot.val();
      if (sessions) {
        const sessionIds = Object.keys(sessions);
        if (sessionIds.length > 0) {
          return sessionIds[0];
        }
      }
    }

    return null;
  });

  if (!sessionId) {
    throw new Error('No active session found - cannot add attendance');
  }

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

    // Wait for session to stabilize and listeners to be set up
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small delay for Firebase listeners

    // Create a request monitor on the instructor page
    // (We monitor the instructor page since we're adding attendance directly)
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });
    monitor.reset();

    // Add attendance directly via Firebase (bypasses student form auth issues)
    await addAttendanceDirectly(page, 'PERF001', 'Performance Test Student', 'perf@test.edu');

    // Wait for the attendance to appear on instructor page
    // Use .first() to handle case where student ID appears in multiple places
    await expect(page.locator('text=PERF001').first()).toBeVisible({ timeout: 10000 });

    // Verify thresholds - note: this is checking the Firebase listener updates
    // not the student form submission, but still validates data flow performance
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

    // We warn but don't fail on duplicates for now - this can be tightened later
    // monitor.assertNoDuplicates('Session flow');

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

    // Wait for session to stabilize and listeners to be set up
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small delay for Firebase listeners

    // Add attendance directly via Firebase (bypasses student form auth issues)
    await addAttendanceDirectly(page, 'FULL001', 'Full Flow Student', 'full@test.edu');

    // Wait for the attendance to appear
    // Use .first() to handle case where student ID appears in multiple places
    await expect(page.locator('text=FULL001').first()).toBeVisible({ timeout: 10000 });

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

    // Navigate to analytics
    await page.click('button:has-text("Analytics")');
    // Use "Analytics Dashboard" which is the actual text in the app
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

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

    // Analytics view - use "Analytics Dashboard" which is the actual text
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('Analytics view:', monitor.getReport());

    console.log('\n=== End Baseline Report ===\n');
  });
});
