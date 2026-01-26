# NEU Attendance - Project Instructions

## Production Setup

### Firebase Authentication Requirements

**IMPORTANT:** The production app requires Anonymous Authentication to be enabled in Firebase Console.

1. Go to [Firebase Console](https://console.firebase.google.com) and select your project
2. Navigate to **Authentication** > **Sign-in method**
3. Enable **Anonymous** provider

**Why this is required:**
- Teachers authenticate via Google Sign-in
- Students submit attendance anonymously (no account required)
- Firebase security rules use `auth != null` to validate writes
- Anonymous auth provides the `auth` context for student submissions without requiring accounts

Without Anonymous auth enabled, students will see "Permission Denied" when trying to submit attendance.

### Instructor Email Configuration (H3)

**Instructor emails stored in `config/instructorEmails` must be lowercase for consistent matching.**

The Firebase security rules use case-sensitive `.contains()` matching. To avoid case mismatch issues:
1. Store all instructor emails in lowercase in the database
2. The client normalizes email comparison to lowercase
3. When adding new instructors, ensure emails are lowercased before storing

Example database value: `john.doe@neu.edu,jane.smith@neu.edu` (not `John.Doe@neu.edu`)

## Local Development

### Emulator Mode

The app supports an emulator mode for local development and testing. When running locally with `?emulator=true`:

- **Database**: Connects to Firebase emulator (localhost:9000)
- **Auth**: Connects to Auth emulator (localhost:9099)
- **Authentication**: Uses PIN-based auth (PIN: `230782`) instead of Google Sign-in

Access emulator mode: `http://localhost:3000/?emulator=true`

### Starting Local Development

```bash
# Terminal 1: Start the emulators
npm run emulators
# Emulator UI: http://localhost:4000
# Database: http://localhost:9000
# Auth: http://localhost:9099

# Terminal 2: Start local server
npx serve -p 3000

# Open browser to http://localhost:3000/?emulator=true
```

## Testing

**All tests MUST use the Firebase Emulator. Never run tests against production database.**

### Test Commands

```bash
npm test                   # Unit tests only
npm run test:e2e:emulator  # E2E tests (recommended - handles emulator lifecycle)
npm run test:e2e           # E2E tests (requires emulator already running)
npm run test:all           # All tests
```

### How Tests Work

1. `test:e2e:emulator` swaps `database.rules.json` with `database.rules.test.json` (permissive rules)
2. Starts Firebase emulators (database + auth)
3. Runs Playwright tests with `?emulator=true` URL parameter
4. Restores original rules after tests complete

### Test Isolation

- Tests use `?emulator=true` URL parameter
- App detects emulator mode and connects to local emulators
- PIN auth bypasses Google Sign-in for test automation
- Permissive rules allow writes without authentication

## Production Database Scripts

**Service account available:** `scripts/service-account.json` (not committed to git)

For production operations (backup, cleanup):

```bash
node scripts/backup-admin.js                      # Create backup via Admin SDK
node scripts/verify-restore.js <backup-file>      # Verify backup on emulator
node scripts/production-cleanup-2026-01-23.js     # Cleanup script (list/delete/update/verify)
node scripts/admin-cleanup.js                     # Generic test data cleanup
```

## Architecture

- Single-page HTML app (no build process)
- Firebase Realtime Database
- TailwindCSS (CDN) + QRCode.js
- GitHub Pages hosting

## Design System

**Selected:** Corporate
**Reference:** `docs/decisions/design-system.md`

Use this design system for all UI implementation.

## Security Notes (M4)

### Public Read Access on Attendance Data

The attendance records have public read access (`".read": true`). **This is intentional and required** for the QR-code based attendance system to work:

1. Students scan a QR code that links to `/?mode=student&code=XXXXXX`
2. The student page needs to verify the code is valid by reading session data
3. Students submit attendance without creating accounts (anonymous auth)
4. After submission, the page shows success/failure feedback

Without public read access, students would need authenticated accounts to check attendance status, which defeats the purpose of the quick QR-code based system.

**Mitigations:**
- Attendance records only contain: student ID, name, email, timestamp, location
- No sensitive data is stored in attendance records
- Write access requires authentication (`auth != null`)
- Students cannot modify existing records

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main application |
| `src/utils.js` | Extracted utility functions |
| `firebase.json` | Emulator configuration |
| `database.rules.json` | Production security rules |
| `database.rules.test.json` | Permissive rules for testing |
| `scripts/admin-cleanup.js` | Admin SDK cleanup script |
| `tests/utils/test-helpers.js` | E2E test helper functions |
