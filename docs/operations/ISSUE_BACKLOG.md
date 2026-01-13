# NEU Attendance - Issue Backlog

## Critical

_None currently identified_

## High Priority

### ISS-001: No session recovery after page refresh
**Description:** If instructor refreshes the browser mid-session, they lose connection to the active session and must start a new one.
**Impact:** Disrupts attendance taking, confuses students
**Related:** P1-01

### ISS-002: Firebase security rules may be too permissive
**Description:** Need audit of Firebase Realtime Database rules to ensure students can't read/write arbitrary data.
**Impact:** Potential data tampering or privacy breach
**Related:** P3-01

## Medium Priority

### ISS-003: No feedback when Firebase connection lost
**Description:** If network drops, UI doesn't indicate offline status. Updates silently fail.
**Impact:** Instructor thinks attendance is recording when it's not
**Related:** P1-02

### ISS-004: Device fingerprint can be spoofed
**Description:** Browser-based fingerprinting is client-side and can be manipulated by tech-savvy students.
**Impact:** Students could potentially bypass device uniqueness check
**Mitigation:** Accept as known limitation; manual approval flow exists for edge cases

### ISS-005: GPS accuracy varies significantly indoors
**Description:** Indoor GPS can be off by 20-100m, causing legitimate students to fail location check.
**Impact:** More failed attempts requiring manual approval
**Mitigation:** Manual approval flow exists; instructor can adjust radius

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

## Won't Fix / By Design

### WF-001: Single active session limitation
**Reason:** By design - prevents confusion about which session students should join

### WF-002: No authentication for instructors
**Reason:** Intentional simplicity - URL-based access. Security via obscurity acceptable for classroom use.
