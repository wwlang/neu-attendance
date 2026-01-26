# Journey: Larger QR Codes for Easier Scanning

## Status

```yaml
status: complete
implementation_priority: P2
implementation_percent: 90
last_reviewed: 2026-01-26
```

> **IMPLEMENTED (2026-01-23):** QR code size doubled, fullscreen mode with overlay, responsive scaling.
> Verified by: `larger-qr-codes.spec.js`
> Remaining gaps: AC4 dark mode QR test, AC5 projection padding verification.

## Overview

Instructors need larger QR codes on the session view for easier student scanning. The current QR code size makes scanning difficult, especially for students with smaller phone screens or when projected in large classrooms.

## Actor

University instructor running an attendance session

## Preconditions

- Instructor has started an attendance session
- Session view is displayed with QR code
- Students are attempting to scan the QR code

## Trigger

Instructor starts a session and needs students to scan QR code

## User Story

As an instructor, I want larger QR codes so that students can scan them more easily from their seats, especially in large lecture halls.

## Flow

### Primary Flow: Standard Session View

1. **Start Session** -> Instructor starts attendance session
2. **View QR Code** -> Larger QR code displayed prominently
3. **Students Scan** -> Students can scan from further distance
4. **Monitor Attendance** -> Instructor sees check-ins arrive

### Alternative Flow: Fullscreen QR for Projection

1. **Start Session** -> Instructor starts attendance session
2. **Click Fullscreen** -> Tap fullscreen button on QR code
3. **QR Fills Screen** -> QR code maximized, other UI hidden
4. **Project to Screen** -> Instructor displays on classroom projector
5. **Exit Fullscreen** -> Click to return to normal view

## Acceptance Criteria

### AC1: Increased Default Size
- [x] AC1.1: QR code default size doubled (from current size)
- [x] AC1.2: QR code remains square (1:1 aspect ratio)
- [x] AC1.3: Maintains scan reliability at new size
- [x] AC1.4: Does not pixelate or lose clarity

### AC2: Responsive Scaling
- [x] AC2.1: QR code scales down on smaller screens (< 600px width)
- [x] AC2.2: Minimum readable size maintained on mobile
- [x] AC2.3: Does not break layout on tablet/desktop
- [x] AC2.4: Attendance code text scales proportionally

### AC3: Fullscreen Mode
- [x] AC3.1: Fullscreen button visible on QR code container
- [x] AC3.2: Clicking button expands QR to fill viewport
- [x] AC3.3: Attendance code displayed below QR in fullscreen
- [x] AC3.4: Background uses high contrast (white/light gray)
- [x] AC3.5: Click anywhere or press Escape to exit fullscreen
- [x] AC3.6: Works with browser fullscreen API where available

### AC4: Theme Support
- [x] AC4.1: QR code readable in light mode
- [ ] AC4.2: QR code readable in dark mode
- [x] AC4.3: Fullscreen button visible in both themes
- [x] AC4.4: Fullscreen mode uses light background regardless of theme

### AC5: Projection Optimization
- [ ] AC5.1: Fullscreen QR has sufficient padding from edges
- [x] AC5.2: Attendance code text large enough to read from back of room
- [x] AC5.3: Session/class info visible in fullscreen mode

## Sizing Specifications

### Current vs New Default Size

| Context | Current | New |
|---------|---------|-----|
| Desktop (>= 1024px) | ~200px | ~400px |
| Tablet (>= 768px) | ~180px | ~350px |
| Mobile (< 600px) | ~150px | ~280px |

### Fullscreen Mode

| Element | Size |
|---------|------|
| QR Code | 70% of viewport height (max 600px) |
| Attendance Code | 48px font, bold |
| Class Name | 24px font |
| Padding | 5% from viewport edges |

## Technical Implementation

### CSS Updates
```css
.qr-container {
  width: 100%;
  max-width: 400px;  /* Doubled from ~200px */
  margin: 0 auto;
}

.qr-code-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
}

/* Responsive scaling */
@media (max-width: 600px) {
  .qr-container {
    max-width: 280px;
  }
}
```

### Fullscreen Implementation
```javascript
const toggleQRFullscreen = () => {
  const overlay = document.getElementById('qr-fullscreen-overlay');
  if (overlay.classList.contains('hidden')) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Escape key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('qr-fullscreen-overlay');
    if (!overlay.classList.contains('hidden')) {
      toggleQRFullscreen();
    }
  }
});
```

### Fullscreen Overlay HTML
```html
<div id="qr-fullscreen-overlay" class="hidden fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
  <div class="text-center">
    <p class="text-2xl font-medium mb-4">{className}</p>
    <img id="qr-fullscreen-image" class="mx-auto" style="max-height: 70vh; max-width: 90vw;">
    <p class="text-5xl font-bold mt-6 font-mono tracking-wider">{attendanceCode}</p>
    <p class="text-lg text-gray-500 mt-4">Tap anywhere to exit</p>
  </div>
</div>
```

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| QR generation fails | Show error, retry button |
| Fullscreen API unavailable | Use CSS overlay fallback |
| Very small viewport | Cap minimum QR size at 200px |

## Metrics

- Scan success rate: Expected improvement with larger size
- Time to first scan: Expected reduction
- Fullscreen usage rate: Track via simple counter

## Dependencies

- QRCode.js library (already in use)
- No new dependencies required
- CSS-only fullscreen (no browser API dependency)

## Wireframe Reference

### Standard View (Larger QR)
```
+------------------------------------------+
|  Business Communication                   |
|  Session Active | Code: ABC123            |
|                                           |
|        +----------------------+           |
|        |                      |           |
|        |      [QR CODE]       |           |
|        |      ~400px          |           |
|        |                      |           |
|        +----------------------+           |
|              [Fullscreen]                 |
|                                           |
|  Students: 15 | On Time: 12 | Late: 3     |
+------------------------------------------+
```

### Fullscreen Mode
```
+------------------------------------------+
|                                           |
|                                           |
|       Business Communication              |
|                                           |
|        +----------------------+           |
|        |                      |           |
|        |      [QR CODE]       |           |
|        |      70% height      |           |
|        |                      |           |
|        +----------------------+           |
|                                           |
|              ABC123                       |
|                                           |
|         Tap anywhere to exit              |
|                                           |
+------------------------------------------+
```
