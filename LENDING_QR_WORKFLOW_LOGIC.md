# Lending QR Scanner - Workflow Logic

Complete workflow documentation for the reworked QR scanner focused on item lending and return.

---

## Overview

The new `LendingQRScanner` component provides two main workflows:

1. **BORROW WORKFLOW** - Staff scans item QR → Selects trainee → Creates lending record
2. **RETURN WORKFLOW** - Staff scans lending slip → Confirms return → Updates records

---

## Architecture

```
LendingQRScanner Component
├── Camera Module
│   ├── Device management
│   ├── Video stream
│   ├── Torch control
│   └── QR decoding (jsQR library)
│
├── Borrow Workflow
│   ├── Item QR Detection
│   ├── Item Validation
│   ├── Trainee Selection
│   ├── Lending Details (Qty, Date, Notes)
│   └── Create Lending API Call
│
├── Return Workflow
│   ├── Lending Slip QR Detection
│   ├── Lending Validation
│   ├── Return Notes
│   └── Mark Returned API Call
│
└── UI/UX Layer
    ├── Mode Toggle (Borrow/Return)
    ├── Form Panels
    ├── Status Indicators
    └── Manual Entry Fallback
```

---

## BORROW WORKFLOW - Detailed Flow

### Phase 1: Initialization

```
User navigates to Lending page
       ↓
Clicks "Scan" button → Opens LendingQRScanner (borrow mode)
       ↓
Component loads:
├─ Camera starts automatically
├─ jsQR library loaded
├─ Trainees list fetched
└─ Form reset to defaults
       ↓
Scanner ready for QR detection
```

### Phase 2: Item QR Scanning

```
Scanner continuously monitoring video frame
       ↓
User positions item QR code in frame (centered square)
       ↓
jsQR detects QR code
       ↓
QR data extracted: raw string
       ↓
Parse QR data:
├─ Try JSON.parse(raw) → extract 'id' field
└─ If fails: treat raw string as item UUID
       ↓
Validate: Is it a valid UUID?
├─ YES → Proceed to Step 3
└─ NO → Show error toast, retry
       ↓
Trigger cooldown (2 seconds)
  └─ Prevents duplicate scans of same QR
```

### Phase 3: Item Lookup & Validation

```
Call: inventoryService.getInventoryItemById(itemId)
       ↓
Database lookup:
├─ Find item by ID
├─ Load item details (name, description, quantity, etc.)
└─ Check available_quantity > 0
       ↓
Response received:
│
├─ SUCCESS:
│  ├─ Display item card
│  │  ├─ Item name & description
│  │  ├─ Available quantity
│  │  └─ Status badge: "Available" or "Out of Stock"
│  │
│  └─ Auto-focus: Trainee selector
│     └─ User can immediately select trainee
│
└─ ERROR:
   ├─ Show error: "Item not found"
   ├─ Clear scanned item state
   └─ Allow retry with different QR
```

### Phase 4: Borrower Selection

```
Form displays: Trainee Selection Dropdown
       ↓
User clicks dropdown → Lists all trainees
       ↓
User selects trainee: "Maria Santos"
       ↓
selectedTraineeId = "trainee-uuid-12345"
       ↓
Form validates: traineeId selected?
├─ YES → Enable Quantity input
└─ NO → Keep Create button disabled
```

### Phase 5: Lending Details Entry

```
User fills out form fields:

1. QUANTITY
   ├─ Input field with min=1, max=available_quantity
   ├─ Default: 1
   ├─ Validation: 1 ≤ qty ≤ available
   └─ Shows: "Available: X units"

2. DUE DATE (Return Date)
   ├─ Date picker input
   ├─ Min date: today (enforced by input type="date")
   ├─ Default: empty (required)
   ├─ Format: YYYY-MM-DD
   └─ Validation: must be future date

3. NOTES (Optional)
   ├─ Text input field
   ├─ Placeholder: "Special instructions..."
   ├─ Default: empty
   ├─ Max: practical limit (no hard limit)
   └─ Attached to lending record
```

### Phase 6: Create Lending

```
User clicks: "Create Lending" button
       ↓
Pre-submission validation:
├─ scannedItem exists? → Item must be loaded
├─ Item available? → available_quantity > 0
├─ traineeId selected? → Must select trainee
├─ quantity valid? → 1 ≤ qty ≤ available
├─ dueDate set? → Must be provided
└─ dueDate future? → Can't be today or earlier
       ↓
All valid? 
│
├─ NO:
│  └─ Show specific error toast
│     └─ User corrects & retries
│
└─ YES:
   └─ Proceed to API call
       ↓
API CALL: lendingService.createLending({
  item_id: "item-uuid",
  trainee_id: "trainee-uuid",
  quantity: 1,
  expected_return_date: "2026-09-15",
  notes: "Handle with care"
})
       ↓
Backend processing:
├─ Validate input
├─ Check item availability (revalidate)
├─ Create lending record
├─ AUTO-CREATE borrowing slip (SLIP-YYYYMMDD-XXXX)
├─ Update item.available_quantity (qty - quantity)
├─ Update item.status (recalculate)
├─ Log activity
└─ Return complete lending + slip info
       ↓
Response:
│
├─ SUCCESS (201 Created):
│  ├─ Toast: "✓ Item borrowed successfully"
│  │
│  ├─ Reset form:
│  │  ├─ scannedItem = null
│  │  ├─ selectedTraineeId = ""
│  │  ├─ borrowQuantity = "1"
│  │  ├─ borrowDueDate = ""
│  │  └─ borrowNotes = ""
│  │
│  ├─ Call: onSuccess() callback
│  │  └─ Parent page refreshes lending list
│  │
│  ├─ Reset scanner cooldown (500ms)
│  │  └─ Ready for next scan
│  │
│  └─ UI returns to ready state
│
└─ ERROR:
   └─ Show error toast with message
      └─ User can retry or correct details
```

---

## RETURN WORKFLOW - Detailed Flow

### Phase 1: Initialization

```
User navigates to Lending page
       ↓
Clicks "Scan" button → Opens LendingQRScanner
       ↓
User clicks "Return" tab → Switches to return mode
       ↓
Component loads:
├─ Camera starts/continues
├─ Form reset
└─ Return-specific state initialized
       ↓
Scanner ready to scan lending slip QR
```

### Phase 2: Lending Slip QR Scanning

```
Scanner monitoring video frame
       ↓
User positions lending slip QR code in frame
       ↓
jsQR detects QR code
       ↓
QR data extracted: raw string
  └─ Contains lending ID or slip info
       ↓
Parse QR data:
├─ Try JSON.parse(raw) → extract lending_id or id
└─ If fails: treat raw as lending ID
       ↓
Validate: Is it valid UUID?
├─ YES → Proceed
└─ NO → Show error, retry
       ↓
Trigger cooldown (2 seconds)
```

### Phase 3: Lending Record Lookup

```
Call: lendingService.getLendingById(lendingId)
       ↓
Database lookup:
├─ Find lending by ID
├─ Load with relations (item, trainee)
└─ Check lending.status
       ↓
Response:
│
├─ SUCCESS:
│  ├─ Check: is status === 'returned'?
│  │  ├─ YES → Warning: "Already returned"
│  │  │        └─ Clear and allow new scan
│  │  │
│  │  └─ NO → Proceed
│  │
│  ├─ Display lending info:
│  │  ├─ Item name
│  │  ├─ Borrower (trainee or external name)
│  │  ├─ Borrowed date
│  │  ├─ Due date
│  │  ├─ Status badge: "Active" or "Overdue"
│  │  └─ Green card showing "Scanned"
│  │
│  └─ Set state:
│     ├─ scannedLendingId = lendingId
│     ├─ lendingInfo = lending object
│     └─ Enable return form
│
└─ ERROR:
   ├─ Show error: "Lending record not found"
   ├─ Clear state
   └─ Allow retry
```

### Phase 4: Return Confirmation

```
Form displays: Return Notes (optional)

User can optionally enter notes:
├─ Item condition: "Good, no damage"
├─ Missing parts: "Charger missing"
├─ Special info: etc.
└─ Default: empty (optional field)

User clicks: "Confirm Return" button
       ↓
Pre-submission validation:
├─ scannedLendingId exists?
├─ lendingInfo loaded?
└─ Status not already returned?
       ↓
Valid?
│
├─ NO:
│  └─ Show error: "No lending loaded"
│     └─ User must scan again
│
└─ YES:
   └─ Proceed to API call
       ↓
API CALL: lendingService.returnItem(lendingId, {
  notes: "Charger missing"  // optional
})
       ↓
Backend processing:
├─ Find lending record
├─ Verify status != 'returned'
├─ Update lending record:
│  ├─ status = 'returned'
│  ├─ actual_return_date = now
│  ├─ returned_by = userId
│  └─ append notes (if provided)
│
├─ Update item:
│  ├─ available_quantity += quantity
│  └─ recalculate status
│
├─ AUTO-UPDATE borrowing slip:
│  ├─ status = 'returned'
│  └─ returned_at = now
│
├─ Log activity
│
└─ Return updated lending
       ↓
Response:
│
├─ SUCCESS (200 OK):
│  ├─ Toast: "✓ Item returned successfully"
│  │
│  ├─ Reset form:
│  │  ├─ scannedLendingId = null
│  │  ├─ lendingInfo = null
│  │  └─ returnNotes = ""
│  │
│  ├─ Call: onSuccess() callback
│  │  └─ Parent page refreshes lending list
│  │
│  ├─ Reset scanner (500ms)
│  │  └─ Ready for next return scan
│  │
│  └─ UI returns to ready state
│
└─ ERROR:
   └─ Show error toast
      └─ User can retry or scan different slip
```

---

## State Management

### Borrow Mode States

```typescript
// Item scanning
scannedItem: ScannedItemInfo | null
  ├─ item: InventoryItem
  ├─ status: 'available' | 'out_of_stock'
  └─ message: string

itemLoading: boolean  // Loading item from API

// Borrower details
selectedTraineeId: string  // Selected trainee UUID
trainees: Trainee[]        // List of available trainees

// Lending details
borrowQuantity: string           // "1"
borrowDueDate: string           // "2026-09-15"
borrowNotes: string             // Optional notes

// UI state
creatingLending: boolean  // API call in progress
```

### Return Mode States

```typescript
// Lending scanning
scannedLendingId: string | null  // Scanned lending UUID
lendingInfo: any | null          // Lending record with relations

lendingLoading: boolean  // Loading lending from API

// Return details
returnNotes: string  // Optional return notes

// UI state
returningItem: boolean  // API call in progress
```

### Camera States

```typescript
stream: MediaStream | null
videoDevices: MediaDeviceInfo[]
selectedDeviceId: string
cameraError: string | null
permissionDenied: boolean
torch: boolean
scannerPaused: boolean
```

---

## Validation Rules

### Borrow Mode Validation

| Field | Rule | Error |
|-------|------|-------|
| Item QR | Valid UUID | "Invalid item QR code" |
| Item | Exists in DB | "Item not found" |
| Item Status | available_qty > 0 | "Item is out of stock" |
| Trainee | Selected | "Please select a trainee" |
| Quantity | 1 ≤ qty ≤ available | "Invalid quantity" |
| Due Date | Set | "Please set return date" |
| Due Date | ≥ Today | "Date must be in future" |

### Return Mode Validation

| Field | Rule | Error |
|-------|------|-------|
| Slip QR | Valid UUID | "Invalid lending slip QR" |
| Lending | Exists in DB | "Lending not found" |
| Lending Status | !== 'returned' | "Already returned" |

---

## API Integration Points

### Borrow Workflow API Calls

```typescript
// 1. Load trainees (on mode change to borrow)
traineeService.getTrainees()
  → GET /api/trainees
  → Returns: Trainee[]

// 2. Fetch item details (on QR scan)
inventoryService.getInventoryItemById(itemId)
  → GET /api/items/{itemId}
  → Returns: InventoryItem

// 3. Create lending (on form submit)
lendingService.createLending(data)
  → POST /api/lendings
  → Body: {
      item_id: string,
      trainee_id: string,
      quantity: number,
      expected_return_date: string,
      notes?: string
    }
  → Returns: {
      lending: { id, item_id, trainee_id, ... },
      borrowing_slip: { slip_number, ... }
    }
```

### Return Workflow API Calls

```typescript
// 1. Fetch lending details (on QR scan)
lendingService.getLendingById(lendingId)
  → GET /api/lendings/{lendingId}
  → Returns: Lending (with relations)

// 2. Mark as returned (on confirm)
lendingService.returnItem(lendingId, data)
  → POST /api/lendings/{lendingId}/return
  → Body: {
      notes?: string
    }
  → Returns: Updated Lending
```

---

## Error Handling

### Camera Errors

```
NotAllowedError/PermissionDeniedError
  └─ "Camera permission denied"
  
NotFoundError
  └─ "No camera found on this device"
  
NotReadableError
  └─ "Camera is already in use"
  
Generic error
  └─ "Failed to access camera"
```

### API Errors

```
Item not found (404)
  └─ "Item not found. QR code may be outdated."

Lending not found (404)
  └─ "Lending record not found. Slip may be invalid."

Validation error (400)
  └─ Show server message: "..."

Server error (500)
  └─ "Failed to create/return lending"
```

### Validation Errors

```
Handled before API call:
├─ Missing fields
├─ Invalid quantities
├─ Past due dates
└─ UUID format errors

Show as toast notifications
User can correct and retry
```

---

## Success Flow

### Borrow Success Sequence

```
1. Show success toast: "✓ Item borrowed successfully"
2. Reset all form fields
3. Call onSuccess() → Parent refreshes data
4. Reset scanner cooldown
5. Camera continues, ready for next scan
6. Auto-focus on item frame (QR input area)
```

### Return Success Sequence

```
1. Show success toast: "✓ Item returned successfully"
2. Reset all form fields
3. Call onSuccess() → Parent refreshes data
4. Reset scanner cooldown
5. Camera continues, ready for next scan
6. Auto-focus on item frame (QR input area)
```

---

## Cooldown Mechanism

Purpose: Prevent duplicate scans of same QR code within short time

```
Scan detected
  ↓
Trigger cooldown (2000ms = 2 seconds)
  ├─ Set cooldownRef.current = true
  └─ Start timer
  ↓
During cooldown:
├─ QR codes detected but IGNORED
└─ Scanner continues running
  ↓
Timer expires (2 seconds later)
  └─ Set cooldownRef.current = false
  ↓
Scanner ready for new QR detection
```

Short cooldown after API success (500ms):
- Prevents rapid double-submissions
- Allows user to see success toast
- Re-enables scanner for next operation

---

## Mode Switching

```
User clicks "Borrow" or "Return" tab
       ↓
setMode() triggers
       ↓
Reset all form state:
├─ Clear scanned items/lendings
├─ Clear all form inputs
├─ Reset UI state
└─ Clear error messages
       ↓
Load mode-specific data:
├─ Borrow: Load trainees list
└─ Return: (No prep needed)
       ↓
Camera continues (no restart needed)
   └─ QR detection resets for new mode
       ↓
UI updates to show mode-specific form
```

---

## Manual Entry Fallback

Purpose: If QR scanning fails, staff can manually enter codes

```
Location: Bottom of form panel (always visible)

Trigger: User types or pastes QR data into manual input

Processing:
├─ Get manual input value
├─ Trim whitespace
├─ Validate not empty
└─ Pass to same QR handler as camera scan
       ↓
Same validation & API flow
├─ Can be used to correct failed scans
└─ Can bypass camera issues
```

---

## Permissions & Access Control

```
Required role: 'staff_inventory_manager' (or admin)

On component load:
├─ Check user.role
├─ If NOT authorized:
│  ├─ Show error: "No permission"
│  ├─ Hide scanner
│  └─ Close modal
└─ If authorized:
   └─ Continue normally
```

---

## Performance Optimizations

1. **Lazy Load jsQR**
   - Load library only when modal opens
   - Reduces initial bundle size

2. **Camera Reuse**
   - Camera stream shared between modes
   - No restart when switching borrow/return

3. **Memoization**
   - Trainee list cached in state
   - Reused across multiple borrows

4. **Debounced Device Change**
   - Camera device changes delayed 300ms
   - Prevents rapid device switching

5. **Refs Over State**
   - Use useRef for cooldown tracking
   - Prevents unnecessary re-renders

---

## Summary

**Borrow Flow:**
1. Scan item QR → Lookup item
2. Select trainee → Enter details
3. Submit → Create lending + slip
4. Success → Reset form, ready for next

**Return Flow:**
1. Scan lending slip QR → Lookup lending
2. Enter optional notes
3. Submit → Mark returned, update item
4. Success → Reset form, ready for next

**Both flows feature:**
- Real-time QR detection
- Full validation (client + server)
- Error recovery
- Automatic form reset
- Manual entry fallback
- Cooldown protection
