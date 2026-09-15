# Borrowing Slip Feature - Quick Start Guide

## What's New

A complete **Borrowing Slip** system has been added to the lending management system. When someone borrows an item, a borrowing slip is automatically generated with:

- ✅ Unique slip number (e.g., SLIP-20260908-0001)
- ✅ Borrower name
- ✅ Item name
- ✅ Current date (borrowing date)
- ✅ Due date/return date
- ✅ Item description and borrower contact
- ✅ Status tracking (active → returned or overdue)

---

## Files Created

| File | Purpose |
|------|---------|
| `Backend/migrations/007-borrowing-slip/001_create_borrowing_slips_table.sql` | Database schema |
| `Backend/src/services/borrowingSlipService.ts` | Service layer logic |
| `Backend/src/app/api/borrowing-slips/route.ts` | Main API routes |
| `Backend/src/app/api/borrowing-slips/[id]/route.ts` | Individual slip operations |
| `Backend/src/app/api/borrowing-slips/active/route.ts` | Get active slips |
| `Backend/src/app/api/borrowing-slips/overdue/route.ts` | Get overdue slips |
| `Backend/src/app/api/borrowing-slips/stats/route.ts` | Get statistics |
| `Backend/src/app/api/borrowing-slips/by-number/[slipNumber]/route.ts` | Lookup by number |
| `Backend/src/services/lendingService.ts` | Updated with slip integration |
| `Backend/src/types/index.ts` | Added BorrowingSlip type |
| Documentation files | 3 comprehensive guides + diagrams |

---

## Deployment Steps

### Step 1: Apply Database Migration

```bash
cd Backend
psql -U <username> -d <database_name> -f migrations/007-borrowing-slip/001_create_borrowing_slips_table.sql
```

Or with Supabase CLI:
```bash
supabase db push
```

### Step 2: Build Backend

```bash
npm run build
```

### Step 3: Start Using

Create a lending and watch the slip auto-create:

```bash
POST /api/lendings
{
  "item_id": "item-uuid",
  "borrower_name": "Maria Santos",
  "expected_return_date": "2026-09-15",
  "borrower_contact": "09123456789",
  "notes": "Handle with care"
}
```

Response includes lending + auto-created slip number!

---

## API Endpoints

### Create Slip (Manual)
```bash
POST /api/borrowing-slips
{
  "lending_id": "uuid",
  "item_id": "uuid",
  "borrower_name": "John Doe",
  "item_name": "Laptop",
  "due_date": "2026-09-15"
}
```

### Get All Slips
```bash
GET /api/borrowing-slips
GET /api/borrowing-slips?status=active&borrower_name=John
GET /api/borrowing-slips?start_date=2026-09-01&end_date=2026-09-30
```

### Get Active Slips
```bash
GET /api/borrowing-slips/active
```

### Get Overdue Slips
```bash
GET /api/borrowing-slips/overdue
```

### Get Slip by Number
```bash
GET /api/borrowing-slips/by-number/SLIP-20260908-0001
```

### Get Statistics
```bash
GET /api/borrowing-slips/stats
```

Returns: `{ total, active, returned, overdue, dueToday }`

### Mark as Returned
```bash
PUT /api/borrowing-slips/:id
{
  "notes": "Returned in good condition"
}
```

### Delete Slip
```bash
DELETE /api/borrowing-slips/:id
```

---

## Automatic Workflow

### Creating a Lending

```
User borrows item
       ↓
POST /api/lendings
       ↓
Lending created ✓
       ↓
Slip auto-created ✓ (behind the scenes)
       ↓
Slip number assigned (SLIP-20260908-0001)
```

### Returning an Item

```
User returns item
       ↓
POST /api/lendings/:id/return
       ↓
Lending marked returned ✓
       ↓
Slip auto-marked returned ✓
       ↓
Status: returned
```

---

## Slip Number Format

Slips get unique sequential numbers automatically:

```
SLIP-YYYYMMDD-XXXX

SLIP     = Constant prefix
YYYYMMDD = Date (e.g., 20260908)
XXXX     = Sequential number per day (0001, 0002, etc.)
```

**Examples:**
- `SLIP-20260908-0001` - First slip on Sept 8, 2026
- `SLIP-20260908-0002` - Second slip on Sept 8, 2026
- `SLIP-20260909-0001` - First slip on Sept 9, 2026

---

## Status Lifecycle

```
ACTIVE ──┬──→ RETURNED (when returned)
         └──→ OVERDUE (if due date passes)
```

---

## Permission Control

| Role | Create | Return | Delete |
|------|--------|--------|--------|
| super_admin | ✅ | ✅ | ✅ |
| local_admin | ✅ | ✅ | ✅ |
| staff_inventory_manager | ✅ | ✅ | ❌ |
| staff_training_coordinator | ❌ | ❌ | ❌ |
| trainee | ❌ | ❌ | ❌ |

---

## Data Fields

Every borrowing slip includes:

```
{
  id: "uuid",
  slip_number: "SLIP-20260908-0001",
  tenant_id: "tenant-uuid",
  lending_id: "lending-uuid",
  item_id: "item-uuid",
  borrower_name: "Maria Santos",
  item_name: "Laptop",
  borrowing_date: "2026-09-08",
  due_date: "2026-09-15",
  quantity: 1,
  item_description: "Dell XPS 13",
  borrower_contact: "09123456789",
  notes: "Handle with care",
  status: "active",
  generated_at: "2026-09-08T10:30:00Z",
  returned_at: null,
  created_by: "user-uuid",
  created_at: "2026-09-08T10:30:00Z",
  updated_at: "2026-09-08T10:30:00Z"
}
```

---

## Query Examples

### Find all active slips for a borrower
```bash
GET /api/borrowing-slips?status=active&borrower_name=Maria
```

### Find items due today
```bash
GET /api/borrowing-slips?status=active
# Then filter client-side where due_date === today
```

### Get overdue items
```bash
GET /api/borrowing-slips/overdue
```

### Get statistics
```bash
GET /api/borrowing-slips/stats
# Response: { total: 45, active: 23, returned: 20, overdue: 2, dueToday: 3 }
```

### Find slip by number
```bash
GET /api/borrowing-slips/by-number/SLIP-20260908-0001
```

---

## Database Info

**Table:** `borrowing_slips`

**Columns:** 18 columns including:
- Primary key: `id`
- Foreign keys: `tenant_id`, `lending_id`, `item_id`, `created_by`
- Unique index: `slip_number`
- Status: `active | returned | overdue`

**Indexes:** 7 performance indexes
- tenant_id, lending_id, item_id, status, dates, slip_number

---

## Documentation

Read more details in:

1. **BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md**
   - Complete overview
   - File structure
   - Security details

2. **Backend/migrations/docs/BORROWING_SLIP_FEATURE.md**
   - Comprehensive documentation
   - All endpoints with examples
   - Service methods
   - Usage workflows

3. **BORROWING_SLIP_WORKFLOW_DIAGRAM.md**
   - Visual diagrams
   - Architecture
   - Data flows

4. **FILES_CREATED_SUMMARY.md**
   - Complete file listing
   - File purposes
   - Integration points

---

## Troubleshooting

### Issue: Slip not created when lending created
**Solution:** Check error logs. Slip creation errors don't fail lending (by design), but are logged to console.

### Issue: Slip number not unique
**Solution:** Should not happen - uses database UNIQUE constraint. If it occurs, check database uniqueness.

### Issue: Can't query slips
**Solution:** 
- Check tenant_id filtering
- Verify role permissions
- Ensure migration was applied

### Issue: Overdue status not updating
**Solution:** Status updates when:
1. You call `GET /api/borrowing-slips/overdue` (automatic check)
2. System batch job runs `updateOverdueStatus()` periodically
3. Or manually when querying active slips past due date

---

## Future Enhancements

Potential improvements (not yet implemented):

- [ ] PDF generation for slip printing
- [ ] QR codes on slips for quick scanning
- [ ] Email notifications when item borrowed
- [ ] SMS reminders for overdue items
- [ ] Barcode integration for quick returns
- [ ] Multi-language support
- [ ] Custom slip templates
- [ ] Bulk operations (print/email multiple)
- [ ] Late fee tracking
- [ ] Renewal/extension functionality

---

## Success Checklist

After deployment, verify:

- ✅ Database migration applied successfully
- ✅ Backend builds without errors
- ✅ Create lending → slip auto-creates
- ✅ Can retrieve slips via GET endpoints
- ✅ Can filter slips by status/date/name
- ✅ Can mark slips as returned
- ✅ Statistics endpoint returns correct counts
- ✅ Permissions working correctly (roles)
- ✅ Tenant isolation working (can't see other tenant slips)

---

## Support

For issues or questions:
1. Check the comprehensive documentation files
2. Review the workflow diagrams
3. Check database migration for schema details
4. Review error logs for specific issues

---

## Summary

You now have a complete borrowing slip system that:
- ✅ Automatically generates slips when items are borrowed
- ✅ Captures all essential information
- ✅ Tracks status and due dates
- ✅ Provides comprehensive querying
- ✅ Manages overdue items
- ✅ Maintains complete audit trail
- ✅ Supports multi-tenant environments
- ✅ Enforces role-based access control

Ready to deploy! 🚀
