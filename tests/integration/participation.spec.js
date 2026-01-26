// @ts-check
/**
 * Participation Button Tests - Active Session View
 *
 * Tests the participation increment/decrement functionality in the active session view.
 *
 * BUG FIX VERIFIED:
 * - Before fix: Clicking +/- buttons updated Firebase but didn't update UI immediately
 * - After fix: UI updates immediately when clicking +/- buttons (local state update + render())
 */

const { test, expect } = require('@playwright/test');
const { startInstructorSession, gotoWithEmulator } = require('../utils/test-helpers');

// Run tests sequentially to avoid code rotation issues
test.describe.configure({ mode: 'serial' });

test.describe('Participation Counter in Active Session', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('should increment participation and update UI immediately', async ({ page }) => {
    const className = `Participation Test ${Date.now()}`;

    // Start instructor session
    await startInstructorSession(page, className);
    await expect(page.locator('div.code-display').first()).toBeVisible({ timeout: 15000 });

    // Get session ID from Firebase's activeSession path
    const sessionId = await page.evaluate(async () => {
      const snapshot = await db.ref('activeSession').once('value');
      return snapshot.val();
    });
    expect(sessionId).toBeTruthy();

    // Add attendance directly via Firebase (bypassing student form which has issues in tests)
    await page.evaluate(async (sessionId) => {
      const timestamp = Date.now();
      const attendanceRef = db.ref(`attendance/${sessionId}`).push();
      await attendanceRef.set({
        studentId: '11111111',
        studentName: 'Test Student',
        email: 'test@edu.vn',
        deviceId: 'TEST-DEVICE',
        location: { lat: 21.0285, lng: 105.8542 },
        distance: 5,
        timestamp: timestamp,
        participation: 0,
        isLate: false
      });
    }, sessionId);

    // Wait for student to appear on instructor page
    await expect(page.locator('td:has-text("11111111")').first()).toBeVisible({ timeout: 15000 });

    // Get participation count - should start at 0
    const participationCount = page.locator('[data-testid="participation-count"]').first();
    await expect(participationCount).toHaveText('0', { timeout: 5000 });

    // Click increment button
    await page.locator('button[data-action="increment-participation"]').first().click();

    // Should update immediately to 1
    await expect(participationCount).toHaveText('1', { timeout: 3000 });

    // Click again
    await page.locator('button[data-action="increment-participation"]').first().click();

    // Should update immediately to 2
    await expect(participationCount).toHaveText('2', { timeout: 3000 });
  });

  test('should decrement participation and update UI immediately', async ({ page }) => {
    const className = `Decrement Test ${Date.now()}`;

    await startInstructorSession(page, className);
    const sessionId = await page.evaluate(async () => {
      const snapshot = await db.ref('activeSession').once('value');
      return snapshot.val();
    });

    // Add attendance directly
    await page.evaluate(async (sessionId) => {
      const attendanceRef = db.ref(`attendance/${sessionId}`).push();
      await attendanceRef.set({
        studentId: '22222222',
        studentName: 'Test Student 2',
        email: 'test2@edu.vn',
        deviceId: 'TEST-DEVICE-2',
        location: { lat: 21.0285, lng: 105.8542 },
        distance: 5,
        timestamp: Date.now(),
        participation: 0,
        isLate: false
      });
    }, sessionId);

    await expect(page.locator('td:has-text("22222222")').first()).toBeVisible({ timeout: 15000 });

    const participationCount = page.locator('[data-testid="participation-count"]').first();

    // Increment to 2 first
    await page.locator('button[data-action="increment-participation"]').first().click();
    await expect(participationCount).toHaveText('1', { timeout: 3000 });
    await page.locator('button[data-action="increment-participation"]').first().click();
    await expect(participationCount).toHaveText('2', { timeout: 3000 });

    // Now decrement
    await page.locator('button[data-action="decrement-participation"]').first().click();
    await expect(participationCount).toHaveText('1', { timeout: 3000 });
  });

  test('should not decrement below zero', async ({ page }) => {
    const className = `Floor Test ${Date.now()}`;

    await startInstructorSession(page, className);
    const sessionId = await page.evaluate(async () => {
      const snapshot = await db.ref('activeSession').once('value');
      return snapshot.val();
    });

    // Add attendance directly
    await page.evaluate(async (sessionId) => {
      const attendanceRef = db.ref(`attendance/${sessionId}`).push();
      await attendanceRef.set({
        studentId: '33333333',
        studentName: 'Test Student 3',
        email: 'test3@edu.vn',
        deviceId: 'TEST-DEVICE-3',
        location: { lat: 21.0285, lng: 105.8542 },
        distance: 5,
        timestamp: Date.now(),
        participation: 0,
        isLate: false
      });
    }, sessionId);

    await expect(page.locator('td:has-text("33333333")').first()).toBeVisible({ timeout: 15000 });

    const participationCount = page.locator('[data-testid="participation-count"]').first();
    await expect(participationCount).toHaveText('0', { timeout: 5000 });

    // Try to decrement at 0
    await page.locator('button[data-action="decrement-participation"]').first().click();
    await page.waitForTimeout(500);

    // Should still be 0
    await expect(participationCount).toHaveText('0');
  });
});
