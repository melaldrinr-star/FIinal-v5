# Complete Fix for Training Requirement Files

## Summary of All Issues and Fixes

### Issue 1: Files not displayed on re-edit ✅ FIXED
**Problem**: API response structure mismatch
**Fix**: Changed `filesResponse.data.files` to `filesResponse.files`

### Issue 2: Download not working ✅ FIXED  
**Problem**: Using manual blob handling instead of API helper
**Fix**: Changed to use `api.downloadFile()` method

### Issue 3: Files not saving to database ✅ FIXED
**Problem**: Unique constraint included `deleted_at` field
**Fix**: Ran cleanup script to keep only latest files per type

### Issue 4: Old files not replaced when uploading new ones ❌ STILL BROKEN
**Problem**: Backend deletes old file but unique constraint or timing issues prevent new file insert
**Root Cause**: The deleteRequirementFile function does soft-delete, but uploadRequirementFile expects hard delete

## The Real Fix Needed

The backend `uploadRequirementFile` function needs to use HARD DELETE, not soft delete:

```typescript
// Instead of calling deleteRequirementFile (which soft-deletes)
await deleteRequirementFile(tenantId, traineeId, requirementType);

// We need to HARD DELETE the old record first
```

## Action Items

1. **Update the upload function to hard-delete old records**
2. **Ensure file is physically deleted from disk**
3. **Then insert new record**
