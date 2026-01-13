// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - Offline Indicator Integration Tests
 *
 * Tests offline/online status handling:
 * - Offline banner element exists
 * - Banner visibility based on connection status
 */

test.describe('Offline Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
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

    await page.waitForTimeout(500);

    // The banner should become visible
    const banner = page.locator('#offlineBanner');
    const isHidden = await banner.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(false);

    // Restore online status
    await context.setOffline(false);
  });

  test('should hide offline banner when coming back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(300);

    // Come back online
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(500);

    const banner = page.locator('#offlineBanner');
    const isHidden = await banner.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
  });

  test('offline banner should have correct message', async ({ page }) => {
    const banner = page.locator('#offlineBanner');
    const text = await banner.textContent();
    expect(text).toContain('offline');
  });
});
