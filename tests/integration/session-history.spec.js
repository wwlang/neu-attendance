// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - Session History Integration Tests (AC8 & AC9)
 *
 * Tests the session history management:
 * - View historical sessions
 * - Click session to view details
 * - Show all sessions toggle
 * - Search/filter sessions
 * - Export CSV from history
 * - Add/Edit/Remove attendance records
 */

const INSTRUCTOR_PIN = '230782';

test.describe('Session History Management (AC8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    // Navigate to instructor mode
    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', INSTRUCTOR_PIN);
    await page.click('button:has-text("Access Instructor Mode")');
    await page.waitForTimeout(500);
  });

  test('should open history view and show sessions', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    // Should show history heading
    await expect(page.locator('text=Session History')).toBeVisible();

    // Should show "Show All Sessions" toggle
    await expect(page.locator('text=Show All Sessions')).toBeVisible();

    // Should show search input
    await expect(page.locator('input[placeholder*="Search by class name"]')).toBeVisible();
  });

  test('should have clickable session items', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    // If there are any sessions, they should be clickable
    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      // Click first session
      await sessionCards.first().click();
      await page.waitForTimeout(500);

      // Should show back button to history
      await expect(page.locator('button:has-text("Back to History")')).toBeVisible();

      // Should show attendance stats (On Time, Late, Total)
      await expect(page.getByText('On Time', { exact: true })).toBeVisible();
      await expect(page.getByText('Late', { exact: true })).toBeVisible();
      await expect(page.getByText('Total', { exact: true })).toBeVisible();
    }
  });

  test('should toggle show all sessions', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    // Find and click the toggle
    const toggle = page.locator('input[type="checkbox"]').first();
    const isChecked = await toggle.isChecked();

    // Toggle it
    await toggle.click();
    await page.waitForTimeout(500);

    // Verify toggle state changed
    const newChecked = await toggle.isChecked();
    expect(newChecked).toBe(!isChecked);
  });

  test('should filter sessions by search input', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search by class name"]');
    await searchInput.fill('NONEXISTENT_CLASS_12345');
    await page.waitForTimeout(500);

    // Should show "No sessions found" if filter doesn't match
    // or filter the results
    const noSessionsMessage = page.locator('text=No sessions found');
    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');

    // Either no results or filtered results
    const noSessionsVisible = await noSessionsMessage.isVisible();
    const cardCount = await sessionCards.count();

    expect(noSessionsVisible || cardCount === 0).toBe(true);
  });

  test('should navigate back from session details', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await page.waitForTimeout(500);

      // Click back button
      await page.click('button:has-text("Back to History")');
      await page.waitForTimeout(500);

      // Should be back on history list
      await expect(page.locator('text=Session History')).toBeVisible();
    }
  });

  test('should show Export CSV button in session detail view', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await page.waitForTimeout(500);

      // Should have Export CSV button
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    }
  });

  test('should show Add Student button in session detail view', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await page.waitForTimeout(500);

      // Should have Add Student button
      await expect(page.locator('button:has-text("+ Add Student")')).toBeVisible();
    }
  });
});

test.describe('Edit Attendance Records (AC9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    // Navigate to instructor mode
    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', INSTRUCTOR_PIN);
    await page.click('button:has-text("Access Instructor Mode")');
    await page.waitForTimeout(500);
  });

  test('should open Add Student modal', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await page.waitForTimeout(500);

      // Click Add Student button
      await page.click('button:has-text("+ Add Student")');
      await page.waitForTimeout(500);

      // Modal should appear
      await expect(page.locator('text=Add Student Manually')).toBeVisible();
      await expect(page.locator('input#addStudentId')).toBeVisible();
      await expect(page.locator('input#addStudentName')).toBeVisible();
      await expect(page.locator('input#addStudentEmail')).toBeVisible();
    }
  });

  test('should close Add Student modal with cancel', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await page.waitForTimeout(500);

      await page.click('button:has-text("+ Add Student")');
      await page.waitForTimeout(500);

      // Click cancel
      await page.click('button:has-text("Cancel")');
      await page.waitForTimeout(500);

      // Modal should be gone
      await expect(page.locator('text=Add Student Manually')).not.toBeVisible();
    }
  });

  test('should show attendance list with action buttons if records exist', async ({ page }) => {
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);

    const sessionCards = page.locator('.border.rounded-lg.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await page.waitForTimeout(1000);

      // Check for table headers if attendance exists
      const attendanceTable = page.locator('table');
      const tableExists = await attendanceTable.isVisible().catch(() => false);

      if (tableExists) {
        // Should have action columns
        await expect(page.locator('th:has-text("Actions")')).toBeVisible();

        // Should have Edit, Note, and Remove buttons
        const editButtons = page.locator('button:has-text("Edit")');
        const editCount = await editButtons.count();

        if (editCount > 0) {
          await expect(editButtons.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Full Session Lifecycle with History', () => {
  test('should create session, end it, and view in history', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    // Navigate to instructor mode
    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', INSTRUCTOR_PIN);
    await page.click('button:has-text("Access Instructor Mode")');
    await page.waitForTimeout(500);

    // Create unique class name with timestamp
    const className = `History Test ${Date.now()}`;
    await page.fill('input#className', className);
    await page.click('button:has-text("Start Session")');
    await page.waitForTimeout(3000);

    // Verify session started
    await expect(page.locator('.code-display').first()).toBeVisible();

    // End session
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.click('button:has-text("End Session")');
    await page.waitForTimeout(2000);

    // Go to history
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(2000); // Wait for Firebase to sync

    // Should see our session in history (may need to wait for data load)
    await expect(page.locator(`text=${className}`)).toBeVisible({ timeout: 10000 });

    // Click on the session
    await page.locator(`text=${className}`).click();
    await page.waitForTimeout(500);

    // Should see session details
    await expect(page.locator(`h2:has-text("${className}")`)).toBeVisible();
    await expect(page.getByText('On Time', { exact: true })).toBeVisible();
    await expect(page.getByText('Late', { exact: true })).toBeVisible();
    await expect(page.getByText('Total', { exact: true })).toBeVisible();

    // Should show "No attendance records" since we didn't add any
    await expect(page.locator('text=No attendance records')).toBeVisible();
  });

  test('should add manual student to historical session', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });

    // Navigate to instructor mode
    await page.click('button:has-text("I\'m the Instructor")');
    await page.fill('input#instructorPin', INSTRUCTOR_PIN);
    await page.click('button:has-text("Access Instructor Mode")');
    await page.waitForTimeout(500);

    // Create session
    const className = `Manual Entry Test ${Date.now()}`;
    await page.fill('input#className', className);
    await page.click('button:has-text("Start Session")');
    await page.waitForTimeout(3000);

    // End session
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.click('button:has-text("End Session")');
    await page.waitForTimeout(2000);

    // Go to history and click on session
    await page.click('button:has-text("View History")');
    await page.waitForTimeout(1000);
    await page.locator(`text=${className}`).click();
    await page.waitForTimeout(500);

    // Add manual student
    await page.click('button:has-text("+ Add Student")');
    await page.waitForTimeout(500);

    // Fill form
    await page.fill('input#addStudentId', '99999999');
    await page.fill('input#addStudentName', 'Test Manual Student');
    await page.fill('input#addStudentEmail', 'manual@test.edu.vn');

    // Submit - button text is "Add Student" in modal
    await page.click('div.fixed button:has-text("Add Student")');
    await page.waitForTimeout(1000);

    // Verify student was added
    await expect(page.locator('text=Test Manual Student')).toBeVisible();
    await expect(page.locator('text=99999999')).toBeVisible();

    // Verify "Manual" badge is shown (specific to the badge span)
    await expect(page.locator('span:has-text("Manual")')).toBeVisible();
  });
});
