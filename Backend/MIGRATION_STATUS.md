# CMS Settings Migration Status

## Current Status: ⏳ READY TO APPLY

### Problem
API Error when calling `POST /api/cms-settings`:
```
400 Bad Request
"Could not find the 'settings_data' column of 'cms_settings' in the schema cache"
```

### Root Cause
The `cms_settings` table exists but lacks the `settings_data` JSONB column that stores all customization data.

### Solution
Apply migration: `019_add_cms_settings_tables_FIXED.sql`

---

## Files Created for Migration

### 1. **Temporary API Endpoint** (Recommended Method)
📄 `Backend/src/app/api/admin/migrate-cms/route.ts`

- Applies migration via HTTP POST request
- Requires SUPABASE_SERVICE_ROLE_KEY authentication
- Supports 3 RPC methods: exec_sql, sql_exec, query_exec
- Endpoint: `POST http://localhost:3003/api/admin/migrate-cms`

### 2. **Verification Script**
📄 `Backend/scripts/verify-cms-migration.js`

- Checks if migration has been applied
- Lists all CMS tables and their status
- Verifies settings_data column exists
- Shows theme presets count
- Command: `npm run verify:cms-migration`

### 3. **Documentation**
📄 `Backend/CMS_MIGRATION_GUIDE.md`

- Comprehensive migration guide
- 3 different methods to apply migration
- Troubleshooting section
- Testing instructions
- Cleanup steps

📄 `Backend/QUICK_MIGRATION_STEPS.txt`

- Quick reference (5-minute process)
- Copy-paste ready commands
- Windows PowerShell support
- Essential steps only

---

## Migration Methods

### ✨ Method 1: API Endpoint (FASTEST)
**Time:** ~2 minutes  
**Difficulty:** Easy  
**Requirements:** Backend running locally  

Steps:
1. `npm run dev` in Backend
2. `curl -X POST http://localhost:3003/api/admin/migrate-cms ...`
3. Done!

### 🌐 Method 2: Supabase Web UI (RECOMMENDED)
**Time:** ~5 minutes  
**Difficulty:** Very Easy  
**Requirements:** Supabase dashboard access

Steps:
1. Go to Supabase SQL Editor
2. Copy SQL from migration file
3. Paste and run
4. Done!

### 🛠️ Method 3: Supabase CLI (FOR TEAMS)
**Time:** ~10 minutes  
**Difficulty:** Medium  
**Requirements:** Supabase CLI installed

Steps:
1. `supabase link --project-ref uhhavzjgdsznlokozocr`
2. `supabase migration up`
3. Done!

---

## Migration Creates

✅ **cms_settings** table
- Columns: id, tenant_id, settings_data (JSONB), created_at, updated_at, updated_by_admin_id
- Stores: colors, typography, layout, components, content
- One record per tenant

✅ **cms_settings_versions** table
- Columns: id, cms_settings_id, settings_data, version_number, change_summary, created_at, created_by_admin_id
- Purpose: Version history and rollback

✅ **cms_audit_log** table
- Columns: id, tenant_id, admin_id, action, resource_type, changes, timestamp
- Purpose: Compliance and audit trail

✅ **theme_presets** table
- 6 pre-configured themes:
  1. Modern Minimal - Clean and contemporary
  2. Corporate - Professional enterprise design
  3. Creative - Vibrant and artistic
  4. Bold Tech - Modern tech-focused with bold colors
  5. Startup - Fresh and energetic
  6. Luxury - Sophisticated premium aesthetics

---

## Quick Commands

```bash
# Apply migration via temporary API endpoint (locally)
npm run dev  # Terminal 1
# Then in Terminal 2:
curl -X POST http://localhost:3003/api/admin/migrate-cms \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"

# Verify migration was applied
npm run verify:cms-migration

# View migration file
cat Backend/migrations/002-core-features/019_add_cms_settings_tables_FIXED.sql

# Delete temporary endpoint after migration succeeds
rm Backend/src/app/api/admin/migrate-cms/route.ts
```

---

## After Migration - Features Enabled

### 🎨 Admin Panel
- Landing Page Customization section
- Save custom colors, typography, layout
- Apply theme presets
- Version history and rollback

### 🚀 API Endpoints
```
POST   /api/cms-settings              - Save customization
GET    /api/cms-settings?tenant_id=X - Retrieve customization
GET    /api/theme-presets             - List available presets
POST   /api/cms-settings/preset       - Apply theme preset
GET    /api/cms-settings/versions     - Get version history
```

### 📄 Frontend
- Dynamic landing page rendering
- Custom colors, fonts, layouts
- Responsive design with custom spacing
- Hero section customization

---

## Files Changed

### New Files
- ✨ `Backend/src/app/api/admin/migrate-cms/route.ts` (temporary)
- ✨ `Backend/scripts/verify-cms-migration.js`
- ✨ `Backend/CMS_MIGRATION_GUIDE.md`
- ✨ `Backend/QUICK_MIGRATION_STEPS.txt`
- ✨ `Backend/MIGRATION_STATUS.md` (this file)

### Modified Files
- 📝 `Backend/package.json` (added verify:cms-migration script)

### Database Changes
- 🗄️ Creates 4 new tables: cms_settings, cms_settings_versions, cms_audit_log, theme_presets
- 🗄️ Creates 12 indexes for performance
- 🗄️ Creates 2 triggers for automatic updated_at timestamps
- 🗄️ Populates theme_presets with 6 default themes
- 🗄️ Creates cms_settings records for existing tenants

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Drop all CMS tables (reversible if you have backups)
DROP TABLE IF EXISTS cms_audit_log CASCADE;
DROP TABLE IF EXISTS cms_settings_versions CASCADE;
DROP TABLE IF EXISTS cms_settings CASCADE;
DROP TABLE IF EXISTS theme_presets CASCADE;

-- Then re-apply the migration
```

---

## Checklist

- [ ] Read this file and understand the migration
- [ ] Choose migration method (API, Web UI, or CLI)
- [ ] Apply the migration
- [ ] Verify: `npm run verify:cms-migration`
- [ ] Restart backend: `npm run dev`
- [ ] Test API: `POST /api/cms-settings`
- [ ] Test frontend: Admin panel customization
- [ ] Delete temporary endpoint: `rm Backend/src/app/api/admin/migrate-cms/route.ts`
- [ ] Commit changes to git

---

## Support

For help:
1. Read: `Backend/CMS_MIGRATION_GUIDE.md` (detailed)
2. Read: `Backend/QUICK_MIGRATION_STEPS.txt` (quick reference)
3. Run: `npm run verify:cms-migration` (check status)
4. Check: `Backend/migrations/docs/README.md` (migration documentation)

---

**Status:** ⏳ Ready to apply  
**Created:** 2025  
**Migration File:** `019_add_cms_settings_tables_FIXED.sql`  
**Tables Affected:** 4 new tables, 12 indexes, 2 triggers
