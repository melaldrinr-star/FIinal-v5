# Borrowing System - Complete Documentation Index

This index organizes all documentation about how items are borrowed in the BMDC system.

---

## 📚 Quick Navigation by Topic

### "I want to understand the borrowing process" (5-10 minutes)

**Start here:** 👉 **[COMPLETE_BORROWING_GUIDE.md](COMPLETE_BORROWING_GUIDE.md)**

This is the MAIN document that answers: "How does an item get borrowed?"

Covers:
- Quick 30-second answer
- Full process overview with diagrams
- Step-by-step walkthrough
- All scenarios and rules
- Common Q&A

---

### "I need to actually borrow an item" (Practical Guide)

**Guidance:** 👉 **[HOW_TO_BORROW_ITEMS.md](HOW_TO_BORROW_ITEMS.md)**

Practical instructions:
- Check item availability (GET /api/items)
- Create lending record (POST /api/lendings)
- Automatic processes explained
- What happens after
- Request/response examples
- Troubleshooting

---

### "What about the borrowing slip?" (Feature Details)

**Reference:** 👉 **[BORROWING_SLIP_QUICK_START.md](BORROWING_SLIP_QUICK_START.md)**

Borrowing slip specifics:
- Slip number generation
- API endpoints
- Slip operations
- Statistics
- Quick examples

**Comprehensive:** 👉 **[Backend/migrations/docs/BORROWING_SLIP_FEATURE.md](Backend/migrations/docs/BORROWING_SLIP_FEATURE.md)**

Full reference:
- Database schema
- All service methods
- Complete API documentation
- Workflow examples
- Future enhancements

---

### "What does the user interface look like?" (UI/UX)

**Guide:** 👉 **[BORROWING_UI_FLOW.md](BORROWING_UI_FLOW.md)**

Frontend details:
- Staff screens
- Forms and inputs
- Confirmation views
- Mobile interface
- Status indicators
- Notifications

---

### "Show me the technical flows" (Architecture)

**Visual:** 👉 **[BORROWING_SLIP_WORKFLOW_DIAGRAM.md](BORROWING_SLIP_WORKFLOW_DIAGRAM.md)**

Diagrams and flows:
- System architecture
- Process flows
- Data relationships
- Status transitions
- Database schema
- Filtering operations

---

### "I need implementation details" (Developer Reference)

**Overview:** 👉 **[BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md](BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md)**

Implementation info:
- Files created
- Services added
- API endpoints
- Type definitions
- Integration points
- Deployment steps

**Complete List:** 👉 **[FILES_CREATED_SUMMARY.md](FILES_CREATED_SUMMARY.md)**

Full reference:
- Every file created
- File purposes
- Code structure
- Integration points

---

## 📋 Document Overview

| Document | Length | Best For | Focus |
|----------|--------|----------|-------|
| COMPLETE_BORROWING_GUIDE.md | Long | Understanding the full process | Business Logic |
| HOW_TO_BORROW_ITEMS.md | Medium | Practical borrowing steps | Implementation |
| BORROWING_UI_FLOW.md | Medium | Understanding the interface | UX/Frontend |
| BORROWING_SLIP_QUICK_START.md | Short | Quick reference | Slips Feature |
| Backend/.../BORROWING_SLIP_FEATURE.md | Very Long | Complete reference | Technical Specs |
| BORROWING_SLIP_WORKFLOW_DIAGRAM.md | Long | Visual understanding | Architecture |
| BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md | Long | Implementation overview | Code Structure |
| FILES_CREATED_SUMMARY.md | Medium | Complete file listing | Development |
| IMPLEMENTATION_COMPLETE.md | Short | Status/checklist | Deployment |
| README_BORROWING_SLIP.md | Long | Navigation hub | Documentation Index |

---

## 🎯 By Use Case

### Use Case 1: "New to the system - understand how borrowing works"

**Reading Order:**
1. COMPLETE_BORROWING_GUIDE.md (overview)
2. HOW_TO_BORROW_ITEMS.md (practical steps)
3. BORROWING_UI_FLOW.md (see the interface)
4. BORROWING_SLIP_WORKFLOW_DIAGRAM.md (visual flows)

**Time:** ~30 minutes

---

### Use Case 2: "I need to create a borrowing in production"

**Reading Order:**
1. COMPLETE_BORROWING_GUIDE.md (quick answer section)
2. HOW_TO_BORROW_ITEMS.md (follow steps)
3. Reference API examples as needed

**Time:** ~10 minutes

---

### Use Case 3: "Implementing the frontend UI"

**Reading Order:**
1. BORROWING_UI_FLOW.md (see what to build)
2. HOW_TO_BORROW_ITEMS.md (API details)
3. Backend/.../BORROWING_SLIP_FEATURE.md (API reference)

**Time:** ~30 minutes

---

### Use Case 4: "Debugging a borrowing issue"

**Reading Order:**
1. COMPLETE_BORROWING_GUIDE.md (find the phase)
2. Backend/.../BORROWING_SLIP_FEATURE.md (error section)
3. FILES_CREATED_SUMMARY.md (find relevant file)
4. Check source code in Backend/

**Time:** ~20 minutes

---

### Use Case 5: "Deploying to production"

**Reading Order:**
1. IMPLEMENTATION_COMPLETE.md (status check)
2. BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md (deployment steps)
3. Backend/migrations/007-borrowing-slip/ (run migration)

**Time:** ~15 minutes

---

## 🔑 Key Concepts

### Lending vs Borrowing

**Lending** = System record of an item being borrowed
- Created when staff initiates borrowing
- Tracked until returned
- Can be active, returned, or overdue

**Borrowing** = The act of taking an item
- Same as "lending" in this system
- Term used interchangeably
- Borrower is the person taking the item

---

### Borrowing Slip

**Definition:** Physical or digital receipt of borrowed item

**Contains:**
- Unique slip number (SLIP-YYYYMMDD-XXXX)
- Borrower name
- Item name
- Borrowing date (today)
- Due date (when to return)
- Status tracking

**Auto-created:** Yes, when lending is created
**Printed:** Yes, for physical receipt

---

### Item Quantity Tracking

```
Total Quantity = 5 (never changes)
├─ In Stock = 2 (available to borrow)
├─ Borrowed = 3 (currently out)
│  ├─ Maria (1)
│  ├─ John (1)
│  └─ Jane (1)
└─ Minimum = 1 (never go below)
```

---

### Status Lifecycle

```
ITEM STATES:
available → borrowed → returned OR overdue

LENDING STATES:
active → returned (or) overdue → (then) returned

SLIP STATES:
active → returned (or) overdue
```

---

## 🔗 Related Features

### Item Management
- Check availability before borrowing
- See item description and details
- Track item status changes
- View borrow history

### User Management
- Staff create borrowings (need proper role)
- Trainees as borrowers
- External borrowers (non-trainees)
- Activity logging of who did what

### Reporting
- Borrowing statistics
- Overdue items tracking
- Item utilization
- Borrower history

---

## 📊 Common Statistics

After reading these docs, you'll understand:

- **Items Per Borrowing:** Can borrow 1 to n items (depends on quantity)
- **Time Frame:** Can set any future date as return date
- **Tracking:** Every borrowing has unique lending ID + slip number
- **Roles:** Only staff can create borrowings
- **Automatic:** Slip + status updates happen automatically
- **Tracking Period:** From borrow date to return date
- **Overdue:** System detects when past due date

---

## 🚀 Quick Facts

✅ **Automatic Slip Generation**
- Slip created automatically with lending
- No manual slip creation needed

✅ **Unique Slip Numbers**
- Format: SLIP-YYYYMMDD-XXXX
- Unique per day per tenant
- Sequential numbering

✅ **Automatic Quantity Update**
- Item available_qty decreases on borrow
- Item available_qty increases on return
- Status auto-recalculated

✅ **Complete Tracking**
- Every borrow recorded
- Every return recorded
- Every overdue tracked
- Full audit trail

✅ **Multi-Tenant**
- Each tenant sees only their slips
- Isolated data
- Cross-tenant queries for admin

✅ **Role-Based Security**
- Staff can create borrowings
- Trainees can view their borrowings
- Admin can view all

---

## 🔧 API Endpoints

### Create Borrowing
```
POST /api/lendings
- Auto-creates slip
- Updates item qty
- Logs activity
```

### View Borrowings
```
GET /api/lendings
GET /api/lendings?status=active
GET /api/borrowing-slips
GET /api/borrowing-slips/overdue
```

### Return Item
```
POST /api/lendings/:id/return
- Marks slip returned
- Restores item qty
- Logs return
```

### Get Statistics
```
GET /api/lendings/stats
GET /api/borrowing-slips/stats
```

---

## 🎓 Learning Path

**Beginner:**
1. Read: COMPLETE_BORROWING_GUIDE.md (quick answer)
2. Skim: HOW_TO_BORROW_ITEMS.md
3. Look at: BORROWING_UI_FLOW.md

**Intermediate:**
1. Study: COMPLETE_BORROWING_GUIDE.md (full process)
2. Follow: HOW_TO_BORROW_ITEMS.md (step-by-step)
3. Review: BORROWING_SLIP_QUICK_START.md

**Advanced:**
1. Deep dive: Backend/.../BORROWING_SLIP_FEATURE.md
2. Study: BORROWING_SLIP_WORKFLOW_DIAGRAM.md
3. Review: Source code in Backend/src/

**Expert:**
1. Read: BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md
2. Reference: FILES_CREATED_SUMMARY.md
3. Review: All source files
4. Debug: As needed

---

## 🔍 Finding Information

### "How do I...?"

| Question | Document |
|----------|----------|
| ...borrow an item? | HOW_TO_BORROW_ITEMS.md |
| ...return an item? | COMPLETE_BORROWING_GUIDE.md (Return section) |
| ...find overdue items? | HOW_TO_BORROW_ITEMS.md (Tracking section) |
| ...generate a slip? | BORROWING_SLIP_QUICK_START.md |
| ...check item availability? | HOW_TO_BORROW_ITEMS.md (Step 1) |
| ...see all active borrowings? | COMPLETE_BORROWING_GUIDE.md (Tracking section) |
| ...use the API? | Backend/.../BORROWING_SLIP_FEATURE.md |
| ...deploy this? | IMPLEMENTATION_COMPLETE.md |
| ...understand the UI? | BORROWING_UI_FLOW.md |

### "What is...?"

| Concept | Document |
|---------|----------|
| Borrowing Slip | BORROWING_SLIP_QUICK_START.md |
| Lending Record | COMPLETE_BORROWING_GUIDE.md |
| Item Status | HOW_TO_BORROW_ITEMS.md |
| Slip Number | BORROWING_SLIP_WORKFLOW_DIAGRAM.md |
| Quantity Tracking | COMPLETE_BORROWING_GUIDE.md |
| Status Lifecycle | BORROWING_SLIP_WORKFLOW_DIAGRAM.md |

---

## ✅ Verification Checklist

After implementing, verify using these docs:

- [ ] Borrowing slip created when item borrowed
- [ ] Slip number format: SLIP-YYYYMMDD-XXXX
- [ ] Item quantity decreases on borrow
- [ ] Item quantity increases on return
- [ ] Status shown in UI (active/overdue)
- [ ] Overdue detection working
- [ ] Permissions enforced (staff only)
- [ ] Tenant isolation working
- [ ] All APIs responding correctly

---

## 📞 Support Resources

### For Understanding
- Read COMPLETE_BORROWING_GUIDE.md
- Check BORROWING_UI_FLOW.md
- Review BORROWING_SLIP_WORKFLOW_DIAGRAM.md

### For Implementation
- Check Backend/.../BORROWING_SLIP_FEATURE.md
- Review BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md
- See FILES_CREATED_SUMMARY.md

### For Troubleshooting
- Check COMPLETE_BORROWING_GUIDE.md (Q&A section)
- Review HOW_TO_BORROW_ITEMS.md (errors section)
- See Backend source files

---

## 📝 Summary

**All the answers you need about borrowing are in these documents:**

1. **Quick Overview:** COMPLETE_BORROWING_GUIDE.md
2. **How To:** HOW_TO_BORROW_ITEMS.md
3. **UI/UX:** BORROWING_UI_FLOW.md
4. **Slips Feature:** BORROWING_SLIP_QUICK_START.md
5. **Technical Details:** Backend/.../BORROWING_SLIP_FEATURE.md
6. **Diagrams:** BORROWING_SLIP_WORKFLOW_DIAGRAM.md
7. **Implementation:** BORROWING_SLIP_IMPLEMENTATION_SUMMARY.md
8. **Files:** FILES_CREATED_SUMMARY.md

**Start with COMPLETE_BORROWING_GUIDE.md if you're new to the system.**

---

*Last Updated: September 8, 2026*
*Status: ✅ Complete and Production Ready*
