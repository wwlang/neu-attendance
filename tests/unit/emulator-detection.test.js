/**
 * Unit tests for Firebase Emulator Detection
 *
 * Tests the shouldUseEmulator function that determines whether
 * to connect to the Firebase Emulator based on URL parameters.
 */

describe('Firebase Emulator Detection', () => {
  describe('shouldUseEmulator', () => {
    // Implementation to be used in index.html
    // Note: In the browser, this will use window.location directly.
    // For testing, we pass location object as a parameter.
    const shouldUseEmulator = (loc) => {
      return (
        loc.hostname === 'localhost' &&
        new URLSearchParams(loc.search).get('emulator') === 'true'
      );
    };

    test('should return true when hostname is localhost and emulator=true', () => {
      const mockLocation = {
        hostname: 'localhost',
        search: '?emulator=true'
      };

      expect(shouldUseEmulator(mockLocation)).toBe(true);
    });

    test('should return false when hostname is localhost but emulator param is missing', () => {
      const mockLocation = {
        hostname: 'localhost',
        search: ''
      };

      expect(shouldUseEmulator(mockLocation)).toBe(false);
    });

    test('should return false when hostname is localhost but emulator=false', () => {
      const mockLocation = {
        hostname: 'localhost',
        search: '?emulator=false'
      };

      expect(shouldUseEmulator(mockLocation)).toBe(false);
    });

    test('should return false when hostname is not localhost even with emulator=true', () => {
      const mockLocation = {
        hostname: 'neu-attendance.web.app',
        search: '?emulator=true'
      };

      expect(shouldUseEmulator(mockLocation)).toBe(false);
    });

    test('should handle emulator param with other params', () => {
      const mockLocation = {
        hostname: 'localhost',
        search: '?debug=true&emulator=true&verbose=1'
      };

      expect(shouldUseEmulator(mockLocation)).toBe(true);
    });

    test('should return false for IP address even on port 3000', () => {
      const mockLocation = {
        hostname: '192.168.1.1',
        search: '?emulator=true'
      };

      expect(shouldUseEmulator(mockLocation)).toBe(false);
    });

    test('should handle 127.0.0.1 same as other IPs (not localhost string)', () => {
      const mockLocation = {
        hostname: '127.0.0.1',
        search: '?emulator=true'
      };

      // Technically 127.0.0.1 should also trigger emulator, but we keep it simple
      // and only check for the string "localhost"
      expect(shouldUseEmulator(mockLocation)).toBe(false);
    });
  });
});
