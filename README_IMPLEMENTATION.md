# Trainee Status PATCH/DELETE Endpoints - Implementation Guide

## 📋 Executive Summary

This implementation adds two new API endpoints to manage trainee status records:

- **PATCH /api/trainee-status/[id]** - Update trainee status (partial updates allowed)
- **DELETE /api/trainee-status/[id]** - Soft delete trainee status (sets deleted_at)

**File to Create:** `Backend/src/app/api/trainee-status/[id]/route.ts`

**Estimated Time:** 6-8 hours for experienced developers

**Dependencies:** Existing trainee status service, validators, middleware

---

## 📚 Documentation Files

### 1. **TRAINEE_STATUS_PATCH_DELETE_TASKS.md** (Detailed)
Comprehensive 10-task breakdown with:
- Detailed subtasks and specifications
- Request/response examples
- Implementation details and annotations
- Test cases and requirements

**Use this when:** You need to understand exactly what to implement

### 2. **TRAINEE_STATUS_ROUTE_REFERENCE.md** (Code)
Reference implementation with:
- Complete code template
- Implementation patterns
- Error handling examples
- Testing patterns
- Debugging tips

**Use this when:** You're writing the actual code

### 3. **IMPLEMENTATION_QUICK_START.md** (Quick Reference)
Quick summary with:
- Phase overview
- Key service methods
- Common code patterns
- File structure
- Debugging checklist

**Use this when:** You need a quick reminder or are stuck

### 4. **Task Dependency Map** (Planning)
Visual representation of task dependencies

**Use this when:** Planning parallelization or understanding critical path

---

## 🚀 Quick Implementation Path

### Option 1: Full Control (Detailed)
1. Read `TRAINEE_STATUS_PATCH_DELETE_TASKS.md` - understand all 10 tasks
2. Reference `TRAINEE_STATUS_ROUTE_REFERENCE.md` - copy and adapt code
3. Follow task checklist item by item
4. Use dependency map to parallelize where possible

**Timeline:** 6-8 hours  
**Best for:** First-time implementation, thorough understanding

### Option 2: Fast Track (Template-Based)
1. Skim `IMPLEMENTATION_QUICK_START.md` - understand patterns
2. Copy code from `TRAINEE_STATUS_ROUTE_REFERENCE.md`
3. Customize for your exact needs
4. Run tests frequently

**Timeline:** 3-4 hours  
**Best for:** Experienced developers, similar endpoints exist

### Option 3: Guided (Step-by-Step)
1. Do Task 1 (setup) - 30 min
2. Do Task 2 (PATCH) - 1-2 hours
3. Do Task 3 (DELETE) - 1-2 hours
4. Do Task 4 (error handling) - 30 min
5. Do Tasks 5-6 (tests) - 2-3 hours
6. Do Tasks 7-8 (integration) - 1-2 hours
7. Do Task 9 (quality) - 1 hour
8. Do Task 10 (deployment) - 1 hour

**Timeline:** 8-10 hours  
**Best for:** Learning experience, quality focus

---

## 📍 Key Implementation Points

### 1. Create Directory Structure
```bash
mkdir -p Backend/src/app/api/trainee-status/[id]
```

### 2. Create Route File
```typescript
Backend/src/app/api/trainee-status/[id]/route.ts
```

### 3. Implement Three Handlers
- **OPTIONS** - CORS preflight
- **PATCH** - Update logic
- **DELETE** - Soft delete logic

### 4. Key Requirements
- ✅ Tenant isolation (all operations scoped to user's tenant)
- ✅ Request validation (use updateTraineeStatusSchema)
- ✅ Error handling (proper HTTP status codes)
- ✅ Audit trail (track lastUpdatedBy)
- ✅ Soft deletes (mark deleted_at, don't remove record)

### 5. Key Responses
```javascript
// Success (200)
{ success: true, data: { ...record } }

// Validation error (422)
{ success: false, errors: { field: ['error message'] } }

// Not found (404)
{ success: false, error: 'Trainee status record not found' }

// Server error (500)
{ success: false, error: 'Internal server error' }
```

---

## 🛠️ Required Dependencies

### Already Available in Project
- ✅ `traineeStatusService` - Service layer with methods
- ✅ `updateTraineeStatusSchema` - Zod validator
- ✅ `requireTenantContext` - Middleware for tenant isolation
- ✅ `withErrorHandler` - Error handling wrapper
- ✅ Response helpers - `successResponse`, `notFoundResponse`, etc.
- ✅ Logger - `logger` utility for logging

### No Additional Packages Needed
Everything required is already in the codebase.

---

## 📝 Implementation Checklist

### Phase 1: Setup (30 min)
```
☐ Create Backend/src/app/api/trainee-status/[id]/ directory
☐ Create route.ts file with imports
☐ Add OPTIONS handler
```

### Phase 2: PATCH Implementation (1-2 hours)
```
☐ Add PATCH handler wrapper (withErrorHandler)
☐ Extract and validate ID parameter
☐ Get tenant context
☐ Parse and validate request body
☐ Check record exists and belongs to tenant
☐ Call service to update record
☐ Return success response
```

### Phase 3: DELETE Implementation (1-2 hours)
```
☐ Add DELETE handler wrapper
☐ Extract and validate ID parameter
☐ Get tenant context
☐ Check record exists and belongs to tenant
☐ Call service to soft delete
☐ Return success response
```

### Phase 4: Error Handling (30 min)
```
☐ Validate URL parameter format
☐ Handle Zod validation errors
☐ Handle database/service errors
☐ Handle permission/authorization errors
```

### Phase 5: Testing (2-3 hours)
```
☐ Create [id]-patch.test.ts with 7+ test cases
☐ Create [id]-delete.test.ts with 5+ test cases
☐ Verify all tests pass
☐ Check test coverage
```

### Phase 6: Integration (2-3 hours)
```
☐ Test with real authentication
☐ Verify database transactions
☐ Test CORS headers
☐ Test concurrent requests
☐ Verify frontend integration
```

### Phase 7: Quality (1 hour)
```
☐ Code review checklist
☐ Add JSDoc comments
☐ Update API documentation
☐ Verify type safety (no any types)
```

### Phase 8: Deployment (1 hour)
```
☐ Run npm run build (no errors)
☐ Run npm test (all pass)
☐ Manual testing with Postman
☐ Frontend manual testing
```

---

## 🐛 Common Issues & Solutions

### Issue 1: ID Parameter Not Extracting
**Symptom:** `id` is undefined  
**Solution:** Remember to `await params`
```typescript
const { id } = await params; // Must await!
```

### Issue 2: Tenant Context Error
**Symptom:** "Unauthorized" or missing tenant  
**Solution:** Check tenant context middleware
```typescript
const ctxResult = requireTenantContext(request);
if (ctxResult.error) return ctxResult.error;
```

### Issue 3: Validation Always Fails
**Symptom:** Every request returns 422 validation error  
**Solution:** Verify schema and request body
```typescript
const result = updateTraineeStatusSchema.safeParse(body);
// Log result.error.errors to see what failed
```

### Issue 4: Record Not Found When It Exists
**Symptom:** 404 error but record is in database  
**Solution:** Verify tenant scoping
```typescript
const existing = await traineeStatusService.getTraineeStatusById(
  id,
  context.tenant_id  // Must match current user's tenant!
);
```

### Issue 5: Tests Failing
**Symptom:** Test database issues or timeouts  
**Solution:** 
- Check database is running
- Verify test setup/teardown
- Look for async/await issues

### Issue 6: Frontend Not Calling Endpoint
**Symptom:** PATCH/DELETE not called from frontend  
**Solution:**
- Check TraineeStatusModal component
- Verify API endpoint URL is correct
- Check network tab in DevTools
- Verify response handling

---

## 📊 File Structure After Implementation

```
Backend/
├── src/
│   └── app/
│       └── api/
│           └── trainee-status/
│               ├── route.ts                    (existing: GET, POST)
│               ├── [id]/
│               │   └── route.ts                (NEW: PATCH, DELETE, OPTIONS)
│               └── __tests__/
│                   ├── [id]-patch.test.ts     (NEW)
│                   ├── [id]-delete.test.ts    (NEW)
│                   ├── all-endpoints.test.ts  (existing)
│                   ├── get-multiple-with-filters.test.ts (existing)
│                   └── route-structure.test.ts (existing)
```

---

## 🔍 Key Code Patterns

### Pattern 1: Extract and Validate ID
```typescript
const { id } = await params;
if (!id || typeof id !== 'string' || id.trim().length === 0) {
  return notFoundResponse('Invalid trainee status ID');
}
```

### Pattern 2: Get Tenant Context
```typescript
const ctxResult = requireTenantContext(request);
if (ctxResult.error) return ctxResult.error as NextResponse;
const context = ctxResult.context;
```

### Pattern 3: Validate with Zod
```typescript
const result = schema.safeParse(body);
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

### Pattern 4: Check Record Exists
```typescript
const existing = await traineeStatusService.getTraineeStatusById(
  id,
  context.tenant_id
);
if (!existing) return notFoundResponse('Trainee status record not found');
```

### Pattern 5: Call Service with Audit
```typescript
try {
  const result = await traineeStatusService.updateTraineeStatus(id, {
    ...validData,
    tenantId: context.tenant_id,
    lastUpdatedBy: context.user_id,
  });
  logger.info('Success', { id, updatedBy: context.user_id });
  return successResponse(result, 'Success message', 200);
} catch (error) {
  logger.error('Error', { id, error });
  throw error; // withErrorHandler catches this
}
```

---

## 🧪 Testing Strategy

### Unit Tests (in [id]-patch.test.ts)
- Successful update
- Partial updates
- Validation errors
- Not found error
- Tenant isolation
- Invalid ID format
- Audit trail

### Unit Tests (in [id]-delete.test.ts)
- Successful soft delete
- Not found error
- Tenant isolation
- Invalid ID format
- Idempotency

### Integration Tests (Tasks 7-8)
- Real authentication
- Database transactions
- CORS headers
- Concurrent requests
- Frontend integration

### Manual Tests
- Postman/Insomnia requests
- Frontend UI flow
- Error message display
- Network tab verification

---

## 🚢 Deployment Checklist

Before considering implementation complete:

- [ ] TypeScript compiles: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] No ESLint warnings
- [ ] No console errors in browser
- [ ] Postman manual testing works
- [ ] Frontend integration verified
- [ ] Error handling tested
- [ ] Tenant isolation verified
- [ ] API documentation updated
- [ ] Code reviewed

---

## 📞 Getting Help

### For Understanding Requirements
→ See `TRAINEE_STATUS_PATCH_DELETE_TASKS.md`

### For Code Implementation
→ See `TRAINEE_STATUS_ROUTE_REFERENCE.md`

### For Quick Reference
→ See `IMPLEMENTATION_QUICK_START.md`

### For Task Planning
→ See **Task Dependency Map**

### For Specific Issues
→ See **Common Issues & Solutions** above

---

## ✅ Success Criteria

Your implementation is complete when:

1. ✅ PATCH endpoint updates records correctly
2. ✅ DELETE endpoint soft deletes records
3. ✅ All error cases return correct HTTP status codes
4. ✅ Tenant isolation is enforced (can't access other tenant's data)
5. ✅ Request validation works (rejects invalid data)
6. ✅ Tests pass (unit and integration)
7. ✅ Frontend integration works (UI reflects changes)
8. ✅ No TypeScript or ESLint errors
9. ✅ No console errors in browser
10. ✅ Code is documented and reviewed

---

## 🎯 Next Steps

1. **Read this file** - You're done!
2. **Choose an implementation path** - Pick from 3 options above
3. **Start with Task 1** (setup) - Should take 30 minutes
4. **Work through tasks systematically** - Use checklists
5. **Reference code templates** - Adapt to your needs
6. **Run tests frequently** - Catch errors early
7. **Verify end-to-end** - Include frontend testing
8. **Deploy with confidence** - Follow deployment checklist

---

## 📋 Document Quick Reference

| Document | Purpose | When to Use |
|----------|---------|-----------|
| **TRAINEE_STATUS_PATCH_DELETE_TASKS.md** | Detailed 10-task breakdown | Understanding what to implement |
| **TRAINEE_STATUS_ROUTE_REFERENCE.md** | Code template and patterns | Writing the actual code |
| **IMPLEMENTATION_QUICK_START.md** | Quick reference and checklist | Quick lookups and reminders |
| **Task Dependency Map** | Task relationships and timeline | Planning and parallelization |
| **README_IMPLEMENTATION.md** | This file | Overview and getting started |

---

**Good luck with the implementation! You've got this.** 🚀
