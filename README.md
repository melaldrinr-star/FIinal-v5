# BMDC 1.1 - Trainee Management & Attendance System

A full-stack web application for managing trainee training programs, attendance tracking, and certifications with encrypted session-based authentication.

## 📁 Project Structure

### Root Directory
```
bmdc1.1-main/
├── Backend/          # Next.js backend API server
├── Frontend/         # React/Vite frontend application
├── .vscode/          # VS Code workspace settings
├── .kiro/            # Kiro IDE configuration & specs
├── workspace/        # Multi-workspace configuration
└── README.md         # This file
```

## 🔧 Backend (`/Backend`)

### Technology Stack
- **Framework**: Next.js 16+ (API Routes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens in sessionStorage (no cookies)
- **Email**: Nodemailer integration
- **File Upload**: Sharp for image processing

### Key Directories
```
Backend/src/
├── app/api/          # API endpoints (organized by resource)
├── services/         # Business logic layer
│   ├── authService
│   ├── registrationService
│   ├── traineeService
│   ├── attendanceService
│   └── programService
├── middleware/       # Auth, CORS, error handling
├── lib/              # Utilities (database, encryption)
├── utils/            # Helper functions
└── types/            # TypeScript definitions
```

### Database
- **Migration System**: SQL migrations in `/migrations`
- **Active Schema**: `Normalize_full_schema.sql` (normalized 3NF structure)
- **Key Tables**: 
  - `users` - Authentication accounts
  - `trainees` - Trainee profiles
  - `trainee_accounts` - user_id ↔ trainee_id mapping
  - `programs` - Training programs
  - `enrollments` - Program enrollments
  - `attendance` - Daily attendance records

### Scripts
```
Backend/scripts/
├── seed-database.js       # Initialize database with sample data
├── seed-superadmin.js     # Create superadmin user
├── verify-supabase.js     # Verify Supabase connection
└── sync-trainee-email-links.js - Email link synchronization
```

### Running Backend
```bash
cd Backend
npm install
npm run dev          # Start dev server on port 3003
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests
```

---

## 🎨 Frontend (`/Frontend`)

### Technology Stack
- **Framework**: React 18+ with Vite
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios with token interceptors
- **Encryption**: AES encryption for sessionStorage tokens

### Key Directories
```
Frontend/src/
├── pages/            # Route components
├── components/       # Reusable UI components
├── services/         # API services
├── contexts/         # React Context (Auth, Programs, Theme)
├── utils/            # Helpers (encryption, date, validation)
├── hooks/            # Custom React hooks
└── types/            # TypeScript interfaces
```

### Authentication
- **Token Storage**: sessionStorage (not localStorage, not cookies)
- **Token Encryption**: AES-256 encrypted before storage
- **Token Format**: Bearer token in Authorization header
- **Refresh Logic**: Automatic refresh on 401 responses

### Key Pages
- **Login/Registration**: Public pages for account creation
- **Trainee Dashboard**: Personal profile and stats
- **Attendance Calendar**: Daily attendance tracking with photo capture
- **Programs**: Browse and enroll in training programs
- **Admin Dashboard**: Program and trainee management

### Running Frontend
```bash
cd Frontend
npm install
npm run dev          # Start dev server on port 3001
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account with PostgreSQL database

### Setup Instructions

1. **Clone & Install**
```bash
git clone <repo>
cd bmdc1.1-main

# Backend
cd Backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials

# Frontend
cd ../Frontend
npm install
cp .env.example .env
# Edit .env with API base URL
```

2. **Database Setup**
```bash
cd Backend
# Apply migrations using Supabase CLI or web console
# Upload Normalize_full_schema.sql for production schema
```

3. **Start Development**
```bash
# Terminal 1 - Backend
cd Backend && npm run dev

# Terminal 2 - Frontend
cd Frontend && npm run dev
```

4. **Access Application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3003/api
- Swagger Docs: http://localhost:3003/api/docs (if enabled)

---

## 🔐 Authentication Flow

### Registration
1. User submits registration form
2. Account created in `pending_registrations` with temp password
3. Admin approves registration
4. `users` record created with hashed password
5. Welcome email sent to trainee
6. Trainee logs in with provided credentials

### Login
1. User enters email + password
2. Backend validates credentials
3. JWT tokens generated (access + refresh)
4. Tokens returned to frontend
5. Frontend encrypts and stores in sessionStorage
6. All subsequent API calls include token in Authorization header

### Session Expiry
1. Access token expires (typically 15m)
2. API returns 401 Unauthorized
3. Frontend automatically sends refresh token
4. Backend issues new access token
5. Request is retried with new token
6. If refresh fails → user redirected to login

---

## 📊 Key Features

### Trainee Management
- Registration with email verification
- Role-based access control (superadmin, admin, staff, trainee)
- Profile management and data anonymization
- Certificate tracking and issuance

### Attendance System
- Calendar-based daily attendance marking
- Photo verification (morning + afternoon selfies)
- GPS location logging
- Device information tracking
- Timezone-aware date calculations

### Program Management
- Create and manage training programs
- Enrollment with automatic trainee linking
- Program status tracking (upcoming, active, completed)
- Social program sharing links (public enrollment)

### Communications
- Email notifications for registrations and approvals
- Automated email scheduling
- Password reset links
- Enrollment confirmations

---

## 🔒 Security

### Token Management
- **No Cookies**: All tokens in sessionStorage (CSRF resistant)
- **Encryption**: AES-256 encryption for stored tokens
- **Rotation**: Refresh tokens rotate on use
- **Expiry**: Short-lived access tokens (15 min), longer refresh tokens (7 days)

### Database
- **Row-Level Security**: Supabase RLS policies per role
- **Input Validation**: Zod schema validation
- **SQL Injection**: Parameterized queries throughout
- **Password Hashing**: bcrypt with 12 salt rounds

### API
- **CORS**: Configured for frontend origin only
- **Rate Limiting**: Available via middleware (if enabled)
- **Validation**: Request body/query validation on all endpoints
- **Error Handling**: Generic error responses (no system details exposed)

---

## 📝 Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3003/api
VITE_ENCRYPTION_KEY=your_encryption_key
```

---

## 🧪 Testing

### Backend
```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

### Frontend
```bash
npm run test              # Run tests with Vitest
npm run test:coverage    # Coverage report
```

---

## 📦 Deployment

### Backend (Vercel/Railway/AWS)
```bash
npm run build
npm start
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ directory
```

**Important**: Update environment variables in production environment.

---

## 🔄 Database Migrations

Migrations are applied in order:
```
001_initial_schema.sql
...
027_add_temp_password_for_registration.sql
Normalize_full_schema.sql  (Production: replaces full schema)
```

To apply new migrations:
1. Create file: `Backend/migrations/XXX_description.sql`
2. Deploy using Supabase dashboard or CLI
3. Verify schema with schema inspection queries

---

## 📋 Normalized Database Schema (3NF)

The `Normalize_full_schema.sql` implements Third Normal Form:
- Eliminates data redundancy
- Improves query performance
- Maintains referential integrity
- Supports complex relationships (many-to-many via junction tables)

Key normalized structures:
- `trainee_accounts`: Bridges users and trainees
- `enrollments`: Bridges trainees and programs
- `attendance`: Fact table for daily attendance

---

## 🛠️ Troubleshooting

### Common Issues

**Login 401 Error**
- Verify credentials in database
- Check token generation in backend
- Ensure sessionStorage has tokens

**Attendance Photos Not Loading**
- Verify `/files` endpoint is returning 200
- Check image paths in database
- Ensure API includes Authorization header

**Calendar Dates Wrong**
- Check timezone configuration
- Use local time (getFullYear/getMonth) not UTC
- Verify browser timezone settings

**Email Not Sending**
- Verify SMTP credentials
- Check spam folder
- Review nodemailer configuration
- Test with `npm run test:email`

---

## 📚 Documentation

Key documentation files have been archived in git history. Current focus:
- Code comments for complex logic
- README files in component directories
- TypeScript interfaces for data structures
- API route handlers document endpoints

---

## 👥 Team

- **Backend**: Next.js API + database schema
- **Frontend**: React/Vite UI + state management
- **DevOps**: Supabase database + deployment

---

## 📄 License

Proprietary - BMDC Training Management System

---

## 🎯 Next Steps

1. ✅ Fix React imports and dependencies
2. ✅ Complete attendance photo loading
3. ✅ Fix calendar date calculations
4. [ ] Deploy Normalize_full_schema.sql to production
5. [ ] Run full end-to-end testing (registration → approval → login → attendance)
6. [ ] Configure production environment variables
7. [ ] Set up monitoring and logging

---

**Last Updated**: September 4, 2026  
**Status**: Ready for production deployment
