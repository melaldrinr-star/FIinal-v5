# Staff Training Coordinator Documentation
## BMDC 1.1 - Attendance & Program Management

**Role:** Staff Training Coordinator  
**Access Level:** Single tenant (organization)  
**Responsibility:** Attendance tracking, program coordination, certificate generation

---

## Table of Contents

1. [Role Overview](#role-overview)
2. [Dashboard Page](#dashboard-page)
3. [Attendance Page](#attendance-page)
4. [Non-Attendance Dates](#non-attendance-dates)
5. [Programs Page](#programs-page)
6. [Certificate Generation](#certificate-generation)
7. [Reports & Analytics](#reports--analytics)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Role Overview

### What is a Training Coordinator?

A Training Coordinator is a staff member who manages day-to-day training operations. Training Coordinators are responsible for:

- Tracking trainee attendance
- Reviewing attendance submissions
- Managing program coordination
- Setting up attendance schedules and exceptions
- Generating certificates
- Monitoring trainee progress
- Creating reports and analytics

### Training Coordinator Responsibilities

| Responsibility | Description |
|---|---|
| **Attendance Tracking** | Record and verify daily trainee attendance, review photo evidence |
| **Attendance Management** | Set up non-attendance dates (holidays, makeup sessions) |
| **Program Coordination** | Monitor program schedule, coordinate enrollment changes |
| **Certificate Generation** | Generate and issue certificates upon program completion |
| **Progress Monitoring** | Track trainee attendance rates and performance |
| **Reporting** | Create attendance and performance reports |
| **Issue Resolution** | Handle attendance disputes and exceptions |

### Access Level

Training Coordinators have:
- ✅ Read/Write access to **attendance records** (can view and audit all trainee attendance)
- ✅ Read access to **trainee profiles** (view trainee information)
- ✅ Read access to **programs** (view program details and enrollment)
- ✅ Write access to **certificates** (generate and issue certificates)
- ✅ Write access to **attendance exceptions** (set non-attendance dates)
- ✅ No access to **trainee management** (cannot create/delete trainees - admin only)
- ✅ No access to **staff accounts** (cannot create/modify accounts - admin only)

---

## Dashboard Page

**URL:** `/staff/dashboard`  
**Purpose:** Overview of training operations and quick access to key functions

### Page Layout

```
┌─ Training Coordinator Dashboard ──────────────────┐
│                                                     │
│ Organization: LGU Manila                           │
│                                                     │
│ Today's Summary:                                    │
│ ┌──────────────┐  ┌──────────┐  ┌──────────┐     │
│ │ Marked       │  │ Not Yet  │  │ Programs │     │
│ │ Attendance   │  │ Marked   │  │ Running  │     │
│ │    187       │  │   34     │  │   4      │     │
│ │ (84%)        │  │ (16%)    │  │          │     │
│ └──────────────┘  └──────────┘  └──────────┘     │
│                                                     │
│ Quick Actions:                                      │
│ [Mark Attendance] [View All Attendance]            │
│ [Set Non-Attendance Dates] [Generate Certificate] │
│                                                     │
│ Active Programs:                                    │
│ Program Name           Trainees  Avg Attendance    │
│ • Electrical Inst.       89         92%            │
│ • Welding Basics        76         85%            │
│ • Auto Repair           45         78%            │
│ • Safety Training       34         88%            │
│                                                     │
│ Recent Activities:                                  │
│ • 234 trainees marked attendance today            │
│ • Certificate issued to 5 trainees                │
│ • 3 attendance exceptions applied                 │
│                                                     │
│ Alerts:                                             │
│ ⚠️ 5 trainees below 80% attendance threshold      │
│ ⚠️ Program "Welding" ends in 7 days               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dashboard Features

1. **Today's Summary**
   - How many trainees marked attendance today
   - How many haven't marked yet
   - Number of active programs

2. **Quick Actions**
   - Links to most common tasks:
     * Mark attendance
     * View all attendance records
     * Configure non-attendance dates
     * Generate certificates

3. **Active Programs List**
   - Current running programs
   - Number of trainees in each
   - Average attendance percentage
   - Click to view program details

4. **Recent Activities Feed**
   - System notifications
   - Number of trainees marked today
   - Certificates issued
   - Exceptions applied

5. **Alerts**
   - Trainees below attendance threshold
   - Programs ending soon
   - Other important notices

---

## Attendance Page

**URL:** `/staff/attendance`  
**Purpose:** Manage daily trainee attendance tracking

### Attendance Overview

#### Page Layout

```
┌─ Attendance Management ────────────────────────────┐
│                                                     │
│ Date: [2024-09-20 ▼]                               │
│ Program: [All Programs ▼]                          │
│ Show: [All] [Pending] [Marked] [Absent]           │
│                                                     │
│ Attendance Status Summary:                          │
│ ┌─────────────────────────────────────────────┐   │
│ │ Today's Attendance Status (by Program):      │   │
│ │ Program        │ Expected │ Marked │ %     │   │
│ ├─────────────────────────────────────────────┤   │
│ │ Electrical     │    89    │   89   │ 100%  │   │
│ │ Welding        │    76    │   64   │ 84%   │   │
│ │ Auto Repair    │    45    │   38   │ 84%   │   │
│ │ Safety         │    34    │   29   │ 85%   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Attendance Records (by Trainee):                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ Trainee Name │ Program │ Morning │ Afternoon│  │
│ ├──────────────────────────────────────────────┤  │
│ │ John Doe     │ Elec.   │  ✓ 08:45│ ✓ 13:30 │  │
│ │ Jane Smith   │ Welding │  ✓ 08:30│ ✗ Absent│  │
│ │ Miguel Cruz  │ Elec.   │  ✗ Pend │ ✗ Pend  │  │
│ │ [Show more...]                               │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Using Attendance Page

1. **Select date**
   - Click date picker
   - Choose date to view/mark attendance
   - Default is today

2. **Filter by program**
   - Select specific program
   - Or "All Programs" to see all

3. **View summary**
   - See total expected trainees
   - How many marked attendance
   - Overall percentage for each program

4. **Review records**
   - See each trainee's status
   - Click to view or edit record
   - Photos, time stamps visible

---

### Marking Attendance

**Purpose**: Record trainee attendance with photo verification

#### For Individual Trainee (Admin Entry)

1. From **Attendance Page**, click trainee name
   - Opens **Attendance Details** modal

2. **Entry form shows**:
   ```
   ┌─ Mark Attendance: John Doe ─────────┐
   │ Program: Electrical Installation     │
   │ Date: 2024-09-20                     │
   │                                       │
   │ MORNING SESSION:                      │
   │ Status: [Present ▼] [Absent] [Excused]
   │ Time In:  [08:45]                    │
   │ Time Out: [12:00]                    │
   │ Photo: [View Photo] ✓ Verified       │
   │                                       │
   │ AFTERNOON SESSION:                    │
   │ Status: [Pending ▼]                  │
   │ Time In:  [_____]                    │
   │ Time Out: [_____]                    │
   │ Photo: [No photo yet]                │
   │                                       │
   │ Notes (if excuse): [____________]    │
   │                                       │
   │ [Cancel] [Save Changes]              │
   └─────────────────────────────────────┘
   ```

3. **For each session**:
   - Set status: Present, Absent, or Excused
   - Enter time in and time out
   - View photo if provided (trainee took it)
   - Add notes if needed

4. **Click [Save Changes]**
   - Record updated
   - Saved to database
   - Audit logged

#### What Trainees Do (Self-Service)

Trainees mark their own attendance:

1. **Morning** (typically 6:00 AM - 12:00 PM window)
   - Open Trainee app
   - Navigate to Attendance
   - Click "Mark Morning Attendance"
   - Takes selfie to prove presence
   - Confirms time in/out
   - Submits

2. **Afternoon** (typically 1:00 PM - 5:00 PM window)
   - Click "Mark Afternoon Attendance"
   - Takes selfie
   - Confirms time in/out
   - Submits

3. **You review**
   - Attendance appears in your dashboard
   - Photo verification helps confirm legitimacy
   - You can audit or modify if needed

---

### Reviewing Attendance Records

1. **Access attendance records**
   - Go to **Attendance** page
   - Select date and program

2. **Click on specific record**
   - Opens record details:
     * Trainee photo/selfie
     * Time in/out timestamps
     * GPS location (if available)
     * Device information
     * Any notes

3. **Verify authenticity**
   - Check photo matches trainee
   - Check times make sense (not 4 AM arrival)
   - Check location is reasonable (GPS matches venue)

4. **If legitimate**: No action needed

5. **If suspicious**: 
   - Take notes
   - Contact trainee or local admin
   - May need to mark as "Excused" pending investigation
   - Escalate if fraud suspected

---

### Bulk Attendance Entry

**For days when trainees didn't use app (system down, etc.)**

1. Click **[Bulk Mark Attendance]** button
   - Opens bulk entry interface

2. **Entry form**:
   ```
   ┌─ Bulk Mark Attendance ──────────────┐
   │ Date: [2024-09-20]                  │
   │ Program: [Select Program ▼]         │
   │                                      │
   │ Trainees to Mark:                   │
   │ ☑ John Doe      ○ Present ○ Absent │
   │ ☑ Jane Smith    ○ Present ○ Absent │
   │ ☑ Miguel Cruz   ○ Present ○ Absent │
   │ ☑ Maria Santos  ○ Present ○ Absent │
   │ [Check All] [Uncheck All]           │
   │                                      │
   │ Session: [Morning ▼]                │
   │                                      │
   │ [Cancel] [Mark Selected]            │
   └─────────────────────────────────────┘
   ```

3. **Select trainees**:
   - Check boxes for who to mark

4. **Select status** for each:
   - Present or Absent

5. **Select session**:
   - Morning or Afternoon

6. **Click [Mark Selected]**
   - All selected trainees marked with status
   - Records saved
   - Audit trail logged

---

### Handling Absences & Excuses

#### Marking as Absent

1. **If trainee didn't submit**:
   - System defaults to "No submission"
   - You must explicitly mark as Absent

2. **From attendance record**:
   - Click [Edit]
   - Set status to "Absent"
   - Click [Save]

#### Marking as Excused

**When trainee has valid reason (sick, emergency, etc.)**

1. From attendance record, click [Edit]

2. Set status to "Excused"

3. Add reason note:
   - "Sick leave - medical certificate provided"
   - "Emergency family matter"
   - "Approved makeup session"

4. Click [Save]

---

### Attendance Statistics

#### Viewing Trainee Statistics

1. From **Attendance Page**, click trainee name
   - Opens **Trainee Details**

2. Shows attendance summary:
   ```
   Attendance Summary (Program: Electrical Installation)
   ─────────────────────────────────────────────────────
   Total Training Days: 20
   Days Present: 17
   Days Absent: 2
   Days Excused: 1
   
   Attendance Rate: 85%  (17/20 days)
   
   Attendance Trend:
   Week 1: 100% (5/5)
   Week 2: 80%  (4/5)
   Week 3: 60%  (3/5)  ⬇️ Declining!
   Week 4: 100% (5/5)  ⬆️ Recovering
   ```

3. **Identify concerns**:
   - If below 80%: Potential at-risk trainee
   - If declining trend: May need intervention
   - If pattern (e.g., always Mondays): Investigate

#### Generating Attendance Report

1. Go to **Reports** → [Attendance Report]
2. Set date range and program
3. Generate report showing all attendance data
4. Export as CSV or PDF

---

## Non-Attendance Dates

**URL:** `/staff/non-attendance-dates`  
**Purpose:** Configure holidays, days off, and schedule adjustments

### Non-Attendance Dates Overview

#### Page Layout

```
┌─ Non-Attendance Dates Management ─────────────────┐
│                                                     │
│ [+ Add Non-Attendance Date]                         │
│                                                     │
│ Non-Attendance Dates:                               │
│ ┌──────────────────────────────────────────────┐  │
│ │ Date       │ Type │ Programs │ Reason       │  │
│ ├──────────────────────────────────────────────┤  │
│ │ 2024-10-15 │ Full │ All      │ Holiday -    │  │
│ │            │ Day  │          │ Foundation   │  │
│ │ 2024-11-01 │ Full │ All      │ Holiday -    │  │
│ │            │ Day  │          │ All Saints   │  │
│ │ 2024-12-15 │ Prtl │ Welding  │ Makeup       │  │
│ │            │      │          │ session      │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Creating Non-Attendance Date

**Purpose**: Mark day when attendance not required/expected

#### Step-by-Step

1. Click **[+ Add Non-Attendance Date]** button
   - Modal opens: "Add Non-Attendance Date"

2. **Fill details**:
   ```
   Date*                    [YYYY-MM-DD]
   (The date to mark off)
   
   Type*                    [Full Day ▼]
   Options:
   • Full Day - no attendance required all day
   • Partial - specific time window
   • Makeup Session - alternative training day
   
   Exception Type*          [Holiday ▼]
   Options:
   • Holiday (national, local)
   • Schedule Override (program adjustment)
   • Makeup Session (make up for missed training)
   • Special Event
   
   Programs Affected*       [Select Programs ▼]
   (All or specific programs)
   
   Reason*                  [_____________________]
   (Description: "Foundation Day Holiday")
   
   If Partial, set times:
   Morning Open:  [HH:MM]
   Morning Close: [HH:MM]
   Afternoon Open: [HH:MM]
   Afternoon Close: [HH:MM]
   
   [Cancel] [Create]
   ```

3. **Fill all required fields**

4. Click **[Create]**
   - System validates dates
   - Exception created
   - Affects all trainees on that date
   - Success message shown

5. ✅ **Result**: Attendance not required on that date

---

### Types of Non-Attendance Exceptions

| Type | Usage | Effect |
|------|-------|--------|
| **Full Day Off** | National holiday, local holiday | No trainees expected all day |
| **Partial Day** | Event, early dismissal | Different hours than normal |
| **Makeup Session** | Make up for cancelled training | Extra session offered |
| **Schedule Override** | Program reschedule | Specific programs affected |

### Examples

#### National Holiday
- **Date**: November 1, 2024 (All Saints Day)
- **Type**: Full Day
- **Programs**: All
- **Effect**: All trainees excused automatically

#### Program-Specific Makeup
- **Date**: December 15, 2024
- **Type**: Makeup Session
- **Programs**: Welding Basics only
- **Time**: 08:00-12:00 (morning only)
- **Effect**: Only Welding trainees, only morning session

#### Early Dismissal
- **Date**: December 24, 2024 (Christmas Eve)
- **Type**: Partial Day
- **Programs**: All
- **Afternoon**: Closed (13:00-17:00)
- **Effect**: Morning attendance required, afternoon excused

---

### Managing Non-Attendance Dates

#### Editing Exception

1. From list, click exception row
   - Opens **Edit Exception** form

2. Modify:
   - Date
   - Type
   - Programs affected
   - Reason

3. Click **[Save Changes]**

#### Deleting Exception

1. From list, click **[Delete]** button
   - Confirmation dialog

2. Click **[Confirm Delete]**
   - Exception removed
   - Trainees now expected to mark attendance

⚠️ **Note**: If already applied, past attendance records not changed

---

## Programs Page

**URL:** `/staff/programs`  
**Purpose:** View and coordinate training programs

### Programs Overview

#### Page Layout

```
┌─ Training Programs ───────────────────────────────┐
│                                                     │
│ Status: [All ▼] [Active] [Upcoming] [Completed]   │
│ [Search programs]                                   │
│                                                     │
│ Programs Table:                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Name │ Status │ Trainees │ Avg Attendance │ │   │
│ ├─────────────────────────────────────────────┤   │
│ │ Elec │ Active │   89     │    92%         │ │   │
│ │ Inst │        │          │                │ │   │
│ │ Weld │ Active │   76     │    85%         │ │   │
│ │ ...                                         │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Viewing Program Details

1. From **Programs List**, click program name
   - Opens **Program Details** page

2. Shows:
   ```
   Program: Electrical Installation
   Status: Active
   Start Date: 2024-10-01
   End Date: 2024-11-30 (30 days remaining)
   Trainees: 89 enrolled
   Average Attendance: 92%
   
   Tabs:
   [Overview] [Enrollments] [Attendance] [Reports]
   ```

#### Overview Tab
- Program summary
- Key statistics
- Quick actions

#### Enrollments Tab
- List of all trainees in program
- Enrollment dates
- Current status
- Can view individual trainee details

#### Attendance Tab
- Attendance summary for program
- Charts showing attendance trends
- List of trainees by attendance rate

#### Reports Tab
- Pre-generated reports for program
- Export options

---

### Monitoring Attendance by Program

1. Click **[Attendance]** tab
   - Shows overall program attendance
   ```
   Attendance Overview: Electrical Installation
   ─────────────────────────────────────────
   Average Attendance: 92%
   Total Trainees: 89
   Present Today: 84
   Absent Today: 3
   Excused: 2
   
   Attendance Distribution:
   100%:   12 trainees (13%)
   90-99%: 45 trainees (51%)
   80-89%: 24 trainees (27%)
   <80%:    8 trainees ( 9%)  ⚠️ At Risk
   ```

2. **Identify concerns**:
   - Trainees below 80% (at-risk)
   - Any sudden drops in attendance
   - Patterns (specific days, times)

3. **Take action**:
   - Contact at-risk trainees
   - Investigate patterns
   - Escalate to admin if needed

---

### Program Coordination Tasks

#### Setting Program Times

1. From program details, click **[Edit Schedule]**
   - Modify training times
   ```
   Morning Session:
   Start Time: [08:00]
   End Time:   [12:00]
   
   Afternoon Session:
   Start Time: [13:00]
   End Time:   [17:00]
   
   Break Duration: [1 hour]
   ```

2. Set times aligned with actual program schedule

3. Click **[Save]**
   - Times saved
   - Affects attendance windows for trainees

#### Communicating with Trainees

1. From program details, click **[Send Message]**
   - Email/notification to all trainees
   ```
   Subject: [Electrical Installation - Important Update]
   
   Message: [_______________________________
             _______________________________]
   
   [Send via Email] [Send via SMS] [Post Announcement]
   ```

2. Type message

3. Click **[Send]**
   - All trainees notified
   - Logged to system

---

## Certificate Generation

**URL:** `/staff/certificates`  
**Purpose:** Generate and issue certificates to trainees upon program completion

### Certificate Generation Overview

#### Page Layout

```
┌─ Certificate Generation ──────────────────────────┐
│                                                     │
│ Program: [Select Program ▼]                        │
│ Filter By: Status: [Completed ▼]                   │
│                                                     │
│ Trainees Eligible for Certificate:                 │
│ ┌────────────────────────────────────────────┐    │
│ │ ☑ Name         │ Enrollment │ Attendance │   │    │
│ │                │ Date       │            │   │    │
│ ├────────────────────────────────────────────┤    │
│ │ ☑ John Doe     │ 2024-10-01 │    92%     │   │    │
│ │ ☑ Jane Smith   │ 2024-10-01 │    88%     │   │    │
│ │ ☑ Miguel Cruz  │ 2024-10-01 │    85%     │   │    │
│ │ ☑ Maria Santos │ 2024-10-01 │    81%     │   │    │
│ │                                            │   │    │
│ │ [Select All] [Unselect All]                │   │    │
│ └────────────────────────────────────────────┘    │
│                                                     │
│ Completion Threshold: 80%                          │
│ Eligible Trainees: 143 of 145                      │
│                                                     │
│ [Generate Certificates] [Preview] [Batch Send]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Generating Certificates

#### Automatic Generation

**System automatically generates when**:
- Program end date reached
- Trainee completed program
- Attendance ≥ 80% (configurable threshold)

#### Manual Generation

**If needed for specific cases**:

1. Go to **Certificates** page

2. **Select program**:
   - Dropdown to choose program

3. **Review trainees**:
   - System shows eligible trainees (80%+ attendance)
   - Shows ineligible (below threshold)
   - Can override if needed

4. **Select trainees**:
   - Check boxes for who gets certificate
   - Or click [Select All]

5. **Click [Generate Certificates]**
   - System generates:
     * Certificate documents (PDF)
     * QR codes for verification
     * Certificate numbers (unique per tenant)
   - Certificates stored in system
   - Success message shown

6. ✅ **Result**: Certificates created and ready to issue

---

### Certificate Contents

Each certificate includes:

```
╔════════════════════════════════════════════════╗
║                                                ║
║        CERTIFICATE OF PARTICIPATION            ║
║                                                ║
║  This certifies that                           ║
║                                                ║
║        JOHN DOE                                ║
║                                                ║
║  has successfully completed                    ║
║                                                ║
║   ELECTRICAL INSTALLATION TRAINING             ║
║                                                ║
║  Duration: 30 Days (September 1 - October 31) ║
║  Attendance Rate: 92%                          ║
║                                                ║
║  Certificate Number: CERT-2024-001234          ║
║  Issue Date: October 31, 2024                  ║
║                                                ║
║  Verified at: https://verify.bmdc.ph/...      ║
║  QR Code: [████████████]                       ║
║                                                ║
║  ____________________                          ║
║  [Signature of Certifying Official]            ║
║                                                ║
╚════════════════════════════════════════════════╝
```

### Issuing Certificates

#### Email to Trainees

1. After generating, click **[Batch Send]**
   - Email dialog opens
   ```
   Subject: Your Training Certificate
   
   Message:
   "Dear [Trainee Name],
   
   Congratulations! You have successfully completed
   [Program Name]. Your certificate is attached.
   
   Certificate Number: [CERT-2024-001234]
   Issue Date: [Date]
   
   You can verify your certificate at:
   [Verification Link]
   
   Thank you for your participation!
   
   Best regards,
   [Organization Name]"
   ```

2. Customize message if needed

3. Click **[Send to All Selected]**
   - Emails sent to all trainees
   - Certificate PDF attached
   - Audit logged

#### Manual Distribution

1. Download certificates:
   - Click **[Download All PDFs]**
   - ZIP file created
   - All certificates downloaded

2. Print and distribute physically
   - Or email manually
   - Or post on portal

#### Sending Verification Link

1. Trainee can share QR code or verification link
2. Anyone (no login required) can scan/visit
3. See:
   - Certificate details
   - Trainee name
   - Program name
   - Issue date
   - Can verify legitimacy

---

### Certificate Management

#### Viewing Issued Certificates

1. Click **[Issued Certificates]** tab
   - List of all certificates issued

2. Shows:
   ```
   Certificate List
   ───────────────
   Cert Number  │ Trainee Name │ Program │ Issue Date
   CERT-2024-0001 │ John Doe   │ Elect.  │ 2024-10-31
   CERT-2024-0002 │ Jane Smith │ Elect.  │ 2024-10-31
   CERT-2024-0003 │ Miguel ...
   ```

3. Click certificate to view details:
   - Certificate PDF
   - Verification URL
   - QR code
   - Trainee info

#### Revoking Certificate

⚠️ **Only in case of fraud or error**

1. From certificate list, click certificate
   - Opens certificate details

2. Click **[Revoke Certificate]**
   - Confirmation dialog
   - Must provide reason

3. Enter reason:
   - "Data entry error"
   - "Trainee requested"
   - "Fraud investigation"

4. Click **[Confirm Revoke]**
   - Certificate marked as revoked
   - Verification page shows "Revoked"
   - Audit trail recorded

---

## Reports & Analytics

**URL:** `/staff/reports`  
**Purpose:** Generate attendance and performance reports

### Available Reports

#### 1. Daily Attendance Report

**Shows**: Daily attendance summary for all programs

```
Steps:
1. Click [Daily Attendance Report]
2. Select date
3. Click [Generate]

Report Shows:
- Program name
- Expected trainees
- Present
- Absent
- Excused
- Percentage
```

#### 2. Trainee Attendance Report

**Shows**: Individual trainee attendance over time

```
Steps:
1. Click [Trainee Attendance Report]
2. Select trainee
3. Select date range
4. Click [Generate]

Report Shows:
- Trainee details
- Attendance by date
- Present/Absent/Excused history
- Attendance percentage
- Trend (improving/declining)
```

#### 3. Program Summary Report

**Shows**: Overall program performance

```
Report Shows Per Program:
- Total trainees enrolled
- Enrolled date range
- Total training days
- Average attendance
- Attendance distribution (100%, 90%, etc.)
- At-risk trainees (< 80%)
- Completion status
```

#### 4. Monthly Report

**Shows**: Summary of entire month

```
Report Shows:
- All programs running
- Total trainees across programs
- Total attendance records
- Overall attendance rate
- Key statistics
- Trends
```

#### 5. Trainee Progress Report

**Shows**: Individual trainee progress through program

```
Report Shows Per Trainee:
- Current enrollment status
- Days completed vs total
- Attendance percentage
- Completion status
- Performance trend
- Expected graduation date
```

### Generating Reports

1. Click desired **Report** type

2. Fill in parameters:
   - Date range
   - Program (if applicable)
   - Trainee (if applicable)

3. Click **[Generate]**
   - Report generated and displayed

4. **View on screen**:
   - Tables and charts
   - Interactive data
   - Drill-down options

5. **Export**:
   - Click **[Export CSV]** for spreadsheet
   - Click **[Export PDF]** for document
   - Click **[Print]** for hardcopy

---

## Common Tasks

### Task 1: Complete Daily Attendance Review

**Goal**: Review and verify all attendance marked by trainees for the day

**Steps**:

1. **Open Dashboard**
   - See how many marked vs pending
   - Identify which programs need attention

2. **For each program**:
   - Go to **Attendance** page
   - Select program
   - Review all entries

3. **For suspicious entries**:
   - Click record to view details
   - Check photo matches trainee
   - Check times make sense
   - Check GPS location reasonable

4. **Take action**:
   - If legitimate: No action (stays as recorded)
   - If suspicious: 
     * Note concerns
     * Contact trainee
     * May revise to "Excused" pending investigation
   - If trainee forgot to mark:
     * Bulk mark as Absent (or Excused if valid reason)

5. **Report issues**:
   - If fraud suspected: Report to admin
   - If pattern detected: Escalate concern
   - If system issue: Note and report

✅ **Result**: All daily attendance reviewed and verified

---

### Task 2: Generate Monthly Attendance Report

**Goal**: Create comprehensive attendance report for management

**Steps**:

1. **Go to Reports**
   - Navigate to **Reports** page

2. **Select report type**
   - Click **[Program Summary Report]** or **[Monthly Report]**

3. **Set parameters**:
   - Month: September 2024
   - Programs: All or specific

4. **Generate**:
   - Click **[Generate Report]**
   - Report displays with:
     * Attendance statistics
     * Charts showing trends
     * List of programs
     * At-risk trainees highlighted

5. **Review findings**:
   - Identify low attendance areas
   - Note programs with concerns
   - Flag trainees below 80%

6. **Export**:
   - Click **[Export PDF]** for formatted report
   - Use for presentations or records
   - Or click **[Email Report]** to send to admin

✅ **Result**: Monthly report generated and exported

---

### Task 3: Issue Certificates for Completed Program

**Goal**: Generate and send certificates to trainees who completed training

**Steps**:

1. **Verify program completion**:
   - Program end date reached
   - Most trainees completed attendance (80%+)

2. **Go to Certificates**
   - Navigate to **Certificates** page

3. **Select program**:
   - Choose completed program
   - System shows eligible trainees

4. **Review eligibility**:
   - Check all eligible trainees (80%+ attendance)
   - Note any ineligible (below threshold)
   - Can override if needed for special cases

5. **Generate certificates**:
   - Select trainees
   - Click **[Generate Certificates]**
   - Wait for processing
   - Success message shown

6. **Issue to trainees**:
   - Click **[Batch Send]**
   - Send via email
   - Or download and print

7. **Archive**:
   - Certificates now part of trainee record
   - Can be verified publicly

✅ **Result**: Trainees receive certificates

---

### Task 4: Investigate Attendance Anomaly

**Goal**: Audit specific trainee's attendance for irregularities

**Steps**:

1. **Identify concern**:
   - Dashboard alerts trainee below 80%
   - Or pattern noticed (always absent Mondays)
   - Or suspected fraud

2. **Go to Attendance**
   - Navigate to **Attendance** page
   - Filter by trainee name

3. **Review records**:
   - Look at chronological attendance
   - Check for patterns:
     * Specific days always absent?
     * Time stamps weird (4 AM arrival)?
     * Same photo every day (fake)?

4. **Drill into details**:
   - Click specific date record
   - View photo/selfie
   - Check GPS location
   - Review device info

5. **Make assessment**:
   - Legitimate: Just low attendance
   - Concerning pattern: Contact trainee
   - Suspected fraud: Report to admin

6. **Document findings**:
   - Take notes
   - Screenshots if needed
   - Report to admin with evidence

✅ **Result**: Attendance verified or issue escalated

---

## Troubleshooting

### Issue: Trainee attendance not appearing

**Possible causes**:
- Trainee hasn't submitted yet (just mark as pending)
- System connection issue
- Trainee in wrong program

**Solutions**:
1. Check if trainee submitted in their app
2. Refresh page to see latest data
3. Verify trainee is enrolled in correct program
4. Check trainee account is Active
5. Contact admin if problem persists

### Issue: Can't generate certificates

**Possible causes**:
- Program not yet completed (end date in future)
- Trainees below 80% attendance threshold
- No trainees enrolled in program

**Solutions**:
1. Wait for program end date
2. Review attendance thresholds
3. Check program has trainees enrolled
4. Verify program status is "Active" or "Completed"
5. Refresh page and try again

### Issue: Certificate verification link not working

**Possible causes**:
- Certificate not yet published
- Revoked certificate
- Browser/network issue

**Solutions**:
1. Wait a few minutes for publishing
2. Check certificate isn't revoked
3. Try different browser
4. Check internet connection
5. Verify certificate number is correct
6. Contact admin if issue persists

### Issue: Attendance record shows wrong time

**Possible causes**:
- Trainee's device has wrong time set
- GPS location issue
- Data entry error

**Solutions**:
1. Review trainee's device info
2. Ask trainee to correct device time
3. Manually edit if justified
4. Add note about correction
5. Log change to audit trail

---

## Security Considerations

### Best Practices

✅ **Do**:
- Verify trainee photos match identity
- Review GPS locations for reasonableness
- Document all manual attendance corrections
- Check for suspicious patterns
- Escalate concerns to admin

❌ **Don't**:
- Accept blurry/unclear photos without verification
- Mark attendance for trainees you didn't see
- Modify records without documenting reason
- Ignore suspicious patterns
- Delete attendance records

### Sensitive Operations

⚠️ Be careful with:
- **Modifying past attendance**: Affects final grades and certificates
- **Marking as Excused**: Should have valid reason
- **Revoking certificates**: Affects trainee's credentials
- **Bulk operations**: Can affect many trainees at once

---

## Support

For more help:
- Review [Security & Authentication](./06-SECURITY-AUTHENTICATION.md) for login issues
- Check [System Architecture](./08-SYSTEM-ARCHITECTURE.md) for technical details
- Contact local admin for permission issues

---

**Last Updated:** September 2026  
**Documentation Version:** 1.0  
**Role:** Staff Training Coordinator

[← Back to Main Documentation](./README.md)
