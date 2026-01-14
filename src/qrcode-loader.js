/**
 * NEU Attendance - QR Code Library Loader with Fallback
 *
 * Provides safe access to QRCode library with graceful fallback
 * when CDN fails to load. Addresses AC2 in instructor-attendance-session.md.
 */

/**
 * Checks if the QRCode library is available.
 * @returns {boolean} True if QRCode is defined and usable
 */
function isQRCodeAvailable() {
  return typeof QRCode !== 'undefined' && QRCode !== null;
}

/**
 * Gets the QRCode library if available.
 * @returns {Object|null} QRCode library or null if not loaded
 */
function getQRCodeLibrary() {
  if (isQRCodeAvailable()) {
    return QRCode;
  }
  return null;
}

/**
 * Safely generates a QR code, handling cases where the library failed to load.
 *
 * @param {HTMLCanvasElement} canvas - Canvas element to render to
 * @param {string} url - URL to encode in QR
 * @param {Object} options - QR code options (width, etc.)
 * @param {Function} [callback] - Optional callback(error, canvas)
 */
function safeGenerateQR(canvas, url, options, callback) {
  const qr = getQRCodeLibrary();

  if (!qr) {
    console.warn('QRCode library not loaded. QR codes will not be displayed.');
    if (callback) {
      callback(new Error('QRCode library not available'), null);
    }
    return;
  }

  try {
    qr.toCanvas(canvas, url, options, (err, resultCanvas) => {
      if (callback) {
        callback(err, resultCanvas);
      }
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    if (callback) {
      callback(err, null);
    }
  }
}

// Export for Node.js/Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isQRCodeAvailable,
    getQRCodeLibrary,
    safeGenerateQR
  };
}
