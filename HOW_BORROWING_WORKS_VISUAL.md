# How Items Are Borrowed - Visual Summary

## The Borrowing Process at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE BORROWING                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Item: Laptop Dell XPS                                      │
│  ├─ Total Quantity: 5                                       │
│  ├─ Available: 3  ← Can be borrowed                        │
│  ├─ Borrowed: 2   ← Already out                            │
│  └─ Status: ✓ AVAILABLE                                    │
│                                                               │
│  No borrowing activity yet. Item ready to be borrowed.     │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                             ↓
                    (Click "Borrow Item")
                             ↓

┌─────────────────────────────────────────────────────────────┐
│              STAFF FILLS OUT FORM                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  What? → Laptop Dell XPS                                   │
│  Who?  → Maria Santos (Trainee)                            │
│  How many? → 1                                             │
│  When back? → 2026-09-15 (7 days)                          │
│  Contact → 09123456789                                     │
│  Notes → Handle with care                                  │
│                                                               │
│                    [BORROW NOW]                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                             ↓
                   (Submit to Backend)
                             ↓

┌─────────────────────────────────────────────────────────────┐
│         SYSTEM PROCESSES AUTOMATICALLY                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✓ 1. Validates information                                │
│      └─ User authorized? Item exists? Qty available?       │
│                                                               │
│  ✓ 2. Creates Lending Record                              │
│      ├─ ID: lending-abc123                                │
│      ├─ Item: Laptop                                       │
│      ├─ Borrower: Maria                                    │
│      ├─ Qty: 1                                             │
│      ├─ Lent: 2026-09-08                                  │
│      ├─ Due: 2026-09-15                                   │
│      └─ Status: ACTIVE                                    │
│                                                               │
│  ✓ 3. Generates Borrowing Slip                            │
│      ├─ Number: SLIP-20260908-0001 ← Auto-generated!     │
│      ├─ Borrower: Maria Santos                            │
│      ├─ Item: Laptop Dell XPS                             │
│      ├─ Borrowed: Today                                   │
│      ├─ Due: 2026-09-15                                   │
│      └─ Status: ACTIVE                                    │
│                                                               │
│  ✓ 4. Updates Item Quantity                               │
│      ├─ Before: available = 3                             │
│      ├─ After: available = 2 ← Decreased!                │
│      └─ Status: still AVAILABLE (2 > 0)                  │
│                                                               │
│  ✓ 5. Logs Activity                                        │
│      └─ Who, What, When, Item details all recorded        │
│                                                               │
│  ✓ SUCCESS! All done.                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                             ↓
                   (Success Response)
                             ↓

┌─────────────────────────────────────────────────────────────┐
│            BORROWING IS CONFIRMED                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ BORROWING SUCCESSFUL!                                   │
│                                                               │
│  Slip Number: SLIP-20260908-0001                           │
│  Borrower: Maria Santos                                    │
│  Item: Laptop Dell XPS                                    │
│  Borrowed: Today                                           │
│  Due: 2026-09-15 (7 days)                                 │
│  Contact: 09123456789                                     │
│                                                               │
│  [Print] [View Details] [Done]                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                             ↓
                  (Staff hands over item)
                             ↓

┌─────────────────────────────────────────────────────────────┐
│           BORROWER RECEIVES ITEM + SLIP                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Maria gets:                                                │
│  1. The item → Laptop Dell XPS                            │
│  2. The slip → SLIP-20260908-0001                         │
│  3. The date → Due back by 2026-09-15                     │
│  4. Instructions → Handle with care                        │
│                                                               │
│  Maria now has 7 days to use the laptop and return it.   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                             ↓
                       (7 days pass)
                             ↓

┌─────────────────────────────────────────────────────────────┐
│              AFTER BORROWING - RETURN                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Maria brings item back                                    │
│         ↓                                                   │
│  Staff scans slip: SLIP-20260908-0001                      │
│         ↓                                                   │
│  POST /api/lendings/lending-abc123/return                 │
│         ↓                                                   │
│  ✓ Slip marked as RETURNED                               │
│  ✓ Item qty increased: 2 → 3                             │
│  ✓ Lending marked as RETURNED                            │
│  ✓ Return activity logged                                │
│         ↓                                                  │
│  ✅ Item back in inventory!                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                             ↓

┌─────────────────────────────────────────────────────────────┐
│                 AFTER RETURN - STATE                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Item: Laptop Dell XPS                                     │
│  ├─ Total Quantity: 5 (unchanged)                         │
│  ├─ Available: 3 ← Back to normal!                        │
│  ├─ Borrowed: 2 (was 3)                                   │
│  └─ Status: ✓ AVAILABLE                                   │
│                                                               │
│  Borrowing History Recorded:                               │
│  ├─ Maria Santos: 2026-09-08 to 2026-09-15 ✓ RETURNED   │
│  ├─ John Doe: 2026-09-07 to 2026-09-12 ✓ RETURNED        │
│  └─ Jane Smith: 2026-09-06 to 2026-09-18 🟢 ACTIVE      │
│                                                               │
│  Item ready for next borrowing!                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Changes During Process

### Quantity Tracking

```
Timeline:

Before:     Total: 5 │ Available: 3 │ Borrowed: 2
           ────────┼─────────────┼──────────
           100%    │ 60%         │ 40%

During:    Borrowing...

After:     Total: 5 │ Available: 2 │ Borrowed: 3
           ────────┼─────────────┼──────────
           100%    │ 40%         │ 60%

Return:    Returning...

Final:     Total: 5 │ Available: 3 │ Borrowed: 2
           ────────┼─────────────┼──────────
           100%    │ 60%         │ 40%
```

---

## What Gets Created

```
When item is borrowed, system creates:

1. Lending Record
   └─ Tracks the borrow event
   
2. Borrowing Slip
   ├─ SLIP-20260908-0001 (auto-generated)
   ├─ For borrower to hold as receipt
   └─ For returning the item
   
3. Activity Log Entry
   └─ Who did what and when

4. Status Changes
   ├─ Item qty updated
   ├─ Item status recalculated
   └─ Slip status set to "active"
```

---

## Status Tracking

```
Item Status Flow:

available ──→ borrowed ──→ returned ✓
              (qty 3→2)   (qty 2→3)

If not returned by due date:

active ──→ overdue ──→ returned ✓
(past due) (action needed)
```

---

## Who Can Do What

```
BORROWING CREATION:
┌─ super_admin       ✅ Can borrow
├─ local_admin       ✅ Can borrow
├─ staff_inv_manager ✅ Can borrow
├─ trainer           ❌ Cannot borrow
└─ trainee           ❌ Cannot borrow

ITEM RETURN:
┌─ super_admin       ✅ Can return
├─ local_admin       ✅ Can return
├─ staff_inv_manager ✅ Can return
├─ trainer           ❌ Cannot return
└─ trainee           ❌ Cannot return (but can view their own)

VIEWING:
┌─ super_admin       ✅ See all
├─ local_admin       ✅ See all (tenant)
├─ staff_inv_manager ✅ See all (tenant)
├─ trainer           ✅ See all (tenant)
└─ trainee           ✅ See only their own
```

---

## Example Numbers

```
Scenario: Staff borrowing desk for 5 trainees

Item: Desk (Furniture)
├─ Total: 10 desks
├─ Available at start: 10
├─ Can borrow: up to 10

Day 1: Trainee A borrows 1
├─ Available: 9
├─ Slip: SLIP-20260901-0001

Day 1: Trainee B borrows 1
├─ Available: 8
├─ Slip: SLIP-20260901-0002

Day 2: Trainee C borrows 2
├─ Available: 6
├─ Slip: SLIP-20260902-0001

Day 3: Trainee A returns 1
├─ Available: 7
├─ Slip: SLIP-20260901-0001 marked RETURNED

... and so on
```

---

## Timeline Example

```
MARIA'S BORROWING TIMELINE

2026-09-07 08:00 AM
└─ Staff creates borrowing
   ├─ Item: Laptop
   ├─ Qty: 1
   ├─ Due: 2026-09-14
   └─ Slip: SLIP-20260907-0001
      Status: ACTIVE

2026-09-07 08:05 AM
└─ Maria receives item
   ├─ Takes laptop
   ├─ Receives slip
   └─ Has 7 days to return

2026-09-09 (Day 2)
└─ Maria using laptop
   └─ 5 days remaining

2026-09-12 (Day 5)
└─ Maria still has laptop
   └─ 2 days remaining
   └─ UI shows: Due Soon ⚠️

2026-09-14 (Day 7)
└─ Due date today
   └─ Must return today
   └─ UI shows: Due Today ⏰

2026-09-14 03:00 PM
└─ Maria returns laptop
   ├─ Item returned
   ├─ Slip scanned/referenced
   ├─ Status: RETURNED
   └─ Activity logged

2026-09-14 03:05 PM
└─ Item back in inventory
   └─ Available qty increased
   └─ Ready for next borrow
```

---

## Multiple Borrowing Example

```
SAME ITEM BORROWED BY DIFFERENT PEOPLE:

Item: Projector
├─ Maria: 2026-09-08 to 2026-09-15
│  └─ Slip: SLIP-20260908-0005
│     Status: ACTIVE
│
├─ John: 2026-09-07 to 2026-09-12
│  └─ Slip: SLIP-20260907-0003
│     Status: ACTIVE
│
├─ Jane: 2026-09-06 to 2026-09-18
│  └─ Slip: SLIP-20260906-0001
│     Status: ACTIVE
│
└─ All tracked separately with their own slips and due dates
```

---

## What Information Is Tracked

```
FOR EACH BORROWING:

Borrower Info:
├─ Name: Maria Santos
├─ Type: Trainee
├─ ID: trainee-uuid
└─ Contact: 09123456789

Item Info:
├─ Name: Laptop Dell XPS
├─ ID: item-uuid
├─ Qty borrowed: 1
└─ Description: High-performance laptop

Borrowing Timeline:
├─ Lent date: 2026-09-08
├─ Expected return: 2026-09-15
├─ Actual return: (blank until returned)
└─ Days allowed: 7

Tracking:
├─ Lending ID: lending-uuid
├─ Slip number: SLIP-20260908-0001
├─ Status: active/returned/overdue
├─ Lent by: staff-user-id
└─ All logged in activity log

Everything is auditable!
```

---

## Error Prevention

```
System prevents:

❌ Borrowing unavailable items
   └─ "Item out of stock"

❌ Borrowing more than available
   └─ "Only 2 available, you requested 3"

❌ Borrowing without permission
   └─ "Need staff role to borrow"

❌ Setting past return date
   └─ "Return date must be in future"

❌ Not providing borrower info
   └─ "Need trainee ID or borrower name"

✅ System auto-handles:
   └─ Slip generation
   └─ Quantity updates
   └─ Status calculations
   └─ Activity logging
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│  QUICK BORROWING REFERENCE              │
├─────────────────────────────────────────┤
│                                         │
│ BEFORE:                                 │
│ • Check item available qty              │
│ • Gather borrower & return date info    │
│                                         │
│ DURING:                                 │
│ • Submit borrowing request              │
│ • System validates                      │
│ • Creates lending + slip                │
│                                         │
│ AFTER:                                  │
│ • Borrower gets item + slip             │
│ • Item qty decreases                    │
│ • Track until return                    │
│                                         │
│ RETURN:                                 │
│ • Submit return request                 │
│ • Item qty increases                    │
│ • Slip marked returned                  │
│                                         │
│ KEY NUMBERS:                            │
│ • Slip format: SLIP-YYYYMMDD-XXXX      │
│ • Max borrow time: depends on org       │
│ • Min items to keep: per item minimum   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Summary

**How items are borrowed:**

```
STAFF         BORROWER      ITEM          SYSTEM
  │             │            │             │
  ├──[CREATE BORROWING]─────→│             │
  │             │            │             │
  │             │            │             ├──[VALIDATE]
  │             │            │             │
  │             │            │             ├──[CREATE LENDING]
  │             │            │             │
  │             │            │             ├──[CREATE SLIP]
  │             │            │             │
  │             │            │[QTY: 3→2]───┤
  │             │            │             │
  │─[GIVE ITEM+SLIP]─────────→│             │
  │             │            │             │
  │             ├───[KEEP 7 DAYS]─────────→│
  │             │            │             │
  │             ├──[RETURN ITEM]──────────→│
  │             │            │             │
  │             │            │[QTY: 2→3]───┤
  │             │            │             │
  │             │            ├──[MARK RETURNED]
  │             │            │             │
  │             │            ├──[LOG]──────┤
  │             │            │             ✓
```

Simple, automatic, and fully tracked! 📦✨

---

*See COMPLETE_BORROWING_GUIDE.md for detailed explanation*
*See HOW_TO_BORROW_ITEMS.md for practical implementation*
*See BORROWING_UI_FLOW.md for interface walkthrough*
