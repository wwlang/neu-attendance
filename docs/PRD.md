# Product Requirements Document: NEU Quick Attendance

**Version:** 1.0  
**Date:** January 2025  
**Author:** William  
**Status:** Ready for Testing

---

## 1. Product Overview

### 1.1 Purpose
A web-based attendance system that verifies student physical presence in university classrooms using GPS geolocation, rotating access codes, and device fingerprinting.

### 1.2 Problem Statement
Traditional attendance methods (roll call, sign-in sheets) are time-consuming and susceptible to proxy attendance. Students can sign in for absent classmates. Instructors waste valuable class time on administrative tasks.

### 1.3 Solution
A mobile-first web application where:
- Instructors start a session and display a rotating code
- Students scan a QR code or visit a URL on their phones
- The system verifies the student is physically within the classroom radius
- Attendance is recorded in real-time with full audit trail

### 1.4 Key Metrics
- Time to take attendance: < 2 minutes for any class size
- Proxy attendance prevention: 99%+ (via GPS + device ID + rotating codes)
- Instructor intervention rate: < 5% of students need manual approval

---

## 2. User Personas

### 2.1 Instructor (Primary)
- University lecturer teaching classes of 30-200 students
- Has laptop/computer connected to projector
- Needs quick, reliable attendance that doesn't disrupt teaching
- Wants exportable records for grading systems

### 2.2 Student (Primary)
- University student with smartphone
- Attends multiple classes daily
- Expects fast, frictionless check-in process
- May have unreliable GPS (indoor environments)

---

## 3. Functional Requirements

### 3.1 Mode Selection (Home Screen)

| ID | Requirement | Priority |
|----|-------------|----------|
| MS-01 | Display two mode options: "I'm the Instructor" and "I'm a Student" | Must |
| MS-02 | Display QR codes for direct access to each mode | Must |
| MS-03 | Support URL parameters `?mode=teacher` and `?mode=student` for direct navigation | Must |
| MS-04 | Back button returns to mode selection from either mode | Must |

### 3.2 Instructor Mode — Session Setup

| ID | Requirement | Priority |
|----|-------------|----------|
| IS-01 | Text input for class name (required) | Must |
| IS-02 | Slider for classroom radius (20m - 200m, default 50m) | Must |
| IS-03 | Display current radius value in meters | Must |
| IS-04 | "Start Session" button initiates GPS capture | Must |
| IS-05 | Show loading state while acquiring GPS | Must |
| IS-06 | Display error if GPS unavailable/denied | Must |
| IS-07 | Display printable QR codes for student and instructor access | Should |
| IS-08 | Print button for QR codes | Should |

### 3.3 Instructor Mode — Active Session

| ID | Requirement | Priority |
|----|-------------|----------|
| AS-01 | Display current 6-character alphanumeric code (large, readable from distance) | Must |
| AS-02 | Code rotates every 120 seconds | Must |
| AS-03 | Display countdown timer to next code rotation | Must |
| AS-04 | Display QR code linking to student check-in page | Must |
| AS-05 | Real-time attendance list with: #, Student ID, Name, Email, Time | Must |
| AS-06 | Real-time failed attempts list with: Name, ID, Email, Reason, Distance, Time | Must |
| AS-07 | "Approve" button on each failed attempt to manually add to attendance | Must |
| AS-08 | Stats summary showing checked-in count and failed attempts count | Must |
| AS-09 | "Export CSV" button downloads attendance with all fields | Must |
| AS-10 | "End Session" button with confirmation dialog | Must |
| AS-11 | Hide/Show toggle for failed attempts panel | Should |

### 3.4 Student Mode — Check-in

| ID | Requirement | Priority |
|----|-------------|----------|
| SC-01 | Text input for Student Number (required) | Must |
| SC-02 | Text input for Full Name (required) | Must |
| SC-03 | Email input for Email address (required) | Must |
| SC-04 | Text input for 6-character code (required, auto-uppercase) | Must |
| SC-05 | Auto-detect and display Device ID | Must |
| SC-06 | Auto-detect and display GPS coordinates | Must |
| SC-07 | Auto-detect and display GPS accuracy | Must |
| SC-08 | "Retry Location" button if GPS fails | Must |
| SC-09 | Submit button disabled until GPS acquired | Must |
| SC-10 | Show success message on successful check-in | Must |
| SC-11 | Show error message on failed check-in with reason | Must |
| SC-12 | Inform student their attempt was logged if location fails | Must |

### 3.5 Validation Rules

| ID | Requirement | Priority |
|----|-------------|----------|
| VR-01 | Code must match current session code | Must |
| VR-02 | Code must not be expired (120s + 60s grace period) | Must |
| VR-03 | Student GPS must be within configured radius of instructor GPS | Must |
| VR-04 | Same Student Number cannot check in twice per session | Must |
| VR-05 | Same Device ID cannot check in twice per session | Must |
| VR-06 | Email must contain @ symbol | Must |
| VR-07 | All fields must be non-empty | Must |

### 3.6 Data Storage

| ID | Requirement | Priority |
|----|-------------|----------|
| DS-01 | Store session: ID, className, location, radius, code, timestamps | Must |
| DS-02 | Store attendance: studentId, name, email, deviceId, location, distance, timestamp, manuallyApproved | Must |
| DS-03 | Store failed attempts: studentId, name, email, deviceId, location, distance, reason, allowedRadius, timestamp | Must |
| DS-04 | Real-time sync between instructor and student views | Must |
| DS-05 | Only one active session at a time | Must |

---

## 4. User Journeys

### 4.1 Instructor: Start Session and Monitor Attendance

**Preconditions:**
- Instructor has laptop with browser and projector
- Instructor is physically in classroom
- Browser has location permissions enabled

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to application URL | Mode selection screen displays with two buttons and QR codes |
| 2 | Click "I'm the Instructor" | Session setup screen displays |
| 3 | Enter class name: "Business Communication - Section A" | Text appears in input field |
| 4 | Adjust radius slider to 60m | Slider moves, displays "60m" |
| 5 | Click "Start Session" | Button shows "Getting location...", then transitions to active session view |
| 6 | Observe active session | 6-character code displays large, countdown timer shows ~2:00, QR code visible, empty attendance list, empty failed attempts |
| 7 | Wait for student to check in | Attendance list updates in real-time with student details, count increases |
| 8 | Wait for code to expire | Code changes to new 6 characters, timer resets to 2:00 |
| 9 | Click "Export CSV" | CSV file downloads with all attendance records |
| 10 | Click "End Session" | Confirmation dialog appears |
| 11 | Confirm end | Returns to session setup screen |

**Postconditions:**
- Session data persists in database
- No active session marker exists

---

### 4.2 Student: Successful Check-in

**Preconditions:**
- Instructor has active session
- Student has smartphone with browser
- Student is physically in classroom (within radius)
- Student's phone has location permissions enabled

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan QR code displayed by instructor OR navigate to URL with `?mode=student` | Student check-in form displays |
| 2 | Observe auto-populated fields | Device ID shows (e.g., "DEV-A1B2C3D4"), Location shows coordinates, Accuracy shows (e.g., "±15m") |
| 3 | Enter Student Number: "11223344" | Text appears in input |
| 4 | Enter Full Name: "Nguyen Van A" | Text appears in input |
| 5 | Enter Email: "student@st.neu.edu.vn" | Text appears in input |
| 6 | Enter Code: "ABC123" (from instructor's screen) | Code appears uppercase in input |
| 7 | Click "Submit Attendance" | Button shows "Verifying...", then success message displays: "✅ Success! Attendance recorded for Business Communication - Section A" |
| 8 | Observe instructor's screen | Student appears in attendance list with timestamp |

**Postconditions:**
- Attendance record exists in database
- Student cannot submit again (duplicate check)

---

### 4.3 Student: Failed Check-in — Outside Radius

**Preconditions:**
- Instructor has active session with 50m radius
- Student is outside classroom (e.g., 100m away)
- Student's phone has location permissions enabled

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to student mode | Check-in form displays with location acquired |
| 2 | Enter valid Student Number, Name, Email | Fields populated |
| 3 | Enter correct Code from instructor | Code appears |
| 4 | Click "Submit Attendance" | Error message: "❌ You're 100m away (limit: 50m). Your attempt has been logged for instructor review." |
| 5 | Observe instructor's screen | Failed attempts panel shows entry with reason "Too far: 100m", distance, student details, and Approve button |

**Postconditions:**
- Failed attempt record exists in database
- No attendance record created
- Instructor can manually approve

---

### 4.4 Student: Failed Check-in — Wrong Code

**Preconditions:**
- Instructor has active session
- Student is within radius

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to student mode | Check-in form displays |
| 2 | Enter valid Student Number, Name, Email | Fields populated |
| 3 | Enter incorrect code: "WRONG1" | Code appears |
| 4 | Click "Submit Attendance" | Error message: "❌ Invalid code. Check the code on screen. Your attempt has been logged." |
| 5 | Observe instructor's screen | Failed attempts panel shows entry with reason "Invalid code" |

**Postconditions:**
- Failed attempt logged
- Student can retry with correct code

---

### 4.5 Student: Failed Check-in — Expired Code

**Preconditions:**
- Instructor has active session
- Student enters code, then waits > 3 minutes before submitting

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter all details with current code | Fields populated |
| 2 | Wait for code to rotate twice (~4 minutes) | Instructor's code changes |
| 3 | Click "Submit Attendance" | Error message: "❌ Code expired. Enter the new code. Your attempt has been logged." |

**Postconditions:**
- Failed attempt logged with reason "Expired code"

---

### 4.6 Student: Failed Check-in — Duplicate Student ID

**Preconditions:**
- Student has already successfully checked in
- Student (or someone else) tries to check in again with same Student Number

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter same Student Number as previous check-in | Field populated |
| 2 | Enter (possibly different) name, email, correct code | Fields populated |
| 3 | Click "Submit Attendance" | Error message: "❌ This Student Number has already checked in." |

**Postconditions:**
- No new record created
- No failed attempt logged (not a location issue)

---

### 4.7 Student: Failed Check-in — Duplicate Device

**Preconditions:**
- Student A successfully checked in from a phone
- Student B tries to check in using the same phone

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On same device, enter different Student Number | Field populated |
| 2 | Enter different name, email, correct code | Fields populated |
| 3 | Click "Submit Attendance" | Error message: "❌ This device has already been used to check in." |

**Postconditions:**
- No new record created
- Prevents one phone checking in multiple students

---

### 4.8 Instructor: Manual Approval

**Preconditions:**
- Student failed location check but is legitimately in class
- Failed attempt visible in instructor's panel

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate student in Failed Attempts panel | Entry shows with Approve button |
| 2 | Verify student is physically present (visual confirmation) | Instructor confirms |
| 3 | Click "Approve" button | Entry disappears from Failed Attempts, appears in Attendance list |
| 4 | Export CSV | Approved student has "Manually Approved: Yes" in export |

**Postconditions:**
- Student moved from failed to attendance
- Record marked as manually approved
- Original fail reason preserved in database

---

### 4.9 Student: GPS Not Available

**Preconditions:**
- Student's phone has location permissions denied or GPS unavailable

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to student mode | Check-in form displays |
| 2 | Observe location field | Shows "❌ Enable location access and tap Retry" |
| 3 | Observe Submit button | Button is disabled (grayed out) |
| 4 | Enable location in phone settings | — |
| 5 | Click "Retry Location" | Location field updates to show coordinates |
| 6 | Observe Submit button | Button becomes enabled |

**Postconditions:**
- Student can proceed once GPS acquired

---

### 4.10 Instructor: No Active Session (Student Perspective)

**Preconditions:**
- No instructor has started a session

**Steps:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Student navigates to student mode | Check-in form displays |
| 2 | Enter all details and valid-looking code | Fields populated |
| 3 | Click "Submit Attendance" | Error message: "❌ No active session. Ask your instructor to start one." |

**Postconditions:**
- No records created

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF-01 | Page load time | < 3 seconds on 3G connection |
| NF-02 | GPS acquisition time | < 15 seconds |
| NF-03 | Check-in submission time | < 2 seconds |
| NF-04 | Real-time sync latency | < 1 second |
| NF-05 | Mobile responsiveness | Fully functional on screens ≥ 320px width |
| NF-06 | Browser support | Chrome, Safari, Firefox (latest 2 versions) |
| NF-07 | Concurrent users | Support 200 simultaneous check-ins |
| NF-08 | Data persistence | Firebase Realtime Database with 99.9% uptime |

---

## 6. Test Checklist

### 6.1 Smoke Tests
- [ ] Application loads on mobile browser
- [ ] Application loads on desktop browser
- [ ] Mode selection displays correctly
- [ ] Teacher mode accessible via button
- [ ] Teacher mode accessible via `?mode=teacher`
- [ ] Student mode accessible via button
- [ ] Student mode accessible via `?mode=student`
- [ ] QR codes generate and are scannable

### 6.2 Instructor Flow Tests
- [ ] Session starts successfully with GPS
- [ ] Code displays and is readable
- [ ] Code rotates every 2 minutes
- [ ] Timer counts down accurately
- [ ] Attendance list updates in real-time
- [ ] Failed attempts list updates in real-time
- [ ] Manual approval moves student to attendance
- [ ] CSV export downloads with correct data
- [ ] Session ends successfully

### 6.3 Student Flow Tests
- [ ] Device ID generates correctly
- [ ] GPS coordinates display when available
- [ ] GPS error shows retry button when unavailable
- [ ] All validation errors display correctly
- [ ] Successful check-in records correctly
- [ ] Location failure logs to failed attempts
- [ ] Code failure logs to failed attempts
- [ ] Duplicate student ID prevented
- [ ] Duplicate device ID prevented

### 6.4 Edge Case Tests
- [ ] Very long class name (100+ characters)
- [ ] Special characters in student name (Vietnamese diacritics)
- [ ] Minimum radius (20m) works correctly
- [ ] Maximum radius (200m) works correctly
- [ ] GPS accuracy > 100m (poor signal)
- [ ] Multiple rapid submissions from same student
- [ ] Session end while students are checking in
- [ ] Browser refresh during active session
- [ ] Network disconnection and reconnection

---

## 7. Technical Architecture

### 7.1 Frontend
- Single HTML file with inline JavaScript
- TailwindCSS via CDN for styling
- QRCode.js library for QR generation
- No build process required

### 7.2 Backend
- Firebase Realtime Database
- No server-side code required
- Real-time listeners for live updates

### 7.3 Data Model

```
/activeSession: "sessionId"

/sessions/{sessionId}:
  id: string
  className: string
  location: { lat: number, lng: number, accuracy: number }
  radius: number
  code: string
  codeGeneratedAt: timestamp
  createdAt: timestamp

/attendance/{sessionId}/{recordId}:
  studentId: string
  studentName: string
  email: string
  deviceId: string
  location: { lat: number, lng: number, accuracy: number }
  distance: number
  timestamp: timestamp
  manuallyApproved: boolean
  originalFailReason?: string

/failed/{sessionId}/{recordId}:
  studentId: string
  studentName: string
  email: string
  deviceId: string
  location: { lat: number, lng: number, accuracy: number }
  distance: number
  allowedRadius: number
  reason: string
  timestamp: timestamp
```

---

## 8. Future Enhancements (Out of Scope)

- Authentication for instructors
- Historical session viewing
- Analytics dashboard
- Integration with university LMS
- Bluetooth/WiFi-based proximity detection
- Student photo capture
- Batch import of student lists
- Multiple concurrent sessions

---

## 9. Appendix

### 9.1 Device ID Generation
Device fingerprint is generated from:
- User agent string
- Language setting
- Screen dimensions
- Color depth
- Timezone offset
- Hardware concurrency
- Platform

Hash produces format: `DEV-XXXXXXXX` (8 hex characters)

### 9.2 Distance Calculation
Haversine formula used for GPS distance:
- Accounts for Earth's curvature
- Accurate to ~0.5% for distances < 1km
- Returns distance in meters

### 9.3 Code Generation
- 6 characters from: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Excludes ambiguous characters: I, L, O, 0, 1
- ~1.07 billion possible combinations
