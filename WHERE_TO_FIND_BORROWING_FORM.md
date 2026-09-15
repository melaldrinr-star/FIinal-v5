# Where to Find the Borrowing Form (Phase 2)

## Answer: The AddLendingModal Component

The form you see in **Phase 2: Creating the Borrowing** is found in:

### 📁 File Location

```
Frontend/src/components/AddLendingModal.tsx
```

### 🔗 Where It's Used

The modal is used in:

```
Frontend/src/pages/LendingsPage.tsx
```

---

## How to Access It (User View)

### Navigation Path

```
1. Go to: Lendings Management page
   └─ URL: /lendings
   
2. Click: "New Lending" button
   └─ Location: Top right corner of the page
   
3. Opens: AddLendingModal
   └─ The form appears as a dialog/modal popup
```

### Visual Location in UI

```
┌─────────────────────────────────────────────────┐
│ LENDINGS PAGE                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ Left Side:                                      │
│ • Title: "Lendings"                            │
│ • Stats cards                                  │
│ • Tabs (Borrowed, Returned, Overdue)           │
│ • Lending records                              │
│                                                 │
│ Top Right:                                      │
│ ┌──────────────────────────────┐              │
│ │ [Download PDF] [+ New Lending] ← Click Here!│
│ └──────────────────────────────┘              │
│                                                 │
│ When clicked:                                   │
│ ↓                                               │
│ ┌────────────────────────────────┐            │
│ │   NEW LENDING MODAL             │            │
│ │ ┌────────────────────────────┐ │            │
│ │ │ Borrower Type              │ │            │
│ │ │ [Trainee] [External]       │ │            │
│ │ ├────────────────────────────┤ │            │
│ │ │ Item: [Select Item ▼]      │ │            │
│ │ ├────────────────────────────┤ │            │
│ │ │ Quantity: [1]              │ │            │
│ │ ├────────────────────────────┤ │            │
│ │ │ Return Date: [2026-09-15]  │ │            │
│ │ ├────────────────────────────┤ │            │
│ │ │ Notes: [Optional]          │ │            │
│ │ ├────────────────────────────┤ │            │
│ │ │ [Cancel] [Create Lending]  │ │            │
│ │ └────────────────────────────┘ │            │
│ └────────────────────────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## The Form Structure (Code)

Here's the exact form from the AddLendingModal component:

### Form Fields

```typescript
{/* Borrower type toggle */}
<Button variant={borrowerType === 'trainee' ? 'default' : 'outline'}>
  Trainee
</Button>
<Button variant={borrowerType === 'external' ? 'default' : 'outline'}>
  External
</Button>

{/* If Trainee selected */}
<Select value={traineeId} onValueChange={setTraineeId}>
  <SelectTrigger>
    <SelectValue placeholder="Select trainee" />
  </SelectTrigger>
  <SelectContent>
    {/* List of trainees */}
  </SelectContent>
</Select>

{/* If External selected */}
<Input
  id="borrowerName"
  placeholder="Full name"
  value={borrowerName}
  onChange={(e) => setBorrowerName(e.target.value)}
/>
<Input
  id="borrowerContact"
  placeholder="Phone or email"
  value={borrowerContact}
  onChange={(e) => setBorrowerContact(e.target.value)}
/>

{/* Item selector */}
<Select value={itemId} onValueChange={setItemId}>
  <SelectTrigger>
    <SelectValue placeholder="Select item" />
  </SelectTrigger>
  <SelectContent>
    {/* List of available items */}
  </SelectContent>
</Select>

{/* Quantity */}
<Input
  id="quantity"
  type="number"
  min={1}
  max={maxQuantity}
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
/>

{/* Expected return date */}
<Input
  id="returnDate"
  type="date"
  min={today}
  value={expectedReturnDate}
  onChange={(e) => setExpectedReturnDate(e.target.value)}
/>

{/* Notes */}
<Textarea
  id="notes"
  placeholder="Purpose, condition notes, etc."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={2}
/>
```

---

## Component Details

### File: `Frontend/src/components/AddLendingModal.tsx`

**Component Name:** `AddLendingModal`

**Props:**
```typescript
interface AddLendingModalProps {
  open: boolean;                    // Is modal visible?
  onOpenChange: (open: boolean) => void;  // Toggle visibility
  onSuccess?: () => void;           // Callback after success
}
```

**States Tracked:**
```typescript
borrowerType: 'trainee' | 'external'  // Who's borrowing?
traineeId: string                     // If trainee
borrowerName: string                  // If external
borrowerContact: string               // Optional contact
itemId: string                        // Which item?
quantity: string                      // How many?
expectedReturnDate: string            // When to return?
notes: string                         // Optional notes
```

**Actions:**
- On Submit: Calls `lendingService.createLending()`
- On Success: Closes modal and calls `onSuccess()` callback
- On Error: Shows toast error message

---

## Form Validation

The form validates:

```
✓ Item selected?
  └─ Must select an item

✓ Quantity valid?
  └─ Must be >= 1
  └─ Cannot exceed available_quantity

✓ Return date valid?
  └─ Must be provided
  └─ Cannot be in past
  └─ Must be >= today

✓ Borrower info valid?
  └─ If trainee: must select trainee
  └─ If external: must enter name

All validation happens before POST to backend.
```

---

## The Form Data Sent to Backend

When the form is submitted, it sends:

```json
{
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "trainee_id": "trainee-uuid" OR null,
  "borrower_name": "Maria Santos" OR null,
  "borrower_contact": "09123456789" OR null,
  "quantity": 1,
  "expected_return_date": "2026-09-15",
  "notes": "Handle with care" OR null
}
```

**To Endpoint:** `POST /api/lendings`

---

## How to Use It Programmatically

### In React Code

```typescript
// In a parent component
const [lendingModalOpen, setLendingModalOpen] = useState(false);

const handleSuccess = () => {
  // Refresh lendings list
  fetchLendings();
};

<AddLendingModal
  open={lendingModalOpen}
  onOpenChange={setLendingModalOpen}
  onSuccess={handleSuccess}
/>

// Open the modal
<Button onClick={() => setLendingModalOpen(true)}>
  New Lending
</Button>
```

---

## Where It's Currently Used

### In LendingsPage

```typescript
// File: Frontend/src/pages/LendingsPage.tsx

// 1. State for modal
const [lendingModalOpen, setLendingModalOpen] = useState(false);

// 2. Render the modal
<AddLendingModal
  open={lendingModalOpen}
  onOpenChange={setLendingModalOpen}
  onSuccess={fetchLendings}
/>

// 3. Button to open it
<Button
  size="sm"
  className="flex-1 sm:flex-none"
  onClick={() => setLendingModalOpen(true)}
>
  <PackagePlus className="mr-1 sm:mr-2 size-4" />
  <span className="hidden xs:inline">New Lending</span>
  <span className="inline xs:hidden">Add</span>
</Button>
```

---

## Complete User Flow

```
User navigates to /lendings
       ↓
LendingsPage loads
       ↓
Shows "New Lending" button
       ↓
User clicks "New Lending"
       ↓
AddLendingModal opens (appears as popup)
       ↓
Modal displays form with:
├─ Borrower Type selector
├─ Item selector (loads available items)
├─ Trainee/Name selector (based on type)
├─ Quantity input
├─ Return date picker
├─ Optional notes
└─ Submit button
       ↓
User fills out form
       ↓
User clicks "Create Lending"
       ↓
Form validates all fields
       ↓
If valid: Submits to POST /api/lendings
If invalid: Shows error toast
       ↓
Success:
├─ Modal closes
├─ Toast shows "Lending record created"
├─ onSuccess() callback triggers
└─ LendingsPage refreshes data
       ↓
Lending appears in "Borrowed" tab
Borrowing slip auto-created
Item quantity updated
```

---

## File References

### Main Component
- **File:** `Frontend/src/components/AddLendingModal.tsx`
- **Lines:** 1-302 (full file)
- **Key function:** `handleSubmit()` (line 102-145)

### Parent Component
- **File:** `Frontend/src/pages/LendingsPage.tsx`
- **Uses modal:** Line 31-35
- **Opens modal:** Line 305-312
- **Renders modal:** Line 179-184

### Services Called
- **lendingService.createLending()** - Create lending
- **inventoryService.getInventoryItems()** - Load items
- **traineeService.getTrainees()** - Load trainees

---

## Related Components

### UI Components Used

```
Dialog (from ui/dialog)
├─ DialogContent
├─ DialogHeader
├─ DialogTitle
└─ DialogDescription

Form Elements:
├─ Button
├─ Input
├─ Label
├─ Textarea
├─ Select
│  ├─ SelectTrigger
│  ├─ SelectValue
│  └─ SelectContent
├─ SelectItem
└─ Skeleton (for loading state)

Icons:
├─ PackagePlus
├─ User
└─ UserX

Notifications:
└─ toast (from sonner)
```

---

## Summary

**Where to find Phase 2 form:**

```
URL:      /lendings
Button:   "New Lending" (top right)
Component: Frontend/src/components/AddLendingModal.tsx
Used in:  Frontend/src/pages/LendingsPage.tsx
```

**The form collects:**
- Who's borrowing (Trainee or External)
- What item
- How many
- When to return
- Optional notes and contact

**The form submits to:**
- Backend: `POST /api/lendings`
- Which creates: Lending record + Borrowing slip (auto)
- And updates: Item quantity

That's exactly where Phase 2 happens in the actual application! 🎯
