# Journey: Attendance Deduplication via Atomic Key Structure

## Overview
Prevent duplicate attendance submissions caused by race conditions by restructuring the database to use studentId as the attendance record key, enforced by write-once security rules.

## Actor
- Student (submitting attendance)
- System (enforcing uniqueness)

## Problem Statement

### Current State
- Attendance records use Firebase `push()` for auto-generated IDs
- Structure: `attendance/{sessionId}/{pushId}/{...record}`
- Duplicate check uses check-then-write pattern:
  1. Query: `orderByChild('studentId').equalTo(id)`
  2. If no result, write new record
- **Race condition**: Two rapid submissions can both pass the check before either writes

### Symptoms
- Same student appearing twice in attendance list
- Possible in scenarios: network latency, double-tap, browser refresh during submit
- Manual cleanup required by instructors

### Root Cause
Non-atomic check-then-write pattern. The check and write are separate operations with a time gap where concurrent requests can interleave.

## Solution

### New Structure
Use studentId as the key, making the path itself unique:
```
attendance/{sessionId}/{studentId}/{...record}
```

### Enforcement
Security rule prevents overwrites:
```json
{
  "attendance": {
    "$sessionId": {
      "$studentId": {
        ".write": "!data.exists()"
      }
    }
  }
}
```

### Benefits
1. **Atomic**: Write either succeeds (first) or fails (duplicate) - no race condition
2. **Simpler code**: No pre-query needed, just `set()` and handle failure
3. **Faster**: One write operation instead of read + write
4. **Smaller bandwidth**: No query response before write

## Preconditions
- Active attendance session exists
- Student has submitted attendance form
- Firebase security rules deployed

## Flow

### Primary Flow: First Check-In (Success)
1. Student submits attendance form
2. System calls `set()` at `attendance/{sessionId}/{studentId}`
3. Security rule: `!data.exists()` evaluates to true
4. Write succeeds
5. Student sees success confirmation

### Secondary Flow: Duplicate Attempt (Blocked)
1. Student submits attendance (e.g., double-tap, refresh)
2. System calls `set()` at `attendance/{sessionId}/{studentId}`
3. Security rule: `!data.exists()` evaluates to false (record exists)
4. Write fails with PERMISSION_DENIED
5. System catches error, shows "Already checked in" message

## Acceptance Criteria

### AC1: Database Structure Change
- [ ] Attendance records stored at `attendance/{sessionId}/{studentId}` (not push ID)
- [ ] studentId extracted and used as key in all write operations
- [ ] Record contains all existing fields (name, email, timestamp, location, etc.)

### AC2: Security Rule Enforcement
- [ ] Write-once rule deployed: `.write": "!data.exists()"`
- [ ] First write succeeds for any studentId
- [ ] Second write to same path fails with permission error
- [ ] Instructor can still delete/modify via admin SDK if needed

### AC3: Code Changes - Submission
- [ ] `submitAttendance()` uses `set()` at studentId path instead of `push()`
- [ ] Error handler catches PERMISSION_DENIED and shows "Already checked in"
- [ ] Pre-query duplicate check removed (security rule handles it)

### AC4: Code Changes - Approval Flow
- [ ] `approveStudent()` uses `set()` at studentId path
- [ ] `addStudent()` (instructor manual add) uses `set()` at studentId path
- [ ] Bulk approval handles studentId-keyed writes

### AC5: Code Changes - Reading
- [ ] `loadAttendance()` reads correctly from new structure
- [ ] Student lookup works with new key structure
- [ ] Analytics/export functions work with new structure

### AC6: Data Migration
- [ ] Migration script converts existing `attendance/{sessionId}/{pushId}` to `attendance/{sessionId}/{studentId}`
- [ ] Migration handles duplicates: keep earliest record, log removed duplicates
- [ ] Migration runs one-time before code deployment
- [ ] Rollback procedure documented

### AC7: Backwards Compatibility
- [ ] Old records (pre-migration) remain accessible
- [ ] Mix of old and new records handled gracefully during migration window
- [ ] No data loss during transition

### AC8: Error Handling
- [ ] PERMISSION_DENIED error caught and translated to user-friendly message
- [ ] Race condition no longer possible (verified by test)
- [ ] Network failures still handled appropriately

### AC9: Test Coverage
- [ ] Unit test: `set()` called with studentId as key
- [ ] Unit test: PERMISSION_DENIED translated to "Already checked in"
- [ ] Integration test: Rapid double-submission results in single record
- [ ] Integration test: Security rule blocks second write
- [ ] Migration test: Duplicates resolved correctly

## Data Model

### Current Structure (to be migrated)
```
attendance/
  {sessionId}/
    -Nabc123def456/     <- push() generated ID
      studentId: "12345678"
      studentName: "John Doe"
      email: "john@neu.edu"
      timestamp: 1706000000000
      ...
```

### New Structure
```
attendance/
  {sessionId}/
    12345678/           <- studentId as key
      studentName: "John Doe"
      email: "john@neu.edu"
      timestamp: 1706000000000
      ...                <- studentId not duplicated in record body
```

### Security Rules
```json
{
  "rules": {
    "attendance": {
      "$sessionId": {
        ".read": true,
        "$studentId": {
          ".write": "!data.exists() || auth != null",
          ".validate": "newData.hasChildren(['studentName', 'email', 'timestamp'])"
        }
      }
    }
  }
}
```

Note: `.write": "!data.exists() || auth != null"` allows:
- First write (anonymous students) when no data exists
- Subsequent writes (instructors only) when authenticated

## Migration Strategy

### Phase 1: Deploy Security Rules
1. Deploy new rules that support both structures
2. Verify existing functionality works

### Phase 2: Deploy Code Changes
1. Update submission code to use studentId as key
2. Update reading code to handle both structures
3. Deploy to production

### Phase 3: Run Migration
1. Run migration script during low-traffic window
2. Convert all existing records to new structure
3. Verify data integrity

### Phase 4: Cleanup
1. Remove backwards compatibility code
2. Remove old push-ID records (optional, after verification)

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| First submission | Write succeeds, student sees confirmation |
| Duplicate submission (same studentId) | PERMISSION_DENIED, "Already checked in" shown |
| Network error during write | Standard network error handling |
| Invalid studentId format | Validation fails before write attempt |
| Migration encounters duplicate | Keep earliest, log and skip later records |

## Technical Notes

### Firebase-Specific
- `set()` creates or overwrites at a path
- With `!data.exists()` rule, `set()` only succeeds if path empty
- PERMISSION_DENIED error code used to detect blocked duplicate
- No transaction needed - single atomic operation

### Performance Impact
- **Improved**: One `set()` vs query + `push()`
- **No index needed**: Direct path access, no `orderByChild` query
- **Smaller payload**: No query response before write

### Rollback Plan
If issues discovered:
1. Revert security rules to allow any write
2. Revert code to use `push()` pattern
3. Re-run forward migration later

## Related
- `student-check-in.md` - Student check-in journey (AC6: Duplicate Prevention)
- `database.rules.json` - Firebase security rules
- `index.html` - Submission code implementation

## References
- Firebase Security Rules: https://firebase.google.com/docs/database/security
- Write-once pattern: https://firebase.google.com/docs/database/security/rules-conditions#write-once
