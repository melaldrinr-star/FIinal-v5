# Staff Inventory Manager Documentation
## BMDC 1.1 - Equipment & Materials Management

**Role:** Staff Inventory Manager  
**Access Level:** Single tenant (organization)  
**Responsibility:** Equipment inventory, borrowing/lending tracking, stock management

---

## Table of Contents

1. [Role Overview](#role-overview)
2. [Dashboard Page](#dashboard-page)
3. [Items Page](#items-page)
4. [Lendings Page](#lendings-page)
5. [Borrowing Slips](#borrowing-slips)
6. [Inventory Reports](#inventory-reports)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Role Overview

### What is an Inventory Manager?

An Inventory Manager is a staff member responsible for managing training equipment, tools, and materials. Inventory Managers oversee inventory tracking, borrowing/lending, stock levels, and equipment condition.

### Inventory Manager Responsibilities

| Responsibility | Description |
|---|---|
| **Item Management** | Create, update, and delete inventory items |
| **Stock Tracking** | Monitor inventory levels, identify low stock |
| **Borrowing/Lending** | Record item borrowing and returns |
| **Quality Control** | Track item condition and maintenance |
| **Overdue Management** | Monitor overdue items and follow up |
| **Documentation** | Generate borrowing slips and reports |
| **QR Code Management** | Create and scan QR codes for items |
| **Forecasting** | Monitor usage patterns and forecast needs |

### Access Level

Inventory Managers have:
- ✅ Read/Write access to **inventory items** (create, edit, delete)
- ✅ Read/Write access to **lending records** (create, update, close)
- ✅ Read/Write access to **borrowing slips** (generate, print, manage)
- ✅ Read access to **trainee profiles** (when associated with borrowing)
- ✅ No access to **attendance records** (training coordinator only)
- ✅ No access to **staff accounts** (admin only)

---

## Dashboard Page

**URL:** `/staff/dashboard`  
**Purpose:** Inventory overview and quick access to common functions

### Page Layout

```
┌─ Inventory Manager Dashboard ─────────────────────┐
│                                                     │
│ Organization: LGU Manila                           │
│                                                     │
│ Inventory Health Summary:                           │
│ ┌──────────────┐  ┌──────────┐  ┌──────────┐     │
│ │ Total Items  │  │ In Stock │  │ Low Stock│     │
│ │    287       │  │   234    │  │   12     │     │
│ │ (+15 new)    │  │ (-8 MTD) │  │ ⚠️ Alert │     │
│ └──────────────┘  └──────────┘  └──────────┘     │
│                                                     │
│ ┌──────────────┐  ┌──────────┐  ┌──────────┐     │
│ │ Active       │  │ Overdue  │  │ Maintenance
│ │ Lendings     │  │ Items    │  │ Items    │     │
│ │    34        │  │   3      │  │   5      │     │
│ │ (2 due soon) │  │ ⚠️ Alert │  │          │     │
│ └──────────────┘  └──────────┘  └──────────┘     │
│                                                     │
│ Quick Actions:                                      │
│ [+ Create Item] [Track Borrowing] [Print Slip]    │
│ [Generate Report] [Check Overdue]                  │
│                                                     │
│ Low Stock Alerts:                                   │
│ • Safety Helmet: 2 remaining (Min: 10)            │
│ • Welding Gloves: 3 pairs (Min: 15)               │
│ • Hard Hats: 5 remaining (Min: 8)                 │
│ • Safety Glasses: 4 (Min: 10)                     │
│                                                     │
│ Recent Activity:                                    │
│ • 12 items borrowed this week                      │
│ • 8 items returned                                 │
│ • 3 maintenance entries logged                     │
│                                                     │
│ Overdue Tracking:                                   │
│ ⚠️ 3 items overdue for return                     │
│    • Drill Kit (overdue 2 days)                    │
│    • Impact Driver Set (overdue 5 days)           │
│    • Measuring Tape (overdue 1 day)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dashboard Features

1. **Inventory Health Metrics**
   - Total items in system
   - Items in stock now
   - Items low on stock (alerts)

2. **Borrowing Activity**
   - Active lendings
   - Overdue items (alerts)
   - Items in maintenance

3. **Quick Actions**
   - Create new inventory item
   - Track borrowing/lending
   - Print borrowing slips
   - Generate reports
   - Check overdue items

4. **Alerts**
   - Low stock items
   - Overdue returns
   - Maintenance needed

---

## Items Page

**URL:** `/staff/items`  
**Purpose:** Create, manage, and track inventory items

### Items List

#### Page Layout

```
┌─ Inventory Items Management ──────────────────────┐
│                                                     │
│ [+ Create Item] [Bulk Import] [Generate QR Codes]│
│                                                     │
│ Search: [_____________________]                    │
│                                                     │
│ Filters:                                            │
│ Category: [All ▼]  Status: [All ▼]                │
│ Stock: [All ▼]     Condition: [All ▼]             │
│                                                     │
│ Inventory Items:                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ Item Name │ Category │ Qty │ Status │ ...│   │
│ ├────────────────────────────────────────────┤   │
│ │ Safety    │ Safety   │ 5   │ Low    │ ...│   │
│ │ Helmet    │ Equip    │     │ Stock  │    │   │
│ │ Drill Kit │ Tools    │ 3   │ In Use │ ...│   │
│ │ Hard Hat  │ Safety   │ 8   │ In     │ ...│   │
│ │           │ Equip    │     │ Stock  │    │   │
│ │ ...                                       │   │
│ └────────────────────────────────────────────┘   │
│ Showing 1-20 of 287 results [Next]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Viewing Items

1. Navigate to **Items** from inventory menu
2. See list of all inventory items
3. Each entry shows:
   - Item name
   - Category (e.g., Safety Equipment, Tools)
   - Quantity available
   - Current status
   - Unit type

#### Searching Items

1. Enter search in **[Search]** field:
   - Item name
   - Category
   - Description

2. Results filter in real-time

#### Filtering Items

1. Use **Filters**:
   - **Category**: All, Safety Equip, Tools, Materials, etc.
   - **Status**: All, In Stock, Low Stock, Out of Stock, Maintenance
   - **Stock**: All, Full, Low, Out
   - **Condition**: All, Good, Fair, Poor, Maintenance

2. Click **[Apply]**

---

### Creating an Inventory Item

**Purpose**: Add new equipment or materials to inventory

#### Step-by-Step

1. Click **[+ Create Item]** button
   - Opens **Create Item** form

2. **Fill item information**:
   ```
   BASIC INFORMATION:
   Item Name*               [_____________________]
   Description              [_____________________
                             _____________________]
   Category*                [Choose Category ▼]
   
   Categories:
   • Safety Equipment
   • Tools
   • Materials
   • Electrical
   • Other
   
   Unit*                    [Choose Unit ▼]
   (Pieces, Pairs, Sets, Boxes, etc.)
   
   INVENTORY:
   Quantity*                [____]
   Minimum Quantity*        [____]
   (Alert when below this level)
   
   Supplier               [_____________________]
   (Who to order from if needed)
   
   LOCATION & CONDITION:
   Location*                [_____________________]
   (Storage location or area)
   
   Condition*               [Good ▼]
   (Good, Fair, Poor, Maintenance)
   
   Purchase Date            [YYYY-MM-DD]
   
   DETAILS:
   Purchase Price           [______] Currency
   Warranty Until           [YYYY-MM-DD]
   
   Maintenance Schedule     [____] days/months
   (How often to service)
   
   Notes                    [_____________________
                             _____________________]
   
   MEDIA:
   Item Image               [Upload Image]
   
   [Cancel] [Create Item]
   ```

3. **Fill all required fields** (marked with *)
   - Item name (unique)
   - Category
   - Unit type
   - Initial quantity
   - Minimum quantity (alert threshold)
   - Location
   - Condition

4. **Upload item image** (optional)
   - Click **[Upload Image]**
   - Select JPG or PNG
   - Image shown on item details

5. Click **[Create Item]**
   - System validates:
     * Item name uniqueness
     * Minimum quantity < current quantity
   - Item created
   - Success message shown
   - QR code auto-generated

6. ✅ **Result**: Item added to inventory

---

### Managing Items

#### Viewing Item Details

1. From **Items List**, click item name
   - Opens **Item Details** page

2. Page shows:
   ```
   Item: Safety Helmet
   ────────────────────────
   Category: Safety Equipment
   Unit: Pieces
   Current Quantity: 5
   Minimum Quantity: 10
   Status: ⚠️ Low Stock
   
   Location: Storage Room A, Shelf 3
   Condition: Good
   Purchased: 2023-06-15
   Warranty Until: 2025-06-15
   
   Borrowing History:
   • Borrowed by: John Doe (2024-09-20, 2 units)
   • Returned by: Jane Smith (2024-09-19, 1 unit)
   • Overdue: 1 unit (since 2024-09-18)
   
   [Edit] [Delete] [View QR] [Print QR]
   ```

#### Editing Item

1. From item details, click **[Edit]**
   - Form opens with current data

2. Modify:
   - Description
   - Category
   - Quantity
   - Minimum level
   - Location
   - Condition
   - Maintenance schedule
   - Notes

3. Click **[Save Changes]**
   - Changes saved
   - Audit logged

#### Updating Stock Level

1. From item details:
   - Click **[Update Stock]**
   - Or from items list, use inline edit

2. Set new quantity:
   ```
   Current Quantity: 5
   New Quantity: [____]
   
   Reason: [Choose ▼]
   • Physical count
   • Damage/Loss
   • Donation
   • Disposal
   • Other
   ```

3. Click **[Update]**
   - Stock level updated
   - Change logged with reason
   - Low stock alert triggered if below minimum

#### Deleting Item

⚠️ **Only delete if item no longer exists or is removed from inventory**

1. From item details, scroll to bottom

2. Click **[Delete Item]**
   - Confirmation dialog
   - Warning about dependencies

3. Type item name to confirm

4. Click **[Delete]**
   - Item marked as deleted
   - Borrowing history retained for audit
   - Item no longer appears in active inventory

---

### Working with QR Codes

#### Generating QR Code

**Automatic**: QR code auto-generated when item created

**Manual**: To generate new or additional codes:

1. From item details, click **[Generate QR Code]**
   - System creates QR code linking to item in system
   - QR code image displayed

2. **Download QR Code**:
   - Click **[Download QR Image]**
   - PNG file downloaded
   - Can print and attach to item

3. **Print QR Code**:
   - Click **[Print QR Code]**
   - Print-friendly dialog
   - Print and affix to item/container

#### Scanning QR Code

1. **Using mobile app**:
   - Open item borrowing screen
   - Click **[Scan QR]**
   - Point camera at QR code
   - Item auto-populated

2. **Using web scanner**:
   - Navigate to Scan page
   - Click **[Scan QR]**
   - Point camera at QR code
   - Item details loaded

#### QR Code Placement

Best practices:
- Attach to item directly (tape to equipment)
- Attach to storage container/shelf
- Create label with QR code and item name
- Keep QR codes visible and accessible

---

### Bulk Import Items

**Purpose**: Add multiple items at once using CSV file

#### Step-by-Step

1. Click **[Bulk Import]** button
   - Opens bulk import dialog

2. **Download CSV template**:
   - Click **[Download Template]**
   - File format shown

3. **Fill in your data**:
   ```
   name,category,unit,quantity,minimum_quantity,location,condition,supplier
   Safety Helmet,Safety Equipment,Pieces,5,10,"Storage Room A, Shelf 3",Good,SafetyFirst Inc
   Drill Kit,Tools,Sets,3,2,"Tool Storage",Good,PowerTools Co
   Welding Gloves,Safety Equipment,Pairs,8,15,"Storage Room B",Fair,WeldPro Ltd
   Hard Hat,Safety Equipment,Pieces,8,8,"Storage Room A, Shelf 2",Good,ProtectionPlus
   ```

4. **Save CSV file**

5. **Back in system**:
   - Click **[Choose File]**
   - Select your CSV file

6. **Click [Preview Import]**
   - Shows how many items will be imported
   - Highlights any errors

7. **Click [Import]** (if preview successful)
   - System processes all items
   - Success: "Imported 45 items"
   - Failures listed for correction

8. ✅ **Result**: All items added to inventory

---

## Lendings Page

**URL:** `/staff/lendings`  
**Purpose:** Track item borrowing and lending

### Lendings List

#### Page Layout

```
┌─ Borrowing & Lending ─────────────────────────────┐
│                                                     │
│ [+ Record Lending] [Generate Slip]                 │
│                                                     │
│ Status: [All ▼] [Active] [Returned] [Overdue]    │
│ [Search borrower name]                             │
│                                                     │
│ Lending Records:                                    │
│ ┌─────────────────────────────────────────────┐   │
│ │ Borrower │ Item │ Qty │ Borrow │ Due     │ │   │
│ │          │      │     │ Date   │ Date    │ │   │
│ ├─────────────────────────────────────────────┤   │
│ │ John     │ Drill│ 1   │ 09-18  │ 09-22   │ │   │
│ │ Doe      │ Kit  │     │        │ (4 days)│ │   │
│ │ Jane     │ Weld │ 3   │ 09-19  │ 09-25   │ │   │
│ │ Smith    │ Glove│     │        │ (5 days)│ │   │
│ │ Miguel   │ Measu│ 1   │ 09-20  │ 09-27   │ │   │
│ │ Cruz     │ Tape │     │        │ (6 days)│ │   │
│ │ ...                                        │   │
│ └─────────────────────────────────────────────┘   │
│ Showing 1-20 of 34 results                         │
│                                                     │
│ Active Lendings Summary:                           │
│ Total Active: 34                                    │
│ Due Soon (within 3 days): 12                       │
│ Overdue: 3                                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Recording a Lending

**Purpose**: Log when item is borrowed

#### Step-by-Step

1. Click **[+ Record Lending]** button
   - Opens **Create Lending Record** form

2. **Enter lending information**:
   ```
   BORROWER INFORMATION:
   Borrower Name*           [_____________________]
   (Trainee or staff name)
   
   Borrower Type*           [Trainee ▼]
   (Trainee or Staff)
   
   Borrower Contact*        [_____________________]
   (Phone or email)
   
   ITEM INFORMATION:
   Item*                    [Search/Select Item ▼]
   
   Quantity*                [____]
   (How many units)
   
   DATES:
   Lending Date*            [YYYY-MM-DD]
   (Today's date usually)
   
   Expected Return Date*    [YYYY-MM-DD]
   (When trainee should return)
   
   Duration*                [____] days
   (Auto-calculated from dates)
   
   NOTES:
   Reason                   [_____________________]
   (Training use, repair, etc.)
   
   Condition at Issue       [Good ▼]
   (Good, Fair, Poor)
   
   Special Instructions     [_____________________
                             _____________________]
   
   [Cancel] [Create Record]
   ```

3. **Fill all required fields**:
   - Borrower name and contact
   - Item name/ID
   - Quantity
   - Lending and return dates

4. Click **[Create Record]**
   - System validates:
     * Item exists
     * Sufficient quantity available
     * Return date after lending date
   - Lending record created
   - Item quantity updated
   - Success message shown

5. ✅ **Result**: Lending tracked, item marked as lent

---

### Tracking Borrowing Status

#### Active Lendings

1. Filter by **Status: [Active]**
   - Shows all current lendings
   - Items currently out

2. Each record shows:
   - Borrower name
   - Item name and quantity
   - Lending date
   - Expected return date
   - Days remaining

#### Due Soon

1. Look for **Due Soon** filter (within 3 days)
   - Highlight items to collect soon

2. **Send reminder**:
   - Click lending record
   - Click **[Send Reminder]**
   - Email sent to borrower
   - Message: "Please return item by [date]"

#### Overdue Items

1. Filter by **Status: [Overdue]**
   - Shows items past return date

2. Each overdue record shows:
   - Item name
   - Borrower
   - Due date
   - Days overdue
   - Status alert

3. **Send escalation**:
   - Click overdue record
   - Click **[Send Escalation]**
   - Stronger reminder sent
   - Message: "Item overdue as of [date]"
   - Consider contacting trainee/staff directly

---

### Recording Item Return

**Purpose**: Log when borrowed item is returned

#### Step-by-Step

1. From **Lendings List**, click active lending record
   - Opens **Lending Details** page

2. Click **[Record Return]**
   - Return dialog opens

3. **Enter return information**:
   ```
   Item: Drill Kit
   Borrowed: 2024-09-18 (4 days ago)
   Expected Return: 2024-09-22
   ✓ On time
   
   Actual Return Date*      [YYYY-MM-DD]
   (Today usually)
   
   Condition on Return*     [Good ▼]
   (Good, Fair, Poor, Damaged, Lost)
   
   If Damaged/Lost:
   Damage Description       [_____________________
                             _____________________]
   
   Replacement Needed       ☐ Yes  ☐ No
   
   Received By*             [_____________________]
   (Your name)
   
   Notes                    [_____________________]
   
   [Cancel] [Record Return]
   ```

4. **Fill return details**:
   - Return date (usually today)
   - Item condition
   - Any damage notes
   - Who received return

5. Click **[Record Return]**
   - Lending marked as "Returned"
   - Item quantity restored to inventory
   - Condition recorded
   - Success message shown

6. ✅ **Result**: Item returned and lending closed

---

### Handling Damages and Losses

#### Damaged Items

1. When recording return, select **Condition: [Damaged]**

2. Enter damage description:
   - "Cracked lens"
   - "One wheel not functioning"
   - "Handle broken"

3. System records:
   - Item status changed to "Maintenance"
   - Cannot be borrowed until repaired
   - Damage details logged

4. **Repair Workflow**:
   - Update item condition as repairs done
   - When repaired, change condition back to "Good"
   - Item available for borrowing again

#### Lost Items

1. When recording return, select **Condition: [Lost]**

2. Enter loss details:
   - "Not returned by trainee"
   - "Left at training site"
   - "Unknown"

3. System records:
   - Item marked as "Lost"
   - Quantity not restored
   - Incident logged

4. **Loss Resolution**:
   - Investigate with borrower
   - Document findings
   - Write off or pursue replacement
   - Update inventory

---

## Borrowing Slips

**URL:** `/staff/borrowing-slips`  
**Purpose:** Generate and print borrowing documentation

### Borrowing Slip Overview

#### What is a Borrowing Slip?

A borrowing slip is a physical or digital document that:
- Records what item is borrowed
- Shows who borrowed it
- Lists when it must be returned
- Provides space for signatures
- Can be printed and kept as record

#### Page Layout

```
┌─ Borrowing Slips ─────────────────────────────────┐
│                                                     │
│ [+ Generate Slip] [Print Queue]                    │
│                                                     │
│ Borrowing Slips:                                    │
│ ┌────────────────────────────────────────────┐    │
│ │ Slip # │ Item │ Borrower │ Date │ Status │ │    │
│ ├────────────────────────────────────────────┤    │
│ │ SLIP-  │ Drill│ John Doe │ 09-18│ Printed│ │    │
│ │ 001    │ Kit  │          │      │        │ │    │
│ │ SLIP-  │ Weld │ Jane     │ 09-19│ Printed│ │    │
│ │ 002    │ Glove│ Smith    │      │        │ │    │
│ │ SLIP-  │ Measu│ Miguel   │ 09-20│ Ready  │ │    │
│ │ 003    │ Tape │ Cruz     │      │ Print  │ │    │
│ │ ...                                       │    │
│ └────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Generating a Borrowing Slip

1. From **Borrowing Slips** page, click **[+ Generate Slip]**
   - Dialog opens

2. **Select lending**:
   ```
   Select Item to Generate Slip For:
   [Choose Lending Record ▼]
   
   (Shows recent active lendings)
   ```

3. Select the lending record
   - Item, borrower, and dates pre-filled

4. Click **[Generate Slip]**
   - Slip created
   - Slip number assigned (SLIP-001, etc.)
   - Ready for printing

5. ✅ **Result**: Slip generated

---

### Printing Borrowing Slips

#### Single Slip

1. From **Borrowing Slips** list, click slip
   - Opens **Slip Details** page

2. Click **[Print Slip]**
   - Print preview opens
   - Shows slip in printable format

3. Customize if needed:
   - Adjust font size
   - Add logo/header

4. Click **[Print]** in browser
   - Prints to default printer

#### Example Slip Format

```
╔══════════════════════════════════════════════════╗
║           BORROWING SLIP - BMDC 1.1              ║
║                                                  ║
║ Slip Number: SLIP-00001                         ║
║ Date Issued: September 18, 2024                 ║
║                                                  ║
║ ITEM DETAILS:                                    ║
║ Item Name: Drill Kit                             ║
║ Item ID: ITEM-045                                ║
║ Quantity: 1 unit                                 ║
║ Condition: Good                                  ║
║                                                  ║
║ BORROWER INFORMATION:                            ║
║ Name: John Doe                                   ║
║ Contact: +63-917-123-4567                        ║
║ Type: Trainee                                    ║
║                                                  ║
║ DATES:                                           ║
║ Borrowed: September 18, 2024                     ║
║ Due Return: September 22, 2024                   ║
║ Duration: 4 days                                 ║
║                                                  ║
║ PURPOSE:                                         ║
║ Training use                                     ║
║                                                  ║
║ SIGNATURES:                                      ║
║ Lender (Staff):  _______________                ║
║                   [Signature]                    ║
║                                                  ║
║ Borrower:       _______________                 ║
║                  [Signature]                     ║
║                                                  ║
║ Return Confirmation:                             ║
║ Received By:    _______________                 ║
║ Date:           _______________                 ║
║ Condition:      _______________                 ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

#### Bulk Print

1. From **Borrowing Slips** list:
   - Check boxes for multiple slips
   - Or click **[Select All]**

2. Click **[Print Selected]**
   - All selected slips in one print job
   - Can print to single or multiple pages

3. Click **[Print]**
   - All slips print together

---

### Managing Slip Status

| Status | Meaning | Action |
|--------|---------|--------|
| **Draft** | Generated but not printed | Print it |
| **Printed** | Printed and given to borrower | Confirm receipt |
| **Returned** | Item returned, slip archived | Store for records |
| **Voided** | Cancelled (error, etc.) | Discard |

#### Marking Slip as Printed

1. From slip details, click **[Mark as Printed]**
   - Confirms slip has been printed and given to borrower
   - Status changes to "Printed"

#### Voiding a Slip

**If slip generated in error or cancelled:**

1. From slip details, click **[Void Slip]**
   - Confirmation dialog
   - Reason required (optional)

2. Click **[Confirm Void]**
   - Slip marked as "Voided"
   - Not used further
   - Archived for audit trail

---

## Inventory Reports

**URL:** `/staff/reports`  
**Purpose:** Generate inventory and borrowing reports

### Available Reports

#### 1. Inventory Summary Report

**Shows**: Current state of all inventory

```
Steps:
1. Click [Inventory Summary Report]
2. Select all or specific categories
3. Click [Generate]

Report Shows:
- Item name and description
- Current quantity
- Minimum quantity
- Status (In Stock, Low, Out)
- Location
- Condition
- Reorder needs
```

#### 2. Stock Level Report

**Shows**: Detailed stock information

```
Report Shows Per Item:
- Current quantity
- Minimum level
- Quantity available
- Quantity out on loan
- Low stock alerts
- Recommendation to order
```

#### 3. Lending Summary Report

**Shows**: Borrowing activity overview

```
Report Shows:
- Total items borrowed this period
- Items currently out
- Items overdue
- Items returned on time
- Borrower list
- Lending dates and durations
```

#### 4. Overdue Items Report

**Shows**: Items past due date

```
Report Shows Per Item:
- Item name
- Borrower
- Borrow date
- Due date
- Days overdue
- Current status
```

#### 5. Damage/Loss Report

**Shows**: Damage and loss incidents

```
Report Shows:
- Item name and ID
- Date of incident
- Borrower involved
- Damage description
- Loss details
- Replacement status
```

#### 6. Usage Trends Report

**Shows**: Which items are used most

```
Report Shows:
- Item name
- Times borrowed this month/quarter
- Total borrowing days
- Borrowers (frequency)
- Peak usage periods
- Reorder recommendations based on usage
```

### Generating Reports

1. Click desired **Report** type

2. **Select parameters**:
   - Category (if applicable)
   - Date range
   - Borrower filter
   - Status filter

3. Click **[Generate Report]**
   - Report generated and displayed

4. **View on screen**:
   - Tables and data
   - Charts/visualizations
   - Summary statistics

5. **Export**:
   - Click **[Export CSV]** for spreadsheet
   - Click **[Export PDF]** for formatted document
   - Click **[Email Report]** to send

---

## Common Tasks

### Task 1: Set Up New Inventory Item

**Goal**: Add new training equipment to system

**Steps**:

1. **Create item**
   - Go to **Items** → [+ Create Item]
   - Fill all details
   - Upload image
   - Set minimum stock level

2. **Generate QR code**
   - System auto-generates
   - Download QR image
   - Print and attach to item

3. **Place in storage**
   - Affix QR code label
   - Store in designated location
   - Note location in system

4. **Test**
   - Scan QR code to verify
   - Try borrowing process

✅ **Result**: Item ready for borrowing

---

### Task 2: Process Item Borrowing

**Goal**: Lend item to trainee with proper documentation

**Steps**:

1. **Trainee requests item**
   - Either physically or through system

2. **Record lending**
   - Go to **Lendings** → [+ Record Lending]
   - Enter trainee info
   - Select item and quantity
   - Set return date

3. **Generate slip**
   - Go to **Borrowing Slips** → [+ Generate Slip]
   - Select lending just created
   - Generate slip

4. **Print slip**
   - Click slip
   - Click [Print Slip]
   - Print to paper

5. **Hand to trainee**
   - Give item and slip
   - Get trainee signature on slip
   - Keep copy for records

✅ **Result**: Item borrowed with documentation

---

### Task 3: Follow Up Overdue Items

**Goal**: Recover items past due return date

**Steps**:

1. **Check overdue items**
   - Go to **Dashboard**
   - See overdue items alerts
   - OR Filter lendings by Status: [Overdue]

2. **Send reminders**
   - For each overdue:
     * Click lending record
     * Click [Send Escalation]
     * Automated reminder sent

3. **Contact borrowers**
   - If no response to automated reminder
   - Call or visit trainee
   - Explain need to return

4. **Record return**
   - When item returned:
     * Go to lending record
     * Click [Record Return]
     * Note condition
     * Save

5. **Update inventory**
   - Item quantity restored
   - Condition assessed
   - If damaged, mark for repair

✅ **Result**: Overdue items recovered

---

### Task 4: Generate Monthly Inventory Report

**Goal**: Create inventory status report for management

**Steps**:

1. **Generate reports**
   - Go to **Reports**

2. **Create multiple reports**:
   - Click [Inventory Summary Report]
     * Shows all stock levels
     * Identifies low stock items
   - Click [Lending Summary Report]
     * Shows borrowing activity
     * Current items out
   - Click [Overdue Items Report]
     * Lists past-due returns
     * Days overdue

3. **Export all**
   - Click [Export PDF] on each
   - Save to computer

4. **Compile into one document**:
   - Use PDF software to combine
   - Add cover page
   - Add summary/recommendations

5. **Present to management**
   - Highlight:
     * Low stock items needing reorder
     * Overdue items needing follow-up
     * High-usage items for future budget
     * Items needing repair/replacement

✅ **Result**: Monthly inventory report completed

---

## Troubleshooting

### Issue: Item quantity incorrect

**Possible causes**:
- Math error on manual update
- Borrowing not recorded
- System glitch

**Solutions**:
1. Do physical count of item
2. Compare to system quantity
3. If different, click [Update Stock]
4. Enter correct quantity
5. Add reason: "Physical count correction"
6. System now accurate

### Issue: Can't create new item

**Possible causes**:
- Item name already exists
- Required fields not filled
- Category not selected

**Solutions**:
1. Use different item name (e.g., add version)
2. Verify all required fields filled
3. Select category from dropdown
4. Try again

### Issue: Borrowing slip won't print

**Possible causes**:
- Printer not connected
- Browser print dialog issue
- PDF generation error

**Solutions**:
1. Check printer is turned on and connected
2. Try refreshing page
3. Try different browser
4. Try [Export PDF] instead and print from file
5. Contact IT support if issue persists

### Issue: Can't find item in dropdown when creating lending

**Possible causes**:
- Item doesn't exist
- Item is deleted/archived
- Search term wrong

**Solutions**:
1. Create item first if new
2. Verify item exists on Items page
3. Try searching by partial name
4. Check item status (might be archived)
5. Refresh page and try again

### Issue: Item overdue but borrower claims returned

**Possible causes**:
- Return not recorded in system
- Confusion about which item
- Communication breakdown

**Solutions**:
1. Ask borrower to show item
2. Verify item identity (QR code check)
3. If item present:
   - Record return immediately
   - Ask borrower why return wasn't recorded
   - Note incident
4. If item not found:
   - Continue follow-up
   - Escalate if necessary
   - Document incident

---

## Security Considerations

### Best Practices

✅ **Do**:
- Keep inventory counts accurate
- Document all borrowing and returns
- Verify item condition before and after borrowing
- Follow up on overdue items promptly
- Store QR codes securely
- Keep slip records organized

❌ **Don't**:
- Lend items without recording
- Skip condition checks
- Ignore overdue items
- Share QR codes carelessly
- Modify past records without reason
- Delete items without archiving first

### Sensitive Operations

⚠️ Be careful with:
- **Recording loss**: Affects inventory count permanently
- **Damage reports**: May indicate trainee misuse
- **Bulk operations**: Can affect many items at once
- **Price/value updates**: Affects budget and asset tracking

---

## Support

For more help:
- Review [Security & Authentication](./06-SECURITY-AUTHENTICATION.md) for login issues
- Check [System Architecture](./08-SYSTEM-ARCHITECTURE.md) for technical details
- Contact local admin for permission or configuration issues

---

**Last Updated:** September 2026  
**Documentation Version:** 1.0  
**Role:** Staff Inventory Manager

[← Back to Main Documentation](./README.md)
