/**
 * NEU Attendance - Unit Tests for QR Code Library Loading
 *
 * Tests that the QRCode library has proper fallback handling when CDN fails.
 * Journey Reference: docs/journeys/instructor-attendance-session.md AC2
 */

describe('QRCode Library Loading', () => {
  describe('isQRCodeAvailable', () => {
    test('returns true when QRCode is defined', () => {
      // Simulate QRCode being available
      global.QRCode = { toCanvas: jest.fn() };

      const { isQRCodeAvailable } = require('../../src/qrcode-loader');
      expect(isQRCodeAvailable()).toBe(true);

      delete global.QRCode;
    });

    test('returns false when QRCode is undefined', () => {
      // Ensure QRCode is not defined
      delete global.QRCode;

      // Need fresh require to avoid caching
      jest.resetModules();
      const { isQRCodeAvailable } = require('../../src/qrcode-loader');
      expect(isQRCodeAvailable()).toBe(false);
    });
  });

  describe('getQRCodeLibrary', () => {
    beforeEach(() => {
      delete global.QRCode;
      jest.resetModules();
    });

    test('returns QRCode when available', () => {
      const mockQRCode = { toCanvas: jest.fn() };
      global.QRCode = mockQRCode;

      const { getQRCodeLibrary } = require('../../src/qrcode-loader');
      expect(getQRCodeLibrary()).toBe(mockQRCode);

      delete global.QRCode;
    });

    test('returns null when QRCode not available', () => {
      const { getQRCodeLibrary } = require('../../src/qrcode-loader');
      expect(getQRCodeLibrary()).toBeNull();
    });
  });

  describe('safeGenerateQR', () => {
    beforeEach(() => {
      delete global.QRCode;
      jest.resetModules();
    });

    test('calls QRCode.toCanvas when library is available', () => {
      const mockToCanvas = jest.fn((canvas, url, options, callback) => {
        callback(null, canvas);
      });
      global.QRCode = { toCanvas: mockToCanvas };

      const { safeGenerateQR } = require('../../src/qrcode-loader');
      const canvas = {};
      safeGenerateQR(canvas, 'https://example.com', { width: 100 });

      expect(mockToCanvas).toHaveBeenCalled();

      delete global.QRCode;
    });

    test('does not throw when QRCode is not available', () => {
      const { safeGenerateQR } = require('../../src/qrcode-loader');

      // Should not throw even when QRCode is undefined
      expect(() => {
        safeGenerateQR({}, 'https://example.com', { width: 100 });
      }).not.toThrow();
    });

    test('logs warning when QRCode is not available', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { safeGenerateQR } = require('../../src/qrcode-loader');
      safeGenerateQR({}, 'https://example.com', { width: 100 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('QRCode library not loaded')
      );

      consoleSpy.mockRestore();
    });
  });
});
