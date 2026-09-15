# BMDC Frontend - Deployment & SPA Routing Troubleshooting Guide

## Problem
When accessing protected routes like \/dashboard\, the server returns a 404 error instead of serving the React app.

## Root Causes
1. **mod_rewrite is disabled** on the Apache server
2. **RewriteBase is incorrect** (if site is in a subdirectory)
3. **Server is running IIS, not Apache** (.htaccess won't work)
4. **.htaccess is not being processed** (AllowOverride not set)

## Solution Overview
I've created TWO files for you:

### 1. .htaccess (for Apache servers)
- Location: \Frontend/.htaccess\
- What it does: Routes all non-existent URLs to \index.html\ so React Router can handle routing

### 2. web.config (for IIS servers)
- Location: \Frontend/web.config\
- What it does: Same thing, but for Windows/IIS servers

## Deployment Steps

### For Apache (most common):

1. **Upload the build directory to your server:**
   \\\
   cd Frontend
   npm run build
   \\\

2. **Upload to bmdc.site:**
   - Upload the entire contents of \uild/\ folder to your web root
   - This should include:
     - \index.html\
     - \ssets/\ folder
     - \avicon.ico\, \avicon.svg\, \sw.js\
     - **.htaccess** ← Upload this too!

3. **Verify .htaccess is in the right place:**
   - It should be at the root of your web directory
   - NOT in a subdirectory

### For IIS (Windows servers):

1. **Upload the build directory:**
   - Upload contents of \uild/\ folder
   - This time, also upload \web.config\ (instead of .htaccess)

## Debugging Steps

### Step 1: Verify mod_rewrite is enabled
If you see a 404:
- Contact your hosting provider and ask: "Is Apache mod_rewrite enabled?"
- Ask them to enable it if it's not

### Step 2: Check if .htaccess is being processed
Create a test file in the build directory:
- Create a file called \.htaccess-test\
- Add this to .htaccess:
  \\\pache
  Header set X-Test "htaccess-works"
  \\\
- Visit: \https://bmdc.site/test-page\
- Open DevTools → Network → right-click request → Headers
- Look for \X-Test: htaccess-works\ in response headers
- If it's there, .htaccess is working!

### Step 3: Verify your site structure
- Visit \https://bmdc.site/\ - Should load landing page ✓
- Visit \https://bmdc.site/assets/\ - Should show 403 or directory listing
- If root doesn't work, the problem is the file upload, not routing

### Step 4: Check server type
- Look in your hosting control panel for "Server Info" or "System Info"
- It will say either "Apache" or "IIS/Windows"

## If None of This Works

If you've tried everything and it still doesn't work:

1. **Hosting provider might have custom routing**
   - Ask: "Do you have custom web server configuration?"
   - Ask: "Can you add a rewrite rule to route all requests to index.html?"

2. **Alternative: Use a different hosting service**
   - Netlify, Vercel, AWS S3 + CloudFront
   - These handle SPA routing automatically

3. **Manual workaround (not recommended):**
   - Don't use pretty URLs
   - Add \\#\ to URLs: \mdc.site/#/dashboard\ instead of \mdc.site/dashboard\
   - This tells the browser the path is client-side

## File Locations

- .htaccess → \Frontend/.htaccess\ (for Apache)
- web.config → \Frontend/web.config\ (for IIS)
- Both should be uploaded to the root of your website

## API Configuration

Your .env shows:
\\\
VITE_API_BASE_URL=https://bmdc.online/api
VITE_WEBSOCKET_URL=wss://bmdc.online/ws
\\\

Make sure these are correct when deployed!

## Questions for Your Hosting Provider

If you need to contact them:

> "I have a React SPA that needs all requests (except real files) routed to index.html. 
> My site is at bmdc.site, and I've placed an .htaccess file in the root.
> Can you confirm mod_rewrite is enabled and AllowOverride is set to All?"

---

Let me know if you need any changes!
