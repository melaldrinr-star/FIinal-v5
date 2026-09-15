# How Items Are Borrowed - Complete Guide

## Overview

The borrowing process in BMDC is straightforward and automatic. When someone wants to borrow an item, a staff member creates a "lending" record, which automatically:

1. Creates a borrowing slip
2. Reduces the item's available quantity
3. Tracks who borrowed what and when
4. Sets a due date for return

---

## Step-by-Step Process

### Step 1: Check Item Availability

**Before borrowing**, verify the item is available:

```
GET /api/items/{item_id}

Response:
{
  "id": "item-123",
  "name": "Laptop",
  "quantity": 5,              ← Total quantity
  "available_quantity": 3,    ← How many can be borrowed
  "status": "available",      ← Item status
  "minimum_quantity": 1
}
```

**Item Status Meanings:**
- `available` - Can be borrowed
- `low_stock` - Can be borrowed, but limited quantity
- `out_of_stock` - Cannot be borrowed
- `maintenance` - Cannot be borrowed

---

### Step 2: Create a Lending Record

**Who can do this:** Staff with `local_admin` or `staff_inventory_manager` roles

**Endpoint:**
```bash
POST /api/lendings
Content-Type: application/json
Authorization: Bearer <your_token>
```

**Request Body:**
```json
{
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "trainee_id": "trainee-uuid",           // Optional - if trainee is borrowing
  "borrower_name": "Maria Santos",        // Optional - if not a trainee
  "borrower_contact": "09123456789",      // Optional - contact info
  "quantity": 1,                           // Required - how many items
  "expected_return_date": "2026-09-15",   // Required - when to return (ISO format)
  "notes": "Handle with care"             // Optional - special instructions
}
```

**Must provide EITHER:**
- `trainee_id` (if trainee is borrowing), OR
- `borrower_name` (if non-trainee is borrowing)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/lendings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "item_id": "550e8400-e29b-41d4-a716-446655440000",
    "borrower_name": "Maria Santos",
    "borrower_contact": "09123456789",
    "quantity": 1,
    "expected_return_date": "2026-09-15",
    "notes": "Needed for training session"
  }'
```

---

### Step 3: Automatic Processes

When the lending is created, the system automatically:

#### A. Creates Lending Record
```
Lending Record Created:
├─ ID: lending-uuid
├─ Item: Laptop
├─ Borrower: Maria Santos
├─ Quantity: 1
├─ Lent Date: 2026-09-08
├─ Expected Return: 2026-09-15
├─ Status: active
└─ Lent By: admin-user-id
```

#### B. Generates Borrowing Slip
```
Borrowing Slip Auto-Created:
├─ Slip Number: SLIP-20260908-0001
├─ Borrower Name: Maria Santos
├─ Item Name: Laptop
├─ Borrowing Date: 2026-09-08
├─ Due Date: 2026-09-15
├─ Quantity: 1
├─ Contact: 09123456789
├─ Status: active
└─ Generated: 2026-09-08 10:30:00
```

#### C. Updates Item Quantity
```
Item Before:
├─ Total Quantity: 5
└─ Available: 3

Item After:
├─ Total Quantity: 5         ← Unchanged
└─ Available: 2              ← Decreased by 1

Status: low_stock (because available_quantity ≤ minimum_quantity)
```

#### D. Logs Activity
```
Activity Log Created:
├─ Action: create
├─ Entity: lending
├─ User: admin-user-id
├─ Timestamp: 2026-09-08 10:30:00
└─ Details: {item_id, quantity, due_date, ...}
```

---

### Step 4: Borrower Receives Item + Slip

The borrower gets:
1. **The item** (Laptop)
2. **Borrowing slip** with slip number: SLIP-20260908-0001
3. **Due date**: 2026-09-15
4. **Contact info**: Who to contact if issues

The slip can be:
- Printed as a physical receipt
- Displayed digitally
- Referenced when returning

---

## Response After Borrowing

When the lending is created successfully:

```json
{
  "success": true,
  "message": "Lending created successfully",
  "data": {
    "lending": {
      "id": "lending-123",
      "item_id": "item-456",
      "borrower_name": "Maria Santos",
      "quantity": 1,
      "lent_date": "2026-09-08T10:30:00Z",
      "expected_return_date": "2026-09-15",
      "status": "active",
      "lent_by": "user-789",
      "item": {
        "id": "item-456",
        "name": "Laptop",
        "available_quantity": 2    ← Updated!
      }
    },
    "borrowing_slip": {
      "id": "slip-101",
      "slip_number": "SLIP-20260908-0001",
      "borrower_name": "Maria Santos",
      "item_name": "Laptop",
      "borrowing_date": "2026-09-08",
      "due_date": "2026-09-15",
      "status": "active"
    }
  }
}
```

---

## Full Borrowing Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  SOMEONE WANTS TO BORROW AN ITEM                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │ 1. Check Item Availability          │
    │    GET /api/items/:item_id          │
    │                                     │
    │    Is status = available? ──────┐   │
    │    Is available_qty > 0? ───────┤   │
    │                            ┌────┴──┐│
    │                            YES  NO  ││
    │                            │    │   ││
    └────────────────────────────┼────┼───┘│
                                 │    │    │
                        Continue │    │    Fail
                                 ▼    ▼    ▼
    ┌─────────────────────────┐  Item cannot be borrowed!
    │ 2. Prepare Lending Data │
    │                         │
    │ Gather:                 │
    │ • item_id               │
    │ • borrower info         │
    │ • quantity              │
    │ • return date           │
    │ • notes                 │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ 3. Create Lending                   │
    │    POST /api/lendings               │
    │    (Requires admin/manager role)    │
    │                                     │
    │    System validates:                │
    │    ✓ User has permission            │
    │    ✓ Item exists                    │
    │    ✓ Quantity available             │
    │    ✓ Either trainee_id or           │
    │      borrower_name provided         │
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ 4. AUTOMATIC: Create Borrowing Slip │
    │                                     │
    │ ✓ Generate slip number              │
    │ ✓ Copy borrowing details            │
    │ ✓ Set current date                  │
    │ ✓ Set status = active               │
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ 5. AUTOMATIC: Update Item Quantity  │
    │                                     │
    │ ✓ Decrease available_qty            │
    │ ✓ Recalculate status                │
    │   (available/low_stock/out_of_stock)│
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ 6. AUTOMATIC: Log Activity          │
    │                                     │
    │ ✓ Record action in activity log     │
    │ ✓ Timestamp & user tracking         │
    │ ✓ Store details for audit trail     │
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ 7. Return Success Response           │
    │                                     │
    │ ✓ Lending details                  │
    │ ✓ Borrowing slip info              │
    │ ✓ Updated item info                │
    │ ✓ Slip number for reference        │
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ 8. Borrower Receives Item + Slip    │
    │                                     │
    │ ✓ Item handed over                 │
    │ ✓ Slip number: SLIP-20260908-0001  │
    │ ✓ Due date: 2026-09-15             │
    │ ✓ Instructions & notes provided    │
    └─────────────────────────────────────┘
```

---

## Example: Complete Borrowing Scenario

### Scenario: Trainee Maria borrows a Laptop

#### Step 1: Check item availability
```bash
GET /api/items/550e8400-e29b-41d4-a716-446655440000

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Laptop Dell XPS 13",
  "quantity": 5,
  "available_quantity": 3,  ← Can borrow!
  "status": "available",
  "minimum_quantity": 1
}
```

#### Step 2: Get trainee ID for Maria
```bash
GET /api/trainees?search=Maria

Response includes:
{
  "id": "trainee-maria-001",
  "first_name": "Maria",
  "last_name": "Santos",
  "email": "maria@example.com"
}
```

#### Step 3: Create lending
```bash
POST /api/lendings
{
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "trainee_id": "trainee-maria-001",
  "borrower_contact": "09123456789",
  "quantity": 1,
  "expected_return_date": "2026-09-15",
  "notes": "For Week 3 Training"
}
```

#### Step 4: Response
```json
{
  "success": true,
  "data": {
    "lending": {
      "id": "lending-abc123",
      "item_id": "550e8400-e29b-41d4-a716-446655440000",
      "trainee_id": "trainee-maria-001",
      "quantity": 1,
      "lent_date": "2026-09-08T10:30:00Z",
      "expected_return_date": "2026-09-15",
      "status": "active",
      "lent_by": "user-xyz",
      "item": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Laptop Dell XPS 13",
        "available_quantity": 2  ← Now 2 instead of 3!
      }
    },
    "borrowing_slip": {
      "id": "slip-def456",
      "slip_number": "SLIP-20260908-0001",
      "borrower_name": "Maria Santos",
      "item_name": "Laptop Dell XPS 13",
      "borrowing_date": "2026-09-08",
      "due_date": "2026-09-15",
      "quantity": 1,
      "status": "active"
    }
  }
}
```

#### What Happened:
- ✅ Lending record created (ID: lending-abc123)
- ✅ Borrowing slip auto-created (SLIP-20260908-0001)
- ✅ Item available_qty: 3 → 2
- ✅ Item status: available (still has 2 left)
- ✅ Activity logged
- ✅ Maria gets slip number to present when returning

---

## What Can Go Wrong & How to Fix

| Issue | Cause | Solution |
|-------|-------|----------|
| "Item not found" | Wrong item_id | Verify item_id exists |
| "Out of stock" | No available items | Check available_quantity |
| "Insufficient quantity" | Not enough items to borrow | Reduce quantity or wait |
| "Insufficient permissions" | Not admin/manager | Contact admin to create lending |
| "Either trainee_id OR borrower_name required" | Both or neither provided | Provide one of them |
| "Invalid date format" | Wrong date format | Use ISO format (YYYY-MM-DD) |

---

## After Borrowing: Tracking

### View Active Borrowings
```bash
GET /api/lendings?status=active

Response: All active lendings (items not yet returned)
```

### View Specific Borrowing
```bash
GET /api/lendings/:id

Response: Details of that lending
```

### View Borrowing Slip
```bash
GET /api/borrowing-slips/by-number/SLIP-20260908-0001

Response: Slip details with due date and borrower info
```

### Check Overdue Items
```bash
GET /api/lendings/overdue

Response: All lendings past their due date
```

---

## Key Points to Remember

### Before Borrowing
- ✅ Item must have available_quantity > 0
- ✅ Item status should be "available"
- ✅ User creating lending needs admin/manager role
- ✅ Return date must be in the future

### During Borrowing
- ✅ System auto-generates slip
- ✅ Item quantity automatically decreases
- ✅ Everything is logged automatically
- ✅ Borrower gets unique slip number

### After Borrowing
- ✅ Item is now marked as borrowed
- ✅ Can be tracked by slip number
- ✅ Can be tracked by lending ID
- ✅ Can see overdue status

---

## Borrowing Permissions

Only users with these roles can create lendings:

| Role | Can Borrow | Can Return |
|------|-----------|-----------|
| super_admin | ✅ Yes | ✅ Yes |
| local_admin | ✅ Yes | ✅ Yes |
| staff_inventory_manager | ✅ Yes | ✅ Yes |
| staff_training_coordinator | ❌ No | ❌ No |
| trainee | ❌ No | ❌ No |

---

## Related Operations

### Return an Item
```bash
POST /api/lendings/:id/return
{
  "notes": "Item returned in good condition"
}
```

### Mark Item as Lost
```bash
PUT /api/lendings/:id
{
  "status": "lost",
  "notes": "Item not returned - marked as lost"
}
```

### Get Borrowing Statistics
```bash
GET /api/lendings/stats

Response:
{
  "totalRecords": 50,
  "active": 20,
  "returned": 25,
  "overdue": 3,
  "lost": 2,
  "dueToday": 5
}
```

---

## Summary

**To borrow an item:**

1. **Check** if item is available and in stock
2. **Prepare** borrower and item information
3. **Call** `POST /api/lendings` with required details
4. **System automatically**:
   - Creates lending record
   - Generates borrowing slip
   - Updates item quantity
   - Logs the activity
5. **Receive** slip number for tracking
6. **Borrower** gets item + slip

The entire process is designed to be quick, automatic, and tracked for accountability!

---

*For more details on borrowing slips, see: BORROWING_SLIP_QUICK_START.md*
*For API details, see: Backend/migrations/docs/BORROWING_SLIP_FEATURE.md*
