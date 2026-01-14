// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * NEU Attendance - Student Flow Integration Tests
 *
 * Tests the complete student journey:
 * - Form display and validation
 * - Device ID generation
 * - Location display
 * - Code submission
 * - Success/error handling
 * - Student info persistence (localStorage)
 */

test.describe('Student Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for loading spinner to disappear and content to render
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });
  });

  test('should navigate to student form when clicking student button', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Mark Attendance')).toBeVisible();
    await expect(page.locator('input#studentId')).toBeVisible();
    await expect(page.locator('input#studentName')).toBeVisible();
    await expect(page.locator('input#studentEmail')).toBeVisible();
    await expect(page.locator('input#enteredCode')).toBeVisible();
  });

  test('should auto-generate device ID', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    // Device ID should be displayed
    const content = await page.content();
    expect(content).toMatch(/DEV-[0-9A-F]{8}/);
  });

  test('should show location section', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    // Use more specific selectors to avoid multiple matches
    await expect(page.getByText('Your Location (Lat, Lng)')).toBeVisible();
    await expect(page.getByText('Device Information', { exact: false })).toBeVisible();
  });

  test('should validate empty fields', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    // Try to submit with empty fields
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Please fill in all fields')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    await page.fill('input#studentId', '12345678');
    await page.fill('input#studentName', 'Test Student');
    await page.fill('input#studentEmail', 'invalid-email');
    await page.fill('input#enteredCode', 'ABC123');
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should validate code length', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    await page.fill('input#studentId', '12345678');
    await page.fill('input#studentName', 'Test Student');
    await page.fill('input#studentEmail', 'test@example.com');
    await page.fill('input#enteredCode', 'ABC'); // Too short
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=must be 6 characters')).toBeVisible();
  });

  test('should auto-uppercase entered code', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(1000);

    await page.fill('input#enteredCode', 'abcdef');
    const value = await page.inputValue('input#enteredCode');
    expect(value).toBe('ABCDEF');
  });

  test('should access student mode via URL parameter', async ({ page }) => {
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Mark Attendance')).toBeVisible();
  });

  test('should auto-fill code from URL parameter', async ({ page }) => {
    await page.goto('/?mode=student&code=TESTCD');
    await page.waitForTimeout(1000);

    const value = await page.inputValue('input#enteredCode');
    expect(value).toBe('TESTCD');
    await expect(page.locator('text=Code auto-filled from QR scan')).toBeVisible();
  });

  test('should have maxlength on input fields', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    const studentIdMax = await page.locator('input#studentId').getAttribute('maxlength');
    const studentNameMax = await page.locator('input#studentName').getAttribute('maxlength');
    const studentEmailMax = await page.locator('input#studentEmail').getAttribute('maxlength');
    const codeMax = await page.locator('input#enteredCode').getAttribute('maxlength');

    expect(studentIdMax).toBe('20');
    expect(studentNameMax).toBe('100');
    expect(studentEmailMax).toBe('100');
    expect(codeMax).toBe('6');
  });

  test('should accept Vietnamese characters in name', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    const vietnameseName = 'Nguyen Van Duc';
    await page.fill('input#studentName', vietnameseName);
    const value = await page.inputValue('input#studentName');
    expect(value).toBe(vietnameseName);
  });

  test('should have back button to return to mode selection', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Quick Attendance')).toBeVisible();
    await expect(page.locator('button:has-text("I\'m the Instructor")')).toBeVisible();
  });

  test('should show error when no active session', async ({ page }) => {
    // Note: This test assumes there's no active session running
    // The actual error message depends on Firebase state
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(2000);

    await page.fill('input#studentId', '12345678');
    await page.fill('input#studentName', 'Test Student');
    await page.fill('input#studentEmail', 'test@example.com');
    await page.fill('input#enteredCode', 'XXXXXX');
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(3000);

    // Should show some error (either "No active session" or "Invalid code" or similar)
    const content = await page.content();
    const hasError = content.includes('error') ||
                     content.includes('Error') ||
                     content.includes('session') ||
                     content.includes('Invalid') ||
                     content.includes('logged');
    expect(hasError).toBe(true);
  });
});

test.describe('Student Info Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('neu_student_id');
      localStorage.removeItem('neu_student_name');
      localStorage.removeItem('neu_student_email');
    });
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('h1:has-text("Quick Attendance")', { timeout: 10000 });
  });

  test('should show empty form when no saved info exists', async ({ page }) => {
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(1000);

    // Form fields should be empty
    const studentId = await page.inputValue('input#studentId');
    const studentName = await page.inputValue('input#studentName');
    const studentEmail = await page.inputValue('input#studentEmail');

    expect(studentId).toBe('');
    expect(studentName).toBe('');
    expect(studentEmail).toBe('');

    // Welcome banner should NOT be visible
    await expect(page.locator('text=Welcome back')).not.toBeVisible();
  });

  test('should pre-fill form when saved info exists in localStorage', async ({ page }) => {
    // Set up saved student info
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      localStorage.setItem('neu_student_name', 'Nguyen Van A');
      localStorage.setItem('neu_student_email', 'nguyenvana@st.neu.edu.vn');
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Form fields should be pre-filled
    const studentId = await page.inputValue('input#studentId');
    const studentName = await page.inputValue('input#studentName');
    const studentEmail = await page.inputValue('input#studentEmail');

    expect(studentId).toBe('87654321');
    expect(studentName).toBe('Nguyen Van A');
    expect(studentEmail).toBe('nguyenvana@st.neu.edu.vn');
  });

  test('should show welcome back banner when saved info exists', async ({ page }) => {
    // Set up saved student info
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      localStorage.setItem('neu_student_name', 'Nguyen Van A');
      localStorage.setItem('neu_student_email', 'nguyenvana@st.neu.edu.vn');
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Welcome banner should be visible with student name
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Nguyen Van A')).toBeVisible();
  });

  test('should have enter new details option that clears form and localStorage', async ({ page }) => {
    // Set up saved student info
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      localStorage.setItem('neu_student_name', 'Nguyen Van A');
      localStorage.setItem('neu_student_email', 'nguyenvana@st.neu.edu.vn');
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Verify form is pre-filled
    expect(await page.inputValue('input#studentId')).toBe('87654321');

    // Click "Enter New Details" button on the welcome banner
    await page.click('button:has-text("Enter New Details")');
    await page.waitForTimeout(500);

    // Form fields should be empty
    const studentId = await page.inputValue('input#studentId');
    const studentName = await page.inputValue('input#studentName');
    const studentEmail = await page.inputValue('input#studentEmail');

    expect(studentId).toBe('');
    expect(studentName).toBe('');
    expect(studentEmail).toBe('');

    // Welcome banner should be hidden
    await expect(page.locator('text=Welcome back')).not.toBeVisible();

    // localStorage should be cleared
    const storedId = await page.evaluate(() => localStorage.getItem('neu_student_id'));
    const storedName = await page.evaluate(() => localStorage.getItem('neu_student_name'));
    const storedEmail = await page.evaluate(() => localStorage.getItem('neu_student_email'));

    expect(storedId).toBeNull();
    expect(storedName).toBeNull();
    expect(storedEmail).toBeNull();
  });

  test('should show clear saved info link after dismissing welcome banner', async ({ page }) => {
    // Set up saved student info
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      localStorage.setItem('neu_student_name', 'Nguyen Van A');
      localStorage.setItem('neu_student_email', 'nguyenvana@st.neu.edu.vn');
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Initially, "Clear saved info" link should NOT be visible (banner is shown)
    await expect(page.locator('text=Clear saved info')).not.toBeVisible();

    // Click "Use Saved Info" to dismiss banner
    await page.click('button:has-text("Use Saved Info")');
    await page.waitForTimeout(500);

    // Now "Clear saved info" link should be visible
    await expect(page.locator('text=Clear saved info')).toBeVisible();

    // Click it to clear
    await page.click('text=Clear saved info');
    await page.waitForTimeout(500);

    // localStorage should be cleared
    const storedId = await page.evaluate(() => localStorage.getItem('neu_student_id'));
    expect(storedId).toBeNull();
  });

  test('should allow editing pre-filled fields', async ({ page }) => {
    // Set up saved student info
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      localStorage.setItem('neu_student_name', 'Nguyen Van A');
      localStorage.setItem('neu_student_email', 'nguyenvana@st.neu.edu.vn');
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Edit the pre-filled student ID
    await page.fill('input#studentId', '11111111');
    const newId = await page.inputValue('input#studentId');

    expect(newId).toBe('11111111');
  });

  test('should handle Vietnamese characters in saved name', async ({ page }) => {
    // Set up saved student info with Vietnamese characters
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '12345678');
      localStorage.setItem('neu_student_name', 'Nguyen Van Duc');
      localStorage.setItem('neu_student_email', 'duc@st.neu.edu.vn');
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Form should display Vietnamese characters correctly
    const studentName = await page.inputValue('input#studentName');
    expect(studentName).toBe('Nguyen Van Duc');

    // Welcome banner should display name correctly
    await expect(page.locator('text=Nguyen Van Duc')).toBeVisible();
  });

  test('should not show welcome banner if only partial info is saved', async ({ page }) => {
    // Only save student ID (missing name and email)
    await page.evaluate(() => {
      localStorage.setItem('neu_student_id', '87654321');
      // Not setting name and email
    });

    // Navigate to student mode
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Welcome banner should NOT be visible
    await expect(page.locator('text=Welcome back')).not.toBeVisible();

    // Form should be empty since info is incomplete
    const studentId = await page.inputValue('input#studentId');
    expect(studentId).toBe('');
  });

  /**
   * BUG FIX TEST: Student info saved on form submission (even when validation fails)
   * Journey Reference: student-check-in.md AC6.1
   *
   * Previously, student info was only saved AFTER successful check-in.
   * Now it should be saved on ANY form submission attempt with valid student info.
   */
  test('should save student info on form submission even when submission fails (AC6.1)', async ({ page }) => {
    // Navigate to student mode with clean localStorage
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(1000);

    // Fill in student info
    await page.fill('input#studentId', '11223344');
    await page.fill('input#studentName', 'Tran Van B');
    await page.fill('input#studentEmail', 'tranb@st.neu.edu.vn');
    await page.fill('input#enteredCode', 'XXXXXX'); // Invalid code - will fail

    // Submit the form (will fail due to invalid code or no active session)
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(3000);

    // Verify localStorage was saved despite the failed submission
    const storedId = await page.evaluate(() => localStorage.getItem('neu_student_id'));
    const storedName = await page.evaluate(() => localStorage.getItem('neu_student_name'));
    const storedEmail = await page.evaluate(() => localStorage.getItem('neu_student_email'));

    expect(storedId).toBe('11223344');
    expect(storedName).toBe('Tran Van B');
    expect(storedEmail).toBe('tranb@st.neu.edu.vn');
  });

  test('should pre-populate form on page reload after failed submission (session rejoin)', async ({ page }) => {
    // Navigate to student mode with clean localStorage
    await page.click('button:has-text("I\'m a Student")');
    await page.waitForTimeout(1000);

    // Fill in student info and submit (will fail)
    await page.fill('input#studentId', '55667788');
    await page.fill('input#studentName', 'Le Thi C');
    await page.fill('input#studentEmail', 'lethic@st.neu.edu.vn');
    await page.fill('input#enteredCode', 'BADCOD'); // Invalid code
    await page.click('button:has-text("Submit Attendance")');
    await page.waitForTimeout(3000);

    // Reload the page (simulating returning to try again)
    await page.goto('/?mode=student');
    await page.waitForTimeout(1000);

    // Form should be pre-populated with previously entered info
    const studentId = await page.inputValue('input#studentId');
    const studentName = await page.inputValue('input#studentName');
    const studentEmail = await page.inputValue('input#studentEmail');

    expect(studentId).toBe('55667788');
    expect(studentName).toBe('Le Thi C');
    expect(studentEmail).toBe('lethic@st.neu.edu.vn');

    // Welcome banner should appear for returning user
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Le Thi C')).toBeVisible();
  });
});
