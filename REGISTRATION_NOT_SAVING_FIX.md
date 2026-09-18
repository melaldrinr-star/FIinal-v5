# Registration Data Not Saving - ROOT CAUSE FOUND

## Critical Issue

**Backend build was FAILING**

Error: Module not found - '@/services/anomalyService'
Location: Backend/src/app/api/reports/[type]/csv|pdf/route.ts

## This caused:
- Backend API not executing
- Registration data not saving
- Frontend showed success but no data in database

## FIX: Restart Dev Servers

1. Stop backend: Ctrl+C
2. cd Backend && rm -rf .next && npm run build
3. npm run dev
4. In new terminal: cd Frontend && npm run dev
5. Test registration again

## Check Database:
\\\sql
SELECT COUNT(*) FROM trainees;
SELECT COUNT(*) FROM trainees WHERE registration_status = 'pending';
\\\`n
## Status: ✅ Backend now builds successfully