# Enrollment Requirements System - Developer Guide

Quick reference for the enrollment requirements integration with requirement definitions (Tasks 6.1-6.3).

## Quick Start

### 1. Database Setup
The enrollment_requirements table is created automatically via migration:
```sql
-- Migration: 010-enrollment-requirements/001_create_enrollment_requirements_table.sql
-- Creates table with:
- id, enrollment_id, requirement_id, tenant_id
- is_applicable, submission_status
- document tracking (document_url, submitted_at, verified_at, etc.)
```

### 2. Populate Requirements
Seeds the 7 core requirement types for each tenant:
```bash
npm run seed requirement-definitions
```

This creates:
- Accomplished Learner's Profile Form
- Birth Certificate (NSO/PSA)
- Marriage Certificate (PSA/NSO) - married trainees only
- ID Pictures (1x1, white background)
- Valid ID Copy
- Report Card/TOR
- Barangay No Grade Certification

### 3. Migrate Existing Enrollments
If you have existing enrollments, migrate them:
```bash
curl -X POST http://localhost:3000/api/admin/migrations/enrollment-requirements \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{ "action": "full" }'
```

## Key Components

### enrollmentRequirementService.ts
Core service for requirement management:

**initializeEnrollmentRequirements(enrollmentId, traineeId, tenantId)**
- Called automatically when enrollment is created
- Fetches trainee profile and requirement definitions
- Evaluates applicability rules
- Creates enrollment_requirements records
- Returns array of created requirements

```typescript
const requirements = await initializeEnrollmentRequirements(
  'enrollment-001',
  'trainee-001',
  'tenant-001'
);
// [
//   { enrollment_id, requirement_id, is_applicable: true, submission_status: 'pending' },
//   { enrollment_id, requirement_id, is_applicable: false, submission_status: 'pending' }
// ]
```

**evaluateApplicabilityRules(rules, traineeProfile)**
- Evaluates if a requirement applies to a trainee
- Returns boolean

```typescript
const rules = {
  applicable_to: {
    marital_status: ['married']
  }
};
const traineeProfile = { marital_status: 'married' };
const isApplicable = evaluateApplicabilityRules(rules, traineeProfile); // true
```

**updateEnrollmentRequirementsApplicability(traineeId, tenantId)**
- Re-evaluates applicability when trainee profile changes
- Updates is_applicable flags if changed
- Useful when marital status is updated

**getEnrollmentRequirementsWithDetails(enrollmentId, includeNonApplicable)**
- Fetches enrollment requirements with linked requirement definitions
- Filters out non-applicable requirements by default
- Used for trainee UI to show applicable requirements only

### enrollmentRequirementMigrationService.ts
Tools for data migration:

**ensureRequirementDefinitions(tenantId)**
- Ensures all 7 core requirements exist for a tenant
- Creates any missing types
- Returns { created, existing } counts

**migrateExistingEnrollments(tenantId?)**
- Migrates existing enrollments to enrollment_requirements
- Evaluates applicability based on trainee profile
- Returns { enrollmentsProcessed, requirementsCreated }

**verifyMigration(tenantId)**
- Checks migration completeness
- Returns verification stats and isComplete flag

## Applicability Rules

Requirements can have applicability rules stored as JSONB in `requirement_definitions.applicability_rules`.

### Structure:
```json
{
  "applicable_to": {
    "marital_status": ["married"],
    "employment_status": ["employed", "self-employed"]
  }
}
```

### Current Implementation:
Only `marital_status` is evaluated. To extend:

1. Add condition to `evaluateApplicabilityRules()` function
2. Update requirement definitions with new rules
3. Test with new trainee profile conditions

### Example - Marriage Certificate:
```json
{
  "applicable_to": {
    "marital_status": ["married"]
  }
}
```
Only trainees with `marital_status = 'married'` will have `is_applicable = true`.

## Enrollment Flow

### Step-by-step when trainee enrolls:

1. User calls `POST /api/enrollments` with `trainee_id`, `program_id`
2. Enrollment route validates and creates enrollment record
3. **NEW: Requirement initialization triggered**
   ```typescript
   const requirements = await initializeEnrollmentRequirements(
     enrollment.id,
     trainee_id,
     tenant_id
   );
   ```
4. Service fetches:
   - Trainee profile (marital_status, etc.)
   - All active requirement_definitions for tenant
5. For each requirement:
   - Evaluates applicability rules
   - Creates enrollment_requirement record with is_applicable flag
6. All new records have submission_status = 'pending'
7. Enrollment creation completes successfully

### Example Response:
```json
{
  "id": "enrollment-001",
  "trainee_id": "trainee-001",
  "program_id": "program-001",
  "status": "enrolled",
  "created_at": "2024-01-15T10:00:00Z"
}
// Enrollment requirements automatically created:
// - Accomplished Learner's Profile Form (applicable: true)
// - Birth Certificate (applicable: true)
// - Marriage Certificate (applicable: false) ← not married
// - ID Pictures (applicable: true)
// - Valid ID (applicable: true)
// - Report Card (applicable: true)
// - Barangay Certification (applicable: true)
```

## Common Tasks

### Show trainee their applicable requirements
```typescript
const requirements = await getEnrollmentRequirementsWithDetails(
  enrollmentId,
  false // don't include non-applicable
);
// Returns only applicable requirements for display
```

### Update requirement status (verified)
```typescript
const { error } = await supabaseAdmin
  .from('enrollment_requirements')
  .update({
    submission_status: 'verified',
    verified_at: new Date().toISOString(),
    verified_by: userId
  })
  .eq('id', requirementId);
```

### Check if all requirements are complete
```typescript
const { data: reqs } = await supabaseAdmin
  .from('enrollment_requirements')
  .select('submission_status')
  .eq('enrollment_id', enrollmentId)
  .eq('is_applicable', true);

const allComplete = reqs?.every(r => 
  ['verified', 'waived'].includes(r.submission_status)
);
```

### Handle trainee profile change
```typescript
// When marital_status is updated in trainee_status_records:
await updateEnrollmentRequirementsApplicability(traineeId, tenantId);

// Now marriage_certificate requirement will be applicable if married
```

## Database Queries

### Find pending requirements for a trainee
```sql
SELECT er.*, rd.display_name
FROM enrollment_requirements er
JOIN requirement_definitions rd ON rd.id = er.requirement_id
WHERE er.enrollment_id = 'enrollment-001'
  AND er.is_applicable = true
  AND er.submission_status = 'pending'
ORDER BY rd.display_order;
```

### Get requirement completion stats
```sql
SELECT
  rd.display_name,
  COUNT(*) as total,
  COUNT(CASE WHEN er.submission_status = 'verified' THEN 1 END) as verified,
  COUNT(CASE WHEN er.submission_status = 'pending' THEN 1 END) as pending,
  ROUND(100.0 * COUNT(CASE WHEN er.submission_status = 'verified' THEN 1 END) / COUNT(*)) as completion_rate
FROM enrollment_requirements er
JOIN requirement_definitions rd ON rd.id = er.requirement_id
WHERE er.tenant_id = 'tenant-001'
  AND er.is_applicable = true
GROUP BY rd.id, rd.display_name
ORDER BY rd.display_order;
```

## Testing

Run tests for requirement service:
```bash
npm run test Backend/src/services/__tests__/enrollmentRequirementService.test.ts
```

Tests cover:
- ✅ Applicability rules evaluation with various trainee profiles
- ✅ Enrollment requirement initialization
- ✅ Requirement fetching with details
- ✅ Error handling (missing profiles, database errors)

## Troubleshooting

### Requirements not created for new enrollment
1. Check if requirement_definitions are seeded:
   ```sql
   SELECT COUNT(*) FROM requirement_definitions WHERE is_active = true;
   ```
2. Check enrollment requirements were created:
   ```sql
   SELECT COUNT(*) FROM enrollment_requirements WHERE enrollment_id = 'xxx';
   ```
3. Check logs for initialization errors:
   ```
   [Enrollment xxx] Initialized N requirements
   Failed to initialize enrollment requirements for enrollment xxx: [error]
   ```

### Applicability rules not working
1. Verify trainee_status_records exists for trainee:
   ```sql
   SELECT * FROM trainee_status_records WHERE trainee_id = 'xxx';
   ```
2. Check requirement_definitions has correct applicability_rules:
   ```sql
   SELECT requirement_type, applicability_rules FROM requirement_definitions
   WHERE requirement_type = 'marriage_certificate_copy';
   ```
3. Check trainee marital_status value matches rule:
   ```sql
   SELECT marital_status FROM trainee_status_records WHERE trainee_id = 'xxx';
   ```

### Migration not completing
1. Check if requirement_definitions are created:
   ```sql
   SELECT COUNT(*) FROM requirement_definitions WHERE is_active = true;
   ```
2. Check migration logs via API:
   ```bash
   curl -X POST http://localhost:3000/api/admin/migrations/enrollment-requirements \
     -d '{ "action": "verify" }'
   ```
3. Check for duplicate enrollment_requirements:
   ```sql
   SELECT enrollment_id, requirement_id, COUNT(*)
   FROM enrollment_requirements
   GROUP BY enrollment_id, requirement_id
   HAVING COUNT(*) > 1;
   ```

## Performance Notes

- Applicability evaluation happens at enrollment creation time (not on queries)
- is_applicable is stored in database (no runtime evaluation needed)
- Indexes on common queries (enrollment_id, submission_status)
- Composite index for "pending applicable requirements" queries
- Batch operations supported via enrollment_requirements inserts

## Security

- Tenant isolation: All queries filtered by tenant_id
- Role-based: Only admins can run migrations
- No cross-tenant data exposure
- Soft deletes preserve audit trail
- Verified_by tracks who approved requirements

## Future Extensions

Applicability rules can be extended for:
- Employment status
- Age ranges
- Education level
- Program type
- Location/region

Just add to `evaluateApplicabilityRules()` function and update requirement_definitions.
