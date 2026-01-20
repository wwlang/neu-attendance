// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForPageLoad } = require('../utils/test-helpers');

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
    await waitForPageLoad(page);
  });

  test('should show dark mode toggle button', async ({ page }) => {
    await expect(page.locator('button[title="Toggle dark mode"]')).toBeVisible();
  });

  test('should toggle to dark mode when clicked', async ({ page }) => {
    // Initially should be light mode (or system preference)
    await page.click('button[title="Toggle dark mode"]');

    // Wait for class to be applied
    await expect(async () => {
      const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains('dark')
      );
      expect(isDark).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('should toggle back to light mode on second click', async ({ page }) => {
    // Click twice to go dark then light
    await page.click('button[title="Toggle dark mode"]');
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });

    await page.click('button[title="Toggle dark mode"]');
    await expect(page.locator('html:not(.dark)')).toBeAttached({ timeout: 5000 });
  });

  test('should persist dark mode preference in localStorage', async ({ page }) => {
    await page.click('button[title="Toggle dark mode"]');

    // Wait for localStorage to be updated
    await expect(async () => {
      const storedValue = await page.evaluate(() =>
        localStorage.getItem('neu_attendance_dark_mode')
      );
      expect(storedValue).toBe('true');
    }).toPass({ timeout: 5000 });
  });

  test('should restore dark mode preference on reload', async ({ page }) => {
    // Set dark mode
    await page.click('button[title="Toggle dark mode"]');
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });

    // Reload page
    await page.reload();
    await waitForPageLoad(page);

    // Should still be dark
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });
  });

  test('should work on student view', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await expect(page.locator('text=Mark Attendance')).toBeVisible({ timeout: 5000 });

    // Toggle should still be visible
    await expect(page.locator('button[title="Toggle dark mode"]')).toBeVisible();

    // Toggle dark mode
    await page.click('button[title="Toggle dark mode"]');
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });
  });

  test('should work on instructor view', async ({ page }) => {
    await page.click('button:has-text("I\'m the Instructor")');
    await expect(page.locator('text=Instructor Access')).toBeVisible({ timeout: 5000 });

    // Toggle should still be visible
    await expect(page.locator('button[title="Toggle dark mode"]')).toBeVisible();

    // Toggle dark mode
    await page.click('button[title="Toggle dark mode"]');
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });
  });

  test('should persist across mode changes', async ({ page }) => {
    // Set dark mode on home page
    await page.click('button[title="Toggle dark mode"]');
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });

    // Go to student mode
    await page.click('button:has-text("I\'m a Student")');
    await expect(page.locator('text=Mark Attendance')).toBeVisible({ timeout: 5000 });

    // Should still be dark
    await expect(page.locator('html.dark')).toBeAttached();

    // Go back
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Quick Attendance')).toBeVisible({ timeout: 5000 });

    // Go to instructor mode
    await page.click('button:has-text("I\'m the Instructor")');
    await expect(page.locator('text=Instructor Access')).toBeVisible({ timeout: 5000 });

    // Should still be dark
    await expect(page.locator('html.dark')).toBeAttached();
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
    await waitForPageLoad(page);

    // Should follow system preference (dark)
    await expect(page.locator('html.dark')).toBeAttached({ timeout: 5000 });

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
    await waitForPageLoad(page);

    // Should follow system preference (light)
    await expect(page.locator('html:not(.dark)')).toBeAttached({ timeout: 5000 });

    await context.close();
  });
});
