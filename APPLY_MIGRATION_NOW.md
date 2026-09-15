# 🚨 APPLY MIGRATION NOW - BLOCKING THE CUSTOMIZATION SYSTEM

**Error:** `POST /api/cms-settings 400 Bad Request`  
**Cause:** The database is missing the `settings_data` JSONB column

---

## ✅ SOLUTION: Apply Database Migration

### **Step-by-Step Instructions (5 minutes)**

#### **1. Open Supabase Dashboard**
- Go to: https://supabase.com/dashboard
- Select your project (uhhavzjgdsznlokozocr - Bongabong BMDC)
- You should see your project's tables in the "Browser" tab

#### **2. Open SQL Editor**
- In the left sidebar, click **"SQL Editor"**
- Click **"New Query"** button (or look for "New SQL snippet")

#### **3. Copy the Migration SQL**

The migration file is located at:
```
Backend/migrations/002-core-features/019_add_cms_settings_tables_FIXED.sql
```

**Here's the complete SQL to paste:**

```sql
-- =============================================================================
-- 019_add_cms_settings_tables_FIXED.sql
-- Add CMS Settings tables for landing page customization system
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. CMS SETTINGS TABLE (Main Configuration Store)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  
  settings_data JSONB NOT NULL DEFAULT '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "text": "#1F2937",
      "borders": "#E5E7EB"
    },
    "typography": {
      "headings": {
        "fontFamily": "Poppins",
        "fontSize": {"h1": 48, "h2": 36, "h3": 28},
        "fontWeight": 700,
        "lineHeight": 1.2
      },
      "body": {
        "fontFamily": "Inter",
        "fontSize": 16,
        "fontWeight": 400,
        "lineHeight": 1.5
      }
    },
    "layout": {
      "containerWidth": "1200px",
      "containerLayout": "centered",
      "padding": {"heroSection": 40, "contentAreas": 32, "footer": 24},
      "margins": {"sectionSpacing": 48, "elementSpacing": 16},
      "gaps": {"grid": 24, "flex": 16}
    },
    "components": {
      "navigation": {"enabled": true, "style": "light"},
      "hero": {"enabled": true, "backgroundImage": "url(...)", "overlayColor": "rgba(0,0,0,0.3)", "height": "500px"},
      "features": {"enabled": true, "layout": "grid", "columns": 3},
      "testimonials": {"enabled": true, "displayCount": 3},
      "ctaSection": {"enabled": true, "style": "button"},
      "contact": {"enabled": true, "formFields": ["email", "phone", "message"]},
      "footer": {"enabled": true, "linkColumns": 4}
    },
    "content": {
      "hero": {"heading": "Welcome to Our Platform", "subheading": "Build amazing things", "ctaText": "Get Started"},
      "missionVision": {"title": "Our Mission", "description": "To empower businesses...", "vision": "To be the leading..."},
      "features": [{"title": "Feature 1", "description": "Description...", "icon": "icon-name"}],
      "testimonials": [{"text": "Great product!", "author": "John Doe", "image": "url(...)"}],
      "contact": {"email": "contact@example.com", "phone": "+1-555-000-0000", "address": "123 Main St", "socialLinks": {"twitter": "https://twitter.com/...", "linkedin": "https://linkedin.com/..."}}
    }
  }',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by_admin_id UUID,
  
  CONSTRAINT fk_cms_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_cms_settings_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_settings_tenant_id ON cms_settings(tenant_id);

DROP TRIGGER IF EXISTS trigger_cms_settings_updated_at ON cms_settings;
CREATE TRIGGER trigger_cms_settings_updated_at
  BEFORE UPDATE ON cms_settings FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- CMS_SETTINGS_VERSIONS TABLE
CREATE TABLE IF NOT EXISTS cms_settings_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_settings_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  settings_data JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  change_summary VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_admin_id UUID,
  
  CONSTRAINT fk_cms_versions_cms_settings FOREIGN KEY (cms_settings_id) REFERENCES cms_settings(id) ON DELETE CASCADE,
  CONSTRAINT fk_cms_versions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_cms_versions_admin FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_cms_version UNIQUE(cms_settings_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_cms_versions_tenant_id ON cms_settings_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cms_versions_cms_settings_id ON cms_settings_versions(cms_settings_id);

-- CMS_AUDIT_LOG TABLE
CREATE TABLE IF NOT EXISTS cms_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  admin_id UUID,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'rollback', 'apply_preset', 'export')),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_cms_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_cms_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_audit_tenant_id ON cms_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cms_audit_timestamp ON cms_audit_log(timestamp DESC);

-- THEME_PRESETS TABLE
CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  preset_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_theme_presets_is_active ON theme_presets(is_active);

-- Populate default presets
INSERT INTO theme_presets (name, description, category, preset_data, is_active) VALUES
('Modern Minimal', 'Clean and contemporary design', 'modern', '{"colors": {"primary": "#1F2937", "secondary": "#F3F4F6", "accent": "#3B82F6", "background": "#FFFFFF", "text": "#111827", "borders": "#E5E7EB"}}', true),
('Corporate', 'Professional enterprise design', 'corporate', '{"colors": {"primary": "#003A70", "secondary": "#0052A3", "accent": "#F39200", "background": "#FFFFFF", "text": "#1A1A1A", "borders": "#D0D0D0"}}', true),
('Creative', 'Vibrant and artistic design', 'creative', '{"colors": {"primary": "#FF006E", "secondary": "#8338EC", "accent": "#FFBE0B", "background": "#FFFFFF", "text": "#17171B", "borders": "#E5E5EA"}}', true),
('Bold Tech', 'Modern tech-focused with bold colors', 'bold', '{"colors": {"primary": "#6366F1", "secondary": "#EC4899", "accent": "#10B981", "background": "#0F172A", "text": "#F1F5F9", "borders": "#1E293B"}}', true),
('Startup', 'Fresh and energetic design', 'startup', '{"colors": {"primary": "#FF5733", "secondary": "#00D9FF", "accent": "#00FF88", "background": "#FFFFFF", "text": "#1A1A2E", "borders": "#E0E0E0"}}', true),
('Luxury', 'Sophisticated premium aesthetics', 'luxury', '{"colors": {"primary": "#2D1810", "secondary": "#B8860B", "accent": "#D4AF37", "background": "#FEFEF0", "text": "#1F1F1F", "borders": "#E8E8DC"}}', true);

-- Initialize cms_settings for existing tenants
INSERT INTO cms_settings (tenant_id)
SELECT id FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM cms_settings)
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;
```

#### **4. Paste the SQL**
- Right-click in the SQL Editor and select **"Paste"**
- Or use **Ctrl+V**

#### **5. Execute the SQL**
- Click the **"RUN"** button (blue play icon in top right)
- Wait for the message: **"Query executed successfully"**

#### **6. Verify Success**
- Click the **"Browser"** tab in the left sidebar
- You should see these new tables:
  - ✅ `cms_settings` (with `settings_data` JSONB column)
  - ✅ `cms_settings_versions`
  - ✅ `cms_audit_log`
  - ✅ `theme_presets` (with 6 themes)

---

## 🚀 After Migration - What to Do Next

### **1. Restart Backend Server**
```bash
cd Backend
npm run dev
```

### **2. Refresh Admin Panel**
- Go to: http://localhost:3001/cms-settings
- The page should now load without errors

### **3. Try Saving Settings**
- Click the **Colors** tab
- Pick a color
- Click **"Save Changes"**
- Should see: ✅ "Settings saved successfully!"

### **4. Check Landing Page**
- Go to: http://localhost:3001/
- The landing page should render with your custom colors

---

## ✨ What You Can Now Do

After migration succeeds, the admin panel will have **6 fully functional customization tabs:**

1. **🎨 Colors** - Customize primary, secondary, accent colors
2. **✏️ Typography** - Configure fonts, sizes, weights
3. **📏 Layout** - Adjust spacing, padding, margins
4. **🧩 Components** - Toggle page sections on/off
5. **📝 Content** - Edit hero, mission, testimonials
6. **🎭 Presets** - Apply 6 pre-configured themes

---

## ⚠️ Troubleshooting

**If you get "permission denied":**
- Make sure you're logged into Supabase dashboard with admin account
- Try using Incognito mode

**If "Query executed successfully" but doesn't work:**
- Click the "Browser" tab to verify tables exist
- Run this verification SQL:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'cms_settings' 
  AND column_name = 'settings_data';
  ```
- Should return: `settings_data | jsonb`

**If you need to undo this:**
- Run this SQL to drop the tables:
  ```sql
  DROP TABLE IF EXISTS cms_audit_log CASCADE;
  DROP TABLE IF EXISTS cms_settings_versions CASCADE;
  DROP TABLE IF EXISTS cms_settings CASCADE;
  DROP TABLE IF EXISTS theme_presets CASCADE;
  ```

---

## 📞 Need Help?

Detailed guides:
- `Backend/CMS_MIGRATION_GUIDE.md` - Complete reference
- `Backend/QUICK_MIGRATION_STEPS.txt` - Quick reference

---

**⏱️ Time Required:** 5 minutes  
**Difficulty:** Easy  
**Impact:** Unblocks entire customization system

