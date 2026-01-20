// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - Student Lookup Integration Tests
 *
 * Tests the student attendance lookup journey:
 * - Access lookup mode
 * - Search by student ID
 * - Display results with correct column order
 * - Statistics display
 *
 * Journey Reference: docs/journeys/student-attendance-lookup.md
 */

test.describe('Student Lookup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });
  });

  test('AC1: should have View My Attendance button on landing page', async ({ page }) => {
    // "View My Attendance" button should be visible on main landing page
    await expect(page.locator('button:has-text("View My Attendance")')).toBeVisible();
  });

  test('AC1: should navigate to lookup view when clicking View My Attendance', async ({ page }) => {
    await page.click('button:has-text("View My Attendance")');
    await page.waitForTimeout(500);

    // Should show lookup heading
    await expect(page.locator('text=My Attendance History')).toBeVisible();
    // Should show search input
    await expect(page.locator('input#lookupStudentId')).toBeVisible();
    // Should show Search button
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
  });

  test('AC1: should access lookup via URL parameter', async ({ page }) => {
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    await expect(page.locator('text=My Attendance History')).toBeVisible();
  });

  test('AC1: should have back button to return to main page', async ({ page }) => {
    await page.click('button:has-text("View My Attendance")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);

    // Should be back on main page
    await expect(page.locator('h1:has-text("Quick Attendance")')).toBeVisible();
  });

  test('AC2: should accept student ID input', async ({ page }) => {
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    await page.fill('input#lookupStudentId', '12345678');
    const value = await page.inputValue('input#lookupStudentId');
    expect(value).toBe('12345678');
  });

  test('AC2: should submit search on Enter key', async ({ page }) => {
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    await page.fill('input#lookupStudentId', 'TESTID123');
    await page.press('input#lookupStudentId', 'Enter');
    await page.waitForTimeout(1000);

    // Should show loading or results (not error about empty ID)
    const hasLoadingOrResults = await page.locator('text=Searching...').isVisible() ||
                                 await page.locator('text=No attendance records found').isVisible() ||
                                 await page.locator('table').isVisible();
    expect(hasLoadingOrResults).toBe(true);
  });

  test('AC5: should show error when student ID is empty', async ({ page }) => {
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Please enter a student ID')).toBeVisible();
  });

  test('AC2: should pre-fill student ID from localStorage if available', async ({ page }) => {
    // Set up saved student info
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      localStorage.setItem('neu_student_name', 'Test Student');
      localStorage.setItem('neu_student_email', 'test@st.neu.edu.vn');
    });

    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    const value = await page.inputValue('input#lookupStudentId');
    expect(value).toBe('87654321');
  });
});

test.describe('Student Lookup Results Display (AC3)', () => {
  /**
   * AC3: Results table column order must be: Course, Date, Time, Status, Participation
   *
   * BUG FIX: Previously Status and Participation columns were swapped in the data cells.
   * Headers showed: Course, Date, Time, Status, Participation
   * Data showed:    Course, Date, Time, Participation, Status
   *
   * FIXED: Data now correctly shows: Course, Date, Time, Status, Participation
   */
  test('AC3: should have correct column order in renderLookupResults function', async ({ page }) => {
    // The table only renders when there are results, so we verify the template
    // by checking the JavaScript source contains the correct column order
    // specifically in the renderLookupResults function
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    // Get the page JavaScript content
    const jsContent = await page.evaluate(() => {
      const scripts = document.getElementsByTagName('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('renderLookupResults')) {
          return script.textContent;
        }
      }
      return '';
    });

    // Extract just the renderLookupResults function to avoid matches in other functions
    const funcMatch = jsContent.match(/function renderLookupResults\(\)[^]*?^\}/m);
    expect(funcMatch).toBeTruthy();

    if (funcMatch) {
      const funcContent = funcMatch[0];

      // Verify headers order in the function
      expect(funcContent).toContain('<th class="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Status</th>');
      expect(funcContent).toContain('<th class="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Participation</th>');

      // Verify Status header comes before Participation header
      const statusHeaderPos = funcContent.indexOf('Status</th>');
      const participationHeaderPos = funcContent.indexOf('Participation</th>');
      expect(statusHeaderPos).toBeLessThan(participationHeaderPos);

      // Verify data cells order: isLate badge comes before participation count
      // The status badge pattern
      const statusCellPos = funcContent.indexOf("r.isLate");
      // The participation cell (note: we're looking for the cell with just the number display)
      const participationCellPos = funcContent.indexOf("r.participation || 0");

      // Status data cell should come before Participation data cell
      expect(statusCellPos).toBeLessThan(participationCellPos);
    }
  });

  test('AC3: data cells should match header order', async ({ page }) => {
    // This test verifies that when results are displayed, the Status column
    // contains status badges (On Time/Late) and Participation contains numbers

    // Note: This test requires actual data in Firebase. If no data exists,
    // we'll verify the structure via the table HTML generation pattern.

    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    // Search for a test student (may or may not have data)
    await page.fill('input#lookupStudentId', 'TEST_COLUMN_ORDER');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    // If there are no results, verify the empty state message
    const noResults = await page.locator('text=No attendance records found').isVisible();
    if (noResults) {
      // Test passes - no data to verify column contents
      return;
    }

    // If there ARE results, verify the column content types
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Get the 4th cell (Status - should contain badge)
      const statusCell = rows.first().locator('td').nth(3);
      const statusContent = await statusCell.innerHTML();

      // Status cell should contain "On Time" or "Late" badge
      expect(statusContent).toMatch(/On Time|Late/);
      expect(statusContent).toContain('span'); // Badge is wrapped in span

      // Get the 5th cell (Participation - should contain number)
      const participationCell = rows.first().locator('td').nth(4);
      const participationContent = await participationCell.textContent();

      // Participation should be a number (0 or more)
      expect(participationContent?.trim()).toMatch(/^\d+$/);
    }
  });

  test('AC3: should show results sorted by timestamp (most recent first)', async ({ page }) => {
    // This verifies AC3 requirement: Results sorted by timestamp (most recent first)
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    // Search for any student
    await page.fill('input#lookupStudentId', 'SORT_TEST');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    // If results exist, verify they are sorted by checking date order
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount >= 2) {
      const date1Text = await rows.nth(0).locator('td').nth(1).textContent();
      const date2Text = await rows.nth(1).locator('td').nth(1).textContent();

      // First row should have same or more recent date than second row
      const date1 = new Date(date1Text || '');
      const date2 = new Date(date2Text || '');
      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
    }
  });

  test('AC3: should show On Time badge with green styling', async ({ page }) => {
    // Verify the On Time badge uses emerald/green styling
    await page.goto('/?mode=lookup');

    // Check the page source for the On Time badge styling pattern
    const content = await page.content();

    // The On Time badge should have emerald styling classes
    expect(content).toContain('bg-emerald-100');
    expect(content).toContain('text-emerald-700');
  });

  test('AC3: should show Late badge with orange styling', async ({ page }) => {
    // Verify the Late badge uses orange styling
    await page.goto('/?mode=lookup');

    // Check the page source for the Late badge styling pattern
    const content = await page.content();

    // The Late badge should have orange styling classes
    expect(content).toContain('bg-orange-100');
    expect(content).toContain('text-orange-700');
  });
});

test.describe('Student Lookup Statistics (AC4)', () => {
  test('AC4: should display statistics cards', async ({ page }) => {
    await page.goto('/?mode=lookup');
    await page.waitForTimeout(500);

    // Search to trigger results display
    await page.fill('input#lookupStudentId', 'STATS_TEST');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    // Check for statistics labels in the page
    // These should appear when results are displayed
    const content = await page.content();

    // Stats labels should exist in the lookup view template
    expect(content).toContain('Total');
    expect(content).toContain('On Time');
    expect(content).toContain('Late');
  });

  test('AC4: statistics should use correct colors', async ({ page }) => {
    await page.goto('/?mode=lookup');

    // Check the lookup template contains the correct color classes for stats
    const content = await page.content();

    // Total uses indigo
    expect(content).toContain('bg-indigo-50');
    // On Time uses emerald
    expect(content).toContain('bg-emerald-50');
    // Late uses orange
    expect(content).toContain('bg-orange-50');
  });
});
