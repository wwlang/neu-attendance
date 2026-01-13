# NEU Attendance - Issue Backlog

## Critical

_None currently identified_

## High Priority

_All high priority issues resolved_

### ~~ISS-001: No session recovery after page refresh~~ RESOLVED
**Description:** If instructor refreshes the browser mid-session, they lose connection to the active session and must start a new one.
**Resolution:** Session ID stored in sessionStorage, automatic recovery on page load.
**Completed:** 2026-01-13

### ~~ISS-002: Firebase security rules may be too permissive~~ DOCUMENTED
**Description:** Need audit of Firebase Realtime Database rules to ensure students can't read/write arbitrary data.
**Resolution:** Security rules documented in `docs/firebase-security-rules.md` with recommended rules.
**Completed:** 2026-01-13

## Medium Priority

### ~~ISS-003: No feedback when Firebase connection lost~~ RESOLVED
**Description:** If network drops, UI doesn't indicate offline status. Updates silently fail.
**Resolution:** Added offline banner with browser online/offline detection and Firebase connection state monitoring.
**Completed:** 2026-01-13

### ISS-004: Device fingerprint can be spoofed
**Description:** Browser-based fingerprinting is client-side and can be manipulated by tech-savvy students.
**Impact:** Students could potentially bypass device uniqueness check
**Mitigation:** Accept as known limitation; manual approval flow exists for edge cases
**Status:** Won't Fix - By Design

### ISS-005: GPS accuracy varies significantly indoors
**Description:** Indoor GPS can be off by 20-100m, causing legitimate students to fail location check.
**Impact:** More failed attempts requiring manual approval
**Mitigation:**
- Manual approval flow exists
- Instructor can adjust radius
- Added "poor signal" warning when accuracy > 50m
**Status:** Mitigated

## Low Priority

### ISS-006: QR code doesn't include session-specific data
**Description:** QR code just links to student mode URL, not specific session. Students need to enter code manually.
**Enhancement:** Could include session ID or current code in QR
**Related:** P2-01

### ISS-007: No dark mode support
**Description:** UI is light-only, may be uncomfortable in dimly lit classrooms
**Impact:** Minor UX issue

### ISS-008: CSV export only includes successful check-ins
**Description:** Failed attempts are viewable but not exportable
**Impact:** Incomplete audit trail
**Related:** P3-04

### ISS-009: Session end while students checking in
**Description:** If instructor ends session while student is mid-submission, student sees generic error
**Enhancement:** Could show friendlier "session has ended" message
**Status:** Improved - better error message added

## Won't Fix / By Design

### WF-001: Single active session limitation
**Reason:** By design - prevents confusion about which session students should join

### WF-002: No authentication for instructors
**Reason:** Intentional simplicity - URL-based access. Security via obscurity acceptable for classroom use.

### WF-003: Device fingerprint spoofing (ISS-004)
**Reason:** Client-side fingerprinting has inherent limitations. Manual approval flow handles edge cases.

## Resolved Issues Log

| Issue | Description | Resolution Date | Notes |
|-------|-------------|-----------------|-------|
| ISS-001 | Session recovery | 2026-01-13 | sessionStorage-based recovery |
| ISS-002 | Security rules | 2026-01-13 | Documentation with recommendations |
| ISS-003 | Offline indicator | 2026-01-13 | Banner with connection monitoring |
