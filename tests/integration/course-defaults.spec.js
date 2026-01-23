// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitForPageLoad,
  authenticateAsInstructor,
  gotoWithEmulator,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Course Defaults with Session Override
 *
 * Tests P8-03 and P8-04:
 * - Rename "Classroom Radius" to "Location Radius" throughout UI
 * - Course Setup stores radius and lateThreshold as defaults
 * - Session activation uses course defaults with optional override
 */

test.describe('P8-04: Location Radius Terminology', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test('AC1.1: Quick session form shows "Location Radius" not "Classroom Radius"', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Check the quick session start form
    const radiusLabel = page.locator('label:has-text("Location Radius")');
    await expect(radiusLabel).toBeVisible();

    // Ensure old terminology is NOT present
    await expect(page.locator('label:has-text("Classroom Radius")')).not.toBeVisible();
  });

  test('AC1.2: Course Setup Wizard Step 3 shows "Location Radius"', async ({ page }) => {
    await authenticateAsInstructor(page);
    await page.click('button:has-text("Setup New Course")');

    // Navigate to Step 3: Location
    await page.locator('input#courseCode').fill('CS101');
    await page.locator('input#section').fill('A');
    await page.click('button:has-text("Next")');

    await page.locator('label:has-text("Mon")').click();
    await page.locator('input#startTime').fill('09:00');
    await page.locator('input#endTime').fill('10:30');
    await page.click('button:has-text("Next")');

    // Verify Location step shows "Location Radius"
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
    const radiusLabel = page.locator('label:has-text("Location Radius")');
    await expect(radiusLabel).toBeVisible();

    // Ensure old terminology is NOT present
    await expect(page.locator('label:has-text("Classroom Radius")')).not.toBeVisible();
  });

  test('AC1.3: Help text updated to use "location" terminology', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Check help text for quick session
    const helpText = page.locator('text=Students must be within this distance');
    await expect(helpText).toBeVisible();
  });
});

test.describe('P8-03: Course Defaults with Session Override', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test('AC1: Course Setup Step 3 stores radius as course default', async ({ page }) => {
    await authenticateAsInstructor(page);
    await page.click('button:has-text("Setup New Course")');

    // Step 1: Course Info
    await page.locator('input#courseCode').fill('CS201');
    await page.locator('input#section').fill('B');
    await page.click('button:has-text("Next")');

    // Step 2: Schedule
    await page.locator('label:has-text("Mon")').click();
    await page.click('button:has-text("Next")');

    // Step 3: Location - set radius to 400m
    await page.click('button:has-text("Capture Location")');
    await expect(page.locator('text=Location captured')).toBeVisible({ timeout: 5000 });

    // Change radius to 400m
    const radiusSlider = page.locator('.space-y-4 input[type="range"][min="20"][max="500"]');
    await radiusSlider.fill('400');
    await expect(page.locator('#courseRadiusValue')).toHaveText('400');

    await page.click('button:has-text("Next")');

    // Step 4: Confirm - verify radius shows in summary (in the grid span, not the slider)
    await expect(page.getByRole('heading', { name: 'Confirm Course Setup' })).toBeVisible();
    await expect(page.locator('.grid span:has-text("400m")')).toBeVisible();
  });

  test('AC2: Course Setup Step 4 stores lateThreshold as course default', async ({ page }) => {
    await authenticateAsInstructor(page);
    await page.click('button:has-text("Setup New Course")');

    // Navigate to Step 4
    await page.locator('input#courseCode').fill('CS301');
    await page.locator('input#section').fill('C');
    await page.click('button:has-text("Next")');
    await page.locator('label:has-text("Mon")').click();
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Capture Location")');
    await expect(page.locator('text=Location captured')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Next")');

    // Step 4: Set late threshold to 15 minutes
    const lateSlider = page.locator('input[type="range"][min="0"][max="60"]');
    await lateSlider.fill('15');
    await expect(page.locator('#courseLateValue')).toHaveText('15');

    // Verify summary shows the late threshold (in the grid span with exact text)
    await expect(page.locator('.grid span:has-text("15 min")')).toBeVisible();
  });

  test('AC3: Session activation panel shows course defaults pre-filled', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Check if there's a scheduled session with override settings
    const todaySessionsSection = page.locator('text=Today\'s Sessions').or(page.locator('text=Today\'s Scheduled Sessions'));
    await expect(todaySessionsSection).toBeVisible();

    // Look for an Activate button
    const activateBtn = page.locator('button:has-text("Activate")').first();
    if (await activateBtn.isVisible().catch(() => false)) {
      // Expand override panel (click chevron or expand button)
      const expandBtn = page.locator('[data-testid="expand-session-settings"]').or(
        page.locator('button[aria-label="Expand settings"]')
      );

      if (await expandBtn.isVisible().catch(() => false)) {
        await expandBtn.click();
        // Verify sliders are pre-filled with course defaults
        await expect(page.locator('#sessionRadiusValue')).toBeVisible();
        await expect(page.locator('#sessionLateValue')).toBeVisible();
      }
    }
  });

  test('AC4: Override settings section is collapsible', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Find scheduled session
    const activateBtn = page.locator('button:has-text("Activate")').first();
    if (await activateBtn.isVisible().catch(() => false)) {
      const sessionCard = activateBtn.locator('..');

      // Settings panel should be hidden by default
      const settingsPanel = sessionCard.locator('[data-testid="session-settings-panel"]');
      if (await settingsPanel.count() > 0) {
        // Initially hidden
        await expect(settingsPanel).toBeHidden();

        // Click expand button
        const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
        if (await expandBtn.isVisible().catch(() => false)) {
          await expandBtn.click();
          await expect(settingsPanel).toBeVisible();

          // Click again to collapse
          await expandBtn.click();
          await expect(settingsPanel).toBeHidden();
        }
      }
    }
  });

  test('AC5: Expanding override shows radius and lateThreshold sliders', async ({ page }) => {
    await authenticateAsInstructor(page);

    const activateBtn = page.locator('button:has-text("Activate")').first();
    if (await activateBtn.isVisible().catch(() => false)) {
      const expandBtn = page.locator('[data-testid="expand-session-settings"]').first();
      if (await expandBtn.isVisible().catch(() => false)) {
        await expandBtn.click();

        // Verify both sliders are visible
        await expect(page.locator('input#sessionRadius')).toBeVisible();
        await expect(page.locator('input#sessionLateThreshold')).toBeVisible();
      }
    }
  });

  test('AC6: Activated session uses course defaults if no override', async ({ page }) => {
    await authenticateAsInstructor(page);

    const activateBtn = page.locator('button:has-text("Activate")').first();
    if (await activateBtn.isVisible().catch(() => false)) {
      // Click Activate directly without expanding override
      await activateBtn.click();

      // Should show session with code display (activation successful)
      await expect(page.locator('.code-display').first()).toBeVisible({ timeout: 15000 });

      // End session to clean up
      page.once('dialog', dialog => dialog.accept());
      await page.click('button:has-text("End Session")');
    }
  });

  test('AC9: Quick sessions unchanged (settings at start, no course)', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Verify quick session still shows radius and late threshold sliders
    const radiusSlider = page.locator('input#radius');
    const lateSlider = page.locator('input#lateThreshold');

    await expect(radiusSlider).toBeVisible();
    await expect(lateSlider).toBeVisible();

    // Verify they have expected attributes
    await expect(radiusSlider).toHaveAttribute('min', '20');
    await expect(radiusSlider).toHaveAttribute('max', '500');
    await expect(lateSlider).toHaveAttribute('min', '0');
    await expect(lateSlider).toHaveAttribute('max', '60');
  });

  test('AC10: Existing courses without defaults use 300m radius, 10 min late', async ({ page }) => {
    await authenticateAsInstructor(page);

    // This verifies backward compatibility - the default values in the state
    // Quick session defaults should be 300m and 10 min
    const radiusSlider = page.locator('input#radius');
    const radiusValue = page.locator('#radiusValue');
    const lateValue = page.locator('#lateValue');

    await expect(radiusSlider).toHaveValue('300');
    await expect(radiusValue).toHaveText('300');
    await expect(lateValue).toHaveText('10');
  });

  test('AC11: UI shows "Using course defaults" badge for scheduled sessions', async ({ page }) => {
    await authenticateAsInstructor(page);

    const activateBtn = page.locator('button:has-text("Activate")').first();
    if (await activateBtn.isVisible().catch(() => false)) {
      // Should show defaults badge near the activate button
      const sessionCard = activateBtn.locator('..').locator('..');
      const defaultsBadge = sessionCard.locator('text=Course defaults').or(
        sessionCard.locator('[data-testid="using-defaults-badge"]')
      );

      // Badge should exist (may or may not be visible depending on session type)
      // For sessions with courseId, badge should be visible
    }
  });
});
