// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - QR Code Integration Tests
 *
 * Tests QR code generation and auto-fill functionality:
 * - QR codes on home page
 * - QR codes on instructor setup
 * - QR code with code parameter for auto-fill
 */

// Helper function to wait for app to load
async function waitForAppLoad(page) {
  await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500); // Give JS time to render
}

test.describe('QR Code Generation', () => {
  test('should show QR codes on home page', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    // Check QR containers exist
    await expect(page.locator('#qr-teacher')).toBeVisible();
    await expect(page.locator('#qr-student')).toBeVisible();
  });

  test('should show QR codes on instructor setup page', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', '230782');
    await page.click('button:has-text("Access Instructor Mode")');
    await page.waitForTimeout(1500);

    // Check for setup QR codes
    await expect(page.locator('#qr-student-large')).toBeVisible();
    await expect(page.locator('#qr-teacher-large')).toBeVisible();
  });

  test('should show check-in QR during active session', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', '230782');
    await page.click('button:has-text("Access Instructor Mode")');
    await page.fill('input#className', 'QR Test Session');
    await page.click('button:has-text("Start Session")');
    await page.waitForTimeout(3000);

    // Check for session QR code
    await expect(page.locator('#qr-student-checkin')).toBeVisible();
    await expect(page.locator('text=Scan to Check In')).toBeVisible();
  });
});

test.describe('QR Code Auto-fill', () => {
  test('should auto-fill code from URL parameter', async ({ page }) => {
    await page.goto('/?mode=student&code=TESTCD');
    await waitForAppLoad(page);
    await page.waitForSelector('input#enteredCode', { timeout: 10000 });

    const codeValue = await page.inputValue('input#enteredCode');
    expect(codeValue).toBe('TESTCD');
  });

  test('should show auto-fill confirmation message', async ({ page }) => {
    await page.goto('/?mode=student&code=ABC123');
    await waitForAppLoad(page);
    await page.waitForSelector('input#enteredCode', { timeout: 10000 });

    await expect(page.locator('text=Code auto-filled from QR scan')).toBeVisible();
  });

  test('should not show auto-fill message without code parameter', async ({ page }) => {
    await page.goto('/?mode=student');
    await waitForAppLoad(page);
    await page.waitForSelector('input#enteredCode', { timeout: 10000 });

    await expect(page.locator('text=Code auto-filled from QR scan')).not.toBeVisible();
  });

  test('should handle empty code parameter', async ({ page }) => {
    await page.goto('/?mode=student&code=');
    await waitForAppLoad(page);
    await page.waitForSelector('input#enteredCode', { timeout: 10000 });

    const codeValue = await page.inputValue('input#enteredCode');
    expect(codeValue).toBe('');
    await expect(page.locator('text=Code auto-filled from QR scan')).not.toBeVisible();
  });
});
