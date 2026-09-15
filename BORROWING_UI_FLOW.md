# Borrowing Process - UI/Frontend Flow

## User Interface Workflow

How the borrowing process looks from a user's perspective (Frontend).

---

## For Inventory Staff (Creating Borrowing)

### Screen 1: Inventory Dashboard

```
┌─────────────────────────────────────────────────────┐
│ INVENTORY MANAGEMENT SYSTEM                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  📦 Items  📝 Lendings  📋 Borrowing Slips  📊 Stats │
│                                                       │
│  ┌─ ITEMS AVAILABLE FOR BORROWING ─────────────────┐│
│  │                                                   ││
│  │ Item Name          | Qty | Available | Status    ││
│  │─────────────────────────────────────────────────││
│  │ Laptop Dell XPS    |  5  |    3      | ✓ Available
│  │ Projector Canon    |  2  |    1      | ✓ Available
│  │ Camera DSLR        |  3  |    0      | ✗ Out of Stock
│  │                                                   ││
│  └─ [+ NEW LENDING] ────────────────────────────────┘│
│                                                       │
└─────────────────────────────────────────────────────┘

Click "+ NEW LENDING" or "Borrow" button on an item
```

### Screen 2: Create Lending Form

```
┌─────────────────────────────────────────────────────┐
│ CREATE NEW BORROWING                                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│ ITEM SELECTION                                       │
│ ┌───────────────────────────────────────────────┐  │
│ │ Select Item: [Laptop Dell XPS              ▼]   │
│ │ (Available: 3 units)                          │  │
│ └───────────────────────────────────────────────┘  │
│                                                       │
│ BORROWER INFORMATION                                 │
│ ┌───────────────────────────────────────────────┐  │
│ │ ◉ Trainee  ○ Non-Trainee                     │  │
│ │                                               │  │
│ │ Select Trainee: [Search or select...      ▼]   │
│ │ (or enter name if non-trainee)               │  │
│ └───────────────────────────────────────────────┘  │
│                                                       │
│ BORROWING DETAILS                                    │
│ ┌───────────────────────────────────────────────┐  │
│ │ Quantity:        [1___]                      │  │
│ │                                               │  │
│ │ Expected Return: [2026-09-15]                │  │
│ │                                               │  │
│ │ Borrower Contact: [09123456789_]             │  │
│ │                                               │  │
│ │ Notes:           [________________]          │  │
│ │                  [________________]          │  │
│ └───────────────────────────────────────────────┘  │
│                                                       │
│ ┌─────────────────────────────────────────────┐   │
│ │  [CANCEL]                        [SAVE]     │   │
│ └─────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Screen 3: Confirmation & Slip Display

```
┌─────────────────────────────────────────────────────┐
│ ✓ BORROWING CREATED SUCCESSFULLY                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  BORROWING SLIP                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │ SLIP-20260908-0001                          │  │
│  │                                             │  │
│  │ Borrower:     Maria Santos                 │  │
│  │ Item:         Laptop Dell XPS              │  │
│  │ Borrowed:     2026-09-08                   │  │
│  │ Due Date:     2026-09-15                   │  │
│  │ Quantity:     1                            │  │
│  │ Contact:      09123456789                  │  │
│  │                                             │  │
│  │ Status:       🟢 ACTIVE                    │  │
│  └─────────────────────────────────────────────┘  │
│                                                       │
│  LENDING DETAILS                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ Lending ID:     lending-abc123             │  │
│  │ Created By:     Admin User                 │  │
│  │ Created At:     2026-09-08 10:30 AM        │  │
│  │ Item Stock:     5 total, 2 remaining      │  │
│  └─────────────────────────────────────────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ [🖨️ PRINT SLIP]  [📋 VIEW DETAILS] [✓ DONE]  │  │
│  └──────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## For Borrower (Receiving Item)

### What They See

```
┌─────────────────────────────────────────────────────┐
│ YOUR BORROWED ITEMS                                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│ ACTIVE BORROWINGS (3)                              │
│ ┌─────────────────────────────────────────────────┐│
│ │                                                  ││
│ │ Slip: SLIP-20260908-0001                        ││
│ │ Item: Laptop Dell XPS                           ││
│ │ Borrowed: 2026-09-08                            ││
│ │ Due: 2026-09-15  ⏰ 7 days left                 ││
│ │ Status: 🟢 Active                              ││
│ │                                                  ││
│ │ [View Details] [Return Item]                    ││
│ ├─────────────────────────────────────────────────┤│
│ │                                                  ││
│ │ Slip: SLIP-20260907-0002                        ││
│ │ Item: Camera DSLR                               ││
│ │ Borrowed: 2026-09-07                            ││
│ │ Due: 2026-09-10  ⏰ 2 days left                 ││
│ │ Status: 🟡 Due Soon                            ││
│ │                                                  ││
│ │ [View Details] [Return Item]                    ││
│ └─────────────────────────────────────────────────┘│
│                                                       │
│ OVERDUE (1)                                         │
│ ┌─────────────────────────────────────────────────┐│
│ │                                                  ││
│ │ Slip: SLIP-20260905-0001                        ││
│ │ Item: Projector Canon                           ││
│ │ Borrowed: 2026-09-05                            ││
│ │ Due: 2026-09-08  🔴 3 DAYS OVERDUE             ││
│ │ Status: 🔴 Overdue                             ││
│ │                                                  ││
│ │ [Return Now!]                                   ││
│ └─────────────────────────────────────────────────┘│
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Process Flow Diagram

```
STAFF MEMBER (Inventory Manager)
        │
        │ Opens Inventory Management
        ▼
    ┌─────────────────────────┐
    │ Inventory Dashboard     │
    │ - Lists all items       │
    │ - Shows available qty   │
    └────────┬────────────────┘
             │
             │ Clicks "Create Lending" or "Borrow"
             ▼
    ┌──────────────────────────────────────┐
    │ Borrowing Form Opens                 │
    │ - Select Item                        │
    │ - Select Borrower (Trainee/Name)     │
    │ - Enter Quantity                     │
    │ - Set Return Date                    │
    │ - Add Contact & Notes (Optional)     │
    └────────┬─────────────────────────────┘
             │
             │ Validates:
             │ • Item available?
             │ • Quantity OK?
             │ • Borrower info?
             ▼
    ┌──────────────────────────────────────┐
    │ Submit Lending (POST /api/lendings)  │
    └────────┬─────────────────────────────┘
             │
             ▼ API Response (on success)
    ┌──────────────────────────────────────┐
    │ SUCCESS!                             │
    │ - Slip created: SLIP-20260908-0001   │
    │ - Lending ID: lending-abc123         │
    │ - Item qty reduced                   │
    │ - Activity logged                    │
    └────────┬─────────────────────────────┘
             │
             │ Display confirmation
             ▼
    ┌──────────────────────────────────────┐
    │ Confirmation Screen                  │
    │ - Show slip details                  │
    │ - Print option                       │
    │ - Return to inventory                │
    └────────┬─────────────────────────────┘
             │
             │ Staff gives item + slip to borrower
             ▼
         BORROWER RECEIVES
         - Item (Laptop)
         - Slip (SLIP-20260908-0001)
         - Due Date (2026-09-15)
```

---

## Status Indicators

### Item Status Badges

```
🟢 AVAILABLE        - Can be borrowed
🟡 LOW STOCK        - Can be borrowed (limited qty)
🔴 OUT OF STOCK     - Cannot be borrowed
🟠 MAINTENANCE      - Cannot be borrowed
```

### Lending Status Badges

```
🟢 ACTIVE           - Currently borrowed
🟡 DUE SOON         - Due within 2 days
🔴 OVERDUE          - Past due date
✓ RETURNED          - Item returned
❌ LOST             - Item marked as lost
```

---

## Forms & Fields

### CREATE LENDING FORM

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Item | Dropdown | ✓ | Filter by available items |
| Borrower Type | Radio | ✓ | Trainee or Non-Trainee |
| Trainee | Autocomplete | ✓* | *If trainee selected |
| Borrower Name | Text | ✓* | *If non-trainee selected |
| Quantity | Number | ✓ | Min 1, Max available |
| Expected Return | Date | ✓ | Must be future date |
| Contact | Phone | ✗ | Optional contact info |
| Notes | Text Area | ✗ | Optional instructions |

---

## Mobile View

### Mobile Borrowing Screen

```
╔══════════════════════════════════╗
║   BORROW ITEM                    ║
╠══════════════════════════════════╣
║                                  ║
║ [Laptop Dell XPS        ▼]       ║
║                                  ║
║ Available: 3 units               ║
║                                  ║
║ ◉ Trainee  ○ Other       ║
║                                  ║
║ [Maria Santos           ▼]       ║
║                                  ║
║ Qty: [1__]                       ║
║                                  ║
║ Return: [2026-09-15]             ║
║                                  ║
║ [09123456789________]            ║
║                                  ║
║ [_________________]              ║
║ [_________________]              ║
║                                  ║
║        [Borrow Now]              ║
║                                  ║
╚══════════════════════════════════╝

After Submit:

╔══════════════════════════════════╗
║   ✓ BORROWED!                    ║
╠══════════════════════════════════╣
║                                  ║
║  SLIP-20260908-0001              ║
║                                  ║
║  Maria Santos                    ║
║  Laptop Dell XPS                 ║
║                                  ║
║  Due: 2026-09-15                 ║
║                                  ║
║  [📋 Details] [🖨️Print]  [✓Done] ║
║                                  ║
╚══════════════════════════════════╝
```

---

## Notifications & Alerts

### On Successful Borrowing
```
✅ SUCCESS
"Item borrowed successfully!"
"Slip Number: SLIP-20260908-0001"
"Due Date: 2026-09-15"
```

### Item Not Available
```
⚠️ WARNING
"Item 'Laptop' is out of stock"
"Only available: 2 units (you requested 3)"
"Try borrowing fewer items"
```

### Missing Information
```
❌ ERROR
"Please provide borrower information"
"Select either a trainee or enter borrower name"
```

### Invalid Date
```
❌ ERROR
"Return date must be in the future"
"Current date: 2026-09-08"
"Please select a later date"
```

---

## Dashboard Views

### Inventory Manager Dashboard

```
┌──────────────────────────────────────────┐
│ INVENTORY MANAGER DASHBOARD              │
├──────────────────────────────────────────┤
│                                          │
│ 📊 STATISTICS                           │
│ ┌────────────────────────────────────┐  │
│ │ Total Items:    150                │  │
│ │ Available:      45                 │  │
│ │ Borrowed:       100                │  │
│ │ Out of Stock:   5                  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 📝 RECENT LENDINGS                      │
│ ┌────────────────────────────────────┐  │
│ │ Today: 12 new borrowings           │  │
│ │ Active: 87 items out               │  │
│ │ Overdue: 3 items                   │  │
│ │ Returned Today: 8                  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 🚨 ALERTS                               │
│ ┌────────────────────────────────────┐  │
│ │ 3 items overdue                    │  │
│ │ 5 items due today                  │  │
│ │ 2 items low stock                  │  │
│ └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### Borrower Dashboard

```
┌──────────────────────────────────────────┐
│ MY BORROWED ITEMS                        │
├──────────────────────────────────────────┤
│                                          │
│ ✓ ACTIVE (3)                            │
│ ┌────────────────────────────────────┐  │
│ │ Laptop - Due 2026-09-15 (7 days)  │  │
│ │ Camera - Due 2026-09-10 (2 days)  │  │
│ │ Book - Due 2026-09-12 (4 days)    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ⚠️ DUE SOON (1)                         │
│ ┌────────────────────────────────────┐  │
│ │ Projector - Due 2026-09-09 (1 day) │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 🚨 OVERDUE (0)                          │
│ ┌────────────────────────────────────┐  │
│ │ No overdue items                   │  │
│ └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

---

## Borrowing Slip Printout

```
═══════════════════════════════════════════════════════════
                    BORROWING SLIP
───────────────────────────────────────────────────────────

Slip Number:        SLIP-20260908-0001

Borrower Name:      Maria Santos
Item Name:          Laptop Dell XPS 13
Item Description:   High-performance laptop with charger
Quantity:           1

Borrowing Date:     September 8, 2026
Due Date:           September 15, 2026

Contact:            09123456789
Notes:              Handle with care - fragile

Status:             ACTIVE

Generated:          2026-09-08 10:30 AM

───────────────────────────────────────────────────────────
        Please return this item by the due date.
         For issues contact: inventory@bmdc.edu
═══════════════════════════════════════════════════════════
```

---

## Summary

### The borrowing process from UI perspective:

1. **Staff opens Inventory Management**
2. **Selects "Create Lending" or item's "Borrow" button**
3. **Fills borrowing form:**
   - Select item
   - Choose borrower
   - Set quantity
   - Pick return date
   - Add notes (optional)
4. **Submits form**
5. **System validates and creates lending + slip**
6. **Confirmation screen shows:**
   - Slip number
   - Item details
   - Due date
   - Option to print
7. **Staff gives item + slip to borrower**
8. **Borrower can track on their dashboard**

All automatic! No manual processes needed. 🚀
