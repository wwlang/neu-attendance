// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoWithEmulator, authenticateAsInstructor, goToHistoryView } = require('../utils/test-helpers');

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
    await expect(page.locator('text=Sessions from the last 14 days')).toBeVisible({ timeout: 5000 });
  });

  test('AC2: Displays sessions from (today - 14 days) to today', async ({ page }) => {
    // Navigate to history view
    await goToHistoryView(page);

    // Verify the text indicates 14-day range
    await expect(page.locator('text=Sessions from the last 14 days')).toBeVisible({ timeout: 5000 });

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
    await expect(page.locator('text=Sessions from the last 14 days')).toBeVisible();

    // Toggle to show all
    await page.locator('label:has-text("Show All Sessions") input[type="checkbox"]').check();

    // Now should show "All sessions" message
    await expect(page.locator('text=All sessions.')).toBeVisible();
  });
});
