// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitForPageLoad,
  gotoWithEmulator,
  startInstructorSession,
  checkInStudent,
} = require('../utils/test-helpers');

/**
 * NEU Attendance - Student Location Map Tests
 *
 * Tests the Leaflet map shown to students during check-in that displays:
 * - Student's GPS location marker
 * - Class/instructor location marker
 * - Radius circle showing allowed check-in area
 *
 * Journey Reference: docs/journeys/student-check-in.md (AC9: Location Map)
 */

test.describe('Student Location Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('should show location map after GPS acquisition on student form', async ({ page }) => {
    // Start an instructor session first
    await startInstructorSession(page, 'Map Test Class');

    // Get attendance code
    const code = await page.locator('div.code-display').first().textContent();

    // Open student page
    const studentPage = await page.context().newPage();
    await studentPage.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await studentPage.context().grantPermissions(['geolocation']);

    // Clear localStorage and navigate
    await gotoWithEmulator(studentPage, '/');
    await studentPage.evaluate(() => localStorage.clear());
    await gotoWithEmulator(studentPage, `/?mode=student&code=${code}&testAuth=student`);

    // Wait for student form
    await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 10000 });

    // Wait for location to be acquired (map appears after GPS)
    await expect(studentPage.locator('#studentLocationMap')).toBeVisible({ timeout: 10000 });

    // Verify it's a Leaflet map (the div becomes a leaflet-container)
    await expect(studentPage.locator('#studentLocationMap.leaflet-container')).toBeVisible({ timeout: 5000 });

    await studentPage.close();

    // Clean up: end session
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
  });

  test('should display both student and class markers on location map', async ({ page }) => {
    await startInstructorSession(page, 'Marker Test Class');

    const code = await page.locator('div.code-display').first().textContent();

    const studentPage = await page.context().newPage();
    await studentPage.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await studentPage.context().grantPermissions(['geolocation']);

    await gotoWithEmulator(studentPage, '/');
    await studentPage.evaluate(() => localStorage.clear());
    await gotoWithEmulator(studentPage, `/?mode=student&code=${code}&testAuth=student`);

    await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 10000 });

    // Wait for map to fully load with markers (async session fetch)
    await expect(studentPage.locator('#studentLocationMap')).toBeVisible({ timeout: 10000 });

    // Wait for markers to appear (session data is fetched asynchronously)
    await expect(async () => {
      const count = await studentPage.locator('#studentLocationMap .leaflet-marker-icon').count();
      expect(count).toBe(2);
    }).toPass({ timeout: 10000 });

    await studentPage.close();

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
  });

  test('should display radius circle on student location map', async ({ page }) => {
    await startInstructorSession(page, 'Radius Circle Test');

    const code = await page.locator('div.code-display').first().textContent();

    const studentPage = await page.context().newPage();
    await studentPage.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await studentPage.context().grantPermissions(['geolocation']);

    await gotoWithEmulator(studentPage, '/');
    await studentPage.evaluate(() => localStorage.clear());
    await gotoWithEmulator(studentPage, `/?mode=student&code=${code}&testAuth=student`);

    await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 10000 });
    await expect(studentPage.locator('#studentLocationMap')).toBeVisible({ timeout: 10000 });

    // Wait for SVG circle path (Leaflet renders circles as SVG paths, loaded async)
    await expect(studentPage.locator('#studentLocationMap svg path')).toBeVisible({ timeout: 10000 });

    await studentPage.close();

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
  });

  test('should be read-only (no click interaction on student map)', async ({ page }) => {
    await startInstructorSession(page, 'ReadOnly Map Test');

    const code = await page.locator('div.code-display').first().textContent();

    const studentPage = await page.context().newPage();
    await studentPage.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
    await studentPage.context().grantPermissions(['geolocation']);

    await gotoWithEmulator(studentPage, '/');
    await studentPage.evaluate(() => localStorage.clear());
    await gotoWithEmulator(studentPage, `/?mode=student&code=${code}&testAuth=student`);

    await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 10000 });
    await expect(studentPage.locator('#studentLocationMap')).toBeVisible({ timeout: 10000 });

    // Wait for markers to finish loading
    await expect(async () => {
      const count = await studentPage.locator('#studentLocationMap .leaflet-marker-icon').count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Count markers before click
    const markersBefore = await studentPage.locator('#studentLocationMap .leaflet-marker-icon').count();

    // Click on the map - should not add new markers (map is non-interactive)
    await studentPage.locator('#studentLocationMap').click({ position: { x: 50, y: 50 } });
    await studentPage.waitForTimeout(500);

    // Count markers after click - should be same (no new markers from clicking)
    const markersAfter = await studentPage.locator('#studentLocationMap .leaflet-marker-icon').count();
    expect(markersAfter).toBe(markersBefore);

    await studentPage.close();

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');
  });
});
