# Cross-Journey Consistency Matrix

> Documents shared parameters, terminology, and feature visibility across all NEU Attendance journeys.

## Parameter Matrix

Authoritative values for parameters shared across journeys.

| Parameter | Value | Source | Used In |
|-----------|-------|--------|---------|
| Code grace period | **180s** | `index.html:81` | student-check-in, instructor-session |
| Recently expired window | **30s** | `index.html` | student-check-in, instructor-session |
| Code rotation interval | **120s** | `index.html` | instructor-session, student-check-in |
| Default classroom radius | **300m** | `index.html` | instructor-session, course-setup |
| Radius range | 20-500m | `index.html` | instructor-session, course-setup |
| Default late threshold | **10 min** | `index.html` | instructor-session, student-lookup, course-setup |
| Late threshold range | **0-60 min** | `index.html` | instructor-session, course-setup |
| Instructor PIN | 230782 | `index.html` | instructor-session |
| History default view | 7 days | `index.html` | instructor-session |
| At-risk attendance threshold | 70% | lecturer-dashboard | lecturer-dashboard |
| Term weeks range | 1-20 | `index.html` | course-setup |
| Default term weeks | 15 | `index.html` | course-setup |

## Terminology Definitions

Consistent labels and meanings across all journeys.

| Term | Definition | Used In |
|------|------------|---------|
| **Check in** | Student submits their attendance for a session | student-check-in, instructor-session |
| **Session** | One attendance-taking period for a class | all journeys |
| **Code** | 6-character alphanumeric attendance code | student-check-in, instructor-session |
| **Late** | Check-in submitted after late threshold from session start | student-check-in, student-lookup, instructor-session |
| **On Time** | Check-in submitted within late threshold | student-check-in, student-lookup, instructor-session |
| **Failed attempt** | Check-in rejected due to verification failure | instructor-session |
| **Grace period** | Time window after code rotation where previous code still valid | student-check-in, instructor-session |
| **Rejoined** | Late check-in during a reopened session | instructor-session |
| **Participation** | Instructor-recorded count of student contributions | instructor-session, student-lookup |
| **Archived** | Session hidden from default history view | instructor-session |
| **Course** | A configured class with schedule for session generation | course-setup |
| **Scheduled session** | Pre-created session awaiting activation | course-setup |
| **Quick session** | Ad-hoc session created without course setup | instructor-session |

## Feature Visibility Matrix

What each actor can see and configure.

| Feature | Student | Instructor | Notes |
|---------|:-------:|:----------:|-------|
| Current attendance code | Yes (to enter) | Yes (to display) | |
| Code rotation timer | No | Yes | |
| Grace period duration | No | Yes (in settings reference) | Students don't need to know |
| Late threshold | **No** | Yes (configurable) | Gap: Should show in lookup results |
| Location radius | No | Yes (configurable) | |
| Own check-in status | Yes | Yes | |
| All attendees | No | Yes | |
| Failed attempts | No | Yes | |
| Participation count | **No** | Yes | Gap: Should show in lookup results |
| Session history | Own only | All sessions | |
| Export CSV | No | Yes | |
| Analytics dashboard | No | Yes (planned) | |
| Course setup | No | Yes | |
| Scheduled sessions | No | Yes | |

### Visibility Gaps Identified

1. **Late threshold**: Students see "Late" badge but don't know the threshold. Add tooltip in lookup results.
2. **Participation**: Instructors record but students can't see their count. Add to lookup results.

## Navigation Patterns

Consistent back/cancel behavior.

| Context | Back Action | Cancel Action |
|---------|-------------|---------------|
| Student check-in | Browser back (to QR source) | N/A |
| Student lookup | Return to main page | Clear search |
| Instructor session | End session confirmation | N/A (no cancel mid-session) |
| Session history | Return to instructor dashboard | N/A |
| Edit modal | Close without saving | Same as back |
| Course setup wizard | Previous step | Cancel returns to dashboard |

## Error Message Consistency

Same errors produce same messages across journeys.

| Error Type | Message | Used In |
|------------|---------|---------|
| Invalid code | "Invalid code. Please check and try again." | student-check-in |
| Expired code | "This code has expired. Please scan the current QR code." | student-check-in |
| Too far from class | "You appear to be too far from the classroom (Xm away, Ym allowed)." | student-check-in |
| Already checked in | "You have already checked in to this session." | student-check-in |
| Device already used | "This device has already been used for check-in." | student-check-in |
| No active session | "No active attendance session found." | student-check-in |
| Wrong PIN | "Incorrect PIN. Please try again." | instructor-session |
| Location denied | "Location access is required to start a session." | instructor-session |
| Database error | "Error connecting to database. Please try again." | all journeys |
| No days selected | "At least one day must be selected" | course-setup |
| Invalid time range | "Start time must be before end time" | course-setup |

## Journey Cross-References

How journeys connect to each other.

```
Landing Page
├── Student Mode (?mode=student)
│   ├── student-check-in.md (with code in URL)
│   └── student-attendance-lookup.md (?mode=lookup)
└── Instructor Mode (?mode=teacher)
    ├── instructor-attendance-session.md (PIN required)
    ├── course-setup.md (Setup New Course)
    └── lecturer-dashboard.md (planned)
```

### Entry Points

| Journey | Direct URL | From Other Journey |
|---------|------------|-------------------|
| Student check-in | `?mode=student&code=XXXXXX` | QR scan from instructor session |
| Student lookup | `?mode=lookup` | Main page "View My Attendance" |
| Instructor session | `?mode=teacher` | Main page "I'm the Instructor" |
| Course setup | `?mode=teacher&view=courseSetup` | Dashboard "Setup New Course" |
| Analytics dashboard | `?mode=analytics` (planned) | Instructor dashboard "Analytics" |

## Last Updated

- **Date**: 2026-01-23
- **Verified by**: Course setup feature implementation
- **Changes**: Updated late threshold range to 0-60 min, added course setup terminology and parameters
