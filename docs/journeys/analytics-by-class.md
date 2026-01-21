# Journey: Analytics Dashboard Split by Class

## Status

```yaml
status: complete
implementation_priority: P1
implementation_percent: 100
last_reviewed: 2026-01-21
```

## Overview
The instructor views analytics data segmented by class by default, enabling focused analysis of attendance patterns within specific courses. A class selector allows switching between classes or viewing aggregated data across all classes.

## Actor
University instructor/lecturer

## Preconditions
- Instructor has access to the attendance system URL
- Instructor has authenticated (PIN verified)
- At least one session has been created with attendance data

## Trigger
Instructor clicks "Analytics" button from the instructor dashboard

## User Story
As an instructor, I want to see my analytics split by class by default so I can quickly analyze attendance patterns for each course without manually filtering.

## Flow

### Primary Flow: View Class-Specific Analytics

1. **Access Analytics** -> From instructor view, click "Analytics" button
2. **Auto-Select Class** -> Dashboard loads with most recent class pre-selected
3. **View Class Metrics** -> Summary cards show metrics for selected class only
4. **Review Class Trend** -> Charts display attendance data for selected class
5. **Compare Within Class** -> Session comparison shows only sessions from that class
6. **Check Class Rankings** -> Student table shows attendance within selected class
7. **Switch Class** -> Use dropdown to view different class or "All Classes"

### Alternative Flow: View Aggregated Analytics

1. **Access Analytics** -> From instructor view, click "Analytics" button
2. **Select All Classes** -> Choose "All Classes" from class dropdown
3. **View Aggregated Metrics** -> Summary cards show totals across all classes
4. **Review Overall Trend** -> Charts display all sessions chronologically

## Acceptance Criteria

### AC1: Class Selector Dropdown (Core)

```gherkin
Feature: Class selector for analytics filtering
  As an instructor
  I want to filter analytics by class
  So I can focus on specific course performance

  Scenario: Default class selection on load
    Given I have sessions for "Business Communication" and "Marketing 101"
    And the most recent session was for "Business Communication"
    When I open the Analytics dashboard
    Then the class selector shows "Business Communication" selected
    And all metrics reflect only "Business Communication" sessions

  Scenario: Change class filter
    Given I am viewing analytics for "Business Communication"
    When I select "Marketing 101" from the class dropdown
    Then all summary cards update to show "Marketing 101" data
    And charts refresh with "Marketing 101" sessions only
    And student rankings show attendance for "Marketing 101" only

  Scenario: View all classes aggregated
    Given I am viewing analytics for a specific class
    When I select "All Classes" from the dropdown
    Then summary cards show aggregated totals across all classes
    And charts display sessions from all classes
    And student rankings calculate rates across all sessions
```

### AC2: Summary Cards Update Per Class (Core)

```gherkin
Feature: Summary cards reflect selected class
  As an instructor
  I want summary metrics to update when I change class
  So I see accurate per-class statistics

  Scenario: Total sessions shows class-specific count
    Given I have 5 sessions for "Business Communication"
    And I have 3 sessions for "Marketing 101"
    When I select "Business Communication"
    Then the "Total Sessions" card shows "5"

  Scenario: Average attendance calculates per class
    Given "Business Communication" has 80% average attendance
    And "Marketing 101" has 65% average attendance
    When I select "Marketing 101"
    Then the "Avg Attendance" card shows "65.0%"

  Scenario: Unique students counts per class
    Given 20 students attended "Business Communication" sessions
    And 15 students attended "Marketing 101" sessions
    And 5 students overlap between classes
    When I select "Business Communication"
    Then the "Unique Students" card shows "20"
```

### AC3: Charts Filter by Class (Core)

```gherkin
Feature: Charts display class-filtered data
  As an instructor
  I want charts to reflect the selected class
  So I can visualize class-specific trends

  Scenario: Trend chart shows class sessions only
    Given I have sessions on Jan 10, 15, 20 for "Business Communication"
    And I have sessions on Jan 12, 18 for "Marketing 101"
    When I select "Business Communication"
    Then the trend chart shows 3 data points
    And the X-axis shows dates Jan 10, 15, 20

  Scenario: Session comparison within class
    Given I select "Business Communication"
    Then the bar chart shows only sessions for that class
    And each bar represents a "Business Communication" session
```

### AC4: Student Rankings Per Class (Core)

```gherkin
Feature: Student rankings reflect class attendance
  As an instructor
  I want student rankings based on selected class
  So I know who is at risk in each course

  Scenario: Attendance rate calculated per class
    Given student "Alice" attended 8/10 sessions for "Business Communication"
    And student "Alice" attended 2/5 sessions for "Marketing 101"
    When I select "Business Communication"
    Then Alice's rate shows "80.0%"
    When I select "Marketing 101"
    Then Alice's rate shows "40.0%"

  Scenario: At-risk students per class
    Given student "Bob" has 65% attendance in "Business Communication"
    And student "Bob" has 90% attendance in "Marketing 101"
    When I select "Business Communication"
    Then Bob appears in the "At-Risk Students" section
    When I select "Marketing 101"
    Then Bob does not appear in the "At-Risk Students" section
```

### AC5: Remember Class Selection (Usability)

```gherkin
Feature: Remember class selection during session
  As an instructor
  I want the class filter to persist while using analytics
  So I don't have to re-select after applying date filters

  Scenario: Class selection persists with date filter
    Given I select "Business Communication" in the class dropdown
    When I apply a date filter
    Then "Business Communication" remains selected
    And filtered data is within that class

  Scenario: Class selection persists after sorting
    Given I select "Marketing 101"
    When I click to sort by student name
    Then "Marketing 101" remains selected
    And only "Marketing 101" students are shown
```

### AC6: Export Includes Class Context (Core)

```gherkin
Feature: CSV export includes class information
  As an instructor
  I want exports to reflect my current filter
  So my reports are class-specific when needed

  Scenario: Export single class data
    Given I select "Business Communication"
    When I click "Export Report"
    Then the CSV filename includes "Business_Communication"
    And the CSV header includes "Class: Business Communication"
    And only "Business Communication" data is exported

  Scenario: Export all classes
    Given I select "All Classes"
    When I click "Export Report"
    Then the CSV includes a "Class" column
    And data from all classes is included
```

### AC7: Empty State for Class (Error)

```gherkin
Feature: Handle class with no sessions in filter range
  As an instructor
  I want clear feedback when filtered data is empty
  So I understand why no data is shown

  Scenario: No sessions in date range for class
    Given I select "Business Communication"
    And I apply a date filter for January 1-10
    And no "Business Communication" sessions exist in that range
    Then charts show "No data in selected range"
    And summary cards show 0 or "N/A"
```

### AC8: Dark Mode Support (Accessibility)

```gherkin
Feature: Class selector supports dark mode
  As an instructor using dark mode
  I want the class dropdown to be readable
  So I can use analytics in any lighting condition

  Scenario: Dark mode styling
    Given dark mode is enabled
    Then the class dropdown has dark background
    And dropdown text is light colored
    And dropdown options are readable
```

## Technical Requirements

### Data Structure Enhancement

```javascript
// Group sessions by className
const sessionsByClass = {};
sessions.forEach(session => {
  const className = session.className || 'Unnamed Class';
  if (!sessionsByClass[className]) {
    sessionsByClass[className] = [];
  }
  sessionsByClass[className].push(session);
});

// Get unique class names sorted by most recent session
const classNames = Object.keys(sessionsByClass).sort((a, b) => {
  const latestA = Math.max(...sessionsByClass[a].map(s => new Date(s.createdAt).getTime()));
  const latestB = Math.max(...sessionsByClass[b].map(s => new Date(s.createdAt).getTime()));
  return latestB - latestA;
});
```

### State Additions

```javascript
// Add to state object
analyticsSelectedClass: null, // null = auto-select most recent, 'all' = all classes
```

### UI Component

```html
<!-- Class Selector -->
<select id="analyticsClassFilter" onchange="changeAnalyticsClass(this.value)">
  ${classNames.map(name => `
    <option value="${escapeHtml(name)}" ${state.analyticsSelectedClass === name ? 'selected' : ''}>
      ${escapeHtml(name)}
    </option>
  `).join('')}
  <option value="all" ${state.analyticsSelectedClass === 'all' ? 'selected' : ''}>
    All Classes
  </option>
</select>
```

## Wireframe

```
+----------------------------------------------------------+
|  [<- Back]            [Class: v Business Communication]   |
|                        Analytics Dashboard     [Export]   |
+----------------------------------------------------------+
|  +----------------+  +----------------+  +----------------+
|  | Total Sessions |  | Avg Attendance |  | Unique Students|
|  |      5         |  |     82.4%      |  |      28        |
|  | (this class)   |  | (this class)   |  | (this class)   |
+----------------------------------------------------------+
|  Attendance Trend (Business Communication)                |
|  +----------------------------------------------------+  |
|  |     100% |    *                                    |  |
|  |      75% |  * * *    *                             |  |
|  |      50% |                                         |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

## Performance Considerations

- Class grouping computed once during data load
- Filter selection only changes what's displayed (no re-fetch)
- Charts redrawn on class change using cached data

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Only one class exists | Dropdown shows single option + "All Classes" |
| Session missing className | Grouped under "Unnamed Class" |
| Class filter + date filter yields empty | Show "No data" message |

## Metrics

- Class switch response: < 300ms (no network call)
- Initial load with grouping: < 3 seconds
- Memory: Minimal overhead (single data load, multiple views)

## Related Journeys

- `lecturer-dashboard.md` - Parent journey containing analytics access
- `instructor-attendance-session.md` - Source of className for sessions

## Last Updated

- **Date**: 2026-01-21
- **Author**: Implementation task for P4-04
