# Journey: Attendance History Device Verification

## Status

```yaml
status: planned
implementation_priority: P3
implementation_percent: 0
last_reviewed: 2026-01-23
```

## Overview

Student attendance history is only viewable if the student's current device ID matches a device ID previously used for check-in with that student ID. This prevents students from viewing other students' attendance records by entering arbitrary student IDs.

## Actor

University student attempting to view attendance history

## Preconditions

- Student has navigated to the attendance history lookup page
- Student enters their student ID to search
- Device fingerprinting is active

## Trigger

Student submits student ID to view attendance history

## User Story

As a student, I want my attendance history protected so that other students cannot view my records by guessing my student ID.

## Flow

### Primary Flow: Authorized Device

1. **Enter Student ID** -> Student submits their ID to search
2. **Verify Device** -> System checks if current device ID has been used with this student ID
3. **Match Found** -> Device ID exists in student's attendance records
4. **Show History** -> Attendance records displayed

### Alternative Flow: First-Time Access Warning

1. **Enter Student ID** -> Student submits their ID
2. **Verify Device** -> Device match found
3. **First Access Detected** -> No previous acknowledgment
4. **Show Warning** -> "Your attendance history is tied to this device for privacy"
5. **Acknowledge** -> Student clicks "I Understand"
6. **Show History** -> Records displayed

### Rejected Flow: Unauthorized Device

1. **Enter Student ID** -> Student submits an ID
2. **Verify Device** -> Current device ID NOT in any attendance records for this student ID
3. **Deny Access** -> Show explanation message
4. **No History** -> Cannot proceed without matching device

## Acceptance Criteria

### AC1: Device Verification
- [ ] AC1.1: Before showing history, query attendance records for submitted student ID
- [ ] AC1.2: Extract all unique device IDs from student's attendance records
- [ ] AC1.3: Compare current device fingerprint against extracted device IDs
- [ ] AC1.4: Match required to proceed (case-insensitive comparison)

### AC2: Authorized Access
- [ ] AC2.1: If device matches, allow viewing attendance history
- [ ] AC2.2: All existing functionality preserved (stats, table, sorting)
- [ ] AC2.3: No additional friction for authorized users after first warning

### AC3: First-Time Warning
- [ ] AC3.1: On first authorized access, show warning modal before results
- [ ] AC3.2: Warning text: "Your attendance history is tied to this device for privacy. You can only view your history from a device you've previously used to check in."
- [ ] AC3.3: "I Understand" button required to proceed
- [ ] AC3.4: Acknowledgment stored in localStorage (device-scoped)
- [ ] AC3.5: Warning only shown once per device (not per search)

### AC4: Denied Access
- [ ] AC4.1: If no device match, show denial message
- [ ] AC4.2: Message: "This device has not been used to check in with this student ID. You can only view attendance history from a device you've previously used for check-in."
- [ ] AC4.3: No attendance data shown
- [ ] AC4.4: Clear call-to-action to return to home

### AC5: Edge Cases
- [ ] AC5.1: Students with no attendance records see "No records found" (not denial)
- [ ] AC5.2: Handle device fingerprint unavailable (deny access with explanation)
- [ ] AC5.3: Handle network errors gracefully (retry option)
- [ ] AC5.4: Manual instructor-added records (deviceId: 'MANUAL') do not count for verification

### AC6: UI/UX
- [ ] AC6.1: Warning and denial modals use consistent styling
- [ ] AC6.2: Dark mode support for all modals
- [ ] AC6.3: Mobile-friendly modal sizing

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No attendance records for student ID | Show "No records found" (not device error) |
| Device fingerprint unavailable | Show "Unable to verify device" error |
| All records have deviceId: 'MANUAL' | Deny access (no device can match) |
| Network error during verification | Show error with retry option |

## Security Considerations

- **Threat mitigated**: Student A cannot view Student B's attendance by guessing student ID
- **Device binding**: History access requires physical access to a device that checked in
- **Limitation**: Students who share devices legitimately may see each other's records (acceptable trade-off)
- **Privacy**: Device IDs are not exposed to users, only used for server-side comparison

## Technical Implementation

### Verification Logic
```javascript
const verifyDeviceAccess = async (studentId) => {
  const currentDeviceId = await getDeviceFingerprint();
  if (!currentDeviceId) {
    return { authorized: false, reason: 'fingerprint_unavailable' };
  }

  // Query all attendance records for this student
  const records = await queryAttendanceByStudentId(studentId);

  if (records.length === 0) {
    return { authorized: true, reason: 'no_records' }; // Allow search, will show empty
  }

  // Extract unique device IDs (excluding MANUAL)
  const deviceIds = [...new Set(
    records
      .filter(r => r.deviceId && r.deviceId !== 'MANUAL')
      .map(r => r.deviceId.toLowerCase())
  )];

  const isAuthorized = deviceIds.includes(currentDeviceId.toLowerCase());
  return { authorized: isAuthorized, reason: isAuthorized ? 'matched' : 'no_match' };
};
```

### localStorage Keys
```javascript
// Track first-time warning acknowledgment
const DEVICE_WARNING_KEY = 'attendanceHistoryWarningAcknowledged';
```

## Data Model

No database changes required. Uses existing attendance record structure:
```
attendance/{sessionId}/{studentId}/
  deviceId: string  // Already captured during check-in
```

## Metrics

- Verification time: < 500ms (single query)
- False positive rate: 0% (exact device match required)
- False negative rate: Low (only affects device-changed students)

## Dependencies

- Device fingerprinting (already implemented)
- Attendance records with deviceId (already captured)
- localStorage for warning acknowledgment
