// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitForPageLoad,
  authenticateAsInstructor,
  startInstructorSession,
  goToHistoryView,
  gotoWithEmulator,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Instructor Flow Integration Tests
 *
 * Tests the complete instructor journey:
 * - PIN authentication
 * - Session creation and configuration
 * - Code display and rotation
 * - Attendance monitoring
 * - Session management
 */

const INSTRUCTOR_PIN = '230782';

test.describe('Instructor Flow', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test('should show mode selection on home page', async ({ page }) => {
    await expect(page.locator('text=Quick Attendance')).toBeVisible();
    await expect(page.locator('button:has-text("I\'m the Instructor")')).toBeVisible();
    await expect(page.locator('button:has-text("I\'m a Student")')).toBeVisible();
  });

  test('should navigate to PIN entry when clicking instructor button', async ({ page }) => {
    await page.click('button:has-text("I\'m the Instructor")');
    await expect(page.locator('text=Instructor Access')).toBeVisible();
    await expect(page.locator('input#instructorPin')).toBeVisible();
  });

  test('should reject incorrect PIN', async ({ page }) => {
    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', '000000');
    await page.click('button:has-text("Access Instructor Mode")');

    await expect(page.locator('text=Incorrect PIN')).toBeVisible();
    // Should still be on PIN entry screen
    await expect(page.locator('input#instructorPin')).toBeVisible();
  });

  test('should accept correct PIN and show session setup', async ({ page }) => {
    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', INSTRUCTOR_PIN);
    await page.click('button:has-text("Access Instructor Mode")');

    await expect(page.locator('text=Start Attendance Session')).toBeVisible();
    await expect(page.locator('input#className')).toBeVisible();
    await expect(page.locator('input#radius')).toBeVisible();
    await expect(page.locator('input#lateThreshold')).toBeVisible();
  });

  test('should show session configuration options', async ({ page }) => {
    await authenticateAsInstructor(page, INSTRUCTOR_PIN);

    // Check radius slider - updated for larger max value
    const radiusSlider = page.locator('input#radius');
    await expect(radiusSlider).toBeVisible();
    const radiusMin = await radiusSlider.getAttribute('min');
    const radiusMax = await radiusSlider.getAttribute('max');
    expect(radiusMin).toBe('20');
    expect(radiusMax).toBe('500'); // Updated from 200 to 500

    // Check late threshold slider
    const lateSlider = page.locator('input#lateThreshold');
    await expect(lateSlider).toBeVisible();
  });

  test('should show View History button', async ({ page }) => {
    await authenticateAsInstructor(page, INSTRUCTOR_PIN);
    await expect(page.locator('button:has-text("View History")')).toBeVisible();
  });

  test('should open and close history view', async ({ page }) => {
    await authenticateAsInstructor(page, INSTRUCTOR_PIN);

    // Open history
    await goToHistoryView(page);
    await expect(page.locator('text=Session History')).toBeVisible();

    // Close history
    await page.click('button:has-text("Back to Dashboard")');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible();
  });

  test('should start a session and display code', async ({ page }) => {
    await startInstructorSession(page, 'Test Class - Integration');

    // Verify code display
    const codeDisplay = page.locator('.code-display').first();
    await expect(codeDisplay).toBeVisible();
    const code = await codeDisplay.textContent();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);

    // Verify timer
    await expect(page.locator('text=New code in')).toBeVisible();
  });

  test('should show attendance stats when session is active', async ({ page }) => {
    await startInstructorSession(page, 'Stats Test Class');

    // Check stats display - use exact match to avoid multiple matches
    await expect(page.getByText('On Time', { exact: true })).toBeVisible();
    await expect(page.getByText('Late', { exact: true })).toBeVisible();
    await expect(page.getByText('Failed', { exact: true }).first()).toBeVisible();
  });

  test('should show empty attendance message initially', async ({ page }) => {
    await startInstructorSession(page, 'Empty Test');

    await expect(page.locator('text=Waiting for students')).toBeVisible();
    await expect(page.locator('text=No failed attempts')).toBeVisible();
  });

  test('should have Export CSV button during active session', async ({ page }) => {
    await startInstructorSession(page, 'Export Test');
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
  });

  test('should have End Session button during active session', async ({ page }) => {
    await startInstructorSession(page, 'End Test');
    await expect(page.locator('button:has-text("End Session")')).toBeVisible();
  });

  test('should end session and return to setup', async ({ page }) => {
    await startInstructorSession(page, 'Session End Test');

    // Handle confirmation dialog
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await page.click('button:has-text("End Session")');

    // Should return to setup screen
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 15000 });
  });

  test('should allow accessing instructor mode via URL parameter', async ({ page }) => {
    await gotoWithEmulator(page, '/?mode=teacher');

    // Wait for page to process URL parameter
    await expect(page.locator('text=Instructor Access')).toBeVisible({ timeout: 10000 });
  });

  test('should have QR code for student check-in during session', async ({ page }) => {
    await startInstructorSession(page, 'QR Test');

    // Check for QR container
    await expect(page.locator('#qr-student-checkin')).toBeVisible();
    await expect(page.locator('text=Scan to Check In')).toBeVisible();
  });
});
