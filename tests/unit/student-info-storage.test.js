/**
 * NEU Attendance - Unit Tests for Student Info Storage
 *
 * Tests localStorage persistence for student information:
 * - Saving student info after successful check-in
 * - Loading saved student info on page visit
 * - Clearing saved student info
 */

const {
  saveStudentInfo,
  loadStudentInfo,
  clearStudentInfo,
  STUDENT_INFO_KEYS
} = require('../../src/utils');

describe('Student Info Storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('STUDENT_INFO_KEYS', () => {
    test('exports correct key names', () => {
      expect(STUDENT_INFO_KEYS.STUDENT_ID).toBe('neu_student_id');
      expect(STUDENT_INFO_KEYS.STUDENT_NAME).toBe('neu_student_name');
      expect(STUDENT_INFO_KEYS.STUDENT_EMAIL).toBe('neu_student_email');
    });
  });

  describe('saveStudentInfo', () => {
    test('saves all student fields to localStorage', () => {
      const info = {
        studentId: '12345678',
        studentName: 'Nguyen Van A',
        studentEmail: 'student@st.neu.edu.vn'
      };

      saveStudentInfo(info);

      expect(localStorage.getItem('neu_student_id')).toBe('12345678');
      expect(localStorage.getItem('neu_student_name')).toBe('Nguyen Van A');
      expect(localStorage.getItem('neu_student_email')).toBe('student@st.neu.edu.vn');
    });

    test('overwrites existing values', () => {
      localStorage.setItem('neu_student_id', 'old-id');
      localStorage.setItem('neu_student_name', 'Old Name');
      localStorage.setItem('neu_student_email', 'old@email.com');

      saveStudentInfo({
        studentId: 'new-id',
        studentName: 'New Name',
        studentEmail: 'new@email.com'
      });

      expect(localStorage.getItem('neu_student_id')).toBe('new-id');
      expect(localStorage.getItem('neu_student_name')).toBe('New Name');
      expect(localStorage.getItem('neu_student_email')).toBe('new@email.com');
    });

    test('handles empty values gracefully', () => {
      saveStudentInfo({
        studentId: '',
        studentName: '',
        studentEmail: ''
      });

      expect(localStorage.getItem('neu_student_id')).toBe('');
      expect(localStorage.getItem('neu_student_name')).toBe('');
      expect(localStorage.getItem('neu_student_email')).toBe('');
    });

    test('handles Vietnamese characters', () => {
      const info = {
        studentId: '12345678',
        studentName: 'Nguyen Van Duc',
        studentEmail: 'duc@st.neu.edu.vn'
      };

      saveStudentInfo(info);

      expect(localStorage.getItem('neu_student_name')).toBe('Nguyen Van Duc');
    });

    test('returns true on success', () => {
      const result = saveStudentInfo({
        studentId: '12345678',
        studentName: 'Test',
        studentEmail: 'test@example.com'
      });

      expect(result).toBe(true);
    });
  });

  describe('loadStudentInfo', () => {
    test('returns null when no saved info exists', () => {
      const result = loadStudentInfo();
      expect(result).toBeNull();
    });

    test('returns saved info when all fields exist', () => {
      localStorage.setItem('neu_student_id', '12345678');
      localStorage.setItem('neu_student_name', 'Test Student');
      localStorage.setItem('neu_student_email', 'test@example.com');

      const result = loadStudentInfo();

      expect(result).toEqual({
        studentId: '12345678',
        studentName: 'Test Student',
        studentEmail: 'test@example.com'
      });
    });

    test('returns null if student ID is missing', () => {
      localStorage.setItem('neu_student_name', 'Test Student');
      localStorage.setItem('neu_student_email', 'test@example.com');

      const result = loadStudentInfo();
      expect(result).toBeNull();
    });

    test('returns null if student name is missing', () => {
      localStorage.setItem('neu_student_id', '12345678');
      localStorage.setItem('neu_student_email', 'test@example.com');

      const result = loadStudentInfo();
      expect(result).toBeNull();
    });

    test('returns null if student email is missing', () => {
      localStorage.setItem('neu_student_id', '12345678');
      localStorage.setItem('neu_student_name', 'Test Student');

      const result = loadStudentInfo();
      expect(result).toBeNull();
    });

    test('returns info even if values are empty strings', () => {
      // Edge case: all keys exist but have empty values
      // This should return null since empty strings are not valid
      localStorage.setItem('neu_student_id', '');
      localStorage.setItem('neu_student_name', '');
      localStorage.setItem('neu_student_email', '');

      const result = loadStudentInfo();
      expect(result).toBeNull();
    });
  });

  describe('clearStudentInfo', () => {
    test('removes all student info keys from localStorage', () => {
      localStorage.setItem('neu_student_id', '12345678');
      localStorage.setItem('neu_student_name', 'Test Student');
      localStorage.setItem('neu_student_email', 'test@example.com');

      clearStudentInfo();

      expect(localStorage.getItem('neu_student_id')).toBeNull();
      expect(localStorage.getItem('neu_student_name')).toBeNull();
      expect(localStorage.getItem('neu_student_email')).toBeNull();
    });

    test('does not affect other localStorage keys', () => {
      localStorage.setItem('neu_student_id', '12345678');
      localStorage.setItem('neu_attendance_dark_mode', 'true');
      localStorage.setItem('other_key', 'other_value');

      clearStudentInfo();

      expect(localStorage.getItem('neu_student_id')).toBeNull();
      expect(localStorage.getItem('neu_attendance_dark_mode')).toBe('true');
      expect(localStorage.getItem('other_key')).toBe('other_value');
    });

    test('handles case when no info exists', () => {
      // Should not throw
      expect(() => clearStudentInfo()).not.toThrow();
    });

    test('returns true on success', () => {
      const result = clearStudentInfo();
      expect(result).toBe(true);
    });
  });

  describe('integration: save then load', () => {
    test('can save and load student info', () => {
      const original = {
        studentId: '87654321',
        studentName: 'Tran Van B',
        studentEmail: 'tranb@st.neu.edu.vn'
      };

      saveStudentInfo(original);
      const loaded = loadStudentInfo();

      expect(loaded).toEqual(original);
    });

    test('load returns null after clear', () => {
      saveStudentInfo({
        studentId: '12345678',
        studentName: 'Test',
        studentEmail: 'test@example.com'
      });

      clearStudentInfo();
      const loaded = loadStudentInfo();

      expect(loaded).toBeNull();
    });
  });
});
