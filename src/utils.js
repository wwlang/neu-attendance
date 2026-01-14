/**
 * NEU Attendance - Utility Functions
 *
 * Pure functions extracted from index.html for testing.
 * These functions are used both in the main app and in unit tests.
 */

/**
 * LocalStorage keys for student info persistence
 */
const STUDENT_INFO_KEYS = {
  STUDENT_ID: 'neu_student_id',
  STUDENT_NAME: 'neu_student_name',
  STUDENT_EMAIL: 'neu_student_email'
};

/**
 * Generates a random 6-character alphanumeric code.
 * Uses only uppercase letters (excluding O, I) and numbers (excluding 0, 1) for readability.
 *
 * @returns {string} A 6-character code like "A3B7K9"
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generates a device fingerprint based on browser characteristics.
 * This is a simple hash-based approach for basic device identification.
 *
 * @returns {Promise<string>} A device ID like "DEV-1A2B3C4D"
 */
async function generateDeviceId() {
  const components = [
    typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    typeof navigator !== 'undefined' ? navigator.language : 'en',
    typeof screen !== 'undefined' ? screen.width + 'x' + screen.height : '1920x1080',
    typeof screen !== 'undefined' ? screen.colorDepth : 24,
    new Date().getTimezoneOffset(),
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'unknown' : 'unknown',
    typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
  ];
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'DEV-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Calculates the distance between two geographic points using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Formats a number of seconds into a "M:SS" time string.
 *
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time like "2:05" or "0:30"
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * @param {string} text - The text to escape
 * @returns {string} HTML-safe text
 */
function escapeHtml(text) {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for non-browser environments
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(text).replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Checks if a check-in timestamp is considered "late" based on session start time.
 *
 * @param {string} checkInTimestamp - ISO timestamp of check-in
 * @param {string} sessionStartTimestamp - ISO timestamp of session start
 * @param {number} thresholdMinutes - Minutes after which check-in is considered late
 * @returns {boolean} True if the check-in is late
 */
function isLateCheckIn(checkInTimestamp, sessionStartTimestamp, thresholdMinutes) {
  const checkInTime = new Date(checkInTimestamp).getTime();
  const sessionStart = new Date(sessionStartTimestamp).getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return (checkInTime - sessionStart) > thresholdMs;
}

/**
 * Validates an email address using a simple regex pattern.
 *
 * @param {string} email - The email to validate
 * @returns {boolean} True if email appears valid
 */
function isValidEmail(email) {
  return email && email.includes('@');
}

/**
 * Validates an attendance code (6 characters, alphanumeric).
 *
 * @param {string} code - The code to validate
 * @returns {boolean} True if code is valid format
 */
function isValidCode(code) {
  return code && code.length === 6 && /^[A-Z0-9]+$/.test(code.toUpperCase());
}

/**
 * Extracts URL parameters from a search string.
 *
 * @param {string} searchString - The URL search string (e.g., "?mode=student&code=ABC123")
 * @returns {Object} Object with mode and code properties
 */
function getUrlParams(searchString) {
  const params = new URLSearchParams(searchString || '');
  return {
    mode: params.get('mode'),
    code: params.get('code')
  };
}

/**
 * Gets the base URL without query parameters or hash.
 *
 * @param {string} fullUrl - The full URL
 * @returns {string} The base URL
 */
function getBaseUrl(fullUrl) {
  return fullUrl.split('?')[0].split('#')[0];
}

/**
 * Saves student info to localStorage for form pre-population on return visits.
 *
 * @param {Object} info - Student information
 * @param {string} info.studentId - Student ID number
 * @param {string} info.studentName - Student full name
 * @param {string} info.studentEmail - Student email address
 * @returns {boolean} True if save was successful
 */
function saveStudentInfo(info) {
  try {
    localStorage.setItem(STUDENT_INFO_KEYS.STUDENT_ID, info.studentId);
    localStorage.setItem(STUDENT_INFO_KEYS.STUDENT_NAME, info.studentName);
    localStorage.setItem(STUDENT_INFO_KEYS.STUDENT_EMAIL, info.studentEmail);
    return true;
  } catch (e) {
    console.warn('Could not save student info to localStorage:', e);
    return false;
  }
}

/**
 * Loads saved student info from localStorage.
 *
 * @returns {Object|null} Student info object or null if not found/incomplete
 */
function loadStudentInfo() {
  try {
    const studentId = localStorage.getItem(STUDENT_INFO_KEYS.STUDENT_ID);
    const studentName = localStorage.getItem(STUDENT_INFO_KEYS.STUDENT_NAME);
    const studentEmail = localStorage.getItem(STUDENT_INFO_KEYS.STUDENT_EMAIL);

    // All fields must exist and be non-empty
    if (!studentId || !studentName || !studentEmail) {
      return null;
    }

    return {
      studentId,
      studentName,
      studentEmail
    };
  } catch (e) {
    console.warn('Could not load student info from localStorage:', e);
    return null;
  }
}

/**
 * Clears saved student info from localStorage.
 *
 * @returns {boolean} True if clear was successful
 */
function clearStudentInfo() {
  try {
    localStorage.removeItem(STUDENT_INFO_KEYS.STUDENT_ID);
    localStorage.removeItem(STUDENT_INFO_KEYS.STUDENT_NAME);
    localStorage.removeItem(STUDENT_INFO_KEYS.STUDENT_EMAIL);
    return true;
  } catch (e) {
    console.warn('Could not clear student info from localStorage:', e);
    return false;
  }
}

// Export for Node.js/Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateCode,
    generateDeviceId,
    getDistance,
    formatTime,
    escapeHtml,
    isLateCheckIn,
    isValidEmail,
    isValidCode,
    getUrlParams,
    getBaseUrl,
    saveStudentInfo,
    loadStudentInfo,
    clearStudentInfo,
    STUDENT_INFO_KEYS
  };
}
