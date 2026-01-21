// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForPageLoad, gotoWithEmulator } = require('../utils/test-helpers');

/**
 * NEU Attendance - Offline Indicator Integration Tests
 *
 * Tests offline/online status handling:
 * - Offline banner element exists
 * - Banner visibility based on connection status
 */

test.describe('Offline Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithEmulator(page, '/');
    await waitForPageLoad(page);
  });

  test('should have offline banner element in DOM', async ({ page }) => {
    const banner = page.locator('#offlineBanner');
    await expect(banner).toBeAttached();
  });

  test('should have offline banner hidden when online', async ({ page }) => {
    const banner = page.locator('#offlineBanner');
    const isHidden = await banner.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
  });

  test('should show offline banner when going offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Trigger a check by navigating or interacting
    // Note: The offline detection happens via navigator.onLine and Firebase connection
    await page.evaluate(() => {
      // Manually dispatch offline event
      window.dispatchEvent(new Event('offline'));
    });

    // Wait for banner to appear
    await expect(async () => {
      const isHidden = await page.locator('#offlineBanner').evaluate(el => el.classList.contains('hidden'));
      expect(isHidden).toBe(false);
    }).toPass({ timeout: 5000 });

    // Restore online status
    await context.setOffline(false);
  });

  test('should hide offline banner when coming back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Wait for banner to show
    await expect(async () => {
      const isHidden = await page.locator('#offlineBanner').evaluate(el => el.classList.contains('hidden'));
      expect(isHidden).toBe(false);
    }).toPass({ timeout: 5000 });

    // Come back online
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Wait for banner to hide
    await expect(async () => {
      const isHidden = await page.locator('#offlineBanner').evaluate(el => el.classList.contains('hidden'));
      expect(isHidden).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('offline banner should have correct message', async ({ page }) => {
    const banner = page.locator('#offlineBanner');
    const text = await banner.textContent();
    // Banner text can be "offline" or "Reconnecting" depending on state
    expect(text.toLowerCase()).toMatch(/offline|reconnect/i);
  });
});
