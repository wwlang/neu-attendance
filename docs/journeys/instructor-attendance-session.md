# Journey: Instructor Runs Attendance Session

## Overview
An instructor starts a class session, displays a rotating attendance code, monitors student check-ins in real-time, handles failed attempts, tracks student participation, and exports the final attendance list. Sessions can be reopened to allow late students to check in.

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
- Set classroom radius (20-500m, **default 300m**)
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
- See student count, names, IDs, timestamps, **location indicator (Loc column)**
- **Track participation with +/- buttons for each student**
- Review failed attempts panel for verification issues
- Statistics show: On Time / Late / Failed counts

### 6. Track Student Participation
- Each student in attendance list has +/- buttons in Participation column
- Click "+" to increment participation count (no limit)
- Click "-" to decrement participation count (minimum 0)
- Participation updates in real-time via Firebase
- Use to track class contributions, questions answered, etc.

### 7. Handle Failed Attempts
- Review students who failed location/code verification
- See failure reason (wrong code, too far, expired code)
- Manually approve legitimate students with GPS issues
- Bulk select and approve multiple students at once

### 8. End Session
- Click "End Session" when attendance is complete
- Export attendance to CSV if needed (includes participation counts)
- Session marked as ended but data preserved
- Session summary saved with attendance and late counts

### 9. Rejoin Session for Late Students
- From session history, select a recent session
- Click "Reopen for Late Check-ins"
- System requests location, generates new code
- QR code displayed again with same session ID
- Late students can scan and check in (marked as "Late" + "Rejoined")
- Click "Close" when done - session returns to ended state

### 10. View & Manage Session History
- Click "View History" from instructor dashboard
- Toggle "Show All" to see sessions older than 7 days
- Click any session to view full attendance details
- Session detail shows: student list, timestamps, late badges, device IDs, **participation counts**
- Export attendance CSV from any historical session
- Edit attendance: remove entries, add manual entries, fix typos
- **Edit session names** via pencil icon next to class name
- **Archive sessions** to hide them from main view

### 11. Edit Attendance Records
- From session detail view, click "Edit" on any student entry
- Options: Edit details, Remove entry, Add note
- "Add Student" button for manual entries (missed QR scan)
- All changes logged with timestamp for audit trail
- Confirmation required for deletions

### 12. Edit Session Names
- From history view, click pencil icon next to any session name
- Modal opens with current session name pre-filled
- Enter new name (max 100 characters)
- Click "Save" to update or "Cancel" to discard
- Changes are logged to audit trail

### 13. Archive/Unarchive Sessions
- From history view, click archive icon (box-archive) on any session card
- Archived sessions are hidden from main history view by default
- Toggle "Show Archived" to view archived sessions
- Archived sessions display "Unarchive" button instead of "Archive"
- Click "Unarchive" to restore session to main view
- Can also archive/unarchive from session detail view

## Session Settings Reference

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Classroom Radius | 20-500m | **300m** | Maximum distance from instructor for valid check-in |
| Late Threshold | 5-30 min | 10 min | Time after session start before check-ins marked late |
| Code Rotation | Fixed | 120s | New attendance code generated every 2 minutes |
| Code Grace Period | Fixed | **180s** | Previous code remains valid for 3 minutes after rotation |
| Recently Expired Window | Fixed | **30s** | Codes that just expired are accepted within 30 seconds |

## Location Handling

**Location is now optional** for student check-ins:
- Students can check in without location permission
- If location is provided, distance from instructor is verified
- **Loc column** in attendance table shows location status:
  - Checkmark (green): Location verified
  - Dash (yellow): No location data provided
- CSV export includes: Latitude, Longitude, Distance, Location Provided columns

## Acceptance Criteria

### AC1: Session Creation
- [x] Can enter descriptive class name (max 100 characters)
- [x] Can adjust radius from 20m to **500m** (default **300m**)
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
- [x] List shows student ID, name, email, timestamp, **location indicator (Loc column)**
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
- [x] **CSV includes location columns**: Latitude, Longitude, Distance, Location Provided
- [x] **CSV includes Participation column** with count per student
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

### AC8: Session History Management
**View historical sessions and manage attendance records.**

- [x] Click any session in history to view full attendance list
- [x] Session detail view shows: all students, timestamps, late status, device IDs, **participation counts**
- [x] "Show All Sessions" toggle to view sessions older than 7 days
- [x] Search/filter sessions by class name or date
- [x] Export CSV from any historical session (not just active)

> **IMPLEMENTED (2026-01-15):** Session history now includes:
> - Clickable sessions that open a detailed view
> - Full attendance table with Device ID column
> - "Show All Sessions" checkbox toggle
> - Search/filter input for class name or date
> - Export CSV button in session detail view

### AC9: Edit Attendance Records
**Modify attendance data for corrections and manual adjustments.**

- [x] Remove incorrect attendance entries (with confirmation)
- [x] Manually add student to attendance (name, ID, email, mark as "Manual Entry")
- [x] Edit student details (fix typos in name/ID/email)
- [x] Add notes to attendance record (e.g., "Approved by instructor")
- [x] Audit trail: changes logged with timestamp and reason

> **IMPLEMENTED (2026-01-15):** Edit attendance features include:
> - "Add Student" button opens modal for manual entry
> - Edit/Note/Remove buttons on each attendance row
> - Note indicator (emoji) shown next to student names with notes
> - Confirmation prompt with reason required for deletions
> - All changes logged to `audit/{sessionId}` in Firebase with timestamp

### AC10: Code Grace Period & Recently Expired Handling
**Improved code acceptance for better student experience.**

- [x] Previous code accepted within **180 second** grace period after rotation
- [x] **Recently expired codes** accepted within **30 seconds** of expiration
- [x] Clear error message for truly expired codes
- [x] Grace period prevents students from failing due to network latency

> **UPDATED (2026-01-20):** Code acceptance windows:
> - Current code: Always valid
> - Previous code: Valid for 180s after new code generated
> - Recently expired: Valid for 30s after expiration (covers edge cases)

### AC11: Edit Session Names
**Rename sessions from history view for better organization.**

- [x] Pencil icon (edit button) displayed next to session name in history list
- [x] Click opens modal with current name pre-filled
- [x] Can edit session name (max 100 characters)
- [x] Save updates `className` in Firebase
- [x] Cancel closes modal without changes
- [x] Audit trail: name change logged with old/new values and timestamp

> **IMPLEMENTED (2026-01-20):** Edit session name features include:
> - Pencil icon button on each session card in history view
> - Modal with pre-filled current session name
> - Save/Cancel buttons with validation
> - Changes logged to `audit/{sessionId}` with EDIT_SESSION_NAME action
> - Local state updated immediately for responsive UI

### AC12: Archive/Unarchive Sessions
**Hide sessions from main history view for better organization.**

- [x] Archive button (box-archive icon) displayed on each session card in history view
- [x] Clicking archive sets `archived: true` in Firebase for that session
- [x] Archived sessions are hidden from main history view by default
- [x] "Show Archived" toggle/filter to display archived sessions
- [x] Archived sessions show "Unarchive" button instead of "Archive"
- [x] Clicking unarchive sets `archived: false` in Firebase
- [x] Archive/unarchive also available from session detail view
- [x] Active sessions cannot be archived (must end first)
- [x] Search/filter still works on archived sessions when shown

> **IMPLEMENTED (2026-01-20):** Archive/unarchive features include:
> - Archive button (box-archive icon) on each ended session card in history view
> - "Show Archived" toggle checkbox to display archived sessions
> - Archived sessions show with "Archived" badge and faded opacity
> - Unarchive button on archived sessions (both in list and detail view)
> - Archive/Unarchive buttons in session detail view header
> - All changes logged to `audit/{sessionId}` with ARCHIVE_SESSION/UNARCHIVE_SESSION action
> - Active sessions cannot be archived (archive button not shown)

### AC13: Participation Counter
**Track student participation during sessions with +/- buttons.**

- [x] Participation column visible in attendance list during active sessions
- [x] Each student row has +/- buttons and participation count display
- [x] Clicking "+" increments participation count by 1
- [x] Clicking "-" decrements participation count by 1 (minimum 0)
- [x] Participation count defaults to 0 for new check-ins
- [x] Participation updates in real-time via Firebase
- [x] Participation column visible in session history detail view
- [x] Participation included in CSV export (active session and history)

> **IMPLEMENTED (2026-01-20):** Participation counter features include:
> - Participation column with +/- buttons in active session attendance list
> - Real-time Firebase updates via `incrementParticipation` and `decrementParticipation` functions
> - Participation count stored at `/attendance/{sessionId}/{odooId}/participation`
> - Participation column displayed in session detail view (read-only)
> - CSV exports include Participation column for both active and historical sessions
> - Integration tests verify all functionality: `participation-counter.spec.js`


## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Location denied | Show error, prevent session start |
| Firebase connection lost | Show offline indicator, queue updates |
| Browser refresh mid-session | Session recovers automatically |
| Wrong PIN entered | Error message, retry allowed |
| Session ended by accident | Reopen from History within 7 days |
| Student location denied | Allow check-in, mark "No location" in Loc column |

## Friction Analysis

### Interaction Count

| Flow | Interactions | Target | Status |
|------|-------------:|-------:|--------|
| Start session (default settings) | 4 | ≤5 | Pass |
| Start session (custom settings) | 6 | ≤8 | Pass |
| Reopen session | 3 | ≤3 | Pass |
| Export attendance | 2 | ≤3 | Pass |
| Approve failed attempt | 2 | ≤3 | Pass |
| Edit session name | 3 | ≤5 | Pass |

_Start session: Select instructor → Enter PIN → Enter class name → Click Start (+ optional settings)_

### Friction Score

| Dimension | Score | Notes |
|-----------|------:|-------|
| Cognitive load | 1 | Multiple features visible, but progressive disclosure |
| Input effort | 1 | PIN + class name required; settings optional |
| Wait time | 1 | GPS acquisition may take 1-3s |
| Error risk | 1 | PIN retry allowed; accidental end recoverable |
| Permission ask | 1 | Location required upfront (justified for verification) |
| **Total** | **5** | Acceptable (5-7) |

### Permission Timing

| Permission | Trigger | Fallback if Denied |
|------------|---------|-------------------|
| Location | On session start | Cannot start session (required for verification center) |

_Note: Location is mandatory for instructors as it establishes the classroom center point for student verification._

## Metrics
- Time to start session: < 10 seconds (including GPS acquisition)
- Code rotation reliability: 100%
- Real-time update latency: < 2 seconds
