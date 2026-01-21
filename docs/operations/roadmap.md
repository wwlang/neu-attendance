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
- **95 E2E tests with Firebase emulator isolation**

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

## Evidence

- PRD validation: `.claude/evidence/prd-validation-2026-01-13.yaml`
- Firebase rules: `docs/firebase-security-rules.md`
- Test coverage: `tests/` directory with 95 E2E tests (Playwright)
- Development setup: `CLAUDE.md` (emulator mode, local dev instructions)
