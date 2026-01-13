# NEU Quick Attendance

Geolocation-verified attendance system for university classrooms.

## Features

- **Rotating 6-character codes** - Changes every 2 minutes
- **GPS verification** - Students must be within classroom radius
- **Device fingerprinting** - Prevents one device checking in multiple students
- **Real-time updates** - See attendance populate instantly
- **Failed attempts log** - See students who failed verification (wrong location, bad code, etc.)
- **Manual approval** - Approve students from the failed list if they have GPS issues
- **QR codes** - Easy access for students with auto-fill code
- **CSV export** - Download attendance and failed attempts data
- **Late marking** - Configurable grace period for marking late arrivals
- **Session history** - View past attendance sessions
- **Dark mode** - Toggle between light and dark themes
- **Instructor PIN** - Protect instructor mode with PIN authentication

## Student Data Collected

- Student Number
- Full Name
- Email
- Device ID (auto-generated fingerprint)
- GPS coordinates
- Distance from classroom
- Timestamp
- Manual approval status
- Late status

## Usage

**Instructor:** `?mode=teacher` -> Enter PIN -> Start session -> Display code/QR -> Monitor attendance + failed attempts

**Student:** `?mode=student` -> Fill details -> Enter code -> Submit

Or scan the QR code displayed by the instructor for auto-filled attendance code.

## Failed Attempts

Students who try to check in but fail verification are logged with:
- Their submitted details
- Actual distance vs allowed radius
- Failure reason (wrong code, too far, expired code)
- Timestamp

Instructors can review and manually approve legitimate students (e.g., indoor GPS issues).

## Testing

The project includes both unit tests (Jest) and integration tests (Playwright).

### Prerequisites

```bash
npm install
```

### Run All Tests

```bash
npm run test:all
```

### Unit Tests

Unit tests cover core utility functions including:
- Code generation (6-character alphanumeric codes)
- Device ID generation (fingerprinting)
- Distance calculation (Haversine formula)
- Time formatting
- HTML escaping (XSS prevention)
- Validation logic (email, code format)

```bash
npm test
# or
npm run test:unit
```

### Integration Tests (E2E)

Integration tests use Playwright to test user flows:
- Instructor flow (PIN -> session -> code display -> end)
- Student flow (form -> validation -> submit)
- Dark mode toggle and persistence
- QR code generation and auto-fill
- Offline indicator

```bash
# Run all E2E tests
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed
```

By default, tests run against the deployed app at https://wwlang.github.io/neu-attendance/. To test locally:

```bash
BASE_URL=http://localhost:8080 npm run test:e2e
```

### Test Structure

```
tests/
  unit/                     # Jest unit tests
    utils.test.js           # Tests for utility functions
  integration/              # Playwright E2E tests
    instructor-flow.spec.js # Instructor journey tests
    student-flow.spec.js    # Student journey tests
    dark-mode.spec.js       # Dark mode feature tests
    offline-indicator.spec.js # Offline detection tests
    qr-code.spec.js         # QR code functionality tests
```

## Development

This is a single-page HTML application with inline JavaScript. No build process required.

- `index.html` - Main application file
- `src/utils.js` - Extracted utility functions (for testing)

## Architecture

- Single-page HTML application
- Firebase Realtime Database backend
- TailwindCSS (CDN)
- QRCode.js for QR generation
- GitHub Pages hosting

## Deployment

The app is deployed via GitHub Pages at:
https://wwlang.github.io/neu-attendance/
