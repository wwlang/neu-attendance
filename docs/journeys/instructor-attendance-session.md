# Journey: Instructor Runs Attendance Session

## Overview
An instructor starts a class session, displays a rotating attendance code, monitors student check-ins in real-time, handles failed attempts, and exports the final attendance list.

## Actor
University instructor/lecturer

## Preconditions
- Instructor has access to the attendance system URL
- Instructor is physically present in the classroom
- Instructor's device has location services enabled

## Trigger
Instructor needs to take attendance for a class session

## Flow

### 1. Access Instructor Mode
- Navigate to the attendance URL
- Select "I'm the Instructor" or use `?mode=teacher` URL parameter

### 2. Configure Session
- Enter class name (e.g., "Business Communication - Section A")
- Set classroom radius (20-200m, default 50m)
- Review pre-generated QR codes for student access

### 3. Start Session
- Click "Start Session"
- System captures instructor's GPS location as classroom center
- System generates first 6-character attendance code
- Code rotation timer begins (2-minute intervals)

### 4. Display Code to Students
- Large code displayed prominently on screen
- QR code available for easy student scanning
- Timer shows time until next code rotation

### 5. Monitor Attendance (Real-time)
- Watch attendance list populate as students check in
- See student count, names, IDs, timestamps
- Review failed attempts panel for verification issues

### 6. Handle Failed Attempts
- Review students who failed location/code verification
- See failure reason (wrong code, too far, expired code)
- Manually approve legitimate students with GPS issues

### 7. End Session
- Click "End Session" when attendance is complete
- Export attendance to CSV if needed
- System clears active session

## Acceptance Criteria

### AC1: Session Creation
- [ ] Can enter descriptive class name
- [ ] Can adjust radius from 20m to 200m
- [ ] System captures GPS coordinates on session start
- [ ] Session is marked as active in Firebase

### AC2: Code Display & Rotation
- [ ] 6-character alphanumeric code displayed clearly
- [ ] Code rotates automatically every 2 minutes
- [ ] Countdown timer visible
- [ ] QR code updates with each code rotation

### AC3: Real-time Attendance Tracking
- [ ] New check-ins appear within 2 seconds
- [ ] List shows student ID, name, email, timestamp
- [ ] Count updates automatically
- [ ] Most recent check-in highlighted

### AC4: Failed Attempts Management
- [ ] Failed attempts logged with reason
- [ ] Shows student details, distance, allowed radius
- [ ] "Approve" button moves student to attendance list
- [ ] Approved students marked as manually approved

### AC5: Data Export
- [ ] CSV export includes all collected fields
- [ ] Filename includes class name and date
- [ ] UTF-8 encoding with BOM for Excel compatibility

### AC6: Session Lifecycle
- [ ] Only one active session at a time
- [ ] End session clears active session marker
- [ ] Historical data persists in Firebase

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Location denied | Show error, prevent session start |
| Firebase connection lost | Show offline indicator, queue updates |
| Browser refresh mid-session | Ability to reconnect to active session |

## Metrics
- Time to start session: < 10 seconds (including GPS acquisition)
- Code rotation reliability: 100%
- Real-time update latency: < 2 seconds
