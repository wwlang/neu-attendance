# Journey: Analytics Dashboard Improvements

## Status

```yaml
status: pending
implementation_priority: P4
implementation_percent: 0
last_reviewed: 2026-01-23
```

## Overview

Improve the analytics dashboard visual consistency and default filtering to provide instructors with a better overview of attendance patterns across their courses. This journey addresses two separate issues: (1) inconsistent styling between the At-Risk Students section and the Student Attendance Ranking table, and (2) improving the default date filter to show all sessions rather than a limited date range.

## Actor

University instructor/lecturer

## Preconditions

- Instructor has access to the attendance system URL
- Instructor has authenticated (PIN verified)
- At least one session has been created with attendance data
- Analytics dashboard is accessible from instructor view

## Trigger

Instructor clicks "Analytics" button from the instructor dashboard to review student attendance patterns

## User Story

As an instructor, I want the analytics dashboard to have consistent table styling and show all session data by default so I can see the full picture of student attendance across my entire term without scrolling or filtering.

## Flow

### Primary Flow: View Analytics with Consistent Styling

1. **Access Analytics** -> From instructor view, click "Analytics" button
2. **View Dashboard Layout** -> All sections load with consistent table styling
3. **Review At-Risk Table** -> "At-Risk Students (Below 70%)" displays in same table format as rankings
4. **Compare Rankings** -> "Student Attendance Ranking" table uses identical styling
5. **Visual Consistency** -> User immediately recognizes both as related tables with same treatment
6. **Default Date Range** -> Dashboard shows data from entire term (no date restriction)
7. **Optional Filtering** -> Instructor can narrow date range if desired for specific period analysis

### Alternative Flow: Filter to Specific Period

1. **Access Analytics** -> From instructor view, click "Analytics" button
2. **View All Sessions Default** -> Dashboard loads showing data from all sessions
3. **Apply Date Filter** -> Click on date range picker to narrow scope
4. **Select Time Period** -> Choose specific date range (e.g., "Last 7 days")
5. **View Filtered Data** -> Analytics update to show only selected period
6. **Reset Filter** -> Option to return to "All Sessions" view

## Acceptance Criteria

### AC1: At-Risk Students Uses Table Format (Core)

```gherkin
Feature: At-Risk Students displayed in table format
  As an instructor
  I want the at-risk students section to use the same table format as rankings
  So the dashboard is visually consistent

  Scenario: At-Risk Students table has correct columns
    Given I am viewing the Analytics dashboard
    Then the "At-Risk Students (Below 70%)" section displays a table
    And the table has columns: Student ID, Name, Sessions Attended, Total Sessions, Attendance Rate
    And columns appear in that order from left to right

  Scenario: At-Risk Students rows match ranking table styling
    Given I see the Student Attendance Ranking table
    When I scroll to the At-Risk Students section
    Then the row styling (padding, font, height) is identical
    And hover states match between the two tables
    And borders and dividers are the same thickness/color

  Scenario: Sessions Attended column shows correct count
    Given student "Alice" checked in to 7 out of 10 sessions
    And "Alice" has 70% attendance (threshold student)
    When I view the At-Risk Students table
    Then Alice's "Sessions Attended" column shows "7"
    And "Total Sessions" column shows "10"
```

### AC2: Sortable Columns in At-Risk Table (Usability)

```gherkin
Feature: At-Risk Students table supports sorting
  As an instructor
  I want to sort at-risk students by different columns
  So I can prioritize intervention efforts

  Scenario: Sort by Attendance Rate descending
    Given the At-Risk Students table displays multiple students
    And all students have attendance below 70%
    When I click the "Attendance Rate" column header
    Then students are re-sorted highest rate first
    And a sort indicator (arrow) appears on the header
    And students at bottom (lowest rate) need most attention

  Scenario: Sort by Student ID
    Given the At-Risk Students table displays students
    When I click the "Student ID" column header
    Then students are sorted alphabetically/numerically by ID

  Scenario: Click again to reverse sort
    Given a column is sorted in ascending order
    When I click that column header again
    Then the sort reverses (now descending)
    And the sort indicator shows reversed direction
```

### AC3: Consistent Row Styling and Hover States (Visual)

```gherkin
Feature: Table row styling is consistent across analytics
  As an instructor using the analytics dashboard
  I want consistent visual styling so I'm not confused by different designs
  So the interface feels professional and polished

  Scenario: Row background colors match between tables
    Given I view the Student Attendance Ranking table
    And I view the At-Risk Students table
    When I observe the row backgrounds
    Then both tables use the same alternating row colors (if any)
    And both use the same background color scheme (light/dark mode aware)

  Scenario: Hover state is consistent
    Given I hover over a row in the Student Attendance Ranking
    Then the row highlights with a subtle background change
    When I hover over a row in the At-Risk Students table
    Then it highlights exactly the same way

  Scenario: Text alignment is consistent
    Given I view both tables
    When I examine text placement
    Then Student ID and Name are left-aligned in both
    And numeric columns (Sessions, Rate) are right-aligned in both
    And all padding/margins match between tables
```

### AC4: Analytics Default to All Sessions (Core)

```gherkin
Feature: Analytics dashboard defaults to all session data
  As an instructor
  I want to see all my attendance data by default
  So I have the full picture when I first open analytics

  Scenario: Dashboard loads with all sessions visible
    Given I have conducted sessions on various dates across the term
    And sessions span from January 10 to January 23
    When I open the Analytics dashboard
    Then the summary cards show data from ALL sessions
    And the trend chart displays data points for all sessions
    And no date filter is applied by default

  Scenario: Summary cards reflect all sessions
    Given I have 15 total sessions across two classes
    When I open Analytics dashboard
    Then "Total Sessions" card displays "15"
    And "Avg Attendance" is calculated across all 15 sessions
    And "Unique Students" counts students across entire term

  Scenario: Trend chart shows full term history
    Given I conducted sessions on Jan 10, 12, 15, 17, 19, 22, 23
    When I view the Attendance Trend chart
    Then all 7 data points are visible
    And the X-axis spans from Jan 10 to Jan 23
    And no data points are hidden or outside the view
```

### AC5: Date Filter Still Available for Narrowing (Usability)

```gherkin
Feature: Date filter remains available for analysis by period
  As an instructor
  I want to optionally filter by date
  So I can analyze specific weeks or periods

  Scenario: Date range picker defaults to "All Sessions"
    Given I open the Analytics dashboard
    When I look at the date filter control
    Then it shows "All Sessions" or "All Time" as selected
    And no date restrictions are visible

  Scenario: Apply date filter to narrow view
    Given I am viewing analytics for all sessions
    When I click on the date filter dropdown
    Then a date range picker appears
    And I can select a start date and end date
    And "Last 7 Days" quick-filter option is available
    And "Last 14 Days" quick-filter option is available

  Scenario: Filter updates all sections
    Given I have all session data displayed
    When I apply a "Last 7 Days" filter
    Then summary cards update to show only last 7 days
    And trend chart shows only recent data points
    And student rankings calculate rates for filtered period
    And at-risk threshold applies within filtered timeframe

  Scenario: Reset filter back to all sessions
    Given I have a date filter applied
    When I select "All Sessions" from the filter
    Then all data reappears
    And the dashboard returns to showing complete term view
```

### AC6: At-Risk Table Shows All Matching Students (Completeness)

```gherkin
Feature: At-Risk Students table displays complete list
  As an instructor
  I want to see all students below 70% attendance
  So I don't miss any at-risk students

  Scenario: All below-threshold students appear
    Given I have 30 students total
    And 8 students have below 70% attendance
    When I view the At-Risk Students table
    Then exactly 8 student rows are displayed
    And no students are hidden or paginated

  Scenario: Threshold consistently 70%
    Given different students with various attendance rates
    And Alice: 69% attendance (below threshold)
    And Bob: 70.1% attendance (above threshold)
    When I view the At-Risk Students table
    Then Alice appears in the table
    And Bob does not appear in the table
    And the boundary is consistent with 70% threshold
```

### AC7: Dark Mode Support for All Table Elements (Accessibility)

```gherkin
Feature: Table styling works in both light and dark modes
  As an instructor using dark mode
  I want all tables to be readable and properly styled
  So I can use analytics in any lighting condition

  Scenario: Light mode styling
    Given dark mode is disabled
    When I view the Analytics dashboard
    Then both Student Ranking and At-Risk tables have readable text
    And row borders are visible with good contrast
    And hover states are subtle but clear

  Scenario: Dark mode styling
    Given dark mode is enabled
    Then both tables have dark backgrounds
    And text is light colored for readability
    And row separators are visible but subtle
    And hover effects work correctly in dark theme
    And sort indicators are visible in dark mode
```

### AC8: Attendance Rate Display is Consistent (Format)

```gherkin
Feature: Attendance rate displays consistently
  As an instructor reviewing student data
  I want attendance rates to be formatted the same way everywhere
  So I'm not confused by different number formats

  Scenario: Percentage format consistency
    Given I view both the Student Ranking table and At-Risk table
    When I look at the Attendance Rate column
    Then rates are formatted as percentages (e.g., "85.0%")
    And decimal precision is consistent between both tables
    And "N/A" is used consistently if data is unavailable

  Scenario: Calculation is identical
    Given student "Charlie" attended 6 out of 9 sessions
    When I calculate rate: 6/9 = 66.7%
    And I view Charlie in both tables
    Then both tables show exactly "66.7%"
    And rounding is applied identically
```

## Technical Requirements

### Data Structure

```javascript
// At-Risk Students are derived from Student Attendance Ranking
// by filtering for attendance < 70%

const atRiskStudents = rankingStudents.filter(student => {
  const rate = (student.sessionsAttended / student.totalSessions) * 100;
  return rate < 70;
}).sort((a, b) => {
  // Default sort: highest attendance first (closest to threshold)
  const aRate = (a.sessionsAttended / a.totalSessions) * 100;
  const bRate = (b.sessionsAttended / b.totalSessions) * 100;
  return bRate - aRate;
});
```

### State Additions

```javascript
// Track date filter state (if not already present)
analyticsDateFilter: 'all', // 'all', 'last7', 'last14', custom range
analyticsDateRange: null, // { start: timestamp, end: timestamp } or null for all

// Track table sorting for at-risk students
atRiskStudentsSortBy: 'attendance_rate', // 'student_id', 'name', 'sessions_attended', 'total_sessions', 'attendance_rate'
atRiskStudentsSortOrder: 'desc' // 'asc' or 'desc'
```

### UI Components

#### At-Risk Students Table

```html
<!-- Replace existing at-risk display with table format -->
<div class="at-risk-students-section">
  <h2 class="text-lg font-semibold mb-4">At-Risk Students (Below 70%)</h2>

  <table class="w-full border-collapse">
    <thead>
      <tr class="border-b-2 border-gray-300 dark:border-gray-600">
        <th class="text-left px-4 py-2 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onclick="sortAtRiskTable('student_id')">
          Student ID
          <span class="sort-indicator" data-column="student_id"></span>
        </th>
        <th class="text-left px-4 py-2 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onclick="sortAtRiskTable('name')">
          Name
          <span class="sort-indicator" data-column="name"></span>
        </th>
        <th class="text-right px-4 py-2 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onclick="sortAtRiskTable('sessions_attended')">
          Sessions Attended
          <span class="sort-indicator" data-column="sessions_attended"></span>
        </th>
        <th class="text-right px-4 py-2 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onclick="sortAtRiskTable('total_sessions')">
          Total Sessions
          <span class="sort-indicator" data-column="total_sessions"></span>
        </th>
        <th class="text-right px-4 py-2 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onclick="sortAtRiskTable('attendance_rate')">
          Attendance Rate
          <span class="sort-indicator" data-column="attendance_rate"></span>
        </th>
      </tr>
    </thead>
    <tbody>
      <!-- Rows populated by JavaScript, matching Student Ranking table styling -->
      ${atRiskStudents.map((student, index) => `
        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
            onclick="toggleStudentDetails('${escapeHtml(student.studentId)}')">
          <td class="px-4 py-3 text-gray-900 dark:text-gray-100">${escapeHtml(student.studentId)}</td>
          <td class="px-4 py-3 text-gray-900 dark:text-gray-100">${escapeHtml(student.name)}</td>
          <td class="px-4 py-3 text-right text-gray-900 dark:text-gray-100">${student.sessionsAttended}</td>
          <td class="px-4 py-3 text-right text-gray-900 dark:text-gray-100">${student.totalSessions}</td>
          <td class="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
            ${((student.sessionsAttended / student.totalSessions) * 100).toFixed(1)}%
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${atRiskStudents.length === 0 ? `
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      No at-risk students. All students have 70% or higher attendance.
    </div>
  ` : ''}
</div>
```

#### Date Filter Control

```html
<!-- Default "All Sessions" with optional date range picker -->
<div class="flex gap-4 mb-6 items-center">
  <div class="flex items-center gap-2">
    <label class="text-sm font-medium">Date Range:</label>
    <select id="analyticsDateFilter" onchange="changeAnalyticsDateFilter(this.value)"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white">
      <option value="all" selected>All Sessions</option>
      <option value="last7">Last 7 Days</option>
      <option value="last14">Last 14 Days</option>
      <option value="last30">Last 30 Days</option>
      <option value="custom">Custom Range</option>
    </select>
  </div>

  <!-- Custom date range (hidden by default) -->
  <div id="customDateRange" class="hidden flex gap-2 items-center">
    <input type="date" id="startDate" onchange="applyCustomDateRange()"
           class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white">
    <span>to</span>
    <input type="date" id="endDate" onchange="applyCustomDateRange()"
           class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white">
  </div>
</div>
```

### Functions to Implement

```javascript
// Sort at-risk students by column
function sortAtRiskTable(column) {
  if (state.atRiskStudentsSortBy === column) {
    // Toggle sort order if clicking same column
    state.atRiskStudentsSortOrder = state.atRiskStudentsSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    state.atRiskStudentsSortBy = column;
    state.atRiskStudentsSortOrder = 'desc'; // Default new sorts to descending
  }
  render();
}

// Change date filter
function changeAnalyticsDateFilter(filterValue) {
  state.analyticsDateFilter = filterValue;

  if (filterValue === 'custom') {
    document.getElementById('customDateRange').classList.remove('hidden');
  } else {
    document.getElementById('customDateRange').classList.add('hidden');
    state.analyticsDateRange = calculateDateRange(filterValue);
    loadAnalyticsData();
  }
}

// Apply custom date range
function applyCustomDateRange() {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  if (start && end) {
    state.analyticsDateRange = {
      start: new Date(start).getTime(),
      end: new Date(end).getTime()
    };
    loadAnalyticsData();
  }
}

// Helper to calculate date range
function calculateDateRange(filterValue) {
  const now = new Date();

  switch(filterValue) {
    case 'last7':
      return { start: now.getTime() - (7 * 24 * 60 * 60 * 1000), end: now.getTime() };
    case 'last14':
      return { start: now.getTime() - (14 * 24 * 60 * 60 * 1000), end: now.getTime() };
    case 'last30':
      return { start: now.getTime() - (30 * 24 * 60 * 60 * 1000), end: now.getTime() };
    case 'all':
    default:
      return null; // null means no filter
  }
}

// Filter analytics data by date range
function getFilteredAnalyticsData() {
  let sessions = Object.values(state.sessions || {});

  if (state.analyticsDateRange) {
    sessions = sessions.filter(session => {
      const sessionTime = new Date(session.createdAt).getTime();
      return sessionTime >= state.analyticsDateRange.start &&
             sessionTime <= state.analyticsDateRange.end;
    });
  }

  return sessions; // Return filtered sessions for further processing
}
```

## Wireframe

```
+-----------------------------------------------------------+
|  [<- Back]            Analytics Dashboard     [Export]    |
+-----------------------------------------------------------+
|  Date Range: [All Sessions ▼]                             |
+-----------------------------------------------------------+
|  +----------------+  +----------------+  +----------------+
|  | Total Sessions |  | Avg Attendance |  | Unique Students|
|  |      15        |  |     78.2%      |  |      45        |
|  | (all classes)  |  | (all classes)  |  | (all classes)  |
+-----------------------------------------------------------+
|  Attendance Trend (All Classes)                           |
|  +---------------------------------------------------+    |
|  |     100% |    *                                   |    |
|  |      75% |  * * *    *    *  *                    |    |
|  |      50% |                                        |    |
|  +---------------------------------------------------+    |
+-----------------------------------------------------------+
|  Student Attendance Ranking                               |
|  +---------------------------------------------------+    |
|  | Student ID | Name        | Sessions | Total | Rate  |  |
|  |----------|-------------|----------|-------|-------|  |
|  | S001234  | Alice Smith | 14/15    | 15    | 93.3% |  |
|  | S001245  | Bob Johnson | 13/15    | 15    | 86.7% |  |
|  | S001256  | Carol Davis | 11/15    | 15    | 73.3% |  |
+-----------------------------------------------------------+
|  At-Risk Students (Below 70%)                            |
|  +---------------------------------------------------+    |
|  | Student ID | Name        | Sessions | Total | Rate  |  |
|  |----------|-------------|----------|-------|-------|  |
|  | S001267  | Dave Miller | 9/15     | 15    | 60.0% |  |
|  | S001278  | Emma Wilson | 8/15     | 15    | 53.3% |  |
|  | S001289  | Frank Brown | 7/15     | 15    | 46.7% |  |
+-----------------------------------------------------------+
```

## Performance Considerations

- At-risk table is derived from existing ranking data (no additional queries)
- Sorting is client-side, using cached data (no network calls)
- Date filtering computed once during analytics data load
- Minimal performance impact on existing analytics view
- Default (all sessions) requires no additional data

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No sessions in date range | Summary cards show 0, charts empty, at-risk table empty |
| All students above 70% | At-risk table shows "No at-risk students" message |
| Only one session exists | All analytics reflect single data point |
| Date range picker with invalid dates | Form validation prevents submission |
| Custom date range with no sessions | Display empty state with helpful message |

## Metrics

- At-risk table sort response: < 100ms (client-side sort)
- Date filter change: < 300ms (re-render only, no network)
- Memory: Minimal (derived from existing data, no duplication)
- Initial load with all sessions: < 3 seconds

## Related Journeys

- `analytics-by-class.md` - Class filtering on analytics dashboard
- `smart-class-default.md` - Intelligent class selection
- `lecturer-dashboard.md` - Parent analytics access point

## Implementation Notes

### Phases

1. **Phase 1: At-Risk Table Styling**
   - Convert at-risk display from cards/list to table format
   - Match existing ranking table CSS/styling
   - Implement sortable column headers
   - Add dark mode support

2. **Phase 2: Default All Sessions Filter**
   - Remove default date filter (change from 14 days to all)
   - Add date filter UI with quick-select options
   - Update analytics data load to handle null date range
   - Test with various session counts

3. **Phase 3: Testing & Polish**
   - E2E tests for table sorting, filtering, dark mode
   - Edge cases: empty states, single student, large datasets
   - Visual regression testing against mockups
   - Performance validation

### No Database Changes Required

- All changes are UI/filter logic only
- Existing session and attendance data used as-is
- Session structure doesn't change
- No migration needed

## Last Updated

- **Date**: 2026-01-23
- **Author**: Feature request for P4-06
- **Status**: Pending implementation (backlog)
