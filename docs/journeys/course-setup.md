# Journey: Course Setup & Scheduled Sessions

## Overview
An instructor sets up a course once (code, section, schedule, location) and the system pre-creates sessions for the entire term. The instructor can then activate scheduled sessions with one tap instead of configuring each session manually.

## Actor
University instructor/lecturer

## Preconditions
- Instructor has access to the attendance system URL
- Instructor is authenticated as an instructor
- Instructor knows their course schedule for the term
- Instructor's device has location services enabled (for location capture)

## Trigger
Instructor wants to set up recurring class sessions for a term

## Flow

### 1. Access Course Setup
- From the instructor dashboard, click "Setup New Course"
- Or navigate directly to `?mode=teacher&view=courseSetup`

### 2. Course Setup Wizard - Step 1: Course Info
- Enter course code (e.g., "CS101")
- Enter section (e.g., "A", "B")
- Preview combined class name (e.g., "CS101-A")
- Click "Next" to proceed

### 3. Course Setup Wizard - Step 2: Schedule
- Select class days using checkboxes (Monday through Sunday)
- Set class start time using time picker
- Set class end time using time picker
- Set number of weeks for the term (1-20 weeks)
- Set term start date using date picker
- System shows preview of total sessions to be created
- Click "Next" to proceed

### 4. Course Setup Wizard - Step 3: Location
Location can be set using one of two methods:

**Option A: GPS Capture (default)**
- Click "Capture Location" to get current GPS coordinates
- Requires being physically present at the classroom
- System shows captured latitude/longitude with success confirmation

**Option B: Select on Map (remote setup)**
- Click "Select on Map" tab to switch methods
- Use address search to find building/location
- Or click directly on the interactive map to place marker
- System shows selected coordinates with radius circle preview

**Common for both methods:**
- Configure classroom radius (20-500m, default 300m)
- Radius updates in real-time on map preview
- Click "Next" to proceed

### 5. Course Setup Wizard - Step 4: Confirm
- Configure late threshold (0-60 minutes, default 10 minutes)
- Review summary of all settings:
  - Course name (code + section)
  - Schedule (days, times, weeks, start date)
  - Location (coordinates, radius)
  - Late threshold
  - Total sessions to be created
- Click "Create Course" to save

### 6. Session Generation
- System creates course record in Firebase
- System generates all scheduled sessions for the term
- Each session has status "scheduled" until activated
- Success message shows number of sessions created
- Redirect to instructor dashboard

### 7. Dashboard - Today's Sessions
- Dashboard shows "Today's Scheduled Sessions" section
- Lists all sessions scheduled for current date
- Each session shows: class name, scheduled time, status badge
- "Activate" button available for scheduled sessions

### 8. Activate Scheduled Session
- Click "Activate" on a scheduled session
- System captures instructor's current GPS location
- Session status changes from "scheduled" to "active"
- QR code and attendance tracking begins
- All existing session functionality applies

### 9. Quick Session (Unchanged)
- "Start Quick Session" button remains available
- Quick sessions work exactly as before (no courseId)
- For ad-hoc attendance needs outside scheduled courses

## Session Settings Reference

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Late Threshold | 0-60 min | 10 min | Time after session start before check-ins marked late |
| Classroom Radius | 20-500m | 300m | Maximum distance from instructor for valid check-in |
| Term Weeks | 1-20 | 15 | Number of weeks to generate sessions for |

## Acceptance Criteria

### AC1: Course Creation Wizard
- [x] Step 1: Course code input (max 20 characters)
- [x] Step 1: Section input (max 10 characters)
- [x] Step 1: Combined class name preview (e.g., "CS101-A")
- [x] Step 2: Day selection checkboxes (Monday-Sunday)
- [x] Step 2: Time pickers for start and end times
- [x] Step 2: Weeks slider (1-20, default 15)
- [x] Step 2: Start date picker
- [x] Step 3: Location method tabs (Use GPS / Select on Map)
- [x] Step 3: GPS capture button (in GPS tab)
- [x] Step 3: Interactive map with click-to-place marker (in Map tab)
- [x] Step 3: Address search with geocoding (Nominatim)
- [x] Step 3: Radius circle preview on map
- [x] Step 3: Radius slider (20-500m, default 300m)
- [x] Step 4: Late threshold slider (0-60 min, default 10 min)
- [x] Step 4: Summary review before creation

### AC2: Session Generation
- [x] Generates sessions for each scheduled day across all weeks
- [x] Each session has: courseId, scheduledFor timestamp, status "scheduled"
- [x] Course record includes: schedule, location, radius, lateThreshold
- [x] Sessions use course defaults but can be overridden at activation

### AC3: Dashboard Integration
- [x] "Today's Scheduled Sessions" section shows above quick session
- [x] Sessions sorted by scheduled time
- [x] Status badges: "Scheduled" (gray), "Active" (green), "Ended" (red)
- [x] "Activate" button only on scheduled sessions

### AC4: Session Activation
- [x] Captures fresh GPS location on activation
- [x] Updates session status to "active"
- [x] Sets activatedAt timestamp and activatedBy user
- [x] Generates attendance code and starts QR rotation
- [x] All existing attendance functionality works

### AC5: Quick Session Preservation
- [x] "Start Quick Session" button remains visible
- [x] Quick sessions have courseId: null
- [x] All existing quick session functionality unchanged

### AC6: Zero-Minute Late Threshold
- [x] Late threshold slider minimum changed from 5 to 0
- [x] Zero threshold means any check-in after session start is late
- [x] Database rules updated to allow lateThreshold >= 0

## Data Models

### Course Collection (`courses/`)
```javascript
{
  id: string,                // Firebase push key
  code: string,              // "CS101"
  section: string,           // "A", "B"
  className: string,         // "CS101-A" (combined)
  schedule: {
    days: string[],          // ["Monday", "Wednesday", "Friday"]
    startTime: string,       // "09:00"
    endTime: string,         // "10:30"
    weeks: number,           // 15
    startDate: string        // "2026-02-03"
  },
  location: {
    lat: number,
    lng: number
  },
  radius: number,            // 300
  lateThreshold: number,     // 0-60 min
  createdAt: string,         // ISO timestamp
  createdBy: string,         // User UID
  instructorEmail: string,
  active: boolean            // Course is active for this term
}
```

### Updated Session Fields
```javascript
{
  // ... existing session fields ...
  courseId: string | null,   // Reference to course (null for quick sessions)
  scheduledFor: number,      // Timestamp when session was scheduled
  status: string,            // "scheduled" | "active" | "ended" | "cancelled"
  activatedAt: string,       // When session was activated (ISO timestamp)
  activatedBy: string        // Who activated the session (user UID)
}
```

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No days selected | Error message, prevent proceeding from Step 2 |
| Start time after end time | Error message, prevent proceeding from Step 2 |
| GPS location denied | Show error, prevent proceeding from Step 3 (use map instead) |
| Address search no results | Show "No results found" message |
| Address search API error | Show "Search failed" message |
| No location selected | Alert "Please select your location first", prevent proceeding |
| No sessions generated | Error if weeks + days produce 0 sessions |
| Activation location denied | Show error, cannot activate session |

## Friction Analysis

### Interaction Count

| Flow | Interactions | Target | Status |
|------|-------------:|-------:|--------|
| Full course setup | 12-15 | <=15 | Pass |
| Activate scheduled session | 2 | <=3 | Pass |
| Quick session (unchanged) | 4 | <=5 | Pass |

### Friction Score

| Dimension | Score | Notes |
|-----------|------:|-------|
| Cognitive load | 2 | Wizard breaks down complex setup into steps |
| Input effort | 2 | Multiple inputs required but organized logically |
| Wait time | 1 | GPS capture is only wait |
| Error risk | 1 | Validation at each step prevents errors |
| Permission ask | 0-1 | Location: GPS requires permission, Map does not |
| **Total** | **7** | Acceptable (5-7) |

## Metrics
- Time to complete course setup: < 2 minutes
- Sessions generated accurately: 100%
- Activation success rate: > 99%
- Quick session functionality preserved: 100%

## Last Updated
- **Date**: 2026-01-23
- **Author**: Course Setup Feature Implementation
