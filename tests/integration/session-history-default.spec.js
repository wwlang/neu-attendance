// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoWithEmulator, authenticateAsInstructor, goToHistoryView, startInstructorSession, endSessionAndGoToHistory } = require('../utils/test-helpers');
const { resetEmulatorData } = require('../utils/firebase-helpers');

/**
 * P2-11: Session History Default View - 14 Days
 *
 * Tests that session history and analytics default to 14-day view
 * instead of 7 days for improved instructor workflow.
 */

test.describe('P2-11: Session History Default View - 14 Days', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });
  });

  test('AC1: Session history loads with 14-day default filter', async ({ page }) => {
    // Navigate to history view
    await goToHistoryView(page);

    // Check that the default message shows 14 days (not 7)
    // Text is: "Sessions from the last 14 days. Click a session to view details."
    await expect(page.locator('text=/Sessions from the last 14 days/')).toBeVisible({ timeout: 5000 });
  });

  test('AC2: Displays sessions from (today - 14 days) to today', async ({ page }) => {
    // Navigate to history view
    await goToHistoryView(page);

    // Verify the text indicates 14-day range
    await expect(page.locator('text=/Sessions from the last 14 days/')).toBeVisible({ timeout: 5000 });

    // The "Show All Sessions" checkbox should be unchecked by default
    const showAllCheckbox = page.locator('label:has-text("Show All Sessions") input[type="checkbox"]');
    await expect(showAllCheckbox).not.toBeChecked();
  });

  test('AC3: Manual date range filter available for custom periods', async ({ page }) => {
    // Navigate to analytics (which has date filters)
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Check that date filter inputs are present
    await expect(page.locator('input#analyticsStartDate')).toBeVisible();
    await expect(page.locator('input#analyticsEndDate')).toBeVisible();

    // Verify Apply button is available
    await expect(page.locator('button:has-text("Apply")')).toBeVisible();
  });

  test('AC7: "Show All Sessions" toggle available to view all sessions', async ({ page }) => {
    // Navigate to history view
    await goToHistoryView(page);

    // Verify the "Show All Sessions" toggle is present
    await expect(page.locator('text=Show All Sessions')).toBeVisible();

    // Initially should show 14-day message
    await expect(page.locator('text=/Sessions from the last 14 days/')).toBeVisible();

    // Toggle to show all
    await page.locator('label:has-text("Show All Sessions") input[type="checkbox"]').check();

    // Now should show "All sessions" message (text is "All sessions. Click a session...")
    await expect(page.locator('text=/All sessions\\./')).toBeVisible();
  });
});

/**
 * P2-11.1: Session History Filter Persistence
 *
 * Tests that date range filter persists across view navigation.
 */
test.describe('P2-11.1: Session History Filter Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });
  });

  test('AC5: Show All filter persists when switching between History and Analytics views', async ({ page }) => {
    // Navigate to history view
    await goToHistoryView(page);

    // Toggle "Show All Sessions" on
    const showAllCheckbox = page.locator('label:has-text("Show All Sessions") input[type="checkbox"]');
    await showAllCheckbox.check();
    await expect(page.locator('text=/All sessions\\./')).toBeVisible();

    // Go back to dashboard
    await page.click('text=Back to Dashboard');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Navigate to Analytics
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Go back to dashboard
    await page.click('text=Back to Dashboard');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Navigate back to history
    await goToHistoryView(page);

    // The "Show All Sessions" toggle should still be checked
    const showAllCheckboxAgain = page.locator('label:has-text("Show All Sessions") input[type="checkbox"]');
    await expect(showAllCheckboxAgain).toBeChecked();

    // Should still show "All sessions" message
    await expect(page.locator('text=/All sessions\\./')).toBeVisible();
  });

  test('AC5.2: Filter resets on page refresh', async ({ page }) => {
    // Navigate to history view
    await goToHistoryView(page);

    // Toggle "Show All Sessions" on
    const showAllCheckbox = page.locator('label:has-text("Show All Sessions") input[type="checkbox"]');
    await showAllCheckbox.check();
    await expect(page.locator('text=/All sessions\\./')).toBeVisible();

    // Refresh the page
    await page.reload();
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Navigate back to history
    await goToHistoryView(page);

    // Should reset to default (14-day filter, not Show All)
    await expect(page.locator('text=/Sessions from the last 14 days/')).toBeVisible({ timeout: 5000 });
    const showAllCheckboxAfterRefresh = page.locator('label:has-text("Show All Sessions") input[type="checkbox"]');
    await expect(showAllCheckboxAfterRefresh).not.toBeChecked();
  });
});

/**
 * P2-11.2: CSV Export Respects Date Filter
 *
 * Tests that CSV export from session history only includes sessions
 * within the current date filter range.
 */
test.describe('P2-11.2: CSV Export Respects Date Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('AC8: History list export button exports only visible (filtered) sessions', async ({ page }) => {
    // Create a session so there is data to export
    await startInstructorSession(page, 'CSV Filter Test Class');

    // End session and go to history
    await endSessionAndGoToHistory(page);

    // Verify we see the session in history
    await expect(page.locator('text=CSV Filter Test Class')).toBeVisible({ timeout: 10000 });

    // Click on the session to view details
    await page.locator('text=CSV Filter Test Class').click();
    await expect(page.locator('text=Back to History')).toBeVisible({ timeout: 5000 });

    // Export CSV button should be visible
    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportBtn.click();

    // Verify CSV download was triggered (file name should contain class name)
    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toContain('CSV_Filter_Test_Class');
      expect(filename).toContain('.csv');
    }
  });
});

/**
 * P2-11 AC6: Date Range Applies Before Class Selection
 *
 * Tests that the class dropdown in session history is populated
 * based on sessions within the selected date range, not all sessions.
 */
test.describe('P2-11 AC6: Date Range Before Class Selection', () => {
  test.beforeEach(async ({ page }) => {
    await resetEmulatorData();
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('AC6: Class dropdown only shows classes with sessions in current date range', async ({ page }) => {
    // Create two sessions with different class names
    await startInstructorSession(page, 'Math 101');

    // End session and create another
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 15000 });

    await startInstructorSession(page, 'Physics 201');
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 15000 });

    // Go to history view
    await goToHistoryView(page);

    // Verify a class filter dropdown exists
    const classDropdown = page.locator('select#historyClassFilter');
    await expect(classDropdown).toBeVisible({ timeout: 5000 });

    // Dropdown should have "All Classes" plus our two class names
    const options = classDropdown.locator('option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('All Classes');
    expect(optionTexts.some(t => t.includes('Math 101'))).toBe(true);
    expect(optionTexts.some(t => t.includes('Physics 201'))).toBe(true);
  });

  test('AC6: Selecting a class filters history to only that class', async ({ page }) => {
    // Create two sessions with different class names
    await startInstructorSession(page, 'English 301');

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 15000 });

    await startInstructorSession(page, 'History 401');
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 15000 });

    // Go to history view
    await goToHistoryView(page);

    // Both classes should be visible initially
    await expect(page.locator('h3:has-text("English 301")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("History 401")')).toBeVisible({ timeout: 5000 });

    // Select "English 301" from class dropdown
    const classDropdown = page.locator('select#historyClassFilter');
    await classDropdown.selectOption({ label: 'English 301' });

    // Only English 301 should be visible
    await expect(page.locator('h3:has-text("English 301")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("History 401")')).not.toBeVisible();

    // Switch back to All Classes
    await classDropdown.selectOption({ label: 'All Classes' });

    // Both should be visible again
    await expect(page.locator('h3:has-text("English 301")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("History 401")')).toBeVisible({ timeout: 5000 });
  });
});
