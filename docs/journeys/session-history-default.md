# Journey: Session History Default View - 14 Days

## Overview
Instructors often need to review sessions from the previous week, but the current 7-day default requires manual filter adjustment. This journey extends the default session history view to 14 days for improved workflow efficiency.

## Actor
University instructor/lecturer

## Preconditions
- Instructor is authenticated
- Instructor has created at least one session
- Instructor is in the session history view

## Trigger
Instructor opens the session history view to review past sessions

## Flow

### 1. Open Session History
- From the instructor dashboard, navigate to Session History view
- Or click "History" in the main navigation

### 2. View Default Sessions
- History view loads with default date filter applied
- System shows sessions from the past **14 days** (extended from 7 days)
- Sessions display with class name, date, attendance count, late count

### 3. Manual Filter Override
- Optional: Use date range picker to select custom period
- Supports any date range (not limited to 14 days)
- Filter selection persists during session navigation

### 4. Analytics Dashboard Consistency
- Analytics view also defaults to **14 days** for consistency
- Same date filter logic applies to analytics summaries
- Class-based filtering available in both views

## Acceptance Criteria

- [ ] AC1: Session history loads with 14-day default filter
- [ ] AC2: Displays sessions from (today - 14 days) to today
- [ ] AC3: Manual date range filter available for custom periods
- [ ] AC4: Analytics dashboard defaults to same 14-day period
- [ ] AC5: Default filter persists across page navigation
- [ ] AC6: Date range applies before class selection dropdown
- [ ] AC7: "Last 7 Days" quick-filter still available as option
- [ ] AC8: CSV export respects current date filter

## Technical Notes

- Change hardcoded 7 to 14 in `getDefaultDateRange()` function
- No database changes required (pure UI/filter logic)
- Configuration value could be made adjustable in future phases

## Files to Modify

- `index.html` - Update `getDefaultDateRange()` and filter UI
- `src/utils.js` - Move default range calculation to utility function (if not already there)
- Tests - E2E tests verifying 14-day default in history and analytics views

## Effort Estimate

- Simple configuration change: ~2-4 hours including tests
- High-impact for user workflow efficiency
- Low risk (straightforward date calculation change)
