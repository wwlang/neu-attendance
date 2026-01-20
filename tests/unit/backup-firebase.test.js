/**
 * Unit tests for Firebase Backup Script
 *
 * Tests the backup functionality for exporting Firebase data
 * to timestamped JSON files.
 */

describe('Firebase Backup Functions', () => {
  describe('generateBackupFilename', () => {
    const generateBackupFilename = (date = new Date()) => {
      const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      return `backups/firebase-backup-${timestamp}.json`;
    };

    test('should generate filename with ISO timestamp', () => {
      const testDate = new Date('2026-01-20T10:30:00Z');
      const filename = generateBackupFilename(testDate);

      expect(filename).toBe('backups/firebase-backup-2026-01-20T10-30-00.json');
    });

    test('should handle different dates correctly', () => {
      const testDate = new Date('2025-12-31T23:59:59Z');
      const filename = generateBackupFilename(testDate);

      expect(filename).toBe('backups/firebase-backup-2025-12-31T23-59-59.json');
    });

    test('should use current date by default', () => {
      const filename = generateBackupFilename();

      expect(filename).toMatch(/^backups\/firebase-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });
  });

  describe('formatBackupData', () => {
    const formatBackupData = (data) => {
      return {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        paths: ['sessions', 'attendance', 'failed', 'audit'],
        data: data
      };
    };

    test('should include metadata fields', () => {
      const data = { sessions: {}, attendance: {} };
      const formatted = formatBackupData(data);

      expect(formatted).toHaveProperty('exportedAt');
      expect(formatted).toHaveProperty('version', '1.0');
      expect(formatted).toHaveProperty('paths');
      expect(formatted).toHaveProperty('data');
    });

    test('should include all backup paths', () => {
      const data = {};
      const formatted = formatBackupData(data);

      expect(formatted.paths).toContain('sessions');
      expect(formatted.paths).toContain('attendance');
      expect(formatted.paths).toContain('failed');
      expect(formatted.paths).toContain('audit');
    });

    test('should preserve original data', () => {
      const data = {
        sessions: { 's1': { className: 'Test' } },
        attendance: { 's1': { 'student1': { name: 'John' } } }
      };
      const formatted = formatBackupData(data);

      expect(formatted.data).toEqual(data);
    });
  });

  describe('validateBackupData', () => {
    const validateBackupData = (data) => {
      const errors = [];

      if (!data || typeof data !== 'object') {
        errors.push('Data must be an object');
        return { valid: false, errors };
      }

      const requiredPaths = ['sessions', 'attendance', 'failed', 'audit'];
      for (const path of requiredPaths) {
        if (!(path in data)) {
          errors.push(`Missing path: ${path}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };

    test('should validate complete data structure', () => {
      const data = {
        sessions: {},
        attendance: {},
        failed: {},
        audit: {}
      };
      const result = validateBackupData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should report missing paths', () => {
      const data = {
        sessions: {},
        attendance: {}
        // missing: failed, audit
      };
      const result = validateBackupData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing path: failed');
      expect(result.errors).toContain('Missing path: audit');
    });

    test('should reject null data', () => {
      const result = validateBackupData(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data must be an object');
    });

    test('should reject non-object data', () => {
      const result = validateBackupData('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data must be an object');
    });
  });
});
