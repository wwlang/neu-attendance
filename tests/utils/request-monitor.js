// @ts-check
/**
 * RequestMonitor - Generic utility for monitoring network requests during E2E tests
 *
 * Works with any backend (Firebase, REST API, GraphQL, etc.)
 * Detects performance anti-patterns:
 * - Excessive bandwidth usage
 * - N+1 query patterns
 * - Duplicate/uncached requests
 */

/**
 * @typedef {Object} TrackedRequest
 * @property {string} url - Normalized URL
 * @property {string} method - HTTP method
 * @property {number} size - Response body size in bytes
 * @property {number} timestamp - Request timestamp
 */

/**
 * @typedef {Object} RequestMonitorOptions
 * @property {string[]} [patterns] - URL patterns to track (empty = track all)
 * @property {number} [n1Threshold] - Threshold for N+1 detection (default: 5)
 * @property {number} [duplicateWindowMs] - Window for duplicate detection (default: 5000)
 */

/**
 * @typedef {Object} N1Candidate
 * @property {string} path - URL path
 * @property {number} count - Number of times called
 */

/**
 * @typedef {Object} RequestReport
 * @property {number} totalRequests - Total tracked requests
 * @property {string} totalKB - Total KB downloaded (formatted)
 * @property {N1Candidate[]} n1Candidates - Potential N+1 patterns
 * @property {string[]} duplicates - URLs called multiple times
 * @property {Object<string, number>} byPath - Request count by path
 */

class RequestMonitor {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {RequestMonitorOptions} options
   */
  constructor(page, options = {}) {
    /** @type {TrackedRequest[]} */
    this.requests = [];
    this.totalBytesDownloaded = 0;
    this.patterns = options.patterns || [];
    this.n1Threshold = options.n1Threshold || 5;
    this.duplicateWindowMs = options.duplicateWindowMs || 5000;
    this._page = page;

    this._setupListener();
  }

  _setupListener() {
    this._page.on('response', async (response) => {
      const url = response.url();
      if (this._shouldTrack(url)) {
        try {
          const body = await response.body().catch(() => Buffer.from(''));
          const size = body.length;
          this.requests.push({
            url: this._normalizeUrl(url),
            method: response.request().method(),
            size,
            timestamp: Date.now(),
          });
          this.totalBytesDownloaded += size;
        } catch {
          // Response body not available (e.g., redirects)
        }
      }
    });
  }

  /**
   * Check if URL should be tracked based on patterns
   * @param {string} url
   * @returns {boolean}
   */
  _shouldTrack(url) {
    // Skip non-HTTP(S) URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }

    // If no patterns specified, track all HTTP requests
    if (this.patterns.length === 0) {
      return true;
    }

    return this.patterns.some((p) => url.includes(p));
  }

  /**
   * Normalize URL for comparison (remove query params and fragments)
   * @param {string} url
   * @returns {string}
   */
  _normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Keep path but normalize trailing slash
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
    } catch {
      return url;
    }
  }

  /**
   * Assert maximum number of requests
   * @param {number} max
   * @param {string} context - Description for error message
   * @throws {Error} if request count exceeds max
   */
  assertMaxRequests(max, context = 'Request count') {
    const actual = this.requests.length;
    if (actual > max) {
      const report = this.getReport();
      throw new Error(
        `${context}: ${actual} requests exceeds max ${max}\n` +
          `Top endpoints: ${JSON.stringify(report.byPath, null, 2)}`
      );
    }
  }

  /**
   * Assert maximum payload size
   * @param {number} maxKB
   * @param {string} context - Description for error message
   * @throws {Error} if payload exceeds maxKB
   */
  assertMaxPayload(maxKB, context = 'Payload size') {
    const actualKB = this.totalBytesDownloaded / 1024;
    if (actualKB > maxKB) {
      throw new Error(
        `${context}: ${actualKB.toFixed(1)}KB exceeds max ${maxKB}KB`
      );
    }
  }

  /**
   * Detect N+1 query patterns (same endpoint called many times)
   * @returns {N1Candidate[]}
   */
  detectN1Pattern() {
    const byPath = this._groupByPath();
    return Object.entries(byPath)
      .filter(([, count]) => count > this.n1Threshold)
      .map(([path, count]) => ({ path, count }));
  }

  /**
   * Assert no N+1 patterns detected
   * @param {string} context - Description for error message
   * @throws {Error} if N+1 patterns detected
   */
  assertNoN1Pattern(context = 'N+1 detection') {
    const n1Candidates = this.detectN1Pattern();
    if (n1Candidates.length > 0) {
      throw new Error(
        `${context}: Potential N+1 patterns detected:\n` +
          n1Candidates.map((c) => `  ${c.path}: ${c.count} calls`).join('\n')
      );
    }
  }

  /**
   * Detect duplicate requests within time window (missing cache)
   * @returns {string[]}
   */
  detectDuplicates() {
    const duplicates = [];
    for (let i = 0; i < this.requests.length; i++) {
      for (let j = i + 1; j < this.requests.length; j++) {
        if (
          this.requests[j].url === this.requests[i].url &&
          this.requests[j].timestamp - this.requests[i].timestamp <
            this.duplicateWindowMs
        ) {
          duplicates.push(this.requests[j].url);
        }
      }
    }
    return [...new Set(duplicates)];
  }

  /**
   * Assert no duplicate requests (missing cache)
   * @param {string} context - Description for error message
   * @throws {Error} if duplicate requests detected
   */
  assertNoDuplicates(context = 'Duplicate detection') {
    const duplicates = this.detectDuplicates();
    if (duplicates.length > 0) {
      throw new Error(
        `${context}: Duplicate requests detected (missing cache?):\n` +
          duplicates.map((d) => `  ${d}`).join('\n')
      );
    }
  }

  /**
   * Group requests by path
   * @returns {Object<string, number>}
   */
  _groupByPath() {
    /** @type {Object<string, number>} */
    const byPath = {};
    for (const req of this.requests) {
      const path = req.url.split('?')[0];
      byPath[path] = (byPath[path] || 0) + 1;
    }
    return byPath;
  }

  /**
   * Get full performance report
   * @returns {RequestReport}
   */
  getReport() {
    return {
      totalRequests: this.requests.length,
      totalKB: (this.totalBytesDownloaded / 1024).toFixed(2),
      n1Candidates: this.detectN1Pattern(),
      duplicates: this.detectDuplicates(),
      byPath: this._groupByPath(),
    };
  }

  /**
   * Reset monitor state
   */
  reset() {
    this.requests = [];
    this.totalBytesDownloaded = 0;
  }

  /**
   * Log report to console (useful for debugging)
   */
  logReport() {
    const report = this.getReport();
    console.log('\n=== Request Monitor Report ===');
    console.log(`Total Requests: ${report.totalRequests}`);
    console.log(`Total Downloaded: ${report.totalKB} KB`);
    if (report.n1Candidates.length > 0) {
      console.log('Potential N+1 Patterns:');
      report.n1Candidates.forEach((c) => console.log(`  ${c.path}: ${c.count}`));
    }
    if (report.duplicates.length > 0) {
      console.log('Duplicate Requests:');
      report.duplicates.forEach((d) => console.log(`  ${d}`));
    }
    console.log('Requests by Path:');
    Object.entries(report.byPath).forEach(([path, count]) =>
      console.log(`  ${path}: ${count}`)
    );
    console.log('==============================\n');
  }
}

module.exports = { RequestMonitor };
