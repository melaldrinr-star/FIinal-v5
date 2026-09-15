-- Cleanup Old Training Requirement Files
-- This will soft-delete all old records for trainee 6ffc9ceb-22ac-4413-a2c6-d1bcbe728d4a
-- and keep only the LATEST upload for each requirement type

-- First, let's see what we have
SELECT 
  id,
  requirement_type,
  file_name,
  file_path,
  uploaded_at
FROM training_requirement_files
WHERE trainee_id = '6ffc9ceb-22ac-4413-a2c6-d1bcbe728d4a'
  AND deleted_at IS NULL
ORDER BY requirement_type, uploaded_at DESC;

-- Soft delete all files for this trainee (we'll keep only the latest per type)
UPDATE training_requirement_files
SET deleted_at = NOW()
WHERE trainee_id = '6ffc9ceb-22ac-4413-a2c6-d1bcbe728d4a'
  AND deleted_at IS NULL;

-- Now restore ONLY the latest file for each requirement type
WITH latest_files AS (
  SELECT DISTINCT ON (requirement_type) 
    id
  FROM training_requirement_files
  WHERE trainee_id = '6ffc9ceb-22ac-4413-a2c6-d1bcbe728d4a'
  ORDER BY requirement_type, uploaded_at DESC
)
UPDATE training_requirement_files
SET deleted_at = NULL
WHERE id IN (SELECT id FROM latest_files);

-- Verify the cleanup
SELECT 
  requirement_type,
  file_name,
  file_path,
  uploaded_at
FROM training_requirement_files
WHERE trainee_id = '6ffc9ceb-22ac-4413-a2c6-d1bcbe728d4a'
  AND deleted_at IS NULL
ORDER BY requirement_type;
