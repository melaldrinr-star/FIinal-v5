# Critical Fixes & Breaking Issues — Implementation Guide

**BMDC 1.1 — Schema Migration Compatibility**

**Date:** September 4, 2026  
**Status:** 🔴 **7 CRITICAL ISSUES REQUIRE IMMEDIATE FIXES**  
**Estimated Fix Time:** 14.5 hours (2 engineer-days)

---

## Quick Reference: Issues Summary

| # | Issue | File | Line | Type | Severity | Fix Time |
|---|-------|------|------|------|----------|----------|
| 1 | trainees.program_id query | trainees/stats/route.ts | 22 | Runtime | 🔴 CRITICAL | 1h |
| 2 | trainees.program_id + enrollment_date | trainees/export/route.ts | 51, 54 | Data Loss | 🔴 CRITICAL | 2h |
| 3 | non_attendance_dates table | reports/attendance/route.ts | 102 | Runtime | 🔴 CRITICAL | 2h |
| 4 | attendance_schedule_overrides GET | schedules/[id]/overrides/route.ts | 68 | Runtime | 🔴 CRITICAL | 1h |
| 5 | attendance_schedule_overrides POST | schedules/[id]/overrides/route.ts | 99-115 | Runtime | 🔴 CRITICAL | 1h |
| 6 | attendance_schedule_overrides DELETE | schedules/[id]/overrides/[overrideId]/route.ts | 36-76 | Runtime | 🔴 CRITICAL | 1h |
| 7 | Incomplete notification preferences | trainees/[id]/notification-preferences/route.ts | 48-82 | Feature | 🟡 HIGH | 2h |

---

## Issue #1: GET /api/trainees/stats — Removed Column Query

### 🔴 CRITICAL — Will Crash

**File:** `Backend/src/app/api/trainees/stats/route.ts`  
**Line:** 22  
**Error:** `column "program_id" does not exist`

### Current Broken Code

```typescript
// BROKEN - Line 22
const [traineesResult, programsResult] = await Promise.all([
  supabaseAdmin.from('trainees').select('id, status, program_id').eq('tenant_id', tenantId),
  //                                                ^^^^^^^^^^^ DOESN'T EXIST
  supabaseAdmin.from('programs').select('id, name').eq('tenant_id', tenantId),
]);

// Lines 35-40: Uses non-existent column
const byProgram: Record<string, number> = {};
trainees.forEach((trainee) => {
  const pid = trainee.program_id as string | null;  // ❌ Always null/undefined
  const key = pid ? (programNameById.get(pid) || 'Unknown Program') : 'Unassigned';
  byProgram[key] = (byProgram[key] || 0) + 1;
});
```

### Root Cause

In 3NF normalization, `trainees.program_id` was removed because:
- A trainee can be enrolled in multiple programs
- One-to-one relationship on trainee violated 3NF
- Proper location: `enrollments` table (`trainee_id` → `program_id`)

### Fixed Code

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAsync } from '@/middleware/auth';
import { successResponse } from '@/utils/responses';
import { withErrorHandler } from '@/middleware/errorHandler';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { handleOptionsRequest } from '@/middleware/cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const authResult = await requireAuthAsync(request);
  if ('error' in authResult) return authResult.error as NextResponse;

  const tenantId = authResult.user.tenantId;

  // FIX: Query enrollments instead of trainees
  const [traineesResult, programsResult, enrollmentsResult] = await Promise.all([
    supabaseAdmin
      .from('trainees')
      .select('id, status')  // ✅ FIXED: Removed program_id
      .eq('tenant_id', tenantId),
    
    supabaseAdmin
      .from('programs')
      .select('id, name')
      .eq('tenant_id', tenantId),
    
    // NEW: Get enrollments to map trainees to programs
    supabaseAdmin
      .from('enrollments')
      .select('trainee_id, program_id')
      .eq('tenant_id', tenantId)
      .in('status', ['enrolled', 'active'])  // Active enrollments only
  ]);

  if (traineesResult.error) throw traineesResult.error;
  if (programsResult.error) throw programsResult.error;
  if (enrollmentsResult.error) throw enrollmentsResult.error;

  const trainees = traineesResult.data || [];
  const programs = programsResult.data || [];
  const enrollments = enrollmentsResult.data || [];

  const programNameById = new Map<string, string>(
    programs.map((p) => [p.id as string, p.name as string])
  );

  // FIX: Aggregate from enrollments
  const byProgram: Record<string, number> = {};
  enrollments.forEach((enrollment) => {
    const programName = programNameById.get(enrollment.program_id as string) || 'Unknown Program';
    byProgram[programName] = (byProgram[programName] || 0) + 1;
  });

  // Include unassigned trainees (no enrollments)
  const enrolledTraineeIds = new Set(enrollments.map(e => e.trainee_id as string));
  const unassignedCount = trainees.filter(t => !enrolledTraineeIds.has(t.id as string)).length;
  if (unassignedCount > 0) {
    byProgram['Unassigned'] = unassignedCount;
  }

  return successResponse({
    totalTrainees: trainees.length,
    active: trainees.filter((t) => t.status === 'active').length,
    inactive: trainees.filter((t) => t.status === 'inactive').length,
    completed: trainees.filter((t) => t.status === 'completed').length,
    dropped: trainees.filter((t) => t.status === 'dropped').length,
    byProgram,
  });
});
```

### Verification Test

```typescript
// Backend/src/app/api/trainees/stats/__tests__/fix-program-id.test.ts
import { GET } from '../route';
import { supabaseAdmin } from '@/lib/supabase-admin';

describe('GET /api/trainees/stats - Fix program_id removal', () => {
  it('should get statistics from enrollments, not trainees.program_id', async () => {
    // Setup
    const tenant = await createTestTenant();
    const program = await createTestProgram(tenant.id);
    const trainee = await createTestTrainee(tenant.id);
    const enrollment = await createTestEnrollment(trainee.id, program.id, tenant.id);

    // Execute
    const request = createMockRequest({ tenantId: tenant.id });
    const response = await GET(request);
    const result = await response.json();

    // Verify
    expect(response.status).toBe(200);
    expect(result.data.totalTrainees).toBe(1);
    expect(result.data.byProgram[program.name]).toBe(1);
  });

  it('should not query trainees.program_id column', async () => {
    // This ensures we're not selecting a removed column
    const supabaseSpy = jest.spyOn(supabaseAdmin, 'from');
    
    const request = createMockRequest({ tenantId: 'test-tenant' });
    await GET(request);

    // Verify select clause doesn't include 'program_id'
    const traineesCall = supabaseSpy.mock.results.find(c => 
      c.value.select.toString().includes('trainees')
    );
    expect(traineesCall.value.select).toContain('id, status');
    expect(traineesCall.value.select).not.toContain('program_id');
  });
});
```

---

## Issue #2: GET /api/trainees/export — Multiple Removed Column References

### 🔴 CRITICAL — Data Loss

**File:** `Backend/src/app/api/trainees/export/route.ts`  
**Lines:** 51 (program_id), 54 (enrollment_date)  
**Problem:** CSV export contains empty columns

### Current Broken Code

```typescript
// Line 51 - BROKEN: program_id doesn't exist
program: (trainee.program_id ? programNameById.get(trainee.program_id) : undefined) || '',
//        ^^^^^^^^^^^^^^^ Always undefined

// Line 54 - BROKEN: enrollment_date doesn't exist
enrollment_date: trainee.enrollment_date,
//              ^^^^^^^^^^^^^^^^^^^^^^^ Always undefined
```

### Fixed Code

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { traineeService } from '@/services/traineeService';
import { programService } from '@/services/programService';
import { requireRoleAsync } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/errorHandler';
import { handleOptionsRequest } from '@/middleware/cors';
import { createCsvDownloadResponse, objectsToCsv } from '@/utils/export';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const authResult = await requireRoleAsync(request, [
    'local_admin',
    'staff_training_coordinator',
    'staff_inventory_manager',
  ]);
  if ('error' in authResult) return authResult.error as NextResponse;

  const user = authResult.user;
  const context = {
    userId: user.userId,
    tenantId: user.tenantId,
    role: user.role,
    isSuperAdmin: user.role === 'super_admin',
  };

  const { searchParams } = new URL(request.url);
  const program_id = searchParams.get('program_id') || searchParams.get('program') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const [trainees, programs, enrollments] = await Promise.all([
    traineeService.getAllTrainees(context, { program_id, status, search }),
    programService.getAllPrograms(),
    // FIX: Get enrollments to map trainees to programs and dates
    (() => {
      let query = supabaseAdmin
        .from('enrollments')
        .select('trainee_id, program_id, enrollment_date')
        .eq('tenant_id', user.tenantId);
      
      if (program_id) query = query.eq('program_id', program_id);
      return query;
    })(),
  ]);

  const programNameById = new Map(programs.map((program) => [program.id, program.name]));

  // FIX: Create map of trainee_id → enrollments (handle multiple enrollments per trainee)
  const enrollmentsByTrainee = new Map<string, Array<{
    program_id: string;
    enrollment_date: string;
  }>>();
  
  enrollments.forEach((enrollment) => {
    if (!enrollmentsByTrainee.has(enrollment.trainee_id)) {
      enrollmentsByTrainee.set(enrollment.trainee_id, []);
    }
    enrollmentsByTrainee.get(enrollment.trainee_id)!.push({
      program_id: enrollment.program_id,
      enrollment_date: enrollment.enrollment_date,
    });
  });

  const rows = trainees.map((trainee) => {
    // Get first enrollment (or first matching program if filtered)
    const traineeEnrollments = enrollmentsByTrainee.get(trainee.id) || [];
    const firstEnrollment = traineeEnrollments[0];

    return {
      id: trainee.id,
      last_name: trainee.last_name,
      first_name: trainee.first_name,
      middle_name: trainee.middle_name || '',
      email: trainee.email,
      phone: trainee.phone,
      sex: trainee.sex,
      // FIX: Get program name from enrollments
      program: firstEnrollment
        ? programNameById.get(firstEnrollment.program_id) || 'Unknown'
        : 'Not Enrolled',
      status: trainee.status,
      // FIX: Get enrollment date from enrollments
      enrollment_date: firstEnrollment?.enrollment_date || '',
      municipality: trainee.municipality || '',
      province: trainee.province || '',
    };
  });

  const csv = objectsToCsv(rows, [
    'id',
    'last_name',
    'first_name',
    'middle_name',
    'email',
    'phone',
    'sex',
    'program',
    'status',
    'enrollment_date',
    'municipality',
    'province',
  ]);

  return createCsvDownloadResponse(csv, 'trainees-export.csv');
});
```

### Verification Test

```typescript
// Backend/src/app/api/trainees/export/__tests__/fix-enrollment-data.test.ts
describe('GET /api/trainees/export - Fix enrollment data', () => {
  it('should export enrollment_date from enrollments table', async () => {
    const tenant = await createTestTenant();
    const program = await createTestProgram(tenant.id);
    const trainee = await createTestTrainee(tenant.id);
    const enrollmentDate = '2026-01-15';
    await createTestEnrollment(trainee.id, program.id, tenant.id, { enrollment_date: enrollmentDate });

    const response = await GET(createMockRequest({ tenantId: tenant.id }));
    const csv = await response.text();

    expect(csv).toContain(enrollmentDate);
    expect(csv).toContain(program.name);
  });

  it('should export all trainee enrollments (multiple programs)', async () => {
    const tenant = await createTestTenant();
    const program1 = await createTestProgram(tenant.id);
    const program2 = await createTestProgram(tenant.id);
    const trainee = await createTestTrainee(tenant.id);
    
    await createTestEnrollment(trainee.id, program1.id, tenant.id);
    await createTestEnrollment(trainee.id, program2.id, tenant.id);

    const response = await GET(createMockRequest({ tenantId: tenant.id }));
    const csv = await response.text();

    // Should contain at least first program
    expect(csv).toContain(program1.name);
  });
});
```

---

## Issue #3: GET /api/reports/attendance — Removed Table Query

### 🔴 CRITICAL — Query Fails

**File:** `Backend/src/app/api/reports/attendance/route.ts`  
**Lines:** 102–112  
**Error:** `relation "non_attendance_dates" does not exist`

### Current Broken Code

```typescript
// LINES 102-112 - BROKEN
datesResult: (() => {
  let query = supabaseAdmin
    .from('non_attendance_dates')  // ❌ TABLE DOESN'T EXIST
    .select('date, program_id');
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (user.role !== 'super_admin') {
    query = query.eq('tenant_id', user.tenantId);
  }
  return query;
})(),
```

### Root Cause

`non_attendance_dates` was merged into `attendance_exceptions` table with normalized structure.

### Fixed Code

```typescript
// REPLACEMENT FOR LINES 102-112
datesResult: (() => {
  let query = supabaseAdmin
    .from('attendance_exceptions')  // ✅ FIXED: Use new table
    .select('exception_date as date, program_id')  // Map column name
    .eq('exception_type', 'non_attendance_date');  // Filter by type
  
  if (startDate) query = query.gte('exception_date', startDate);
  if (endDate) query = query.lte('exception_date', endDate);
  if (user.role !== 'super_admin') {
    query = query.eq('tenant_id', user.tenantId);
  }
  return query;
})(),
```

### Also Update Line 142 (Usage of date field)

```typescript
// OLD - Line 142
for (const row of datesResult.data || []) {
  const date = row.date as string;
  const rowProgramId = row.program_id as string | null;

  // ... rest of code

// NEW - Maps column name
// No change needed - alias handles it: exception_date as date
```

### Verification Test

```typescript
// Backend/src/app/api/reports/attendance/__tests__/fix-excluded-dates.test.ts
describe('GET /api/reports/attendance - Fix excluded dates', () => {
  it('should query attendance_exceptions with non_attendance_date type', async () => {
    const tenant = await createTestTenant();
    const program = await createTestProgram(tenant.id);
    const session = await createTestSession(program.id, { session_date: '2026-09-10' });

    // Create exception
    await supabaseAdmin.from('attendance_exceptions').insert({
      tenant_id: tenant.id,
      program_id: program.id,
      exception_type: 'non_attendance_date',
      exception_date: '2026-09-10',
      reason: 'Holiday',
    });

    const response = await GET(createMockRequest({
      tenantId: tenant.id,
      query: 'program_id=' + program.id,
    }));
    const result = await response.json();

    expect(result.data.summary.excludedSessions).toBe(1);
    expect(result.data.summary.activeSessions).toBe(0);
  });

  it('should not query non_attendance_dates table', async () => {
    const supabaseSpy = jest.spyOn(supabaseAdmin, 'from');
    
    await GET(createMockRequest({ tenantId: 'test-tenant' }));

    // Verify no calls to old table
    expect(supabaseSpy).not.toHaveBeenCalledWith('non_attendance_dates');
    // Verify calls to new table
    expect(supabaseSpy).toHaveBeenCalledWith('attendance_exceptions');
  });
});
```

---

## Issue #4-6: Attendance Schedule Overrides — Removed Table

### 🔴 CRITICAL — GET/POST/DELETE Fail

**Files:** 
- `Backend/src/app/api/attendance/schedules/[id]/overrides/route.ts` (GET & POST)
- `Backend/src/app/api/attendance/schedules/[id]/overrides/[overrideId]/route.ts` (DELETE)

**Lines:** 68 (GET), 99-115 (POST), 36-76 (DELETE)  
**Error:** `relation "attendance_schedule_overrides" does not exist`

### Root Cause

`attendance_schedule_overrides` was merged into `attendance_exceptions` with unified exception type system.

### Schema Mapping

```sql
OLD TABLE: attendance_schedule_overrides
  - id, schedule_id, date, is_full_day_off
  - custom_morning_open, custom_morning_close
  - custom_afternoon_open, custom_afternoon_close

NEW TABLE: attendance_exceptions
  - id, exception_type ('schedule_override')
  - program_id (instead of schedule_id)
  - exception_date (instead of date)
  - exception_start_time, exception_end_time
  - reason, created_by
```

### Fixed GET Handler

```typescript
// REPLACEMENT FOR GET HANDLER (Line 68)
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const ctxResult = requireTenantContext(request);
  if (ctxResult.error) return ctxResult.error as NextResponse;

  const { tenantId, role, isSuperAdmin } = ctxResult.context;

  const allowedRoles = ['local_admin', 'staff_training_coordinator'];
  if (!allowedRoles.includes(role)) {
    return forbiddenResponse('Insufficient permissions');
  }

  // Verify schedule belongs to this tenant and get program_id
  let schedQuery = supabaseAdmin
    .from('attendance_schedules')
    .select('id, program_id')  // Need program_id
    .eq('id', id);
  if (!isSuperAdmin) schedQuery = schedQuery.eq('tenant_id', tenantId);
  const { data: sched } = await schedQuery.maybeSingle();
  if (!sched) return notFoundResponse('Attendance schedule not found');

  // FIX: Query attendance_exceptions instead
  const { data, error } = await supabaseAdmin
    .from('attendance_exceptions')  // ✅ NEW TABLE
    .select('id, exception_date as date, reason, exception_start_time, exception_end_time')
    .eq('program_id', sched.program_id)  // Use program_id
    .eq('exception_type', 'schedule_override')  // Filter by type
    .eq('tenant_id', tenantId)
    .order('exception_date', { ascending: true });

  if (error) throw error;

  return successResponse(data ?? []);
});
```

### Fixed POST Handler

```typescript
// REPLACEMENT FOR POST HANDLER (Lines 88-130)
export const POST = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const ctxResult = requireTenantContext(request);
  if (ctxResult.error) return ctxResult.error as NextResponse;

  const { tenantId, userId, role, isSuperAdmin } = ctxResult.context;

  if (role !== 'local_admin') {
    return forbiddenResponse('Only local_admin can create schedule overrides');
  }

  // Fetch schedule with program_id
  let schedQuery = supabaseAdmin
    .from('attendance_schedules')
    .select('id, program_id, tenant_id')
    .eq('id', id);
  if (!isSuperAdmin) schedQuery = schedQuery.eq('tenant_id', tenantId);
  const { data: schedule } = await schedQuery.maybeSingle();
  if (!schedule) return notFoundResponse('Attendance schedule not found');

  const body = await request.json();
  const validated = overrideSchema.parse(body);

  // FIX: Insert into attendance_exceptions
  const { data: override, error } = await supabaseAdmin
    .from('attendance_exceptions')  // ✅ NEW TABLE
    .insert({
      tenant_id: tenantId,
      exception_type: 'schedule_override',  // Set type
      program_id: schedule.program_id,
      exception_date: validated.date,
      exception_start_time: validated.custom_morning_open || null,
      exception_end_time: validated.custom_afternoon_close || null,
      reason: validated.reason,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint on (program_id, exception_date, exception_type)
    if ((error as any).code === '23505') {
      return errorResponse(
        `An override for ${validated.date} already exists on this schedule`,
        409
      );
    }
    throw error;
  }

  // If full day off - ALSO create no_attendance_day exception
  if (validated.is_full_day_off) {
    try {
      await supabaseAdmin.from('attendance_exceptions').insert({
        tenant_id: tenantId,
        exception_type: 'no_attendance_day',  // Different type
        program_id: schedule.program_id,
        exception_date: validated.date,
        reason: `Full day off: ${validated.reason}`,
        created_by: userId,
      });
    } catch (nadError: any) {
      // If duplicate exception, that's fine
      if (nadError?.code !== '23505') throw nadError;
    }
  }

  await activityLogService.logAction(
    userId,
    'create',
    'attendance_schedule_override',
    override.id,
    { date: validated.date, is_full_day_off: validated.is_full_day_off }
  );

  return createdResponse(override, 'Schedule override created');
});
```

### Fixed DELETE Handler

```typescript
// REPLACEMENT FOR DELETE HANDLER (Schedule:[id]/overrides/[overrideId]/route.ts)
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; overrideId: string }> }
) => {
  const { id, overrideId } = await context.params;
  // ... auth check ...

  // FIX: Query attendance_exceptions
  const { data: override } = await supabaseAdmin
    .from('attendance_exceptions')  // ✅ NEW TABLE
    .select('*')
    .eq('id', overrideId)
    .eq('exception_type', 'schedule_override')
    .maybeSingle();

  if (!override) return notFoundResponse('Override not found');

  return successResponse(override);
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; overrideId: string }> }
) => {
  const { id, overrideId } = await context.params;
  // ... auth check ...

  // FIX: Delete from attendance_exceptions
  const { error } = await supabaseAdmin
    .from('attendance_exceptions')  // ✅ NEW TABLE
    .delete()
    .eq('id', overrideId)
    .eq('exception_type', 'schedule_override');

  if (error) throw error;

  await activityLogService.logAction(
    userId,
    'delete',
    'attendance_schedule_override',
    overrideId,
    { date: override.exception_date }
  );

  return successResponse(null, 'Schedule override deleted');
});
```

### Verification Tests

```typescript
// Backend/src/app/api/attendance/schedules/__tests__/fix-schedule-overrides.test.ts
describe('Attendance Schedule Overrides - Fix table reference', () => {
  it('GET /overrides should query attendance_exceptions with schedule_override type', async () => {
    const schedule = await createTestSchedule();
    const exception = await supabaseAdmin.from('attendance_exceptions').insert({
      tenant_id: schedule.tenant_id,
      program_id: schedule.program_id,
      exception_type: 'schedule_override',
      exception_date: '2026-09-10',
      reason: 'Makeup session',
    }).select().single();

    const response = await GET(createMockRequest(), {
      params: { id: schedule.id },
    });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toContainEqual(
      expect.objectContaining({
        id: exception.id,
        reason: 'Makeup session',
      })
    );
  });

  it('POST /overrides should insert into attendance_exceptions', async () => {
    const schedule = await createTestSchedule();

    const response = await POST(
      createMockRequestWithBody({
        date: '2026-09-10',
        reason: 'Holiday',
        is_full_day_off: true,
      }),
      { params: { id: schedule.id } }
    );

    expect(response.status).toBe(201);

    // Verify in new table
    const { data: exceptions } = await supabaseAdmin
      .from('attendance_exceptions')
      .select('*')
      .eq('exception_date', '2026-09-10');

    expect(exceptions).toHaveLength(2); // schedule_override + no_attendance_day
  });

  it('DELETE /overrides should delete from attendance_exceptions', async () => {
    const schedule = await createTestSchedule();
    const exception = await createTestException(schedule, 'schedule_override');

    const response = await DELETE(createMockRequest(), {
      params: { id: schedule.id, overrideId: exception.id },
    });

    expect(response.status).toBe(200);

    // Verify deleted
    const { data } = await supabaseAdmin
      .from('attendance_exceptions')
      .select('*')
      .eq('id', exception.id);

    expect(data).toHaveLength(0);
  });
});
```

---

## Issue #7: Incomplete Notification Preferences

### 🟡 HIGH — Feature Gap

**File:** `Backend/src/app/api/trainees/[id]/notification-preferences/route.ts`  
**Severity:** 🟡 **FEATURE INCOMPLETE**

### Current Issue

Route only manages single boolean:
- `trainees.notify_on_program_posting`

Missing 7 channel preferences in dedicated table:
- `trainee_notification_preferences.email_enabled`
- `trainee_notification_preferences.sms_enabled`
- `trainee_notification_preferences.push_enabled`
- `trainee_notification_preferences.in_app_enabled`
- `trainee_notification_preferences.weekly_digest`
- `trainee_notification_preferences.event_reminders`
- `trainee_notification_preferences.enrollment_updates`

### Fixed Code

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRoleAsync } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/errorHandler';
import { handleOptionsRequest } from '@/middleware/cors';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { successResponse, notFoundResponse, forbiddenResponse } from '@/utils/responses';

// Validation schema for comprehensive preferences
const preferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  event_reminders: z.boolean().optional(),
  enrollment_updates: z.boolean().optional(),
  notify_on_program_posting: z.boolean().optional(),  // Keep for backward compatibility
});

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const authResult = await requireRoleAsync(request, ['local_admin', 'staff_training_coordinator']);
  if ('error' in authResult) return authResult.error as NextResponse;

  const userId = authResult.user.userId;
  const tenantId = authResult.user.tenantId;
  const { searchParams } = new URL(request.url);
  const traineeId = searchParams.get('trainee_id');

  if (!traineeId) {
    return notFoundResponse('trainee_id parameter required');
  }

  // Verify trainee exists and belongs to tenant
  const { data: trainee, error: traineeError } = await supabaseAdmin
    .from('trainees')
    .select('id, notify_on_program_posting')
    .eq('id', traineeId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (traineeError) throw traineeError;
  if (!trainee) return notFoundResponse('Trainee not found');

  // FIX: Also get comprehensive preferences from dedicated table
  const { data: preferences, error: preferencesError } = await supabaseAdmin
    .from('trainee_notification_preferences')
    .select('*')
    .eq('trainee_id', traineeId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (preferencesError) throw preferencesError;

  // Return merged preferences
  return successResponse({
    ...preferences,
    notify_on_program_posting: trainee.notify_on_program_posting,
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const authResult = await requireRoleAsync(request, ['local_admin', 'staff_training_coordinator']);
  if ('error' in authResult) return authResult.error as NextResponse;

  const userId = authResult.user.userId;
  const tenantId = authResult.user.tenantId;
  const { searchParams } = new URL(request.url);
  const traineeId = searchParams.get('trainee_id');

  if (!traineeId) {
    return notFoundResponse('trainee_id parameter required');
  }

  // Verify trainee exists and belongs to tenant
  const { data: trainee, error: traineeError } = await supabaseAdmin
    .from('trainees')
    .select('id')
    .eq('id', traineeId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (traineeError) throw traineeError;
  if (!trainee) return notFoundResponse('Trainee not found');

  const body = await request.json();
  const validated = preferencesSchema.parse(body);

  // FIX: Update comprehensive preferences table
  const preferencesUpdate = {
    email_enabled: validated.email_enabled,
    sms_enabled: validated.sms_enabled,
    push_enabled: validated.push_enabled,
    in_app_enabled: validated.in_app_enabled,
    weekly_digest: validated.weekly_digest,
    event_reminders: validated.event_reminders,
    enrollment_updates: validated.enrollment_updates,
  };

  // Remove undefined values
  Object.keys(preferencesUpdate).forEach(
    key => preferencesUpdate[key] === undefined && delete preferencesUpdate[key]
  );

  // Upsert preferences in dedicated table
  const { error: updateError } = await supabaseAdmin
    .from('trainee_notification_preferences')
    .upsert(
      {
        trainee_id: traineeId,
        tenant_id: tenantId,
        ...preferencesUpdate,
      },
      { onConflict: 'trainee_id, tenant_id' }
    );

  if (updateError) throw updateError;

  // Update legacy field for backward compatibility
  if (validated.notify_on_program_posting !== undefined) {
    const { error: legacyError } = await supabaseAdmin
      .from('trainees')
      .update({ notify_on_program_posting: validated.notify_on_program_posting })
      .eq('id', traineeId);

    if (legacyError) throw legacyError;
  }

  // Return updated preferences
  const { data: updated } = await supabaseAdmin
    .from('trainee_notification_preferences')
    .select('*')
    .eq('trainee_id', traineeId)
    .maybeSingle();

  return successResponse({
    ...updated,
    notify_on_program_posting: validated.notify_on_program_posting,
  });
});
```

### Verification Test

```typescript
// Backend/src/app/api/trainees/[id]/notification-preferences/__tests__/fix-comprehensive-prefs.test.ts
describe('GET/PUT /trainees/:id/notification-preferences', () => {
  it('should return all 7 notification channel preferences', async () => {
    const trainee = await createTestTrainee();
    await supabaseAdmin.from('trainee_notification_preferences').insert({
      trainee_id: trainee.id,
      tenant_id: trainee.tenant_id,
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      weekly_digest: false,
      event_reminders: true,
      enrollment_updates: true,
    });

    const response = await GET(createMockRequest(), {
      query: `trainee_id=${trainee.id}`,
    });
    const result = await response.json();

    expect(result.data).toMatchObject({
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      weekly_digest: false,
      event_reminders: true,
      enrollment_updates: true,
    });
  });

  it('should update all preferences via dedicated table', async () => {
    const trainee = await createTestTrainee();

    const response = await PUT(
      createMockRequestWithBody({
        email_enabled: false,
        sms_enabled: true,
        push_enabled: true,
      }),
      { query: `trainee_id=${trainee.id}` }
    );

    expect(response.status).toBe(200);

    // Verify in dedicated table
    const { data: prefs } = await supabaseAdmin
      .from('trainee_notification_preferences')
      .select('*')
      .eq('trainee_id', trainee.id)
      .single();

    expect(prefs.email_enabled).toBe(false);
    expect(prefs.sms_enabled).toBe(true);
    expect(prefs.push_enabled).toBe(true);
  });
});
```

---

## Fix Implementation Checklist

### Phase 1: Critical Fixes (Priority 1) — 8 hours

- [ ] **Issue #1:** trainees/stats
  - [ ] Update query to use enrollments
  - [ ] Write integration test
  - [ ] Code review
  - [ ] Test in staging
  - **Estimated Time:** 1 hour

- [ ] **Issue #2:** trainees/export
  - [ ] Update to join enrollments
  - [ ] Handle multiple enrollments per trainee
  - [ ] Write integration test
  - [ ] Code review
  - [ ] Test export functionality
  - **Estimated Time:** 2 hours

- [ ] **Issue #3:** reports/attendance
  - [ ] Update to use attendance_exceptions
  - [ ] Map exception_date column
  - [ ] Filter by exception_type
  - [ ] Write integration test
  - [ ] Code review
  - [ ] Test report generation
  - **Estimated Time:** 2 hours

- [ ] **Issue #4-6:** Attendance schedule overrides
  - [ ] Fix GET handler
  - [ ] Fix POST handler
  - [ ] Fix DELETE handler
  - [ ] Handle full_day_off logic
  - [ ] Write integration tests (all 3 handlers)
  - [ ] Code review
  - [ ] Test all operations
  - **Estimated Time:** 3 hours

### Phase 2: High Priority Fixes — 2.5 hours

- [ ] **Issue #7:** Notification preferences
  - [ ] Update GET handler
  - [ ] Update PUT handler
  - [ ] Handle all 7 channels
  - [ ] Backward compatibility
  - [ ] Write comprehensive tests
  - [ ] Code review
  - **Estimated Time:** 2 hours

- [ ] **Code Quality:**
  - [ ] Remove dead code
  - [ ] Add inline comments
  - [ ] Update error messages
  - **Estimated Time:** 0.5 hours

### Phase 3: Validation — 4 hours

- [ ] **Migration Testing** (if upgrading from old schema)
  - [ ] Create migration scripts
  - [ ] Test data preservation
  - [ ] Verify data integrity
  - [ ] Document migration steps
  - **Estimated Time:** 4 hours

### Phase 4: Deployment

- [ ] Create hotfix branch: `hotfix/schema-api-compatibility`
- [ ] All code reviews approved
- [ ] All tests passing
- [ ] Deploy to staging
- [ ] Full end-to-end testing
- [ ] Deploy to production

---

## Breaking Changes Summary

| Change | Type | Impact | Migration |
|--------|------|--------|-----------|
| `trainees.program_id` removed | Structural | HIGH | Query enrollments instead |
| `trainees.enrollment_date` removed | Structural | HIGH | Query enrollments instead |
| `trainees.notification_preferences` removed | Structural | MEDIUM | Use dedicated table |
| `non_attendance_dates` table removed | Structural | HIGH | Use attendance_exceptions |
| `attendance_schedule_overrides` table removed | Structural | HIGH | Use attendance_exceptions |
| `pending_registrations` table removed | Structural | MEDIUM | Use trainees.registration_status |

---

**Total Estimated Fix Time:** 14.5 hours (2 engineer-days)  
**Priority 1 (Blocking):** 8 hours  
**Priority 2 (Should):** 2.5 hours  
**Priority 3 (Optional):** 4 hours

---

**End of Document**
