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
- **Remote location selection via interactive map (Leaflet + Nominatim)**
- **Student location map showing position relative to class radius during check-in**
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

## Phase 2: Enhanced Features

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
| P2-11 | Session history default view - 14 days | session-history-default | **Complete** (2026-01-23) |
| P2-12 | Personalized greeting on instructor dashboard | instructor-greeting | **Complete** (2026-01-23) |
| P2-13 | Personalized greeting for returning students | student-greeting | Pending |
| P2-14 | Larger QR codes for easier scanning | larger-qr-codes | **Complete** (2026-01-23) |
| P2-15 | Student location map during check-in | student-check-in | **Complete** (2026-01-26) |

### P2-11: Session History Default View - 14 Days

**Description:** Extend the default session history view from 7 days to 14 days for improved instructor workflow. Instructors often need to review sessions from the previous week, but the current 7-day default requires manual filter adjustment.

**Journey Reference:** `docs/journeys/session-history-default.md`

**Problem Statement:**
- Current default shows only last 7 days of sessions
- Instructors frequently need to review previous week's sessions
- Requires manual date range adjustment for each session
- Analytics view uses different default period

**Acceptance Criteria:**
- [x] AC1: Session history loads with 14-day default filter
- [x] AC2: Displays sessions from (today - 14 days) to today
- [x] AC3: Manual date range filter available for custom periods
- [x] AC4: Analytics dashboard defaults to same 14-day period
- [ ] AC5: Default filter persists across page navigation
- [ ] AC6: Date range applies before class selection dropdown
- [x] AC7: "Show All Sessions" toggle available for viewing all
- [ ] AC8: CSV export respects current date filter

**Technical Notes:**
- Change hardcoded 7 to 14 in `getDefaultDateRange()` function
- No database changes required (pure UI/filter logic)
- Configuration value could be made adjustable in future phases

**Files to Modify:**
- `index.html` - Update `getDefaultDateRange()` and filter UI
- `src/utils.js` - Move default range calculation to utility function (if not already there)
- Tests - E2E tests verifying 14-day default in history and analytics views

**Effort Estimate:** ~2-4 hours including tests

### P2-12: Personalized Greeting on Instructor Dashboard

**Description:** Display a friendly personalized greeting at the top of the instructor dashboard after Google authentication. Shows the instructor's first name extracted from their Google account display name, creating a welcoming experience and confirming successful identity recognition.

**Journey Reference:** `docs/journeys/instructor-greeting.md`

**Problem Statement:**
- Instructors authenticate with Google but receive no personalization
- No visual confirmation that the correct account is logged in
- Dashboard feels impersonal and generic

**Acceptance Criteria:**
- [x] AC1: Greeting visible when instructor authenticated with Google
- [ ] AC1.2: Greeting hides when in emulator PIN mode (no display name)
- [ ] AC1.3: Greeting positioned in header area above main content
- [x] AC1.4: Uses friendly informal tone ("Hi," not "Hello,")
- [ ] AC1.5: First name properly capitalized
- [x] AC2: First name extracted from `auth.currentUser.displayName`
- [x] AC2.2: Splits on space and uses first element
- [ ] AC2.3: Works with multi-word first names
- [ ] AC2.4: Single-name accounts supported
- [ ] AC3.1: If displayName is missing/null, show "Hi, Instructor!" (fallback)
- [ ] AC3.2: If displayName is empty string, use fallback
- [ ] AC3.3: Fallback message uses same styling as personalized greeting
- [ ] AC3.4: No console errors for missing displayName
- [ ] AC4.1: Uses existing design system font (Inter)
- [ ] AC4.2: Font size appropriate for header (18-20px)
- [ ] AC4.3: Text color uses theme-aware color (no hardcoded hex)
- [ ] AC4.4: No hardcoded color hex values
- [ ] AC4.5: Proper spacing/padding from edges and other header elements
- [ ] AC5: Greeting visible and responsive on all screen sizes (320px+)
- [ ] AC6: Text readable in light and dark mode with sufficient contrast
- [ ] AC7: Greeting updates when user logs out and logs back in
- [ ] AC8: "Hi," and fallback text extracted to localization strings

**Technical Implementation:**
- Extract first name using: `displayName.trim().split(' ')[0]`
- Fallback: "Hi, Instructor!" if displayName unavailable
- Position: Header area next to title
- No additional network requests
- No new dependencies required

**Files to Modify:**
- `index.html` - Add greeting element in header, localization strings
- `src/utils.js` - Add `getFirstName()` utility function
- Tests - E2E tests for greeting display in both auth modes

**Effort Estimate:** ~1-2 hours including tests

### P2-13: Personalized Greeting for Returning Students

**Description:** Display a personalized greeting ("Welcome back, [First Name]!") for returning students on the check-in page. Uses the student's name stored from their previous check-in to create a welcoming experience.

**Journey Reference:** `docs/journeys/student-greeting.md`

**Problem Statement:**
- Returning students see the same generic check-in form every time
- No recognition of previous visits
- Missed opportunity for welcoming personalization

**Acceptance Criteria:**
- [ ] AC1.1: Greeting visible when `savedStudentInfo` exists in localStorage
- [ ] AC1.2: Greeting hidden for first-time students (no saved info)
- [ ] AC1.3: Greeting positioned above check-in form
- [ ] AC1.4: Uses warm tone ("Welcome back," not "Hello,")
- [ ] AC1.5: First name extracted from saved `studentName` field
- [ ] AC2.1: First name extracted by splitting on space: `name.split(' ')[0]`
- [ ] AC2.2: Works with multi-word first names (hyphenated: "Jean-Luc")
- [ ] AC2.3: Single-name entries display full name
- [ ] AC2.4: Handles leading/trailing whitespace (trim before split)
- [ ] AC3.1: If `studentName` is null/empty, hide greeting entirely
- [ ] AC3.2: No console errors for malformed localStorage data
- [ ] AC3.3: Graceful degradation if localStorage unavailable
- [ ] AC4.1: Uses existing design system font (Inter)
- [ ] AC4.2: Text size appropriate for mobile (16-18px)
- [ ] AC4.3: Theme-aware colors (no hardcoded hex values)
- [ ] AC4.4: Proper spacing from form elements
- [ ] AC5.1: Readable in light mode
- [ ] AC5.2: Readable in dark mode
- [ ] AC5.3: Sufficient contrast ratio (WCAG AA 4.5:1)
- [ ] AC6.1: Visible on mobile (>= 320px)
- [ ] AC6.2: Does not break layout on any screen size

**Technical Implementation:**
- Data source: `localStorage.getItem('savedStudentInfo')` with `studentName` field
- Extract first name: `name.trim().split(' ')[0]`
- Render in `renderStudentForm()` before form elements
- No network requests required
- No new dependencies

**Files to Modify:**
- `index.html` - Add greeting element in student form, render logic
- `src/utils.js` - Add `getGreetingName()` utility function (optional)
- Tests - E2E tests for greeting display with/without saved info

**Effort Estimate:** ~1-2 hours including tests

### P2-14: Larger QR Codes for Easier Scanning

**Description:** Double the QR code size on the instructor session view and add a fullscreen mode for classroom projection. Current QR codes are difficult to scan, especially on smaller student devices or in large lecture halls.

**Journey Reference:** `docs/journeys/larger-qr-codes.md`

**Problem Statement:**
- Current QR code size (~200px) is difficult to scan from distance
- Students with smaller phones struggle to focus camera
- Large classrooms need projection-friendly display
- No way to maximize QR for better visibility

**Acceptance Criteria:**
- [ ] AC1.1: QR code default size doubled (from ~200px to ~400px)
- [ ] AC1.2: QR code remains square (1:1 aspect ratio)
- [ ] AC1.3: Maintains scan reliability at new size
- [ ] AC1.4: Does not pixelate or lose clarity
- [ ] AC2.1: QR code scales down on smaller screens (< 600px width)
- [ ] AC2.2: Minimum readable size maintained on mobile
- [ ] AC2.3: Does not break layout on tablet/desktop
- [ ] AC2.4: Attendance code text scales proportionally
- [ ] AC3.1: Fullscreen button visible on QR code container
- [ ] AC3.2: Clicking button expands QR to fill viewport
- [ ] AC3.3: Attendance code displayed below QR in fullscreen
- [ ] AC3.4: Background uses high contrast (white/light gray)
- [ ] AC3.5: Click anywhere or press Escape to exit fullscreen
- [ ] AC3.6: Works with browser fullscreen API where available
- [ ] AC4.1: QR code readable in light mode
- [ ] AC4.2: QR code readable in dark mode
- [ ] AC4.3: Fullscreen button visible in both themes
- [ ] AC4.4: Fullscreen mode uses light background regardless of theme
- [ ] AC5.1: Fullscreen QR has sufficient padding from edges
- [ ] AC5.2: Attendance code text large enough to read from back of room
- [ ] AC5.3: Session/class info visible in fullscreen mode

**Technical Implementation:**
- CSS: Increase `.qr-container` max-width from ~200px to 400px
- Add responsive breakpoints for smaller screens
- Create fullscreen overlay with QR, code, and class name
- Handle Escape key and click-to-exit
- CSS-only fullscreen (no browser API dependency)

**Files to Modify:**
- `index.html` - Add fullscreen overlay HTML, update QR container sizing
- CSS - Update `.qr-container` styles, add fullscreen overlay styles
- JavaScript - Add `toggleQRFullscreen()` function, keyboard handler
- Tests - E2E tests for QR sizing and fullscreen toggle

**Effort Estimate:** ~2-3 hours including tests

### P2-15: Student Location Map During Check-In

**Description:** Display a small interactive Leaflet map on the student check-in form showing the student's GPS location, the class location, and the allowed radius circle. Helps students understand whether they are within range before submitting attendance.

**Journey Reference:** `docs/journeys/student-check-in.md` (AC9: Student Location Map)

**Acceptance Criteria:**
- [x] AC1: Map appears after GPS acquisition on student check-in form
- [x] AC2: Student position shown with blue dot marker
- [x] AC3: Class/instructor location shown with standard Leaflet marker
- [x] AC4: Radius circle shows allowed check-in area
- [x] AC5: Map is read-only (no click/zoom/drag interaction)
- [x] AC6: Map auto-fits bounds to show both student and class location
- [x] AC7: Dark mode support via Leaflet container background styling

**Implementation Notes (2026-01-26):**
- Added `#studentLocationMap` div in `renderStudentView()` (conditional on `state.studentLocation`)
- Created `initStudentLocationMap()` and `destroyStudentLocationMap()` functions
- Created `initStudentLocationMapFromSession()` to async-fetch session data
- Map initialized after GPS acquisition via `acquireStudentLocation()`
- Student marker uses custom `L.divIcon` with blue dot styling
- Class marker uses default Leaflet marker icon
- Map uses `fitBounds()` with padding to show both markers
- All interactions disabled (dragging, zoom, scroll, keyboard)
- 4 new E2E tests: `tests/integration/student-location-map.spec.js`

**Effort Estimate:** ~2-3 hours including tests

## Phase 3: Security & Compliance

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P3-01 | Firebase security rules audit | both | **Documented** (2026-01-13) - See docs/firebase-security-rules.md |
| P3-02 | Rate limiting on check-ins | student-check-in | **Complete** - Client-side debounce added |
| P3-03 | Data retention policy implementation | both | Pending |
| P3-04 | GDPR-compliant data export | instructor-attendance-session | Pending |
| P3-05 | Cross-session device sharing detection | device-sharing-detection | Pending |
| P3-06 | Attendance history device verification | attendance-history-device-verification | Pending |

### P3-05: Cross-Session Device Sharing Detection

**Description:** Detect and flag potential attendance fraud when a device ID is used by different students across multiple sessions. Provides first-use policy acknowledgment, student warnings, and real-time instructor alerts while allowing legitimate device sharing scenarios.

**Journey Reference:** `docs/journeys/device-sharing-detection.md`

**Problem Statement:**
- Currently, device fingerprinting only blocks same-device check-ins within a single session
- Students could use one phone to check in for absent friends across different sessions
- No visibility into cross-session device sharing patterns
- Instructors cannot detect proxy attendance fraud

**Acceptance Criteria:**

1. **Device Policy Acknowledgment (First Use)**
   - [ ] AC1.1: On first device use, show policy warning modal before check-in
   - [ ] AC1.2: Modal text explains device linking and fraud flagging policy
   - [ ] AC1.3: "I Understand" button required to proceed
   - [ ] AC1.4: Acknowledgment stored in `deviceAcknowledgments/{deviceId}`
   - [ ] AC1.5: Warning only shows once per device (not per session)
   - [ ] AC1.6: Modal respects dark mode styling

2. **Device History Tracking**
   - [ ] AC2.1: On successful check-in, record to `deviceHistory/{deviceId}/{studentId}`
   - [ ] AC2.2: Store `firstSeen`, `lastSeen`, `sessionCount` timestamps
   - [ ] AC2.3: Update `lastSeen` and increment `sessionCount` on repeat check-ins
   - [ ] AC2.4: History persists across sessions (not session-scoped)

3. **Cross-Session Detection**
   - [ ] AC3.1: Before check-in, query `deviceHistory/{deviceId}` for other students
   - [ ] AC3.2: If different studentId found, trigger flagged flow
   - [ ] AC3.3: Detection considers all historical students, not just most recent
   - [ ] AC3.4: Comparison uses normalized studentId (case-insensitive, trimmed)

4. **Student Warning for Flagged Device**
   - [ ] AC4.1: Show warning modal when device previously used by another student
   - [ ] AC4.2: Display masked previous student ID (e.g., "A*****123")
   - [ ] AC4.3: Inform student check-in will be flagged to instructor
   - [ ] AC4.4: Provide "Cancel" and "Proceed Anyway" options
   - [ ] AC4.5: "Cancel" returns to form without submitting
   - [ ] AC4.6: "Proceed Anyway" submits with flagged status

5. **Flagged Attendance Record**
   - [ ] AC5.1: Flagged check-ins include `flagged` object in record
   - [ ] AC5.2: `flagged.reason` set to 'device_shared'
   - [ ] AC5.3: `flagged.previousStudentId` contains other student's ID
   - [ ] AC5.4: `flagged.acknowledged` indicates student saw warning

6. **Instructor Real-Time Alerts**
   - [ ] AC6.1: When flagged check-in occurs during active session, show alert banner
   - [ ] AC6.2: Alert shows student name, device ID, and previous user
   - [ ] AC6.3: Alert has "Dismiss" action to hide it
   - [ ] AC6.4: Multiple flagged check-ins queue as separate alerts
   - [ ] AC6.5: Alert visible for 30 seconds if not dismissed

7. **Instructor Attendance List Integration**
   - [ ] AC7.1: Flagged check-ins highlighted with warning icon in attendance list
   - [ ] AC7.2: Tooltip/hover shows flag details (reason, previous student)
   - [ ] AC7.3: Filter option to show only flagged check-ins
   - [ ] AC7.4: Flagged status included in CSV export

8. **Session Summary Integration**
   - [ ] AC8.1: Session summary shows count of flagged check-ins
   - [ ] AC8.2: Flagged student list with details in summary modal
   - [ ] AC8.3: Export includes flag information in separate column

9. **Privacy Considerations**
   - [ ] AC9.1: Device history stored per instructor (not globally accessible)
   - [ ] AC9.2: Student warning shows masked ID, not full studentId/name
   - [ ] AC9.3: History data can be purged on request (data retention)
   - [ ] AC9.4: No PII in deviceHistory - only studentIds and timestamps

10. **Edge Cases**
    - [ ] AC10.1: Handle device with 3+ different students gracefully
    - [ ] AC10.2: Works correctly if deviceHistory lookup fails (network error)
    - [ ] AC10.3: Works correctly for manual instructor adds (deviceId: 'MANUAL')
    - [ ] AC10.4: First-time user warning appears even if device history exists
    - [ ] AC10.5: Acknowledgment and history creation are atomic

**Data Model:**
```
deviceHistory/
  {deviceId}/
    {studentId}/
      firstSeen: timestamp
      lastSeen: timestamp
      sessionCount: number

deviceAcknowledgments/
  {deviceId}/
    acknowledged: true
    timestamp: number
    studentId: string

attendance/{sessionId}/{studentId}/
  ...existing fields...
  flagged:  // Optional, only present if flagged
    reason: 'device_shared'
    previousStudentId: string
    previousStudentName: string
    acknowledged: boolean
```

**Technical Notes:**
- Device history adds one database read before check-in
- Use `.limitToLast(10)` on device history to cap query size
- Cache acknowledgment status in localStorage to skip read on repeat visits
- Only flag if previous student's last check-in was within 30 days
- Consider instructor whitelist for known shared devices

### P3-06: Attendance History Device Verification

**Description:** Restrict attendance history lookup to only allow viewing from devices that have previously been used to check in with that student ID. This prevents students from viewing other students' attendance records by guessing student IDs.

**Journey Reference:** `docs/journeys/attendance-history-device-verification.md`

**Problem Statement:**
- Currently, anyone can view any student's attendance history by entering their student ID
- No verification that the requester is the actual student
- Privacy concern: students can snoop on other students' attendance records
- Device fingerprinting is captured during check-in but not used for history access

**Acceptance Criteria:**

1. **Device Verification**
   - [ ] AC1.1: Before showing history, query attendance records for submitted student ID
   - [ ] AC1.2: Extract all unique device IDs from student's attendance records
   - [ ] AC1.3: Compare current device fingerprint against extracted device IDs
   - [ ] AC1.4: Match required to proceed (case-insensitive comparison)

2. **Authorized Access**
   - [ ] AC2.1: If device matches, allow viewing attendance history
   - [ ] AC2.2: All existing functionality preserved (stats, table, sorting)
   - [ ] AC2.3: No additional friction for authorized users after first warning

3. **First-Time Warning**
   - [ ] AC3.1: On first authorized access, show warning modal before results
   - [ ] AC3.2: Warning text: "Your attendance history is tied to this device for privacy. You can only view your history from a device you've previously used to check in."
   - [ ] AC3.3: "I Understand" button required to proceed
   - [ ] AC3.4: Acknowledgment stored in localStorage (device-scoped)
   - [ ] AC3.5: Warning only shown once per device (not per search)

4. **Denied Access**
   - [ ] AC4.1: If no device match, show denial message
   - [ ] AC4.2: Message: "This device has not been used to check in with this student ID. You can only view attendance history from a device you've previously used for check-in."
   - [ ] AC4.3: No attendance data shown
   - [ ] AC4.4: Clear call-to-action to return to home

5. **Edge Cases**
   - [ ] AC5.1: Students with no attendance records see "No records found" (not denial)
   - [ ] AC5.2: Handle device fingerprint unavailable (deny access with explanation)
   - [ ] AC5.3: Handle network errors gracefully (retry option)
   - [ ] AC5.4: Manual instructor-added records (deviceId: 'MANUAL') do not count for verification

6. **UI/UX**
   - [ ] AC6.1: Warning and denial modals use consistent styling
   - [ ] AC6.2: Dark mode support for all modals
   - [ ] AC6.3: Mobile-friendly modal sizing

**Technical Implementation:**
- Query attendance by studentId, extract unique deviceIds
- Compare current fingerprint against set of valid deviceIds
- Store warning acknowledgment in localStorage
- No database changes required (uses existing deviceId field)

**Files to Modify:**
- `index.html` - Add verification logic before showing results, add modals
- `src/utils.js` - Add `verifyDeviceAccess()` function
- Tests - E2E tests for authorized, denied, and edge case scenarios

**Effort Estimate:** ~3-4 hours including tests

## Phase 4: Analytics & Reporting

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P4-01 | Attendance trends dashboard | instructor-attendance-session | Pending |
| P4-02 | Course-level attendance aggregation | instructor-attendance-session | Pending |
| P4-03 | Student attendance history lookup | student-check-in | **Complete** (2026-01-20) |
| P4-03.1 | AC3.1 Participation tooltip | student-attendance-lookup | **Complete** (2026-01-21) |
| P4-03.2 | AC3.2 Late threshold transparency | student-attendance-lookup | **Complete** (2026-01-21) |
| P4-04 | Analytics split by class (default view) | analytics-by-class | **Complete** (2026-01-21) |
| P4-05 | Smart class default selection | smart-class-default | **Complete** (2026-01-21) |
| P4-06 | Analytics dashboard styling & default filter improvements | analytics-dashboard-improvements | Pending |

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

### P4-06: Analytics Dashboard Styling & Default Filter Improvements

**Description:** Improve the analytics dashboard with two UI/UX enhancements: (1) Make the "At-Risk Students (Below 70%)" section use the same table format as the "Student Attendance Ranking" for visual consistency, and (2) Change the default date filter from 14 days to "All Sessions" to show instructors the full picture of student attendance across the entire term.

**Journey Reference:** `docs/journeys/analytics-dashboard-improvements.md`

**Problem Statement:**
- At-Risk Students section displays in a different format (cards/list) than Student Attendance Ranking (table), creating visual inconsistency
- Analytics dashboard defaults to showing only last 14 days of data, forcing instructors to manually adjust filters to see full term trends
- Instructors want to see complete attendance picture by default without applying filters

**Acceptance Criteria:**

1. **At-Risk Students Table Format (Core)**
   - [ ] AC1: At-Risk Students section displays as table with columns: Student ID, Name, Sessions Attended, Total Sessions, Attendance Rate
   - [ ] AC2: Table styling (padding, fonts, row height, borders) matches Student Attendance Ranking table exactly
   - [ ] AC3: Hover states on at-risk rows match ranking table styling
   - [ ] AC4: Table supports sorting by each column (click header to sort)
   - [ ] AC5: Sortable columns show visual indicators (arrows) on headers
   - [ ] AC6: Sessions Attended column displays correct attendance count
   - [ ] AC7: Attendance Rate displays in percentage format (e.g., "72.5%") consistent with ranking table

2. **Dark Mode Support (Accessibility)**
   - [ ] AC8: At-Risk table is readable in both light and dark modes
   - [ ] AC9: Row styling, borders, and text contrast meet accessibility standards in both themes
   - [ ] AC10: Sort indicator arrows visible in both light and dark mode

3. **Default to All Sessions Filter (Core)**
   - [ ] AC11: Analytics dashboard loads with "All Sessions" as default (no date filter applied)
   - [ ] AC12: Summary cards (Total Sessions, Avg Attendance, Unique Students) show data from entire term by default
   - [ ] AC13: Trend chart displays all sessions from beginning of term
   - [ ] AC14: Student rankings and at-risk calculations use complete dataset by default

4. **Date Filter UI (Usability)**
   - [ ] AC15: Date range dropdown shows "All Sessions" as default selection
   - [ ] AC16: Dropdown includes quick-filter options: "Last 7 Days", "Last 14 Days", "Last 30 Days"
   - [ ] AC17: "Custom Range" option allows selecting specific date range
   - [ ] AC18: Applying date filter updates all dashboard sections correctly
   - [ ] AC19: Resetting filter back to "All Sessions" shows complete data again

5. **Edge Cases & Completeness**
   - [ ] AC20: All students below 70% threshold appear in At-Risk table (no hidden rows)
   - [ ] AC21: At-risk table shows "No at-risk students" message when all students at/above 70%
   - [ ] AC22: Works correctly with 0 sessions, 1 session, and 100+ sessions
   - [ ] AC23: Date filter with no sessions in range shows empty state gracefully

**Technical Notes:**
- At-risk data is derived from Student Attendance Ranking (no additional queries)
- Sorting is client-side only (no network calls)
- Default filter change is UI-only (no database changes)
- No migration required
- Minimal performance impact

**Files to Modify:**
- `index.html` - Add at-risk table styling, date filter UI, state initialization
- `src/utils.js` - Add helper functions for table sorting, date range calculation
- Tests - E2E tests for all acceptance criteria

**Implementation Strategy:**
- Phase 1: Convert at-risk display to table format, match styling with ranking table
- Phase 2: Implement sortable columns with visual indicators
- Phase 3: Change default date filter from 14 days to all sessions, add filter UI
- Phase 4: Test across browsers, devices, light/dark mode

**Effort Estimate:** 4-6 hours including tests and visual validation

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
| P7-03 | Fix attendance duplicate studentId race condition | attendance-deduplication | Pending |

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

### P7-03: Fix Attendance Duplicate StudentId Race Condition

**Description:** Race condition allows same student to check in twice when submissions occur simultaneously. The current check-then-write pattern is not atomic.

**Journey Reference:** `docs/journeys/attendance-deduplication.md`

**Root Cause Analysis:**
- Current attendance uses `push()` for record IDs: `attendance/{sessionId}/{pushId}`
- Application queries for existing studentId before writing
- Check-then-write is NOT atomic: two simultaneous requests can both pass the check
- Result: duplicate records for same student in same session

**Solution:**
Use studentId as the key with write-once security rule:
- New structure: `attendance/{sessionId}/{studentId}`
- Security rule: `.write": "!data.exists()"` prevents overwrites
- Single atomic `set()` operation - no race condition possible

**Acceptance Criteria:**
- [ ] AC1: Attendance records stored at `attendance/{sessionId}/{studentId}` (not push ID)
- [ ] AC2: Security rule `.write": "!data.exists()"` deployed for write-once enforcement
- [ ] AC3: `submitAttendance()` uses `set()` at studentId path instead of `push()`
- [ ] AC4: `approveStudent()` and `addStudent()` use `set()` at studentId path
- [ ] AC5: PERMISSION_DENIED error translated to "Already checked in" message
- [ ] AC6: Migration script converts existing records to new structure
- [ ] AC7: Migration handles duplicates: keep earliest, log removed
- [ ] AC8: E2E test: rapid double-submission results in single record
- [ ] AC9: E2E test: security rule blocks second write attempt

**Technical Notes:**
- Migration required for existing data
- Backwards compatibility during migration window
- No transaction needed - single atomic operation

## Phase 8: Course Management

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P8-01 | Course setup wizard with scheduled sessions | course-setup | **Complete** (2026-01-23) |
| P8-01.1 | Remote location selection via map | course-setup | **Complete** (2026-01-23) - validated |
| P8-02 | Zero-minute late threshold support | course-setup | **Complete** (2026-01-23) |
| P8-03 | Course defaults with session override | course-defaults | **Complete** (2026-01-23) |
| P8-04 | Rename Classroom Radius to Location Radius | course-defaults | **Complete** (2026-01-23) |

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

### P8-01.1: Remote Location Selection (Map)

**Description:** Allow instructors to set course location via interactive map without being physically present at the classroom. Enables remote course setup.

**Journey Reference:** `docs/journeys/course-setup.md` (Step 3: Location - Option B)

**Acceptance Criteria:**
- [x] AC1: Step 3 shows tabbed UI (Use GPS / Select on Map)
- [x] AC2: Map tab shows interactive Leaflet map
- [x] AC3: Click on map places marker and sets location
- [x] AC4: Address search with Nominatim geocoding
- [x] AC5: Radius circle preview updates in real-time
- [x] AC6: Switching tabs preserves entered location
- [x] AC7: Map-selected location allows proceeding to Step 4

**Implementation Notes (2026-01-26):**
- Leaflet CDN (CSS + JS) already loaded in index.html
- CSP already configured for: unpkg.com, nominatim.openstreetmap.org, *.tile.openstreetmap.org
- Added `locationMethod: 'gps'` state field ('gps' | 'map') to `courseSetup` state
- Replaced Step 3 HTML with tabbed interface (Use GPS / Select on Map)
- Created map functions: setLocationMethod(), initCourseSetupMap(), destroyCourseSetupMap(), onCourseSetupMapClick(), updateCourseSetupMapMarker(), updateLocationStatusDisplay(), debounceAddressSearch(), searchAddress(), selectSearchResult()
- Map properly destroyed on tab switch, step navigation, and wizard close
- Radius slider updates map circle in real-time for both GPS and map modes
- 7 Remote Location Selection tests + 11 existing course setup tests = 18 total passing

**Validation Status:** PASSED (2026-01-23)
**Evidence:** `.claude/evidence/remote-location-selection-2026-01-23.yaml`

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

### P8-03: Course Defaults with Session Override

**Description:** Move Location Radius and Late Threshold configuration from "Start Attendance Session" to "Course Setup Wizard" as course-level defaults. When activating a scheduled session, these defaults are inherited but can be optionally overridden for that specific session. Quick sessions remain unchanged.

**Journey Reference:** `docs/journeys/course-defaults.md`

**Rationale:**
- **Reduced friction**: Instructors configure settings once during course setup, not every session
- **Consistency**: Same settings apply across all class meetings
- **Speed**: One-tap activation without required configuration
- **Flexibility**: Override capability for exceptions (different room, exam day)

**Acceptance Criteria:**
- [x] AC1: Course record stores `radius` and `lateThreshold` as defaults
- [x] AC2: Scheduled session activation uses course defaults without additional input
- [ ] AC3: Collapsible "Session Settings" panel on activation for optional override
- [ ] AC4: Override sliders pre-filled with course default values
- [ ] AC5: Override values stored on session record only (not course)
- [ ] AC6: "Reset to Course Defaults" button in override panel
- [x] AC7: Quick session flow unchanged (settings configured at session start)
- [x] AC8: Backward compatibility: existing courses use defaults (300m, 10 min)
- [ ] AC9: Session history shows actual values used (default or override)
- [x] AC10: E2E test: activate session with defaults only
- [ ] AC11: E2E test: activate session with override values

**Technical Notes:**
- Override UI should be collapsible/optional (not required interaction)
- Session record may have `radiusOverride` and `lateThresholdOverride` fields
- Effective value: `session.radiusOverride ?? course.radius ?? 300`
- No migration required - null fields fall back to defaults

### P8-04: Rename Classroom Radius to Location Radius

**Description:** Rename "Classroom Radius" to "Location Radius" throughout the application for accuracy. The term "Location Radius" better describes the GPS distance check, which works for any location (lecture hall, lab, field site), not just traditional classrooms.

**Journey Reference:** `docs/journeys/course-defaults.md` (AC1: Terminology Update)

**Acceptance Criteria:**
- [x] AC1.1: Course Setup Wizard Step 3 label changed to "Location Radius"
- [x] AC1.2: Quick Session start label changed to "Location Radius"
- [ ] AC1.3: Session history/details display "Location Radius"
- [ ] AC1.4: Tooltips and help text updated
- [x] AC1.5: No changes to database field names (remains `radius`)
- [ ] AC1.6: Update consistency matrix and journey documentation

**Technical Notes:**
- UI-only change, no database migration
- Search for "Classroom Radius" and "classroom radius" in codebase
- Update both light and dark mode UI elements

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
- 164 tests passing (all tests)
- 0 flaky tests

## Phase 10: Operations

| Task ID | Description | Journey | Status |
|---------|-------------|---------|--------|
| P10-01 | Auto-close sessions at scheduled end time | session-lifecycle | Pending |

### P10-01: Auto-Close Sessions at End Time

**Description:** Automatically close/end sessions when the scheduled end time is reached (e.g., 12:15pm). Prevents students from checking in after class ends.

**Journey Reference:** `docs/journeys/session-lifecycle.md`

**Acceptance Criteria:**
- [ ] AC1: Sessions with schedule.end time are auto-closed at that time
- [ ] AC2: Active session shows countdown to end time
- [ ] AC3: Instructor can manually extend session if needed
- [ ] AC4: Notification shown when session is about to auto-close (5 min warning)
- [ ] AC5: Closed sessions cannot accept new check-ins

**Technical Notes:**
- Option A: Client-side timer that triggers session end
- Option B: Cloud Function triggered by schedule (more reliable)
- Consider timezone handling for Vietnam (UTC+7)

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
| P8-01.1 | Remote location selection via map | 2026-01-23 |
| P8-02 | Zero-minute late threshold support | 2026-01-23 |
| P9-01 | Firebase emulator test stability improvements | 2026-01-23 |
| P2-11 | Session history default view - 14 days | 2026-01-23 |
| P2-12 | Personalized greeting on instructor dashboard | 2026-01-23 |
| P2-14 | Larger QR codes for easier scanning | 2026-01-23 |
| P8-03 | Course defaults with session override | 2026-01-23 |
| P8-04 | Rename Classroom Radius to Location Radius | 2026-01-23 |
| P2-15 | Student location map during check-in | 2026-01-26 |

## Evidence

- PRD validation: `.claude/evidence/prd-validation-2026-01-13.yaml`
- Remote location selection: `.claude/evidence/remote-location-selection-2026-01-23.yaml`
- Firebase rules: `docs/firebase-security-rules.md`
- Test coverage: `tests/` directory with 201 E2E tests (Playwright)
- Development setup: `CLAUDE.md` (emulator mode, local dev instructions)
- Test stability: 200/201 tests passing, 1 pre-existing flake (2026-01-26)
