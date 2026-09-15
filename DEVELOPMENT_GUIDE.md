# BMDC Development Guide

Quick reference for common development tasks.

## 🚀 Getting Started

### First Time Setup
```bash
# Clone the repository
git clone <repo>
cd bmdc1.1-main

# Setup Backend
cd Backend
npm install
cp .env.example .env
# Edit .env with Supabase credentials

# Setup Frontend
cd ../Frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL should be http://localhost:3003/api
```

### Start Development Servers
```bash
# Terminal 1: Backend
cd Backend && npm run dev

# Terminal 2: Frontend
cd Frontend && npm run dev
```

**Access**:
- Frontend: http://localhost:3001
- Backend: http://localhost:3003/api

---

## 📝 Common Tasks

### Add New API Endpoint

1. Create route file: `Backend/src/app/api/{resource}/[id]/route.ts`
2. Implement handler:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAsync } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/utils/responses';

export async function GET(request: NextRequest) {
  const authResult = await requireRoleAsync(request, ['trainee']);
  if ('error' in authResult) return authResult.error as NextResponse;
  
  const user = authResult.user;
  // Your logic here
  return successResponse(data);
}
```
3. Export handler: `export { GET, POST, PUT, DELETE }`
4. Test endpoint with curl or Postman

### Add New Frontend Component

1. Create file: `Frontend/src/components/ComponentName.tsx`
2. Use template:
```typescript
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ComponentNameProps {
  title: string;
  onAction: () => void;
}

export function ComponentName({ title, onAction }: ComponentNameProps) {
  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </Card>
  );
}

export default ComponentName;
```
3. Import in page and use: `<ComponentName title="Test" onAction={handleClick} />`

### Query Database

```typescript
// In Backend service
import { supabase } from '@/lib/db';

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id);

if (error) throw error;
return data;
```

### Make API Call from Frontend

```typescript
// In Frontend service or component
import { apiClient } from '@/services/api';

const response = await apiClient.get('/programs', {
  params: { status: 'active' }
});

const { data } = response.data;
```

### Update Database Schema

1. Create migration: `Backend/migrations/XXX_description.sql`
2. Write SQL:
```sql
-- Add new column
ALTER TABLE users ADD COLUMN phone TEXT;

-- Add constraint
ALTER TABLE trainees ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES users(id);
```
3. Apply via Supabase dashboard or CLI
4. Update service/query functions to match new schema

---

## 🔍 Authentication Details

### Token Flow
```
1. User logs in → credentials sent to /auth/login
2. Backend validates password → generates JWT tokens
3. Tokens returned: { accessToken, refreshToken }
4. Frontend encrypts and stores in sessionStorage
5. All API requests include: Authorization: Bearer {accessToken}
6. If 401 → frontend sends refresh token → gets new access token
```

### Adding Protected Route
```typescript
// Frontend
import ProtectedRoute from '@/components/ProtectedRoute';

<ProtectedRoute requiredRole="trainee">
  <TraineePage />
</ProtectedRoute>
```

### Checking User Role in Backend
```typescript
const authResult = await requireRoleAsync(request, ['admin', 'staff']);
if ('error' in authResult) return authResult.error;
const { user } = authResult; // { userId, role, tenantId }
```

---

## 🗄️ Database Schema Reference

### Key Tables

**users**
```
id (UUID), email, password_hash, created_at, updated_at
```

**trainees**
```
id (UUID), user_id (FK), tenant_id, first_name, last_name, 
phone, email, status, created_at, updated_at
```

**trainee_accounts** (Normalized: maps user ↔ trainee)
```
id (UUID), tenant_id, user_id (UNIQUE), trainee_id (UNIQUE)
```

**programs**
```
id (UUID), tenant_id, name, description, status ('active', 'completed', etc),
start_date, end_date, max_trainees, created_at
```

**enrollments**
```
id (UUID), trainee_id (FK), program_id (FK), tenant_id,
status ('enrolled', 'active', 'completed', etc), source ('social_share', 'direct', 'admin_assigned'),
enrollment_date, created_at
```

**attendance**
```
id (UUID), trainee_id (FK), session_id (FK), tenant_id,
date, session_label ('morning', 'afternoon'), status ('present', 'absent'),
selfie_morning_path, selfie_afternoon_path, gps_lat, gps_lng, created_at
```

---

## 🧪 Testing

### Backend Tests
```bash
cd Backend
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Frontend Tests
```bash
cd Frontend
npm run test              # Run tests
npm run test:coverage    # Coverage report
```

### Manual Testing Flow

**Registration → Approval → Login → Attendance**
1. Register new trainee at http://localhost:3001/register
2. Admin approves at http://localhost:3001/admin/registrations
3. Trainee logs in with provided credentials
4. Navigate to Attendance page
5. Mark attendance with photo
6. Verify photo loads on attendance details

---

## 🐛 Debugging

### Enable Debug Logging
```typescript
// Frontend
if (import.meta.env.DEV) {
  console.log('[Module] Debug info:', data);
}

// Backend
logger.debug(`[Service] Message:`, value);
```

### Check Database Connection
```bash
cd Backend && npm run verify-supabase
```

### Common Issues

**"React is not defined"**
- Check imports: `import { useState, useEffect } from 'react'`
- Don't use `React.useState`

**"getFileUrl is not defined"**
- Add import: `import { getFileUrl, apiClient } from '../services/api'`

**Attendance photos not loading**
- Check `/files` endpoint returns 200 OK
- Verify image path in database
- Ensure Authorization header is sent

**Login returns 401**
- Verify password hash matches in database
- Check if user record was created (not just pending)
- Try clearing sessionStorage and logging in again

---

## 📊 Performance Tips

### Frontend
- Use React.memo() for expensive components
- Lazy load routes with React.lazy()
- Optimize images with Next.js Image component
- Use useCallback() for event handlers in lists

### Backend
- Use database indexes on frequently queried columns
- Cache responses for public data (1 hour)
- Paginate large result sets (default: 50 items)
- Use connection pooling for database

---

## 🔒 Security Checklist

Before deployment:
- [ ] All passwords hashed (bcrypt)
- [ ] No secrets in code or logs
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] CSRF protection (no cookies, use tokens)
- [ ] Rate limiting enabled
- [ ] Error messages don't expose system details
- [ ] Database backups automated
- [ ] HTTPS enforced in production

---

## 📚 Code Style

### Naming Conventions
- **Files**: camelCase.ts, PascalCase.tsx for React components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase
- **Functions**: camelCase

### Comments
```typescript
// Good: What and why
const isEligible = age >= 18 && status === 'active'; // Trainees must be 18+

// Bad: Obvious
const x = 5; // Set x to 5
```

### Imports
```typescript
// Group imports: React → External → Internal
import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { getUser } from '@/services/api';
```

---

## 🎯 Performance Checklist

### Frontend
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse score > 80
- [ ] First contentful paint < 2s
- [ ] No console errors/warnings

### Backend
- [ ] API response time < 200ms (avg)
- [ ] Database queries indexed
- [ ] Memory usage < 500MB
- [ ] No unhandled promise rejections

---

## 📞 Support

For issues:
1. Check console for errors
2. Review recent changes in git
3. Search GitHub issues
4. Ask in team chat with error stack trace
5. Create detailed bug report

---

**Last Updated**: September 4, 2026
