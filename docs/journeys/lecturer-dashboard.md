# Journey: Lecturer Views Analytics Dashboard

## Status

```yaml
status: planned
implementation_priority: P2
implementation_percent: 0
last_reviewed: 2026-01-21
```

> **Note:** This journey is fully documented but not yet implemented. All acceptance criteria are unchecked, indicating planned functionality.

## Overview
A lecturer accesses an analytics dashboard to view attendance trends across all their sessions, identify patterns, and discover at-risk students with low attendance rates. The dashboard provides visualizations and exportable reports.

## Actor
University instructor/lecturer

## Preconditions
- Instructor has access to the attendance system URL
- Instructor knows the PIN (230782)
- At least one session has been created with attendance data

## Trigger
Lecturer wants to review attendance patterns, identify at-risk students, or generate reports

## User Story
As a lecturer, I want to see an overview of attendance across all my sessions with helpful visualizations so I can identify patterns and at-risk students.

## Flow

### Primary Flow: View Analytics Dashboard

1. **Access Dashboard** -> From instructor view, click "Analytics" button
2. **View Summary Cards** -> See total sessions, average attendance rate, total unique students
3. **Review Trend Chart** -> Line chart shows attendance percentage over time
4. **Compare Sessions** -> Bar chart compares attendance across individual sessions
5. **Check Student Rankings** -> Table shows students sorted by attendance rate
6. **Identify At-Risk Students** -> Red-highlighted section shows students below 70%
7. **Filter by Date** -> Optional: Apply date range filter to narrow data
8. **Export Report** -> Download analytics as CSV for records

## Detailed Steps

### 1. Access Dashboard
- From the instructor dashboard (after PIN verification)
- Click "Analytics" button (next to "View History")
- Dashboard view loads with all visualizations
- Automatic calculation from Firebase data

### 2. View Summary Cards
Three summary cards displayed at top:
- **Total Sessions**: Count of all sessions created
- **Average Attendance Rate**: Mean percentage across all sessions
- **Total Unique Students**: Count of distinct students who checked in

### 3. Review Attendance Trend Chart
- Line chart using Chart.js
- X-axis: Date/session timeline
- Y-axis: Attendance percentage (0-100%)
- Shows attendance rate trend over time
- Hover for exact values

### 4. Compare Sessions (Bar Chart)
- Bar chart showing attendance comparison
- X-axis: Session names (truncated if long)
- Y-axis: Attendance count or percentage
- Visual comparison of session performance
- Click bar for session details (optional enhancement)

### 5. Check Student Rankings
Sortable table displaying:
- Student Name
- Student ID
- Sessions Attended (count)
- Attendance Rate (percentage)
- Columns sortable by clicking headers
- Students below 70% highlighted in red

### 6. Identify At-Risk Students
Dedicated section showing:
- Students with attendance rate below 70%
- Quick visual identification with red highlighting
- Shows attendance rate and sessions missed
- Helps prioritize student outreach

### 7. Filter by Date Range
- Date picker for start and end date
- Filters all charts and tables to selected range
- Useful for semester-specific analysis
- Clear filter option to reset

### 8. Export Analytics Report
- "Export Report" button
- Downloads CSV with:
  - Summary statistics
  - Per-student attendance data
  - Session-by-session breakdown
- Filename includes date range

## Acceptance Criteria

### AC1: Dashboard Access
- [ ] "Analytics" button visible in instructor view (next to "View History")
- [ ] Dashboard accessible after PIN verification
- [ ] Navigating to dashboard loads all data automatically
- [ ] Back button returns to instructor dashboard

### AC2: Attendance Trend Line Chart
- [ ] Line chart displays attendance percentage over time
- [ ] X-axis shows session dates in chronological order
- [ ] Y-axis shows percentage (0-100%)
- [ ] Responsive: adapts to screen size
- [ ] Supports dark mode colors
- [ ] Hover tooltip shows exact values

### AC3: Session Comparison Bar Chart
- [ ] Bar chart comparing attendance across sessions
- [ ] Each bar represents one session
- [ ] Session names displayed (truncated if > 20 chars)
- [ ] Bar height indicates attendance count or rate
- [ ] Supports dark mode colors

### AC4: Student Attendance Leaderboard
- [ ] Table shows: Student Name, ID, Total Sessions, Attendance Rate
- [ ] Sortable by any column (click header)
- [ ] Default sort: attendance rate descending
- [ ] Pagination or scroll for large lists
- [ ] Students below 70% highlighted in red row/text

### AC5: At-Risk Students Section
- [ ] Dedicated section for students below 70% attendance
- [ ] List shows student name, ID, and attendance rate
- [ ] Red styling for visual emphasis
- [ ] Shows count of at-risk students
- [ ] Empty state if all students above 70%

### AC6: Date Range Filter
- [ ] Start date and end date inputs
- [ ] "Apply Filter" button to update view
- [ ] All charts and tables respond to filter
- [ ] "Clear Filter" option to reset
- [ ] Filter persists during dashboard session

### AC7: Export Analytics Report
- [ ] "Export Report" button visible on dashboard
- [ ] CSV download includes:
  - Summary row (total sessions, avg rate, total students)
  - Per-student data (name, ID, sessions attended, rate)
  - Per-session data (date, name, attendance count)
- [ ] Filename: `analytics_report_YYYY-MM-DD.csv`
- [ ] UTF-8 encoding with BOM for Excel

### AC8: Summary Statistics Cards
- [ ] Card 1: Total Sessions (number)
- [ ] Card 2: Average Attendance Rate (percentage)
- [ ] Card 3: Total Unique Students (number)
- [ ] Cards update when date filter applied
- [ ] Dark mode styling supported

## Technical Requirements

### Chart.js Integration
```html
<!-- Add to index.html head -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### Data Calculations (Client-Side)
- Query all sessions from Firebase
- Query all attendance records
- Calculate per-session attendance rates
- Calculate per-student attendance rates
- Identify unique students across sessions

### Dark Mode Support
- Chart colors must adapt to light/dark theme
- Use theme-aware colors from existing design system
- Grid lines and labels readable in both modes

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No sessions exist | Show "No data yet" message with instruction |
| No attendance in sessions | Charts show 0%, message explains |
| Date filter returns empty | Show "No data in selected range" |
| Chart.js fails to load | Fallback: show data in table format only |
| Large dataset (>1000 students) | Paginate/virtualize, show loading state |

## Data Model

### Analytics Query Structure
```javascript
// Sessions data needed
{
  sessionId: {
    className: "Business Communication",
    createdAt: "2026-01-15T09:00:00Z",
    endedAt: "2026-01-15T10:30:00Z"
  }
}

// Attendance data needed
{
  sessionId: {
    recordId: {
      studentId: "11223344",
      studentName: "Nguyen Van A",
      timestamp: "2026-01-15T09:05:00Z"
    }
  }
}
```

### Calculated Metrics
- **Per-session rate**: (students checked in / expected students) * 100
- **Per-student rate**: (sessions attended / total sessions) * 100
- **At-risk threshold**: < 70%

## Wireframe Reference

```
+----------------------------------------------------------+
|  [<- Back]                          Analytics Dashboard  |
+----------------------------------------------------------+
|  +----------------+  +----------------+  +----------------+
|  | Total Sessions |  | Avg Attendance |  | Unique Students|
|  |      12        |  |     78.5%      |  |      156       |
|  +----------------+  +----------------+  +----------------+
+----------------------------------------------------------+
|  Attendance Trend                                         |
|  +----------------------------------------------------+  |
|  |     100% |    *                                    |  |
|  |      75% |  * * *    *  *                          |  |
|  |      50% |         *      *                        |  |
|  |      25% |                                         |  |
|  |       0% +-----------------------------------> Date|  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
|  Session Comparison           |  Date Filter:            |
|  +-------------------------+  |  Start: [2026-01-01]     |
|  | |||  |||  ||   |||      |  |  End:   [2026-01-20]     |
|  | |||  |||  ||   |||      |  |  [Apply] [Clear]         |
|  +-------------------------+  +-------------------------+
+----------------------------------------------------------+
|  Student Rankings                          [Export CSV]   |
|  +-----------------------------------------------------+ |
|  | Name          | ID       | Sessions | Rate          | |
|  +-----------------------------------------------------+ |
|  | Nguyen Van A  | 11223344 | 12/12    | 100%          | |
|  | Tran Thi B    | 11223345 | 11/12    | 91.7%         | |
|  | [RED] Le Van C| 11223346 | 8/12     | 66.7%  <-risk | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
|  At-Risk Students (< 70%)                                 |
|  +-----------------------------------------------------+ |
|  | Le Van C (11223346) - 66.7% attendance              | |
|  | Pham Thi D (11223347) - 58.3% attendance            | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
```

## Metrics
- Dashboard load time: < 3 seconds
- Chart render time: < 500ms
- Export generation: < 2 seconds
- Filter application: < 500ms
