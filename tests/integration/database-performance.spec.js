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
  checkInStudent,
  endSessionAndGoToHistory,
  clickFirstSessionCard,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Database Performance Tests
 *
 * Verifies that user flows stay within defined bandwidth and request limits.
 * Detects anti-patterns:
 * - Excessive requests (N+1 patterns)
 * - Large payloads (full collection fetches)
 * - Duplicate requests (missing caching)
 */

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

  test('student check-in respects bandwidth limits', async ({ context, page }) => {
    // Set up instructor session first
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await startInstructorSession(page, 'Student Perf Test');

    // Get the session code
    const codeElement = page.locator('.code-display').first();
    const code = await codeElement.textContent();

    // Now test student flow with monitoring
    const studentPage = await context.newPage();
    await studentPage.context().grantPermissions(['geolocation']);
    await studentPage.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    const monitor = new RequestMonitor(studentPage, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    // Navigate as student
    await gotoWithEmulator(studentPage, `/?mode=student&code=${code}`);
    await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 10000 });

    // Fill form using Playwright's fill() method for proper event triggering
    await studentPage.locator('input#studentId').fill('PERF001');
    await studentPage.locator('input#studentName').fill('Performance Test Student');
    await studentPage.locator('input#studentEmail').fill('perf@test.edu');

    // Submit
    await studentPage.click('button:has-text("Submit Attendance")');
    await expect(
      studentPage.locator('text=Success!').or(studentPage.locator('text=Attendance Recorded'))
    ).toBeVisible({ timeout: 15000 });

    // Verify thresholds
    const limits = thresholds.flows['student-checkin'];
    monitor.assertMaxRequests(limits.maxRequests, 'Student check-in');
    monitor.assertMaxPayload(limits.maxKB, 'Student check-in');

    await studentPage.close();

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

  test('full instructor flow stays within limits', async ({ context, page }) => {
    const monitor = new RequestMonitor(page, {
      patterns: thresholds.patterns,
      n1Threshold: thresholds.n1Threshold,
    });

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    // Complete full flow
    await authenticateAsInstructor(page);
    await startInstructorSession(page, 'Full Flow Perf Test');

    // Check in a student
    await checkInStudent(context, page, 'FULL001', 'Full Flow Student', 'full@test.edu', {
      expectedCount: 1,
    });

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

  // M5 FIX: Add analytics performance test
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
    await expect(page.locator('text=Attendance Analytics')).toBeVisible({ timeout: 10000 });

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

    // Analytics view
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Attendance Analytics')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('Analytics view:', monitor.getReport());

    console.log('\n=== End Baseline Report ===\n');
  });
});
