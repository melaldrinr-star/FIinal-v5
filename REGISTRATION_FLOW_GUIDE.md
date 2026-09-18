# Complete Registration Flow: Frontend to Backend Data Handling

This guide explains how user registration works from the moment they start filling out the form to when they're stored in the database.

## Quick Summary

**8-Step Frontend Form** → **Email Verification** → **Backend Registration** → **Database Storage** → **Staff Approval** → **User Account Creation** → **Login**

---

## The 8 Steps of Registration

### Step 1: Account Setup
- User creates **username**, **email**, **password**
- Frontend validates: Password strength, email format
- Data stored in React component state

### Step 2: Personal Information
- First name, last name, middle name, phone
- Birth date, birth place, civil status
- Data stored in form state

### Step 3: Address Information
- Province, municipality, barangay, street
- Data stored in form state

### Step 4: Background Information
- Educational attainment, course, year graduated
- Classification, disability, employment status
- Data stored in form state

### Step 5: Tenant Selection
- User selects their organization/institution
- Frontend fetches tenant list from backend
- Selected tenant_id stored in form state

### Step 6: Requirements Upload
- Frontend fetches requirement definitions for selected tenant
- User uploads required documents (file uploads)
- Files stored as File objects in form state

### Step 7: Program Selection
- Frontend fetches available programs for selected tenant
- User selects their program
- Frontend validates:
  - Email uniqueness (queries backend)
  - Username uniqueness (queries backend)
  - All required fields filled

### Step 8: Email Verification (KEY STEP)
1. **Send OTP**: Frontend requests 6-digit code to be sent to email
2. **Receive Email**: Backend generates code, sends via email
3. **Enter Code**: User enters 6-digit code from email
4. **Verify Code**: Frontend/Backend validates code
5. **Success**: Email marked as verified
6. **Callback**: Frontend notifies parent component with username
7. **Navigate**: Registration modal closes, login modal opens

---

## Frontend Form Data Structure

### Complete FormData
\\\	ypescript
{
  // Step 1
  username: "john_doe",
  email: "john@example.com",
  password: "SecurePass123!",
  confirm_password: "SecurePass123!",
  
  // Step 2
  first_name: "John",
  last_name: "Doe",
  middle_name: "Michael",
  phone: "+63912345678",
  sex: "Male",
  birth_date: "1990-05-15",
  birth_place: "Manila",
  civil_status: "Single",
  
  // Step 3
  province: "Metro Manila",
  municipality: "Makati",
  barangay: "Fort Bonifacio",
  street: "123 Main St",
  
  // Step 4
  educational_attainment: "High School",
  course: "BSIT",
  year_graduated: "2012",
  classification: "First Time Jobseeker",
  disability: null,
  employment_status: "Unemployed",
  
  // Step 5
  tenant_id: "194876de-a68c-4d33-8f80-c0978e5d44b3",
  
  // Step 7
  program_id: "abc123def456"
}
\\\

---

## Backend Registration Flow

### Entry Point: POST /api/registrations

**Location**: \Backend/src/app/api/registrations/route.ts\

### Processing Pipeline

#### 1. Schema Validation
- Email format valid
- Password meets requirements (8+ chars, mixed case, numbers)
- All required fields present
- No malicious data

#### 2. Tenant Validation
- Verify tenant_id exists in database
- User has access to tenant (optional depending on auth)

#### 3. Duplicate Checks
**Email Uniqueness**: Check trainees table
- No pending registration with same email in same tenant
- No approved registration with same email

**Incomplete Enrollment Check**: Check enrollments table
- Trainee doesn't already have 'enrolled' or 'active' status in same tenant
- Allows re-enrollment after dropping/completing program

#### 4. Call Registration Service

\\\	ypescript
const result = await registrationService.submitRegistration(
  validatedData,
  tenantId,
  isExistingTrainee,
  enrollmentSource
);
\\\

---

## Database Operations During Registration

### A. Create Trainee Record (trainees table)

\\\sql
INSERT INTO trainees (
  tenant_id,
  email,
  first_name, last_name, middle_name,
  phone, sex, birth_date, birth_place,
  civil_status,
  province, municipality, barangay, street,
  educational_attainment, course, year_graduated, classification,
  disability, employment_status,
  registration_status,  -- 'pending'
  status,               -- 'inactive'
  consent_given,        -- false
  is_verified           -- false
) VALUES (...)
\\\

**Fields Created:**
- id (UUID, auto-generated)
- email (normalized to lowercase)
- Personal info (name, phone, birth date, etc.)
- Address info (province, municipality, etc.)
- Background info (education, employment)
- registration_status = 'pending' (waiting for staff approval)
- status = 'inactive' (can't access until approved)
- is_verified = false (email not verified yet... wait, it is verified! This is set to true during approval)

### B. Store Username (NEW - Task 2 & 3)

\\\sql
INSERT INTO pending_registration_usernames (
  trainee_id,
  username
) VALUES ('abc123', 'john_doe')
\\\

**Why?** The username is stored in the users table later during approval. We save it here temporarily so staff sees the exact username user chose (not email fallback).

### C. Hash and Store Password Temporarily

\\\sql
INSERT INTO pending_registration_passwords (
  trainee_id,
  password_hash  -- bcrypt hash, NOT plain text
) VALUES ('abc123', '$...')
\\\

**Why?** Password is hashed here temporarily. During approval, it's moved to the users table.

### D. Create Enrollment Record

\\\sql
INSERT INTO enrollments (
  trainee_id,
  program_id,
  tenant_id,
  status,            -- 'applied'
  enrollment_source  -- 'direct' or other
) VALUES (...)
\\\

**Status 'applied'**: Trainee has applied but not yet enrolled (approval pending).

---

## Email Verification Process (Step 8)

### Phase 1: Send OTP Code

**Frontend calls:**
\\\	ypescript
await verificationService.sendVerificationCode({
  email: form.email,
  firstName: form.first_name,
  method: 'email',
  registrationContext: true
});
\\\

**Backend does:**
1. Generate random 6-digit code (000000-999999)
2. Create record in email_verifications table:
   - email
   - code (plain text for now, will hash later)
   - expires_at (10 minutes from now)
3. Send email with code to user's inbox

### Phase 2: User Enters Code

User receives email, opens form, enters 6 digits

### Phase 3: Verify Code

**Frontend calls:**
\\\	ypescript
await verificationService.verifyCode(form.email, otpValue);
\\\

**Backend does:**
1. Query email_verifications table
2. Check code matches (case-sensitive)
3. Check code not expired
4. Update record:
   - code_verified = true
   - verified_at = current timestamp
5. Return success

### Phase 4: Callback Triggered

\\\	ypescript
if (onRegistrationComplete) {
  setTimeout(() => {
    onRegistrationComplete(form.username);
  }, 500);  // 500ms delay for smooth UX
}
\\\

**Result**: Parent component (LandingPage) closes registration modal, opens login modal with username pre-filled.

---

## Staff Approval Workflow

### What Happens During Approval

Staff admin clicks "Approve" on a pending registration → Backend approveRegistration() called

### Step 1: Get Stored Username (Task 4)

\\\	ypescript
const { data: pendingUsername } = await supabaseAdmin
  .from('pending_registration_usernames')
  .select('username')
  .eq('trainee_id', trainee_id)
  .single();

const username = pendingUsername?.username || trainee.email.split('@')[0];
\\\

**Why?** Use the username user entered in Step 1, not email fallback.

### Step 2: Create User Account (users table)

\\\sql
INSERT INTO users (
  email,
  username,        -- from pending_registration_usernames!
  role,            -- 'trainee'
  password_hash    -- from pending_registration_passwords
) VALUES ('john@example.com', 'john_doe', 'trainee', '$...')
\\\

**Critical**: Username comes from pending_registration_usernames, not email fallback.

### Step 3: Create Links

**Link 1: User to Trainee (trainee_accounts)**
\\\sql
INSERT INTO trainee_accounts (trainee_id, user_id, tenant_id)
\\\

**Link 2: User to Tenant (users_tenants)**
\\\sql
INSERT INTO users_tenants (user_id, tenant_id)
\\\

**Why?** Enables multi-tenant access. User can be member of multiple organizations.

### Step 4: Update Trainee Status

\\\sql
UPDATE trainees SET
  registration_status = 'completed',
  status = 'active',
  is_verified = true,
  registration_reviewed_by = staff_id,
  registration_reviewed_at = NOW()
WHERE id = trainee_id
\\\

### Step 5: Update Enrollment Status

\\\sql
UPDATE enrollments SET
  status = 'enrolled'
WHERE trainee_id = trainee_id AND program_id = program_id
\\\

**Status 'enrolled'**: Trainee is now officially enrolled (approval done).

### Step 6: Cleanup Temporary Data (Task 4)

\\\sql
DELETE FROM pending_registration_usernames WHERE trainee_id = trainee_id;
DELETE FROM pending_registration_passwords WHERE trainee_id = trainee_id;
\\\

**Why?** These were only needed temporarily during registration → approval. Clean up after use.

### Step 7: Send Welcome Email

Email user with:
- Confirmation that registration approved
- Username
- Login instructions
- Program details

---

## Data State at Each Stage

### After Registration (Before Email Verification)

| Table | Status |
|-------|--------|
| trainees | Created, registration_status='pending', is_verified=false |
| pending_registration_usernames | Username stored |
| pending_registration_passwords | Password hash stored |
| enrollments | status='applied' |
| email_verifications | Code sent, awaiting verification |
| users | NOT CREATED YET |

### After Email Verification (Waiting for Staff Approval)

| Table | Status |
|-------|--------|
| email_verifications | code_verified=true, verified_at=[timestamp] |
| All others | Same as above |
| users | STILL NOT CREATED |

### After Staff Approval

| Table | Status |
|-------|--------|
| trainees | registration_status='completed', is_verified=true, status='active' |
| users | CREATED with username from pending_registration_usernames |
| trainee_accounts | Link created (trainee↔user) |
| users_tenants | Link created (user↔tenant) |
| enrollments | status='enrolled' |
| pending_registration_usernames | DELETED |
| pending_registration_passwords | DELETED |

### After User Login

| Table | Status |
|-------|--------|
| users | Last login timestamp updated |
| All others | Unchanged |

User authenticated, can access dashboard.

---

## Key Improvements (Why We Made Changes)

### Problem 1: QR Code NOT NULL
**Issue**: Registration failed if qr_code was empty
**Solution**: Made qr_code column nullable
**Result**: Trainees can be created without QR code

### Problem 2: Username Lost
**Issue**: User chose username in Step 1, but backend used email fallback
**Solution**: Store username in pending_registration_usernames during registration
**Result**: Exact username preserved through to user account creation

### Problem 3: No Modal Transition
**Issue**: After email verification, user stuck in verification screen
**Solution**: Added onRegistrationComplete callback to trigger parent component navigation
**Result**: Smooth transition from registration modal to login modal

---

## Complete Data Journey

\\\
User (Browser)
  ↓
[Fills 8-step form] (All data in React state)
  ↓
[Clicks "Continue to Verification" on Step 7]
  ↓
POST /api/verification/send-code
  ├─ Backend generates 6-digit OTP
  ├─ Backend sends email with code
  └─ Email arrives in user's inbox
  ↓
User enters 6-digit code in Step 8
  ↓
POST /api/verification/verify-code
  ├─ Backend validates code
  ├─ Backend marks email verified
  └─ Returns success
  ↓
onRegistrationComplete callback fires (NEW)
  ├─ Passes username to parent (LandingPage)
  ├─ Closes registration modal
  └─ Opens login modal with pre-filled username (Task 7)
  ↓
Meanwhile, backend processed registration:
  ├─ POST /api/registrations received (before verification)
  ├─ Created trainee record in database
  ├─ Stored username temporarily (Task 3)
  ├─ Stored password hash temporarily
  └─ Created enrollment record
  ↓
User sees login modal
  ├─ Username pre-filled: "john_doe" (NEW - Task 7)
  ├─ Success message shows (NEW - Task 7)
  └─ User enters password and clicks "Log In"
  ↓
POST /api/auth/login
  ├─ Backend validates credentials from users table
  ├─ But wait... user record doesn't exist yet!
  ├─ User waits for staff approval
  └─ Can't login until staff approves
  ↓
[Staff Reviews and Approves Registration]
  ↓
Backend approveRegistration()
  ├─ Retrieves stored username from pending_registration_usernames (Task 4)
  ├─ Creates user account with that username (Task 4)
  ├─ Creates user-trainee link
  ├─ Creates user-tenant link
  ├─ Updates trainee status to 'active'
  ├─ Deletes pending username/password (cleanup)
  └─ Sends welcome email
  ↓
User tries login again
  ├─ POST /api/auth/login
  ├─ Backend finds user in users table with username "john_doe"
  ├─ Validates password
  ├─ Creates session/JWT token
  └─ Redirects to dashboard
  ↓
Dashboard loads
  ├─ User authenticated as trainee
  ├─ Shows enrolled program
  ├─ Shows trainee profile
  └─ Status: "active" and "verified"
\\\

---

## Files Involved

### Frontend
- \Frontend/src/components/RegistrationModal.tsx\ - 8-step form
- \Frontend/src/pages/NewLandingPage.tsx\ - Modal parent, navigation (Task 6)
- \Frontend/src/components/auth/LoginModal.tsx\ - Pre-fill logic (Task 7)
- \Frontend/src/services/registrationService.ts\ - API calls
- \Frontend/src/services/verificationService.ts\ - Email/OTP API

### Backend
- \Backend/src/app/api/registrations/route.ts\ - Registration API entry
- \Backend/src/services/registrationService.ts\ - Registration logic (Tasks 3, 4)
- \Backend/src/app/api/verification/send-code/route.ts\ - Send OTP
- \Backend/src/app/api/verification/verify-code/route.ts\ - Verify OTP
- \Backend/src/app/api/registrations/{id}/approve/route.ts\ - Staff approval
- \Backend/migrations/006-field-updates/003_make_qr_code_nullable.sql\ - Task 1
- \Backend/migrations/006-field-updates/004_create_pending_registration_usernames.sql\ - Task 2

---

## Summary

The registration system is a **two-phase process**:

1. **Registration Phase**: User fills form → Email verified → Data stored temporarily
2. **Approval Phase**: Staff approves → User account created → Temporary data cleaned up

The **username flows from Step 1 all the way through to final user account**, preserving exactly what user chose instead of falling back to email-based username.

This is the improved version that ensures **complete data integrity** and **smooth user experience**.
