// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - Dark Mode Integration Tests
 *
 * Tests dark mode functionality:
 * - Toggle button visibility
 * - Theme switching
 * - Persistence across page reloads
 * - System preference detection
 */

test.describe('Dark Mode', () => {
  // Increase timeout for dark mode tests due to reload
  test.setTimeout(45000);

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    // Wait for loading spinner to disappear and content to render
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 15000 });
  });

  test('should show dark mode toggle button', async ({ page }) => {
    await expect(page.locator('button[title="Toggle dark mode"]')).toBeVisible();
  });

  test('should toggle to dark mode when clicked', async ({ page }) => {
    // Initially should be light mode (or system preference)
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
  });

  test('should toggle back to light mode on second click', async ({ page }) => {
    // Click twice to go dark then light
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(false);
  });

  test('should persist dark mode preference in localStorage', async ({ page }) => {
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    const storedValue = await page.evaluate(() =>
      localStorage.getItem('neu_attendance_dark_mode')
    );
    expect(storedValue).toBe('true');
  });

  test('should restore dark mode preference on reload', async ({ page }) => {
    // Set dark mode
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Should still be dark
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
  });

  test('should work on student view', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    // Toggle should still be visible
    await expect(page.locator('button[title="Toggle dark mode"]')).toBeVisible();

    // Toggle dark mode
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
  });

  test('should work on instructor view', async ({ page }) => {
    await page.click('button:has-text("I\'m the Instructor")');
    await page.waitForTimeout(500);

    // Toggle should still be visible
    await expect(page.locator('button[title="Toggle dark mode"]')).toBeVisible();

    // Toggle dark mode
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
  });

  test('should persist across mode changes', async ({ page }) => {
    // Set dark mode on home page
    await page.click('button[title="Toggle dark mode"]');
    await page.waitForTimeout(300);

    // Go to student mode
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    // Should still be dark
    const isDarkStudent = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDarkStudent).toBe(true);

    // Go back
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);

    // Go to instructor mode
    await page.click('button:has-text("I\'m the Instructor")');
    await page.waitForTimeout(500);

    // Should still be dark
    const isDarkInstructor = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDarkInstructor).toBe(true);
  });
});

test.describe('Dark Mode - System Preference', () => {
  test('should respect system dark mode preference when no localStorage value', async ({ browser }) => {
    // Create context with dark color scheme
    const context = await browser.newContext({
      colorScheme: 'dark',
      geolocation: { latitude: 21.0285, longitude: 105.8542 },
      permissions: ['geolocation']
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Should follow system preference (dark)
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);

    await context.close();
  });

  test('should respect system light mode preference when no localStorage value', async ({ browser }) => {
    // Create context with light color scheme
    const context = await browser.newContext({
      colorScheme: 'light',
      geolocation: { latitude: 21.0285, longitude: 105.8542 },
      permissions: ['geolocation']
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Should follow system preference (light)
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(false);

    await context.close();
  });
});
