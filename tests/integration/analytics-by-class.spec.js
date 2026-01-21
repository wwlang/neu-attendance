// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoWithEmulator, startInstructorSession } = require('../utils/test-helpers');

/**
 * NEU Attendance - Analytics Split by Class Integration Tests (P4-04)
 *
 * Tests the analytics dashboard class filtering feature:
 * - Class selector dropdown with all unique class names (AC1)
 * - Default selection is a class (not empty) (AC2)
 * - Summary cards update per class (AC3)
 * - Charts filter by class (AC4, AC5)
 * - Student rankings per class (AC6)
 * - At-risk students per class (AC7)
 * - "All Classes" aggregated view (AC8)
 * - Class selection persistence (AC9)
 * - CSV export with class filter (AC10)
 * - Dark mode support (AC11)
 */

test.describe('Analytics Class Selector (AC1, AC2)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set geolocation for session creation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('should show class selector dropdown in analytics view', async ({ page }) => {
    // Navigate as instructor
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Click Analytics button
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Should have a class selector dropdown
    await expect(page.locator('select#analyticsClassFilter')).toBeVisible();
  });

  test('should have All Classes option in dropdown', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    const dropdown = page.locator('select#analyticsClassFilter');
    await expect(dropdown).toBeVisible();

    // Verify "All Classes" option exists
    const allClassesOption = dropdown.locator('option[value="all"]');
    await expect(allClassesOption).toHaveText('All Classes');
  });

  test('should list created class in dropdown after session creation', async ({ page, context }) => {
    const className = `Test Class ${Date.now()}`;

    // Create a session
    await startInstructorSession(page, className);

    // End the session
    page.once('dialog', d => d.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // Go to Analytics
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Check that our class is in the dropdown
    const dropdown = page.locator('select#analyticsClassFilter');
    await expect(dropdown).toBeVisible();

    const options = await dropdown.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('Test Class'))).toBe(true);
  });

  test('should have a class selected by default (not empty)', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    const dropdown = page.locator('select#analyticsClassFilter');
    const selectedValue = await dropdown.inputValue();

    // Should have some selection (not empty string)
    expect(selectedValue).toBeTruthy();
  });
});

test.describe('Analytics Class Filter Functionality (AC3-AC8)', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });
  });

  test('should change summary cards when selecting different class', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    const dropdown = page.locator('select#analyticsClassFilter');
    const options = await dropdown.locator('option').all();

    if (options.length > 1) {
      // Get initial total sessions value
      const sessionsCard = page.locator('text=Total Sessions').locator('..');
      const initialSessions = await sessionsCard.locator('p').first().textContent();

      // Select "All Classes"
      await dropdown.selectOption('all');
      await page.waitForLoadState('networkidle');

      // Get new total sessions value
      const newSessions = await sessionsCard.locator('p').first().textContent();

      // All Classes should show total sessions (may be same or more)
      expect(parseInt(newSessions || '0', 10)).toBeGreaterThanOrEqual(parseInt(initialSessions || '0', 10));
    }
  });

  test('should show student rankings based on selected class', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Should show Student Attendance Ranking section
    await expect(page.locator('text=Student Attendance Ranking')).toBeVisible();
  });

  test('should show at-risk students section or success message', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Should show either "At-Risk Students" or "All Students Above 70%"
    const atRisk = page.locator('text=At-Risk Students');
    const allGood = page.locator('text=All Students Above 70%');

    await expect(atRisk.or(allGood).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display attendance trend chart', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Should show chart heading and canvas
    await expect(page.locator('text=Attendance Trend')).toBeVisible();
    await expect(page.locator('#trendChart')).toBeVisible();
  });

  test('should display session comparison chart', async ({ page }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Should show chart heading and canvas
    await expect(page.locator('text=Session Comparison')).toBeVisible();
    await expect(page.locator('#sessionChart')).toBeVisible();
  });
});

test.describe('Analytics Class Selection Persistence (AC9)', () => {
  test('should persist class selection when applying date filter', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    const dropdown = page.locator('select#analyticsClassFilter');
    const initialSelection = await dropdown.inputValue();

    // Apply a date filter
    const today = new Date().toISOString().split('T')[0];
    await page.fill('#analyticsStartDate', today);
    await page.fill('#analyticsEndDate', today);
    await page.click('button:has-text("Apply")');

    // Wait for filter to apply
    await page.waitForLoadState('networkidle');

    // Class selection should still be the same
    const selectedValue = await dropdown.inputValue();
    expect(selectedValue).toBe(initialSelection);
  });

  test('should persist class selection when sorting table', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    const dropdown = page.locator('select#analyticsClassFilter');
    const initialSelection = await dropdown.inputValue();

    // Click sort header (Name column) if table has data
    const nameHeader = page.locator('th:has-text("Name")');
    if (await nameHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nameHeader.click();
      await page.waitForLoadState('networkidle');

      // Class selection should still be the same
      const selectedValue = await dropdown.inputValue();
      expect(selectedValue).toBe(initialSelection);
    }
  });
});

test.describe('Analytics CSV Export With Class (AC10)', () => {
  test('should export CSV with class context in filename', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Get current class selection
    const dropdown = page.locator('select#analyticsClassFilter');
    const selectedClass = await dropdown.inputValue();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export
    await page.click('button:has-text("Export Report")');

    // Verify download
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Filename should include analytics_report and .csv
    expect(filename).toContain('analytics_report');
    expect(filename).toContain('.csv');

    // If not "all", should include sanitized class name
    if (selectedClass !== 'all') {
      // Class name is sanitized to underscores
      const sanitizedPart = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
      expect(filename).toContain(sanitizedPart.substring(0, 10)); // Check first part
    }
  });

  test('should export all classes when All Classes is selected', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Select All Classes
    const dropdown = page.locator('select#analyticsClassFilter');
    await dropdown.selectOption('all');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export
    await page.click('button:has-text("Export Report")');

    // Verify download
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // When "all" is selected, filename should not have a class name slug
    expect(filename).toMatch(/^analytics_report_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

test.describe('Analytics Dark Mode Support (AC11)', () => {
  test('should render class selector correctly in dark mode', async ({ page, context }) => {
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    // Enable dark mode
    const darkModeToggle = page.locator('button[title*="dark"], button[aria-label*="dark"], button:has-text("Dark Mode"), button:has-text("Light Mode")').first();
    if (await darkModeToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      await darkModeToggle.click();
    }

    // Click Analytics button
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Verify class selector is visible and functional
    const dropdown = page.locator('select#analyticsClassFilter');
    await expect(dropdown).toBeVisible();

    // Should be able to change selection
    const options = await dropdown.locator('option').all();
    if (options.length > 1) {
      await dropdown.selectOption('all');
      const selectedValue = await dropdown.inputValue();
      expect(selectedValue).toBe('all');
    }
  });
});

test.describe('Analytics with Session Data', () => {
  test('should create session and verify class appears in analytics', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    const className = `Analytics Test ${Date.now()}`;

    // Create session
    await startInstructorSession(page, className);

    // End session
    page.once('dialog', d => d.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // Go to Analytics
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Verify our class is in the dropdown
    const dropdown = page.locator('select#analyticsClassFilter');
    const options = await dropdown.locator('option').allTextContents();

    expect(options.some(opt => opt.includes('Analytics Test'))).toBe(true);

    // Select our class
    await dropdown.selectOption(className);

    // Wait for data to update
    await page.waitForLoadState('networkidle');

    // Should show 1 session for this class
    const sessionsCard = page.locator('text=Total Sessions').locator('..');
    const sessionsText = await sessionsCard.locator('p').first().textContent();
    expect(sessionsText).toBe('1');
  });

  test('should filter to show only selected class data', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

    // Create first session
    const className1 = `Filter Test A ${Date.now()}`;
    await startInstructorSession(page, className1);
    page.once('dialog', d => d.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // Create second session with different class
    await gotoWithEmulator(page, '/?testAuth=instructor');
    await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 10000 });

    const classSelect = page.locator('select#classSelect');
    if (await classSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await classSelect.selectOption('__new__');
    }

    const className2 = `Filter Test B ${Date.now()}`;
    await page.fill('input#className', className2);
    await page.click('button:has-text("Start Session")');
    await expect(page.locator('.code-display').first()).toBeVisible({ timeout: 15000 });

    page.once('dialog', d => d.accept());
    await page.click('button:has-text("End Session")');
    await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

    // Go to Analytics
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Both classes should be in the dropdown
    const dropdown = page.locator('select#analyticsClassFilter');
    const options = await dropdown.locator('option').allTextContents();

    expect(options.some(opt => opt.includes('Filter Test A'))).toBe(true);
    expect(options.some(opt => opt.includes('Filter Test B'))).toBe(true);

    // Select class A
    await dropdown.selectOption(className1);
    await page.waitForLoadState('networkidle');

    // Should show 1 session for class A
    await expect(async () => {
      const sessionsCard = page.locator('text=Total Sessions').locator('..');
      const sessionsText = await sessionsCard.locator('p').first().textContent();
      expect(sessionsText).toBe('1');
    }).toPass({ timeout: 5000 });

    // Select All Classes
    await dropdown.selectOption('all');
    await page.waitForLoadState('networkidle');

    // Should show at least 2 sessions total
    await expect(async () => {
      const sessionsCard = page.locator('text=Total Sessions').locator('..');
      const sessionsText = await sessionsCard.locator('p').first().textContent();
      expect(parseInt(sessionsText || '0', 10)).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 5000 });
  });
});
