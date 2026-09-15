# Fix Training Requirement Files Upload Issue

## Problem
Files are not being saved to the database because of a UNIQUE constraint issue.

## Solution
Run this SQL in your Supabase SQL Editor or psql:

```sql
-- Drop the old constraint that prevents re-uploading files
ALTER TABLE public.training_requirement_files 
  DROP CONSTRAINT IF EXISTS training_requirement_files_tenant_id_trainee_id_requirement_t_key;

-- Create a partial unique index instead
-- This ensures one active (not deleted) file per requirement type per trainee
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_req_files_unique_active
  ON public.training_requirement_files(tenant_id, trainee_id, requirement_type)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_training_req_files_unique_active IS
  'Ensures only one active (non-deleted) file per requirement type per trainee per tenant';
```

## How to Run

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the SQL above
5. Click "Run"

### Option 2: psql Command Line
```bash
psql -h your-supabase-host -U postgres -d your-database-name -f Backend/migrations/011-training-requirement-files/002_fix_unique_constraint.sql
```

### Option 3: Node Script
```bash
cd Backend
node scripts/fix-training-requirement-files-constraint.js
```

## After Running
Once you've run this SQL, try uploading files again. They should now save to the database correctly!
