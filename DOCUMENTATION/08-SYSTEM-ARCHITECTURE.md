# System Architecture & Data Flow Documentation
## BMDC 1.1 - Technical Architecture Overview

**Document Purpose:** Complete technical architecture, database schema, system flows, and integration details

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Database Schema](#database-schema)
5. [Key User Flows](#key-user-flows)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Integration Points](#integration-points)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Disaster Recovery](#disaster-recovery)

---

## System Overview

### What is BMDC 1.1?

BMDC 1.1 is a comprehensive web-based training management system designed for managing multiple training organizations (tenants) in a single platform.

### Core Purpose

- **Registration Management**: Self-service trainee registration with admin approval
- **Training Programs**: Create and manage training courses with enrollment
- **Attendance Tracking**: Daily attendance marking with photo verification
- **Certificate Generation**: Issue certificates upon completion
- **Inventory Management**: Track training equipment and materials
- **Multi-Tenancy**: Support multiple independent organizations
- **Reporting & Analytics**: Comprehensive reports and analytics

### Deployment Model

```
Single Platform Instance
├─ Multiple Tenants (Organizations/LGUs)
│  ├─ Tenant: LGU Manila
│  │  ├─ 324 trainees
│  │  ├─ 12 programs
│  │  └─ 8 staff members
│  ├─ Tenant: LGU Cebu
│  │  ├─ 287 trainees
│  │  ├─ 9 programs
│  │  └─ 5 staff members
│  └─ Tenant: Training Org A
│     └─ ...
└─ Platform Admins (Super Admin role)
```

---

## Technology Stack

### Frontend

```
React 18 + TypeScript
├─ Build Tool: Vite (fast development)
├─ Routing: React Router v6
├─ State Management: React Query (server state)
├─ UI Components: shadcn/ui + Radix UI
├─ Styling: Tailwind CSS
├─ Form Validation: React Hook Form + Zod
├─ HTTP Client: Axios with interceptors
├─ Notifications: Sonner (toast library)
└─ Date Handling: date-fns (timezone-aware)
```

**Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Backend

```
Next.js 16+ (Node.js runtime)
├─ API Routes: Serverless endpoints
├─ TypeScript: Type-safe backend
├─ Validation: Zod schemas
├─ Authentication: JWT + bcryptjs
├─ Email: Nodemailer
├─ Image Processing: Sharp (optimization)
├─ WebSocket: Socket.io (optional for real-time)
└─ Rate Limiting: express-rate-limit
```

**Runtime**: Node.js 18+

### Database

```
Supabase (PostgreSQL 14+)
├─ Database: PostgreSQL 14+
├─ Real-time: Supabase Real-time
├─ Authentication: Supabase Auth (optional)
├─ Storage: Supabase Storage (files)
├─ Row-Level Security: Built-in RLS policies
└─ Backups: Automated daily + point-in-time recovery
```

**Features**:
- 3NF normalized schema
- 30+ tables
- 16+ performance indexes
- RLS policies for tenant isolation

### Infrastructure

```
Deployment Platforms:
├─ Frontend: Vercel (Next.js native)
├─ Backend: Vercel, Railway, or AWS Lambda
└─ Database: Supabase (hosted PostgreSQL)

CDN & Caching:
├─ Vercel Edge Network (frontend)
├─ Supabase S3-compatible storage (media)
└─ CloudFlare (optional DDoS protection)
```

### External Services

```
Email: Nodemailer (SMTP)
├─ SMTP Server: Gmail, SendGrid, AWS SES
└─ Purpose: Registration approval, password reset, notifications

Image Processing: Sharp
├─ Resize and optimize uploads
└─ Generate thumbnails

File Storage: Supabase Storage
├─ Photos (trainees, programs, items)
├─ Certificates (PDFs)
└─ Borrowing slips
```

---

## Architecture Layers

### Presentation Layer (Frontend)

```
┌─────────────────────────────────────────┐
│         React SPA (Vite Build)          │
├─────────────────────────────────────────┤
│                                         │
│  Pages (React Components)               │
│  ├─ Public: Login, Register             │
│  ├─ Trainee: Dashboard, Attendance      │
│  ├─ Admin: Programs, Trainees           │
│  └─ Staff: Attendance, Inventory        │
│                                         │
│  Features:                              │
│  ├─ Client-side routing (React Router)  │
│  ├─ Form validation (React Hook Form)   │
│  ├─ Token management (Context)          │
│  ├─ API calls (Axios with interceptors) │
│  └─ Error handling                      │
│                                         │
└─────────────────────────────────────────┘
            │
            │ HTTPS REST API
            │ (Bearer token auth)
            V
```

### API Layer (Backend)

```
┌─────────────────────────────────────────┐
│      Next.js API Routes (Serverless)    │
├─────────────────────────────────────────┤
│                                         │
│  Middleware Stack:                      │
│  1. CORS & Security Headers             │
│  2. Request Parsing (JSON)              │
│  3. Authentication (JWT verify)         │
│  4. Tenant Context Extraction           │
│  5. Authorization (Role checks)         │
│  6. Input Validation (Zod schemas)      │
│  7. Error Handling & Logging            │
│                                         │
│  Route Handlers:                        │
│  /api/auth/*         - Login, logout    │
│  /api/trainees/*     - Trainee CRUD     │
│  /api/programs/*     - Program CRUD     │
│  /api/attendance/*   - Attendance       │
│  /api/certificates/* - Certs            │
│  /api/items/*        - Inventory        │
│  /api/admin/*        - Admin ops        │
│                                         │
└─────────────────────────────────────────┘
            │
            │ Parameterized Queries
            │ (No SQL injection)
            V
```

### Business Logic Layer

```
┌─────────────────────────────────────────┐
│       Service Classes (TypeScript)      │
├─────────────────────────────────────────┤
│                                         │
│  RegistrationService                    │
│  ├─ submitRegistration()                │
│  ├─ approveRegistration()               │
│  └─ rejectRegistration()                │
│                                         │
│  AttendanceService                      │
│  ├─ markAttendance()                    │
│  ├─ getAttendanceStats()                │
│  └─ generateAttendanceReport()          │
│                                         │
│  CertificateService                     │
│  ├─ generateCertificate()               │
│  ├─ verifyCertificate()                 │
│  └─ issueCertificate()                  │
│                                         │
│  InventoryService                       │
│  ├─ createItem()                        │
│  ├─ trackBorrowing()                    │
│  └─ updateStock()                       │
│                                         │
└─────────────────────────────────────────┘
            │
            │ Calls Repository Layer
            V
```

### Data Access Layer (Repository)

```
┌─────────────────────────────────────────┐
│        Database Repositories            │
├─────────────────────────────────────────┤
│                                         │
│  TraineeRepository                      │
│  ├─ find(id)                            │
│  ├─ findAll(filters)                    │
│  ├─ create(data)                        │
│  ├─ update(id, data)                    │
│  └─ delete(id)                          │
│                                         │
│  AttendanceRepository                   │
│  ├─ markAttendance(data)                │
│  ├─ getByDate(date)                     │
│  └─ getStats(trainee, program)          │
│                                         │
│  [Similar for other entities]           │
│                                         │
└─────────────────────────────────────────┘
            │
            │ Supabase JS Client
            │ (With RLS enforcement)
            V
```

### Database Layer

```
┌─────────────────────────────────────────┐
│    PostgreSQL (Supabase Hosted)         │
├─────────────────────────────────────────┤
│                                         │
│  Tables (3NF Normalized):               │
│  ├─ tenants                             │
│  ├─ users, users_tenants                │
│  ├─ trainees, trainee_photos            │
│  ├─ programs, enrollments               │
│  ├─ attendance, attendance_exceptions   │
│  ├─ certificates                        │
│  ├─ items, lendings, borrowing_slips    │
│  ├─ activity_logs, revoked_tokens       │
│  └─ refresh_tokens                      │
│                                         │
│  Policies:                              │
│  ├─ RLS (Row-Level Security)            │
│  ├─ Tenant isolation enforced           │
│  └─ Super admin bypass allowed          │
│                                         │
│  Indexes:                               │
│  ├─ PK indexes (primary keys)           │
│  ├─ FK indexes (foreign keys)           │
│  ├─ Tenant IDs (for RLS)                │
│  └─ Search fields (email, name)         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables (3NF Normalized)

#### Tenant Management

```
tenants
├─ id (UUID, PK)
├─ name (VARCHAR, unique)
├─ status ('active'|'inactive'|'suspended')
├─ contact_email
├─ contact_phone
├─ address
├─ created_at
└─ updated_at

users
├─ id (UUID, PK)
├─ email (VARCHAR, unique)
├─ username (VARCHAR, unique)
├─ password_hash (bcrypt)
├─ role ('super_admin'|'local_admin'|'staff_training_coordinator'|'staff_inventory_manager'|'trainee')
├─ created_at
└─ updated_at

users_tenants (junction table)
├─ user_id (UUID, FK→users)
├─ tenant_id (UUID, FK→tenants)
├─ is_primary (boolean)
└─ PK: (user_id, tenant_id)
```

#### Trainee & Program Management

```
trainees
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ first_name, last_name, middle_name
├─ email, phone
├─ sex, birth_date, birth_place, civil_status
├─ province, municipality, barangay, street
├─ educational_attainment, course, year_graduated
├─ classification, disability, employment_status
├─ status ('active'|'inactive'|'completed'|'dropped')
├─ registration_status
├─ registration_rejection_reason
├─ photo_path, thumbnail_path
├─ emergency_contact_name, emergency_contact_phone
├─ deleted_at (soft delete)
├─ created_at, updated_at
└─ RLS: tenant_id based access

programs
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ name, description
├─ start_date, end_date, duration_weeks
├─ status ('upcoming'|'active'|'completed'|'cancelled')
├─ max_trainees, enrollment_limit
├─ instructor, type_of_funding
├─ image_path, thumbnail_path
├─ created_at, updated_at
└─ RLS: tenant_id based access

enrollments
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ trainee_id (UUID, FK→trainees)
├─ program_id (UUID, FK→programs)
├─ enrollment_date
├─ completion_date
├─ status ('enrolled'|'active'|'completed'|'dropped'|'failed')
├─ source ('social_share'|'direct'|'admin_assigned')
├─ final_grade
├─ created_at, updated_at
└─ RLS: tenant_id based access
```

#### Attendance & Certificates

```
attendance
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ program_id (UUID, FK→programs)
├─ trainee_id (UUID, FK→trainees)
├─ enrollment_id (UUID, FK→enrollments)
├─ attendance_date (DATE)
├─ morning_present, afternoon_present (boolean)
├─ morning_time_in, morning_time_out (TIME)
├─ afternoon_time_in, afternoon_time_out (TIME)
├─ morning_photo_path, afternoon_photo_path
├─ morning_selfie_path, afternoon_selfie_path
├─ device_info (JSONB)
├─ gps_location
├─ status ('present'|'absent'|'excused')
├─ created_at, updated_at
└─ RLS: tenant_id based access

certificates
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ enrollment_id (UUID, FK→enrollments)
├─ certificate_number (VARCHAR, unique per tenant)
├─ issue_date
├─ file_path
├─ qr_code
├─ qr_code_path
├─ verification_url
├─ signatory_name, signatory_title
├─ created_at, updated_at
└─ RLS: tenant_id based access
```

#### Inventory Management

```
items
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ name, description
├─ category
├─ unit
├─ quantity, available_quantity, minimum_quantity
├─ location
├─ qr_code, image_path, thumbnail_path, qr_code_path
├─ status ('available'|'low_stock'|'out_of_stock'|'maintenance')
├─ condition ('good'|'fair'|'poor'|'maintenance')
├─ purchase_date, created_by
├─ created_at, updated_at
└─ RLS: tenant_id based access

lendings
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ item_id (UUID, FK→items)
├─ trainee_id (UUID, FK→trainees)
├─ borrower_name
├─ borrower_contact
├─ quantity
├─ lent_date, expected_return_date, actual_return_date
├─ status ('active'|'returned'|'overdue'|'lost')
├─ lent_by, returned_by
├─ created_at, updated_at
└─ RLS: tenant_id based access

borrowing_slips
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ lending_id (UUID, FK→lendings)
├─ item_id (UUID, FK→items)
├─ borrower_name
├─ item_name
├─ quantity
├─ borrowing_date, due_date, returned_at
├─ slip_number (unique per tenant)
├─ status
├─ generated_at
└─ RLS: tenant_id based access
```

#### Support Tables

```
pending_registrations
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ program_id (UUID, FK→programs)
├─ [All trainee profile fields]
├─ status ('pending'|'approved'|'rejected')
├─ rejection_reason
├─ reviewed_by, reviewed_at
└─ created_at

attendance_exceptions
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ program_id (UUID, FK→programs)
├─ trainee_id (UUID, FK→trainees)
├─ exception_type ('no_attendance_day'|'schedule_override'|'makeup_session'|'holiday')
├─ exception_date
├─ exception_start_time, exception_end_time
├─ custom_morning_open/close, custom_afternoon_open/close
├─ is_full_day_off
├─ reason

refresh_tokens
├─ id (UUID, PK)
├─ user_id (UUID, FK→users)
├─ token_hash (SHA-256 hash)
├─ expires_at, revoked_at, last_used_at
├─ created_ip, created_user_agent
├─ rotated_from (previous token hash)

revoked_tokens
├─ jti (VARCHAR, PK) [JWT ID]
├─ user_id (UUID, FK→users)
├─ revoked_at

activity_logs
├─ id (UUID, PK)
├─ tenant_id (UUID, FK→tenants)
├─ user_id (UUID, FK→users)
├─ action
├─ entity_type
├─ entity_id
├─ details (JSONB)
├─ ip_address
├─ user_agent
├─ created_at
```

### Indexes for Performance

```
Primary Indexes (automatically created on PK):
├─ tenants.id
├─ users.id
├─ trainees.id
└─ [All other PKs]

Foreign Key Indexes (for RLS and joins):
├─ trainees.tenant_id
├─ programs.tenant_id
├─ enrollments.tenant_id
├─ attendance.tenant_id
├─ items.tenant_id
└─ [All FK fields]

Search Indexes:
├─ users.email
├─ trainees.email
├─ programs.name
├─ items.name
└─ [Common filter fields]

Composite Indexes (for common queries):
├─ attendance (program_id, trainee_id, attendance_date)
├─ enrollments (program_id, trainee_id, status)
└─ tenants_users (tenant_id, user_id)
```

---

## Key User Flows

### 1. Registration & Approval Flow

```
Public (No Auth)
    │
    V
Step 1: Self-Register (TraineeRegistrationPage)
    ├─ Fill personal info
    ├─ Fill address
    ├─ Fill education/employment
    ├─ Create login credentials
    └─ Submit → creates pending_registration record
    
Step 2: Email Confirmation
    └─ Trainee gets email: "Registration received, awaiting approval"
    
Local Admin
    │
    V
Step 3: Review & Approve (RegistrationsPage)
    ├─ See pending registrations
    ├─ Click [Approve]
    └─ Backend:
        ├─ Create users record (email, password_hash)
        ├─ Create trainees record
        ├─ Create users_tenants association
        ├─ Create enrollment in program
        ├─ Update pending_registration status='approved'
        └─ Send approval email with credentials
    
Trainee
    │
    V
Step 4: Receive Email & Log In
    ├─ Email arrives with credentials
    ├─ Open login page
    ├─ Enter email/password
    └─ System:
        ├─ Verify credentials
        ├─ Create JWT token
        ├─ Return token + refresh token
        └─ Redirect to dashboard
```

### 2. Attendance Marking Flow

```
Trainee App (Mobile/Web)
    │
    V
Morning (8:00 AM - 12:00 PM)
    ├─ Open Attendance page
    ├─ Click [Mark Morning Attendance]
    ├─ Take selfie (camera capture)
    ├─ Confirm time in/time out
    ├─ Submit
    └─ Backend:
        ├─ Validate trainee enrolled in program
        ├─ Check attendance_exceptions (no class day?)
        ├─ Save attendance record (morning_present=true)
        ├─ Encrypt and store photo
        ├─ Return success
        └─ Frontend: Show "✓ Morning marked"
    
    [Break...]
    
Afternoon (1:00 PM - 5:00 PM)
    ├─ Click [Mark Afternoon Attendance]
    ├─ Take selfie
    ├─ Confirm time
    ├─ Submit
    └─ Backend:
        ├─ Update same attendance record
        ├─ Set afternoon_present=true
        ├─ Calculate daily status (present/absent)
        └─ Return success
    
Training Coordinator
    │
    V
Review & Audit
    ├─ Go to Attendance page
    ├─ Filter by program/trainee/date
    ├─ View all attendance records
    ├─ Click record to see:
    │  ├─ Photo verification
    │  ├─ Time stamps
    │  ├─ GPS location
    │  └─ Device info
    └─ Accept (legitimate) or escalate (suspicious)
```

### 3. Certificate Generation Flow

```
Training Coordinator
    │
    V
Automatic Process (On Program End Date):
    └─ Batch job runs:
        ├─ Query enrollments where program status='completed'
        ├─ Filter by attendance ≥ 80%
        ├─ For each eligible trainee:
        │  ├─ Generate certificate number (CERT-YYYY-NNNNNN)
        │  ├─ Create certificate record
        │  ├─ Generate QR code
        │  ├─ Render certificate PDF
        │  └─ Upload to storage
        └─ Send notification to trainees
    
Manual Process (Admin Triggered):
    ├─ Go to Certificates page
    ├─ Select program + eligible trainees
    ├─ Click [Generate Certificates]
    └─ Same as above
    
Trainee
    │
    V
Download Certificate
    ├─ Go to Certificates page
    ├─ See issued certificate
    ├─ Click [Download PDF]
    ├─ PDF downloaded
    └─ Can:
        ├─ Print physical copy
        ├─ Share QR code
        ├─ Post on LinkedIn
        └─ Send to employer
    
Public (No Auth)
    │
    V
Verify Certificate
    ├─ Scan QR code
    ├─ Public verification page shows:
    │  ├─ Trainee name
    │  ├─ Program name
    │  ├─ Issue date
    │  └─ Certificate valid/revoked status
    └─ No login required
```

---

## Data Flow Diagrams

### High-Level Request Flow

```
Browser Request
    │
    V
[HTTPS Encrypted]
    │
    V
Vercel Edge (CDN)
    │
    V
API Route Handler
    │
    ├─ Parse Request
    ├─ Extract JWT Token
    ├─ Verify Signature
    ├─ Extract Tenant ID
    ├─ Validate Permissions
    ├─ Validate Input (Zod)
    │
    V
Business Logic Service
    │
    ├─ Apply Business Rules
    ├─ Call Repository
    │
    V
Database Repository
    │
    ├─ Build Query
    ├─ Add Tenant Filter
    ├─ Execute Query
    │
    V
Supabase PostgreSQL
    │
    ├─ Apply RLS Policy
    ├─ Filter by Tenant
    ├─ Execute Query
    ├─ Return Data
    │
    V
Repository (maps to models)
    │
    V
Service (transforms data)
    │
    V
API Route (serializes to JSON)
    │
    V
[HTTPS Encrypted]
    │
    V
Browser (decrypt with AES-256, update UI)
```

### Multi-Tenant Isolation

```
Request from User A (LGU Manila)
    │
    JWT contains: tenantId = "lguman"
    │
    V
Query: SELECT * FROM trainees WHERE tenant_id = 'lguman'
    │
    └─ Frontend adds tenant filter
    └─ Backend adds tenant filter
    └─ Database RLS adds tenant filter (triple protection)
    │
    V
Results: Only trainees with tenant_id='lguman'
    
─────────────────────────────────────────

Request from User B (LGU Cebu)
    │
    JWT contains: tenantId = "lgucebu"
    │
    V
Query: SELECT * FROM trainees WHERE tenant_id = 'lgucebu'
    │
    V
Results: Only trainees with tenant_id='lgucebu'

→ Even if User A hacks and changes query,
  RLS policy at database level prevents access
→ User A's data and User B's data remain isolated
```

---

## Integration Points

### External Services

#### Email (Nodemailer)

```
When to Send Emails:
├─ Registration Approved/Rejected
├─ Login Credentials (new admin account)
├─ Password Reset Request
├─ Program Enrollment Confirmation
├─ Attendance Reminders
├─ Certificate Issued Notification
└─ Overdue Item Reminders

Flow:
App Event
    │
    V
EmailService.send({
    to: user_email,
    subject: "...",
    template: "...",
    data: {...}
})
    │
    V
Nodemailer sends via SMTP
    │
    V
Email arrives in inbox
```

#### Image Processing (Sharp)

```
When to Process Images:
├─ Trainee photo upload
├─ Program image upload
├─ Item image upload
└─ Attendance photo capture

Processing Pipeline:
Original Upload (JPG/PNG)
    │
    V
Sharp Processor:
    ├─ Resize to 800x600
    ├─ Compress (90% quality)
    ├─ Convert to modern format (WEBP)
    ├─ Generate thumbnail (200x150)
    │
    V
Upload to Supabase Storage
    │
    ├─ Original: /photos/trainee-123.webp
    ├─ Thumbnail: /photos/trainee-123-thumb.webp
    │
    V
Store path in Database
```

#### File Storage (Supabase Storage)

```
Files Stored:
├─ Trainee Photos: /trainees/{trainee_id}/
├─ Program Images: /programs/{program_id}/
├─ Certificates: /certificates/{certificate_id}.pdf
├─ Attendance Photos: /attendance/{attendance_id}/
└─ Item Images: /items/{item_id}/

Access Pattern:
Database stores path: "/trainees/abc123.jpg"
    │
    V
Frontend requests: /storage/download?path=/trainees/abc123.jpg
    │
    V
Backend validates permissions
    │
    V
Supabase Storage returns signed URL
    │
    V
Frontend displays image
```

---

## Deployment Architecture

### Development Environment

```
Developer Laptop
├─ Frontend: npm run dev (Vite on localhost:5173)
├─ Backend: npm run dev (Next.js on localhost:3003)
└─ Database: Local Supabase instance (or staging)
```

### Staging Environment

```
Staging Server
├─ Frontend: Deployed to Vercel staging
├─ Backend: Deployed to Vercel API staging
├─ Database: Supabase staging project
└─ Used for: QA testing, feature preview
```

### Production Environment

```
Production (Multi-Region Recommended)
├─ Frontend
│  └─ Vercel (global CDN, auto-scaling)
│     ├─ Next.js SPA deployment
│     ├─ Static assets cached globally
│     └─ Serverless functions
│
├─ Backend
│  └─ Vercel or Railway
│     ├─ Next.js API routes
│     ├─ Auto-scaling by load
│     └─ 99.95% uptime SLA
│
└─ Database
   └─ Supabase
      ├─ PostgreSQL 14
      ├─ Automated backups
      ├─ Point-in-time recovery
      ├─ Read replicas (optional)
      └─ Multi-region failover (optional)
```

### Environment Variables

**Frontend (.env)**:
```
VITE_API_BASE_URL=https://api.domain.com
VITE_ENCRYPTION_KEY=<32-char encryption key>
VITE_APP_NAME=BMDC 1.1
```

**Backend (.env)**:
```
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# Authentication
JWT_SECRET=<32-char random string>
REFRESH_TOKEN_EXPIRES_DAYS=14
ACCESS_TOKEN_EXPIRES_MINUTES=15

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx@gmail.com
SMTP_PASS=xxx

# Security
CORS_ORIGIN=https://domain.com
API_RATE_LIMIT=100
```

---

## Performance & Scalability

### Database Performance

```
Query Optimization:
├─ Indexes on:
│  ├─ Primary keys
│  ├─ Foreign keys
│  ├─ Tenant IDs (RLS filtering)
│  ├─ Search fields (email, name)
│  └─ Filter fields (status, date)
│
├─ Query patterns:
│  ├─ Parameterized queries (prevent SQL injection)
│  ├─ Selective columns (not SELECT *)
│  ├─ Pagination (not all results at once)
│  └─ Lazy loading (load data on demand)
│
└─ Monitoring:
   ├─ Query execution time
   ├─ Slow query log
   ├─ Connection pooling
   └─ Auto-scaling by load
```

### Frontend Performance

```
Optimization Techniques:
├─ Code Splitting (Vite)
│  └─ Lazy load pages on demand
│
├─ Image Optimization
│  ├─ Compress before upload
│  ├─ Use modern formats (WEBP)
│  └─ Lazy load images
│
├─ Caching Strategy
│  ├─ React Query (5-10 min cache)
│  ├─ Browser cache (static assets)
│  └─ Service Worker (offline capability)
│
└─ Bundle Size
   ├─ Tree-shaking (remove unused code)
   ├─ Minification
   └─ Compression (GZIP)

Metrics:
├─ Largest Contentful Paint (LCP) < 2.5s
├─ First Input Delay (FID) < 100ms
├─ Cumulative Layout Shift (CLS) < 0.1
└─ Lighthouse score > 90
```

### Scalability

```
Horizontal Scaling:
├─ Frontend: Vercel auto-scales
├─ Backend: Vercel/Railway auto-scales
└─ Database: Supabase handles connection pooling

Vertical Scaling:
├─ Database: Upgrade plan (more compute/storage)
├─ CDN: Increase cache size
└─ API: Increase rate limits

Load Handling:
├─ 1,000s of concurrent users
├─ Millions of records
├─ Gigabytes of storage
└─ Sub-second response times
```

---

## Disaster Recovery

### Backup Strategy

```
Database Backups:
├─ Automated daily backups (Supabase)
├─ Point-in-time recovery (30 days)
├─ Manual backups before major updates
└─ Off-site storage (multiple regions)

File Storage Backups:
├─ Supabase Storage replication
├─ Regular exports to archive
└─ Retention: 90+ days

Code Backups:
├─ Git repository (GitHub)
├─ Deployment history (Vercel)
└─ Tagged releases
```

### Recovery Procedures

```
Database Corruption/Loss:
1. Assess damage
2. Decide recovery point (from backup)
3. Restore to staging environment
4. Verify data integrity
5. Restore to production
6. Notify users if data loss

Application Failure:
1. Identify root cause
2. Rollback to previous version
3. Test in staging
4. Deploy fixed version
5. Verify functionality
6. Monitor for issues

Data Center Outage:
1. Auto-failover to backup region
2. Notify stakeholders
3. Monitor recovery
4. Verify functionality
5. Document incident

Recovery Time Objective (RTO): < 1 hour
Recovery Point Objective (RPO): < 24 hours
```

---

**Last Updated:** September 2026  
**Documentation Version:** 1.0  
**Topic:** System Architecture & Data Flow

[← Back to Main Documentation](./README.md)
