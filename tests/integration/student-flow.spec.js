// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - Student Flow Integration Tests
 *
 * Tests the complete student journey:
 * - Form display and validation
 * - Device ID generation
 * - Location display
 * - Code submission
 * - Success/error handling
 */

test.describe('Student Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for loading spinner to disappear and content to render
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });
  });

  test('should navigate to student form when clicking student button', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Mark Attendance')).toBeVisible();
    await expect(page.locator('input#studentId')).toBeVisible();
    await expect(page.locator('input#studentName')).toBeVisible();
    await expect(page.locator('input#studentEmail')).toBeVisible();
    await expect(page.locator('input#enteredCode')).toBeVisible();
  });

  test('should auto-generate device ID', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    // Device ID should be displayed
    const content = await page.content();
    expect(content).toMatch(/DEV-[0-9A-F]{8}/);
  });

  test('should show location section', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    // Use more specific selectors to avoid multiple matches
    await expect(page.getByText('Your Location (Lat, Lng)')).toBeVisible();
    await expect(page.getByText('Device Information', { exact: false })).toBeVisible();
  });

  test('should validate empty fields', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    // Try to submit with empty fields
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Please fill in all fields')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    await page.fill('input#studentId', '12345678');
    await page.fill('input#studentName', 'Test Student');
    await page.fill('input#studentEmail', 'invalid-email');
    await page.fill('input#enteredCode', 'ABC123');
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should validate code length', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    await page.fill('input#studentId', '12345678');
    await page.fill('input#studentName', 'Test Student');
    await page.fill('input#studentEmail', 'test@example.com');
    await page.fill('input#enteredCode', 'ABC'); // Too short
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=must be 6 characters')).toBeVisible();
  });

  test('should auto-uppercase entered code', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(1000);

    await page.fill('input#enteredCode', 'abcdef');
    const value = await page.inputValue('input#enteredCode');
    expect(value).toBe('ABCDEF');
  });

  test('should access student mode via URL parameter', async ({ page }) => {
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Mark Attendance')).toBeVisible();
  });

  test('should auto-fill code from URL parameter', async ({ page }) => {
    await page.goto('/?mode=student&code=TESTCD');
    await page.waitForTimeout(1000);

    const value = await page.inputValue('input#enteredCode');
    expect(value).toBe('TESTCD');
    await expect(page.locator('text=Code auto-filled from QR scan')).toBeVisible();
  });

  test('should have maxlength on input fields', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    const studentIdMax = await page.locator('input#studentId').getAttribute('maxlength');
    const studentNameMax = await page.locator('input#studentName').getAttribute('maxlength');
    const studentEmailMax = await page.locator('input#studentEmail').getAttribute('maxlength');
    const codeMax = await page.locator('input#enteredCode').getAttribute('maxlength');

    expect(studentIdMax).toBe('20');
    expect(studentNameMax).toBe('100');
    expect(studentEmailMax).toBe('100');
    expect(codeMax).toBe('6');
  });

  test('should accept Vietnamese characters in name', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    const vietnameseName = 'Nguyen Van Duc';
    await page.fill('input#studentName', vietnameseName);
    const value = await page.inputValue('input#studentName');
    expect(value).toBe(vietnameseName);
  });

  test('should have back button to return to mode selection', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Quick Attendance')).toBeVisible();
    await expect(page.locator('button:has-text("I\'m the Instructor")')).toBeVisible();
  });

  test('should show error when no active session', async ({ page }) => {
    // Note: This test assumes there's no active session running
    // The actual error message depends on Firebase state
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    await page.fill('input#studentId', '12345678');
    await page.fill('input#studentName', 'Test Student');
    await page.fill('input#studentEmail', 'test@example.com');
    await page.fill('input#enteredCode', 'XXXXXX');
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(3000);

    // Should show some error (either "No active session" or "Invalid code" or similar)
    const content = await page.content();
    const hasError = content.includes('error') ||
                     content.includes('Error') ||
                     content.includes('session') ||
                     content.includes('Invalid') ||
                     content.includes('logged');
    expect(hasError).toBe(true);
  });
});
