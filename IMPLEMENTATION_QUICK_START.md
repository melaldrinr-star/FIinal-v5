# Quick Start: Trainee Status PATCH/DELETE Implementation

## Overview
This document provides a quick reference for implementing the PATCH and DELETE endpoints for trainee status records.

## Related Documents
1. **TRAINEE_STATUS_PATCH_DELETE_TASKS.md** - Detailed task breakdown (10 main tasks)
2. **TRAINEE_STATUS_ROUTE_REFERENCE.md** - Reference implementation with code templates

## Quick Task Summary

### Phase 1: Setup (Task 1)
```
✓ Create Backend/src/app/api/trainee-status/[id]/ directory
✓ Add all required imports
✓ Add OPTIONS handler for CORS
```

### Phase 2: Implement PATCH (Task 2)
```
✓ Export PATCH handler with signature: (request, { params })
✓ Extract and validate ID from URL
✓ Get tenant context
✓ Parse and validate request body with updateTraineeStatusSchema
✓ Check record exists and belongs to tenant
✓ Call traineeStatusService.updateTraineeStatus()
✓ Return 200 with updated record
```

**Responses:**
- `200` - Update successful
- `400` - Invalid input
- `404` - Record not found
- `422` - Validation failed
- `500` - Server error

### Phase 3: Implement DELETE (Task 3)
```
✓ Export DELETE handler with signature: (request, { params })
✓ Extract and validate ID from URL
✓ Get tenant context
✓ Check record exists and belongs to tenant
✓ Call traineeStatusService.deleteTraineeStatus()
✓ Return 200 with success message
```

**Responses:**
- `200` - Delete successful (soft delete)
- `400` - Invalid input
- `404` - Record not found
- `500` - Server error

### Phase 4: Error Handling (Task 4)
```
✓ Validate URL parameters
✓ Handle Zod validation errors → 422 response
✓ Let withErrorHandler catch database/service errors → 500 response
✓ Return 404 for permission/tenant mismatches (don't expose details)
```

### Phase 5: Testing (Tasks 5-6)
```
Create Backend/src/app/api/trainee-status/__tests__/[id]-patch.test.ts
✓ Test successful update
✓ Test partial updates
✓ Test validation errors
✓ Test not found errors
✓ Test tenant isolation
✓ Test invalid ID format
✓ Test audit trail (lastUpdatedBy)

Create Backend/src/app/api/trainee-status/__tests__/[id]-delete.test.ts
✓ Test successful soft delete
✓ Test not found errors
✓ Test tenant isolation
✓ Test invalid ID format
✓ Test idempotency (delete twice)
```

### Phase 6: Integration Testing (Tasks 7-8)
```
✓ Test with real authentication and tenant context
✓ Verify database persistence
✓ Test CORS headers
✓ Test concurrent requests
✓ Verify frontend integration with TraineeStatusModal
```

### Phase 7: Code Quality (Task 9)
```
✓ Code review checklist
✓ Add JSDoc comments
✓ Update API documentation
✓ Verify TypeScript/type safety
```

### Phase 8: Deployment (Task 10)
```
✓ Run npm run build (no TS errors)
✓ Run npm test for all new tests
✓ Manual testing with Postman/Insomnia
✓ Frontend manual testing
```

## Key Service Methods

### TraineeStatusService
```typescript
// Get by ID (with tenant scoping)
getTraineeStatusById(id: string, tenantId: string): Promise<TraineeStatusRecord | null>

// Update record
updateTraineeStatus(
  id: string,
  data: UpdateTraineeStatusInput & { tenantId: string; lastUpdatedBy: string }
): Promise<TraineeStatusRecord>

// Soft delete
deleteTraineeStatus(id: string, tenantId: string): Promise<void>
```

## Key Validators
```typescript
// Partial update schema with validation refinements
updateTraineeStatusSchema: z.ZodSchema<UpdateTraineeStatusInput>
```

## Key Middleware
```typescript
// Get tenant context from request
requireTenantContext(request): { context?: TenantContext; error?: NextResponse }

// Wrap handlers to catch errors
withErrorHandler(handler): (request, params) => Promise<NextResponse>

// Handle CORS
handleOptionsRequest(request): NextResponse
```

## Key Response Helpers
```typescript
successResponse(data, message?, status = 200)
notFoundResponse(message)
validationErrorResponse(errors)
serverErrorResponse(message)
```

## Common Code Patterns

### Extract ID from params
```typescript
const { id } = await params; // Always await!
```

### Get tenant context
```typescript
const ctxResult = requireTenantContext(request);
if (ctxResult.error) return ctxResult.error;
const context = ctxResult.context;
```

### Validate request body
```typescript
const result = updateTraineeStatusSchema.safeParse(body);
if (!result.success) {
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach(err => {
    const field = err.path.join('.');
    if (!errors[field]) errors[field] = [];
    errors[field].push(err.message);
  });
  return validationErrorResponse(errors);
}
const validData = result.data;
```

### Check record exists
```typescript
const existing = await traineeStatusService.getTraineeStatusById(id, context.tenant_id);
if (!existing) return notFoundResponse('Trainee status record not found');
```

### Call service with audit trail
```typescript
const updated = await traineeStatusService.updateTraineeStatus(id, {
  ...validData,
  tenantId: context.tenant_id,
  lastUpdatedBy: context.user_id,
});
```

### Return success
```typescript
return successResponse(updatedRecord, 'Trainee status updated successfully', 200);
```

## File Structure After Implementation
```
Backend/src/app/api/trainee-status/
├── route.ts                              (existing - GET, POST)
├── [id]/
│   └── route.ts                          (NEW - PATCH, DELETE, OPTIONS)
└── __tests__/
    ├── [id]-patch.test.ts               (NEW)
    ├── [id]-delete.test.ts              (NEW)
    ├── all-endpoints.test.ts            (existing)
    ├── get-multiple-with-filters.test.ts (existing)
    └── route-structure.test.ts          (existing)
```

## Testing Commands
```bash
# Build
npm run build

# Run all tests
npm test

# Run specific test files
npm test -- [id]-patch.test.ts
npm test -- [id]-delete.test.ts

# Run with coverage
npm test -- --coverage
```

## Debugging Checklist

### PATCH not working?
- [ ] Check `id` is valid UUID format
- [ ] Check `X-Tenant-ID` header is set
- [ ] Verify request body JSON is valid
- [ ] Check schema validation with `safeParse`
- [ ] Verify record exists in database
- [ ] Check logs for error messages
- [ ] Verify user has access to tenant

### DELETE not working?
- [ ] Check `id` is valid UUID format
- [ ] Check `X-Tenant-ID` header is set
- [ ] Verify record exists before deletion
- [ ] Check `deleted_at` timestamp set in DB
- [ ] Verify subsequent GET returns 404 (if record is filtered)
- [ ] Check logs for error messages

### Tests failing?
- [ ] Verify test database is set up
- [ ] Check tenant context is passed correctly
- [ ] Verify mocked services return expected data
- [ ] Check test isolation (cleanup after each test)
- [ ] Look at test output for assertion details

## Frontend Integration Points

### TraineeStatusModal Component
- Location: `Frontend/src/components/TraineeStatusModal.tsx`
- Should call PATCH `/api/trainee-status/{id}` on remarks save
- Should handle errors gracefully
- Should display success/error messages

### API Service Layer
- Location: `Frontend/src/services/traineeStatusService.ts` (if exists)
- Should have methods for `updateTraineeStatus()` and `deleteTraineeStatus()`
- Should handle authentication headers
- Should provide type-safe responses

## Deployment Steps

1. **Create file**: `Backend/src/app/api/trainee-status/[id]/route.ts`
2. **Add tests**: `__tests__/[id]-patch.test.ts` and `__tests__/[id]-delete.test.ts`
3. **Run build**: `npm run build` (fix any TS errors)
4. **Run tests**: `npm test` (all tests should pass)
5. **Manual test**: Use Postman/Insomnia to test endpoints
6. **Frontend test**: Verify TraineeStatusModal works end-to-end
7. **Deploy**: Merge to main and deploy to production

## Success Criteria

✓ PATCH endpoint updates records correctly
✓ DELETE endpoint soft deletes records
✓ All error cases return correct status codes
✓ Tenant isolation is enforced
✓ Request validation works
✓ Tests pass (90%+ coverage)
✓ Frontend integration works
✓ No TypeScript errors
✓ No console errors in browser
✓ Logging helps with debugging

## Next Steps

1. Read **TRAINEE_STATUS_PATCH_DELETE_TASKS.md** for detailed task breakdown
2. Reference **TRAINEE_STATUS_ROUTE_REFERENCE.md** while implementing
3. Follow the task checklist in order
4. Use the code templates as a starting point
5. Run tests frequently to catch errors early
6. Verify end-to-end with frontend before considering complete
