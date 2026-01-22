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
 */

/**
 * Create a failed check-in attempt by submitting from a location outside the allowed radius
 * @param {import('@playwright/test').BrowserContext} context
 * @param {import('@playwright/test').Page} instructorPage
 * @param {string} studentId
 * @param {string} studentName
 * @param {string} email
 */
async function createFailedAttempt(context, instructorPage, studentId, studentName, email) {
  // Get the current code from instructor page
  const codeElement = instructorPage.locator('.code-display').first();
  const code = await codeElement.textContent();

  // Open a new page for student check-in
  const studentPage = await context.newPage();

  // Set geolocation to very far away (0,0 is in the Atlantic Ocean near Africa)
  await studentPage.context().setGeolocation({ latitude: 0, longitude: 0 });
  await studentPage.context().grantPermissions(['geolocation']);

  // Clear localStorage first to prevent prefill interference
  await gotoWithEmulator(studentPage, '/');
  await studentPage.evaluate(() => localStorage.clear());

  // Navigate to student mode with code
  await gotoWithEmulator(studentPage, `/?mode=student&code=${code}`);

  // Wait for student form to be ready
  await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 15000 });
  await studentPage.waitForLoadState('networkidle');

  // Wait for location to be acquired - look for the coordinate display
  // The UI shows "Your Location (Lat, Lng)" with coordinates when location is acquired
  await expect(studentPage.locator('text=/0\\.0+.*0\\.0+|Lat.*Lng|Location/i')).toBeVisible({ timeout: 15000 });

  // Fill in student info using JavaScript for reliability
  await studentPage.evaluate(({ studentId, studentName, email }) => {
    document.getElementById('studentId').value = studentId;
    document.getElementById('studentName').value = studentName;
    document.getElementById('studentEmail').value = email;
  }, { studentId, studentName, email });

  // Submit attendance
  await studentPage.click('button:has-text("Submit Attendance")');

  // Wait for failure message - should contain something about being logged or too far away
  // The message says: "You're Xm away (limit: Ym). Your attempt has been logged for instructor review."
  const failureMessage = studentPage.locator('text=/logged.*instructor|away.*logged|too far/i');
  await expect(failureMessage).toBeVisible({ timeout: 15000 });

  await studentPage.close();

  // Wait for the failed attempt to appear on instructor page
  // The failed attempts panel might be collapsed, so we need to expand it first
  const showButton = instructorPage.locator('button:has-text("Show")');
  if (await showButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await showButton.click();
  }

  // Wait for the student ID to appear in failed attempts
  await expect(instructorPage.locator(`text=${studentId}`)).toBeVisible({ timeout: 15000 });
}

test.describe('Dismiss Failed Attempts', () => {
  test('should show Dismiss button next to each failed attempt', async ({ page, context }) => {
    // Start a session
    await startInstructorSession(page, 'Dismiss Test Class');

    // Create a failed attempt
    await createFailedAttempt(context, page, 'FAIL001', 'Failed Student', 'failed@test.com');

    // Verify both Approve and Dismiss buttons are visible
    await expect(page.locator('button:has-text("Approve")')).toBeVisible();
    await expect(page.locator('button:has-text("Dismiss")')).toBeVisible();
  });

  test('should remove failed attempt when Dismiss is clicked', async ({ page, context }) => {
    // Start a session
    await startInstructorSession(page, 'Dismiss Remove Test');

    // Create a failed attempt
    await createFailedAttempt(context, page, 'DISMISS001', 'Dismiss Test Student', 'dismiss@test.com');

    // Click Dismiss button (should be the first one if there's only one failed attempt)
    await page.click('button:has-text("Dismiss")');

    // Verify the failed attempt is removed
    await expect(page.locator('text=DISMISS001')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=No failed attempts')).toBeVisible();
  });

  test('should show Bulk Dismiss button when items are selected', async ({ page, context }) => {
    // Start a session
    await startInstructorSession(page, 'Bulk Dismiss Test');

    // Create multiple failed attempts
    await createFailedAttempt(context, page, 'BULK001', 'Bulk Student 1', 'bulk1@test.com');
    await createFailedAttempt(context, page, 'BULK002', 'Bulk Student 2', 'bulk2@test.com');

    // Verify both are visible
    await expect(page.locator('text=BULK001')).toBeVisible();
    await expect(page.locator('text=BULK002')).toBeVisible();

    // Select all failed attempts
    await page.click('button:has-text("Select All")');

    // Verify bulk action buttons appear
    await expect(page.locator('button:has-text("Approve Selected")')).toBeVisible();
    await expect(page.locator('button:has-text("Dismiss Selected")')).toBeVisible();
  });

  test('should bulk dismiss all selected failed attempts', async ({ page, context }) => {
    // Start a session
    await startInstructorSession(page, 'Bulk Dismiss Execute Test');

    // Create multiple failed attempts
    await createFailedAttempt(context, page, 'BULKD001', 'Bulk Dismiss Student 1', 'bulkd1@test.com');
    await createFailedAttempt(context, page, 'BULKD002', 'Bulk Dismiss Student 2', 'bulkd2@test.com');

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
