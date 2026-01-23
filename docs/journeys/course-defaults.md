# Journey: Course Defaults & Session Override

## Overview
Course-level settings (Location Radius, Late Threshold) are configured once during Course Setup. When activating a scheduled session, these defaults are inherited but can be overridden for that specific session. Quick sessions continue to configure settings at session start.

## Actor
University instructor/lecturer

## Preconditions
- Instructor is authenticated
- Course has been created via Course Setup Wizard (see: `course-setup.md`)
- Scheduled sessions exist for the course

## Trigger
Instructor wants to activate a scheduled session, optionally adjusting the session settings

## Key Terminology

| Term | Definition |
|------|------------|
| **Location Radius** | Maximum GPS distance from session location for valid check-in (formerly "Classroom Radius") |
| **Late Threshold** | Minutes after session start before check-ins are marked late |
| **Course Default** | Setting value stored at course level, inherited by all sessions |
| **Session Override** | Temporary adjustment to a setting for a single session only |

## Design Rationale

### Why Move Defaults to Course Setup?
1. **Reduced friction**: Instructors configure once, not every session
2. **Consistency**: Same settings apply across all class meetings
3. **Speed**: One-tap activation without configuration required

### Why Allow Overrides?
1. **Flexibility**: Different classroom (guest lecture), different tolerance (exam day)
2. **Non-blocking**: Override is optional - defaults work without interaction
3. **Non-destructive**: Override applies to single session only

### Why Rename to "Location Radius"?
- More accurate: Works for any location (lecture hall, lab, field site)
- Clearer: "Classroom" implies physical classroom only
- Consistent: Matches "Location" step in Course Setup Wizard

## Flow

### 1. Course Setup (One-Time Configuration)
> See `course-setup.md` for full details

During Course Setup Wizard:
- **Step 3 (Location)**: Configure Location Radius (20-500m, default 300m)
- **Step 4 (Confirm)**: Configure Late Threshold (0-60 min, default 10 min)

These settings are stored at the course level and inherited by all generated sessions.

### 2. Dashboard - Today's Scheduled Sessions
- Dashboard shows "Today's Scheduled Sessions" section
- Each session card displays:
  - Class name and scheduled time
  - Status badge ("Scheduled" / "Active" / "Ended")
  - "Activate" button for scheduled sessions

### 3. Activate Scheduled Session - Standard Flow
**Default path (no override):**
1. Click "Activate" on a scheduled session
2. System captures instructor's current GPS location
3. Session activated with course defaults:
   - Location Radius: from course settings
   - Late Threshold: from course settings
4. QR code displays, attendance tracking begins

### 4. Activate Scheduled Session - Override Flow
**Optional override path:**
1. Click chevron/arrow next to "Activate" (or "Activate with options")
2. Collapsible panel expands showing:
   - Location Radius slider (pre-filled with course default)
   - Late Threshold slider (pre-filled with course default)
   - "Reset to Course Defaults" link
3. Adjust settings if needed
4. Click "Activate Session"
5. Session activated with overridden values
6. Override values stored on session record (not course)

### 5. Quick Session Flow (Unchanged)
Quick sessions (no courseId) continue existing behavior:
- "Start Quick Session" button on dashboard
- Configure all settings during session start:
  - Class name, Location Radius, Late Threshold
- No course defaults to inherit

## UI Mockup - Activation Panel

```
+------------------------------------------+
| CS101-A                    10:00 AM      |
| Scheduled for today                      |
+------------------------------------------+
| [        Activate        ] [v]           |
+------------------------------------------+

After clicking [v] to expand:

+------------------------------------------+
| CS101-A                    10:00 AM      |
| Scheduled for today                      |
+------------------------------------------+
| Session Settings (optional)              |
| ---------------------------------------- |
| Location Radius:    [====|=====] 300m    |
|                     20m        500m      |
|                                          |
| Late Threshold:     [=|========] 10 min  |
|                     0 min      60 min    |
|                                          |
|           [Reset to Course Defaults]     |
| ---------------------------------------- |
| [        Activate Session        ]       |
+------------------------------------------+
```

## Acceptance Criteria

### AC1: Terminology Update
- [ ] AC1.1: All UI labels changed from "Classroom Radius" to "Location Radius"
- [ ] AC1.2: Course Setup Wizard Step 3 shows "Location Radius"
- [ ] AC1.3: Session Start (Quick Session) shows "Location Radius"
- [ ] AC1.4: No breaking changes to existing data (field name remains `radius`)

### AC2: Course Defaults Storage
- [ ] AC2.1: Course record stores `radius` and `lateThreshold`
- [ ] AC2.2: Scheduled sessions reference course for defaults
- [ ] AC2.3: Editing course defaults propagates to future sessions (not past)

### AC3: Session Activation - Default Path
- [ ] AC3.1: Single "Activate" tap works without opening override panel
- [ ] AC3.2: Session uses course `radius` value when no override
- [ ] AC3.3: Session uses course `lateThreshold` value when no override
- [ ] AC3.4: GPS capture still required on activation

### AC4: Session Activation - Override Path
- [ ] AC4.1: Expand/collapse UI for override settings
- [ ] AC4.2: Override sliders pre-filled with course defaults
- [ ] AC4.3: Changes in override panel do not affect course record
- [ ] AC4.4: "Reset to Course Defaults" restores slider values
- [ ] AC4.5: Override values stored on session record only
- [ ] AC4.6: Session history shows actual values used (default or override)

### AC5: Quick Session (Preserved)
- [ ] AC5.1: Quick session flow unchanged
- [ ] AC5.2: Quick session settings configured at session start
- [ ] AC5.3: No "inherit from course" logic for quick sessions (courseId: null)

### AC6: Backward Compatibility
- [ ] AC6.1: Existing courses without explicit radius use default (300m)
- [ ] AC6.2: Existing courses without explicit lateThreshold use default (10 min)
- [ ] AC6.3: Existing sessions continue to work
- [ ] AC6.4: No migration required for existing data

## Data Models

### Course Record (Updated)
```javascript
{
  // ... existing fields ...
  radius: number,            // 20-500m, default 300m (course default)
  lateThreshold: number,     // 0-60 min, default 10 min (course default)
}
```

### Session Record (Updated)
```javascript
{
  // ... existing fields ...
  courseId: string | null,   // Reference to course (null for quick sessions)

  // Override fields (optional - only present if overridden)
  radiusOverride: number | null,         // Session-specific override
  lateThresholdOverride: number | null,  // Session-specific override

  // Effective values (computed at activation)
  radius: number,            // Actual value used: override || course.radius
  lateThreshold: number,     // Actual value used: override || course.lateThreshold
}
```

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Course has no radius set | Use default 300m |
| Course has no lateThreshold set | Use default 10 min |
| Override panel closed mid-edit | Discard changes, use defaults |
| Network error during activation | Show error, retain override values for retry |

## Friction Analysis

### Interaction Count

| Flow | Interactions | Target | Status |
|------|-------------:|-------:|--------|
| Activate with defaults | 2 | <=3 | Pass |
| Activate with override | 4-5 | <=6 | Pass |
| Quick session (unchanged) | 4 | <=5 | Pass |

### Friction Score

| Dimension | Score | Notes |
|-----------|------:|-------|
| Cognitive load | 1 | Defaults are obvious, override is optional |
| Input effort | 1 | No input required for default path |
| Wait time | 1 | Only GPS capture wait |
| Error risk | 0 | Can't make mistakes if using defaults |
| Permission ask | 1 | Location permission required |
| **Total** | **4** | Good (<= 5) |

### Comparison: Before vs After

| Action | Before (Current) | After (Proposed) |
|--------|-----------------|------------------|
| Setup course | Configure radius + threshold | Configure radius + threshold (same) |
| Activate session | Configure radius + threshold | **One tap (defaults inherited)** |
| Override settings | N/A | Optional expand + adjust |

**Benefit**: Reduced friction from 4 interactions to 2 for common path.

## Related Journeys
- `course-setup.md`: Initial course creation with default settings
- `instructor-attendance-session.md`: Full session management
- `smart-class-default.md`: Auto-selection of class based on schedule

## Metrics
- Activation with defaults: > 80% of sessions (target)
- Override usage: < 20% of sessions (expected)
- Time to activate (default path): < 3 seconds
- Time to activate (override path): < 10 seconds

## Last Updated
- **Date**: 2026-01-23
- **Author**: Course Defaults Feature Planning
- **Status**: Pending Implementation
