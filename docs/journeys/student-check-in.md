# Journey: Student Checks In to Class

## Overview
A student accesses the attendance system, enters their details and the displayed code, and receives confirmation that their attendance has been recorded.

## Actor
University student

## Preconditions
- Active attendance session exists (instructor has started)
- Student is physically present in the classroom
- Student's device has location services enabled
- Student can see the attendance code displayed by instructor

## Trigger
Instructor displays attendance code and asks students to check in

## Flow

### 1. Access Student Mode
- Scan QR code displayed by instructor, OR
- Navigate to attendance URL and select "I'm a Student", OR
- Use `?mode=student` URL parameter

### 2. Grant Location Permission
- Browser prompts for location access
- System acquires GPS coordinates
- Location accuracy displayed to student

### 3. Enter Details
- Enter student number (e.g., "11223344")
- Enter full name (e.g., "Nguyen Van A")
- Enter email (e.g., "student@st.neu.edu.vn")

### 4. Enter Attendance Code
- View code displayed on instructor's screen
- Enter 6-character code (auto-uppercased)

### 5. Submit Attendance
- Click "Submit Attendance"
- System verifies:
  - Code matches current or recent code
  - Student location within allowed radius
  - Student ID not already checked in
  - Device not already used

### 6. Receive Confirmation
- Success: Green confirmation message
- Failure: Error message with reason

## Acceptance Criteria

### AC1: Location Acquisition
- [ ] Location permission requested on page load
- [ ] GPS coordinates acquired with accuracy indicator
- [ ] "Retry Location" button available if acquisition fails
- [ ] Submit button disabled until location acquired

### AC2: Device Fingerprinting
- [ ] Unique device ID generated automatically
- [ ] Device ID displayed to student (transparency)
- [ ] Same device cannot check in multiple students

### AC3: Form Validation
- [ ] All fields required (student ID, name, email, code)
- [ ] Code must be exactly 6 characters
- [ ] Email must contain @ symbol
- [ ] Clear error messages for validation failures

### AC4: Code Verification
- [ ] Current code accepted
- [ ] Previous code accepted within grace period (60s)
- [ ] Invalid code rejected with clear message
- [ ] Expired code rejected with clear message

### AC5: Location Verification
- [ ] Distance calculated using Haversine formula
- [ ] Within radius: check-in succeeds
- [ ] Beyond radius: check-in fails, logged for instructor review
- [ ] Distance shown in error message

### AC6: Duplicate Prevention
- [ ] Same student ID cannot check in twice
- [ ] Same device ID cannot check in twice
- [ ] Clear error message for duplicates

### AC7: Success Confirmation
- [ ] Green success message displayed
- [ ] Class name shown in confirmation
- [ ] "You can close this page" instruction
- [ ] Code field cleared after success

### AC8: Failed Attempt Logging
- [ ] Failed attempts logged to Firebase
- [ ] Includes all student details
- [ ] Includes failure reason
- [ ] Available for instructor to manually approve

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Location denied | Show error, disable submit, offer retry |
| No active session | "No active session" error message |
| Wrong code | Log failed attempt, show error |
| Too far from classroom | Log failed attempt, show distance |
| Already checked in | "Already checked in" error |
| Device already used | "Device already used" error |

## Metrics
- Time to complete check-in: < 30 seconds
- Location acquisition success rate: > 95%
- First-attempt success rate: > 90%
