// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitForPageLoad,
  authenticateAsInstructor,
  startInstructorSession,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - QR Code Integration Tests
 *
 * Tests QR code generation and auto-fill functionality:
 * - QR codes on home page
 * - QR codes on instructor setup
 * - QR code with code parameter for auto-fill
 */

test.describe('QR Code Generation', () => {
  test('should show QR codes on home page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check QR containers exist
    await expect(page.locator('#qr-teacher')).toBeVisible();
    await expect(page.locator('#qr-student')).toBeVisible();
  });

  test('should show QR codes on instructor setup page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await authenticateAsInstructor(page, '230782');

    // Check for setup QR codes
    await expect(page.locator('#qr-student-large')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#qr-teacher-large')).toBeVisible();
  });

  test('should show check-in QR during active session', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await startInstructorSession(page, 'QR Test Session');

    // Check for session QR code
    await expect(page.locator('#qr-student-checkin')).toBeVisible();
    await expect(page.locator('text=Scan to Check In')).toBeVisible();
  });
});

test.describe('QR Code Auto-fill', () => {
  test('should auto-fill code from URL parameter', async ({ page }) => {
    await page.goto('/?mode=student&code=TESTCD');
    await expect(page.locator('input#enteredCode')).toBeVisible({ timeout: 10000 });

    const codeValue = await page.inputValue('input#enteredCode');
    expect(codeValue).toBe('TESTCD');
  });

  test('should show auto-fill confirmation message', async ({ page }) => {
    await page.goto('/?mode=student&code=ABC123');
    await expect(page.locator('input#enteredCode')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=Code auto-filled from QR scan')).toBeVisible();
  });

  test('should not show auto-fill message without code parameter', async ({ page }) => {
    await page.goto('/?mode=student');
    await expect(page.locator('input#enteredCode')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=Code auto-filled from QR scan')).not.toBeVisible();
  });

  test('should handle empty code parameter', async ({ page }) => {
    await page.goto('/?mode=student&code=');
    await expect(page.locator('input#enteredCode')).toBeVisible({ timeout: 10000 });

    const codeValue = await page.inputValue('input#enteredCode');
    expect(codeValue).toBe('');
    await expect(page.locator('text=Code auto-filled from QR scan')).not.toBeVisible();
  });
});
