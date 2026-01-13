/**
 * NEU Attendance - Unit Tests for Utility Functions
 *
 * Tests core functions extracted from the attendance application.
 * These tests verify:
 * - Code generation (randomness, format)
 * - Device ID generation (format, determinism)
 * - Distance calculation (Haversine formula accuracy)
 * - Time formatting
 * - XSS prevention
 * - Validation logic
 */

const {
  generateCode,
  generateDeviceId,
  getDistance,
  formatTime,
  escapeHtml,
  isLateCheckIn,
  isValidEmail,
  isValidCode,
  getUrlParams,
  getBaseUrl
} = require('../../src/utils');

describe('generateCode', () => {
  test('generates a 6-character code', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  test('uses only valid characters (no O, I, 0, 1)', () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    // Generate many codes to test randomness
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      for (const char of code) {
        expect(validChars).toContain(char);
      }
    }
  });

  test('generates different codes on subsequent calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCode());
    }
    // Should have many unique codes (statistically very unlikely to have duplicates)
    expect(codes.size).toBeGreaterThan(95);
  });

  test('does not contain ambiguous characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      expect(code).not.toMatch(/[OI01]/);
    }
  });
});

describe('generateDeviceId', () => {
  test('returns a string starting with DEV-', async () => {
    const deviceId = await generateDeviceId();
    expect(deviceId).toMatch(/^DEV-/);
  });

  test('has correct format (DEV- followed by 8 hex chars)', async () => {
    const deviceId = await generateDeviceId();
    expect(deviceId).toMatch(/^DEV-[0-9A-F]{8}$/);
  });

  test('returns consistent value for same environment', async () => {
    const id1 = await generateDeviceId();
    const id2 = await generateDeviceId();
    expect(id1).toBe(id2);
  });
});

describe('getDistance (Haversine formula)', () => {
  test('calculates distance between two nearby points', () => {
    // NEU campus area - two points about 100m apart
    const lat1 = 21.0285;
    const lon1 = 105.8542;
    const lat2 = 21.0290;
    const lon2 = 105.8545;

    const distance = getDistance(lat1, lon1, lat2, lon2);

    // Should be roughly 60-70 meters
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(100);
  });

  test('returns 0 for identical points', () => {
    const lat = 21.0285;
    const lon = 105.8542;

    const distance = getDistance(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });

  test('calculates known distance between cities', () => {
    // Hanoi to Ho Chi Minh City (~1,150 km)
    const hanoi = { lat: 21.0285, lon: 105.8542 };
    const hcmc = { lat: 10.8231, lon: 106.6297 };

    const distance = getDistance(hanoi.lat, hanoi.lon, hcmc.lat, hcmc.lon);

    // Should be approximately 1,150 km (1,150,000 m) +/- 50 km
    expect(distance).toBeGreaterThan(1100000);
    expect(distance).toBeLessThan(1200000);
  });

  test('is symmetric (A to B equals B to A)', () => {
    const lat1 = 21.0285;
    const lon1 = 105.8542;
    const lat2 = 21.0290;
    const lon2 = 105.8545;

    const distanceAB = getDistance(lat1, lon1, lat2, lon2);
    const distanceBA = getDistance(lat2, lon2, lat1, lon1);

    expect(distanceAB).toBeCloseTo(distanceBA, 10);
  });

  test('handles negative coordinates (Southern/Western hemispheres)', () => {
    // Sydney, Australia (-33.8688, 151.2093) to Auckland, NZ (-36.8485, 174.7633)
    const distance = getDistance(-33.8688, 151.2093, -36.8485, 174.7633);

    // Should be approximately 2,160 km
    expect(distance).toBeGreaterThan(2100000);
    expect(distance).toBeLessThan(2200000);
  });

  test('handles crossing the equator', () => {
    // Point north of equator to point south of equator
    const distance = getDistance(10.0, 100.0, -10.0, 100.0);

    // Should be approximately 2,224 km (20 degrees of latitude)
    expect(distance).toBeGreaterThan(2200000);
    expect(distance).toBeLessThan(2250000);
  });
});

describe('formatTime', () => {
  test('formats seconds correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(120)).toBe('2:00');
  });

  test('pads seconds with leading zero', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(125)).toBe('2:05');
  });

  test('handles large values', () => {
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(3600)).toBe('60:00');
  });

  test('handles edge case of 59 seconds', () => {
    expect(formatTime(59)).toBe('0:59');
  });
});

describe('escapeHtml', () => {
  test('escapes < and > characters', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  test('escapes ampersand', () => {
    const result = escapeHtml('Tom & Jerry');
    expect(result).toContain('&amp;');
  });

  test('handles plain text without escaping', () => {
    const result = escapeHtml('Hello World');
    expect(result).toBe('Hello World');
  });

  test('handles empty string', () => {
    const result = escapeHtml('');
    expect(result).toBe('');
  });

  test('handles Vietnamese characters', () => {
    const result = escapeHtml('Nguyen Van Duc');
    expect(result).toBe('Nguyen Van Duc');
  });

  test('prevents script tag injection', () => {
    const malicious = '<script>alert(1)</script>';
    const result = escapeHtml(malicious);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('prevents img tag injection', () => {
    const malicious = '<img src="x" onerror="alert(1)">';
    const result = escapeHtml(malicious);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  // Note: In browser DOM (textContent/innerHTML), quotes don't need escaping
  // in text nodes. The escapeHtml function matches browser behavior.
  test('preserves quotes (browser textContent behavior)', () => {
    const result = escapeHtml('He said "hello"');
    // Browser textContent/innerHTML doesn't escape quotes in text nodes
    expect(result).toBe('He said "hello"');
  });
});

describe('isLateCheckIn', () => {
  const sessionStart = '2026-01-13T09:00:00.000Z';

  test('returns false for check-in within threshold', () => {
    const checkIn = '2026-01-13T09:05:00.000Z'; // 5 minutes after start
    expect(isLateCheckIn(checkIn, sessionStart, 10)).toBe(false);
  });

  test('returns false for check-in exactly at threshold', () => {
    const checkIn = '2026-01-13T09:10:00.000Z'; // Exactly 10 minutes
    expect(isLateCheckIn(checkIn, sessionStart, 10)).toBe(false);
  });

  test('returns true for check-in after threshold', () => {
    const checkIn = '2026-01-13T09:11:00.000Z'; // 11 minutes after start
    expect(isLateCheckIn(checkIn, sessionStart, 10)).toBe(true);
  });

  test('returns false for check-in at session start', () => {
    expect(isLateCheckIn(sessionStart, sessionStart, 10)).toBe(false);
  });

  test('handles different threshold values', () => {
    const checkIn = '2026-01-13T09:15:00.000Z'; // 15 minutes after

    expect(isLateCheckIn(checkIn, sessionStart, 10)).toBe(true);  // 10 min threshold
    expect(isLateCheckIn(checkIn, sessionStart, 15)).toBe(false); // 15 min threshold
    expect(isLateCheckIn(checkIn, sessionStart, 20)).toBe(false); // 20 min threshold
  });

  test('handles check-in much later', () => {
    const checkIn = '2026-01-13T10:00:00.000Z'; // 1 hour after start
    expect(isLateCheckIn(checkIn, sessionStart, 10)).toBe(true);
  });
});

describe('isValidEmail', () => {
  test('returns true for valid emails', () => {
    expect(isValidEmail('student@st.neu.edu.vn')).toBe(true);
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  test('returns falsy for invalid emails', () => {
    // These return falsy values (empty string, null, undefined, false)
    expect(isValidEmail('notanemail')).toBeFalsy();
    expect(isValidEmail('missing.at.sign')).toBeFalsy();
    expect(isValidEmail('')).toBeFalsy();
    expect(isValidEmail(null)).toBeFalsy();
    expect(isValidEmail(undefined)).toBeFalsy();
  });
});

describe('isValidCode', () => {
  test('returns true for valid 6-character codes', () => {
    expect(isValidCode('ABC123')).toBe(true);
    expect(isValidCode('XYZDEF')).toBe(true);
    expect(isValidCode('123456')).toBe(true);
  });

  test('handles lowercase input', () => {
    expect(isValidCode('abc123')).toBe(true);
  });

  test('returns falsy for wrong length', () => {
    expect(isValidCode('ABC12')).toBeFalsy();    // Too short
    expect(isValidCode('ABC1234')).toBeFalsy();  // Too long
    expect(isValidCode('')).toBeFalsy();         // Empty
  });

  test('returns falsy for special characters', () => {
    expect(isValidCode('ABC-12')).toBeFalsy();
    expect(isValidCode('ABC 12')).toBeFalsy();
    expect(isValidCode('ABC!@#')).toBeFalsy();
  });

  test('returns falsy for null/undefined', () => {
    expect(isValidCode(null)).toBeFalsy();
    expect(isValidCode(undefined)).toBeFalsy();
  });
});

describe('getUrlParams', () => {
  test('extracts mode and code parameters', () => {
    const result = getUrlParams('?mode=student&code=ABC123');
    expect(result.mode).toBe('student');
    expect(result.code).toBe('ABC123');
  });

  test('handles missing parameters', () => {
    const result = getUrlParams('?mode=teacher');
    expect(result.mode).toBe('teacher');
    expect(result.code).toBeNull();
  });

  test('handles empty search string', () => {
    const result = getUrlParams('');
    expect(result.mode).toBeNull();
    expect(result.code).toBeNull();
  });

  test('handles null/undefined', () => {
    const result = getUrlParams(null);
    expect(result.mode).toBeNull();
    expect(result.code).toBeNull();
  });
});

describe('getBaseUrl', () => {
  test('strips query parameters', () => {
    const result = getBaseUrl('https://example.com/app?mode=student&code=ABC');
    expect(result).toBe('https://example.com/app');
  });

  test('strips hash fragments', () => {
    const result = getBaseUrl('https://example.com/app#section1');
    expect(result).toBe('https://example.com/app');
  });

  test('strips both query and hash', () => {
    const result = getBaseUrl('https://example.com/app?param=value#section');
    expect(result).toBe('https://example.com/app');
  });

  test('handles URL without query or hash', () => {
    const result = getBaseUrl('https://example.com/app');
    expect(result).toBe('https://example.com/app');
  });
});
