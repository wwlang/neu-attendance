/**
 * Smart Class Default Selection - Unit Tests
 *
 * Tests for P4-05: Smart class default selection based on day-of-week and hour matching.
 * Following TDD: Write tests first, then implement the function.
 */

const { findSmartDefault } = require('../../src/utils');

describe('findSmartDefault', () => {
  // Helper to create a session at a specific date/time
  const createSession = (className, dateString) => ({
    className,
    createdAt: new Date(dateString).toISOString()
  });

  // Helper to create previous class entry
  const createPreviousClass = (className, lastUsed) => ({
    className,
    lastUsed: new Date(lastUsed).getTime(),
    radius: 300,
    lateThreshold: 10
  });

  describe('AC1: Default to same-day-of-week + same-hour class', () => {
    test('selects class from same day and hour last week', () => {
      // Today: Tuesday 2026-01-21 at 10:15am
      const now = new Date('2026-01-21T10:15:00');

      const previousClasses = [
        createPreviousClass('CS202', '2026-01-20T14:00:00'), // Monday - most recent overall
        createPreviousClass('CS101', '2026-01-14T10:05:00'), // Tuesday last week, same hour
      ];

      const allSessions = [
        createSession('CS202', '2026-01-20T14:00:00'),
        createSession('CS101', '2026-01-14T10:05:00'),
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101');
    });

    test('selects most recent matching session when multiple exist', () => {
      // Today: Tuesday 2026-01-21 at 10:15am
      const now = new Date('2026-01-21T10:15:00');

      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:05:00'),
        createPreviousClass('Advanced CS101', '2026-01-07T10:30:00'), // Two weeks ago
      ];

      const allSessions = [
        createSession('CS101', '2026-01-14T10:05:00'), // Last week
        createSession('Advanced CS101', '2026-01-07T10:30:00'), // Two weeks ago
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101'); // More recent matching session
    });
  });

  describe('AC2: Fallback to most recent class', () => {
    test('falls back to most recent when no day/hour match exists', () => {
      // Today: Friday 2026-01-24 at 9:00am
      const now = new Date('2026-01-24T09:00:00');

      const previousClasses = [
        createPreviousClass('CS202', '2026-01-22T14:00:00'), // Wednesday - most recent
        createPreviousClass('CS101', '2026-01-14T10:00:00'), // Tuesday
      ];

      const allSessions = [
        createSession('CS202', '2026-01-22T14:00:00'),
        createSession('CS101', '2026-01-14T10:00:00'),
      ];

      // No Friday at 9am exists, so fall back to most recent
      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS202');
    });

    test('falls back when matching day exists but not hour', () => {
      // Today: Tuesday 2026-01-21 at 3:00pm
      const now = new Date('2026-01-21T15:00:00');

      const previousClasses = [
        createPreviousClass('CS202', '2026-01-20T14:00:00'), // Monday at 2pm - most recent
        createPreviousClass('CS101', '2026-01-14T10:00:00'), // Tuesday at 10am
      ];

      const allSessions = [
        createSession('CS202', '2026-01-20T14:00:00'),
        createSession('CS101', '2026-01-14T10:00:00'),
      ];

      // Tuesday exists but not at 3pm hour
      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS202'); // Fallback to most recent
    });
  });

  describe('AC3: Handle edge cases', () => {
    test('returns null when no previous classes exist', () => {
      const now = new Date('2026-01-21T10:15:00');
      const result = findSmartDefault([], [], now);
      expect(result).toBeNull();
    });

    test('returns first class when no sessions data but classes exist', () => {
      const now = new Date('2026-01-21T10:15:00');
      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:00:00'),
      ];

      // No session data to match, fall back to first class
      const result = findSmartDefault(previousClasses, [], now);
      expect(result).toBe('CS101');
    });

    test('handles empty sessions array gracefully', () => {
      const now = new Date('2026-01-21T10:15:00');
      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:00:00'),
        createPreviousClass('CS202', '2026-01-13T14:00:00'),
      ];

      const result = findSmartDefault(previousClasses, [], now);
      expect(result).toBe('CS101'); // Falls back to first (most recent)
    });
  });

  describe('AC4: Hour window matching (1-hour window)', () => {
    test('matches within the same hour (start of hour)', () => {
      // Today: Tuesday 2026-01-21 at 10:00am (start of hour)
      const now = new Date('2026-01-21T10:00:00');

      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:55:00'), // Tuesday at 10:55
      ];

      const allSessions = [
        createSession('CS101', '2026-01-14T10:55:00'),
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101'); // Same hour (10)
    });

    test('matches within the same hour (end of hour)', () => {
      // Today: Tuesday 2026-01-21 at 10:55am (end of hour)
      const now = new Date('2026-01-21T10:55:00');

      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:05:00'), // Tuesday at 10:05
      ];

      const allSessions = [
        createSession('CS101', '2026-01-14T10:05:00'),
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101'); // Same hour (10)
    });

    test('does not match different hour', () => {
      // Today: Tuesday 2026-01-21 at 11:00am
      const now = new Date('2026-01-21T11:00:00');

      const previousClasses = [
        createPreviousClass('CS202', '2026-01-20T14:00:00'), // Monday - most recent
        createPreviousClass('CS101', '2026-01-14T10:05:00'), // Tuesday at 10am (different hour)
      ];

      const allSessions = [
        createSession('CS202', '2026-01-20T14:00:00'),
        createSession('CS101', '2026-01-14T10:05:00'),
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS202'); // Falls back, 10am != 11am
    });
  });

  describe('AC5: Week lookback window', () => {
    test('matches sessions within 7-14 day lookback', () => {
      // Today: Tuesday 2026-01-21 at 10:00am
      const now = new Date('2026-01-21T10:00:00');

      const previousClasses = [
        createPreviousClass('CS202', '2026-01-20T14:00:00'), // Monday - most recent overall
        createPreviousClass('CS101', '2026-01-07T10:05:00'), // 14 days ago, same day/hour
      ];

      const allSessions = [
        createSession('CS202', '2026-01-20T14:00:00'),
        createSession('CS101', '2026-01-07T10:05:00'), // 14 days ago
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101'); // Within lookback window
    });

    test('does not match sessions older than 14 days', () => {
      // Today: Tuesday 2026-01-21 at 10:00am
      const now = new Date('2026-01-21T10:00:00');

      const previousClasses = [
        createPreviousClass('CS202', '2026-01-20T14:00:00'), // Monday - most recent
        createPreviousClass('CS101', '2025-12-31T10:00:00'), // 21 days ago, same day/hour but too old
      ];

      const allSessions = [
        createSession('CS202', '2026-01-20T14:00:00'),
        createSession('CS101', '2025-12-31T10:00:00'), // Too old
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS202'); // Falls back because match is too old
    });

    test('prefers more recent matching session within lookback', () => {
      // Today: Tuesday 2026-01-21 at 10:00am
      const now = new Date('2026-01-21T10:00:00');

      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:05:00'), // 7 days ago
        createPreviousClass('Physics 101', '2026-01-07T10:30:00'), // 14 days ago
      ];

      const allSessions = [
        createSession('CS101', '2026-01-14T10:05:00'), // 7 days ago
        createSession('Physics 101', '2026-01-07T10:30:00'), // 14 days ago
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101'); // More recent match
    });
  });

  describe('Timezone/DST handling', () => {
    test('uses local time for matching', () => {
      // The function should extract day-of-week and hour from local time
      // Today: Tuesday at 10am local time
      const now = new Date('2026-01-21T10:15:00'); // Local time

      const previousClasses = [
        createPreviousClass('CS101', '2026-01-14T10:05:00'),
      ];

      const allSessions = [
        createSession('CS101', '2026-01-14T10:05:00'), // Same local time pattern
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101');
    });
  });

  describe('Real-world scenarios', () => {
    test('typical instructor with multiple classes', () => {
      // Instructor teaches:
      // - CS101 on Tuesdays at 10am
      // - CS202 on Wednesdays at 2pm
      // - CS303 on Thursdays at 9am
      // Today: Tuesday 2026-01-21 at 10:15am
      const now = new Date('2026-01-21T10:15:00');

      const previousClasses = [
        createPreviousClass('CS303', '2026-01-16T09:00:00'), // Thursday - most recent
        createPreviousClass('CS202', '2026-01-15T14:00:00'), // Wednesday
        createPreviousClass('CS101', '2026-01-14T10:00:00'), // Tuesday last week
      ];

      const allSessions = [
        createSession('CS303', '2026-01-16T09:00:00'),
        createSession('CS202', '2026-01-15T14:00:00'),
        createSession('CS101', '2026-01-14T10:00:00'),
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS101'); // Matches Tuesday at 10am
    });

    test('different class same time slot (time slot change)', () => {
      // Instructor's 10am slot changed from CS101 to CS102
      // Today: Tuesday 2026-01-21 at 10:15am
      const now = new Date('2026-01-21T10:15:00');

      const previousClasses = [
        createPreviousClass('CS102', '2026-01-14T10:00:00'), // New class in slot
        createPreviousClass('CS101', '2026-01-07T10:00:00'), // Old class in slot
      ];

      const allSessions = [
        createSession('CS102', '2026-01-14T10:00:00'),
        createSession('CS101', '2026-01-07T10:00:00'),
      ];

      const result = findSmartDefault(previousClasses, allSessions, now);
      expect(result).toBe('CS102'); // Most recent in the slot
    });
  });
});
