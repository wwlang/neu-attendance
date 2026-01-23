# Journey: Personalized Greeting on Instructor Dashboard

## Status

```yaml
status: planned
implementation_priority: P2
implementation_percent: 0
last_reviewed: 2026-01-23
```

> **Note:** This journey is fully documented but not yet implemented. All acceptance criteria are unchecked, indicating planned functionality.

## Overview

When an instructor accesses the attendance dashboard after signing in with Google, they see a friendly personalized greeting using their first name: "Hi, [First Name]!" This small UX enhancement creates a welcoming experience and confirms successful authentication.

## Actor

University instructor/lecturer who has signed in with Google

## Preconditions

- Instructor has accessed the attendance system URL
- Instructor has authenticated with Google Sign-in (not emulator PIN mode)
- Google account has a display name configured

## Trigger

Instructor loads the main dashboard after successful Google authentication

## User Story

As an instructor, I want to see a personalized greeting with my first name so that I feel welcomed and can confirm my identity is correctly recognized in the system.

## Flow

### Primary Flow: View Personalized Greeting

1. **Authentication Complete** -> Instructor signs in with Google
2. **Dashboard Loads** -> Main instructor dashboard renders
3. **Greeting Appears** -> "Hi, [First Name]!" displays prominently at top of dashboard
4. **Continue Work** -> Instructor proceeds to manage attendance sessions

## Detailed Steps

### 1. Authentication Complete
- Firebase `auth.currentUser` is populated after Google Sign-in
- `auth.currentUser.displayName` contains name from Google account (e.g., "John Smith")

### 2. Extract First Name
- Split display name on space character: `displayName.split(' ')[0]`
- Result: "John" from "John Smith"
- Gracefully handle edge cases (see acceptance criteria)

### 3. Render Greeting
- Display greeting in header area of dashboard
- Format: "Hi, John!" with appropriate typography and spacing
- Uses existing design system typography and colors

### 4. Responsive & Themeable
- Greeting renders correctly on mobile, tablet, and desktop
- Text color respects light/dark theme
- Does not break layout or overlap other elements

## Acceptance Criteria

### AC1: Greeting Display
- [ ] AC1.1: Greeting visible when instructor authenticated with Google
- [ ] AC1.2: Greeting hides when in emulator PIN mode (no display name)
- [ ] AC1.3: Greeting positioned in header area above main content
- [ ] AC1.4: Uses friendly informal tone ("Hi," not "Hello,")
- [ ] AC1.5: First name properly capitalized (John, not john)

### AC2: Name Extraction
- [ ] AC2.1: First name extracted from `auth.currentUser.displayName`
- [ ] AC2.2: Splits on space and uses first element: `split(' ')[0]`
- [ ] AC2.3: Works with multi-word first names (e.g., "Jean-Luc" displays "Jean-Luc")
- [ ] AC2.4: Single-name accounts supported (displays full name)

### AC3: Fallback Handling
- [ ] AC3.1: If displayName is missing/null, show "Hi, Instructor!" (fallback)
- [ ] AC3.2: If displayName is empty string, use fallback
- [ ] AC3.3: Fallback message uses same styling as personalized greeting
- [ ] AC3.4: No console errors for missing displayName

### AC4: Typography & Styling
- [ ] AC4.1: Uses existing design system font (Inter)
- [ ] AC4.2: Font size appropriate for header (suggested: 18-20px)
- [ ] AC4.3: Text color uses theme-aware color (dark text in light mode, light text in dark mode)
- [ ] AC4.4: No hardcoded color hex values (uses design system variables)
- [ ] AC4.5: Proper spacing/padding from edges and other header elements

### AC5: Layout Responsiveness
- [ ] AC5.1: Greeting visible on mobile screens (>= 320px width)
- [ ] AC5.2: Greeting visible on tablet screens (>= 768px width)
- [ ] AC5.3: Greeting visible on desktop (>= 1024px width)
- [ ] AC5.4: Text truncation occurs gracefully if name is very long
- [ ] AC5.5: Does not overlap with title, buttons, or navigation

### AC6: Dark Mode Support
- [ ] AC6.1: Text color readable in light mode
- [ ] AC6.2: Text color readable in dark mode
- [ ] AC6.3: Sufficient contrast ratio (WCAG AA 4.5:1 minimum)
- [ ] AC6.4: Consistent with other header text styling in both themes

### AC7: Integration with Authentication
- [ ] AC7.1: Greeting updates when user logs out and logs back in
- [ ] AC7.2: Greeting correct for different Google accounts tested
- [ ] AC7.3: Emulator PIN mode does not break (shows fallback)
- [ ] AC7.4: No console errors in any authentication flow

### AC8: Localization Ready
- [ ] AC8.1: "Hi," is extracted to localization string (not hardcoded)
- [ ] AC8.2: "Instructor" fallback extracted to localization string
- [ ] AC8.3: Supports string formatting with name parameter
- [ ] AC8.4: Ready for Vietnamese translation ("Xin chào")

## Technical Implementation

### Data Source
- `auth.currentUser.displayName` from Firebase Authentication
- Available in all Google Sign-in flows (production and emulator)
- Null/undefined in emulator PIN mode

### Code Pattern
```javascript
// Extract first name from displayName
const getFirstName = (displayName) => {
  if (!displayName) return null;
  const parts = displayName.trim().split(' ');
  return parts[0];
};

// Render greeting in header
const firstName = getFirstName(auth.currentUser?.displayName);
const greetingText = firstName ? `Hi, ${firstName}!` : 'Hi, Instructor!';
```

### Styling Approach
- Use existing design system CSS variables
- No hardcoded colors
- Inherit font family from body
- Responsive using existing breakpoints

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| displayName is null | Show "Hi, Instructor!" fallback |
| displayName is empty string | Show "Hi, Instructor!" fallback |
| displayName is "O" or single character | Show "Hi, O!" (correct behavior) |
| displayName has trailing spaces | Trim before splitting (e.g., " John " -> "John") |
| displayName has multiple spaces | Split on space, use first element only |
| User logs out and back in | Greeting updates to new user's name |
| Emulator PIN mode | Hide greeting (no displayName available) |
| Dark mode enabled | Text color updates automatically |

## Design System Integration

### Colors (Theme-Aware)
- Text color: Use `text-slate-800` (light mode) / `text-slate-100` (dark mode)
- No background color needed (inherits from header)

### Typography
- Font family: Inter (existing)
- Font size: 18px (heading-like prominence)
- Font weight: 500 (semi-bold for friendly tone)
- Line height: 1.4

### Spacing
- Margin top: 8px
- Margin bottom: 12px
- Margin left: 16px (left-align in header)

## Wireframe Reference

```
+----------------------------------------------------------+
|  Hi, John!                                               |
|                                                          |
|  [Start Session]  [View History]  [Analytics]  [Logout] |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  Today's Sessions                                        |
|  +--------------------------------------------------+    |
|  | Business Communication (10:00 AM)    [Start]  |    |
|  +--------------------------------------------------+    |
|                                                          |
+----------------------------------------------------------+
```

## Metrics

- Greeting load time: < 100ms (uses cached auth state)
- No additional network requests
- No impact on page load time
- Improves perceived personalization (qualitative)

## Dependencies

- Firebase Authentication (already in use)
- Design system colors and typography (already available)
- No new libraries or dependencies required
