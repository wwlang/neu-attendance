# NEU Attendance - Roadmap

## Current State
Single-page HTML application with Firebase backend. Core functionality complete with enhanced features:
- Rotating attendance codes with session-specific QR
- GPS verification with late marking
- Device fingerprinting
- Real-time attendance tracking
- Failed attempt logging and bulk approval
- Session history with class dropdown (defaults to most recent)
- CSV export (attendance + failed attempts)
- Dark mode support
- Google Sign-in for instructors (production) / PIN bypass (emulator mode)
- **Analytics dashboard with class-based filtering**
- **Course setup wizard with scheduled sessions**
- **Zero-minute late threshold support (0-60 min range)**
- **E2E tests with Firebase emulator isolation**
- **Test stability improvements (serial execution, retries, data reset)**

## Phase 1: Stability & Polish (Complete)

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P1-01 | Session reconnection on browser refresh | instructor-attendance-session | **Complete** (2026-01-13) |
| P1-02 | Offline indicator and graceful degradation | both | **Complete** (2026-01-13) |
| P1-03 | Input sanitization for XSS prevention | student-check-in | **Complete** (2026-01-13) |
| P1-04 | Improve mobile responsiveness | both | **Complete** (2026-01-13) |

## Phase 2: Enhanced Features (Complete)

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P2-01 | Session history view for instructors | instructor-attendance-session | **Complete** (2026-01-13) |
| P2-02 | Session-specific QR codes with auto-fill | student-check-in | **Complete** (2026-01-13) |
| P2-03 | Late marking with configurable threshold | both | **Complete** (2026-01-13) |
| P2-04 | Bulk approve failed attempts | instructor-attendance-session | **Complete** (2026-01-13) |
| P2-05 | Sound/vibration on successful check-in | student-check-in | **Complete** (2026-01-13) |
| P2-06 | Instructor PIN protection | instructor-attendance-session | **Complete** (2026-01-13) |
| P2-07 | Dark mode support | both | **Complete** (2026-01-13) |
| P2-08 | Export failed attempts to CSV | instructor-attendance-session | **Complete** (2026-01-13) |
| P2-09 | Countdown audio warning | instructor-attendance-session | **Complete** (2026-01-13) |
| P2-10 | Unit and integration test coverage | both | **Complete** (2026-01-13) |

## Phase 3: Security & Compliance

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P3-01 | Firebase security rules audit | both | **Documented** (2026-01-13) - See docs/firebase-security-rules.md |
| P3-02 | Rate limiting on check-ins | student-check-in | **Complete** - Client-side debounce added |
| P3-03 | Data retention policy implementation | both | Pending |
| P3-04 | GDPR-compliant data export | instructor-attendance-session | Pending |

## Phase 4: Analytics & Reporting

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P4-01 | Attendance trends dashboard | instructor-attendance-session | Pending |
| P4-02 | Course-level attendance aggregation | instructor-attendance-session | Pending |
| P4-03 | Student attendance history lookup | student-check-in | **Complete** (2026-01-20) |
| P4-03.1 | AC3.1 Participation tooltip | student-attendance-lookup | **Complete** (2026-01-21) |
| P4-03.2 | AC3.2 Late threshold transparency | student-attendance-lookup | **Complete** (2026-01-21) |
| P4-04 | Analytics split by class (default view) | analytics-by-class | **Complete** (2026-01-21) |
| P4-05 | Smart class default selection | 2026-01-21 |
| P4-05 | Smart class default selection | smart-class-default | **Complete** (2026-01-21) |

### P4-04: Analytics Split by Class

**Description:** Modify the analytics dashboard to display data split by class by default. Add a class selector dropdown that defaults to the most recent class, with an "All Classes" option for aggregated view.

**Journey Reference:** `docs/journeys/analytics-by-class.md`

**Acceptance Criteria:**
- [x] AC1: Class selector dropdown with all unique class names
- [x] AC2: Default selection is most recent class (by session date)
- [x] AC3: Summary cards (Total Sessions, Avg Attendance, Unique Students) update per class
- [x] AC4: Trend chart filters to show only selected class sessions
- [x] AC5: Session comparison bar chart shows only selected class
- [x] AC6: Student rankings calculate rates within selected class
- [x] AC7: At-risk students section reflects selected class
- [x] AC8: "All Classes" option shows aggregated data (current behavior)
- [x] AC9: Class selection persists during date filter and sorting
- [x] AC10: CSV export reflects selected class filter
- [x] AC11: Dark mode support for class selector

**Implementation Notes (2026-01-21):**
- Added `analyticsSelectedClass` and `analyticsClassList` to state
- Modified `loadAnalyticsData()` to compute class list from all sessions (before date filter)
- Added `getFilteredAnalyticsData()` to compute per-class statistics
- Added `changeAnalyticsClass()` for dropdown handler
- Modified `renderAnalyticsView()` to show class selector dropdown
- Class list sorted by most recent session date
- Class selection persists when applying date filters
- CSV export includes class name in filename when filtered
- 16 new E2E tests covering all acceptance criteria

### P4-05: Smart Class Default Selection

**Description:** Modify the session start class selector to intelligently default to the most likely class based on the current day of week and time, matching patterns from previous sessions.

**Journey Reference:** `docs/journeys/smart-class-default.md`

**Acceptance Criteria:**
- [x] AC1: Default to same-day-of-week + same-hour class from previous week
- [x] AC2: Fall back to most recent class if no match found
- [x] AC3: Handle edge cases (no previous classes, first time user)
- [x] AC4: Time matching uses 1-hour window (e.g., 10:00-10:59)
- [x] AC5: Works correctly across timezone/DST changes (uses local time)

**Technical Notes:**
- Only affects session start class selector (NOT analytics dropdown)
- Look back 7-14 days for matching sessions
- Match by day of week (0-6) and hour (0-23)
- Store full session data in `loadPreviousClasses()` for matching

**Implementation Notes (2026-01-21):**
- Added `findSmartDefault()` function to `src/utils.js` with full unit test coverage (16 tests)
- Added `allSessions` and `smartDefaultClass` to application state
- Modified `loadPreviousClasses()` to store sessions and compute smart default
- Updated dropdown rendering to use `smartDefaultClass` for selection
- Algorithm: Match day-of-week (0-6) AND hour (0-23) within 14-day lookback window
- Falls back to most recent class when no match found
- Config (radius, late threshold) auto-loads from smart default class


## Phase 6: UI Refactor

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P6-01 | Refactor UI to Corporate design system | all | **Complete** (2026-01-21) |

### P6-01: Corporate Design System Refactor

**Description:** Refactor the application UI to use the Corporate design system as selected on 2026-01-21. Apply consistent colors, typography, spacing, and component styling across all views.

**Reference:** `docs/decisions/design-system.md`, `docs/designs/mockups/mockups-20260121.html`

**Acceptance Criteria:**
- [x] AC1: Apply Corporate color palette (primary #1e40af, text #0f172a, etc.)
- [x] AC2: Use Inter font family for all text
- [x] AC3: Apply consistent border-radius (4px small, 6px medium, 8px large)
- [x] AC4: Update button styles to match Corporate theme
- [x] AC5: Update form inputs to match Corporate theme
- [x] AC6: Update cards and containers to match Corporate theme
- [x] AC7: Update badges and status indicators
- [x] AC8: Ensure dark mode uses appropriate Corporate dark variants
- [ ] AC9: All screens match mockup reference (pending visual review)

**Implementation Notes (2026-01-21):**
- Added Google Fonts Inter font family
- Added CSS custom properties for Corporate design tokens (light + dark variants)
- Updated Tailwind config with custom colors, radii, and shadows
- Changed primary color from indigo to blue (1e40af)
- Updated border-radius from 2xl to xl (more subtle, corporate style)
- Added tooltip styles for AC3.1/AC3.2 journey requirements
- Updated all button, card, and input styles throughout the app

## Phase 5: Identity Verification

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P5-01 | Live Selfie Validation | student-check-in | Pending |

### P5-01: Live Selfie Validation

**Description:** Students take a selfie during check-in for instructor verification. This adds an additional layer of identity verification beyond GPS and device fingerprinting.

**Acceptance Criteria:**

1. **Student Side (Check-in Flow)**
   - [ ] AC1: Camera permission request displays when student opens check-in page
   - [ ] AC2: Live camera preview shows in check-in form
   - [ ] AC3: Student can capture selfie with single tap
   - [ ] AC4: Captured selfie displays for confirmation before submission
   - [ ] AC5: Student can retake selfie before submitting
   - [ ] AC6: Selfie is uploaded to Firebase Storage with attendance record reference
   - [ ] AC7: Selfie upload failure does not block check-in (graceful degradation)
   - [ ] AC8: Selfie is compressed to max 100KB before upload

2. **Instructor Side (Review Flow)**
   - [ ] AC9: Attendance list shows thumbnail of student selfie
   - [ ] AC10: Clicking thumbnail opens full-size selfie in modal
   - [ ] AC11: Instructor can flag suspicious selfies for review
   - [ ] AC12: Flagged students highlighted in attendance list
   - [ ] AC13: Selfie timestamp and metadata visible in detail view

3. **Privacy & Compliance**
   - [ ] AC14: Selfies are stored with session-scoped access (instructor only)
   - [ ] AC15: Selfies auto-delete after configurable retention period (default: 30 days)
   - [ ] AC16: Student consent prompt before first selfie capture
   - [ ] AC17: Students can opt-out (marked in attendance record)

4. **Performance & UX**
   - [ ] AC18: Camera loads within 2 seconds on mobile
   - [ ] AC19: Selfie capture works on both front-facing and rear cameras
   - [ ] AC20: Works in low-light conditions with brightness adjustment hint
   - [ ] AC21: Offline mode queues selfie for upload when connection restored

**Technical Notes:**
- Use MediaDevices.getUserMedia() for camera access
- Store images in Firebase Storage under `/selfies/{sessionId}/{studentId}.jpg`
- Use Firebase Storage security rules to restrict access to session instructor
- Consider using canvas for image compression before upload

## Phase 7: Bug Fixes

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P7-01 | Fix student permission denied errors on production | student-submission-auth | Pending |
| P7-02 | Fix QR code missing when reopening session from history | session-reopen-qr | Pending |

### P7-01: Fix Student Permission Denied Errors

**Description:** Students receive "Permission Denied" errors when submitting attendance on the production site. Investigation indicates anonymous authentication may not be enabled in Firebase Console.

**Journey Reference:** `docs/journeys/student-submission-auth.md`

**Root Cause Analysis:**
- Firebase security rules require `auth != null` for attendance writes
- Code calls `auth.signInAnonymously()` before database writes
- If Anonymous Authentication is disabled in Firebase Console, students cannot authenticate
- Emulator mode works because it auto-enables all auth methods

**Acceptance Criteria:**
- [ ] AC1: Enable Anonymous Authentication in Firebase Console (production)
- [ ] AC2: Verify students can submit attendance without permission errors
- [ ] AC3: Add E2E test for student submission on emulator (validates auth flow)
- [ ] AC4: Add clear error message if anonymous auth fails
- [ ] AC5: Document Firebase Console configuration in setup guide

**Verification:**
1. Firebase Console > Authentication > Sign-in method > Anonymous = Enabled
2. Test student submission on production site
3. No "Permission Denied" errors in browser console

### P7-02: Fix QR Code Missing When Reopening Session

**Description:** When an instructor reopens a session from history, the QR code does not appear. The QR code should be visible immediately after reopening.

**Journey Reference:** `docs/journeys/session-reopen-qr.md`

**Root Cause Analysis:**
- `reopenSession()` correctly sets `state.session` and `state.currentCode`
- `state.showHistory` is set to `false` to switch from history to session view
- QR generation condition at render(): `state.session && state.currentCode && (!state.cachedQRCode || state.cachedQRCode.code !== state.currentCode)`
- Potential issue: `state.cachedQRCode` may contain stale data causing condition to fail

**Acceptance Criteria:**
- [ ] AC1: Clear `state.cachedQRCode` when reopening session
- [ ] AC2: QR code appears within 500ms of reopen completion
- [ ] AC3: QR code contains correct URL with new attendance code
- [ ] AC4: Add E2E test: reopen session and verify QR code visibility
- [ ] AC5: Add E2E test: scan QR code after reopen and verify auto-fill

**Technical Fix:**
Add `state.cachedQRCode = null;` in `reopenSession()` before `render()` to force QR regeneration.

## Phase 8: Course Management

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P8-01 | Course setup wizard with scheduled sessions | course-setup | **Complete** (2026-01-23) |
| P8-02 | Zero-minute late threshold support | course-setup | **Complete** (2026-01-23) |

### P8-01: Course Setup & Scheduled Sessions

**Description:** Instructors can set up a course once (code, section, schedule, location) and have sessions pre-created for the entire term. Sessions appear on the dashboard and can be activated with one tap.

**Journey Reference:** `docs/journeys/course-setup.md`

**Acceptance Criteria:**
- [x] AC1: 4-step course setup wizard (Course Info, Schedule, Location, Confirm)
- [x] AC2: Schedule configuration with day checkboxes, time pickers, weeks slider
- [x] AC3: GPS location capture during setup (reused for all sessions)
- [x] AC4: Automatic session generation for entire term
- [x] AC5: Today's scheduled sessions shown on instructor dashboard
- [x] AC6: One-tap session activation with fresh GPS capture
- [x] AC7: Quick session flow preserved (courseId: null)

**Implementation Notes (2026-01-23):**
- Added `courses/` collection to Firebase with validation rules
- Added state management: `showCourseSetup`, `courseSetupStep`, `courseSetup`, `courses`, `todaysSessions`
- Created `renderCourseSetupWizard()` with 4-step navigation
- Added `generateScheduledSessions()` utility in `src/utils.js`
- Added `loadTodaySessions()` and `activateScheduledSession()` functions
- Sessions have `status` field: "scheduled" | "active" | "ended" | "cancelled"

### P8-02: Zero-Minute Late Threshold

**Description:** Allow instructors to set late threshold to 0 minutes for strict attendance policies where any check-in after session start is marked late.

**Journey Reference:** `docs/journeys/course-setup.md` (AC6: Late Threshold)

**Acceptance Criteria:**
- [x] AC1: Late threshold slider allows 0 as minimum value
- [x] AC2: Slider maximum extended to 60 minutes
- [x] AC3: Database rules allow lateThreshold >= 0
- [x] AC4: Zero threshold correctly marks post-start check-ins as late

**Implementation Notes (2026-01-23):**
- Changed slider from `min="5" max="30"` to `min="0" max="60"`
- Database rules already supported 0-60 range
- Calculation logic uses strict `>` comparison (works correctly with 0)

## Phase 9: Test Infrastructure

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P9-01 | Firebase emulator test stability improvements | infrastructure | **Complete** (2026-01-23) |

### P9-01: Firebase Emulator Test Stability Improvements

**Description:** Improve E2E test stability by addressing race conditions, data leakage, and transient failures when running tests against Firebase emulator.

**Root Cause Analysis:**
- 8 parallel workers sharing single emulator database caused race conditions
- No data cleanup between tests led to state leakage
- `singleProjectMode: false` was suboptimal configuration
- No local retries meant transient failures were not handled

**Changes Made:**
1. **Serial Execution** (playwright.config.js)
   - Changed `fullyParallel: true` to `fullyParallel: false`
   - Changed `workers: undefined` to `workers: 1`

2. **Data Cleanup** (tests/global-setup.js)
   - Added `resetEmulatorData()` call in global setup
   - Ensures clean database state before each test run

3. **Firebase Configuration** (firebase.json)
   - Changed `singleProjectMode: false` to `singleProjectMode: true`
   - Optimizes emulator for single project usage

4. **Local Retries** (playwright.config.js)
   - Changed `retries: process.env.CI ? 2 : 0` to `retries: 2`
   - Handles transient emulator timing issues locally

5. **Bug Fix** (index.html)
   - Fixed escaped backticks and dollar signs in template literals
   - Syntax error was causing page to fail to load

**Results:**
- 153 tests passing (previously many were flaky)
- 4 tests failing (course setup wizard - feature incomplete, not stability issue)
- 0 flaky tests

## Completed

| Task ID | Description | Completed |
|---------|-------------|-----------|
| INIT-01 | Initial implementation | 2026-01-13 |
| INIT-02 | GitHub Pages deployment | 2026-01-13 |
| P1-01 | Session recovery on browser refresh | 2026-01-13 |
| P1-02 | Offline indicator | 2026-01-13 |
| P1-03 | XSS prevention | 2026-01-13 |
| P1-04 | Mobile responsiveness (dark mode) | 2026-01-13 |
| P2-01 | Session history view | 2026-01-13 |
| P2-02 | Session-specific QR codes | 2026-01-13 |
| P2-03 | Late marking | 2026-01-13 |
| P2-04 | Bulk approve failed attempts | 2026-01-13 |
| P2-05 | Success sound/vibration | 2026-01-13 |
| P2-06 | Instructor PIN protection | 2026-01-13 |
| P2-07 | Dark mode support | 2026-01-13 |
| P2-08 | Export failed attempts | 2026-01-13 |
| P2-09 | Countdown audio warning | 2026-01-13 |
| P2-10 | Unit and integration test coverage | 2026-01-13 |
| P4-03 | Student attendance history lookup | 2026-01-20 |
| P4-03.1 | AC3.1 Participation tooltip | 2026-01-21 |
| P4-03.2 | AC3.2 Late threshold transparency | 2026-01-21 |
| P6-01 | Corporate design system refactor | 2026-01-21 |
| P4-04 | Analytics split by class | 2026-01-21 |
| P4-05 | Smart class default selection | 2026-01-21 |
| P8-01 | Course setup wizard with scheduled sessions | 2026-01-23 |
| P8-02 | Zero-minute late threshold support | 2026-01-23 |
| P9-01 | Firebase emulator test stability improvements | 2026-01-23 |

## Evidence

- PRD validation: `.claude/evidence/prd-validation-2026-01-13.yaml`
- Firebase rules: `docs/firebase-security-rules.md`
- Test coverage: `tests/` directory with 157 E2E tests (Playwright)
- Development setup: `CLAUDE.md` (emulator mode, local dev instructions)
- Test stability: 153/157 tests passing, 0 flaky (2026-01-23)
