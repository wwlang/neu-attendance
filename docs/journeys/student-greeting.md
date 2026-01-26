# Journey: Personalized Greeting for Returning Students

## Status

```yaml
status: planned
implementation_priority: P2
implementation_percent: 0
last_reviewed: 2026-01-23
```

## Overview

When a returning student accesses the check-in page, they see a personalized greeting: "Welcome back, [First Name]!" This creates a welcoming experience and confirms their identity is recognized from a previous check-in.

## Actor

University student who has previously checked in to at least one session

## Preconditions

- Student has accessed the attendance system via QR code or direct URL
- Student has previously checked in (name stored in localStorage)
- Student mode is active (`?mode=student`)

## Trigger

Student loads the check-in page

## User Story

As a returning student, I want to see a personalized greeting with my first name so that I feel recognized and can confirm I'm checking in with the correct identity.

## Flow

### Primary Flow: Returning Student

1. **Load Check-in Page** -> Student scans QR code or navigates to URL
2. **Detect Saved Info** -> System checks localStorage for `savedStudentInfo`
3. **Display Greeting** -> "Welcome back, [First Name]!" appears above form
4. **Continue Check-in** -> Student proceeds with pre-filled form

### Alternative Flow: First-Time Student

1. **Load Check-in Page** -> Student scans QR code
2. **No Saved Info** -> localStorage is empty
3. **Generic Greeting** -> Standard check-in form without personalization
4. **Complete Check-in** -> Student info saved for future visits

## Acceptance Criteria

### AC1: Greeting Display
- [ ] AC1.1: Greeting visible when `savedStudentInfo` exists in localStorage
- [ ] AC1.2: Greeting hidden for first-time students (no saved info)
- [ ] AC1.3: Greeting positioned above check-in form
- [ ] AC1.4: Uses warm tone ("Welcome back," not "Hello,")
- [ ] AC1.5: First name extracted from saved `studentName` field

### AC2: Name Extraction
- [ ] AC2.1: First name extracted by splitting on space: `name.split(' ')[0]`
- [ ] AC2.2: Works with multi-word first names (hyphenated: "Jean-Luc")
- [ ] AC2.3: Single-name entries display full name
- [ ] AC2.4: Handles leading/trailing whitespace (trim before split)

### AC3: Fallback Handling
- [ ] AC3.1: If `studentName` is null/empty, hide greeting entirely
- [ ] AC3.2: No console errors for malformed localStorage data
- [ ] AC3.3: Graceful degradation if localStorage unavailable

### AC4: Styling
- [ ] AC4.1: Uses existing design system font (Inter)
- [ ] AC4.2: Text size appropriate for mobile (16-18px)
- [ ] AC4.3: Theme-aware colors (no hardcoded hex values)
- [ ] AC4.4: Proper spacing from form elements

### AC5: Theme Support
- [ ] AC5.1: Readable in light mode
- [ ] AC5.2: Readable in dark mode
- [ ] AC5.3: Sufficient contrast ratio (WCAG AA 4.5:1)

### AC6: Responsive
- [ ] AC6.1: Visible on mobile (>= 320px)
- [ ] AC6.2: Does not break layout on any screen size

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No savedStudentInfo | Hide greeting, show standard form |
| savedStudentInfo has no name | Hide greeting, show standard form |
| Name is empty string | Hide greeting, show standard form |
| Name is whitespace only | Hide greeting, show standard form |
| localStorage unavailable | Hide greeting, show standard form |

## Technical Implementation

### Data Source
```javascript
// localStorage key: savedStudentInfo
// Structure: { studentId: string, studentName: string, studentEmail?: string }
const saved = JSON.parse(localStorage.getItem('savedStudentInfo'));
```

### Code Pattern
```javascript
const getGreetingName = () => {
  const saved = getSavedStudentInfo();
  if (!saved?.studentName?.trim()) return null;
  return saved.studentName.trim().split(' ')[0];
};

// In renderStudentForm()
const firstName = getGreetingName();
const greetingHtml = firstName
  ? `<p class="greeting">Welcome back, ${escapeHtml(firstName)}!</p>`
  : '';
```

### Styling
```css
.greeting {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
```

## Metrics

- Greeting load time: < 50ms (localStorage is synchronous)
- No network requests required
- Improves perceived personalization for returning students

## Dependencies

- localStorage API (already in use)
- Design system colors and typography (already available)
- No new libraries required
