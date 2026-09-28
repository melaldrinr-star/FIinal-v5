# Trainee Status [id]/route.ts - Reference Implementation Guide

This document provides a reference implementation template and patterns to use when implementing the PATCH and DELETE endpoints.

## File Location
```
Backend/src/app/api/trainee-status/[id]/route.ts
```

## Complete Code Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { traineeStatusService } from '@/services/traineeStatusService';
import { updateTraineeStatusSchema } from '@/utils/validators';
import { requireTenantContext } from '@/middleware/tenantContext';
import { 
  successResponse, 
  notFoundResponse, 
  validationErrorResponse,
  serverErrorResponse 
} from '@/utils/responses';
import { withErrorHandler } from '@/middleware/errorHandler';
import { handleOptionsRequest } from '@/middleware/cors';
import { logger } from '@/utils/logger';
import type { TraineeStatusRecord } from '@/types/database.types';

/**
 * OPTIONS /api/trainee-status/:id
 * Handle CORS preflight requests for PATCH and DELETE operations
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
}

/**
 * PATCH /api/trainee-status/:id
 * Update a trainee status record with partial data
 * 
 * @param request - Next.js request object
 * @param params - Route parameters (id)
 * @returns Updated trainee status record
 */
export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    // Step 1: Validate URL parameter
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      logger.warn('Invalid trainee status ID format', { id });
      return notFoundResponse('Invalid trainee status ID');
    }

    // Step 2: Get tenant context
    const ctxResult = requireTenantContext(request);
    if (ctxResult.error) {
      return ctxResult.error as NextResponse;
    }
    const context = ctxResult.context;

    // Step 3: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in PATCH request body', { id });
      return notFoundResponse('Invalid request body');
    }

    // Step 4: Validate against schema
    const validationResult = updateTraineeStatusSchema.safeParse(body);
    if (!validationResult.success) {
      logger.debug('Validation failed for trainee status update', {
        id,
        errors: validationResult.error.errors,
      });
      
      // Convert validation errors to field map
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(err.message);
      });
      
      return validationErrorResponse(errors);
    }

    const validatedData = validationResult.data;

    // Step 5: Check record exists and belongs to tenant
    const existingRecord = await traineeStatusService.getTraineeStatusById(
      id,
      context.tenant_id
    );

    if (!existingRecord) {
      logger.warn('Trainee status record not found', {
        id,
        tenantId: context.tenant_id,
      });
      return notFoundResponse('Trainee status record not found');
    }

    // Step 6: Call service to update record
    try {
      const updatedRecord = await traineeStatusService.updateTraineeStatus(id, {
        ...validatedData,
        tenantId: context.tenant_id,
        lastUpdatedBy: context.user_id,
      });

      logger.info('Trainee status updated successfully', {
        id,
        tenantId: context.tenant_id,
        updatedBy: context.user_id,
      });

      // Step 7: Return success response
      return successResponse(
        updatedRecord,
        'Trainee status updated successfully',
        200
      );
    } catch (error) {
      logger.error('Failed to update trainee status', {
        id,
        tenantId: context.tenant_id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let withErrorHandler catch it
    }
  }
);

/**
 * DELETE /api/trainee-status/:id
 * Soft delete a trainee status record (sets deleted_at timestamp)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters (id)
 * @returns Success message
 */
export const DELETE = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    // Step 1: Validate URL parameter
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      logger.warn('Invalid trainee status ID format for deletion', { id });
      return notFoundResponse('Invalid trainee status ID');
    }

    // Step 2: Get tenant context
    const ctxResult = requireTenantContext(request);
    if (ctxResult.error) {
      return ctxResult.error as NextResponse;
    }
    const context = ctxResult.context;

    // Step 3: Check record exists and belongs to tenant
    const existingRecord = await traineeStatusService.getTraineeStatusById(
      id,
      context.tenant_id
    );

    if (!existingRecord) {
      logger.warn('Trainee status record not found for deletion', {
        id,
        tenantId: context.tenant_id,
      });
      return notFoundResponse('Trainee status record not found');
    }

    // Step 4: Call service to soft delete record
    try {
      await traineeStatusService.deleteTraineeStatus(id, context.tenant_id);

      logger.info('Trainee status deleted successfully', {
        id,
        tenantId: context.tenant_id,
        deletedBy: context.user_id,
      });

      // Step 5: Return success response
      return successResponse(
        { message: 'Trainee status record deleted successfully' },
        null,
        200
      );
    } catch (error) {
      logger.error('Failed to delete trainee status', {
        id,
        tenantId: context.tenant_id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let withErrorHandler catch it
    }
  }
);
```

## Key Implementation Points

### 1. Parameter Extraction
```typescript
const { id } = await params;
```
- Always await the params Promise
- This is required by Next.js 13+ dynamic routes

### 2. Tenant Context Requirement
```typescript
const ctxResult = requireTenantContext(request);
if (ctxResult.error) {
  return ctxResult.error as NextResponse;
}
```
- Check for error BEFORE accessing context
- This ensures all operations are tenant-scoped

### 3. Validation Pattern
```typescript
const validationResult = updateTraineeStatusSchema.safeParse(body);
if (!validationResult.success) {
  // Extract errors into field map
  const errors: Record<string, string[]> = {};
  validationResult.error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(err.message);
  });
  return validationErrorResponse(errors);
}
```
- Use `safeParse` to avoid throwing
- Convert Zod errors to API-friendly format
- Return 422 with field-level error details

### 4. Record Existence Check
```typescript
const existingRecord = await traineeStatusService.getTraineeStatusById(
  id,
  context.tenant_id
);
if (!existingRecord) {
  return notFoundResponse('Trainee status record not found');
}
```
- ALWAYS verify record exists before update/delete
- The `tenant_id` parameter ensures tenant isolation
- Missing record could indicate: wrong ID, deleted record, or different tenant

### 5. Service Call Pattern
```typescript
try {
  const updatedRecord = await traineeStatusService.updateTraineeStatus(id, {
    ...validatedData,
    tenantId: context.tenant_id,
    lastUpdatedBy: context.user_id,
  });
  logger.info('Success message', { id, tenantId });
  return successResponse(updatedRecord, 'Success message', 200);
} catch (error) {
  logger.error('Error message', { id, error });
  throw error; // Let withErrorHandler catch it
}
```
- Always include `tenantId` in service params for security
- Include `lastUpdatedBy` for audit trail
- Log success and errors for debugging
- Rethrow errors for `withErrorHandler` to catch

### 6. Error Handling
```typescript
export const PATCH = withErrorHandler(async (request, { params }) => {
  // implementation
});
```
- Use `withErrorHandler` wrapper for all handlers
- This catches unexpected errors and returns 500
- No need for top-level try-catch in handler

### 7. Response Format
```typescript
// Success
return successResponse(data, 'message', 200);

// Not found
return notFoundResponse('message');

// Validation error
return validationErrorResponse(errors);
```
- Always use response helpers for consistency
- This ensures all responses have the expected structure

## Common Error Scenarios

### Invalid ID Format
```typescript
if (!id || typeof id !== 'string' || id.trim().length === 0) {
  return notFoundResponse('Invalid trainee status ID');
}
```
- Return 404, not 400 (doesn't expose internal format details)

### Record Not Found
```typescript
const existing = await traineeStatusService.getTraineeStatusById(id, context.tenant_id);
if (!existing) {
  return notFoundResponse('Trainee status record not found');
}
```
- Returns 404 for both non-existent and wrong-tenant records
- Prevents information leakage about tenant structure

### Validation Error
```typescript
const result = schema.safeParse(body);
if (!result.success) {
  return validationErrorResponse(errors); // 422
}
```
- Returns 422 with field-level details
- Helps frontend show targeted error messages

### Database Error
```typescript
try {
  await service.updateTraineeStatus(...);
} catch (error) {
  logger.error('Failed to update', { error });
  throw error; // withErrorHandler returns 500
}
```
- Let `withErrorHandler` catch and return 500
- Don't log sensitive details

## Testing Patterns

### Test PATCH Success
```typescript
it('updates trainee status successfully', async () => {
  const record = await createTestTraineeStatus();
  const response = await fetch(
    `/api/trainee-status/${record.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': context.tenant_id,
      },
      body: JSON.stringify({
        employment_status: 'employed',
        job_title: 'Engineer',
      }),
    }
  );
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.employment_status).toBe('employed');
});
```

### Test PATCH Validation Error
```typescript
it('returns 422 for invalid data', async () => {
  const record = await createTestTraineeStatus();
  const response = await fetch(
    `/api/trainee-status/${record.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': context.tenant_id,
      },
      body: JSON.stringify({
        employment_status: 'invalid_status', // Invalid
      }),
    }
  );
  
  expect(response.status).toBe(422);
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.errors.employment_status).toBeDefined();
});
```

### Test DELETE Success
```typescript
it('deletes trainee status with soft delete', async () => {
  const record = await createTestTraineeStatus();
  const response = await fetch(
    `/api/trainee-status/${record.id}`,
    {
      method: 'DELETE',
      headers: {
        'X-Tenant-ID': context.tenant_id,
      },
    }
  );
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  
  // Verify soft delete (record still in DB but marked deleted)
  const deleted = await db.query(
    'SELECT * FROM trainee_status_records WHERE id = ? AND deleted_at IS NOT NULL',
    [record.id]
  );
  expect(deleted.length).toBe(1);
});
```

### Test Tenant Isolation
```typescript
it('returns 404 for record from different tenant', async () => {
  const record = await createTestTraineeStatus(tenant1);
  const response = await fetch(
    `/api/trainee-status/${record.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenant2.id, // Different tenant
      },
      body: JSON.stringify({ employment_status: 'employed' }),
    }
  );
  
  expect(response.status).toBe(404);
});
```

## Debugging Tips

1. **Check Logs**: Look for `trainee status updated successfully` or error messages
2. **Validate Input**: Verify request body matches schema
3. **Verify Tenant**: Ensure `X-Tenant-ID` header is set and correct
4. **Check ID Format**: Confirm ID is a valid UUID
5. **Database State**: Query database directly to verify changes persisted

## Deployment Checklist

- [ ] TypeScript compiles without errors
- [ ] All tests pass (unit and integration)
- [ ] Error handling works for all scenarios
- [ ] Tenant isolation verified
- [ ] Logging is appropriate
- [ ] Response formats consistent
- [ ] API documentation updated
- [ ] Frontend integration tested
