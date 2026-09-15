# Borrowing Slip System Workflow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                  │
│                                                                       │
│  User Interface for:                                                 │
│  • Creating Lendings (triggers slip creation)                       │
│  • Viewing Borrowing Slips                                          │
│  • Returning Items (marks slips as returned)                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API ROUTES (Next.js)                      │
│                                                                       │
│  POST   /api/borrowing-slips           → Create slip                │
│  GET    /api/borrowing-slips           → Get all slips              │
│  GET    /api/borrowing-slips/:id       → Get specific slip          │
│  PUT    /api/borrowing-slips/:id       → Update slip                │
│  DELETE /api/borrowing-slips/:id       → Delete slip                │
│  GET    /api/borrowing-slips/active    → Get active slips           │
│  GET    /api/borrowing-slips/overdue   → Get overdue slips          │
│  GET    /api/borrowing-slips/stats     → Get statistics             │
│  GET    /api/borrowing-slips/by-number/:slipNumber → Lookup by num  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Service Layer
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (TypeScript Classes)                      │
│                                                                       │
│  LendingService (MODIFIED)                                          │
│  ├─ createLending()     → Calls BorrowingSlipService.create()      │
│  └─ returnLending()     → Calls BorrowingSlipService.markAsReturned│
│                                                                       │
│  BorrowingSlipService (NEW)                                         │
│  ├─ createBorrowingSlip()                                          │
│  ├─ getBorrowingSlipById()                                         │
│  ├─ getAllBorrowingSlips()                                         │
│  ├─ getActiveBorrowingSlips()                                      │
│  ├─ getOverdueBorrowingSlips()                                     │
│  ├─ markAsReturned()                                               │
│  ├─ updateOverdueStatus()                                          │
│  └─ getBorrowingSlipStats()                                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Database Queries
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL + Supabase)                  │
│                                                                       │
│  Tables:                                                             │
│  • borrowing_slips      → Main slip records                         │
│  • lendings             → Lending records (links to slips)          │
│  • items                → Item data                                 │
│  • tenants              → Multi-tenant isolation                    │
│  • users                → User audit trail                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Borrowing Process Flow

```
┌──────────────────┐
│  User Borrows    │
│  an Item         │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ POST /api/lendings                                   │
│ {                                                    │
│   item_id: "uuid",                                  │
│   borrower_name: "Maria Santos",                    │
│   expected_return_date: "2026-09-15",               │
│   quantity: 1,                                      │
│   borrower_contact: "09123456789",                  │
│   notes: "Handle with care"                         │
│ }                                                    │
└────────┬──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ LendingService.createLending()                       │
│ 1. Validate item availability                       │
│ 2. Create lending record                            │
│ 3. Update item quantity (available -= qty)          │
└────────┬──────────────────────────────────────────────┘
         │
         ▼
    ┌────────────────┐
    │  Lending       │
    │  Created ✓     │
    └────────┬───────┘
             │
             ├─────────────────────────────────────────────┐
             │                                             │
             ▼                                             │
    ┌────────────────────────────────────────────────┐   │
    │ Try to Create Borrowing Slip                   │   │
    │ (Auto-created, errors don't fail lending)     │   │
    └────────┬──────────────────────────────────────┘   │
             │                                             │
             ▼                                             │
    ┌────────────────────────────────────────────────┐   │
    │ BorrowingSlipService.createBorrowingSlip()     │   │
    │ 1. Generate slip number (SLIP-YYYYMMDD-XXXX)  │   │
    │ 2. Populate slip data:                         │   │
    │    - lending_id: [lending uuid]                │   │
    │    - borrower_name: "Maria Santos"             │   │
    │    - item_name: "Laptop"                       │   │
    │    - borrowing_date: 2026-09-08                │   │
    │    - due_date: 2026-09-15                      │   │
    │    - status: "active"                          │   │
    │ 3. Insert into database                        │   │
    └────────┬──────────────────────────────────────┘   │
             │                                             │
             ▼                                             │
    ┌──────────────────┐       ┌──────────────────┐       │
    │  Borrowing Slip  │       │  Lending Record  │       │
    │  Created ✓       │       │  Created ✓       │       │
    │                  │       │                  │       │
    │  ID: uuid        │       │  ID: uuid        │       │
    │  Number:         │       │  Item: Laptop    │       │
    │  SLIP-20260908   │       │  Qty: 1          │       │
    │  -0001           │       │  Due: 2026-09-15 │       │
    │  Status: active  │       │  Status: active  │       │
    │  Due: 2026-09-15 │       │                  │       │
    └──────────────────┘       └──────────────────┘       │
                                                            │
             ┌──────────────────────────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  Return to Client:         │
    │  ✓ Lending created         │
    │  ✓ Slip created            │
    │  ✓ Slip number ready       │
    │  ✓ Item quantity updated   │
    └────────────────────────────┘
```

## Return Process Flow

```
┌──────────────────┐
│  User Returns    │
│  Borrowed Item   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ POST /api/lendings/:id/return                        │
│ {                                                    │
│   notes: "Item returned in good condition"           │
│ }                                                    │
└────────┬──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ LendingService.returnLending()                       │
│ 1. Get lending record                               │
│ 2. Update item quantity (available += qty)          │
│ 3. Mark lending as returned                         │
│ 4. Set actual_return_date                           │
└────────┬──────────────────────────────────────────────┘
         │
         ▼
    ┌────────────────┐
    │  Lending       │
    │  Updated ✓     │
    └────────┬───────┘
             │
             ├─────────────────────────────────────────────┐
             │                                             │
             ▼                                             │
    ┌────────────────────────────────────────────────┐   │
    │ Try to Update Borrowing Slip                   │   │
    │ (Auto-updated, errors don't fail return)       │   │
    └────────┬──────────────────────────────────────┘   │
             │                                             │
             ▼                                             │
    ┌────────────────────────────────────────────────┐   │
    │ BorrowingSlipService.markAsReturned()          │   │
    │ 1. Get slip by lending_id                      │   │
    │ 2. Update slip:                                │   │
    │    - status: "returned"                        │   │
    │    - returned_at: [current timestamp]          │   │
    │    - append notes                              │   │
    │ 3. Update in database                          │   │
    └────────┬──────────────────────────────────────┘   │
             │                                             │
             ▼                                             │
    ┌──────────────────┐       ┌──────────────────┐       │
    │  Borrowing Slip  │       │  Lending Record  │       │
    │  Updated ✓       │       │  Updated ✓       │       │
    │                  │       │                  │       │
    │  Status: returned│       │  Status: returned│       │
    │  Returned At:    │       │  Actual Return:  │       │
    │  2026-09-10      │       │  2026-09-10      │       │
    │                  │       │  Notes appended  │       │
    └──────────────────┘       └──────────────────┘       │
                                                            │
             ┌──────────────────────────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  Return to Client:         │
    │  ✓ Lending returned        │
    │  ✓ Slip marked returned    │
    │  ✓ Item quantity restored  │
    │  ✓ Audit trail updated     │
    └────────────────────────────┘
```

## Query Operations Flow

```
┌──────────────────────────┐
│  Client Queries          │
│  Borrowing Slips         │
└────────┬─────────────────┘
         │
         ├────────────────────────────────────────────┐
         │                                            │
    ┌────▼───────────────────┐         ┌─────────────▼─┐
    │ GET /api/borrowing-   │         │ GET /api/     │
    │ slips/active          │         │ borrowing-    │
    │                       │         │ slips/overdue │
    └────┬───────────────────┘         └─────────────┬─┘
         │                                            │
         │                    ┌──────────────────────▼─┐
         │                    │ GET /api/borrowing-   │
         │                    │ slips/stats           │
         │                    │                      │
         │                    │ Returns:             │
         │                    │ • total: 45          │
         │                    │ • active: 23         │
         │                    │ • returned: 20       │
         │                    │ • overdue: 2         │
         │                    │ • dueToday: 3        │
         │                    └──────────────────────┘
         │
         │          ┌─────────────────────────────┐
         │          │ GET /api/borrowing-        │
         │          │ slips/by-number/:slipNumber │
         │          │                             │
         │          │ Returns specific slip by    │
         │          │ SLIP-20260908-0001          │
         │          └─────────────────────────────┘
         │
         │       ┌────────────────────────────────┐
         │       │ GET /api/borrowing-slips?     │
         │       │ status=active&                │
         │       │ borrower_name=Maria&          │
         │       │ start_date=2026-09-01&        │
         │       │ end_date=2026-09-30           │
         │       │                              │
         │       │ Filtered results based on     │
         │       │ multiple criteria             │
         │       └────────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Response: Array of Slips     │
│ with matching criteria       │
└──────────────────────────────┘
```

## Database Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                         TENANTS                                 │
│  ├─ id (UUID) [PK]                                            │
│  └─ ...tenant data...                                         │
└────┬───────────────────────────────────────────────────────────┘
     │ 1:n
     │
     ├─────────────────────────┬──────────────────────────────┐
     │                         │                              │
     ▼                         ▼                              ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────┐
│    LENDINGS          │ │     ITEMS        │ │    USERS     │
│                      │ │                  │ │              │
│ ├─ id (PK)          │ │ ├─ id (PK)       │ │ ├─ id (PK)   │
│ ├─ tenant_id (FK)◄──┼─┤─ tenant_id (FK) │ │ └─ ...        │
│ ├─ item_id (FK)────┐│ │ ├─ ...item data  │ │              │
│ ├─ trainee_id (FK) │└─┼─────────────────┘ │              │
│ ├─ borrower_name   │  │                  │              │
│ ├─ quantity        │  │  Tracks what     │              │
│ ├─ lent_date       │  │  items are       │              │
│ ├─ expected_...    │  │  available for   │              │
│ ├─ actual_...      │  │  borrowing       │              │
│ ├─ status          │  │                  │              │
│ ├─ lent_by (FK)───────────────────────────┤              │
│ ├─ returned_by     │  │                  │              │
│ └─ ...             │  │                  │              │
└────┬────────────────┘  └──────────────────┘              │
     │ 1:1 (usually)                                        │
     │                                                      │
     ▼
┌──────────────────────────┐                               │
│   BORROWING_SLIPS        │                               │
│                          │                               │
│ ├─ id (PK)              │                               │
│ ├─ tenant_id (FK)────────────────────────────────────────┘
│ ├─ lending_id (FK)◄─────┼─ Reference to lending above
│ ├─ item_id (FK)─────────┼─ Redundant for performance
│ ├─ borrower_name        │
│ ├─ item_name            │
│ ├─ borrowing_date       │
│ ├─ due_date             │
│ ├─ quantity             │
│ ├─ item_description     │
│ ├─ borrower_contact     │
│ ├─ notes                │
│ ├─ slip_number (UQ)     │ Unique slip ID
│ ├─ status               │ active/returned/overdue
│ ├─ generated_at         │
│ ├─ returned_at          │
│ ├─ created_by (FK)──────┼─ Reference to user
│ ├─ created_at           │
│ └─ updated_at           │
└──────────────────────────┘
```

## Slip Number Generation Logic

```
┌─────────────────────────────────────────────────┐
│  generateSlipNumber(tenantId)                    │
│                                                  │
│  1. Get today's date: 2026-09-08                │
│     Format to YYYYMMDD: 20260908                │
│                                                  │
│  2. Query database:                              │
│     SELECT COUNT(*) FROM borrowing_slips        │
│     WHERE tenant_id = :tenantId                 │
│     AND created_at >= today                     │
│                                                  │
│  3. Results:                                     │
│     Today's count: 3 existing slips             │
│     Next sequence: 4                             │
│                                                  │
│  4. Format sequence:                             │
│     3 + 1 = 4                                    │
│     padStart(4, '0') = "0004"                   │
│                                                  │
│  5. Combine parts:                               │
│     "SLIP-" + "20260908" + "-" + "0004"         │
│     = "SLIP-20260908-0004"                      │
│                                                  │
│  Return: "SLIP-20260908-0004"                   │
└─────────────────────────────────────────────────┘

Examples:
    First slip on Sept 8:  SLIP-20260908-0001
    Second slip on Sept 8: SLIP-20260908-0002
    Third slip on Sept 8:  SLIP-20260908-0003
    First slip on Sept 9:  SLIP-20260909-0001
```

## Status Transitions

```
┌──────────────┐
│   ACTIVE     │ ◄─── Initial status when slip created
│              │
│ - Item can be│
│   with       │
│   borrower   │
│ - Due date   │
│   not passed │
└──────┬───────┘
       │                          ┌────────────────┐
       ├─ Due date passes ───────►│   OVERDUE      │
       │                          │                │
       │                          │ - Item not     │
       │                          │   returned by  │
       │                          │   due date     │
       │                          │ - Action req'd │
       │                          └────────────────┘
       │
       │   Item returned
       ▼
┌──────────────┐
│   RETURNED   │ ◄─── Final status when item returned
│              │
│ - Item       │
│   received   │
│ - In         │
│   inventory  │
└──────────────┘
```

## Filtering & Search Operations

```
Query: GET /api/borrowing-slips?status=active&borrower_name=Maria

┌─────────────────────────────────────┐
│ Parse Query Parameters:              │
│ • status: "active"                  │
│ • borrower_name: "Maria"            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Build Database Query:                │
│ SELECT * FROM borrowing_slips       │
│ WHERE status = 'active'             │
│ AND borrower_name ILIKE '%Maria%'   │
│ AND tenant_id = :tenantId           │
│ ORDER BY borrowing_date DESC        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Execute & Return Results:            │
│ • SLIP-20260908-0001 (Maria Santos) │
│ • SLIP-20260907-0003 (Maria Silva)  │
│ • ...                               │
└─────────────────────────────────────┘
```

## Error Handling Flow

```
Attempt Operation
        │
        ▼
┌──────────────┐
│ Try Execute  │
└──┬───────┬──┘
   │       │
Success    Error
   │       │
   ▼       ▼
┌──┐  ┌──────────────────┐
│✓ │  │ Error Handler    │
└──┘  │                  │
      │ • Log error      │
      │ • Determine type │
      │ • Format message │
      └──┬───────────────┘
         │
         ├─────────────────────┬──────────────────┐
         │                     │                  │
   ┌─────▼──────┐      ┌──────▼────────┐  ┌─────▼──┐
   │ Not Found   │      │ Access Denied │  │Invalid │
   │ (404)       │      │ (403)         │  │(400)   │
   └─────────────┘      └───────────────┘  └────────┘

Return Error Response:
{
  "success": false,
  "error": "User-friendly error message"
}
```

This comprehensive diagram illustrates the complete borrowing slip system workflow, data relationships, and operational flows.
