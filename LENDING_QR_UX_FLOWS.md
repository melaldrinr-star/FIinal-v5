# Lending QR Scanner - UI/UX Flow Documentation (Redesigned)

Complete UI/UX flows, user journeys, and screen descriptions for the card-based, adaptive modal QR scanner.

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Screen Layout](#screen-layout)
4. [Borrow Flow - Happy Path](#borrow-flow---happy-path)
4. [Borrow Flow - Error Paths](#borrow-flow---error-paths)
5. [Return Flow - Happy Path](#return-flow---happy-path)
6. [Return Flow - Error Paths](#return-flow---error-paths)
7. [Camera Interactions](#camera-interactions)
8. [Mobile Responsiveness](#mobile-responsiveness)
9. [Accessibility](#accessibility)
10. [State Indicators](#state-indicators)
11. [Screen Descriptions](#screen-descriptions)
12. [User Personas & Journeys](#user-personas--journeys)

---

## Overview

### Design Philosophy

- **Card-Based** - All content organized in cards for visual hierarchy
- **Adaptive Modal** - Intelligent sizing based on screen size (not breakpoint-driven)
- **Minimal & Clean** - Neutral color palette with high contrast
- **Efficiency-Focused** - Maximum information density without clutter
- **Monospace Details** - Uses monospace font for instructions and data

### Color Palette

- **Primary Background**: White / Slate-50
- **Text**: Slate-900 (dark) / Slate-600 (secondary)
- **Borders**: Slate-200 (subtle, neutral)
- **Accents**: Slate-900 (buttons), Green-100/800 (success badges)
- **Status**: Subtle gray tones (no bright colors, subtle yellow for torch)

---

## Design System

### Typography

```
Header: 16px semi-bold, uppercase small text for subtitle
Labels: 12px medium, slate-700
Input: 14px regular
Instructions: 12px monospace, slate-600
```

### Spacing

- Cards: 3.5rem (14px) padding
- Modal padding: 1.25rem (20px)
- Gap between elements: 1rem (16px) / 0.75rem (12px)
- Form fields: Height 36px (9 units in Tailwind)

### Rounded Corners

- Modal: 0.75rem (12px)
- Cards: Default (8px)
- Inputs/Buttons: 0.5rem (8px)
- Corner brackets: Sharp (no border-radius)

### Shadows

- Modal: shadow-2xl (large, dark)
- Cards: shadow-sm (subtle)
- Minimal use overall

---

## Screen Layout

### Main Scanner Modal - Redesigned

```
┌───────────────────────────────────────────────────┐
│                                                   │
│  ┌─ Circulation                            ✕    │  Header Card
│  │ ITEM LENDING & RETURN                        │
│  │                                               │
│  │ [BORROW] [RETURN] (Toggle buttons)          │
│  └───────────────────────────────────────────────│
│                                                   │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │       📷 CAMERA VIEW (300-400px height)  │  │
│  │                                           │  │
│  │    [Corner brackets for QR frame]        │  │
│  │                                           │  │
│  │   tap start to scan an item tag          │  │
│  │                                           │  │
│  │                                           │  │
│  │            [Resume/Pause] [Torch]        │  │ Camera Controls
│  │                                           │  │ (bottom bar with gradient)
│  └───────────────────────────────────────────┘  │
│                                                   │
│  ┌───────────────────────────────────────────┐  │
│  │ Item: Laptop Dell XPS                    ✓  │  Scanned Item Card
│  │ 3 available               [SCANNED]          │
│  └───────────────────────────────────────────┘  │
│                                                   │
│  Trainee *                                        │
│  [Select trainee dropdown]                      │
│                                                   │ Form Cards
│  Qty *          Return Date *                    │ (compact grid)
│  [1]            [2026-09-15]                    │
│                                                   │
│  Notes (optional)                                │
│  [Special instructions...]                      │
│                                                   │
│  [Create Lending]                               │
│                                                   │
│  ─────────────────────────────────────────────  │
│  Manual Entry                                    │
│  [Paste QR code...]  [Go]                       │ Manual Entry
│                                                   │ (fallback)
│                                                   │
└───────────────────────────────────────────────────┘
```

### Adaptive Sizing

```
Mobile (< 640px)
├─ Modal: 95vw width, 95vh height
├─ Camera: Full width, 300px height
├─ Form: Stacked single column
├─ Margins: 12px (p-3)
└─ Touch targets: 36-40px minimum

Tablet (640px - 1024px)
├─ Modal: max-w-2xl, h-auto
├─ Camera: 100% width, 350px height
├─ Form: 2-column grid for inputs
├─ Margins: 20px (p-5)
└─ Touch targets: 36px

Desktop (> 1024px)
├─ Modal: max-w-2xl, h-auto
├─ Camera: 100% width, 400px height
├─ Form: 2-column grid
├─ Margins: 20px (p-5)
└─ Touch targets: 36px
```

---

---

## Borrow Flow - Happy Path

### Complete User Journey: "Borrow a Laptop"

```
START: User clicks "Scan QR Code" button
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 1: Circulation Scanner Opens          │
├──────────────────────────────────────────────┤
│                                              │
│ Modal appears with:                          │
│ • Header: "Circulation"                      │
│ • Subtitle: "ITEM LENDING & RETURN"         │
│ • Mode toggle: [BORROW] [RETURN]           │
│ • BORROW tab highlighted (dark)             │
│                                              │
│ Camera loads...                              │
│ Status: "tap start to scan an item tag"     │
│ (Monospace font, centered)                  │
│                                              │
└──────────────────────────────────────────────┘
    ↓
  ~2 seconds
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 2: Camera Ready                       │
├──────────────────────────────────────────────┤
│                                              │
│ Live camera feed (300-400px height)         │
│ Shows corner brackets (minimal frame)        │
│ Center focus point visible                   │
│                                              │
│ Bottom bar: [Resume] [Torch]                │
│ White buttons on dark gradient background   │
│                                              │
│ Form panel below:                            │
│ "Position item QR code in frame"            │
│ (Monospace instructions)                    │
│                                              │
└──────────────────────────────────────────────┘
    ↓
User positions laptop label QR in frame
    ↓
~500ms to 2 seconds (scanning)
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 3: Item Detected                      │
├──────────────────────────────────────────────┤
│                                              │
│ Card appears with scanned item:             │
│ ┌──────────────────────────────────────┐   │
│ │ Item: Laptop Dell XPS                │   │
│ │ 3 available      [✓ SCANNED]         │   │
│ │ (Green badge, white background)      │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ Form fields become visible:                 │
│ • Trainee (Select)                          │
│ • Qty | Date (2-column grid)               │
│ • Notes (full width)                        │
│                                              │
└──────────────────────────────────────────────┘
    ↓
User clicks Trainee dropdown
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 4: Select Trainee                     │
├──────────────────────────────────────────────┤
│                                              │
│ Dropdown opens showing:                      │
│ • Maria Santos                               │
│ • Juan Dela Cruz                             │
│ • Anna Garcia                                │
│ • Carlos Rodriguez                           │
│                                              │
│ User clicks: Maria Santos                   │
│                                              │
└──────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 5: Trainee Selected                   │
├──────────────────────────────────────────────┤
│                                              │
│ Form shows:                                  │
│ Trainee: "Maria Santos"                     │
│                                              │
│ 2-column layout:                             │
│ [Qty: 1]  [Date: empty]                     │
│                                              │
│ [Submit button] DISABLED (date not set)     │
│                                              │
└──────────────────────────────────────────────┘
    ↓
User enters Qty: 1 (default) and picks date
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 6: All Fields Filled                  │
├──────────────────────────────────────────────┤
│                                              │
│ Form complete:                               │
│ Trainee: "Maria Santos"                     │
│ Qty: 1                                       │
│ Date: 2026-09-15                            │
│ Notes: "Handle with care"                   │
│                                              │
│ [Create Lending] button NOW ENABLED         │
│ (Dark slate background, white text)         │
│                                              │
│ Manual Entry section below (optional)        │
│                                              │
└──────────────────────────────────────────────┘
    ↓
User clicks [Create Lending]
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 7: Processing                         │
├──────────────────────────────────────────────┤
│                                              │
│ Button shows: [⟳ Creating...]              │
│ (Spinner animation, disabled)               │
│                                              │
│ "Creating lending record..."                │
│                                              │
│ API call in progress                         │
│ POST /api/lendings                           │
│                                              │
└──────────────────────────────────────────────┘
    ↓
~500-1000ms
    ↓
┌──────────────────────────────────────────────┐
│ SCREEN 8: Success!                           │
├──────────────────────────────────────────────┤
│                                              │
│ Toast notification (bottom right):          │
│ ✅ "Item borrowed successfully"             │
│                                              │
│ Form resets to initial state:               │
│ • Item card cleared                         │
│ • Trainee dropdown reset                    │
│ • Qty back to "1"                           │
│ • Date cleared                              │
│ • Notes cleared                             │
│                                              │
│ Camera resumes scanning                      │
│ Ready for next item                         │
│                                              │
│ Borrowing slip auto-generated:              │
│ SLIP-20260908-001                           │
│                                              │
└──────────────────────────────────────────────┘
    ↓
END: Success complete, ready for next scan
```

---

## Borrow Flow - Error Paths

### Error Path 1: Item Not Found

```
User scans QR code
  ↓
System attempts to look up item
  ↓
API returns 404 Not Found
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Error State                      │
├──────────────────────────────────────────┤
│ Toast at bottom:                         │
│ ❌ "Item not found"                      │
│ "QR code may be outdated or invalid"     │
│                                          │
│ Form state unchanged                     │
│ Item field cleared                       │
│ Can immediately retry with new scan      │
│ Or manually enter item ID if available   │
└──────────────────────────────────────────┘
  ↓
User can:
├─ Scan different item QR
├─ Type item ID manually in fallback
└─ Close scanner
```

### Error Path 2: Item Out of Stock

```
User scans available item QR
  ↓
System retrieves item
  ↓
Validation: available_quantity = 0
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Insufficient Stock               │
├──────────────────────────────────────────┤
│ Item card shows:                         │
│ Laptop Dell XPS 13                       │
│ Available: 0 units                       │
│ [⚠ OUT OF STOCK]  (red badge)           │
│                                          │
│ Toast:                                   │
│ ⚠️ "Item is out of stock"               │
│ "Choose a different item"                │
│                                          │
│ [CREATE LENDING] button DISABLED         │
│ Form cannot proceed                      │
└──────────────────────────────────────────┘
  ↓
User must scan different item or close
```

### Error Path 3: Invalid Quantity

```
Item scanned, trainee selected
  ↓
User tries quantity > available
  ↓
Example: Wants 5 units, only 2 available
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Validation Error                 │
├──────────────────────────────────────────┤
│ Quantity field shows: 5                  │
│ Helper text (red): "Max available: 2"    │
│ Toast:                                   │
│ ❌ "Invalid quantity"                    │
│ "Cannot exceed available inventory"      │
│                                          │
│ [CREATE LENDING] button DISABLED         │
└──────────────────────────────────────────┘
  ↓
User corrects quantity to 2
  ↓
Button becomes enabled again
```

### Error Path 4: Missing Trainee Selection

```
Item scanned, quantity set, date set
  ↓
User tries to submit without selecting trainee
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Validation Error                 │
├──────────────────────────────────────────┤
│ Trainee dropdown highlighted (red)       │
│ Toast:                                   │
│ ❌ "Please select a trainee"            │
│                                          │
│ Form submission blocked                  │
│ [CREATE LENDING] button disabled         │
└──────────────────────────────────────────┘
  ↓
User clicks dropdown and selects trainee
  ↓
Button becomes enabled
```

### Error Path 5: Invalid Return Date

```
User selects past date in date picker
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Invalid Date                     │
├──────────────────────────────────────────┤
│ Date field shows: 2026-09-01             │
│ Helper text (red): "Date must be today   │
│                    or later"             │
│                                          │
│ Toast:                                   │
│ ❌ "Invalid return date"                 │
│ "Please select today or a future date"   │
│                                          │
│ [CREATE LENDING] button DISABLED         │
└──────────────────────────────────────────┘
  ↓
User selects valid future date
  ↓
Button becomes enabled
```

### Error Path 6: Server Error (Transient)

```
User clicks [CREATE LENDING]
  ↓
API call fails (500 Server Error)
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Server Error                     │
├──────────────────────────────────────────┤
│ Toast with action:                       │
│ ❌ "Failed to create lending"            │
│ [RETRY] button in toast                  │
│                                          │
│ Form state preserved                     │
│ [CREATE LENDING] button re-enabled       │
│ User can modify or retry                 │
└──────────────────────────────────────────┘
  ↓
User clicks [RETRY]
  ↓
Same submission attempted again
  ↓
Usually succeeds on retry
```

---

## Return Flow - Happy Path

### Complete User Journey: "Return Borrowed Item"

```
START: User clicks "Return Item" button (or opens scanner, switches to Return tab)
    ↓
┌──────────────────────────────────────────┐
│ SCREEN 1: Return Mode Opened             │
├──────────────────────────────────────────┤
│ Modal appears or switches tab            │
│ "Return" tab selected (highlighted)      │
│ "Borrow" tab unselected                  │
│                                          │
│ Camera starts/continues                  │
│ "Scan the lending slip QR code..."       │
│ [   📸 CAMERA FEED   ]                   │
│                                          │
│ Form below camera is empty (reset)       │
└──────────────────────────────────────────┘
    ↓
User positions lending slip in camera
    ↓
  ~500ms to 2 seconds (scanning)
    ↓
┌──────────────────────────────────────────┐
│ SCREEN 2: Lending Slip Scanned           │
├──────────────────────────────────────────┤
│ Lending details appear:                  │
│                                          │
│ Lending Info Card:                       │
│ ┌────────────────────────────────────┐  │
│ │ Item: Laptop Dell XPS 13           │  │
│ │ Borrower: Maria Santos             │  │
│ │ Borrowed: 2026-09-08               │  │
│ │ Due Date: 2026-09-15               │  │
│ │ Status: [ACTIVE]                   │  │
│ │ Days Left: 7 days                  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [✓ SCANNED]  (green indicator)          │
│ Camera pauses                            │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ SCREEN 3: Review Lending                 │
├──────────────────────────────────────────┤
│ User verifies the scanned information:   │
│ ✓ Correct item?                         │
│ ✓ Correct borrower?                     │
│ ✓ Correct dates?                        │
│                                          │
│ If all correct: Proceed                  │
│ If incorrect: Can re-scan different slip │
└──────────────────────────────────────────┘
    ↓
User optionally enters Return Notes
    ↓
┌──────────────────────────────────────────┐
│ SCREEN 4: Return Notes (Optional)        │
├──────────────────────────────────────────┤
│ Return Notes field (optional):            │
│ ┌────────────────────────────────────┐  │
│ │ Item condition: Good, no damage    │  │
│ │ Missing parts: None                │  │
│ │ Notes: Works perfectly, clean      │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Or can skip (field is optional)          │
│                                          │
│ [CONFIRM RETURN] button ENABLED         │
│ (ready to submit)                        │
└──────────────────────────────────────────┘
    ↓
User clicks [CONFIRM RETURN] button
    ↓
┌──────────────────────────────────────────┐
│ SCREEN 5: Submitting Return              │
├──────────────────────────────────────────┤
│ Button shows: [RETURNING...]             │
│ Form fields disabled                     │
│ Spinner animation                        │
│ "Marking item as returned..."            │
│                                          │
│ API call:                                │
│ POST /api/lendings/{id}/return           │
└──────────────────────────────────────────┘
    ↓
  ~500-1000ms (API processing)
    ↓
┌──────────────────────────────────────────┐
│ SCREEN 6: Success!                       │
├──────────────────────────────────────────┤
│ Toast at bottom:                         │
│ ✅ "Item returned successfully"         │
│                                          │
│ Confirmation details:                    │
│ Lending #: lending-uuid-1                │
│ Item: Laptop Dell XPS 13                 │
│ Returned by: Current Staff               │
│ Returned at: 2026-09-14 10:00 AM        │
│ Status: RETURNED ✓                       │
│                                          │
│ Form resets:                             │
│ • Lending cleared                        │
│ • Lending info cleared                   │
│ • Notes cleared                          │
│                                          │
│ Camera resumes scanning                  │
│ Ready for next return                    │
│                                          │
│ [CONFIRM RETURN] button DISABLED again   │
└──────────────────────────────────────────┘
    ↓
Optional: User closes scanner
    ↓
Modal closes, parent refreshes data
    ↓
END: Return complete
```

---

## Return Flow - Error Paths

### Error Path 1: Lending Not Found

```
User scans QR code
  ↓
System attempts to look up lending
  ↓
API returns 404 Not Found
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Lending Not Found                │
├──────────────────────────────────────────┤
│ Toast:                                   │
│ ❌ "Lending not found"                  │
│ "Slip QR may be invalid or outdated"     │
│                                          │
│ Lending details cleared                  │
│ Can immediately retry with new scan      │
└──────────────────────────────────────────┘
  ↓
User can:
├─ Scan different lending slip
├─ Type lending ID manually
└─ Close scanner
```

### Error Path 2: Already Returned

```
User scans lending slip QR
  ↓
System looks up lending
  ↓
Validation: status = 'returned'
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Already Returned                 │
├──────────────────────────────────────────┤
│ Lending Info shows:                      │
│ Status: [RETURNED] ✓ (green badge)      │
│ Returned: 2026-09-13 14:00               │
│ Returned by: Staff Name                  │
│                                          │
│ Toast:                                   │
│ ⚠️  "This item was already returned"    │
│ "on 2026-09-13 at 2:00 PM"              │
│                                          │
│ [CONFIRM RETURN] button DISABLED         │
│ Cannot return again                      │
└──────────────────────────────────────────┘
  ↓
User must scan different lending slip
```

### Error Path 3: Server Error on Return

```
User clicks [CONFIRM RETURN]
  ↓
API call fails (500 Server Error)
  ↓
┌──────────────────────────────────────────┐
│ SCREEN: Return Failed                    │
├──────────────────────────────────────────┤
│ Toast with action:                       │
│ ❌ "Failed to mark item as returned"    │
│ [RETRY] button in toast                  │
│                                          │
│ Lending details still displayed          │
│ [CONFIRM RETURN] button re-enabled       │
│ Return notes preserved                   │
│ Can modify or retry                      │
└──────────────────────────────────────────┘
  ↓
User clicks [RETRY]
  ↓
Same return submission attempted again
  ↓
Usually succeeds on retry
```

---

## Camera Interactions

### Camera State Transitions

```
Modal Opens
    ↓
    ├─ Request camera permission
    │  ├─ Allowed → Start stream
    │  └─ Denied → Show error, no camera
    ↓
Stream Active
    ├─ Show live video
    ├─ Detect QR codes
    └─ Ready for scanning
    ↓
QR Detected
    ├─ Extract QR data
    ├─ Pause stream (optional)
    └─ Process QR
    ↓
Can Resume / Pause / Switch Device
    ├─ Resume: Continue scanning
    ├─ Pause: Freeze on current frame
    └─ Switch: Change to different camera
```

### Torch Interaction

```
┌─ Button State: OFF (gray)
│  ├─ Torch disabled
│  └─ Click → Try turn ON
├─ ON Attempt
│  ├─ Device supports? 
│  ├─ YES → Button becomes ON (yellow)
│  │       Flashlight activates
│  └─ NO  → Button stays OFF
│           Warning: "No torch available"
└─ Button State: ON (yellow)
   ├─ Torch enabled
   └─ Click → Turn OFF
```

### Device Switching

```
Detect Cameras
    ↓
    ├─ 1 camera → Hide device selector
    ├─ 2+ cameras → Show device dropdown
    └─ No cameras → Show error
    ↓
User selects different camera
    ↓
    ├─ Stop current stream
    ├─ Wait 300ms (debounce)
    ├─ Start new stream
    └─ Resume QR detection
    ↓
Can switch back anytime
```

---

## Mobile Responsiveness

### Phone Layout (Portrait - 360px width)

```
┌──────────────────────────────┐
│  ✕                           │
├──────────────────────────────┤
│ BORROW    RETURN             │
├──────────────────────────────┤
│  [  CAMERA FRAME  ]          │
│  [  (Full width) ]           │
│  [               ]           │
├──────────────────────────────┤
│ Item: Laptop...              │
│ ✓ Available                  │
├──────────────────────────────┤
│ Trainee:                     │
│ [Dropdown v]                 │
├──────────────────────────────┤
│ Qty:  [1]  [−] [+]          │
├──────────────────────────────┤
│ Date: [Calendar]             │
├──────────────────────────────┤
│ Notes: [Text field]          │
├──────────────────────────────┤
│ [🔦] [⏸] [📱] [CAMERA]      │
├──────────────────────────────┤
│ [CREATE LENDING]             │
│ [CANCEL]                     │
└──────────────────────────────┘
```

### Tablet Layout (Landscape - 1024px width)

```
┌────────────────────────────────────────────┐
│  ✕                                         │
├────────────────────────────────────────────┤
│ BORROW          RETURN                     │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────┐  ┌────────────────────┐ │
│  │              │  │ Item: Laptop...    │ │
│  │   CAMERA     │  │ ✓ Available        │ │
│  │   FRAME      │  │                    │ │
│  │              │  │ Trainee:           │ │
│  │   (Full      │  │ [Dropdown v]       │ │
│  │   height)    │  │                    │ │
│  │              │  │ Qty: [1]  [−] [+] │ │
│  │              │  │                    │ │
│  │              │  │ Date: [Calendar]   │ │
│  │              │  │                    │ │
│  └──────────────┘  │ Notes: [Text...]   │ │
│                    │                    │ │
│  [🔦] [⏸] [📱]    │ [CREATE LENDING]   │ │
│  [CAMERA]          │ [CANCEL]           │ │
│                    └────────────────────┘ │
└────────────────────────────────────────────┘
```

### Responsive Breakpoints

```
Mobile (< 640px)
├─ Single column layout
├─ Camera full width
├─ Form below camera
├─ Stacked buttons
└─ Larger touch targets (48px minimum)

Tablet (640px - 1024px)
├─ Two column when possible
├─ Camera on left
├─ Form on right
├─ Horizontal layouts
└─ Normal touch targets

Desktop (> 1024px)
├─ Two column layout
├─ Camera larger
├─ Form larger
├─ Wider text fields
└─ Standard touch targets
```

---

## Accessibility

### Screen Reader Announcements

```
Modal Opens
  → "Lending scanner dialog has opened"
  → "Tab 1 of 2: Borrow mode, currently selected"
  → "Tab 2 of 2: Return mode"

Item Scanned
  → "Item detected: Laptop Dell XPS"
  → "Status: Available"
  → "Quantity available: 3 units"
  → "Trainee selector ready for input"

Trainee Selected
  → "Trainee selected: Maria Santos"

Form Filled
  → "Quantity: 1 unit"
  → "Return date: September 15, 2026"
  → "Notes: Handle with care"
  → "Create Lending button now available"

Success
  → "Success: Item borrowed successfully"
  → "Slip number generated: SLIP-20260908-001"
  → "Form has reset"
```

### Keyboard Navigation

```
Tab → Next field
  Cycle through:
  ├─ Borrow/Return tabs
  ├─ Camera controls
  ├─ Trainee dropdown
  ├─ Quantity inputs
  ├─ Date picker
  ├─ Notes field
  ├─ Create/Confirm button
  └─ Cancel button

Shift+Tab → Previous field
Enter → Activate button or open dropdown
Space → Toggle button or checkbox
Escape → Close dropdown or modal
Arrow Keys → Navigate dropdown/date options
```

### Visual Indicators

- **Focus rings** - 2px blue outline visible on all interactive elements
- **Disabled state** - 50% opacity, cursor not-allowed
- **Loading state** - Animated spinner
- **Error state** - Red border on invalid fields
- **Success state** - Green checkmark icon

---

## State Indicators

### Badge Styles

```
Available
├─ Icon: ✓ (checkmark)
├─ Color: Green (#10B981)
├─ Text: "AVAILABLE"
└─ Usage: Item has stock

Out of Stock
├─ Icon: ✗ (cross)
├─ Color: Red (#EF4444)
├─ Text: "OUT OF STOCK"
└─ Usage: Item quantity = 0

Active Lending
├─ Icon: ◆ (diamond)
├─ Color: Blue (#3B82F6)
├─ Text: "ACTIVE"
└─ Usage: Lending in progress

Overdue
├─ Icon: ⏰ (clock)
├─ Color: Orange (#F59E0B)
├─ Text: "OVERDUE"
└─ Usage: Past return date

Returned
├─ Icon: ✓ (checkmark)
├─ Color: Green (#10B981)
├─ Text: "RETURNED"
└─ Usage: Successfully returned
```

### Loading States

```
Creating Lending
├─ Button text: [CREATING...]
├─ Animated spinner inside button
├─ Form disabled
└─ Message: "Creating lending record..."

Returning Item
├─ Button text: [RETURNING...]
├─ Animated spinner
├─ Form disabled
└─ Message: "Marking item as returned..."

Loading Camera
├─ Skeleton frame
├─ Animated shimmer
├─ Message: "Starting camera..."
└─ Alternative: "Requesting camera access..."
```

---

## Screen Descriptions

### Screen: Empty Borrow Form

**Mobile View:**
```
┌─────────────────────────────┐
│  ✕  LENDING SCANNER         │
├─────────────────────────────┤
│ BORROW    RETURN            │
├─────────────────────────────┤
│                             │
│ ┌───────────────────────┐   │
│ │                       │   │
│ │   📸 CAMERA PREVIEW   │   │
│ │                       │   │
│ │ (Position QR in frame)│   │
│ │                       │   │
│ └───────────────────────┘   │
│                             │
├─────────────────────────────┤
│ No item scanned yet         │
│ "Scan item QR code..."      │
│                             │
├─────────────────────────────┤
│ [🔦] [⏸] [📱]              │
│ Torch  Pause Device         │
├─────────────────────────────┤
│ [CREATE LENDING]  ← disabled│
│ [CANCEL]                    │
└─────────────────────────────┘
```

**Description:**
- Fresh scanner state
- All form fields empty
- Item card shows placeholder text
- Trainee dropdown says "Select trainee"
- Quantity defaults to "1"
- Date field empty
- Notes field empty
- "CREATE LENDING" button disabled (grayed out)
- Camera frame shows live video
- All camera controls visible and functional

### Screen: Item Scanned, Trainee Selected

**Mobile View:**
```
┌─────────────────────────────┐
│  ✕  LENDING SCANNER         │
├─────────────────────────────┤
│ BORROW    RETURN            │
├─────────────────────────────┤
│                             │
│ ┌───────────────────────┐   │
│ │                       │   │
│ │   📸 CAMERA PREVIEW   │   │
│ │                       │   │
│ │ (Paused - QR scanned) │   │
│ │                       │   │
│ └───────────────────────┘   │
│                             │
├─────────────────────────────┤
│ Item: Laptop Dell XPS       │
│ Available: 3 units          │
│ [✓ AVAILABLE]               │
│                             │
├─────────────────────────────┤
│ Trainee:                    │
│ [Maria Santos     ✓]        │
│                             │
├─────────────────────────────┤
│ Qty: 1                      │
│ [−] [1] [+]  Available: 3   │
│                             │
├─────────────────────────────┤
│ [CREATE LENDING]  ← disabled│
│ (Need date)                 │
│ [CANCEL]                    │
└─────────────────────────────┘
```

**Description:**
- Item card visible with green "AVAILABLE" badge
- Camera paused (shows last frame)
- Trainee selected (shows name with checkmark)
- Quantity input active and set to 1
- Date field still empty (required)
- Button still disabled because date not set
- User must click date picker next

### Screen: All Fields Filled, Ready to Submit

**Mobile View:**
```
┌─────────────────────────────┐
│  ✕  LENDING SCANNER         │
├─────────────────────────────┤
│ BORROW    RETURN            │
├─────────────────────────────┤
│                             │
│ Item: Laptop Dell XPS       │
│ Available: 3 units          │
│ [✓ AVAILABLE]               │
│                             │
├─────────────────────────────┤
│ Trainee: Maria Santos    ✓  │
├─────────────────────────────┤
│ Qty: 1  [−] [1] [+]         │
│ Available: 3                │
├─────────────────────────────┤
│ Return Date: 2026-09-15  ✓  │
├─────────────────────────────┤
│ Notes:                      │
│ ┌───────────────────────┐   │
│ │ Handle with care      │   │
│ └───────────────────────┘   │
│                             │
├─────────────────────────────┤
│ [CREATE LENDING]  ← ENABLED │
│ (all fields complete)       │
│ [CANCEL]                    │
└─────────────────────────────┘
```

**Description:**
- All required fields have checkmarks
- "CREATE LENDING" button is highlighted/enabled
- Notes field filled (optional, but shown)
- Form is ready for submission
- User can click button immediately
- Or modify any field before submitting

### Screen: Return Mode - Lending Scanned

**Mobile View:**
```
┌─────────────────────────────┐
│  ✕  LENDING SCANNER         │
├─────────────────────────────┤
│ BORROW    RETURN            │
├─────────────────────────────┤
│ Lending Scanned:            │
│ ┌───────────────────────┐   │
│ │ Laptop Dell XPS 13    │   │
│ │ Borrower: Maria...    │   │
│ │ Borrowed: 2026-09-08  │   │
│ │ Due: 2026-09-15       │   │
│ │ Days left: 7          │   │
│ │ [ACTIVE]              │   │
│ └───────────────────────┘   │
│                             │
├─────────────────────────────┤
│ Return Notes (optional):    │
│ ┌───────────────────────┐   │
│ │ [Good condition]      │   │
│ └───────────────────────┘   │
│                             │
├─────────────────────────────┤
│ [CONFIRM RETURN]  ← ENABLED │
│ [CANCEL]                    │
└─────────────────────────────┘
```

**Description:**
- Lending details displayed in card
- All info clearly visible
- Return notes optional (can be left blank)
- "CONFIRM RETURN" button ready to submit
- User can add notes or submit immediately
- Camera can be resumed if needed to re-scan

---

## User Personas & Journeys

### Persona 1: Rita - Inventory Manager

**Profile:**
- Age: 32, uses phone and tablet
- Tech-savvy, trains new staff
- Processes 20-30 borrows/returns per day
- Cares about speed and accuracy

**Journey:**

```
Morning: Batch of items arrive
  ↓
Rita opens LendingQRScanner
  ↓
"I need to quickly process these 10 laptops"
  ↓
1. Scans item QR
2. Selects trainee from dropdown (1-2 seconds)
3. Enters qty/date (3 seconds)
4. Clicks Create (0.5 seconds)
5. Repeat x10
  ↓
Total time: ~5-7 minutes for all 10 items
  ↓
Afternoon: Items are returned
  ↓
1. Scans lending slip QR
2. Optionally adds condition notes
3. Confirms return (1-2 seconds)
4. Repeat x10
  ↓
"Perfect! Quick and easy. No confusion."
```

**Needs:**
- ✓ Fast workflow
- ✓ Minimal clicks
- ✓ Clear feedback
- ✓ Batch processing support

---

### Persona 2: Marcus - New Staff Member

**Profile:**
- Age: 22, first week on the job
- Tech comfort: Moderate (knows phones)
- Anxious about making mistakes
- Learns by trying

**Journey:**

```
First day: Training on scanner
  ↓
Marcus: "So I just scan the QR code?"
Trainer: "Yes, then fill the form"
  ↓
Marcus scans first item
  ↓
Scanner shows clear item card
Marcus: "Okay, I see the item"
  ↓
Marcus tries to submit without trainee
  ↓
Toast error: "Please select a trainee"
Marcus: "Oh, I need to do that first"
  ↓
Selects trainee from dropdown
Marcus: "That was easy!"
  ↓
Enters date from date picker
Marcus: "I like this - no typing dates"
  ↓
Successfully creates first lending
Toast: "✅ Item borrowed successfully"
Marcus: "I did it! This is cool."
  ↓
By end of day: Created 15 lendings, no errors
  ↓
"This scanner is user-friendly. I feel confident."
```

**Needs:**
- ✓ Clear error messages
- ✓ Visual feedback for every action
- ✓ Help text for form fields
- ✓ Can't make permanent mistakes
- ✓ Encouraging success messages

---

### Persona 3: Angela - Mobile-Only User

**Profile:**
- Age: 45, uses mostly mobile phone
- Not always at a desk
- Walks around office/warehouse
- Needs one-handed operation when possible

**Journey:**

```
Manager asks: "Can you process this return?"
  ↓
Angela: "Sure, let me get my phone"
  ↓
Opens LendingQRScanner on phone
  ↓
Sees mobile-optimized layout
  ✓ Large camera preview (full screen)
  ✓ Clear buttons
  ✓ Readable text
  ✓ Touch targets big enough
  ↓
Positions phone to scan lending slip QR
  ↓
System detects QR in 1-2 seconds
  ↓
Phone vibrates (tactile feedback)
  ↓
Lending details appear
Angela: "Great! That's the right one"
  ↓
Taps [CONFIRM RETURN]
  ↓
Success toast: "✅ Item returned successfully"
  ↓
"Perfect, I can do this from anywhere in the building."
```

**Needs:**
- ✓ Mobile-optimized layout
- ✓ Full-screen camera view
- ✓ Large touch targets
- ✓ Tactile/audio feedback
- ✓ One-handed navigation (when possible)

---

### Persona 4: David - Accessibility Advocate

**Profile:**
- Age: 38, uses screen reader
- Expects proper ARIA labels
- Uses keyboard for navigation
- Tests all new interfaces

**Journey:**

```
Opens LendingQRScanner
  ↓
Screen reader: "Lending scanner dialog has opened"
  ↓
David: "Good, proper ARIA."
  ↓
Presses Tab
  ↓
Screen reader: "Tab 1 of 2, Borrow mode, currently selected"
  ↓
David: "I can navigate the tabs"
  ↓
Presses Tab again
  ↓
Screen reader: "Trainee selector dropdown"
  ↓
David uses arrow keys to navigate trainees
  ↓
Presses Enter to select
  ↓
Screen reader: "Trainee selected: Maria Santos"
  ↓
Continues with Tab to navigate form
  ↓
Successfully completes lending without camera
  (using QR code ID manual entry fallback)
  ↓
Screen reader: "Success: Item borrowed successfully"
  ↓
"This component is properly accessible. Nice work."
```

**Needs:**
- ✓ Proper ARIA labels
- ✓ Full keyboard navigation
- ✓ Screen reader announcements
- ✓ Manual entry fallback
- ✓ Semantic HTML structure

---

## Summary

The Lending QR Scanner provides:

✅ **Intuitive UI** - Clear forms, visual feedback, guided workflows
✅ **Mobile optimized** - Responsive layout, large touch targets
✅ **Error recovery** - Helpful messages, multiple paths to success
✅ **Accessible** - Screen readers, keyboard nav, visual indicators
✅ **User-focused** - Fast for power users, friendly for beginners
✅ **Visual feedback** - Toasts, spinners, badges, status indicators

**Key UX Flows:**
- Borrow: Scan → Select → Fill → Create
- Return: Scan → Review → Confirm
- Error handling: Clear messages + recovery options
- Mobile: Full-screen camera, stacked forms
- Accessibility: Complete keyboard + screen reader support
