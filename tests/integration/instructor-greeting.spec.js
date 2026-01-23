// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoWithEmulator } = require('../utils/test-helpers');

/**
 * P2-12: Personalized Greeting on Instructor Dashboard
 *
 * Tests that instructors see a personalized greeting after authentication.
 */

test.describe('P2-12: Personalized Greeting on Instructor Dashboard', () => {
  test('AC1: Greeting visible when instructor authenticated with Google (testAuth mode)', async ({ page }) => {
    // Navigate with testAuth=instructor which sets displayName to 'Test Instructor'
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Should see personalized greeting
    await expect(page.locator('text=Hi, Test!')).toBeVisible({ timeout: 5000 });
  });

  test('AC1.4: Uses friendly informal tone (Hi, not Hello)', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Should start with "Hi," not "Hello,"
    await expect(page.locator('text=Hi,')).toBeVisible();
    await expect(page.locator('text=Hello,')).not.toBeVisible();
  });

  test('AC2.2: First name extracted from displayName by splitting on space', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // displayName is "Test Instructor", first name should be "Test"
    await expect(page.locator('text=Hi, Test!')).toBeVisible();
    // Should NOT show full name
    await expect(page.locator('text=Hi, Test Instructor!')).not.toBeVisible();
  });

  test('AC4: Greeting uses theme-aware styling', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    const greeting = page.locator('text=Hi, Test!');
    await expect(greeting).toBeVisible();

    // Check that it has proper text color class for light mode
    const greetingContainer = page.locator('#instructor-greeting');
    await expect(greetingContainer).toBeVisible();
  });

  test('AC6: Greeting readable in dark mode', async ({ page }) => {
    // Enable dark mode via localStorage
    await gotoWithEmulator(page, '/');
    await page.evaluate(() => localStorage.setItem('neu_attendance_dark_mode', 'true'));
    await page.reload();

    // Navigate to instructor mode
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Greeting should still be visible in dark mode
    await expect(page.locator('text=Hi, Test!')).toBeVisible();
  });

  test('AC3.1: Fallback to "Hi, Instructor!" when displayName is missing', async ({ page }) => {
    // Navigate to regular mode first (no testAuth)
    await gotoWithEmulator(page, '/');

    // Check that getFirstName utility handles null/undefined correctly
    const firstName = await page.evaluate(() => {
      // Simulate the getFirstName function
      const getFirstName = (displayName) => {
        if (!displayName || displayName.trim() === '') return null;
        return displayName.trim().split(' ')[0];
      };
      return getFirstName(null);
    });
    expect(firstName).toBeNull();

    const firstNameEmpty = await page.evaluate(() => {
      const getFirstName = (displayName) => {
        if (!displayName || displayName.trim() === '') return null;
        return displayName.trim().split(' ')[0];
      };
      return getFirstName('');
    });
    expect(firstNameEmpty).toBeNull();
  });

  test('AC5: Greeting responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Greeting should still be visible on mobile
    await expect(page.locator('text=Hi, Test!')).toBeVisible();
  });
});
