# CMS Settings Migration Guide

## Problem
The backend API is failing with `400 Bad Request` because the `settings_data` JSONB column doesn't exist in the `cms_settings` table. Error message: `"Could not find the 'settings_data' column of 'cms_settings' in the schema cache"`

## Solution: Apply Migration

The migration file `019_add_cms_settings_tables_FIXED.sql` creates:
- ✅ `cms_settings` table with `settings_data` JSONB column
- ✅ `cms_settings_versions` table for version history
- ✅ `cms_audit_log` table for audit trails
- ✅ `theme_presets` table with 6 default themes (Modern Minimal, Corporate, Creative, Bold Tech, Startup, Luxury)

---

## Method 1: Use Temporary API Endpoint (Fastest)

### Prerequisites
- Backend must be running (`npm run dev` in Backend directory)
- Frontend should NOT be running (to avoid port conflicts)

### Steps

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm run dev
   ```
   Wait for: "started server on 0.0.0.0:3003, url: http://localhost:3003"

2. **Apply Migration via API**

   Open your terminal and run:
   ```bash
   curl -X POST http://localhost:3003/api/admin/migrate-cms \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaGF2empnZHN6bmxva296b2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjkzNzk5MywiZXhwIjoyMDkyNTEzOTkzfQ.4wDgUR0nsJ6Qqr2kgGTM4VyOMM0zou92YrqR8g2J2aw" \
     -H "Content-Type: application/json"
   ```

   **Or use Windows PowerShell:**
   ```powershell
   $headers = @{
       "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaGF2empnZHN6bmxva296b2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjkzNzk5MywiZXhwIjoyMDkyNTEzOTkzfQ.4wDgUR0nsJ6Qqr2kgGTM4VyOMM0zou92YrqR8g2J2aw"
       "Content-Type" = "application/json"
   }
   
   Invoke-WebRequest -Uri "http://localhost:3003/api/admin/migrate-cms" `
       -Method POST `
       -Headers $headers
   ```

3. **Expected Success Response**
   ```json
   {
     "success": true,
     "message": "CMS settings migration applied successfully",
     "method": "exec_sql",
     "details": {
       "tablesCreated": [
         "cms_settings (with settings_data JSONB column)",
         "cms_settings_versions",
         "cms_audit_log",
         "theme_presets (with 6 default themes)"
       ],
       "nextSteps": [
         "Restart your Backend server",
         "POST requests to /api/cms-settings will now work",
         "The admin panel can save customization settings",
         "DELETE this migration endpoint"
       ]
     }
   }
   ```

4. **If Successful:**
   - ✅ Migration applied to Supabase
   - ✅ Stop the backend server (Ctrl+C)
   - ✅ Delete the migration endpoint: `Backend/src/app/api/admin/migrate-cms/route.ts`
   - ✅ Proceed to "Testing & Restart" section

---

## Method 2: Use Supabase Web UI (Alternative)

### Prerequisites
- Supabase account access
- Admin permissions in Supabase project

### Steps

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Project: bmdc1.1 (uhhavzjgdsznlokozocr)

2. **Navigate to SQL Editor**
   - In the left sidebar, click "SQL Editor"
   - Click "New Query" or "New SQL snippet"

3. **Copy & Paste Migration SQL**
   - Open file: `Backend/migrations/002-core-features/019_add_cms_settings_tables_FIXED.sql`
   - Copy entire content
   - Paste into the Supabase SQL Editor

4. **Execute the SQL**
   - Click the "Run" button (blue play icon)
   - Wait for confirmation: "Query executed successfully"

5. **Verify Success**
   - Check "Browser" tab
   - Look for new tables: `cms_settings`, `cms_settings_versions`, `cms_audit_log`, `theme_presets`

---

## Method 3: Use Supabase CLI (For Teams)

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase account linked

### Steps

```bash
# Install CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref uhhavzjgdsznlokozocr

# Apply migrations
supabase migration list
supabase migration up

# Or manually execute the SQL file
supabase db execute --file Backend/migrations/002-core-features/019_add_cms_settings_tables_FIXED.sql
```

---

## Testing & Restart

### 1. Verify Migration Applied

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Browser" in left sidebar
4. Check tables exist:
   - ✅ `cms_settings` (has `settings_data` JSONB column)
   - ✅ `cms_settings_versions`
   - ✅ `cms_audit_log`
   - ✅ `theme_presets` (with 6 presets)

**Via SQL Query:**
```sql
-- Check if cms_settings table exists with settings_data column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cms_settings' 
AND column_name = 'settings_data';

-- Expected result: settings_data | jsonb
```

### 2. Restart Backend

```bash
cd Backend
npm run dev
```

Expected output:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3003
- Environments: .env

✓ Ready in 2.5s
```

### 3. Test CMS Settings API

**Save Settings:**
```bash
curl -X POST http://localhost:3003/api/cms-settings \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-uuid",
    "settings_data": {
      "colors": {
        "primary": "#3B82F6"
      }
    }
  }'
```

**Get Settings:**
```bash
curl -X GET http://localhost:3003/api/cms-settings?tenant_id=your-tenant-uuid \
  -H "Content-Type: application/json"
```

### 4. Frontend Testing

```bash
cd Frontend
npm run dev
```

Then test the admin panel:
1. Login as admin
2. Go to Landing Page Customization
3. Try to save settings
4. Should receive 200 OK response

---

## Troubleshooting

### Issue: "Migration file not found"
- Make sure you're running from the Backend directory
- File location: `Backend/migrations/002-core-features/019_add_cms_settings_tables_FIXED.sql`

### Issue: "Unauthorized" or "Forbidden" error
- Check the SUPABASE_SERVICE_ROLE_KEY in `Backend/.env`
- Make sure Authorization header is correct: `Bearer <SERVICE_ROLE_KEY>`
- Token must match exactly (copy-paste from .env file)

### Issue: "RPC functions not available"
- Supabase doesn't have exec_sql RPC enabled
- Use Method 2 (Supabase Web UI) or Method 3 (CLI) instead
- Or manually create the tables via SQL Editor

### Issue: "table already exists" error
- This is normal if you've run the migration before
- The migration uses `CREATE TABLE IF NOT EXISTS`
- It's safe to run multiple times

### Issue: POST /api/cms-settings still fails with 400
- Make sure Backend server was restarted after migration
- Clear browser cache and restart frontend
- Check that cms_settings table now exists in Supabase

---

## Cleanup

After successful migration:

1. **Delete the temporary migration endpoint**
   ```bash
   rm Backend/src/app/api/admin/migrate-cms/route.ts
   ```

2. **Verify no references remain**
   ```bash
   grep -r "migrate-cms" Backend/src --exclude-dir=node_modules
   ```

3. **Commit your changes** (if using git)
   ```bash
   git add Backend/src/app/api/cms-settings
   git commit -m "feat: CMS settings migration applied"
   ```

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Create/Apply Migration | ✅ Ready |
| 2 | Verify Tables Exist | ⏳ After migration |
| 3 | Restart Backend | ⏳ After migration |
| 4 | Test API Endpoint | ⏳ After migration |
| 5 | Test Frontend Panel | ⏳ After migration |
| 6 | Delete Migration Route | ⏳ After migration |

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL JSONB Guide](https://www.postgresql.org/docs/current/datatype-json.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Project Migration Docs](Backend/migrations/docs/README.md)

---

**Created:** 2025  
**Migration File:** `019_add_cms_settings_tables_FIXED.sql`  
**Tables Affected:** cms_settings, cms_settings_versions, cms_audit_log, theme_presets
