# Complete Borrowing Guide - Everything You Need to Know

This guide answers the question: **"How does an item get borrowed?"**

---

## Quick Answer (30 seconds)

An item is borrowed by:

1. **Staff member creates a lending** → POST /api/lendings with item details
2. **System automatically** → Creates a borrowing slip (SLIP-20260908-0001)
3. **Item quantity decreases** → From 3 available to 2 available
4. **Borrower gets the item + slip** → With return date (e.g., 2026-09-15)
5. **Tracked automatically** → Until returned or marked overdue

---

## Full Process Overview

### Phase 1: Before Borrowing

```
┌─ Inventory System ─────────────────────────────────┐
│                                                    │
│ Item: Laptop Dell XPS                             │
│ ├─ Total Quantity: 5                             │
│ ├─ Available: 3          ← Can be borrowed      │
│ ├─ Borrowed: 2           ← Already out          │
│ ├─ Status: available     ← Available for borrow │
│ └─ Minimum: 1            ← Can't go below this  │
│                                                    │
│ Everything is normal. Item is ready to borrow.  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Phase 2: Creating the Borrowing

```
┌─ Form Submission ───────────────────────────────┐
│                                                  │
│ Staff fills out:                                │
│ • Which item? → Laptop Dell XPS                │
│ • Who's borrowing? → Maria Santos (Trainee)   │
│ • How many? → 1 unit                          │
│ • When to return? → 2026-09-15                │
│ • Contact? → 09123456789                      │
│ • Special notes? → Handle with care           │
│                                                  │
│ Submits form...                                 │
│                                                  │
└────────────────────────────────────────────────┘
```

### Phase 3: Automatic Processing

```
┌─ Backend Processing ──────────────────────────┐
│                                                │
│ ✓ Step 1: Validate Request                  │
│   └─ Is user authorized? (staff role)        │
│   └─ Does item exist?                        │
│   └─ Is quantity available?                  │
│   └─ Is return date valid?                   │
│                                               │
│ ✓ Step 2: Create Lending Record             │
│   ├─ ID: lending-123                        │
│   ├─ Item: Laptop                           │
│   ├─ Borrower: Maria                        │
│   ├─ Qty: 1                                 │
│   ├─ Lent Date: 2026-09-08                  │
│   ├─ Return Date: 2026-09-15                │
│   └─ Status: active                         │
│                                               │
│ ✓ Step 3: Generate Borrowing Slip           │
│   ├─ Slip #: SLIP-20260908-0001             │
│   ├─ Borrower: Maria Santos                 │
│   ├─ Item: Laptop Dell XPS                  │
│   ├─ Borrowed: 2026-09-08                   │
│   ├─ Due: 2026-09-15                        │
│   └─ Status: active                         │
│                                               │
│ ✓ Step 4: Update Item Quantity              │
│   ├─ Before: available = 3                  │
│   ├─ After: available = 2                   │
│   └─ Status: still 'available' (2 > 0)      │
│                                               │
│ ✓ Step 5: Log Activity                      │
│   └─ Who: Staff admin                       │
│   └─ What: Create lending                   │
│   └─ When: 2026-09-08 10:30 AM              │
│   └─ Item: Laptop (1 unit)                  │
│                                               │
│ ✓ All SUCCESS! Response sent to UI          │
│                                               │
└────────────────────────────────────────────┘
```

### Phase 4: Borrowing Confirmation

```
┌─ Screen Shows ────────────────────────────────┐
│                                                │
│  ✅ BORROWING SUCCESSFUL!                     │
│                                                │
│  📋 BORROWING SLIP                            │
│  SLIP-20260908-0001                          │
│                                                │
│  👤 Maria Santos                             │
│  📦 Laptop Dell XPS (Qty: 1)                 │
│  📅 Borrowed: 2026-09-08                     │
│  📅 Due: 2026-09-15                          │
│  ☎️  Contact: 09123456789                    │
│  📝 Notes: Handle with care                  │
│  ✓ Status: ACTIVE                           │
│                                                │
│ [🖨️ Print Slip] [📋 View Details] [✓ Done]   │
│                                                │
└────────────────────────────────────────────┘
```

### Phase 5: After Borrowing

```
┌─ Item Status Now ────────────────────────────┐
│                                                │
│ Item: Laptop Dell XPS                        │
│ ├─ Total Quantity: 5         ← Unchanged    │
│ ├─ Available: 2              ← Decreased!   │
│ ├─ Borrowed: 3               ← Increased!   │
│ ├─ Status: low_stock         ← Updated!     │
│ └─ Next Available in: 7 days  ← Until return │
│                                                │
│ Borrower has:                                 │
│ • The item (Laptop)                         │
│ • The slip (SLIP-20260908-0001)             │
│ • The due date (2026-09-15)                 │
│                                                │
└────────────────────────────────────────────┘
```

---

## Detailed Step-by-Step

### Step 1: Staff Accesses Inventory System

```
URL: /inventory-management or /admin/lending

What they see:
- List of all items
- How many are available
- Option to create borrowing
```

### Step 2: Click "Create Borrowing" or "Borrow"

```
Opens a form with fields:
┌───────────────────────────────────────────┐
│ 1. Select Item                            │
│    [Laptop Dell XPS          ▼]           │
│    Available: 3 units                     │
│                                            │
│ 2. Borrower Type                         │
│    ◉ Trainee  ○ Non-Trainee              │
│                                            │
│ 3. Select Borrower                       │
│    [Search: Maria Santos   ▼]             │
│    (Shows matching trainees)              │
│                                            │
│ 4. Quantity                              │
│    [1] (max: 3 available)                │
│                                            │
│ 5. Return Date                           │
│    [2026-09-15]                          │
│    (Can't be today or past)              │
│                                            │
│ 6. Contact Info (Optional)               │
│    [09123456789]                         │
│                                            │
│ 7. Notes (Optional)                      │
│    [Handle with care]                    │
│                                            │
│         [BORROW NOW]                     │
└───────────────────────────────────────────┘
```

### Step 3: Form Validation

System checks:
- ✓ Item exists
- ✓ Item has available quantity
- ✓ Borrower selected (trainee OR name)
- ✓ Quantity is valid (1 to available)
- ✓ Return date is in future

If any fail → Error message shown, try again

### Step 4: Submit to Backend

```
POST /api/lendings
Content-Type: application/json

{
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "trainee_id": "trainee-maria-001",
  "quantity": 1,
  "expected_return_date": "2026-09-15",
  "borrower_contact": "09123456789",
  "notes": "Handle with care"
}
```

### Step 5: Backend Creates Everything

```
Backend does:

1. Verify user is staff (admin/manager role)
2. Get item details
   └─ Name: "Laptop Dell XPS"
   └─ Description: "High-performance laptop..."
   └─ Available: 3
   
3. Check availability
   └─ Is 3 >= 1? YES ✓
   
4. Create lending record
   ├─ id: "lending-abc123"
   ├─ item_id: "550e8400..."
   ├─ trainee_id: "trainee-maria-001"
   ├─ quantity: 1
   ├─ lent_date: "2026-09-08T10:30:00Z"
   ├─ expected_return_date: "2026-09-15"
   ├─ status: "active"
   ├─ lent_by: "staff-user-id"
   └─ created_at: "2026-09-08T10:30:00Z"
   
5. Generate borrowing slip
   ├─ id: "slip-def456"
   ├─ slip_number: "SLIP-20260908-0001"
   ├─ lending_id: "lending-abc123"
   ├─ borrower_name: "Maria Santos"
   ├─ item_name: "Laptop Dell XPS"
   ├─ borrowing_date: "2026-09-08"
   ├─ due_date: "2026-09-15"
   ├─ quantity: 1
   ├─ status: "active"
   └─ generated_at: "2026-09-08T10:30:00Z"
   
6. Update item availability
   ├─ Before: available_quantity = 3
   ├─ After: available_quantity = 2
   ├─ Recalculate status:
   │  └─ If available > minimum: "available"
   │  └─ If available <= minimum: "low_stock"
   │  └─ If available = 0: "out_of_stock"
   └─ Result: "available" (because 2 > 1)
   
7. Log activity
   └─ User: staff-user-id
   └─ Action: create
   └─ Entity: lending
   └─ Details: {all lending info}
   └─ Timestamp: 2026-09-08 10:30 AM
   
8. Send success response
```

### Step 6: Show Confirmation to Staff

```
Response:
{
  "success": true,
  "message": "Lending created successfully",
  "data": {
    "lending": {
      "id": "lending-abc123",
      "item_id": "550e8400...",
      "quantity": 1,
      "lent_date": "2026-09-08T10:30:00Z",
      "expected_return_date": "2026-09-15",
      "status": "active"
    },
    "borrowing_slip": {
      "id": "slip-def456",
      "slip_number": "SLIP-20260908-0001",
      "borrower_name": "Maria Santos",
      "item_name": "Laptop Dell XPS",
      "borrowing_date": "2026-09-08",
      "due_date": "2026-09-15",
      "status": "active"
    }
  }
}

UI displays:
✅ SUCCESS
Slip: SLIP-20260908-0001
Borrower: Maria Santos
Item: Laptop Dell XPS
Due: 2026-09-15

[Print] [Details] [Done]
```

### Step 7: Borrower Receives Item + Slip

```
Borrower gets:
1. Physical item (or access to it)
   └─ Laptop Dell XPS with charger
   
2. Borrowing slip (printed or digital)
   ├─ Slip number: SLIP-20260908-0001
   ├─ Borrower: Maria Santos
   ├─ Item: Laptop Dell XPS
   ├─ Borrowed: 2026-09-08
   ├─ Due: 2026-09-15
   └─ Contact info for support
   
3. Expectations
   ├─ Return by 2026-09-15
   ├─ In good condition
   └─ With all accessories
```

---

## What Changes After Borrowing

### Item Record

```
BEFORE:
{
  "id": "item-456",
  "name": "Laptop Dell XPS",
  "quantity": 5,
  "available_quantity": 3,
  "status": "available"
}

AFTER:
{
  "id": "item-456",
  "name": "Laptop Dell XPS",
  "quantity": 5,              ← Same
  "available_quantity": 2,    ← Decreased!
  "status": "available"       ← Still available
}
```

### Inventory Tracking

```
Item: Laptop Dell XPS

Quantity Breakdown:
├─ Total (never changes): 5
├─ In Stock: 2
├─ Borrowed: 3 (was 2)
│  ├─ Maria Santos (1) - Due 2026-09-15
│  ├─ John Doe (1) - Due 2026-09-12
│  └─ Jane Smith (1) - Due 2026-09-18
└─ Available to Borrow: 2

Historical Record:
├─ Lent to: Maria Santos
│  ├─ Date: 2026-09-08
│  ├─ Due: 2026-09-15
│  ├─ Slip: SLIP-20260908-0001
│  └─ Status: active
├─ Lent to: John Doe
│  ├─ Date: 2026-09-07
│  ├─ Due: 2026-09-12
│  ├─ Slip: SLIP-20260907-0001
│  └─ Status: active
└─ Lent to: Jane Smith
   ├─ Date: 2026-09-06
   ├─ Due: 2026-09-18
   ├─ Slip: SLIP-20260906-0001
   └─ Status: active
```

---

## Different Borrowing Scenarios

### Scenario 1: Trainee Borrowing

```
1. Staff selects: ◉ Trainee
2. Searches for trainee: Maria Santos
3. System fills in borrower_name automatically
4. Creates lending with trainee_id

Result:
- Lending linked to trainee
- Borrower name: Maria Santos
- Can track all borrowings by this trainee
```

### Scenario 2: Non-Trainee Borrowing

```
1. Staff selects: ○ Non-Trainee
2. Enters name: "Guest Trainer"
3. Enters contact: "09987654321"
4. Creates lending with borrower_name

Result:
- Lending linked to borrower_name
- No trainee_id
- External person borrowing tracked
```

### Scenario 3: Multiple Items

```
Different approach for multiple same items:

Staff could:
Option A: Create 1 lending with quantity: 3
- Result: 1 lending record, 1 slip
- Items tracked together

Option B: Create 3 separate lendings with quantity: 1 each
- Result: 3 lending records, 3 slips
- Each tracked individually
```

### Scenario 4: Item Unavailable

```
If item has 0 available:
1. Staff tries to create lending
2. System checks: available_qty >= quantity?
3. 0 >= 1? NO
4. Error: "Out of stock - cannot borrow"
5. Lending not created
6. Item unchanged
```

---

## Tracking After Borrowing

### Staff View

```
GET /api/lendings?status=active

Shows all currently borrowed items:
- Maria Santos: Laptop (Due 2026-09-15) - 7 days left
- John Doe: Camera (Due 2026-09-12) - 4 days left
- Jane Smith: Projector (Due 2026-09-18) - 10 days left
```

### Borrower View

```
GET /api/lendings?trainee_id=maria-id

Shows Maria's borrowings:
- Laptop (Due 2026-09-15)
- Book (Returned 2026-09-08)
- Camera (Due 2026-09-18)
```

### Overdue Detection

```
GET /api/lendings/overdue

Shows items past due:
- Projector (John Doe) - Due 2026-09-08, 3 DAYS OVERDUE
- Book (Jane Smith) - Due 2026-09-07, 1 DAY OVERDUE
```

---

## Borrowing Permissions

| User Role | Can Borrow |
|-----------|-----------|
| super_admin | ✅ Yes |
| local_admin | ✅ Yes |
| staff_inventory_manager | ✅ Yes |
| staff_training_coordinator | ❌ No |
| trainee | ❌ No |

---

## Rules & Constraints

### What Must Happen

1. ✅ User must have staff role
2. ✅ Item must exist
3. ✅ Item must have available quantity > 0
4. ✅ Quantity must be valid (1 to available)
5. ✅ Return date must be in future
6. ✅ Either trainee_id OR borrower_name required

### What Automatically Happens

1. ✅ Borrowing slip generated
2. ✅ Item quantity decreased
3. ✅ Item status recalculated
4. ✅ Activity logged
5. ✅ Lending marked as active

### What Happens After Return

1. ✅ Borrowing slip marked as returned
2. ✅ Item quantity increased
3. ✅ Item status recalculated
4. ✅ Lending marked as returned
5. ✅ Return activity logged

---

## Common Questions

**Q: Can I borrow more items than available?**
A: No. System won't allow it. Error: "Insufficient quantity"

**Q: Can return date be today?**
A: No. Must be future date. Error: "Return date must be in future"

**Q: What if I need to extend return date?**
A: Possible options:
- Return item early and borrow again with new date
- Or modify lending (if system supports it)

**Q: What if item is lost?**
A: Mark lending status as "lost" and note it in records

**Q: Can I see who borrowed what?**
A: Yes! Staff can query by trainee, item, date, status, etc.

**Q: What if same item borrowed by multiple people?**
A: Each gets their own lending record and slip number

**Q: Can item be borrowed multiple times?**
A: Yes! Each time is a separate lending record

**Q: What happens to inventory count?**
A: Total stays same, available decreases, borrowed increases

---

## API Reference

### Create Borrowing

```bash
POST /api/lendings
Authorization: Bearer <token>

{
  "item_id": "uuid",
  "trainee_id": "uuid" OR "borrower_name": "string",
  "quantity": 1-n,
  "expected_return_date": "YYYY-MM-DD",
  "borrower_contact": "optional",
  "notes": "optional"
}
```

### Get All Borrowings

```bash
GET /api/lendings
GET /api/lendings?status=active
GET /api/lendings?trainee_id=uuid
GET /api/lendings?start_date=DATE&end_date=DATE
```

### Get Borrowing Slip

```bash
GET /api/borrowing-slips/by-number/SLIP-20260908-0001
GET /api/borrowing-slips/:slip_id
```

### Return Item

```bash
POST /api/lendings/:id/return
{
  "notes": "Item returned in good condition"
}
```

---

## Summary

**How an item gets borrowed:**

1. **Identify** - Find item with available quantity
2. **Prepare** - Gather borrower and lending info
3. **Submit** - Create lending via API
4. **Validate** - System checks all rules
5. **Create** - Lending record created
6. **Generate** - Slip auto-created with slip number
7. **Update** - Item quantity decreased
8. **Log** - Activity recorded
9. **Confirm** - Staff sees success
10. **Transfer** - Borrower gets item + slip
11. **Track** - Until returned or overdue
12. **Return** - Item returned and marked returned
13. **Restore** - Item quantity increased

All automatic, tracked, and auditable! ✅

---

*See also:*
- **HOW_TO_BORROW_ITEMS.md** - Detailed borrowing process
- **BORROWING_UI_FLOW.md** - Frontend interface
- **BORROWING_SLIP_QUICK_START.md** - Slip feature overview
