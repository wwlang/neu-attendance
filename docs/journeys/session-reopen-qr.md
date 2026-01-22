# Journey: Instructor Reopens Historical Session with QR Code

## Overview
An instructor reopens a previously ended session from the history view to allow late check-ins. The system generates a new attendance code and displays a QR code for students to scan.

## Actor
Instructor (authenticated via Google Sign-in)

## Preconditions
- Instructor is authenticated
- A previous session exists in history (ended within 7 days)
- Instructor has location access enabled

## Trigger
Instructor clicks "Reopen for Late" button from session history or session detail view

## Problem Statement
When an instructor reopens a session from history, the QR code may not appear immediately. The QR code generation depends on `state.session` and `state.currentCode` being set, and the `generateQRCodes()` function being called after render.

## Technical Flow

### 1. Click Reopen Button
- From history list: `onclick="reopenSession(sessionId)"`
- From detail view: `onclick="reopenSessionFromDetail(sessionId)"`

### 2. Reopen Session (`reopenSession` function)
1. `state.isRecovering = true` - Show loading state
2. `state.showHistory = false` - Hide history view
3. Load session from Firebase
4. Get instructor's current location
5. Generate new code: `const newCode = generateCode()`
6. Update Firebase:
   - `code: newCode`
   - `codeGeneratedAt: Date.now()`
   - `isReopened: true`
   - `reopenedAt: new Date().toISOString()`
   - `location: currentLocation`
   - `endedAt: null`
7. Set as active session in Firebase
8. Update local state:
   - `state.session = {...}`
   - `state.currentCode = newCode`
   - `state.isReopenedSession = true`
9. `state.isRecovering = false`
10. Call `render()`

### 3. Render Flow
1. `render()` checks `state.mode === 'teacher'` and `state.isInstructor`
2. Since `state.showHistory = false` and `state.session` is set, renders active session view
3. Session view includes QR container: `<div id="qr-student-checkin">...</div>`
4. QR generation triggered: `if (state.session && state.currentCode && (!state.cachedQRCode || state.cachedQRCode.code !== state.currentCode))`
5. `setTimeout(generateQRCodes, 100)` schedules QR generation

### 4. QR Code Generation
1. `generateQRCodes()` finds `#qr-student-checkin` element
2. Clears container
3. Generates QR with URL: `{baseUrl}?mode=student&code={currentCode}`
4. Caches data URL for future renders

## Acceptance Criteria

### AC1: Reopen Button Visibility
- [ ] "Reopen for Late" button visible on ended sessions within 7 days
- [ ] Button not visible for sessions older than 7 days
- [ ] Button not visible for currently active sessions

### AC2: Successful Reopen
- [ ] Session becomes active after reopen
- [ ] New 6-character code generated
- [ ] Session marked as "isReopened: true"
- [ ] Location updated to instructor's current location

### AC3: QR Code Display
- [ ] QR code appears within 500ms of reopen completion
- [ ] QR code contains correct URL with new code
- [ ] QR code updates when code rotates
- [ ] QR code is scannable and leads to student check-in with code auto-filled

### AC4: State Management
- [ ] `state.showHistory` is set to false
- [ ] `state.session` contains reopened session data
- [ ] `state.currentCode` contains new generated code
- [ ] `state.isReopenedSession` is true
- [ ] `state.cachedQRCode` is updated or regenerated

### AC5: UI Feedback
- [ ] Loading indicator shown during reopen process
- [ ] "Reopened for Late Check-ins" badge visible on session view
- [ ] Code countdown timer starts from full duration
- [ ] Close button text changes to "Close" (not "End Session")

### AC6: Late Check-in Marking
- [ ] Students checking into reopened session are marked as late
- [ ] `lateCheckIn: true` flag set on attendance records

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Location access denied | Show "Location access required to reopen session" |
| Session not found in Firebase | Show "Session not found" alert |
| Firebase write fails | Show "Error reopening session: {message}" |
| QR library not loaded | Show fallback text "QR code unavailable" |

## Test Cases

### E2E: Reopen Session Shows QR Code
```gherkin
Given an instructor has an ended session from today
When the instructor clicks "Reopen for Late"
And confirms the reopen dialog
Then the session view displays with a new code
And the QR code is visible and contains the new code
And the "Reopened for Late Check-ins" badge is visible
```

### E2E: QR Code is Scannable After Reopen
```gherkin
Given an instructor has reopened a session
And the QR code is displayed
When a student scans the QR code
Then the student mode opens with code auto-filled
And the student can submit attendance successfully
```

### E2E: Code Rotation Updates QR After Reopen
```gherkin
Given an instructor has reopened a session
And the QR code is displayed with code ABC123
When the code rotation timer expires
Then a new code is generated
And the QR code updates to contain the new code
```

## Related
- `instructor-attendance-session.md` - Main instructor journey
- `student-check-in.md` - Student check-in flow
- `database.rules.json` - Session update rules
