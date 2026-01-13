# NEU Quick Attendance

Geolocation-verified attendance system for university classrooms.

## Features

- **Rotating 6-character codes** - Changes every 2 minutes
- **GPS verification** - Students must be within classroom radius
- **Device fingerprinting** - Prevents one device checking in multiple students
- **Real-time updates** - See attendance populate instantly
- **Failed attempts log** - See students who failed verification (wrong location, bad code, etc.)
- **Manual approval** - Approve students from the failed list if they have GPS issues
- **QR codes** - Easy access for students
- **CSV export** - Download with all data

## Student Data Collected

- Student Number
- Full Name  
- Email
- Device ID (auto-generated fingerprint)
- GPS coordinates
- Distance from classroom
- Timestamp
- Manual approval status

## Usage

**Instructor:** `?mode=teacher` → Start session → Display code/QR → Monitor attendance + failed attempts

**Student:** `?mode=student` → Fill details → Enter code → Submit

## Failed Attempts

Students who try to check in but fail verification are logged with:
- Their submitted details
- Actual distance vs allowed radius
- Failure reason (wrong code, too far, expired code)
- Timestamp

Instructors can review and manually approve legitimate students (e.g., indoor GPS issues).
