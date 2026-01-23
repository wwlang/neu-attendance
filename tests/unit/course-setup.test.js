/**
 * NEU Attendance - Unit Tests for Course Setup
 *
 * Tests course setup utilities:
 * - Schedule session generation
 * - Course validation
 * - Date calculations
 */

const {
  generateScheduledSessions,
  validateCourseInfo,
  validateSchedule,
  combineCourseClassName,
  getNextOccurrence
} = require('../../src/utils');

describe('combineCourseClassName', () => {
  test('combines code and section with hyphen', () => {
    expect(combineCourseClassName('CS101', 'A')).toBe('CS101-A');
    expect(combineCourseClassName('MATH200', 'B')).toBe('MATH200-B');
  });

  test('trims whitespace from inputs', () => {
    expect(combineCourseClassName('  CS101  ', '  A  ')).toBe('CS101-A');
  });

  test('handles single character section', () => {
    expect(combineCourseClassName('ENG100', '1')).toBe('ENG100-1');
  });

  test('handles multi-character section', () => {
    expect(combineCourseClassName('BUS300', 'Morning')).toBe('BUS300-Morning');
  });
});

describe('validateCourseInfo', () => {
  test('returns valid for proper course info', () => {
    const result = validateCourseInfo('CS101', 'A');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns error for empty course code', () => {
    const result = validateCourseInfo('', 'A');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Course code is required');
  });

  test('returns error for empty section', () => {
    const result = validateCourseInfo('CS101', '');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Section is required');
  });

  test('returns error for course code exceeding max length', () => {
    const result = validateCourseInfo('A'.repeat(21), 'A');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Course code must be 20 characters or less');
  });

  test('returns error for section exceeding max length', () => {
    const result = validateCourseInfo('CS101', 'A'.repeat(11));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Section must be 10 characters or less');
  });

  test('returns multiple errors when both inputs are invalid', () => {
    const result = validateCourseInfo('', '');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('validateSchedule', () => {
  test('returns valid for proper schedule', () => {
    const schedule = {
      days: ['Monday', 'Wednesday', 'Friday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 15,
      startDate: '2026-02-03'
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns error when no days selected', () => {
    const schedule = {
      days: [],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 15,
      startDate: '2026-02-03'
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one day must be selected');
  });

  test('returns error when start time is after end time', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '14:00',
      endTime: '10:30',
      weeks: 15,
      startDate: '2026-02-03'
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Start time must be before end time');
  });

  test('returns error when weeks is out of range', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 0,
      startDate: '2026-02-03'
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Weeks must be between 1 and 20');

    const schedule2 = { ...schedule, weeks: 21 };
    const result2 = validateSchedule(schedule2);
    expect(result2.valid).toBe(false);
    expect(result2.errors).toContain('Weeks must be between 1 and 20');
  });

  test('returns error when start date is missing', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 15,
      startDate: ''
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Start date is required');
  });

  test('returns error when start time is missing', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '',
      endTime: '10:30',
      weeks: 15,
      startDate: '2026-02-03'
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Start time is required');
  });

  test('returns error when end time is missing', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '',
      weeks: 15,
      startDate: '2026-02-03'
    };
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('End time is required');
  });
});

describe('getNextOccurrence', () => {
  // Helper function to get local date string in YYYY-MM-DD format
  const toLocalDateString = (date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  test('returns same date if it matches target day', () => {
    // 2026-02-02 is a Monday
    const startDate = new Date('2026-02-02T00:00:00');
    const result = getNextOccurrence(startDate, 'Monday');
    expect(toLocalDateString(result)).toBe('2026-02-02');
  });

  test('returns next occurrence if start date is different day', () => {
    // 2026-02-02 is Monday, looking for Wednesday
    const startDate = new Date('2026-02-02T00:00:00');
    const result = getNextOccurrence(startDate, 'Wednesday');
    expect(toLocalDateString(result)).toBe('2026-02-04');
  });

  test('handles wrap around to next week', () => {
    // 2026-02-06 is Friday, looking for Monday
    const startDate = new Date('2026-02-06T00:00:00');
    const result = getNextOccurrence(startDate, 'Monday');
    expect(toLocalDateString(result)).toBe('2026-02-09');
  });

  test('handles Sunday correctly', () => {
    // 2026-02-02 is Monday, looking for Sunday
    const startDate = new Date('2026-02-02T00:00:00');
    const result = getNextOccurrence(startDate, 'Sunday');
    expect(toLocalDateString(result)).toBe('2026-02-08');
  });
});

describe('generateScheduledSessions', () => {
  const baseCourse = {
    id: 'course-123',
    className: 'CS101-A',
    location: { lat: 21.0285, lng: 105.8542 },
    radius: 300,
    lateThreshold: 10
  };

  test('generates correct number of sessions for single day', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 3,
      startDate: '2026-02-02' // Monday
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);
    expect(sessions).toHaveLength(3);
  });

  test('generates correct number of sessions for multiple days', () => {
    const schedule = {
      days: ['Monday', 'Wednesday', 'Friday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 2,
      startDate: '2026-02-02' // Monday
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);
    // 3 days * 2 weeks = 6 sessions
    expect(sessions).toHaveLength(6);
  });

  test('generates sessions with correct timestamps', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 2,
      startDate: '2026-02-02' // Monday
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);

    // First session should be on 2026-02-02 at 09:00
    const firstSession = sessions[0];
    const firstDate = new Date(firstSession.scheduledFor);
    expect(firstDate.getFullYear()).toBe(2026);
    expect(firstDate.getMonth()).toBe(1); // February (0-indexed)
    expect(firstDate.getDate()).toBe(2);
    expect(firstDate.getHours()).toBe(9);
    expect(firstDate.getMinutes()).toBe(0);

    // Second session should be one week later
    const secondSession = sessions[1];
    const secondDate = new Date(secondSession.scheduledFor);
    expect(secondDate.getDate()).toBe(9);
  });

  test('generates sessions with correct course reference', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 1,
      startDate: '2026-02-02'
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);

    expect(sessions[0].courseId).toBe('course-123');
    expect(sessions[0].className).toBe('CS101-A');
    expect(sessions[0].location).toEqual({ lat: 21.0285, lng: 105.8542 });
    expect(sessions[0].radius).toBe(300);
    expect(sessions[0].lateThreshold).toBe(10);
  });

  test('generates sessions with status "scheduled"', () => {
    const schedule = {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 1,
      startDate: '2026-02-02'
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);

    expect(sessions[0].status).toBe('scheduled');
    expect(sessions[0].active).toBe(false);
  });

  test('generates sessions in chronological order', () => {
    const schedule = {
      days: ['Monday', 'Wednesday', 'Friday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 2,
      startDate: '2026-02-02' // Monday
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);

    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i].scheduledFor).toBeGreaterThan(sessions[i - 1].scheduledFor);
    }
  });

  test('handles start date that does not match any scheduled day', () => {
    const schedule = {
      days: ['Tuesday', 'Thursday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 1,
      startDate: '2026-02-02' // Monday
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);

    // Should find next Tuesday (Feb 3) and Thursday (Feb 5)
    expect(sessions).toHaveLength(2);

    const firstDate = new Date(sessions[0].scheduledFor);
    expect(firstDate.getDate()).toBe(3); // Tuesday

    const secondDate = new Date(sessions[1].scheduledFor);
    expect(secondDate.getDate()).toBe(5); // Thursday
  });

  test('returns empty array for invalid schedule', () => {
    const schedule = {
      days: [],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 1,
      startDate: '2026-02-02'
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);
    expect(sessions).toHaveLength(0);
  });

  test('generates unique IDs for each session', () => {
    const schedule = {
      days: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:30',
      weeks: 2,
      startDate: '2026-02-02'
    };
    const sessions = generateScheduledSessions(baseCourse, schedule);

    const ids = sessions.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(sessions.length);
  });
});

describe('late threshold with zero value', () => {
  // These tests verify that zero-minute late threshold is supported
  const { isLateCheckIn } = require('../../src/utils');

  test('zero threshold marks immediate check-in as on time', () => {
    const sessionStart = '2026-01-23T09:00:00.000Z';
    const checkIn = '2026-01-23T09:00:00.000Z'; // Exactly at start
    expect(isLateCheckIn(checkIn, sessionStart, 0)).toBe(false);
  });

  test('zero threshold marks any delay as late', () => {
    const sessionStart = '2026-01-23T09:00:00.000Z';
    const checkIn = '2026-01-23T09:00:01.000Z'; // 1 second after start
    expect(isLateCheckIn(checkIn, sessionStart, 0)).toBe(true);
  });

  test('zero threshold marks 1 minute delay as late', () => {
    const sessionStart = '2026-01-23T09:00:00.000Z';
    const checkIn = '2026-01-23T09:01:00.000Z'; // 1 minute after start
    expect(isLateCheckIn(checkIn, sessionStart, 0)).toBe(true);
  });
});
