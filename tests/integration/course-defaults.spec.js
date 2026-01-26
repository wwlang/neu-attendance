// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitForPageLoad,
  authenticateAsInstructor,
  gotoWithEmulator,
  startInstructorSession,
  endSessionAndGoToHistory,
} = require('../utils/test-helpers');
const { resetEmulatorData } = require('../utils/firebase-helpers');

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

  // P8-04.1: Session history/details display "Location Radius"
  test('AC1.3b: Session detail view shows "Location Radius" not "Classroom Radius"', async ({ page }) => {
    // Create a session, end it, and view details
    await startInstructorSession(page, 'Radius Label Test');

    // End session and go to history
    await endSessionAndGoToHistory(page);

    // Click on the session to view details
    await expect(page.locator('text=Radius Label Test')).toBeVisible({ timeout: 10000 });
    await page.locator('text=Radius Label Test').click();

    // Wait for session detail view
    await expect(page.locator('text=Back to History')).toBeVisible({ timeout: 5000 });

    // Session detail should show "Location Radius" label
    await expect(page.locator('text=Location Radius:')).toBeVisible({ timeout: 5000 });

    // Ensure old terminology is NOT present
    await expect(page.locator('text=Classroom Radius:')).not.toBeVisible();
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
});

/**
 * Tests for the Session Activation Override Panel
 * These tests create a course with a scheduled session for today, then test the override UI
 */
test.describe('P8-03: Session Activation Override Panel', () => {
  // Use timestamp-based unique identifiers to avoid data conflicts between tests
  const testId = Date.now();
  let testCounter = 0;

  /**
   * Helper function to create a course with a session scheduled for today
   * Uses unique identifiers to avoid conflicts with data from other tests
   * @returns {Promise<string>} The unique className (courseCode-section) created
   */
  async function createCourseWithTodaySession(page, courseCode, section, radius = 350, lateThreshold = 12) {
    // Add unique suffix to class name to avoid conflicts
    const uniqueSection = `${section}${testId % 100000}${++testCounter}`;
    const className = `${courseCode}-${uniqueSection}`;
    await page.click('button:has-text("Setup New Course")');

    // Wait for wizard to open - Step 1 heading appears
    await expect(page.getByRole('heading', { name: 'Course Info' })).toBeVisible({ timeout: 5000 });

    // Step 1: Course Info
    await page.locator('input#courseCode').fill(courseCode);
    await page.locator('input#section').fill(uniqueSection);
    await page.click('button:has-text("Next")');

    // Wait for Step 2 to be visible
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible({ timeout: 5000 });

    // Step 2: Schedule - select today's day of week
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = dayNames[today.getDay()];

    // Wait for day checkbox to be visible and click it
    const dayLabel = page.locator(`label:has-text("${todayDay}")`);
    await expect(dayLabel).toBeVisible({ timeout: 5000 });
    await dayLabel.click();

    // Verify the day is selected (label should have blue styling)
    await expect(dayLabel).toHaveClass(/bg-blue-100|border-blue-500/, { timeout: 3000 });

    // Set time to current time + 1 hour (wrapping at midnight for late-night tests)
    const currentHour = today.getHours();
    const startHour = String((currentHour + 1) % 24).padStart(2, '0');
    const endHour = String((currentHour + 2) % 24).padStart(2, '0');

    // Wait for time inputs and fill them
    const startTimeInput = page.locator('input#startTime');
    const endTimeInput = page.locator('input#endTime');
    await expect(startTimeInput).toBeVisible({ timeout: 3000 });
    await startTimeInput.fill(`${startHour}:00`);
    await endTimeInput.fill(`${endHour}:00`);

    // Set weeks to 1 so only one session is created
    const weeksSlider = page.locator('input#weeks');
    await expect(weeksSlider).toBeVisible({ timeout: 3000 });
    await weeksSlider.fill('1');

    // Verify weeks value updated (check the display label)
    await expect(page.locator('#weeksValue')).toHaveText('1', { timeout: 3000 });

    await page.click('button:has-text("Next")');

    // Wait for Step 3 to be visible
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible({ timeout: 5000 });

    // Step 3: Location - capture and set radius
    await page.click('button:has-text("Capture Location")');
    await expect(page.locator('text=Location captured')).toBeVisible({ timeout: 5000 });

    // Set custom radius and verify it was applied
    const radiusSlider = page.locator('.space-y-4 input[type="range"][min="20"][max="500"]');
    await expect(radiusSlider).toBeVisible({ timeout: 3000 });
    await radiusSlider.fill(String(radius));

    // Wait for radius label to update
    await expect(page.locator(`text=Location Radius: ${radius}m`)).toBeVisible({ timeout: 3000 });

    await page.click('button:has-text("Next")');

    // Wait for Step 4 to be visible
    await expect(page.getByRole('heading', { name: 'Confirm Course Setup' })).toBeVisible({ timeout: 5000 });

    // Step 4: Confirm - set late threshold and verify
    const lateSlider = page.locator('input[type="range"][min="0"][max="60"]');
    await expect(lateSlider).toBeVisible({ timeout: 3000 });
    await lateSlider.fill(String(lateThreshold));

    // Verify late threshold label updated
    await expect(page.locator(`text=Late Threshold: ${lateThreshold} minutes`)).toBeVisible({ timeout: 3000 });

    // Handle the success alert dialog
    page.once('dialog', dialog => dialog.accept());

    await page.click('button:has-text("Create Course")');

    // Wait for course creation to complete and return to dashboard
    await expect(page.locator('button:has-text("Setup New Course")')).toBeVisible({ timeout: 15000 });

    // Give Firebase a moment to process the write and trigger the listener
    await page.waitForTimeout(500);

    // Wait for the scheduled session to appear in Today's Sessions
    await expect(page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) })).toBeVisible({ timeout: 15000 });

    return className;
  }

  test.beforeEach(async ({ page }) => {
    // Reset emulator data before EACH test (including retries) for complete isolation
    await resetEmulatorData();

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test('AC3: Session activation panel shows course defaults pre-filled', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with today's session
    const className = await createCourseWithTodaySession(page, 'DFLT101', 'A', 350, 12);

    // Find the scheduled session in Today's Sessions by class name
    await expect(page.locator('h3:has-text("Today\'s")')).toBeVisible();
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    await expect(sessionCard).toBeVisible();

    // Click expand button to show override panel
    const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();

    // Verify sliders are pre-filled with course defaults (350m, 12 min)
    const radiusSlider = sessionCard.locator('input#sessionRadius');
    const lateSlider = sessionCard.locator('input#sessionLateThreshold');

    await expect(radiusSlider).toHaveValue('350');
    await expect(lateSlider).toHaveValue('12');

    // Verify value displays
    await expect(sessionCard.locator('#sessionRadiusValue')).toHaveText('350');
    await expect(sessionCard.locator('#sessionLateThresholdValue')).toHaveText('12');
  });

  test('AC4: Override settings section is collapsible (hidden by default)', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with today's session
    const className = await createCourseWithTodaySession(page, 'COLL102', 'B', 300, 10);

    // Find the session card by class name
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    await expect(sessionCard).toBeVisible();

    // Settings panel should be hidden by default
    const settingsPanel = sessionCard.locator('[data-testid="session-settings-panel"]');
    await expect(settingsPanel).toBeHidden();

    // Click expand button
    const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
    await expandBtn.click();

    // Panel should now be visible
    await expect(settingsPanel).toBeVisible();

    // Click again to collapse
    await expandBtn.click();
    await expect(settingsPanel).toBeHidden();
  });

  test('AC5: Expanding override shows radius and lateThreshold sliders', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with today's session
    const className = await createCourseWithTodaySession(page, 'SLDR103', 'C', 400, 15);

    // Find the session card by class name
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
    await expandBtn.click();

    // Verify both sliders are visible with correct labels
    await expect(sessionCard.locator('label:has-text("Location Radius")')).toBeVisible();
    await expect(sessionCard.locator('label:has-text("Late Threshold")')).toBeVisible();

    // Verify slider inputs exist
    await expect(sessionCard.locator('input#sessionRadius')).toBeVisible();
    await expect(sessionCard.locator('input#sessionLateThreshold')).toBeVisible();
  });

  test('AC6: Activated session uses course defaults if no override', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with specific defaults
    const className = await createCourseWithTodaySession(page, 'ACTV104', 'D', 275, 8);

    // Find the session card by class name
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    const activateBtn = sessionCard.locator('button:has-text("Activate")');
    await expect(activateBtn).toBeVisible();

    // Click Activate directly without expanding override panel
    await activateBtn.click();

    // Should show active session with QR code
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 15000 });

    // End session to clean up
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
  });

  test('AC7: Activated session uses override values if specified', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with specific defaults
    const className = await createCourseWithTodaySession(page, 'OVRD105', 'E', 300, 10);

    // Find the session card by class name
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
    await expandBtn.click();

    // Change override values
    const radiusSlider = sessionCard.locator('input#sessionRadius');
    const lateSlider = sessionCard.locator('input#sessionLateThreshold');

    await radiusSlider.fill('450');
    await radiusSlider.dispatchEvent('input');
    await lateSlider.fill('20');
    await lateSlider.dispatchEvent('input');

    // Verify values updated
    await expect(sessionCard.locator('#sessionRadiusValue')).toHaveText('450');
    await expect(sessionCard.locator('#sessionLateThresholdValue')).toHaveText('20');

    // Activate with overrides
    const activateBtn = sessionCard.locator('button:has-text("Activate")');
    await activateBtn.click();

    // Should show active session
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 15000 });

    // End session to clean up
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
  });

  test('AC11: UI shows "Using course defaults" badge when not overriding', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with today's session
    const className = await createCourseWithTodaySession(page, 'BDGE106', 'F', 300, 10);

    // Find the specific session card by class name (not just first, as there may be others from previous tests)
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    await expect(sessionCard).toBeVisible();

    // Should show "Course defaults" badge
    const defaultsBadge = sessionCard.locator('[data-testid="using-defaults-badge"]');
    await expect(defaultsBadge).toBeVisible();
    await expect(defaultsBadge).toContainText('Course defaults');
  });

  test('Badge changes to "Custom settings" when override values are modified', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with today's session
    const className = await createCourseWithTodaySession(page, 'CSTM107', 'G', 300, 10);

    // Find the specific session card by class name
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
    await expandBtn.click();

    // Initially shows "Course defaults"
    const defaultsBadge = sessionCard.locator('[data-testid="using-defaults-badge"]');
    await expect(defaultsBadge).toContainText('Course defaults');

    // Change a value
    const radiusSlider = sessionCard.locator('input#sessionRadius');
    await radiusSlider.fill('450');

    // Badge should change to "Custom settings"
    await expect(defaultsBadge).toContainText('Custom settings');
  });

  test('Reset to Course Defaults button restores original values', async ({ page }) => {
    await authenticateAsInstructor(page);

    // Create a course with specific defaults
    const className = await createCourseWithTodaySession(page, 'RSET108', 'H', 325, 7);

    // Find the specific session card by class name
    const sessionCard = page.locator('[data-testid="session-card"]', { has: page.locator(`text=${className}`) });
    const expandBtn = sessionCard.locator('[data-testid="expand-session-settings"]');
    await expandBtn.click();

    // Verify initial values
    await expect(sessionCard.locator('#sessionRadiusValue')).toHaveText('325');
    await expect(sessionCard.locator('#sessionLateThresholdValue')).toHaveText('7');

    // Change values
    const radiusSlider = sessionCard.locator('input#sessionRadius');
    const lateSlider = sessionCard.locator('input#sessionLateThreshold');
    await radiusSlider.fill('500');
    await radiusSlider.dispatchEvent('input');
    await lateSlider.fill('30');
    await lateSlider.dispatchEvent('input');

    // Verify values changed
    await expect(sessionCard.locator('#sessionRadiusValue')).toHaveText('500');
    await expect(sessionCard.locator('#sessionLateThresholdValue')).toHaveText('30');

    // Click Reset to Course Defaults
    const resetBtn = sessionCard.locator('button:has-text("Reset to Course Defaults")');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify values restored to original
    await expect(sessionCard.locator('#sessionRadiusValue')).toHaveText('325');
    await expect(sessionCard.locator('#sessionLateThresholdValue')).toHaveText('7');
  });
});
