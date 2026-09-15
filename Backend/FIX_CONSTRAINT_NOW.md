# URGENT: Fix Database Constraint

## Problem
The unique constraint is still including `deleted_at` which prevents cleanup.

## Solution
Copy and run this SQL sa backend terminal using `psql` or Supabase SQL Editor:

```sql
-- Step 1: Drop the bad constraint
ALTER TABLE training_requirement_files 
  DROP CONSTRAINT IF EXISTS training_requirement_files_tenant_id_trainee_id_requirement_key;

-- Step 2: Create proper unique index (only for non-deleted files)
DROP INDEX IF EXISTS idx_training_req_files_unique_active;
CREATE UNIQUE INDEX idx_training_req_files_unique_active
  ON training_requirement_files(tenant_id, trainee_id, requirement_type)
  WHERE deleted_at IS NULL;
```

## After Running This
Run the cleanup script again:
```bash
cd Backend
node scripts/cleanup-training-files.js
```

Then refresh the trainee edit page.
