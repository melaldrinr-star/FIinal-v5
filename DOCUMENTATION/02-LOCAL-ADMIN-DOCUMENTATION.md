# Local Admin Documentation
## BMDC 1.1 - Organization Management

**Role:** Local Admin  
**Access Level:** Single tenant (organization/LGU)  
**Responsibility:** Organization management, staff oversight, trainee management

---

## Table of Contents

1. [Role Overview](#role-overview)
2. [Dashboard Page](#dashboard-page)
3. [Registrations Page](#registrations-page)
4. [Trainees Page](#trainees-page)
5. [Programs Page](#programs-page)
6. [Accounts Page](#accounts-page)
7. [Settings Page](#settings-page)
8. [Attendance Audit](#attendance-audit)
9. [Reports Page](#reports-page)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting](#troubleshooting)

---

## Role Overview

### What is a Local Admin?

A Local Admin is an organization-level administrator responsible for managing a single tenant (LGU, training center, or organization). Local Admins oversee all operations within their organization.

### Local Admin Responsibilities

| Responsibility | Description |
|---|---|
| **Registration Management** | Approve/reject trainee registrations, communicate decisions |
| **Trainee Management** | Manage trainee profiles, update information, track status |
| **Program Management** | Create training programs, set enrollment limits, manage curriculum |
| **Staff Oversight** | Create staff accounts (training coordinators, inventory managers) |
| **Configuration** | Set organizational branding, notification preferences, features |
| **Reporting** | Generate organization-wide reports and analytics |
| **Issue Resolution** | Handle support requests, manage exceptions |

### Access Level

Local Admins have:
- ✅ Full access to **own organization's data** (trainees, programs, enrollments)
- ✅ Read-only access to **cross-tenant data** (can see it exists but not modify)
- ✅ Read/Write access to **staff accounts** (training coordinators, inventory managers)
- ✅ No access to **other organizations'** data
- ✅ No access to **system-wide settings** (those are super admin only)

---

## Dashboard Page

**URL:** `/admin/dashboard`  
**Purpose:** Organization overview and quick access to main functions

### Page Layout

```
┌─ BMDC 1.1 - Admin Dashboard ──────────────────────┐
│                                                     │
│ Organization: LGU Manila                           │
│                                                     │
│ Quick Stats Row:                                    │
│ ┌──────────────┐  ┌──────────┐  ┌──────────┐     │
│ │ Pending      │  │ Active   │  │ Completed│     │
│ │ Registrations│  │ Trainees │  │ Programs │     │
│ │    12        │  │   324    │  │   4      │     │
│ │ +4 this week │  │ +24 MTD  │  │ +1 MTD   │     │
│ └──────────────┘  └──────────┘  └──────────┘     │
│                                                     │
│ Action Buttons (Top):                              │
│ [Approve Registrations] [View Trainees]            │
│ [Create Program] [Staff Accounts]                  │
│                                                     │
│ Charts & Activity:                                  │
│ ┌─────────────────┬───────────────────────────┐   │
│ │ Trainee Growth  │ Recent Registrations      │   │
│ │ (Area Chart)    │ • John Doe - pending      │   │
│ │                 │ • Jane Smith - pending    │   │
│ │                 │ • [8 more registrations] │   │
│ └─────────────────┴───────────────────────────┘   │
│                                                     │
│ Upcoming Training:                                  │
│ • Program: Electrical Installation                  │
│   Starts: 2024-10-01, Ends: 2024-11-30 (45 days) │
│ • Program: Welding Basics                          │
│   Starts: 2024-10-15, Ends: 2024-12-15 (60 days) │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dashboard Features

1. **Organization Name**
   - Shows which organization you're managing

2. **Quick Statistics**
   - Pending registrations (needs your approval)
   - Active trainees currently enrolled
   - Completed programs this month
   - Enrollments this month

3. **Action Buttons**
   - Quick links to common tasks:
     - Review pending registrations
     - View all trainees
     - Create new program
     - Manage staff accounts

4. **Activity Feed**
   - Recent registrations awaiting approval
   - New program enrollments
   - Completed programs

5. **Upcoming Programs**
   - Programs starting soon
   - Program duration and dates

### Using the Dashboard

1. **Review pending registrations**
   - See count of awaiting approval
   - Click count or [Approve Registrations] to review

2. **Monitor trainee activity**
   - See current active trainees
   - Growth trend
   - Click to view all trainees

3. **Track programs**
   - See programs coming up
   - View completion rates
   - Create new programs

---

## Registrations Page

**URL:** `/admin/registrations`  
**Purpose:** Review and approve/reject trainee self-service registrations

### Registrations List

#### Page Layout

```
┌─ Trainee Registrations ───────────────────────────┐
│                                                     │
│ Status: [All ▼] [Pending] [Approved] [Rejected]   │
│ [Search by name/email]                             │
│                                                     │
│ Pending Registrations Table:                        │
│ ┌──────────────────────────────────────────────┐  │
│ │ Name │ Email │ Program │ Registration│Status │  │
│ │      │       │         │ Date        │      │  │
│ ├──────────────────────────────────────────────┤  │
│ │ John │ john@ │ Elec-   │ 2024-09-14  │      │  │
│ │ Doe  │ ex.cm │ trical  │ 14:23       │[View]│  │
│ ├──────────────────────────────────────────────┤  │
│ │ Jane │ jane@ │ Welding │ 2024-09-14  │      │  │
│ │Smith │ ex.cm │ Basics  │ 15:45       │[View]│  │
│ ├──────────────────────────────────────────────┤  │
│ │ ...                                           │  │
│ └──────────────────────────────────────────────┘  │
│ Showing 1-10 of 12 results                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Viewing Registrations

1. Navigate to **Registrations** from admin menu
2. See list of pending registrations (default filter)
3. Each entry shows:
   - Trainee name
   - Email address
   - Selected program
   - Registration date/time
   - Status

#### Filtering Registrations

1. Use **Status** filter:
   - **Pending**: Awaiting your approval
   - **Approved**: Already approved by you
   - **Rejected**: You rejected them

2. Use **[Search]** field to find by:
   - Trainee name
   - Email address

---

### Reviewing a Registration

**Purpose**: Examine trainee details before approving/rejecting

#### Step-by-Step

1. Click **[View]** button on registration
   - Opens **Registration Details** modal

2. **Registration Details Modal** shows:
   ```
   ┌─ Registration Details ──────────────┐
   │                                      │
   │ PERSONAL INFORMATION:                │
   │ Name: John Doe                       │
   │ Email: john@example.com              │
   │ Phone: +63-917-123-4567              │
   │ Sex: Male                            │
   │ Birth Date: 1995-05-15               │
   │ Civil Status: Single                 │
   │                                      │
   │ ADDRESS:                             │
   │ Province: NCR                        │
   │ Municipality: Manila                 │
   │ Barangay: Malate                     │
   │ Street: 123 Taft Ave                 │
   │                                      │
   │ EDUCATION:                           │
   │ Educational Attainment: High School  │
   │ Course: N/A                          │
   │ Year Graduated: 2012                 │
   │                                      │
   │ EMPLOYMENT:                          │
   │ Classification: Unemployed            │
   │ Employment Status: Unemployed         │
   │ Disability: None                     │
   │                                      │
   │ PROGRAM:                             │
   │ Selected Program: Electrical Inst.   │
   │ Enrollment Date: 2024-10-01          │
   │                                      │
   │ [Approve] [Reject] [Close]           │
   │                                      │
   └──────────────────────────────────────┘
   ```

3. Review all information:
   - Verify trainee details are complete
   - Check if qualifications match program requirements
   - Look for any concerns or issues

4. Make decision (see below)

---

### Approving a Registration

**Purpose**: Accept trainee registration and create login credentials

#### Step-by-Step

1. From **Registration Details** modal, click **[Approve]**
   - Confirmation dialog appears

2. Confirmation message shows:
   ```
   Are you sure you want to approve this registration?
   
   This will:
   • Create a user account for John Doe
   • Create a trainee profile in the system
   • Add them to "Electrical Installation" program
   • Send login credentials via email
   • User can start marking attendance immediately
   
   [Cancel] [Confirm Approval]
   ```

3. Click **[Confirm Approval]**
   - Backend processes:
     * Creates users record with hashed password
     * Creates trainees record with profile data
     * Creates enrollment in selected program
     * Creates users_tenants association
     * Sends approval email with credentials
   
4. Success message: "Registration approved successfully"
   - Modal closes
   - Registration moves to "Approved" status
   - Trainee receives email with login instructions

5. ✅ **Result**: Trainee can now log in and begin training

💡 **What trainee receives in email**:
- Login URL
- Email address (used as username)
- Temporary password
- Instructions to change password on first login
- Link to training program

---

### Rejecting a Registration

**Purpose**: Decline trainee registration with explanation

#### Step-by-Step

1. From **Registration Details** modal, click **[Reject]**
   - Rejection dialog appears

2. Enter rejection reason:
   ```
   ┌─ Reject Registration ──────────────┐
   │                                     │
   │ Reason for Rejection:               │
   │ (Required - will be sent to trainee)│
   │                                     │
   │ [Dropdown]:                         │
   │ ○ Incomplete Information            │
   │ ○ Does Not Meet Requirements        │
   │ ○ Already Enrolled in Program       │
   │ ○ Program Full                      │
   │ ○ Other (Specify):                 │
   │   [_______________________]        │
   │                                     │
   │ Additional Notes (Optional):        │
   │ [_______________________________   │
   │  _______________________________]  │
   │                                     │
   │ [Cancel] [Reject Registration]     │
   │                                     │
   └─────────────────────────────────────┘
   ```

3. Select rejection reason:
   - Incomplete Information
   - Does Not Meet Requirements
   - Already Enrolled in Program
   - Program Full
   - Other (custom reason)

4. Optionally add additional notes for trainee

5. Click **[Reject Registration]**
   - Backend:
     * Updates pending_registration status to 'rejected'
     * Records rejection reason and your user ID
     * Sends rejection email to trainee
   
6. Success message: "Registration rejected"
   - Rejection recorded
   - Trainee receives email with reason
   - Can reapply with corrections

💡 **What trainee receives in rejection email**:
- Notification that application rejected
- Reason for rejection
- Additional notes you provided
- Instructions to reapply if desired

---

### Bulk Actions

#### Approving Multiple Registrations

1. On **Registrations List**:
   - Check boxes next to multiple registrations
   - Or use "Select All" checkbox for all on page

2. Click **[Approve Selected]** button
   - Confirmation dialog shows count
   - Click **[Confirm]**
   - All selected registrations approved at once

#### Rejecting Multiple Registrations

1. Check boxes next to multiple registrations
2. Click **[Reject Selected]**
   - Modal opens to set rejection reason for all
   - Enter reason and notes
   - Click **[Reject]**

---

## Trainees Page

**URL:** `/admin/trainees`  
**Purpose:** Manage all trainee profiles and information

### Trainees List

#### Page Layout

```
┌─ Trainees Management ─────────────────────────────┐
│                                                     │
│ [+ Create Trainee] [Bulk Import]                   │
│                                                     │
│ Search: [_____________________]                    │
│                                                     │
│ Filters:                                            │
│ Status: [All ▼]  Classification: [All ▼]           │
│ Program: [All ▼] Education: [All ▼]               │
│                                                     │
│ Trainees Table:                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Name │ Email │ Status │ Program │ Enroll│...│  │
│ │      │       │        │         │Date   │   │  │
│ ├─────────────────────────────────────────────┤   │
│ │ John │ john@│ Active │ Electrical│2024- │   │  │
│ │ Doe  │ ex.cm│        │ Inst     │10-01 │   │  │
│ │ Jane │ jane@│ Active │ Welding  │2024- │   │  │
│ │Smith │ ex.cm│        │ Basics   │10-15 │   │  │
│ └─────────────────────────────────────────────┘   │
│ Showing 1-20 of 324 results [Next]                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Viewing Trainees

1. Navigate to **Trainees** from admin menu
2. See list of all trainees in your organization
3. Each entry shows:
   - Trainee name
   - Email address
   - Current status (Active, Inactive, Completed, Dropped)
   - Primary program
   - Enrollment date

#### Searching Trainees

1. Enter search term in **[Search]** field
2. Filter by:
   - First name, last name, or email
   - Results update in real-time

#### Filtering Trainees

1. Use **Filters** dropdown:
   - **Status**: All, Active, Inactive, Completed, Dropped
   - **Classification**: All, OSY, Student, Unemployed, etc.
   - **Program**: All, or specific program
   - **Education**: All, Elementary, High School, SHS, College, etc.

2. Combine multiple filters as needed

3. Click **[Apply]** to update results

---

### Creating a Trainee (Manual Entry)

**Purpose**: Add trainee directly without going through registration approval

#### Step-by-Step

1. Click **[+ Create Trainee]** button
   - Opens **Create Trainee** form

2. Fill in trainee information:
   ```
   PERSONAL INFORMATION:
   First Name*              [_____________________]
   Last Name*               [_____________________]
   Middle Name              [_____________________]
   Email*                   [_____________________]
   Phone*                   [_____________________]
   Sex*                     [Male ▼]
   Birth Date*              [YYYY-MM-DD]
   Birth Place*             [_____________________]
   Civil Status*            [Single ▼]
   
   ADDRESS:
   Province*                [_____________________]
   Municipality*            [_____________________]
   Barangay*                [_____________________]
   Street*                  [_____________________]
   
   EDUCATION:
   Educational Attainment* [High School ▼]
   Course                   [_____________________]
   Year Graduated*          [YYYY]
   
   EMPLOYMENT:
   Classification*          [Unemployed ▼]
   Employment Status*       [Unemployed ▼]
   Disability               [None ▼]
   
   CONTACT:
   Emergency Contact Name   [_____________________]
   Emergency Contact Phone  [_____________________]
   
   PROGRAM:
   Select Program*          [Choose Program ▼]
   Enrollment Date*         [YYYY-MM-DD]
   
   [Cancel] [Create Trainee]
   ```

3. Fill all required fields (marked with *)

4. Click **[Create Trainee]**
   - System validates data
   - Trainee profile created
   - Automatically enrolled in selected program
   - Success message shown

5. ✅ **Result**: Trainee added to system and can begin training

---

### Viewing Trainee Profile

#### Step-by-Step

1. From **Trainees List**, click trainee name
   - Opens **Trainee Profile** page

2. Page shows comprehensive profile:
   ```
   ┌─ Trainee Profile: John Doe ─────────────┐
   │                                           │
   │ [Edit] [View Attendance] [View Certs]    │
   │                                           │
   │ PERSONAL INFORMATION:                     │
   │ Name: John Doe                            │
   │ Email: john@example.com                   │
   │ Phone: +63-917-123-4567                   │
   │ Sex: Male                                 │
   │ Birth Date: 1995-05-15 (Age: 29)         │
   │ Civil Status: Single                      │
   │                                           │
   │ ADDRESS:                                  │
   │ NCR, Manila, Malate, 123 Taft Ave        │
   │                                           │
   │ EDUCATION & EMPLOYMENT:                   │
   │ Education: High School (2012)             │
   │ Classification: Unemployed                │
   │ Employment Status: Unemployed             │
   │                                           │
   │ ENROLLMENT HISTORY:                       │
   │ Current Programs: 1                       │
   │ • Electrical Installation (2024-10-01)    │
   │   Status: Active                          │
   │   Attendance: 85% (17/20 days)            │
   │                                           │
   │ Completed Programs: 0                     │
   │                                           │
   │ ACTIVITY:                                 │
   │ Created: 2024-09-14 14:23                 │
   │ Last Updated: 2024-09-20 10:15            │
   │ Last Attendance: 2024-09-20 09:45         │
   │                                           │
   └─────────────────────────────────────────┘
   ```

3. View all trainee information and history

#### Editing Trainee Profile

1. Click **[Edit]** button
   - Form opens with current information

2. Modify fields as needed:
   - Contact information
   - Address
   - Employment status
   - Classification
   - Educational information

3. Click **[Save Changes]**
   - Profile updated
   - Changes logged to audit trail

#### Viewing Trainee Attendance

1. From trainee profile, click **[View Attendance]**
   - Opens attendance calendar for trainee
   - Shows all attendance records
   - Can audit or modify records if needed

#### Viewing Trainee Certificates

1. From trainee profile, click **[View Certs]**
   - Shows all certificates trainee has earned
   - Can verify certificate details
   - See certificate status and issuance dates

---

### Uploading Trainee Photos

#### Step-by-Step

1. From trainee profile page, find **Photo** section
2. Click **[Upload Photo]**
   - File picker opens

3. Select photo file (JPG, PNG)
   - Recommended: 500x500 pixels or larger
   - File size: Max 5 MB

4. System processes image:
   - Creates optimized version (Sharp)
   - Creates thumbnail (1/4 size)
   - Stores in cloud storage

5. Photo displayed on profile
   - Used in certificates
   - Shown in attendance records

---

### Bulk Import Trainees

**Purpose**: Add multiple trainees at once using CSV file

#### Step-by-Step

1. Click **[Bulk Import]** button
   - Dialog opens: "Import Trainees from CSV"

2. Download CSV template:
   - Click **[Download Template]**
   - Open in Excel or Google Sheets

3. Fill in trainee data:
   ```
   first_name,last_name,email,phone,sex,birth_date,province,municipality,barangay,street,educational_attainment,employment_status,program_id
   John,Doe,john@ex.com,+63-917-1234567,Male,1995-05-15,NCR,Manila,Malate,"123 Taft Ave",High School,Unemployed,<prog-uuid>
   Jane,Smith,jane@ex.com,+63-917-9876543,Female,1998-03-20,NCR,Quezon City,Cubao,"456 Araneta Ave",College,Unemployed,<prog-uuid>
   ```

4. Save CSV file

5. Back in system, click **[Choose File]**
   - Select your CSV file

6. Click **[Preview Import]**
   - Shows how many records will be imported
   - Highlights any errors

7. Click **[Import]** (if preview successful)
   - System processes all records
   - Creates trainees in batches
   - Shows results: "Imported 150 trainees, 2 errors"

8. ✅ **Result**: Bulk trainees added to system

---

## Programs Page

**URL:** `/admin/programs`  
**Purpose:** Create and manage training programs

### Programs List

#### Page Layout

```
┌─ Training Programs ───────────────────────────────┐
│                                                     │
│ [+ Create Program]                                  │
│                                                     │
│ Status: [All ▼] [Active] [Upcoming] [Completed]   │
│ [Search programs]                                   │
│                                                     │
│ Programs Table:                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Name │ Start Date │ End Date │ Status │ ...│  │
│ ├───────────────────────────────────────────────┤ │
│ │ Elect.│ 2024-10-01│ 2024-11-30│ Active│ ...│  │
│ │ Inst. │           │           │       │    │  │
│ │ Welding│ 2024-10-15│ 2024-12-15│ Active│ ...│  │
│ │ Basics│           │           │       │    │  │
│ └───────────────────────────────────────────────┘ │
│ Showing 1-10 of 12 results                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Creating a Program

**Purpose**: Set up new training program

#### Step-by-Step

1. Click **[+ Create Program]** button
   - Opens **Create Program** form

2. Fill in program details:
   ```
   BASIC INFORMATION:
   Program Name*            [_____________________]
   Description*             [_____________________
                             _____________________]
   
   SCHEDULE:
   Start Date*              [YYYY-MM-DD]
   End Date*                [YYYY-MM-DD]
   Duration (Weeks)*        [__] weeks
   
   INSTRUCTOR:
   Instructor Name          [_____________________]
   Instructor Email         [_____________________]
   
   ENROLLMENT:
   Max Trainees*            [___]
   Enrollment Limit*        [___] (max enrollments)
   Type of Funding*         [Choose ▼]
   
   DETAILS:
   Location/Venue           [_____________________]
   Curriculum               [_____________________]
   Prerequisites            [_____________________]
   
   MEDIA:
   Program Image            [Upload Image]
   
   [Cancel] [Create Program]
   ```

3. Fill all required fields:
   - **Program Name**: Unique name (e.g., "Electrical Installation")
   - **Description**: Details about the program
   - **Start/End Date**: Training period
   - **Max Trainees**: Maximum enrollment capacity
   - **Type of Funding**: Source of funding

4. Upload program image (optional)
   - Click **[Upload Image]**
   - Select JPG or PNG file
   - Image optimized automatically

5. Click **[Create Program]**
   - Validation checks performed:
     * End date must be after start date
     * Dates must be future dates (or current)
     * Max trainees > 0
   - Program created with status "Upcoming"
   - Success message shown

6. ✅ **Result**: Program created and ready for enrollments

---

### Editing Programs

#### Step-by-Step

1. From **Programs List**, click program name
   - Opens **Program Details** page

2. Click **[Edit]** button
   - Form opens with current data

3. Modify program information:
   - Name, description
   - Dates
   - Enrollment limits
   - Instructor
   - Location/venue

4. Click **[Save Changes]**
   - Changes validated and saved
   - Changes logged to audit trail

⚠️ **Note**: Cannot edit program after it starts (status changes to "Active")

---

### Managing Program Enrollment

#### Viewing Enrollments

1. From **Program Details**, click **[View Enrollments]** tab
   - Shows list of trainees enrolled in program

2. See:
   - Trainee name and email
   - Enrollment date
   - Current enrollment status
   - Attendance rate (if active)

#### Manual Enrollment

**Purpose**: Enroll trainee in program that wasn't auto-enrolled during registration

1. From **Program Details**, click **[+ Enroll Trainee]**
   - Modal opens: "Enroll Trainee"

2. Select trainee:
   ```
   Search Trainee: [________________]
   or
   [Choose from List ▼]
   ```

3. Click on trainee to select
   - Confirmation shown

4. Click **[Enroll]**
   - Backend creates enrollment record
   - Trainee can now access program
   - Trainee notified via email

#### Removing Trainee

1. From enrollment list, click **[Remove]** next to trainee
   - Confirmation dialog
   - Click **[Confirm Remove]**
   - Enrollment status changed to "Dropped"
   - Trainee can no longer access program

---

### Generating Public Enrollment Link

**Purpose**: Create shareable link for public enrollment (no login required)

#### Step-by-Step

1. From **Program Details**, click **[Generate Share Link]**
   - Link generation dialog opens

2. System creates:
   - Unique token for this share
   - Public URL: `https://your-domain/link/<token>`
   - QR code (optional)

3. Copy link or QR code:
   ```
   Share Link: https://your-domain/link/abc123def456
   
   [Copy Link] [Copy QR Code] [Email Link]
   ```

4. Share via:
   - **Email**: Click [Email Link] to auto-send
   - **Social Media**: Copy and paste link
   - **Print**: Generate QR code and print
   - **Website**: Embed link on website

5. Users click link → Bypass login → See program details → Click "Enroll" → Registration form with program pre-selected

---

### Program Status Lifecycle

```
UPCOMING
   │
   ├─ (Start date reached)
   │
   V
ACTIVE
   │
   ├─ (Trainees mark attendance)
   │
   ├─ (End date reached)
   │
   V
COMPLETED (if all trainees passed)
   or
CANCELLED (if admin manually ends)
```

| Status | Trainees Can... | Admin Can... |
|--------|-----------------|--------------|
| **Upcoming** | View program details | Edit program, enroll trainees |
| **Active** | Mark attendance, submit excuses | View attendance, audit records |
| **Completed** | Download certificates | Generate final reports, modify records |
| **Cancelled** | View program (archived) | View reports only |

---

## Accounts Page

**URL:** `/admin/accounts`  
**Purpose:** Manage staff user accounts for your organization

### Accounts List

#### Page Layout

```
┌─ Staff Accounts ──────────────────────────────────┐
│                                                     │
│ [+ Create Staff Account]                            │
│                                                     │
│ Role: [All ▼] Status: [All ▼]                      │
│ [Search staff]                                      │
│                                                     │
│ Staff Accounts Table:                               │
│ ┌──────────────────────────────────────────────┐  │
│ │ Name │ Email │ Role │ Status │ Last Login │  │
│ ├──────────────────────────────────────────────┤  │
│ │ Maria│ maria │ Train│ Active │ 2024-09-20 │  │
│ │      │@ex.cm │ Coord │        │ 14:30     │  │
│ │ Miguel│miguel │Invtr │ Active │ 2024-09-20 │  │
│ │      │@ex.cm │ Mgr   │        │ 09:15     │  │
│ └──────────────────────────────────────────────┘  │
│ Showing 1-10 of 5 results                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Creating Staff Account

**Purpose**: Add training coordinator or inventory manager

#### Step-by-Step

1. Click **[+ Create Staff Account]**
   - Modal opens: "Create Staff Account"

2. Fill staff information:
   ```
   First Name*              [_____________________]
   Last Name*               [_____________________]
   Email*                   [_____________________]
   
   Role*                    [Choose Role ▼]
   
   Role Options:
   • Training Coordinator (manage attendance, programs)
   • Inventory Manager (manage equipment, borrowing)
   
   Status                   [Active ▼]
   
   Password*                [_____________________]
   (Min 8 chars, mix upper/lower/numbers)
   
   Confirm Password*        [_____________________]
   
   [Cancel] [Create Account]
   ```

3. Enter staff details:
   - Full name
   - Email (must be unique)
   - Select role based on responsibility
   - Set password or let system generate

4. Click **[Create Account]**
   - Validation:
     * Email uniqueness checked
     * Password complexity verified
   - Account created
   - Email sent with login credentials
   - Success message shown

5. ✅ **Result**: Staff member can log in

💡 **What staff receives in email**:
- Login URL
- Email address (username)
- Temporary password
- Instructions to change password

---

### Managing Staff Accounts

#### Viewing Staff Member

1. From **Accounts List**, click staff name
   - Opens **Staff Member Details** page

2. Shows:
   - Full name
   - Email
   - Role
   - Status
   - Created date
   - Last login date/time
   - Action buttons

#### Resetting Password

1. From staff member details, click **[Reset Password]**
   - Confirmation dialog
   - New temporary password generated
   - Email sent to staff member
   - Staff can log in and change password

#### Changing Role

1. From staff member details:
   - Click **Role** dropdown
   - Select new role:
     * Training Coordinator
     * Inventory Manager

2. Click **[Save]**
   - Role updated
   - User not logged out
   - User may need to refresh page for new permissions

#### Deactivating Account

1. From staff member details:
   - Click **Status** dropdown
   - Select **Inactive**

2. Click **[Save]**
   - Account deactivated
   - Staff cannot log in
   - Data retained for audit purposes

#### Reactivating Account

1. From staff member details:
   - Click **Status** dropdown
   - Select **Active**

2. Click **[Save]**
   - Account reactivated
   - Staff can log in again

---

## Settings Page

**URL:** `/admin/settings`  
**Purpose:** Configure organization branding and features

### Settings Sections

#### Page Layout

```
┌─ Organization Settings ───────────────────────────┐
│                                                     │
│ Settings Tabs:                                      │
│ [General] [Branding] [Notifications] [Features]   │
│                                                     │
│ ─ General Settings ────────────────────────────   │
│ Organization Name: [LGU Manila_____________]      │
│ Contact Email: [admin@lgumanila.gov.ph___]       │
│ Contact Phone: [+63-2-123-4567_____________]      │
│ Time Zone: [Asia/Manila ▼]                        │
│                                                     │
│ ─ Branding ────────────────────────────────────  │
│ Logo: [Upload Image]                              │
│ Primary Color: [#FF6B6B ▼] (color picker)         │
│ Secondary Color: [#4ECDC4 ▼]                      │
│ Welcome Message:                                   │
│ [_____________________________               │
│  _____________________________]              │
│                                                     │
│ ─ Notifications ────────────────────────────────  │
│ ☑ Email Notifications Enabled                     │
│ ☑ SMS Notifications Enabled                       │
│ ☑ Push Notifications Enabled                      │
│                                                     │
│ ─ Features ─────────────────────────────────────  │
│ ☑ Inventory Management                            │
│ ☑ Certificates                                     │
│ ☑ Public Enrollment Links                         │
│ ☑ Attendance Exceptions                           │
│                                                     │
│ [Save Changes]                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### General Settings

1. Click **[General]** tab
2. Update organization information:
   - Organization name (as shown in UI)
   - Contact email
   - Contact phone
   - Time zone (for scheduling)

3. Click **[Save Changes]**

### Branding Settings

1. Click **[Branding]** tab
2. Customize appearance:
   - **Logo**: Upload PNG/JPG file (recommended 200x100px)
   - **Primary Color**: Choose brand color (hex or color picker)
   - **Secondary Color**: Choose accent color
   - **Welcome Message**: Custom greeting message

3. Click **[Save Changes]**
   - Changes reflected immediately in UI
   - Applies to trainee portal and staff dashboard

### Notification Settings

1. Click **[Notifications]** tab
2. Toggle notification channels:
   - ☑ Email notifications (approval/rejection emails, alerts)
   - ☑ SMS notifications (important alerts via text)
   - ☑ Push notifications (in-app alerts)

3. Set up notification channels:
   - SMTP/Email configuration
   - SMS gateway (Twilio, etc.)
   - Push notification service

4. Click **[Test Notifications]** to verify
5. Click **[Save Changes]**

### Feature Flags

1. Click **[Features]** tab
2. Enable/disable features for organization:
   - ☑ Inventory Management (equipment tracking)
   - ☑ Certificates (course completion certs)
   - ☑ Public Enrollment Links (social sharing)
   - ☑ Attendance Exceptions (holidays, makeup sessions)

3. Unchecking feature disables it for all staff
4. Click **[Save Changes]**

---

## Attendance Audit

**URL:** `/admin/attendance`  
**Purpose:** Review and audit trainee attendance records

### Attendance Records

#### Page Layout

```
┌─ Attendance Records Audit ────────────────────────┐
│                                                     │
│ Filters:                                            │
│ Program: [All ▼]  Trainee: [Search...]            │
│ Date Range: [From] [To] [Apply]                   │
│ Status: [All ▼]  [Present] [Absent] [Excused]    │
│                                                     │
│ Attendance Records:                                 │
│ ┌──────────────────────────────────────────────┐  │
│ │ Date │ Trainee │ Program │ Morning │ Afternoon│ │
│ │      │         │         │ Status  │ Status   │ │
│ ├──────────────────────────────────────────────┤  │
│ │09-20 │ John    │ Elec.   │ Present │ Present  │  │
│ │      │ Doe     │ Inst.   │ 08:45   │ 13:30    │  │
│ │09-20 │ Jane    │ Welding │ Absent  │ Absent   │  │
│ │      │ Smith   │ Basics  │ -       │ -        │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ [Export CSV] [Export PDF]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Viewing Attendance

1. Navigate to **Attendance** from admin menu
2. See all attendance records for organization
3. Each record shows:
   - Attendance date
   - Trainee name
   - Program name
   - Morning status and time
   - Afternoon status and time

### Filtering Attendance

1. Use filters:
   - **Program**: Filter by specific program
   - **Trainee**: Search by name
   - **Date Range**: Select start/end dates
   - **Status**: Present, Absent, Excused

2. Click **[Apply]** to update

### Auditing Records

1. Click on attendance record
   - Opens **Attendance Details**

2. Shows:
   - Photo/selfie taken during attendance
   - Time in/time out
   - Device information
   - GPS location
   - Any notes

3. As admin, can:
   - Review for accuracy
   - Check photo verification
   - Verify times make sense
   - Note any concerns

### Modifying Records

⚠️ **Only in specific cases (errors, makeup sessions, etc.)**

1. From record details, click **[Edit]**
2. Modify:
   - Attendance date
   - Morning/afternoon status
   - Add notes/explanation

3. Click **[Save]**
   - Change logged to audit trail
   - Original data retained for historical record

---

## Reports Page

**URL:** `/admin/reports`  
**Purpose:** Generate organization reports and analytics

### Available Reports

#### 1. Attendance Report

**Shows**: Trainee attendance data by program and date range

```
Steps:
1. Click [Attendance Report] tab
2. Select program (or all)
3. Set date range
4. Click [Generate]
5. View table or [Export CSV/PDF]

Data Shown:
- Trainee name
- Days present/absent
- Attendance percentage
- Trend (improving/declining)
```

#### 2. Enrollment Report

**Shows**: Program enrollment and completion data

```
Steps:
1. Click [Enrollment Report] tab
2. Select time period
3. Click [Generate]

Data Shown:
- Total enrollments
- Enrollments by program
- Completion rate
- Dropout rate
```

#### 3. Trainee Demographics Report

**Shows**: Trainee population statistics

```
Data Shown:
- Age distribution
- Education level breakdown
- Employment status
- Classification distribution
- Regional distribution
```

#### 4. Program Performance Report

**Shows**: How each program is performing

```
Data Shown Per Program:
- Total trainees
- Average attendance
- Completion rate
- Trainee feedback (if available)
- Program duration actual vs planned
```

#### 5. Staff Activity Report

**Shows**: What staff members are doing

```
Data Shown:
- Logins per staff member
- Activities performed
- Data modifications
- Records accessed
- Active hours
```

### Generating Reports

1. Click desired **Report** tab
2. Select filters:
   - Program
   - Date range
   - Trainee status
   - Data type

3. Click **[Generate Report]**
   - Report generated and displayed

4. **On-screen viewing**:
   - View tables and charts
   - Scroll through data

5. **Export**:
   - Click **[Export CSV]** for spreadsheet
   - Click **[Export PDF]** for formatted document
   - Click **[Email Report]** to send to email

---

## Common Tasks

### Task 1: Complete Registration Approval Workflow

**Goal**: Handle incoming trainee registration from approval to activation

**Steps**:

1. **Review pending**
   - Go to **Registrations**
   - See count of pending applications

2. **Examine each application**
   - Click [View] on first registration
   - Review trainee information
   - Check if qualifications match program

3. **Make decision**
   - Click [Approve] if acceptable
   - Or [Reject] with reason if concerns

4. **Notify trainee**
   - System sends email automatically
   - Approved: Login credentials
   - Rejected: Reason and reapply instructions

5. **Monitor**
   - Go to **Dashboard**
   - Check updated pending count
   - Verify approved trainees appear in Trainees list

✅ **Result**: New trainees activated and ready to start training

---

### Task 2: Create New Training Program with Enrollment

**Goal**: Launch new program and start enrolling trainees

**Steps**:

1. **Create program**
   - Go to **Programs** → [+ Create Program]
   - Fill program details
   - Set dates and enrollment limit
   - Upload program image

2. **Enroll trainees**
   - From program details, click [+ Enroll Trainee]
   - Select trainees
   - Confirm enrollment

3. **Generate share link** (optional)
   - Click [Generate Share Link]
   - Share on social media/email for public enrollment

4. **Configure attendance**
   - Staff training coordinator sets up non-attendance dates
   - Configure time windows (morning/afternoon)

5. **Notify trainees**
   - System sends enrollment confirmations
   - Trainees can start marking attendance

✅ **Result**: Program running and trainees can participate

---

### Task 3: Investigate Attendance Anomaly

**Goal**: Audit specific trainee's attendance for irregularities

**Steps**:

1. **Go to Attendance**
   - Navigate to **Attendance** audit page

2. **Filter by trainee**
   - Enter trainee name
   - Select specific program if multiple

3. **Review records**
   - Look for patterns:
     * Consistent timing (arriving late/early?)
     * Photo verification (same location?)
     * Gaps in attendance

4. **Drill into record**
   - Click specific date record
   - View photo, time stamps, GPS location
   - Check device information

5. **Take action**
   - If legitimate concern (fraud, etc.):
     * Document findings
     * Contact trainee or staff coordinator
     * Escalate to super admin if needed
   - If just curious:
     * Review for own understanding

✅ **Result**: Attendance integrity verified

---

## Troubleshooting

### Issue: Registration approval failing

**Possible causes**:
- Email already exists in system
- Program no longer available
- Database connection issue

**Solutions**:
1. Check email isn't already registered
2. Try rejecting and having trainee reapply
3. Verify program still active
4. Refresh page and try again
5. Contact super admin if persists

### Issue: Can't create new staff account

**Possible causes**:
- Email already in use
- Password doesn't meet requirements
- Permission issue

**Solutions**:
1. Use different email address
2. Password must be 8+ chars with upper/lower/numbers
3. Verify you're logged in as local admin
4. Try creating again after page refresh

### Issue: Trainees can't log in after approval

**Possible causes**:
- Email address typo
- Password reset needed
- Account inactive

**Solutions**:
1. Verify trainee email in system matches registration
2. Reset trainee password from Trainees page
3. Check trainee account status is "Active"
4. Have trainee try in different browser/device

### Issue: Program won't start (trainees can't mark attendance)

**Possible causes**:
- Program start date in future
- Program not yet "Active"
- Trainee not properly enrolled

**Solutions**:
1. Check program start date is today or earlier
2. Verify program status is "Active"
3. Check trainee appears in program enrollment list
4. Verify trainee account is Active
5. Ask trainee to log out and log back in

---

## Security Considerations

### Best Practices

✅ **Do**:
- Keep password secure and change regularly
- Review registrations carefully before approval
- Regularly audit staff activity
- Verify trainee information accuracy
- Monitor unusual patterns in attendance

❌ **Don't**:
- Share your admin account login
- Approve registrations without reviewing
- Modify attendance records without reason
- Delete trainee data without archiving
- Leave account logged in unattended

### Sensitive Operations

⚠️ Be careful with:
- Bulk imports (verify data before importing)
- Registrations approvals (commitment to trainee)
- Staff account creation (affects system access)
- Attendance record modifications (affects certifications)
- Program settings changes (affects all enrolled trainees)

---

## Support

For more help:
- Review [Security & Authentication](./06-SECURITY-AUTHENTICATION.md) for login issues
- Check [System Architecture](./08-SYSTEM-ARCHITECTURE.md) for technical details
- Contact super admin for escalated issues

---

**Last Updated:** September 2026  
**Documentation Version:** 1.0  
**Role:** Local Admin

[← Back to Main Documentation](./README.md)
