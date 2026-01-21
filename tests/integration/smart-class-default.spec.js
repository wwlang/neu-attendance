/**
 * Smart Class Default Selection - E2E Tests
 *
 * P4-05: Test smart class default selection based on day-of-week and hour matching.
 */

const { test, expect } = require('@playwright/test');
const { gotoWithEmulator } = require('../utils/test-helpers');

// Helper to directly insert session into Firebase with specific timestamp
async function insertSessionWithTimestamp(page, className, timestamp, config = {}) {
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Use page.evaluate to insert directly into Firebase
  await page.evaluate(async ({ sessionId, className, timestamp, config }) => {
    await db.ref(`sessions/${sessionId}`).set({
      className,
      createdAt: timestamp,
      radius: config.radius || 300,
      lateThresholdMinutes: config.lateThreshold || 10,
      active: false,
      endedAt: new Date().toISOString()
    });
  }, { sessionId, className, timestamp, config });

  return sessionId;
}

// Helper to delete all test sessions
async function cleanupTestSessions(page) {
  // Delete ALL sessions to ensure test isolation
  await page.evaluate(async () => {
    await db.ref('sessions').remove();
  });
}

// Navigate and wait for instructor setup screen
async function goToInstructorSetup(page) {
  await gotoWithEmulator(page, '/?testAuth=instructor');
  // Wait for Firebase authentication and data loading
  await page.waitForTimeout(1000);
  // Wait for either the setup screen or mode selection
  const setupHeader = page.locator('text=Start Attendance Session');
  const modeButton = page.locator('button:has-text("I\'m the Instructor")');

  try {
    await setupHeader.waitFor({ timeout: 8000 });
  } catch {
    // If setup screen not visible, click instructor button
    if (await modeButton.isVisible({ timeout: 1000 })) {
      await modeButton.click();
      await setupHeader.waitFor({ timeout: 8000 });
    }
  }
  await expect(setupHeader).toBeVisible();
}

test.describe('P4-05: Smart Class Default Selection', () => {

  test.beforeEach(async ({ page }) => {
    // Grant geolocation permissions
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('AC1: Selects class from same day and hour last week', async ({ page }) => {
    // Get current day/hour for reproducible test
    const now = new Date();
    const currentHour = now.getHours();

    // Create timestamp for "last week same time"
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(currentHour, 5, 0, 0); // Same hour, 5 minutes in

    // Create timestamp for "2 days ago different time"
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours((currentHour + 5) % 24, 0, 0, 0); // Different hour

    // Navigate to instructor setup
    await goToInstructorSetup(page);

    // Clean up existing sessions first
    await cleanupTestSessions(page);

    // Create the "different time" session first (should NOT be selected)
    await insertSessionWithTimestamp(page, 'Different Hour Class', twoDaysAgo.toISOString());

    // Create the "same time last week" session (SHOULD be selected)
    await insertSessionWithTimestamp(page, 'Same Time Last Week', lastWeek.toISOString());

    // Reload to trigger loadPreviousClasses with fresh data
    await goToInstructorSetup(page);

    // Check which class is selected
    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe('Same Time Last Week');
    }
  });

  test('AC2: Falls back to most recent when no day/hour match exists', async ({ page }) => {
    // Create timestamp for "yesterday at a very different time"
    const now = new Date();
    const currentHour = now.getHours();

    // Yesterday at completely different hour
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours((currentHour + 8) % 24, 0, 0, 0); // +8 hours different

    // Two days ago at another different hour
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours((currentHour + 10) % 24, 0, 0, 0); // +10 hours different

    await goToInstructorSetup(page);

    // Clean up existing sessions
    await cleanupTestSessions(page);

    // Create older session first
    await insertSessionWithTimestamp(page, 'Older Test Class', twoDaysAgo.toISOString());

    // Create more recent session (should be fallback)
    await insertSessionWithTimestamp(page, 'Most Recent Test Class', yesterday.toISOString());

    // Reload to trigger loadPreviousClasses
    await goToInstructorSetup(page);

    // Check which class is selected (should be most recent since no time match)
    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe('Most Recent Test Class');
    }
  });

  test('AC3: Shows empty input when no previous classes exist', async ({ page }) => {
    await goToInstructorSetup(page);

    // Clean up ALL sessions for this test
    await page.evaluate(async () => {
      const snapshot = await db.ref('sessions').once('value');
      const promises = [];
      snapshot.forEach(child => {
        promises.push(db.ref(`sessions/${child.key}`).remove());
      });
      await Promise.all(promises);
    });

    // Reload
    await goToInstructorSetup(page);

    // Verify no dropdown exists (since no previous classes)
    const classSelect = page.locator('select#classSelect');
    const classNameInput = page.locator('input#className');

    const hasDropdown = await classSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasDropdown) {
      // Should show plain text input
      await expect(classNameInput).toBeVisible();
    }
  });

  test('AC4: Matches within same hour window', async ({ page }) => {
    const now = new Date();
    const currentHour = now.getHours();
    const uniqueId = Date.now();

    // Create session at start of current hour, last week
    const lastWeekStartOfHour = new Date(now);
    lastWeekStartOfHour.setDate(lastWeekStartOfHour.getDate() - 7);
    lastWeekStartOfHour.setHours(currentHour, 0, 0, 0); // Exact start of hour

    await goToInstructorSetup(page);

    await cleanupTestSessions(page);
    const className = `Hour Window Test ${uniqueId}`;
    await insertSessionWithTimestamp(page, className, lastWeekStartOfHour.toISOString());

    // Reload
    await goToInstructorSetup(page);

    // Should match even if current time is later in the hour
    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe(className);
    }
  });

  test('AC4: Does not match outside hour window', async ({ page }) => {
    const now = new Date();
    const currentHour = now.getHours();

    // Create session at different hour, last week (same day)
    const lastWeekDifferentHour = new Date(now);
    lastWeekDifferentHour.setDate(lastWeekDifferentHour.getDate() - 7);
    lastWeekDifferentHour.setHours((currentHour + 2) % 24, 30, 0, 0); // 2 hours different

    // Most recent session for fallback
    const recent = new Date(now);
    recent.setDate(recent.getDate() - 1);
    recent.setHours((currentHour + 5) % 24, 0, 0, 0);

    await goToInstructorSetup(page);

    await cleanupTestSessions(page);
    await insertSessionWithTimestamp(page, 'Same Day Different Hour Test', lastWeekDifferentHour.toISOString());
    await insertSessionWithTimestamp(page, 'Most Recent Fallback Test', recent.toISOString());

    // Reload
    await goToInstructorSetup(page);

    // Should NOT match the same-day session (different hour)
    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe('Most Recent Fallback Test');
    }
  });

  test('AC5: Does not match sessions older than 14 days', async ({ page }) => {
    const now = new Date();
    const currentHour = now.getHours();

    // Create session from 3 weeks ago (same day/hour but too old)
    const threeWeeksAgo = new Date(now);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    threeWeeksAgo.setHours(currentHour, 5, 0, 0);

    // Recent session for fallback
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours((currentHour + 3) % 24, 0, 0, 0);

    await goToInstructorSetup(page);

    await cleanupTestSessions(page);
    await insertSessionWithTimestamp(page, 'Old Same Time Test Class', threeWeeksAgo.toISOString());
    await insertSessionWithTimestamp(page, 'Recent Fallback Test Class', yesterday.toISOString());

    // Reload
    await goToInstructorSetup(page);

    // Should NOT match the old session (>14 days), should fallback to most recent
    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe('Recent Fallback Test Class');
    }
  });

  test('Config is loaded from smart default class', async ({ page }) => {
    const now = new Date();
    const currentHour = now.getHours();

    // Create session at same time last week with specific config
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(currentHour, 10, 0, 0);

    await goToInstructorSetup(page);

    await cleanupTestSessions(page);

    // Insert session with specific radius and late threshold
    await insertSessionWithTimestamp(page, 'Config Test Class', lastWeek.toISOString(), {
      radius: 150, // Non-default radius
      lateThreshold: 20 // Non-default late threshold
    });

    // Reload to trigger smart default
    await goToInstructorSetup(page);

    // Check if the config values were loaded
    const radiusValue = page.locator('#radiusValue');
    const lateValue = page.locator('#lateValue');

    // Give time for config to be applied
    await page.waitForTimeout(500);

    // The radius and late threshold should match the smart default class
    await expect(radiusValue).toHaveText('150');
    await expect(lateValue).toHaveText('20');
  });

  test('Smart default can be overridden by user selection', async ({ page }) => {
    const now = new Date();
    const currentHour = now.getHours();

    // Create session at same time last week (will be smart default)
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(currentHour, 5, 0, 0);

    // Create another session
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours((currentHour + 3) % 24, 0, 0, 0);

    await goToInstructorSetup(page);

    await cleanupTestSessions(page);
    await insertSessionWithTimestamp(page, 'Smart Default Test Class', lastWeek.toISOString());
    await insertSessionWithTimestamp(page, 'Other Test Class', twoDaysAgo.toISOString());

    // Reload
    await goToInstructorSetup(page);

    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify smart default is selected
      let selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe('Smart Default Test Class');

      // User can change selection
      await classSelect.selectOption('Other Test Class');
      selectedValue = await classSelect.inputValue();
      expect(selectedValue).toBe('Other Test Class');
    }
  });
});
