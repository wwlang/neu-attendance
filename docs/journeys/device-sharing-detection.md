# Journey: Device Sharing Detection Across Sessions

## Overview
Detect and flag potential attendance fraud when a device ID is used by different students across multiple sessions. Provides transparency to students and real-time alerts to instructors while allowing legitimate device sharing scenarios.

## Actors
- **Student** - Checking in with a device
- **Instructor** - Monitoring session and reviewing flagged check-ins
- **System** - Tracking device-student associations and flagging anomalies

## Problem Statement

### Current State
- Device fingerprinting blocks same-device check-ins within a single session
- No tracking of device-to-student associations across sessions
- Students could use one phone to check in for absent friends in different sessions
- Instructors have no visibility into cross-session device sharing patterns

### Symptoms of Fraud
- Student A checks in with Device X on Monday
- Student B checks in with Device X on Wednesday (Student A was absent)
- System currently accepts both - no flag raised
- Pattern indicates potential proxy attendance

### Legitimate Cases
- Family members sharing a tablet
- Student got a new phone
- Borrowed phone when own phone died
- Shared lab computers (though uncommon for mobile check-in)

### Goal
Flag suspicious patterns for instructor review without blocking legitimate scenarios.

## Solution Design

### Device-Student History Tracking
```
deviceHistory/
  {deviceId}/
    {studentId}: {
      firstSeen: timestamp,
      lastSeen: timestamp,
      sessionCount: number
    }
```

### Policy Acknowledgment Storage
```
deviceAcknowledgments/
  {deviceId}: {
    acknowledged: true,
    timestamp: number,
    studentId: string  // First student to acknowledge
  }
```

### Flagged Check-ins
Add `flagged` field to attendance records:
```
attendance/{sessionId}/{studentId}/
  ...existing fields...
  flagged: {
    reason: 'device_shared',
    previousStudentId: string,
    previousStudentName: string,
    previousSessionDate: string,
    acknowledged: boolean  // Student saw warning and proceeded
  }
```

## Preconditions
- Active attendance session exists
- Student has generated device ID
- Device history tracking enabled (new feature)

## Flow

### Primary Flow: First-Time Device User
1. Student scans QR code, enters details
2. System checks `deviceAcknowledgments/{deviceId}`
3. **No acknowledgment found** - First time using this device
4. Show policy warning modal:
   > "This device will be linked to your student ID. Do not use this device to check in other students - this will be flagged to your instructor."
5. Student clicks "I Understand"
6. System records acknowledgment in `deviceAcknowledgments/{deviceId}`
7. Proceed with normal check-in
8. System records association in `deviceHistory/{deviceId}/{studentId}`

### Secondary Flow: Same Student, Same Device (Normal)
1. Student scans QR code
2. System checks `deviceAcknowledgments/{deviceId}` - exists
3. System checks `deviceHistory/{deviceId}` for this studentId
4. **Student ID matches previous usage** - No flag
5. Proceed with normal check-in
6. Update `lastSeen` and `sessionCount` in device history

### Flagged Flow: Different Student, Same Device
1. Student B scans QR code on Device X
2. System checks `deviceHistory/{deviceId}`
3. **Different studentId found** - Device previously used by Student A
4. Show warning modal to Student B:
   > "Warning: This device was previously used by another student (A****). Checking in will be flagged to the instructor. Proceed only if this is your legitimate device."
   > [Cancel] [Proceed Anyway]
5. If Cancel: Return to form, no check-in
6. If Proceed:
   - Show confirmation: "Your check-in will be flagged for instructor review."
   - Submit attendance with `flagged` field populated
   - Instructor sees real-time alert

### Instructor Alert Flow
1. Flagged check-in submitted
2. Real-time listener triggers alert in instructor dashboard
3. Alert shows:
   - Student who just checked in
   - Device ID
   - Previous student(s) who used this device
   - "Dismiss" or "Investigate" actions
4. Flagged check-ins highlighted in attendance list
5. Included in session summary and CSV export

## Acceptance Criteria

### AC1: Device Policy Acknowledgment (First Use)
- [ ] AC1.1: On first device use, show policy warning modal before check-in
- [ ] AC1.2: Modal text explains device linking and fraud flagging policy
- [ ] AC1.3: "I Understand" button required to proceed
- [ ] AC1.4: Acknowledgment stored in `deviceAcknowledgments/{deviceId}`
- [ ] AC1.5: Warning only shows once per device (not per session)
- [ ] AC1.6: Modal respects dark mode styling

### AC2: Device History Tracking
- [ ] AC2.1: On successful check-in, record to `deviceHistory/{deviceId}/{studentId}`
- [ ] AC2.2: Store `firstSeen`, `lastSeen`, `sessionCount` timestamps
- [ ] AC2.3: Update `lastSeen` and increment `sessionCount` on repeat check-ins
- [ ] AC2.4: History persists across sessions (not session-scoped)

### AC3: Cross-Session Device Sharing Detection
- [ ] AC3.1: Before check-in, query `deviceHistory/{deviceId}` for other students
- [ ] AC3.2: If different studentId found, trigger flagged flow
- [ ] AC3.3: Detection considers all historical students, not just most recent
- [ ] AC3.4: Comparison uses normalized studentId (case-insensitive, trimmed)

### AC4: Student Warning for Flagged Device
- [ ] AC4.1: Show warning modal when device previously used by another student
- [ ] AC4.2: Display masked previous student ID (e.g., "A*****123")
- [ ] AC4.3: Inform student check-in will be flagged to instructor
- [ ] AC4.4: Provide "Cancel" and "Proceed Anyway" options
- [ ] AC4.5: "Cancel" returns to form without submitting
- [ ] AC4.6: "Proceed Anyway" submits with flagged status
- [ ] AC4.7: Modal respects dark mode styling

### AC5: Flagged Attendance Record
- [ ] AC5.1: Flagged check-ins include `flagged` object in record
- [ ] AC5.2: `flagged.reason` set to 'device_shared'
- [ ] AC5.3: `flagged.previousStudentId` contains other student's ID
- [ ] AC5.4: `flagged.previousStudentName` contains other student's name (if available)
- [ ] AC5.5: `flagged.acknowledged` indicates student saw and accepted warning
- [ ] AC5.6: Non-flagged check-ins have no `flagged` field (not `flagged: null`)

### AC6: Instructor Real-Time Alerts
- [ ] AC6.1: When flagged check-in occurs during active session, show alert banner
- [ ] AC6.2: Alert shows student name, device ID, and previous user
- [ ] AC6.3: Alert has "Dismiss" action to hide it
- [ ] AC6.4: Multiple flagged check-ins queue as separate alerts
- [ ] AC6.5: Alert visible for 30 seconds if not dismissed
- [ ] AC6.6: Alert respects dark mode styling

### AC7: Instructor Attendance List Integration
- [ ] AC7.1: Flagged check-ins highlighted with warning icon in attendance list
- [ ] AC7.2: Tooltip/hover shows flag details (reason, previous student)
- [ ] AC7.3: Filter option to show only flagged check-ins
- [ ] AC7.4: Flagged status included in CSV export

### AC8: Session Summary Integration
- [ ] AC8.1: Session summary shows count of flagged check-ins
- [ ] AC8.2: Flagged student list with details in summary modal
- [ ] AC8.3: Export includes flag information in separate column

### AC9: Privacy Considerations
- [ ] AC9.1: Device history stored per instructor (not globally accessible)
- [ ] AC9.2: Student warning shows masked ID, not full studentId/name
- [ ] AC9.3: History data can be purged on request (data retention)
- [ ] AC9.4: No PII in deviceHistory - only studentIds and timestamps

### AC10: Edge Cases
- [ ] AC10.1: Handle device with 3+ different students gracefully
- [ ] AC10.2: Works correctly if deviceHistory lookup fails (network error)
- [ ] AC10.3: Works correctly for manual instructor adds (deviceId: 'MANUAL')
- [ ] AC10.4: First-time user warning appears even if device history exists from before feature
- [ ] AC10.5: Acknowledgment and history creation are atomic (both succeed or both fail)

## Data Model

### New Collection: deviceHistory
```
deviceHistory/
  DEV-1A2B3C4D/
    12345678:                    // studentId
      firstSeen: 1706000000000
      lastSeen: 1706500000000
      sessionCount: 5
    87654321:                    // different studentId - FLAGGED
      firstSeen: 1706600000000
      lastSeen: 1706600000000
      sessionCount: 1
```

### New Collection: deviceAcknowledgments
```
deviceAcknowledgments/
  DEV-1A2B3C4D:
    acknowledged: true
    timestamp: 1706000000000
    studentId: "12345678"        // First student to acknowledge
```

### Extended Attendance Record
```
attendance/
  {sessionId}/
    {studentId}/
      studentName: "John Doe"
      email: "john@neu.edu"
      timestamp: 1706000000000
      deviceId: "DEV-1A2B3C4D"
      location: { lat: 21.0285, lng: 105.8542 }
      flagged:                   // NEW - only present if flagged
        reason: "device_shared"
        previousStudentId: "87654321"
        previousStudentName: "Jane Doe"
        acknowledged: true
```

## Security Rules

### deviceHistory
```json
{
  "deviceHistory": {
    "$deviceId": {
      ".read": "auth != null",
      "$studentId": {
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['firstSeen', 'lastSeen', 'sessionCount'])"
      }
    }
  }
}
```

### deviceAcknowledgments
```json
{
  "deviceAcknowledgments": {
    "$deviceId": {
      ".read": true,
      ".write": "!data.exists() && auth != null",
      ".validate": "newData.hasChildren(['acknowledged', 'timestamp', 'studentId'])"
    }
  }
}
```

Note: `deviceAcknowledgments` is write-once (first student only) to prevent tampering.

## UI Mockups

### First-Time Device Warning Modal
```
+-------------------------------------------+
|  Device Policy Notice                     |
|-------------------------------------------|
|                                           |
|  [!] Important: Device Linking            |
|                                           |
|  This device will be linked to your       |
|  student ID for attendance tracking.      |
|                                           |
|  DO NOT use this device to check in       |
|  for other students. Any check-ins from   |
|  this device by different students will   |
|  be flagged to your instructor.           |
|                                           |
|  [ I Understand ]                         |
|                                           |
+-------------------------------------------+
```

### Device Sharing Warning Modal
```
+-------------------------------------------+
|  Warning: Device Previously Used          |
|-------------------------------------------|
|                                           |
|  [!] This device was previously used by:  |
|      Student ID: 8*****21                 |
|                                           |
|  If you proceed, your check-in will be    |
|  flagged to the instructor for review.    |
|                                           |
|  Only proceed if this is legitimately     |
|  your device (e.g., new phone, shared     |
|  family device).                          |
|                                           |
|  [ Cancel ]     [ Proceed Anyway ]        |
|                                           |
+-------------------------------------------+
```

### Instructor Alert Banner
```
+-------------------------------------------+
|  [!] Flagged Check-in: John Doe           |
|      Device DEV-1A2B used by Jane Doe     |
|      previously             [ Dismiss ]   |
+-------------------------------------------+
```

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Network error checking device history | Proceed with check-in, log error |
| Network error storing acknowledgment | Block check-in, show retry option |
| Device history corrupt/malformed | Treat as first-time device |
| Multiple flagged check-ins simultaneously | Queue alerts, show in sequence |
| Instructor offline when flag occurs | Flag stored in record, visible on reconnect |

## Metrics

| Metric | Target |
|--------|--------|
| False positive rate | < 10% of flagged check-ins are legitimate |
| Detection rate | > 95% of actual device sharing detected |
| Student friction (first-time) | + 5 seconds for acknowledgment |
| Student friction (flagged) | + 10 seconds if proceeding anyway |
| Instructor alert latency | < 2 seconds from check-in |

## Related Journeys
- `student-check-in.md` - Core check-in flow (AC6: Duplicate Prevention)
- `attendance-deduplication.md` - Same-session duplicate handling
- `instructor-attendance-session.md` - Instructor monitoring flow

## Technical Notes

### Performance Considerations
- Device history lookup adds one database read before check-in
- Use `.limitToLast(10)` on device history to cap query size
- Cache acknowledgment status in localStorage to skip read on repeat visits
- Index `deviceHistory/{deviceId}` by `lastSeen` for efficient queries

### False Positive Mitigation
- Only flag if previous student's last check-in was within 30 days
- Consider: Allow instructor to "whitelist" device-student pairs
- Consider: After 3+ flagged sessions with same pair, auto-whitelist

### Implementation Order
1. Database structure and security rules
2. Policy acknowledgment flow (AC1)
3. Device history tracking (AC2)
4. Detection and student warning (AC3, AC4)
5. Flagged record storage (AC5)
6. Instructor alerts (AC6)
7. Attendance list integration (AC7)
8. Session summary integration (AC8)
9. Privacy and edge cases (AC9, AC10)
