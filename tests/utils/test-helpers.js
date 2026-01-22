// @ts-check
/**
 * Test Helpers - Deterministic wait utilities for E2E tests
 *
 * These helpers replace arbitrary waitForTimeout() calls with condition-based waits,
 * making tests more reliable and faster.
 */

const { expect } = require('@playwright/test');

/**
 * Navigate to a URL for tests.
 * Emulator mode is auto-detected when running on localhost.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} path - Path to navigate to (e.g., '/', '/?mode=student')
 * @returns {Promise<import('@playwright/test').Response | null>}
 */
async function gotoWithEmulator(page, path = '/') {
  // Parse the path to preserve existing query params
  const url = new URL(path, 'http://localhost:3000');

  // Navigate to the full URL (emulator auto-detected on localhost)
  return page.goto(url.toString());
}

/**
 * Wait for attendance count to reach expected value
 * @param {import('@playwright/test').Page} page
 * @param {number} expectedCount
 * @param {number} timeout - Max wait time in ms (default: 15000)
 */
async function waitForAttendanceCount(page, expectedCount, timeout = 15000) {
  const countLocator = page.locator('[data-testid="attendance-count"], .attendance-count').first();

  await expect(async () => {
    const text = await countLocator.textContent();
    const count = parseInt(text || '0', 10);
    expect(count).toBe(expectedCount);
  }).toPass({ timeout });
}

/**
 * Wait for participation count to update to expected value
 * @param {import('@playwright/test').Page} page
 * @param {string|number} expectedValue
 * @param {number} timeout
 */
async function waitForParticipationUpdate(page, expectedValue, timeout = 10000) {
  const countLocator = page.locator('[data-testid="participation-count"]').first();

  await expect(async () => {
    const text = await countLocator.textContent();
    expect(text).toBe(expectedValue.toString());
  }).toPass({ timeout });
}

/**
 * Wait for participation count in history view
 * @param {import('@playwright/test').Page} page
 * @param {string|number} expectedValue
 * @param {number} timeout
 */
async function waitForHistoryParticipationUpdate(page, expectedValue, timeout = 10000) {
  const countLocator = page.locator('[data-testid="participation-count-history"]').first();

  await expect(async () => {
    const text = await countLocator.textContent();
    expect(text).toBe(expectedValue.toString());
  }).toPass({ timeout });
}

/**
 * Wait for a session to appear in history list
 * @param {import('@playwright/test').Page} page
 * @param {string} sessionName
 * @param {number} timeout
 */
async function waitForSessionInHistory(page, sessionName, timeout = 15000) {
  await expect(page.locator(`text=${sessionName}`)).toBeVisible({ timeout });
}

/**
 * Wait for modal to fully open
 * @param {import('@playwright/test').Page} page
 * @param {string} modalTextOrSelector - Text content or selector to identify the modal
 * @param {number} timeout
 */
async function waitForModal(page, modalTextOrSelector, timeout = 5000) {
  // Wait for modal container
  await expect(page.locator('.fixed.inset-0, [role="dialog"]').first()).toBeVisible({ timeout });

  // Wait for specific modal content
  if (modalTextOrSelector.startsWith('#') || modalTextOrSelector.startsWith('.')) {
    await expect(page.locator(modalTextOrSelector)).toBeVisible({ timeout });
  } else {
    await expect(page.locator(`text=${modalTextOrSelector}`)).toBeVisible({ timeout });
  }
}

/**
 * Wait for modal to close
 * @param {import('@playwright/test').Page} page
 * @param {string} modalText - Text that identifies the modal
 * @param {number} timeout
 */
async function waitForModalClose(page, modalText, timeout = 5000) {
  await expect(page.locator(`text=${modalText}`)).not.toBeVisible({ timeout });
}

/**
 * Start an instructor session with proper waits
 * @param {import('@playwright/test').Page} page
 * @param {string} className
 */
async function startInstructorSession(page, className) {
  // Ensure geolocation is granted before starting session
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 21.0285, longitude: 105.8542 });

  // Navigate with testAuth=instructor for automatic authentication
  await gotoWithEmulator(page, '/?testAuth=instructor');

  // Wait for session setup screen
  // Check for dropdown first (when previous classes exist), then plain input
  const classSelect = page.locator('select#classSelect');

  // Wait for page to be ready - either dropdown or input should exist
  await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 5000 });

  // If dropdown exists, select "New Class" to show the input
  if (await classSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await classSelect.selectOption('__new__');
    // Wait for the new class input container to be visible
    await expect(page.locator('#newClassInput')).toBeVisible({ timeout: 3000 });
  }

  // Wait for input to be visible and fill it (retry for stability)
  await expect(async () => {
    const input = page.locator('input#className');
    await expect(input).toBeVisible();
    await input.fill(className);
  }).toPass({ timeout: 5000 });

  // Wait for button to be ready and click
  const startBtn = page.locator('button:has-text("Start Session")');
  await expect(startBtn).toBeEnabled({ timeout: 5000 });
  await startBtn.click();

  // Wait for session to start - code display appears
  await expect(page.locator('.code-display').first()).toBeVisible({ timeout: 15000 });
}

/**
 * Check in a student with proper waits
 * @param {import('@playwright/test').BrowserContext} context
 * @param {import('@playwright/test').Page} mainPage - Instructor's page
 * @param {string} studentId
 * @param {string} studentName
 * @param {string} studentEmail
 * @param {Object} options
 * @param {number} [options.expectedCount] - Expected attendance count after check-in
 * @param {{latitude: number, longitude: number}} [options.location] - Geolocation
 * @returns {Promise<void>}
 */
async function checkInStudent(context, mainPage, studentId, studentName, studentEmail, options = {}) {
  const { expectedCount, location = { latitude: 21.0285, longitude: 105.8542 } } = options;

  // Get the current code from instructor page
  const codeElement = mainPage.locator('.code-display').first();
  const code = await codeElement.textContent();

  // Open a new page for student check-in
  const studentPage = await context.newPage();

  // Set geolocation
  await studentPage.context().setGeolocation(location);
  await studentPage.context().grantPermissions(['geolocation']);

  // Clear localStorage first to prevent prefill interference, then navigate
  await gotoWithEmulator(studentPage, '/');
  await studentPage.evaluate(() => localStorage.clear());

  // Navigate to student mode with code (always use emulator)
  await gotoWithEmulator(studentPage, `/?mode=student&code=${code}`);

  // Wait for student form to be ready and page to stabilize
  await expect(studentPage.locator('input#studentId')).toBeVisible({ timeout: 10000 });
  await studentPage.waitForLoadState('networkidle');

  // Use Playwright's native fill() method which properly triggers input events
  await studentPage.locator('input#studentId').fill(studentId);
  await studentPage.locator('input#studentName').fill(studentName);
  await studentPage.locator('input#studentEmail').fill(studentEmail);

  // Submit attendance
  await studentPage.click('button:has-text("Submit Attendance")');

  // Wait for submission result - success or error
  // Use OR locator pattern to match any of these success/error indicators
  const successOrError = studentPage.locator('text=Success!').or(
    studentPage.locator('text=error')
  ).or(
    studentPage.locator('text=Error')
  ).or(
    studentPage.locator('text=logged')
  ).or(
    studentPage.locator('text=Attendance Recorded')
  ).or(
    studentPage.locator('text=Already Submitted')
  );
  await expect(successOrError.first()).toBeVisible({ timeout: 15000 });

  await studentPage.close();

  // Wait for instructor page to update via Firebase listener
  // Use condition-based wait instead of arbitrary timeout
  if (expectedCount !== undefined) {
    await waitForAttendanceCount(mainPage, expectedCount, 15000);
  } else {
    // Wait for the student to appear in the attendance list
    await expect(mainPage.locator(`text=${studentId}`)).toBeVisible({ timeout: 15000 });
  }
}

/**
 * End session and navigate to history with proper waits
 * @param {import('@playwright/test').Page} page
 */
async function endSessionAndGoToHistory(page) {
  // Set up dialog handler for confirmation
  page.once('dialog', dialog => dialog.accept());

  // End the session
  await page.click('button:has-text("End Session")');

  // Wait for session to end - View History button appears
  await expect(page.locator('button:has-text("View History")')).toBeVisible({ timeout: 15000 });

  // Go to history
  await page.click('button:has-text("View History")');

  // Wait for session history to load
  await expect(page.locator('text=Session History')).toBeVisible({ timeout: 10000 });

  // Check the "Show All Sessions" checkbox if visible
  const showAllCheckbox = page.locator('input[type="checkbox"]').first();
  if (await showAllCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await showAllCheckbox.check();
    // Wait for list to update after checkbox
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Navigate to instructor mode with test authentication
 * @param {import('@playwright/test').Page} page
 */
async function authenticateAsInstructor(page) {
  // Navigate with testAuth=instructor for automatic authentication
  await gotoWithEmulator(page, '/?testAuth=instructor');
  await expect(page.locator('text=Start Attendance Session')).toBeVisible({ timeout: 5000 });
}

/**
 * Navigate to history view from instructor dashboard
 * @param {import('@playwright/test').Page} page
 */
async function goToHistoryView(page) {
  await page.click('button:has-text("View History")');
  await expect(page.locator('text=Session History')).toBeVisible({ timeout: 10000 });
}

/**
 * Click on first session card in history and wait for details
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>} - true if session was clicked, false if no sessions
 */
async function clickFirstSessionCard(page) {
  const sessionCards = page.locator('.border.rounded-lg.cursor-pointer, .cursor-pointer[onclick*="viewSessionDetails"]');
  const count = await sessionCards.count();

  if (count > 0) {
    await sessionCards.first().click();
    // Wait for session details to load
    await expect(page.locator('button:has-text("Back to History")')).toBeVisible({ timeout: 5000 });
    return true;
  }
  return false;
}

/**
 * Wait for page to be fully loaded after navigation
 * @param {import('@playwright/test').Page} page
 */
async function waitForPageLoad(page) {
  // Wait for loading spinner to disappear
  await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  // Wait for main content
  await expect(page.locator('h1:has-text("Quick Attendance")')).toBeVisible({ timeout: 10000 });
}

/**
 * Increment participation and wait for update
 * @param {import('@playwright/test').Page} page
 * @param {string|number} expectedValue - Expected count after increment
 * @param {boolean} isHistory - Whether in history view (uses different data-testid)
 */
async function incrementParticipation(page, expectedValue, isHistory = false) {
  const buttonSelector = isHistory
    ? 'button[data-action="increment-participation-history"]'
    : 'button[data-action="increment-participation"]';

  await page.click(buttonSelector);

  if (isHistory) {
    await waitForHistoryParticipationUpdate(page, expectedValue);
  } else {
    await waitForParticipationUpdate(page, expectedValue);
  }
}

/**
 * Decrement participation and wait for update
 * @param {import('@playwright/test').Page} page
 * @param {string|number} expectedValue - Expected count after decrement
 * @param {boolean} isHistory - Whether in history view
 */
async function decrementParticipation(page, expectedValue, isHistory = false) {
  const buttonSelector = isHistory
    ? 'button[data-action="decrement-participation-history"]'
    : 'button[data-action="decrement-participation"]';

  await page.click(buttonSelector);

  if (isHistory) {
    await waitForHistoryParticipationUpdate(page, expectedValue);
  } else {
    await waitForParticipationUpdate(page, expectedValue);
  }
}

/**
 * Enable "Show Archived" toggle and wait for update
 * @param {import('@playwright/test').Page} page
 */
async function enableShowArchived(page) {
  const showArchivedLabel = page.locator('label:has(span:has-text("Show Archived"))');
  await showArchivedLabel.click();

  // Wait for checkbox to be checked
  const checkbox = showArchivedLabel.locator('input[type="checkbox"]');
  await expect(checkbox).toBeChecked({ timeout: 5000 });
}

module.exports = {
  gotoWithEmulator,
  waitForAttendanceCount,
  waitForParticipationUpdate,
  waitForHistoryParticipationUpdate,
  waitForSessionInHistory,
  waitForModal,
  waitForModalClose,
  startInstructorSession,
  checkInStudent,
  endSessionAndGoToHistory,
  authenticateAsInstructor,
  goToHistoryView,
  clickFirstSessionCard,
  waitForPageLoad,
  incrementParticipation,
  decrementParticipation,
  enableShowArchived,
};
