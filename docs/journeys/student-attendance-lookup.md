# Journey: Student Views Attendance History

## Overview
A student enters their student ID to view their complete attendance history across all courses, including summary statistics showing total check-ins, on-time arrivals, and late arrivals.

## Actor
University student

## Preconditions
- Student has previously checked in to at least one session
- Student knows their student ID
- Student has access to the attendance system URL

## Trigger
Student wants to review their attendance record for personal tracking or to verify check-ins

## Flow

### Primary Flow: View Attendance History

1. **Access Lookup Mode** -> Navigate to main page, click "View My Attendance"
2. **Enter Student ID** -> Enter student number in the search field
3. **View Results** -> See attendance records across all courses
4. **Review Statistics** -> Summary cards show total, on-time, and late counts
5. **Done** -> Can search again or return to home

### Alternative Flow: Returning Student (Pre-filled)
- If student has previously checked in on this device, student ID is pre-filled
- Student can simply press "Search" to see their records

## Detailed Steps

### 1. Access Lookup Mode
- From the main landing page, click "View My Attendance" button
- URL changes to `?mode=lookup`
- Lookup interface displayed with search field

### 2. Enter Student ID
- Input field accepts student number (e.g., 11223344)
- If student previously checked in on this device, field is pre-filled from localStorage
- Press Enter or click "Search" to submit

### 3. View Results
- System queries all sessions for attendance records matching the student ID
- Results displayed in a table showing:
  - Course name
  - Date
  - Time
  - Status (On Time / Late)
- Results sorted by most recent first

### 4. Review Statistics
- Summary cards at top show:
  - **Total**: Number of attendance records
  - **On Time**: Count of on-time check-ins
  - **Late**: Count of late check-ins
- Quick visual overview of attendance performance

## Acceptance Criteria

### AC1: Access Lookup Mode
- [x] "View My Attendance" button visible on main landing page
- [x] Clicking button navigates to lookup view
- [x] URL parameter `?mode=lookup` supported for direct access
- [x] Back button returns to main page

### AC2: Student ID Input
- [x] Search field accepts student ID (max 20 characters)
- [x] Pre-fills with saved student ID from localStorage if available
- [x] Enter key submits search
- [x] Search button triggers lookup
- [x] Loading state shown during search

### AC3: Results Display
- [x] Results table shows: Course, Date, Time, Status
- [x] Results sorted by timestamp (most recent first)
- [x] Status badges: "On Time" (green) or "Late" (orange)
- [x] Empty state shown when no records found
- [x] Maximum height with scroll for long lists

### AC4: Statistics Summary
- [x] Total attendance count displayed prominently
- [x] On-time count with green styling
- [x] Late count with orange styling
- [x] Statistics update when search results change

### AC5: Error Handling
- [x] Error message if student ID is empty
- [x] Error message if database query fails
- [x] Loading state prevents duplicate submissions

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty student ID | "Please enter a student ID" error message |
| No records found | "No attendance records found" message |
| Database error | "Error searching attendance. Please try again." message |
| Invalid student ID format | Accepts any format (no strict validation) |

## Metrics
- Search response time: < 3 seconds
- Results per page: All records (scrollable)
- Pre-fill accuracy: 100% when localStorage available

## Implementation Notes
- Queries all sessions from Firebase, then filters attendance by student ID
- Client-side calculation of late status based on session thresholds
- No authentication required - student ID is the lookup key
- Privacy consideration: Only shows own attendance (by student ID)
