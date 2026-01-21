# Journey: Smart Class Default Selection

## Overview
When an instructor starts a new attendance session, the system intelligently defaults to the most likely class based on the current day of week and time. This reduces cognitive load and speeds up session creation for instructors with recurring class schedules.

## Actor
University instructor/lecturer

## Preconditions
- Instructor has access to the attendance system
- Instructor has created at least one previous session
- Instructor is starting a new session

## Trigger
Instructor navigates to the session setup screen with previous classes available

## User Problem
Instructors typically teach the same classes at the same times each week (e.g., "CS101" every Tuesday at 10am). The current behavior defaults to the most recently used class overall, which may not be the class they're about to teach right now.

## Solution
Smart defaulting based on temporal patterns:
1. Match current day of week (e.g., Tuesday)
2. Match current hour window (e.g., 10:00-10:59)
3. Look back one week for matching sessions
4. Fall back to most recent class if no match

## Flow

### 1. Load Previous Classes
- System queries sessions from the last 100 entries
- Extracts unique class names with their last-used timestamps
- Stores full session data including `createdAt` timestamp

### 2. Smart Default Selection
- Get current day of week and hour
- Search for classes with sessions from:
  - Same day of week (e.g., Tuesday = Tuesday)
  - Same hour window (e.g., 10:15 matches 10:00-10:59)
  - Within the last 7-14 days (to find "last week's" session)
- If match found: Select that class as default
- If no match: Fall back to most recent class (current behavior)

### 3. Display to Instructor
- Class selector dropdown shows matched class pre-selected
- Instructor can change selection if needed
- Config (radius, late threshold) auto-loads from selected class

## Example Scenarios

### Scenario 1: Matching Class Found
- Today: Tuesday, 10:15am
- Previous sessions:
  - "CS101" on Tuesday last week at 10:05am
  - "CS202" on Monday yesterday at 2:00pm
- Result: "CS101" is selected (same day, same hour)

### Scenario 2: No Matching Class
- Today: Wednesday, 3:30pm
- Previous sessions:
  - "CS101" on Tuesday at 10:00am
  - "CS202" on Monday at 2:00pm
- Result: Most recent class selected (fallback behavior)

### Scenario 3: Multiple Classes Same Day/Hour
- Today: Tuesday, 10:15am
- Previous sessions:
  - "CS101" on Tuesday last week at 10:05am
  - "Advanced CS101" on Tuesday two weeks ago at 10:30am
- Result: "CS101" selected (most recent matching session)

### Scenario 4: First Time User
- Today: Tuesday, 10:15am
- Previous sessions: None
- Result: Empty dropdown, new class input shown

## Acceptance Criteria

### AC1: Smart Default - Same Day and Hour Match
```gherkin
Scenario: Class from same day of week and hour is selected
  Given the instructor has previous sessions
  And a session for "CS101" was created on Tuesday last week at 10:05am
  And a session for "CS202" was created on Monday at 2:00pm
  When the instructor opens the session setup on Tuesday at 10:15am
  Then "CS101" should be selected in the class dropdown
  And the config from that session should be auto-loaded
```

### AC2: Fallback to Most Recent
```gherkin
Scenario: Most recent class selected when no day/hour match
  Given the instructor has previous sessions
  And a session for "CS101" was created on Tuesday at 10:00am
  And a session for "CS202" was created on Wednesday at 2:00pm (most recent)
  When the instructor opens the session setup on Friday at 9:00am
  Then "CS202" should be selected in the class dropdown
  Because no session matches Friday at 9am
```

### AC3: First Time User - No Previous Classes
```gherkin
Scenario: No default when no previous sessions exist
  Given the instructor has no previous sessions
  When the instructor opens the session setup
  Then no class should be pre-selected
  And the new class input field should be shown
```

### AC4: Hour Window Matching (1-hour window)
```gherkin
Scenario: Class matches within the same hour
  Given a session for "CS101" was created on Tuesday at 10:05am
  When the instructor opens session setup on Tuesday at 10:55am
  Then "CS101" should be selected
  Because 10:55am is within the 10:00-10:59 window
```

```gherkin
Scenario: Class does not match outside the hour window
  Given a session for "CS101" was created on Tuesday at 10:05am
  When the instructor opens session setup on Tuesday at 11:00am
  Then "CS101" should NOT be selected based on time matching
  And fallback to most recent logic should apply
```

### AC5: DST/Timezone Handling
```gherkin
Scenario: Works correctly across timezone differences
  Given sessions are stored with ISO 8601 timestamps including timezone
  When comparing session times across DST boundaries
  Then the local time hour should be used for matching
  And sessions at "10am local time" should match regardless of UTC offset
```

### AC5.1: Week Lookback Window
```gherkin
Scenario: Match found within 7-14 day lookback
  Given a session for "CS101" was created on Tuesday 8 days ago at 10:00am
  And no session exists from Tuesday 1 day ago
  When the instructor opens session setup on Tuesday at 10:15am
  Then "CS101" should be selected
  Because it matches day/hour within the lookback window

Scenario: Very old sessions are not matched
  Given a session for "CS101" was created on Tuesday 30 days ago at 10:00am
  And a session for "CS202" was created yesterday
  When the instructor opens session setup on Tuesday at 10:15am
  Then "CS202" should be selected (most recent fallback)
  Because the matching session is too old
```

## Scope Boundary

**In Scope:**
- Session start class selector dropdown only
- Smart defaulting based on day-of-week and hour

**Out of Scope:**
- Analytics class dropdown (uses most recent, no time-based matching needed)
- Session history view
- Any other class selectors

## Technical Notes

### Data Available
Sessions have `createdAt` field in ISO 8601 format:
```javascript
createdAt: "2026-01-14T10:05:00.000Z"
```

### Algorithm
```
function findSmartDefault(previousClasses, allSessions) {
  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
  const currentHour = now.getHours(); // 0-23

  // Look back 7-14 days for matching sessions
  const twoWeeksAgo = now.getTime() - (14 * 24 * 60 * 60 * 1000);

  // Find sessions matching day-of-week and hour
  const matches = allSessions.filter(session => {
    const sessionDate = new Date(session.createdAt);
    const sessionDay = sessionDate.getDay();
    const sessionHour = sessionDate.getHours();
    const sessionTime = sessionDate.getTime();

    return sessionDay === currentDay
        && sessionHour === currentHour
        && sessionTime >= twoWeeksAgo;
  });

  if (matches.length > 0) {
    // Return most recent matching session's class
    return matches.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0].className;
  }

  // Fallback: most recent class
  return previousClasses[0]?.className || null;
}
```

## Friction Analysis

### Interaction Count

| Flow | Before | After | Improvement |
|------|-------:|------:|-------------|
| Start session (recurring class) | 4-5 | 3-4 | -1 click if class auto-selected correctly |

### Friction Score

| Dimension | Score | Notes |
|-----------|------:|-------|
| Cognitive load | 0 | Less thinking - system predicts intent |
| Input effort | 0 | No additional input required |
| Wait time | 0 | Computation is instant |
| Error risk | 0 | Wrong default can be changed |
| **Total** | **0** | No added friction, reduces existing friction |

## Metrics
- Smart default accuracy: Target 80%+ correct predictions for recurring classes
- Session start time: Should remain < 10 seconds
