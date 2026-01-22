// @ts-check
/**
 * Performance Thresholds Configuration
 *
 * Project-specific thresholds for the RequestMonitor utility.
 * Adjust these values based on your application's requirements.
 */

module.exports = {
  // URL patterns to monitor (Firebase emulator endpoints)
  patterns: [
    ':9000/', // Firebase Realtime Database emulator
    'firebaseio.com', // Production Firebase
    '/api/', // REST API (if applicable)
  ],

  // Thresholds by user flow
  flows: {
    // Authentication flow
    auth: {
      maxRequests: 5,
      maxKB: 50,
      description: 'PIN login or Google sign-in',
    },

    // Instructor starting a session
    'start-session': {
      maxRequests: 10,
      maxKB: 100,
      description: 'Instructor session creation with class list fetch',
    },

    // Student submitting attendance
    'student-checkin': {
      maxRequests: 5,
      maxKB: 20,
      description: 'Student attendance submission',
    },

    // Viewing session history list
    'history-list': {
      maxRequests: 10,
      maxKB: 200,
      description: 'Session history list view',
    },

    // Viewing session details
    'session-detail': {
      maxRequests: 8,
      maxKB: 150,
      description: 'Session detail with attendance records',
    },

    // Analytics view
    analytics: {
      maxRequests: 15,
      maxKB: 300,
      description: 'Analytics dashboard with aggregated data',
    },

    // Full instructor flow (session creation to end)
    'full-instructor-flow': {
      maxRequests: 30,
      maxKB: 500,
      description: 'Complete instructor workflow',
    },
  },

  // N+1 detection threshold - flag if same endpoint called more than N times
  n1Threshold: 5,

  // Duplicate request detection window (milliseconds)
  duplicateWindowMs: 5000,

  // Large payload warning threshold (KB)
  largePayloadWarningKB: 100,
};
