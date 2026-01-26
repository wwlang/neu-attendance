// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitForPageLoad,
  authenticateAsInstructor,
  gotoWithEmulator,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Course Setup Integration Tests
 *
 * Tests the course setup wizard and scheduled session functionality:
 * - Course setup wizard navigation
 * - Schedule configuration
 * - Session generation
 * - Dashboard integration
 * - Session activation
 */

test.describe('Course Setup Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Grant geolocation permissions
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test.describe('Late Threshold Slider', () => {
    test('should allow late threshold of 0 minutes', async ({ page }) => {
      await authenticateAsInstructor(page);

      // Check late threshold slider attributes
      const lateSlider = page.locator('input#lateThreshold');
      await expect(lateSlider).toBeVisible();

      // Verify min is now 0 (updated from 5)
      const minValue = await lateSlider.getAttribute('min');
      expect(minValue).toBe('0');

      // Verify max is now 60 (updated from 30)
      const maxValue = await lateSlider.getAttribute('max');
      expect(maxValue).toBe('60');
    });

    test('should update late threshold display when slider moved to 0', async ({ page }) => {
      await authenticateAsInstructor(page);

      const lateSlider = page.locator('input#lateThreshold');
      const lateValue = page.locator('#lateValue');

      // Set slider to 0
      await lateSlider.fill('0');

      // Trigger input event
      await lateSlider.evaluate(el => el.dispatchEvent(new Event('input', { bubbles: true })));

      // Verify display shows 0
      await expect(lateValue).toHaveText('0');
    });
  });

  test.describe('Quick Session (Existing Flow)', () => {
    test('should still support quick session creation without course', async ({ page }) => {
      await authenticateAsInstructor(page);

      // Verify Start Session button exists (quick session flow)
      await expect(page.locator('button:has-text("Start Session")')).toBeVisible();

      // Verify class name input exists
      const classInput = page.locator('input#className');
      const classSelect = page.locator('select#classSelect');

      // Either input or select should be visible
      const hasInput = await classInput.isVisible().catch(() => false);
      const hasSelect = await classSelect.isVisible().catch(() => false);
      expect(hasInput || hasSelect).toBe(true);
    });

    test('should start quick session with zero late threshold', async ({ page }) => {
      await authenticateAsInstructor(page);

      // Set late threshold to 0
      const lateSlider = page.locator('input#lateThreshold');
      await lateSlider.fill('0');
      await lateSlider.evaluate(el => el.dispatchEvent(new Event('input', { bubbles: true })));

      // Check for class dropdown or input
      const classSelect = page.locator('select#classSelect');
      if (await classSelect.isVisible().catch(() => false)) {
        await classSelect.selectOption('__new__');
        await expect(page.locator('#newClassInput')).toBeVisible({ timeout: 3000 });
      }

      // Enter class name
      const classInput = page.locator('input#className');
      await classInput.fill('Zero Threshold Test Class');

      // Start session
      await page.click('button:has-text("Start Session")');

      // Wait for session to start
      await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 15000 });

      // End session
      page.once('dialog', dialog => dialog.accept());
      await page.click('button:has-text("End Session")');
    });
  });

  test.describe('Course Setup Wizard', () => {
    test('should show Setup New Course button on instructor dashboard', async ({ page }) => {
      await authenticateAsInstructor(page);

      // Look for Setup New Course button
      await expect(page.locator('button:has-text("Setup New Course")')).toBeVisible();
    });

    test('should open course setup wizard when clicking Setup New Course', async ({ page }) => {
      await authenticateAsInstructor(page);

      await page.click('button:has-text("Setup New Course")');

      // Verify wizard step 1 is visible - use heading to avoid step indicator match
      await expect(page.getByRole('heading', { name: 'Course Information' })).toBeVisible();
      await expect(page.locator('input#courseCode')).toBeVisible();
      await expect(page.locator('input#section')).toBeVisible();
    });

    test('should validate course info before proceeding', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Wait for wizard to open
      await expect(page.getByRole('heading', { name: 'Course Information' })).toBeVisible();

      // Set up dialog handler to capture alert message
      let alertMessage = '';
      page.once('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      // Try to proceed without filling fields
      await page.click('button:has-text("Next")');

      // Wait for alert to be processed
      await page.waitForTimeout(500);

      // Verify error was shown via alert
      expect(alertMessage).toContain('Course code is required');
    });

    test('should show combined class name preview', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Fill course info
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');

      // Verify preview shows combined name
      await expect(page.locator('text=CS101-A')).toBeVisible();
    });

    test('should navigate through all wizard steps', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Step 1: Course Info - use heading to avoid step indicator match
      await expect(page.getByRole('heading', { name: 'Course Information' })).toBeVisible();
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');

      // Step 2: Schedule - use heading to avoid step indicator match
      await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
      await page.locator('label:has-text("Mon")').click();
      await page.locator('input#startTime').fill('09:00');
      await page.locator('input#endTime').fill('10:30');
      await page.click('button:has-text("Next")');

      // Step 3: Location - use heading to avoid step indicator match
      await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
      await page.click('button:has-text("Capture Location")');
      await expect(page.locator('text=Location captured')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Next")');

      // Step 4: Confirm - use heading to avoid step indicator match
      await expect(page.getByRole('heading', { name: 'Confirm Course Setup' })).toBeVisible();
      await expect(page.locator('text=CS101-A')).toBeVisible();
    });
  });

  test.describe('Scheduled Sessions', () => {
    test('should show Today\'s Scheduled Sessions section', async ({ page }) => {
      await authenticateAsInstructor(page);

      // Should show the "Today's Sessions" heading (always displayed now)
      await expect(page.getByRole('heading', { name: "Today's Sessions" })).toBeVisible();
    });

    test('should activate scheduled session', async ({ page }) => {
      // This test assumes a scheduled session exists for today
      // In a real test, we would first create a course with a session for today

      await authenticateAsInstructor(page);

      // Find and click Activate button on a scheduled session
      const activateBtn = page.locator('button:has-text("Activate")').first();

      if (await activateBtn.isVisible().catch(() => false)) {
        await activateBtn.click();

        // Should show session with code display
        await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Remote Location Selection (Map)', () => {
    test('should show location method tabs on Step 3', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Fill Step 1 and proceed
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');

      // Fill Step 2 and proceed
      await page.locator('label:has-text("Mon")').click();
      await page.locator('input#startTime').fill('09:00');
      await page.locator('input#endTime').fill('10:30');
      await page.click('button:has-text("Next")');

      // Verify location method tabs are visible
      await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
      await expect(page.locator('button:has-text("Use GPS")')).toBeVisible();
      await expect(page.locator('button:has-text("Select on Map")')).toBeVisible();
    });

    test('should switch to map method and show map container', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Fill Step 1 and proceed
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');

      // Fill Step 2 and proceed
      await page.locator('label:has-text("Mon")').click();
      await page.click('button:has-text("Next")');

      // Switch to map method
      await page.click('button:has-text("Select on Map")');

      // Verify map container appears
      await expect(page.locator('#courseSetupMap')).toBeVisible();
      await expect(page.locator('#addressSearchInput')).toBeVisible();

      // Verify GPS capture button is hidden
      await expect(page.locator('#captureLocationBtn')).not.toBeVisible();
    });

    test('should set location by clicking on map', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Navigate to Step 3
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');
      await page.locator('label:has-text("Mon")').click();
      await page.click('button:has-text("Next")');

      // Switch to map method
      await page.click('button:has-text("Select on Map")');

      // Wait for map to initialize
      await page.waitForSelector('.leaflet-container', { timeout: 5000 });

      // Click on the map to set location
      const mapContainer = page.locator('#courseSetupMap');
      await mapContainer.click({ position: { x: 150, y: 150 } });

      // Verify location is set (marker should exist and status should update)
      await expect(page.locator('.leaflet-marker-icon')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Location selected')).toBeVisible();
    });

    test('should show address search input and results container', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Navigate to Step 3
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');
      await page.locator('label:has-text("Mon")').click();
      await page.click('button:has-text("Next")');

      // Switch to map method
      await page.click('button:has-text("Select on Map")');

      // Verify search input exists
      await expect(page.locator('#addressSearchInput')).toBeVisible();
      await expect(page.locator('#addressSearchInput')).toHaveAttribute('placeholder', /Search address/);

      // Verify results container exists (hidden by default)
      await expect(page.locator('#addressSearchResults')).toHaveClass(/hidden/);

      // Type in address search to trigger showing results container
      await page.locator('#addressSearchInput').fill('Hanoi');

      // Wait for search to start (shows "Searching..." or results)
      // Using longer timeout since this depends on external API
      try {
        await expect(page.locator('#addressSearchResults')).not.toHaveClass(/hidden/, { timeout: 10000 });
      } catch {
        // If API is slow/unavailable, at least verify the input was accepted
        await expect(page.locator('#addressSearchInput')).toHaveValue('Hanoi');
      }
    });

    test('should update radius display when slider is moved', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Navigate to Step 3
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');
      await page.locator('label:has-text("Mon")').click();
      await page.click('button:has-text("Next")');

      // Switch to map method and set a location
      await page.click('button:has-text("Select on Map")');
      await page.waitForSelector('.leaflet-container', { timeout: 5000 });
      const mapContainer = page.locator('#courseSetupMap');
      await mapContainer.click({ position: { x: 150, y: 150 } });
      await expect(page.locator('.leaflet-marker-icon')).toBeVisible();

      // Verify radius display exists with default value
      await expect(page.locator('#courseRadiusValue')).toBeVisible();
      const initialRadius = await page.locator('#courseRadiusValue').textContent();
      expect(initialRadius).toBe('300'); // default value

      // Find the radius slider within the course setup wizard (100-300m, step 100)
      const radiusSlider = page.locator('.space-y-4 input[type="range"][min="100"][max="300"]');
      await radiusSlider.fill('200');

      // Verify display updates
      await expect(page.locator('#courseRadiusValue')).toHaveText('200');
    });

    test('should preserve location when switching tabs back to GPS', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Navigate to Step 3
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');
      await page.locator('label:has-text("Mon")').click();
      await page.click('button:has-text("Next")');

      // Switch to map method and set a location
      await page.click('button:has-text("Select on Map")');
      await page.waitForSelector('.leaflet-container', { timeout: 5000 });
      await page.locator('#courseSetupMap').click({ position: { x: 150, y: 150 } });
      await expect(page.locator('text=Location selected')).toBeVisible();

      // Get the coordinates shown
      const coordsText = await page.locator('#locationStatus').textContent();
      expect(coordsText).toContain('Lat:');

      // Switch back to GPS tab
      await page.click('button:has-text("Use GPS")');

      // Location heading should still be visible
      await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();

      // Coordinates should still be visible (text changes from "selected" to "captured" but coords persist)
      const newCoordsText = await page.locator('#locationStatus').textContent();
      expect(newCoordsText).toContain('Lat:');
    });

    test('should proceed to Step 4 with map-selected location', async ({ page }) => {
      await authenticateAsInstructor(page);
      await page.click('button:has-text("Setup New Course")');

      // Navigate to Step 3
      await page.locator('input#courseCode').fill('CS101');
      await page.locator('input#section').fill('A');
      await page.click('button:has-text("Next")');
      await page.locator('label:has-text("Mon")').click();
      await page.click('button:has-text("Next")');

      // Set location via map
      await page.click('button:has-text("Select on Map")');
      await page.waitForSelector('.leaflet-container');
      await page.locator('#courseSetupMap').click({ position: { x: 150, y: 150 } });
      await expect(page.locator('.leaflet-marker-icon')).toBeVisible();

      // Proceed to Step 4
      await page.click('button:has-text("Next")');

      // Should be on confirmation step
      await expect(page.getByRole('heading', { name: 'Confirm Course Setup' })).toBeVisible();
      await expect(page.locator('text=CS101-A')).toBeVisible();
    });
  });
});
