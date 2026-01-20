# Journey: Student Checks In to Class

## Overview
A student scans the instructor's QR code and confirms their attendance with a single tap (returning students) or enters their details once (new students). The system remembers student info for frictionless future check-ins.

## Actor
University student

## Preconditions
- Active attendance session exists (instructor has started)
- Student is physically present in the classroom
- Student's device has location services enabled
- Student can see the QR code displayed by instructor

## Trigger
Instructor displays QR code and asks students to check in

## Flow

### Primary Flow: Returning Student (Scan & Confirm)
**This is the principal flow - optimized for speed and simplicity.**

1. **Scan QR Code** → QR contains URL with embedded code: `?mode=student&code=ABC123`
2. **See Quick Confirm Screen** → Shows saved name, student ID, and "Confirm Attendance" button
3. **One Tap to Confirm** → Click "Confirm Attendance"
4. **Done** → Success message, can close page

**Total interaction: Scan + 1 tap**

### Secondary Flow: New Student (First Time Registration)
**Only required on first use - info saved for future sessions.**

1. **Scan QR Code** → Code auto-populated from URL
2. **Enter Details Once** → Student ID, name, email
3. **Submit** → Info saved to device for future check-ins
4. **Done** → Success message

### Alternative Flow: Manual Entry
- Navigate to URL manually (no QR scanner)
- Enter 6-character code displayed by instructor
- Continue with returning/new student flow above

## Detailed Steps

### 1. Access Student Mode (QR Scan)
- Scan QR code displayed by instructor
- QR contains URL with embedded code: `?mode=student&code=ABC123`
- Code field auto-populated from URL parameter
- Alternative: Navigate manually and enter code by hand

### 2. Check for Saved Student Info
- System checks localStorage for previously saved details
- **If saved info found (PRINCIPAL PATH)**: Show quick confirm screen
  - Display: "Welcome back, [Name]!" with student ID visible
  - Primary action: **"Confirm Attendance"** button (prominent)
  - Secondary action: "Edit Details" link (subtle)
- **If no saved info**: Show registration form

### 3. Grant Location Permission
- Browser prompts for location access (if not already granted)
- System acquires GPS coordinates
- Location accuracy displayed to student
- Location is optional but recommended

### 4. Confirm/Enter Details
- **Returning student**: One-tap confirm (details already saved)
- **New student**: Enter student number, full name, email
- Code field already populated from QR scan

### 5. Submit Attendance
- Click "Confirm Attendance" or "Submit Attendance"
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
- [x] Location permission requested when submitting attendance (not on page load)
- [x] GPS coordinates acquired with accuracy indicator
- [x] "Retry Location" button available if acquisition fails
- [x] Submit button works without location (optional GPS)
- [x] Pre-prompt explains value: "Location helps verify you're in class"

### AC2: Device Fingerprinting
- [x] Unique device ID generated automatically
- [x] Device ID displayed to student (transparency)
- [x] Same device cannot check in multiple students

### AC3: Form Validation
- [x] All fields required (student ID, name, email, code)
- [x] Code must be exactly 6 characters
- [x] Email must contain @ symbol
- [x] Clear error messages for validation failures

### AC4: Code Verification
- [x] Current code accepted
- [x] Previous code accepted within grace period (180s)
- [x] Recently expired code accepted within 30s of expiration
- [x] Invalid code rejected with clear message
- [x] Expired code (beyond grace windows) rejected with clear message

### AC5: Location Verification
- [x] Distance calculated using Haversine formula
- [x] Within radius: check-in succeeds
- [x] Beyond radius: check-in fails, logged for instructor review
- [x] Distance shown in error message

### AC6: Duplicate Prevention
- [x] Same student ID cannot check in twice
- [x] Same device ID cannot check in twice
- [x] Clear error message for duplicates
- [x] If same device ID submits different student ID, flag as potential typo for instructor review

### AC6.1: Remember Student Info (Cookies/LocalStorage)
- [x] Student ID, name, and email saved to localStorage after ANY submission attempt
- [x] On return visit, form pre-populated with saved values
- [x] Welcome banner shows with "Use Saved Info" / "Enter New Details" buttons
- [x] "Clear saved info" option available (link at bottom of form)
- [x] Device ID persists across sessions (same device = same fingerprint)

> **BUG FIXED (2026-01-15):** localStorage now populated on form submission (before validation).
> Student info saves on ANY attempt so students don't re-enter info on retry.
> Verified by integration tests: `student-flow.spec.js` AC6.1 tests.

### AC6.2: Quick Confirm for Returning Students (PRINCIPAL FLOW)
- [x] When saved info exists AND code is in URL, show Quick Confirm screen
- [x] Quick Confirm shows: student name, student ID, attendance code
- [x] Primary button: "Confirm Attendance" (large, prominent, green)
- [x] Secondary link: "Edit my details" (small, subtle)
- [x] One tap on "Confirm Attendance" submits immediately (no form interaction)
- [x] Total returning student interaction: Scan QR + 1 tap
- [ ] Metric: Returning student check-in < 5 seconds (to be measured)

> **IMPLEMENTED (2026-01-15):** Quick Confirm screen shows for returning students when:
> 1. Student has saved info in localStorage (from previous check-in)
> 2. Code is provided in URL from QR scan
> Enables frictionless "scan and tap" attendance for returning students.

### AC7: Success Confirmation
- [x] Green success message displayed
- [x] Class name shown in confirmation
- [x] "You can close this page" instruction
- [x] Code field cleared after success
- [x] Audio beep and haptic feedback on success

### AC8: Failed Attempt Logging
- [x] Failed attempts logged to Firebase
- [x] Includes all student details
- [x] Includes failure reason
- [x] Available for instructor to manually approve

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Location denied | Show warning, allow submit without location |
| No active session | "No active session" error message |
| Wrong code | Log failed attempt, show error |
| Too far from classroom | Log failed attempt, show distance |
| Already checked in | "Already checked in" error |
| Device already used | "Device already used" error |

## Friction Analysis

### Interaction Count

| Flow | Interactions | Target | Status |
|------|-------------:|-------:|--------|
| Returning student (QR scan) | 2 | ≤3 | Pass |
| New student (first time) | 5 | ≤5 | Pass |
| Manual code entry | 3 | ≤5 | Pass |

### Friction Score

| Dimension | Score | Notes |
|-----------|------:|-------|
| Cognitive load | 0 | Single clear action per screen |
| Input effort | 1 | Returning: 0 fields; New: 3 fields |
| Wait time | 0 | Submission <100ms |
| Error risk | 1 | Validation prevents most errors |
| Permission ask | 1 | Location requested when submitting |
| **Total** | **3** | Excellent (≤4) |

### Permission Timing

| Permission | Trigger | Fallback if Denied |
|------------|---------|-------------------|
| Location | When tapping "Submit/Confirm" | Check-in continues, marked "No location" |
| Camera | When scanning QR code | Manual code entry available |

## Metrics
- Time to complete check-in: < 30 seconds
- Location acquisition success rate: > 95%
- First-attempt success rate: > 90%
