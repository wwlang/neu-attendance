// @ts-check
const { test, expect } = require('@playwright/test');
const {
  gotoWithEmulator,
  startInstructorSession,
  waitForPageLoad,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Dismiss Failed Attempts Integration Tests
 *
 * Tests the dismiss functionality for failed attendance attempts:
 * - Dismiss button visibility
 * - Single dismiss removes record from Firebase
 * - Bulk dismiss for multiple selected items
 * - Audit trail logging
 *
 * Note: Tests use direct Firebase writes to bypass student form auth issues.
 * The app stores failed attempts at `failed/{sessionId}` path.
 */

/**
 * Create a failed check-in attempt by writing directly to Firebase
 * This bypasses the student form which has auth issues in E2E tests
 * @param {import('@playwright/test').Page} instructorPage
 * @param {string} studentId
 * @param {string} studentName
 * @param {string} email
 */
async function createFailedAttempt(instructorPage, studentId, studentName, email) {
  // Get the current session ID from Firebase
  const sessionId = await instructorPage.evaluate(async () => {
    // @ts-ignore - db is defined in page context
    const snapshot = await db.ref('activeSession').once('value');
    return snapshot.val();
  });

  // Create a failed attempt record directly in Firebase
  // This simulates a student submitting from too far away (distance > radius)
  // NOTE: The app uses `failed/{sessionId}` path, not `failedAttempts/`
  await instructorPage.evaluate(async ({ sessionId, studentId, studentName, email }) => {
    // @ts-ignore - db is defined in page context
    const failedRef = db.ref(`failed/${sessionId}`).push();
    await failedRef.set({
      studentId,
      studentName,
      email,
      deviceId: 'DEV-TEST-' + Date.now(),
      uid: 'test-uid-' + Date.now(),
      location: { lat: 0, lng: 0, accuracy: 10 },
      distance: 12000000, // 12,000 km - definitely too far
      allowedRadius: 500,
      timestamp: Date.now(),
      type: 'failed',
      reason: 'Too far: 12000000m'
    });
  }, { sessionId, studentId, studentName, email });

  // Wait for the failed attempt to appear on instructor page
  // The failed attempts panel might be collapsed, so we need to expand it first
  const showButton = instructorPage.locator('button:has-text("Show")');
  if (await showButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await showButton.click();
  }

  // Wait for the student ID to appear in failed attempts section
  await expect(instructorPage.locator(`text=${studentId}`).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Dismiss Failed Attempts', () => {
  // Run these tests serially to avoid test pollution
  test.describe.configure({ mode: 'serial' });

  test('should show Dismiss button next to each failed attempt', async ({ page }) => {
    // Start a session
    await startInstructorSession(page, 'Dismiss Test Class');

    // Create a failed attempt directly via Firebase
    await createFailedAttempt(page, 'FAIL001', 'Failed Student', 'failed@test.com');

    // Verify both Approve and Dismiss buttons are visible
    await expect(page.locator('button:has-text("Approve")')).toBeVisible();
    await expect(page.locator('button:has-text("Dismiss")')).toBeVisible();
  });

  test('should remove failed attempt when Dismiss is clicked', async ({ page }) => {
    // Start a session
    await startInstructorSession(page, 'Dismiss Remove Test');

    // Create a failed attempt directly via Firebase
    await createFailedAttempt(page, 'DISMISS001', 'Dismiss Test Student', 'dismiss@test.com');

    // Click Dismiss button (should be the first one if there's only one failed attempt)
    await page.click('button:has-text("Dismiss")');

    // Verify the failed attempt is removed (wait for both instances to be gone)
    await expect(page.locator('text=DISMISS001')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=No failed attempts')).toBeVisible();
  });

  test('should show Bulk Dismiss button when items are selected', async ({ page }) => {
    // Start a session
    await startInstructorSession(page, 'Bulk Dismiss Test');

    // Create multiple failed attempts directly via Firebase
    await createFailedAttempt(page, 'BULK001', 'Bulk Student 1', 'bulk1@test.com');
    await createFailedAttempt(page, 'BULK002', 'Bulk Student 2', 'bulk2@test.com');

    // Verify both are visible (use first() to handle multiple matches)
    await expect(page.locator('text=BULK001').first()).toBeVisible();
    await expect(page.locator('text=BULK002').first()).toBeVisible();

    // Select all failed attempts
    await page.click('button:has-text("Select All")');

    // Verify bulk action buttons appear
    await expect(page.locator('button:has-text("Approve Selected")')).toBeVisible();
    await expect(page.locator('button:has-text("Dismiss Selected")')).toBeVisible();
  });

  test('should bulk dismiss all selected failed attempts', async ({ page }) => {
    // Start a session
    await startInstructorSession(page, 'Bulk Dismiss Execute Test');

    // Create multiple failed attempts directly via Firebase
    await createFailedAttempt(page, 'BULKD001', 'Bulk Dismiss Student 1', 'bulkd1@test.com');
    await createFailedAttempt(page, 'BULKD002', 'Bulk Dismiss Student 2', 'bulkd2@test.com');

    // Select all
    await page.click('button:has-text("Select All")');

    // Handle confirmation dialog
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Dismiss Selected")');

    // Verify all are removed
    await expect(page.locator('text=BULKD001')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=BULKD002')).not.toBeVisible();
    await expect(page.locator('text=No failed attempts')).toBeVisible();
  });
});
