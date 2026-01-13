# NEU Attendance - Roadmap

## Current State
Single-page HTML application with Firebase backend. Core functionality complete with enhanced features:
- Rotating attendance codes with session-specific QR
- GPS verification with late marking
- Device fingerprinting
- Real-time attendance tracking
- Failed attempt logging and bulk approval
- Session history
- CSV export (attendance + failed attempts)
- Dark mode support
- Instructor PIN protection
- **Unit and integration test coverage**

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
| P4-03 | Student attendance history lookup | student-check-in | Pending |

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

## Evidence

- PRD validation: `.claude/evidence/prd-validation-2026-01-13.yaml`
- Firebase rules: `docs/firebase-security-rules.md`
- Test coverage: `tests/` directory with 46 unit tests and 48 integration tests
