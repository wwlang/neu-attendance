# Journey: Instructor Runs Attendance Session

## Overview
An instructor starts a class session, displays a rotating attendance code, monitors student check-ins in real-time, handles failed attempts, and exports the final attendance list. Sessions can be reopened to allow late students to check in.

## Actor
University instructor/lecturer

## Preconditions
- Instructor has access to the attendance system URL
- Instructor is physically present in the classroom
- Instructor's device has location services enabled
- Instructor knows the PIN (230782)

## Trigger
Instructor needs to take attendance for a class session

## Flow

### 1. Access Instructor Mode
- Navigate to the attendance URL
- Select "I'm the Instructor" or use `?mode=teacher` URL parameter
- Enter PIN (230782) to access instructor dashboard

### 2. Configure Session
- Enter class name (e.g., "Business Communication - Section A")
- Set classroom radius (20-200m, default 50m)
- Set late threshold (5-30 minutes, default 10 minutes)
- Review pre-generated QR codes for student access

### 3. Start Session
- Click "Start Session"
- System captures instructor's GPS location as classroom center
- System generates first 6-character attendance code
- Code rotation timer begins (2-minute intervals)

### 4. Display QR Code to Students
- Large QR code displayed prominently (replaces text code as primary)
- QR encodes: `?mode=student&code=ABC123` (includes current attendance code)
- QR regenerates automatically when code rotates
- Fallback: Text code still visible for manual entry
- Timer shows time until next code/QR rotation
- Warning beeps at 10 seconds before rotation

### 5. Monitor Attendance (Real-time)
- Watch attendance list populate as students check in
- See student count, names, IDs, timestamps
- Review failed attempts panel for verification issues
- Statistics show: On Time / Late / Failed counts

### 6. Handle Failed Attempts
- Review students who failed location/code verification
- See failure reason (wrong code, too far, expired code)
- Manually approve legitimate students with GPS issues
- Bulk select and approve multiple students at once

### 7. End Session
- Click "End Session" when attendance is complete
- Export attendance to CSV if needed
- Session marked as ended but data preserved
- Session summary saved with attendance and late counts

### 8. Rejoin Session for Late Students
- From session history, select a recent session
- Click "Reopen for Late Check-ins"
- System requests location, generates new code
- QR code displayed again with same session ID
- Late students can scan and check in (marked as "Late" + "Rejoined")
- Click "Close" when done - session returns to ended state

## Acceptance Criteria

### AC1: Session Creation
- [x] Can enter descriptive class name (max 100 characters)
- [x] Can adjust radius from 20m to 200m
- [x] Can adjust late threshold from 5 to 30 minutes
- [x] System captures GPS coordinates on session start
- [x] Session is marked as active in Firebase

### AC2: QR Code Display & Rotation
- [x] Large QR code displayed as primary check-in method
- [x] QR encodes full URL with embedded code: `?mode=student&code=XXXXXX`
- [ ] QR regenerates automatically every 2 minutes with new code
- [x] Text code visible as fallback for manual entry
- [x] Countdown timer visible showing time until rotation
- [x] Vibration warning at 10 seconds before rotation (no audio to avoid disruption)
- [x] **QR library loads reliably** (CDN fallback implemented)

> **BUG FIXED (2026-01-15):** QRCode library now loads with CDN fallback chain.
> Primary: jsDelivr -> Fallback 1: unpkg -> Fallback 2: cdnjs
> Safe wrapper function `safeQRGenerate()` provides graceful degradation with fallback UI.
> Verified by integration tests: `qr-code.spec.js` tests.

### AC3: Real-time Attendance Tracking
- [x] New check-ins appear within 2 seconds
- [x] List shows student ID, name, email, timestamp
- [x] Count updates automatically
- [x] Most recent check-in highlighted
- [x] Success sound plays for new check-ins
- [x] Late badge displayed for late check-ins

### AC4: Failed Attempts Management
- [x] Failed attempts logged with reason
- [x] Shows student details, distance, allowed radius
- [x] "Approve" button moves student to attendance list
- [x] Approved students marked as manually approved
- [x] Select All / bulk approve functionality
- [x] Export failed attempts to CSV

### AC4.1: Duplicate Detection by Device ID
- [x] Same device ID cannot check in multiple students
- [x] Clear error message when device already used
- [ ] "Merge" option to consolidate duplicate entries (keeps correct student ID)
- [ ] Same device + same name = same student (ID typo detected)
- [ ] Alert shown: "Student X submitted with IDs: 11231006, 11231007 - same device"

### AC5: Data Export
- [x] CSV export includes all collected fields
- [x] Filename includes class name and date
- [x] UTF-8 encoding with BOM for Excel compatibility
- [x] Separate export for failed attempts
- [x] Late Check-in column for reopened session check-ins

### AC6: Session Lifecycle
- [x] Only one active session at a time
- [x] End session marks session as ended (not deleted)
- [x] Historical data persists in Firebase
- [x] Session recovery on browser refresh
- [x] Session history view with attendance counts

### AC7: Session Rejoin for Late Students
- [x] Session history shows recent sessions (last 7 days)
- [x] "Reopen for Late" button available for ended sessions
- [x] Reopened session generates new QR code with same session ID
- [x] Students checking in during reopen are marked as late
- [x] "Rejoined" badge displayed for late session check-ins
- [x] Instructor can close reopened session without losing data
- [x] "Reopened for Late Check-ins" badge in session header

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Location denied | Show error, prevent session start |
| Firebase connection lost | Show offline indicator, queue updates |
| Browser refresh mid-session | Session recovers automatically |
| Wrong PIN entered | Error message, retry allowed |
| Session ended by accident | Reopen from History within 7 days |

## Metrics
- Time to start session: < 10 seconds (including GPS acquisition)
- Code rotation reliability: 100%
- Real-time update latency: < 2 seconds
