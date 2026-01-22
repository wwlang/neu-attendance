# Journey: Student Attendance Submission Authentication

## Overview
A student submits attendance via the web app. The system authenticates anonymously before writing to Firebase to satisfy database security rules requiring authenticated writes.

## Actor
University student

## Preconditions
- Active attendance session exists (instructor has started)
- Student has entered required information (ID, name, email, code)
- Firebase Anonymous Authentication is enabled in Firebase Console

## Trigger
Student clicks "Submit Attendance" button

## Problem Statement
Students receive "Permission Denied" errors when submitting attendance on the production site. The Firebase security rules require `auth != null` for attendance writes, but anonymous authentication may not be properly enabled in the Firebase Console for the production project.

## Technical Flow

### 1. User Clicks Submit
- Form validation passes
- System checks if user is authenticated

### 2. Anonymous Authentication
- If `auth.currentUser` is null, call `auth.signInAnonymously()`
- Firebase returns a user credential with an anonymous UID
- User is now authenticated (`auth.currentUser` is set)

### 3. Database Write
- System writes to `/attendance/{sessionId}/` with `.push()`
- Firebase rules validate: `auth != null && !data.exists()`
- Write succeeds because user is authenticated

## Acceptance Criteria

### AC1: Anonymous Auth Enabled
- [ ] Anonymous authentication is enabled in Firebase Console for production project
- [ ] Setting path: Firebase Console > Authentication > Sign-in method > Anonymous

### AC2: Auth Before Write
- [ ] `auth.signInAnonymously()` is called before any attendance write
- [ ] If anonymous auth fails, user sees "Authentication error. Please refresh and try again."
- [ ] Error is logged to console: `Anonymous auth failed: {error}`

### AC3: Database Rules Compatible
- [ ] Security rules allow authenticated users to create new attendance records
- [ ] Rules at `/attendance/$sessionId/$recordId` check `auth != null && !data.exists()`
- [ ] Instructors can update any record (for manual approval)

### AC4: Error Messages
- [ ] "Permission Denied" errors show user-friendly message, not raw Firebase error
- [ ] Suggest refreshing page if auth fails
- [ ] Log detailed error to console for debugging

### AC5: Emulator vs Production Parity
- [ ] Emulator and production both require anonymous auth for students
- [ ] Test auth mode (`testAuth=student`) uses same anonymous auth flow
- [ ] No difference in auth requirements between environments

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Anonymous auth disabled in Firebase Console | `signInAnonymously()` rejects, show "Authentication error" |
| Network error during auth | Show "Authentication error. Please refresh and try again." |
| Auth succeeds but write denied | Check rules - may be wrong path or validation failure |
| Token expired mid-session | Firebase SDK should auto-refresh, if not, prompt refresh |

## Verification Steps

### Manual Verification
1. Open Firebase Console > Authentication > Sign-in method
2. Verify "Anonymous" provider is enabled
3. Open production site in incognito window
4. Submit attendance as student
5. Check no "Permission Denied" errors
6. Verify attendance record appears in Firebase Console > Database

### Test Verification
- E2E test: Student submits attendance successfully
- E2E test: Auth failure shows appropriate error message
- E2E test: Attendance appears in instructor's list after submission

## Related
- `database.rules.json` - Firebase security rules
- `docs/firebase-security-rules.md` - Security documentation
- `student-check-in.md` - Main student journey
