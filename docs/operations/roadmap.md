# NEU Attendance - Roadmap

## Current State
Single-page HTML application with Firebase backend. Core functionality complete:
- Rotating attendance codes
- GPS verification
- Device fingerprinting
- Real-time attendance tracking
- Failed attempt logging and manual approval
- CSV export

## Phase 1: Stability & Polish (Current)

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P1-01 | Session reconnection on browser refresh | instructor-attendance-session | **Complete** (2026-01-13) |
| P1-02 | Offline indicator and graceful degradation | both | **Complete** (2026-01-13) |
| P1-03 | Input sanitization for XSS prevention | student-check-in | **Complete** (2026-01-13) |
| P1-04 | Improve mobile responsiveness | both | Pending |

## Phase 2: Enhanced Features

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P2-01 | Session history view for instructors | instructor-attendance-session | Pending |
| P2-02 | Student self-lookup of attendance history | student-check-in | Pending |
| P2-03 | Configurable code rotation interval | instructor-attendance-session | Pending |
| P2-04 | Multiple simultaneous sessions support | instructor-attendance-session | Pending |

## Phase 3: Security & Compliance

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P3-01 | Firebase security rules audit | both | **Documented** (2026-01-13) - See docs/firebase-security-rules.md |
| P3-02 | Rate limiting on check-ins | student-check-in | **Partial** - Client-side debounce added |
| P3-03 | Data retention policy implementation | both | Pending |
| P3-04 | GDPR-compliant data export | instructor-attendance-session | Pending |

## Phase 4: Analytics & Reporting

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P4-01 | Attendance trends dashboard | instructor-attendance-session | Pending |
| P4-02 | Late arrival tracking | both | Pending |
| P4-03 | Course-level attendance aggregation | instructor-attendance-session | Pending |

## Completed

| Task ID | Description | Completed |
|---------|-------------|-----------|
| INIT-01 | Initial implementation | 2026-01-13 |
| INIT-02 | GitHub Pages deployment | 2026-01-13 |
| P1-01 | Session recovery on browser refresh | 2026-01-13 |
| P1-02 | Offline indicator | 2026-01-13 |
| P1-03 | XSS prevention | 2026-01-13 |

## Evidence

- PRD validation: `.claude/evidence/prd-validation-2026-01-13.yaml`
- Firebase rules: `docs/firebase-security-rules.md`
