# Implementation Tasks: Trainee Status PATCH/DELETE Endpoints

## Overview
Create PATCH and DELETE endpoints for trainee status records, following the existing API patterns in the codebase and ensuring proper validation, permission checking, and error handling.

## Files to Create/Modify
- **Primary:** `Backend/src/app/api/trainee-status/[id]/route.ts` (NEW)
- **Frontend Integration:** Verify PATCH/DELETE calls in TraineeStatusModal component

---

## Task 1: Create Dynamic Route Structure

### Objective
Set up the dynamic route file `[id]/route.ts` with proper Next.js configuration and imports.

### Subtasks

- [ ] 1.1 Create directory structure
  - Create `Backend/src/app/api/trainee-status/[id]/` directory
  - This directory will contain the dynamic route handler
  - _Dependencies: None_

- [ ] 1.2 Add imports and setup
  - Import `NextRequest` and `NextResponse` from 'next/server'
  - Import `traineeStatusService` from `@/services/traineeStatusService`
  - Import `updateTraineeStatusSchema` from `@/utils/validators`
  - Import `requireTenantContext` from `@/middleware/tenantContext`
  - Import `requireAuth` from `@/middleware/auth` (for future auth checks if needed)
  - Import response helpers: `successResponse`, `notFoundResponse`, `forbiddenResponse`, `serverErrorResponse`, `validationErrorResponse`
  - Import `withErrorHandler` from `@/middleware/errorHandler`
  - Import `handleOptionsRequest` from `@/middleware/cors`
  - Import logger from `@/utils/logger`
  - Import types: `UpdateTraineeStatusInput` and `TraineeStatusRecord`
  - _Dependencies: 1.1_

- [ ] 1.3 Add OPTIONS handler
  - Export async `OPTIONS` function that calls `handleOptionsRequest(request)`
  - This enables CORS preflight for PATCH and DELETE requests
  - _Dependencies: 1.2_

---

## Task 2: Implement PATCH Endpoint

### Objective
Implement the PATCH `/api/trainee-status/[id]` endpoint for updating trainee status records.

### Specification
**Endpoint:** `PATCH /api/trainee-status/[id]`

**Request:**
- URL param: `id` (string, UUID format)
- Body: Partial trainee status update data (validated by `updateTraineeStatusSchema`)
- Headers: Tenant context headers (automatically extracted by middleware)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trainee_id": "uuid",
    "employment_status": "employed",
    "job_title": "Software Engineer",
    "employer_name": "TechCorp",
    "employment_start_date": "2024-01-15",
    "skills_match": "exact_match",
    "skills_match_percentage": 95,
    "graduation_status": "graduated",
    "graduation_date": "2023-12-20",
    "remarks": "Placed at top tech company",
    "last_updated_by": "user-uuid",
    "recorded_at": "2024-01-20T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data (validation fails)
- `403 Forbidden` - User lacks permission or record doesn't belong to tenant
- `404 Not Found` - Record with given ID doesn't exist
- `500 Internal Server Error` - Database or server error

### Implementation Details

- [ ] 2.1 Add PATCH handler function
  - Export async `PATCH` function with signature:
    ```typescript
    async function PATCH(
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    )
    ```
  - Wrap with `withErrorHandler` middleware to handle errors consistently
  - _Dependencies: 1.3_

- [ ] 2.2 Extract and validate URL parameter
  - Await `params` to get `{ id }`
  - Validate that `id` is a non-empty string
  - Return 400 error if `id` is missing or invalid
  - _Note:_ The id parameter comes from the dynamic route segment `[id]`
  - _Dependencies: 2.1_

- [ ] 2.3 Get tenant context
  - Call `requireTenantContext(request)`
  - Check for error in result: if `ctxResult.error` exists, return it as the response
  - Extract `context` from successful result
  - This ensures the operation is scoped to the user's tenant
  - _Dependencies: 2.2_

- [ ] 2.4 Parse and validate request body
  - Parse request body as JSON
  - Validate using `updateTraineeStatusSchema.safeParse(body)`
  - If validation fails, return 422 with validation errors using `validationErrorResponse(errors)`
  - Return parsed/validated data for use in service call
  - _Dependencies: 2.3_
  - _Requirements: Input must conform to `UpdateTraineeStatusInput` type_

- [ ] 2.5 Check record exists and belongs to tenant
  - Call `traineeStatusService.getTraineeStatusById(id, context.tenant_id)`
  - If record is null/undefined, return 404 `notFoundResponse('Trainee status record not found')`
  - This validates both existence and tenant scoping
  - _Dependencies: 2.4_
  - _Requirements: Must verify tenant ownership before allowing update_

- [ ] 2.6 Call service to update record
  - Call `traineeStatusService.updateTraineeStatus(id, { ...validatedData, tenantId: context.tenant_id, lastUpdatedBy: context.user_id })`
  - The service handles Supabase update operation with proper filtering
  - Capture returned `TraineeStatusRecord`
  - _Error Handling:_ If service throws error, let `withErrorHandler` catch it and return 500
  - _Dependencies: 2.5_
  - _Requirements: Update must include tenant scoping and audit trail (lastUpdatedBy)_

- [ ] 2.7 Return success response
  - Return `successResponse(updatedRecord, 'Trainee status updated successfully', 200)`
  - Response includes full updated record with all fields
  - _Dependencies: 2.6_

---

## Task 3: Implement DELETE Endpoint

### Objective
Implement the DELETE `/api/trainee-status/[id]` endpoint for soft-deleting trainee status records.

### Specification
**Endpoint:** `DELETE /api/trainee-status/[id]`

**Request:**
- URL param: `id` (string, UUID format)
- Headers: Tenant context headers (automatically extracted by middleware)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Trainee status record deleted successfully"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `403 Forbidden` - User lacks permission or record doesn't belong to tenant
- `404 Not Found` - Record with given ID doesn't exist
- `500 Internal Server Error` - Database or server error

**Implementation Note:** This is a soft delete - the record is marked with `deleted_at` timestamp, not physically removed.

### Implementation Details

- [ ] 3.1 Add DELETE handler function
  - Export async `DELETE` function with signature:
    ```typescript
    async function DELETE(
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    )
    ```
  - Wrap with `withErrorHandler` middleware
  - _Dependencies: 1.3_

- [ ] 3.2 Extract and validate URL parameter
  - Await `params` to get `{ id }`
  - Validate that `id` is a non-empty string
  - Return 400 error if `id` is missing or invalid
  - _Dependencies: 3.1_

- [ ] 3.3 Get tenant context
  - Call `requireTenantContext(request)`
  - Check for error in result: if `ctxResult.error` exists, return it
  - Extract `context` from successful result
  - _Dependencies: 3.2_

- [ ] 3.4 Check record exists and belongs to tenant
  - Call `traineeStatusService.getTraineeStatusById(id, context.tenant_id)`
  - If record is null/undefined, return 404 `notFoundResponse('Trainee status record not found')`
  - This validates both existence and tenant ownership
  - _Dependencies: 3.3_
  - _Requirements: Must verify tenant ownership before allowing delete_

- [ ] 3.5 Call service to soft-delete record
  - Call `traineeStatusService.deleteTraineeStatus(id, context.tenant_id)`
  - The service performs soft delete by setting `deleted_at` timestamp
  - No return value expected (void)
  - _Error Handling:_ If service throws error, let `withErrorHandler` catch it and return 500
  - _Dependencies: 3.4_
  - _Requirements: Delete operation must respect tenant scoping and use soft delete pattern_

- [ ] 3.6 Return success response
  - Return `successResponse({ message: 'Trainee status record deleted successfully' }, null, 200)`
  - Confirm deletion but don't return the full record (soft delete pattern)
  - _Dependencies: 3.5_

---

## Task 4: Add Comprehensive Error Handling

### Objective
Ensure all error cases are handled gracefully and consistently.

### Subtasks

- [ ] 4.1 Validate URL parameter format
  - Check that `id` matches UUID format if strict validation needed
  - Or rely on database rejection (simpler approach)
  - Log invalid IDs at debug level for monitoring
  - _Dependencies: 2.2, 3.2_

- [ ] 4.2 Handle Zod validation errors
  - Catch `ZodError` during schema parsing
  - Extract error messages and field paths
  - Return `validationErrorResponse` with structured error details
  - Example: `{ employment_status: ['Invalid employment status value'] }`
  - _Dependencies: 2.4_

- [ ] 4.3 Handle database/service errors
  - `withErrorHandler` wraps all handler logic
  - Catches any thrown errors (database, service, etc.)
  - Logs error details for debugging
  - Returns `serverErrorResponse()` (500) without exposing internal details
  - _Dependencies: 2.6, 3.5_

- [ ] 4.4 Handle permission/authorization errors
  - If tenant context missing/invalid, middleware returns error
  - If record doesn't match tenant, return 404 (not 403, to avoid info leakage)
  - Add debug logging when permission checks fail
  - _Dependencies: 2.3, 3.3_

---

## Task 5: Create Tests for PATCH Endpoint

### Objective
Write comprehensive tests covering PATCH endpoint behavior.

### Test File
`Backend/src/app/api/trainee-status/__tests__/[id]-patch.test.ts`

### Test Cases

- [ ] 5.1 Successful update test
  - Create a test trainee status record
  - Send PATCH request with valid update data
  - Assert response status is 200
  - Assert response includes updated fields
  - Assert database reflects changes
  - _Requirements: 2.1-2.7_

- [ ] 5.2 Partial update test
  - Verify that only provided fields are updated
  - Send PATCH with just `remarks` field
  - Verify other fields unchanged
  - _Requirements: 2.4, 2.6_

- [ ] 5.3 Validation error test
  - Send PATCH with invalid `employment_status`
  - Send PATCH with invalid `skills_match_percentage` (> 100)
  - Assert response status is 422
  - Assert error details included in response
  - _Requirements: 2.4_

- [ ] 5.4 Not found test
  - Send PATCH to non-existent record ID
  - Assert response status is 404
  - Assert error message includes "not found"
  - _Requirements: 2.5_

- [ ] 5.5 Tenant isolation test
  - Create record in tenant A
  - Try to update from tenant B context
  - Assert response status is 404 (not 403)
  - Verify record unchanged in database
  - _Requirements: 2.3, 2.5_

- [ ] 5.6 Invalid ID format test
  - Send PATCH with malformed ID (non-UUID)
  - Assert response status is 400
  - _Requirements: 2.2_

- [ ] 5.7 Audit trail test
  - Update a record
  - Verify `last_updated_by` field reflects current user
  - Verify update timestamp is recent
  - _Requirements: 2.6_

---

## Task 6: Create Tests for DELETE Endpoint

### Objective
Write comprehensive tests covering DELETE endpoint behavior.

### Test File
`Backend/src/app/api/trainee-status/__tests__/[id]-delete.test.ts`

### Test Cases

- [ ] 6.1 Successful soft delete test
  - Create a test trainee status record
  - Send DELETE request
  - Assert response status is 200
  - Assert record marked as deleted (deleted_at is set)
  - Assert record still in database but filtered from queries
  - _Requirements: 3.1-3.6_

- [ ] 6.2 Not found test
  - Send DELETE to non-existent record ID
  - Assert response status is 404
  - _Requirements: 3.4_

- [ ] 6.3 Tenant isolation test
  - Create record in tenant A
  - Try to delete from tenant B context
  - Assert response status is 404
  - Verify record not deleted in database
  - _Requirements: 3.3, 3.4_

- [ ] 6.4 Invalid ID format test
  - Send DELETE with malformed ID
  - Assert response status is 400
  - _Requirements: 3.2_

- [ ] 6.5 Idempotency test
  - Delete same record twice
  - First DELETE returns 200
  - Second DELETE returns 404 (already deleted/not found)
  - _Requirements: 3.4_

---

## Task 7: Integration Testing

### Objective
Verify end-to-end functionality with real database and middleware.

### Subtasks

- [ ] 7.1 Test with real authentication
  - Verify `requireTenantContext` properly validates user's tenant
  - Verify unauthorized access is rejected
  - _Dependencies: 2.3, 3.3_

- [ ] 7.2 Test database transactions
  - Verify updates are committed to database
  - Verify deletes set proper `deleted_at` timestamps
  - _Dependencies: 2.6, 3.5_

- [ ] 7.3 Test CORS headers
  - Verify OPTIONS request returns correct CORS headers
  - Verify PATCH and DELETE include proper CORS handling
  - _Dependencies: 1.3_

- [ ] 7.4 Test concurrent requests
  - Send multiple simultaneous PATCH requests to same record
  - Verify all complete without corruption
  - Verify final state is consistent
  - _Dependencies: 2.1_

---

## Task 8: Frontend Integration Testing

### Objective
Verify frontend integration with new endpoints.

### Subtasks

- [ ] 8.1 Verify TraineeStatusModal PATCH call
  - Locate remarks save functionality in `Frontend/src/components/TraineeStatusModal.tsx`
  - Verify it sends PATCH request to `/api/trainee-status/[id]`
  - Verify request body includes updated fields
  - Verify response handling on success and error
  - _Requirements: 2.1-2.7_

- [ ] 8.2 Verify TraineeStatusModal DELETE call (if applicable)
  - If delete button exists in modal, verify it calls DELETE endpoint
  - Verify proper confirmation before delete
  - Verify response handling
  - _Requirements: 3.1-3.6_

- [ ] 8.3 Test error handling
  - Simulate validation error response (422)
  - Verify error message displayed to user
  - Simulate not found error (404)
  - Verify proper error UI handling
  - _Requirements: 4.2, 4.3_

- [ ] 8.4 Test retry logic
  - If frontend has retry logic, verify it works correctly
  - Verify retry on transient errors (5xx)
  - Verify no retry on permanent errors (4xx)
  - _Dependencies: 8.3_

---

## Task 9: Code Review and Documentation

### Objective
Ensure code quality and completeness.

### Subtasks

- [ ] 9.1 Code review checklist
  - Verify all error paths are handled
  - Verify tenant scoping in all queries
  - Verify response format consistency
  - Verify imports are correct and complete
  - Verify no hardcoded values or magic strings
  - Verify logging appropriate for debugging
  - _Dependencies: 2.1, 3.1_

- [ ] 9.2 Add JSDoc comments
  - Add comments to PATCH handler explaining purpose and params
  - Add comments to DELETE handler
  - Document response formats
  - Document error conditions
  - _Dependencies: 2.1, 3.1_

- [ ] 9.3 Update API documentation
  - Add PATCH and DELETE endpoints to API docs/README if exists
  - Include request/response examples
  - Document error codes and meanings
  - _Dependencies: 2.1, 3.1_

- [ ] 9.4 Verify type safety
  - Ensure all function parameters are typed
  - Ensure return types are explicit
  - Verify no `any` types used inappropriately
  - _Dependencies: 2.1, 3.1_

---

## Task 10: Deployment and Verification

### Objective
Prepare endpoints for production and verify functionality.

### Subtasks

- [ ] 10.1 Build verification
  - Run `npm run build` to verify no TypeScript errors
  - Verify no ESLint warnings related to new code
  - _Dependencies: 9.4_

- [ ] 10.2 Test execution
  - Run all new test files: `npm test -- [id]-patch.test.ts [id]-delete.test.ts`
  - Verify all tests pass
  - Verify test coverage meets requirements
  - _Dependencies: 5.1-5.7, 6.1-6.5_

- [ ] 10.3 Manual testing
  - Use Postman/Insomnia to test PATCH endpoint manually
  - Use Postman/Insomnia to test DELETE endpoint manually
  - Verify success responses match spec
  - Verify error responses correct status codes
  - _Dependencies: 2.7, 3.6_

- [ ] 10.4 Frontend verification
  - Run frontend dev server
  - Test TraineeStatusModal remarks update flow
  - Verify successful update displayed in UI
  - Verify error messages displayed on failure
  - _Dependencies: 8.1, 8.2_

---

## Summary of Deliverables

1. **New Route File:** `Backend/src/app/api/trainee-status/[id]/route.ts`
   - PATCH handler for updates
   - DELETE handler for soft deletes
   - OPTIONS handler for CORS

2. **Test Files:**
   - `Backend/src/app/api/trainee-status/__tests__/[id]-patch.test.ts`
   - `Backend/src/app/api/trainee-status/__tests__/[id]-delete.test.ts`

3. **Documentation:**
   - JSDoc comments in route file
   - Updated API documentation (if exists)
   - Error handling guide

## Key Architectural Principles

- **Tenant Isolation:** All operations scoped to user's tenant
- **Soft Deletes:** Records marked deleted, not physically removed
- **Consistent Error Handling:** `withErrorHandler` wraps all logic
- **Request Validation:** Zod schema validates all inputs
- **Audit Trail:** `lastUpdatedBy` and timestamps tracked
- **Permission Checks:** Record existence verified before operations
- **Response Consistency:** Standardized response format across all endpoints

## Dependencies and Order
1. Start with Task 1 (directory/structure)
2. Complete Tasks 2-3 (endpoint implementation)
3. Complete Task 4 (error handling - review as you implement)
4. Complete Tasks 5-6 (testing)
5. Complete Tasks 7-8 (integration testing)
6. Complete Tasks 9-10 (review, build, deployment)
