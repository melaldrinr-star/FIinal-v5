# Security & Authentication Documentation
## BMDC 1.1 - System Security Overview

**Document Purpose:** Comprehensive guide to authentication, authorization, and security mechanisms

---

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Authorization & Access Control](#authorization--access-control)
3. [Security Features](#security-features)
4. [Password Security](#password-security)
5. [Session Management](#session-management)
6. [Multi-Tenant Isolation](#multi-tenant-isolation)
7. [Data Protection](#data-protection)
8. [Audit & Compliance](#audit--compliance)
9. [Security Best Practices](#security-best-practices)
10. [Incident Response](#incident-response)

---

## Authentication System

### How Does Authentication Work?

Authentication is the process of verifying **who you are** when you log in.

#### Login Flow (Step-by-Step)

```
1. USER PROVIDES CREDENTIALS
   ├─ Email address (or username)
   └─ Password

2. BACKEND VALIDATES
   ├─ Checks email exists in database
   ├─ Retrieves password hash for that user
   ├─ Compares submitted password to stored hash (bcrypt)
   └─ If doesn't match → Login fails

3. IF PASSWORD MATCHES
   ├─ Checks user role
   ├─ Identifies all tenants user belongs to
   └─ If 1 tenant → Single tenant flow
   └─ If multiple tenants → Tenant selection flow

4. SINGLE TENANT USER
   ├─ Creates JWT token containing:
   │  ├─ User ID (unique identifier)
   │  ├─ Email address
   │  ├─ Role (super_admin, local_admin, etc.)
   │  ├─ Tenant ID (which organization)
   │  ├─ Issued time & expiration time
   │  └─ JWT signature (cryptographic hash)
   ├─ Creates refresh token
   └─ Returns both tokens to frontend

5. MULTI-TENANT USER
   ├─ Creates temporary "selection token"
   ├─ Sends list of tenants to frontend
   └─ Waits for user to select tenant

6. TENANT SELECTION (Multi-Tenant Only)
   ├─ User sees list of organizations
   ├─ User clicks one to select
   ├─ Frontend sends selection_token + selected_tenant
   └─ Backend creates proper JWT for selected tenant

7. FRONTEND RECEIVES TOKENS
   ├─ Receives accessToken (JWT) and refreshToken
   ├─ Encrypts tokens with AES-256
   ├─ Stores in sessionStorage (NOT localStorage, NOT cookies)
   └─ Ready to make API calls

8. SUBSEQUENT API CALLS
   ├─ Frontend includes token in header: "Authorization: Bearer <token>"
   ├─ Backend extracts token from header
   ├─ Verifies JWT signature is valid
   ├─ Checks token not revoked
   ├─ Checks token not expired
   ├─ If all good → Request proceeds
   ├─ If expired → Returns 401 error
   └─ Frontend automatically refreshes and retries
```

### JWT Token Structure

A JWT token consists of three parts (separated by dots):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
  .
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
  .
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Part 1 (Header)**: Algorithm information
```json
{
  "alg": "HS256",      // Signature algorithm
  "typ": "JWT"         // Type of token
}
```

**Part 2 (Payload)**: User data (readable but verified)
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "trainee",
  "tenantId": "a1b2c3d4-e5f6-41d4-a716-446655440000",
  "jti": "unique-id-for-revocation",
  "iat": 1695148800,          // Issued at (timestamp)
  "exp": 1695149700           // Expiration (15 minutes later)
}
```

**Part 3 (Signature)**: Cryptographic signature
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET_KEY
)
```

### Token Verification Process

When you make an API call:

1. **Extract token** from "Authorization: Bearer <token>" header
2. **Split token** into three parts
3. **Verify signature**:
   - Take first two parts
   - Apply same signature algorithm with secret key
   - Compare to third part
   - If doesn't match → Token forged, reject
4. **Check expiration**:
   - Look at "exp" claim
   - If current time > exp → Token expired, reject
5. **Check revocation**:
   - Look up "jti" in revoked_tokens table
   - If found → Token was revoked, reject
6. **If all pass** → Token valid, request proceeds

---

## Authorization & Access Control

### What is Authorization?

Authorization determines **what you're allowed to do** based on your role.

**After you're authenticated (logged in), the system checks if you have permission.**

### User Roles & Permissions

```
SUPER ADMIN (role: super_admin)
├─ Tenant: 'platform' (special sentinel value)
├─ Access: ALL data across ALL organizations
├─ Can: Create tenants, manage admins, view all reports
└─ Cannot: Edit trainee data directly

LOCAL ADMIN (role: local_admin)
├─ Tenant: Specific tenant (LGU Manila, etc.)
├─ Access: Own tenant data only
├─ Can: Approve registrations, create programs, manage staff
└─ Cannot: See other orgs' data, access system settings

STAFF TRAINING COORDINATOR (role: staff_training_coordinator)
├─ Tenant: Specific tenant (inherited from local admin)
├─ Access: Programs & attendance in own tenant
├─ Can: Track attendance, generate certificates, create reports
└─ Cannot: Manage trainees, create accounts, access inventory

STAFF INVENTORY MANAGER (role: staff_inventory_manager)
├─ Tenant: Specific tenant
├─ Access: Inventory items & lending in own tenant
├─ Can: Create items, track borrowing, generate slips
└─ Cannot: Manage trainees, access attendance

TRAINEE (role: trainee)
├─ Tenant: Specific tenant (organization they enrolled in)
├─ Access: Own profile + enrolled programs only
├─ Can: Mark attendance, view certificate, edit profile
└─ Cannot: See other trainees, access reports, manage anything
```

### Role-Based Access Control (RBAC)

The system uses **middleware** to enforce permissions:

```typescript
// Example middleware check
function requireRole(request, allowedRoles) {
  const user = authenticateUser(request);  // Get user from JWT
  
  if (!user) {
    return { status: 401, error: "Not authenticated" };
  }
  
  if (!allowedRoles.includes(user.role)) {
    return { status: 403, error: "Insufficient permissions" };
  }
  
  // Permission granted, proceed
  return { status: 200, user: user };
}

// Usage: Only local admins can approve registrations
POST /api/registrations/:id/approve
  → requireRole(['local_admin', 'super_admin'])
  → If trainee tries → 403 Forbidden
```

### API Endpoint Permission Examples

| Endpoint | Method | Required Role | Result If Wrong Role |
|----------|--------|---------------|---------------------|
| `/api/trainees` | GET | local_admin, staff_* | 403 Forbidden |
| `/api/attendance` | POST | trainee, staff_coord | 403 Forbidden |
| `/api/programs` | POST | local_admin | 403 Forbidden |
| `/api/items` | POST | inventory_manager | 403 Forbidden |
| `/api/registrations/approve` | POST | local_admin | 403 Forbidden |

### Row-Level Security (RLS) - Database Level

Beyond API permissions, **the database itself enforces** tenant isolation:

```sql
-- Example RLS Policy on trainees table
CREATE POLICY "Users can read their tenant trainees"
ON trainees FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM users_tenants 
    WHERE user_id = auth.uid()
  )
);

-- Effect:
-- - Local admin for LGU Manila can ONLY see trainees with tenant_id='lguman'
-- - Even if SQL query tries to fetch LGU Cebu data
-- - Database silently filters it out
```

---

## Security Features

### 1. Password Hashing

**How it works**:
- User enters: `MyTraining123`
- System generates random "salt": `$2b$12$abcdefghijk...`
- System hashes password with salt: `hash(salt + password)`
- Result stored in database: `$2b$12$abcdefghijk...xyzencryptedhash`
- Original password never stored

**Why this matters**:
- If database stolen, passwords not exposed
- Each password unique (different salt)
- Cannot reverse-engineer original password
- Even attackers with database can't log in

**Technology**: bcryptjs (12 salt rounds)
- `$2b` = bcrypt algorithm
- `$12$` = 12 salt rounds (slows hashing, makes brute force harder)

---

### 2. JWT Signature Verification

**Prevents**: Token tampering, forged tokens

```
Attack scenario:
Hacker tries to change role in token:
  Original: {"role": "trainee", ...}
  Hacked to: {"role": "local_admin", ...}

But signature doesn't match new content!
System detects tampering and rejects token.
```

---

### 3. Token Revocation

**Prevents**: Using tokens after logout

```
Logout flow:
1. Frontend sends logout request
2. Backend records JWT ID (jti) in revoked_tokens table
3. For every API call, system checks if jti in revoked_tokens
4. If found → Token rejected even if not expired
5. Next API call requires login again
```

**Why important**:
- Even if token stolen, logout revokes it
- Attacker can't keep using stolen token indefinitely
- Sits in revoked list only ~14 days (refresh token lifespan)

---

### 4. Short-Lived Access Tokens

**Default**: 15 minutes expiration

**Why this matters**:
- If access token stolen, attacker can use for max 15 min
- After 15 min, token auto-expires
- Attacker needs refresh token to get new access token
- Refresh token is opaque and harder to steal

**Refresh Token Flow**:
```
At 14 minutes:
- Frontend detects token will expire soon
- Sends refresh token to backend
- Backend returns new access token
- Frontend resumes seamlessly

User never logs out, but tokens constantly rotating
```

---

### 5. Secure Token Storage

**Frontend (React app)**:
- Tokens stored in `sessionStorage` only
  - Clears when browser tab closes
  - More secure than localStorage
- Tokens encrypted with AES-256 before storage
  - Even if JavaScript code stolen, can't read encrypted token
- NOT stored in cookies
  - Prevents CSRF attacks (cookies auto-sent on cross-site requests)

**Backend**:
- Refresh tokens stored as hashed values
  - Original token never stored, only hash
  - Database breach doesn't reveal tokens

---

### 6. Multi-Tenant Isolation

**Database Level**:
```sql
-- Every tenant-scoped table has tenant_id
SELECT * FROM trainees 
WHERE id = 'trainee-123'
  AND tenant_id = 'lguman'  ← Forced by RLS

-- Even if you craft SQL to remove WHERE clause,
-- RLS policy silently adds it back
-- Cannot query other tenants' data
```

**API Level**:
```typescript
// Every API response filtered by tenant
const trainees = await db.trainees.query({
  where: {
    tenant_id: userContext.tenantId  // ← Explicit filter
  }
});

// If tenant_id omitted by mistake, RLS catches it anyway
```

---

## Password Security

### Creating Strong Passwords

**Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

**Good Examples**:
- `Training@123` ✓
- `ElectricABC2024` ✓
- `Welding#Safe99` ✓
- `MyProgram2024` ✓

**Bad Examples**:
- `password123` ✗ (no uppercase)
- `PASSWORD` ✗ (no lowercase, no number)
- `train@2024` ✗ (8 chars with 1 number, but no upper)
- `qwerty` ✗ (too weak)

### Password Best Practices

✅ **Do**:
- Use unique password (not same as email/username)
- Use passphrase (e.g., "Training$Prog2024" instead of random)
- Change password every 6 months
- Use different passwords for different sites
- Write strong passwords down securely if needed

❌ **Don't**:
- Use passwords like "123456" or "password"
- Write password on sticky note
- Share password with anyone
- Use same password on multiple sites
- Reuse old passwords

### Password Reset Process

1. **User forgets password**:
   - Clicks **[Forgot Password]** on login page
   - Enters email address
   - Clicks **[Send Reset Link]**

2. **Backend creates reset token**:
   ```typescript
   // Creates temporary one-time use token
   {
     token: "random-unique-string",
     user_id: "user-123",
     expires_at: now + 1 hour,  // Expires in 1 hour
     used_at: null              // Not used yet
   }
   ```

3. **Email sent to user**:
   - Subject: "Password Reset Request"
   - Contains link: `https://system/reset?token=abc123xyz`
   - Valid for 1 hour only

4. **User clicks link**:
   - Taken to reset form
   - Enters new password
   - Clicks **[Reset Password]**

5. **Backend validates & resets**:
   - Checks token valid (not expired, exists)
   - Marks token as used (can't reuse)
   - Hashes new password
   - Stores in database
   - Invalidates all existing tokens (user must log in again)

6. **User logs in**:
   - With new password
   - Fresh new token created

---

## Session Management

### What is a Session?

A session is your **active connection** to the system while logged in.

### Session Timeline

```
1. LOGIN
   └─ JWT token created (15 min expiration)
   └─ Refresh token created (14 day expiration)
   
2. USE SYSTEM (0-15 minutes)
   └─ All API calls include JWT
   └─ System validates JWT
   
3. AT 14 MINUTES
   └─ System or frontend refreshes tokens
   └─ New JWT created
   └─ Old refresh token rotated (new one created)
   
4. REPEAT STEP 2-3
   └─ As long as you're active
   
5. LOGOUT
   └─ Refresh token immediately revoked
   └─ JWT added to revoked list
   └─ Cannot make any more API calls
   
6. INACTIVITY (30 minutes no requests)
   └─ System considers session expired
   └─ Must log in again
```

### Session Timeout

**Default**: 30 minutes of inactivity

**What happens**:
- If you don't make any request for 30 minutes
- Any next API call gets 401 (not authorized)
- Frontend redirects to login page
- You must log in again

**Why**: Security - if you leave computer unattended, session can't be used by someone else

### Multiple Active Sessions

**Can you be logged in on multiple devices?**

Yes:
- Log in on phone: Get token-A
- Log in on computer: Get token-B
- Both work simultaneously
- Log out on phone: Revokes token-A only
- Computer still works: Token-B still valid

⚠️ **Security concern**: If someone gets your credentials, they can log in from anywhere. Change password immediately if you suspect compromise.

---

## Multi-Tenant Isolation

### How Multi-Tenancy Works

**Scenario**:
- LGU Manila and LGU Cebu both use BMDC 1.1
- Data completely separate
- Each org thinks they're the only user

### Tenant Isolation Mechanisms

#### 1. Physical Separation (Database Level)

```
USERS TABLE:
┌─────────────────────────────┐
│ id  │ email │ role │ tenant_id
├─────────────────────────────┤
│ u-1 │ john@ │local │ tenant-1 (LGU Manila)
│ u-2 │ jane@ │staff │ tenant-1 (LGU Manila)
│ u-3 │ maria │local │ tenant-2 (LGU Cebu)
│ u-4 │ miguel│staff │ tenant-2 (LGU Cebu)
└─────────────────────────────┘

TRAINEES TABLE:
┌──────────────────────────────┐
│ id  │ name │ email │ tenant_id
├──────────────────────────────┤
│ t-1 │John  │john@ │ tenant-1
│ t-2 │Jane  │jane@ │ tenant-1
│ t-3 │Maria │maria │ tenant-2
│ t-4 │Miguel│miguel│ tenant-2
└──────────────────────────────┘

→ If u-1 (LGU Manila local admin) queries trainees:
  WHERE tenant_id = tenant-1
  → Gets only t-1, t-2
  → Cannot see t-3, t-4 (LGU Cebu)
```

#### 2. JWT Includes Tenant ID

```json
{
  "userId": "u-1",
  "tenantId": "tenant-1",  // ← Embedded in token
  "role": "local_admin"
}
```

**Every** API request:
- Extracts tenantId from JWT
- Adds WHERE tenant_id = tenantId to query
- Prevents cross-tenant data access

#### 3. Row-Level Security (RLS)

**Database enforces** tenant isolation even if bug in application code:

```sql
-- Defined on every tenant-scoped table
CREATE POLICY "tenant_isolation"
ON trainees FOR ALL
USING (tenant_id = current_user_tenant_id);

-- Effect:
-- Even if app code forgets WHERE clause,
-- Database itself silently filters
-- Cannot read/write other tenant data
```

### Super Admin Access

**Super Admins** need to access all tenants.

How it's done:
```
Super admin creates JWT with:
{
  "userId": "sa-1",
  "tenantId": "platform",  // ← Special sentinel value
  "role": "super_admin"
}

When API called with tenantId='platform':
- Supabase RLS policy detects super admin
- Allows access to all tenant data
- Used for cross-tenant reports/analytics

But normal admin with tenantId='tenant-1' still isolated.
```

### Tenant Switching (Multi-Tenant Users)

**What if user belongs to multiple organizations?**

```
User: John (belongs to LGU Manila AND Training Org A)

Login flow:
1. Enters credentials
2. Backend checks users_tenants table
3. Finds 2 tenants associated
4. Sends "tenant selection" response
5. Frontend shows list of 2 orgs
6. User picks one (e.g., LGU Manila)
7. Frontend sends POST /api/auth/select-tenant
   with { tenant_id: "lguman", selection_token: "..." }
8. Backend creates JWT with selected tenant
9. JWT now has tenantId="lguman"
10. User can only access LGU Manila data
11. To switch to Training Org A, must log out and log back in
    (Or system might support in-app tenant switching)
```

---

## Data Protection

### Encryption

#### At Rest (Database)

**Transit**: Data in database is not encrypted by default
**Mitigation**:
- Sensitive data (passwords) are hashed not encrypted
- Sensitive fields (medical info) can be encrypted at app level
- Database access requires authentication
- Database backups encrypted with provider key (Supabase)

#### In Transit (Network)

**All communication** uses HTTPS (TLS 1.2+):
```
Client → (encrypted tunnel) → Server

Attacker can see:
- You visited example.com
- Approximate amount of data sent

Attacker CANNOT see:
- Your passwords
- Your data content
- API requests/responses
```

### Data Sanitization

**Prevention of SQL Injection**:

```typescript
// WRONG - Vulnerable to injection
query(`SELECT * FROM users WHERE email = '${email}'`);
// If email = "' OR '1'='1", returns all users

// RIGHT - Parameterized query (used by system)
query('SELECT * FROM users WHERE email = ?', [email]);
// Email treated as literal string, not SQL code
```

### Data Retention

**Soft Delete**:
- When trainee deleted, record not physically removed
- Marked with `deleted_at` timestamp
- Can be recovered if needed
- Audit trail preserved

**Permanent Data**:
- Login history (audit logs) kept for 1+ year
- Certificate records kept indefinitely
- Can be deleted manually by super admin if needed

---

## Audit & Compliance

### Activity Logging

**Every action is logged**:
```
ACTIVITY_LOGS table:
┌────────────────────────────────────────┐
│ timestamp │ user_id │ action │ entity
├────────────────────────────────────────┤
│ 09:15:23  │ u-1     │ LOGIN  │ -
│ 09:16:45  │ u-1     │ CREATE │ TRAINEE: t-123
│ 09:20:12  │ u-1     │ UPDATE │ PROGRAM: p-45
│ 10:05:33  │ u-2     │ MARK   │ ATTENDANCE
│ 10:12:44  │ u-1     │ LOGOUT │ -
└────────────────────────────────────────┘
```

**Logged details**:
- Who performed action (user_id)
- What action (create, update, delete, etc.)
- When (timestamp)
- What was affected (record ID, name)
- Old value → new value (for updates)
- IP address and user agent (device info)

**Cannot be deleted by users** (only super admin can archive)

### Compliance Support

**GDPR** (General Data Protection Regulation):
- Users can export their data
- Users can request deletion (right to be forgotten)
- Audit trail shows all access/modifications
- System shows data processing practices

**Data Protection**:
- Passwords never logged
- Personal data in transit encrypted
- Database access controlled
- Backups encrypted

---

## Security Best Practices

### For All Users

✅ **Do**:
- Use strong passwords (uppercase, lowercase, numbers)
- Change password every 6 months
- Log out when done (don't leave system open)
- Be cautious of phishing emails
- Report suspicious activity immediately
- Keep credentials private (don't share)
- Use work device on secure network
- Lock screen when step away

❌ **Don't**:
- Share login credentials with anyone
- Use same password for multiple sites
- Write password on visible paper
- Log in on public WiFi without VPN
- Click suspicious links in emails
- Leave system unattended while logged in
- Use weak passwords like "123456"
- Respond to phishing emails asking for password

### For Administrators

✅ **Do**:
- Regularly review audit logs for suspicious activity
- Monitor for multiple failed login attempts
- Verify email addresses before approving registrations
- Keep system updated with security patches
- Perform regular backups
- Test disaster recovery procedures
- Train staff on security practices
- Document all access/changes

❌ **Don't**:
- Share admin accounts (each admin gets own account)
- Disable HTTPS or security features
- Use weak passwords for admin accounts
- Allow unauthenticated access
- Store credentials in code/documents
- Delete audit logs without reason
- Test on production (use dev environment)
- Ignore security warnings

### For Developers

✅ **Do**:
- Validate all user inputs with Zod schemas
- Use parameterized queries (no string interpolation)
- Check permissions in middleware
- Encrypt sensitive data
- Use HTTPS for all communication
- Keep dependencies updated
- Run security tests before deploy
- Review code for vulnerabilities

❌ **Don't**:
- Trust user input (always validate)
- Show sensitive details in error messages
- Store passwords in plain text
- Hardcode secrets in code
- Disable security checks
- Use outdated libraries
- Deploy to production without testing
- Ignore security warnings in tools

---

## Incident Response

### If You Suspect Compromise

**Password Leaked or Stolen**:
1. Immediately go to **[Change Password]**
2. Create new strong password
3. Notify administrator
4. Check email for suspicious login notifications
5. If email hacked, contact email provider

**Unauthorized Access Detected**:
1. Immediately log out all sessions: Go to Profile → [Log Out All Sessions]
2. Change password
3. Contact administrator immediately
4. Describe what happened
5. Administrator can:
   - Review audit logs
   - See all actions taken by your account
   - Restore any data if modified

**Suspicious Email**:
1. Do NOT click links
2. Do NOT enter credentials
3. Report as phishing
4. Forward to administrator
5. Delete email

### Administrator Response

**If User Reports Compromise**:
1. Check audit logs for user's account
   - See all actions taken
   - Identify what was accessed/modified
   - Note timestamps

2. Check failed login attempts
   - Review login history
   - Look for unusual locations/devices

3. Review data for modifications
   - What records were created/deleted?
   - What was changed?
   - Can it be rolled back?

4. Take action:
   - Reset user's password
   - Revoke all refresh tokens (force logout)
   - If data compromised, restore from backup
   - Notify affected stakeholders
   - Document incident

### Security Patch Process

When vulnerability discovered:
1. Assess severity
2. Create fix in code
3. Test in dev/staging environment
4. Deploy to production during maintenance window
5. Verify fix deployed correctly
6. Notify users if action needed

---

## Role Permissions Matrix

| Feature | Super Admin | Local Admin | Train. Coord | Inv. Manager | Trainee |
|---------|-------------|------------|--------------|--------------|---------|
| **Trainees** |
| View all trainees | ✓ (all) | ✓ (own tenant) | ✓ (own tenant) | - | - |
| Create trainee | ✓ | ✓ | - | - | - |
| Edit trainee | ✓ | ✓ | - | - | ✓ (self) |
| Delete trainee | ✓ | ✓ | - | - | - |
| **Programs** |
| View programs | ✓ | ✓ | ✓ | - | ✓ (enrolled) |
| Create program | ✓ | ✓ | - | - | - |
| Edit program | ✓ | ✓ | - | - | - |
| **Attendance** |
| Mark attendance | ✓ | - | ✓ | - | ✓ (self) |
| View attendance | ✓ | ✓ | ✓ | - | ✓ (self) |
| **Certificates** |
| Create certificate | ✓ | - | ✓ | - | - |
| View certificate | ✓ | ✓ | ✓ | - | ✓ (self) |
| **Inventory** |
| Manage items | ✓ | - | - | ✓ | - |
| Track borrowing | ✓ | - | - | ✓ | - |
| **Accounts** |
| Create accounts | ✓ | ✓ | - | - | - |
| Manage accounts | ✓ | ✓ | - | - | - |
| **System** |
| Create tenants | ✓ | - | - | - | - |
| System settings | ✓ | - | - | - | - |
| View audit logs | ✓ | ✓ | - | - | - |

---

## Frequently Asked Security Questions

**Q: Is my password visible to anyone?**  
A: No. Passwords are hashed before storing. Even administrators can't see it. If you forget, you reset it (can't recover).

**Q: What if database is stolen?**  
A: Passwords are hashed (bcrypt), so attacker can't use them. Tokens are invalidated and stored as hashes. Minimal exposure.

**Q: Can someone see my data if I leave system open?**  
A: Session expires after 30 min of inactivity. Then person would need to log in with credentials. Always lock screen.

**Q: What if I use same email/password everywhere?**  
A: HIGH RISK. If one site breached, attacker can try password on other sites. Use unique passwords.

**Q: How do I know system is secure?**  
A: HTTPS everywhere (locked padlock in browser). Check URL starts with "https://" not "http://".

**Q: What data is permanently deleted?**  
A: Soft-deleted records retained indefinitely. To permanently delete, super admin must do it. Audit log shows deletion.

**Q: Can I see what others can see?**  
A: No. Database filters data by tenant and role. If you're trainee, you can only see your own data.

**Q: Is 2FA available?**  
A: Optional. Can be enabled by system administrator for added security.

---

**Last Updated:** September 2026  
**Documentation Version:** 1.0  
**Topic:** Security & Authentication

[← Back to Main Documentation](./README.md)
