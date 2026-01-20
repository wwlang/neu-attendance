# NEU Attendance - Project Instructions

## Testing: Firebase Emulator Required

**All tests MUST use the Firebase Emulator. Never run tests against production database.**

### Before Running Tests

```bash
# Start Firebase emulator (keep running in separate terminal)
npm run emulators
# Emulator UI: http://localhost:4000
# Database: http://localhost:9000
```

### Test Commands

```bash
npm test                   # Unit tests only
npm run test:e2e           # E2E tests (requires emulator running)
npm run test:e2e:emulator  # E2E tests with auto-emulator lifecycle
npm run test:all           # All tests
```

### Why Emulator?

- Tests write to `/sessions`, `/attendance`, `/failed`, `/audit`
- Test data pollutes production if not isolated
- Emulator provides clean slate for each test run
- Production data remains untouched

### Production Database Scripts

For production operations (backup, cleanup), use browser console scripts:

```bash
node scripts/backup-firebase.js     # Generates backup script
node scripts/archive-test-data.js   # Generates cleanup script
```

Copy output to browser console when app is open at production URL.

## Architecture

- Single-page HTML app (no build process)
- Firebase Realtime Database
- TailwindCSS (CDN) + QRCode.js
- GitHub Pages hosting

## Design System

**Selected:** Corporate
**Reference:** `docs/decisions/design-system.md`

Use this design system for all UI implementation.

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main application |
| `src/utils.js` | Extracted utility functions |
| `firebase.json` | Emulator configuration |
| `scripts/` | Production database scripts |
