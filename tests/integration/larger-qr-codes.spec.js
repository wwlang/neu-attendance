// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoWithEmulator, startInstructorSession } = require('../utils/test-helpers');

/**
 * P2-14: Larger QR Codes for Easier Scanning
 *
 * Tests that QR codes are displayed at a larger size and can be
 * expanded to full-screen for classroom projection.
 */

test.describe('P2-14: Larger QR Codes for Easier Scanning', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('AC1: QR code has minimum size of 250x250 pixels', async ({ page }) => {
    await startInstructorSession(page, 'QR Test Class');

    // Wait for QR code to be generated
    const qrContainer = page.locator('#qr-student-checkin');
    await expect(qrContainer).toBeVisible({ timeout: 10000 });

    // Check the size of the QR code container/canvas
    const size = await qrContainer.evaluate(el => {
      const canvas = el.querySelector('canvas');
      if (canvas) {
        return { width: canvas.width, height: canvas.height };
      }
      const img = el.querySelector('img');
      if (img) {
        return { width: img.naturalWidth, height: img.naturalHeight };
      }
      return { width: el.offsetWidth, height: el.offsetHeight };
    });

    // QR code should be at least 250x250 pixels
    expect(size.width).toBeGreaterThanOrEqual(250);
    expect(size.height).toBeGreaterThanOrEqual(250);
  });

  test('AC2: Fullscreen toggle button visible', async ({ page }) => {
    await startInstructorSession(page, 'QR Fullscreen Test');

    // Wait for session to start
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 10000 });

    // Should have a fullscreen/enlarge button
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")');
    await expect(enlargeButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('AC3: Clicking enlarge button opens fullscreen QR modal', async ({ page }) => {
    await startInstructorSession(page, 'QR Modal Test');

    // Wait for session to start
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 10000 });

    // Click the enlarge button
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")').first();
    await enlargeButton.click();

    // Modal should appear with fullscreen QR code
    await expect(page.locator('#qr-fullscreen-modal, [data-modal="qr-fullscreen"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC4: Fullscreen modal shows QR code clearly visible', async ({ page }) => {
    await startInstructorSession(page, 'QR Visible Test');

    // Wait for session to start
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 10000 });

    // Click the enlarge button
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")').first();
    await enlargeButton.click();

    // Modal QR should be visible
    const modalQr = page.locator('#qr-fullscreen-modal canvas, [data-modal="qr-fullscreen"] canvas, #qr-fullscreen canvas');
    await expect(modalQr.first()).toBeVisible({ timeout: 5000 });
  });

  test('AC5: Fullscreen modal can be closed', async ({ page }) => {
    await startInstructorSession(page, 'QR Close Test');

    // Wait for session to start
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 10000 });

    // Click the enlarge button
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")').first();
    await enlargeButton.click();

    // Modal should appear
    const modal = page.locator('#qr-fullscreen-modal, [data-modal="qr-fullscreen"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click close button or outside modal
    const closeButton = page.locator('#qr-fullscreen-modal button:has-text("Close"), button[data-action="close-qr-modal"]').first();
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
    } else {
      // Click the backdrop
      await page.click('#qr-fullscreen-modal');
    }

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('AC6: Fullscreen modal shows current code prominently', async ({ page }) => {
    await startInstructorSession(page, 'QR Code Display Test');

    // Wait for session to start and get the code
    const codeDisplay = page.locator('div.code-display').first();
    await expect(codeDisplay).toBeVisible({ timeout: 10000 });
    const code = await codeDisplay.textContent();

    // Click the enlarge button
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")').first();
    await enlargeButton.click();

    // Modal should show the same code
    const modalCode = page.locator('#qr-fullscreen-modal .code-display, #qr-fullscreen-modal [data-code]');
    await expect(modalCode.first()).toContainText(code || '');
  });

  test('AC8: QR code works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await startInstructorSession(page, 'QR Mobile Test');

    // Wait for QR code to be generated
    const qrContainer = page.locator('#qr-student-checkin');
    await expect(qrContainer).toBeVisible({ timeout: 10000 });

    // QR should still be visible and reasonably sized on mobile
    const size = await qrContainer.evaluate(el => {
      return { width: el.offsetWidth, height: el.offsetHeight };
    });

    expect(size.width).toBeGreaterThan(100);
    expect(size.height).toBeGreaterThan(100);
  });

  // P2-14.1: Dark mode QR code test
  test('AC4.2: QR code container has white/light background in dark mode for scan reliability', async ({ page }) => {
    // Enable dark mode via localStorage before navigating
    await gotoWithEmulator(page, '/');
    await page.evaluate(() => localStorage.setItem('neu_attendance_dark_mode', 'true'));

    // Start instructor session in dark mode
    await startInstructorSession(page, 'QR Dark Mode Test');

    // Wait for QR code to be generated
    const qrContainer = page.locator('#qr-student-checkin');
    await expect(qrContainer).toBeVisible({ timeout: 10000 });

    // Verify body has dark mode class
    const hasDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(hasDarkMode).toBe(true);

    // QR code container should have a white/light background for scan reliability
    const bgColor = await qrContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });

    // Background should be white or very light (rgb values close to 255)
    // Parse the rgb values
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      // All channels should be >= 240 (white or near-white)
      expect(r).toBeGreaterThanOrEqual(240);
      expect(g).toBeGreaterThanOrEqual(240);
      expect(b).toBeGreaterThanOrEqual(240);
    }

    // Also verify the fullscreen modal maintains white background for QR
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")').first();
    await enlargeButton.click();

    const fullscreenQrContainer = page.locator('#qr-fullscreen');
    await expect(fullscreenQrContainer).toBeVisible({ timeout: 5000 });

    const fullscreenBgColor = await fullscreenQrContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });

    // Fullscreen QR container should also have white background
    const fullscreenRgbMatch = fullscreenBgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (fullscreenRgbMatch) {
      const r = parseInt(fullscreenRgbMatch[1]);
      const g = parseInt(fullscreenRgbMatch[2]);
      const b = parseInt(fullscreenRgbMatch[3]);
      expect(r).toBeGreaterThanOrEqual(240);
      expect(g).toBeGreaterThanOrEqual(240);
      expect(b).toBeGreaterThanOrEqual(240);
    }
  });

  // P2-14 AC5.1: Fullscreen QR has sufficient padding from viewport edges
  test('AC5.1: Fullscreen QR modal has sufficient padding from viewport edges', async ({ page }) => {
    await startInstructorSession(page, 'QR Padding Test');

    // Wait for session to start
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 10000 });

    // Click the enlarge button
    const enlargeButton = page.locator('button:has-text("Enlarge QR"), button[data-action="enlarge-qr"], button:has-text("Fullscreen")').first();
    await enlargeButton.click();

    // Modal should appear
    const modal = page.locator('#qr-fullscreen-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Get the inner content container's bounding box and viewport dimensions
    const contentContainer = page.locator('#qr-fullscreen-modal > div');
    await expect(contentContainer).toBeVisible({ timeout: 3000 });

    const viewportSize = page.viewportSize();
    const contentBox = await contentContainer.boundingBox();

    // Content should have at least 5% padding from edges (per journey spec)
    // 5% of viewport width/height
    const minHorizontalPadding = (viewportSize?.width || 1280) * 0.05;
    const minVerticalPadding = (viewportSize?.height || 720) * 0.05;

    expect(contentBox).not.toBeNull();
    if (contentBox && viewportSize) {
      // Left padding
      expect(contentBox.x).toBeGreaterThanOrEqual(minHorizontalPadding - 1);
      // Right padding (content right edge from viewport right edge)
      const rightPadding = viewportSize.width - (contentBox.x + contentBox.width);
      expect(rightPadding).toBeGreaterThanOrEqual(minHorizontalPadding - 1);
      // Top padding
      expect(contentBox.y).toBeGreaterThanOrEqual(minVerticalPadding - 1);
      // Bottom padding
      const bottomPadding = viewportSize.height - (contentBox.y + contentBox.height);
      expect(bottomPadding).toBeGreaterThanOrEqual(minVerticalPadding - 1);
    }
  });
});
