# Phase 4 Landing Page Customization - Quick Start Guide

## Overview

This guide helps developers quickly understand and implement Phase 4 landing page customizations.

## Core Concepts

### 1. Customization Loading
Customizations are loaded from the backend CMS Settings API without authentication:
- **Endpoint:** `GET /api/cms-settings`
- **Tenant Context:** Extracted from subdomain (e.g., `tenant.example.com` → `tenant`)
- **Cache:** 5-minute in-memory cache per tenant

### 2. CSS Variables
Customizations are applied as CSS variables into `<style id="landing-page-customizations">` in document head:
```css
:root {
  --color-primary: rgb(255, 0, 0);
  --color-secondary: rgb(0, 255, 0);
  --font-family-headings: "Playfair", sans-serif;
  /* ... more variables */
}
```

### 3. Component Visibility
Components can be hidden/shown based on customization settings:
```typescript
componentVisibility = {
  navigation: true,
  hero: true,
  features: false,  // Hidden
  testimonials: true,
  // ...
}
```

## Implementation Patterns

### Pattern 1: Using the Hook in Landing Page

```typescript
import { useLandingPageCustomizations, useComponentVisibility } from '../hooks/useLandingPageCustomizations'

export function MyLandingPage() {
  const { customizations, componentVisibility, isLoading, error } = useLandingPageCustomizations()

  // CSS variables automatically injected into document.head
  
  // Use component visibility
  const showHero = useComponentVisibility('hero', componentVisibility)
  
  return (
    <>
      {/* CSS variables applied automatically */}
      {showHero && (
        <HeroSection
          heading={customizations.content?.hero?.heading}
          subheading={customizations.content?.hero?.subheading}
        />
      )}
      
      {componentVisibility.features && (
        <FeaturesSection features={customizations.content?.features} />
      )}
    </>
  )
}
```

### Pattern 2: Using the Wrapper Component

```typescript
import LandingPageWithCustomizations from '../components/LandingPageWithCustomizations'

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPageWithCustomizations
            showErrorState={true}
            onCustomizationsLoaded={(customizations) => {
              console.log('Customizations loaded:', customizations)
            }}
          />
        }
      />
    </Routes>
  )
}
```

### Pattern 3: Direct Utility Usage

```typescript
import { loadCustomizations, extractTenantId } from '../utils/customizationLoader'

async function loadPageCustomizations() {
  const customizations = await loadCustomizations({
    timeout: 10000,
    retries: 3,
    cache: true,
    cacheTTL: 5 * 60 * 1000,
    onError: (error) => console.error('Failed to load customizations:', error),
  })
  
  return customizations
}
```

## Common Tasks

### Task 1: Display Customized Content

```typescript
// Get content with fallback
const heroHeading = customizations.content?.hero?.heading || 'Default Heading'
const features = customizations.content?.features || []
const contactEmail = customizations.content?.contact?.email || 'contact@example.com'
```

### Task 2: Conditionally Render Sections

```typescript
// Method 1: Check visibility map
if (componentVisibility.features) {
  // Render features section
}

// Method 2: Use helper hook
const showFeatures = useComponentVisibility('features', componentVisibility)
if (showFeatures) {
  // Render features section
}

// Method 3: Check component config
const featuresConfig = useComponentCustomization(customizations, 'features')
if (featuresConfig.isEnabled) {
  // Render features section
}
```

### Task 3: Apply CSS Styling

CSS variables are automatically available in all components:

```css
/* In your CSS/SCSS */
.hero-section {
  background-color: rgb(var(--color-background-rgb));
  color: rgb(var(--color-text-rgb));
}

.cta-button {
  background-color: rgb(var(--color-primary-rgb));
  color: rgb(var(--color-text-rgb));
  font-family: var(--font-family-body);
  font-size: var(--font-size-body);
}

h1 {
  font-family: var(--font-family-headings);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
}
```

### Task 4: Handle Loading and Error States

```typescript
export function MyLandingPage() {
  const { customizations, isLoading, error } = useLandingPageCustomizations()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    console.warn('Using default customizations due to error:', error)
    // Component still renders with defaults from customizations object
  }

  return (
    // Render with customizations (includes defaults)
  )
}
```

### Task 5: Reload Customizations Manually

```typescript
export function MyLandingPage() {
  const { customizations, reload } = useLandingPageCustomizations()

  const handleRefresh = async () => {
    await reload()
    console.log('Customizations reloaded')
  }

  return (
    <>
      <button onClick={handleRefresh}>Refresh Customizations</button>
    </>
  )
}
```

## Configuration

### Environment Variables

Set tenant ID via environment variable:
```env
# .env.local or .env.production
VITE_TENANT_ID=my-tenant-id
```

### Customization Options

```typescript
const customizationOptions = {
  autoLoad: true,              // Load on mount (default: true)
  debounceMs: 300,             // Debounce CSS injection (default: 300ms)
  loaderOptions: {
    timeout: 5000,             // API timeout (default: 5000ms)
    retries: 3,                // Retry count (default: 3)
    cache: true,               // Enable caching (default: true)
    cacheTTL: 5 * 60 * 1000,   // Cache TTL (default: 5 minutes)
  },
  onSuccess: () => {},         // Success callback
  onError: (error) => {},      // Error callback
}
```

## File Structure

```
Frontend/src/
├── utils/
│   ├── customizationLoader.ts           # Main loader utility
│   ├── customizationLoader.test.ts      # Loader tests (51 tests)
│   ├── cssVariableConverter.ts          # CSS conversion (Phase 3)
│   └── cssInjection.ts                  # CSS injection (Phase 3)
├── hooks/
│   ├── useLandingPageCustomizations.ts  # Main integration hook
│   └── useLandingPageCustomizations.test.ts # Hook tests (57 tests)
├── components/
│   ├── LandingPageWithCustomizations.tsx # Wrapper component
│   └── __tests__/
│       └── LandingPageWithCustomizations.integration.test.tsx # Component tests (47 tests)
└── pages/
    └── NewLandingPage.tsx               # Landing page (integration target)
```

## Testing Guide

### Run Unit Tests
```bash
npm test -- customizationLoader.test.ts
npm test -- useLandingPageCustomizations.test.ts
```

### Run Integration Tests
```bash
npm test -- LandingPageWithCustomizations.integration.test.tsx
```

### Run All Phase 4 Tests
```bash
npm test -- --testPathPattern="(customizationLoader|useLandingPageCustomizations|LandingPageWithCustomizations)"
```

### Test Coverage
- **Total Tests:** 155+
- **Unit Tests:** 51
- **Integration Tests:** 104 (57 + 47)

## Troubleshooting

### Q: Customizations not loading?
**A:** Check:
1. Browser console for errors
2. URL has correct subdomain (e.g., `tenant.example.com`)
3. Backend `/api/cms-settings` endpoint is accessible
4. Tenant ID matches backend database

### Q: CSS variables not applied?
**A:** Check:
1. Browser DevTools → Application → Styles (search for `--color-primary`)
2. CSS variables supported in your browser (check `<style id="landing-page-customizations">`)
3. No CSS errors in console that prevent style application

### Q: Component hiding not working?
**A:** Check:
1. Component name matches exactly (case-sensitive)
2. Component visibility map updated after loading
3. Conditional render logic using correct visibility state

### Q: Stale customizations in production?
**A:** Possible causes:
1. Cache not expired yet (wait 5 minutes or clear manually)
2. Browser cache holding old HTML
3. Service worker caching old responses (clear cache)

### Q: Memory leaks on unmount?
**A:** Hook automatically:
1. Removes injected CSS styles
2. Clears event listeners
3. Aborts pending requests

## Best Practices

### 1. Always Provide Fallbacks
```typescript
// Good
const features = customizations.content?.features || []

// Avoid
const features = customizations.content.features
```

### 2. Use Proper Type Checking
```typescript
// Good
if (Array.isArray(customizations.content?.features)) {
  // Process features
}

// Avoid - assumes array exists
customizations.content.features.map(...)
```

### 3. Handle Loading State
```typescript
// Good
const { isLoading, error, customizations } = useLandingPageCustomizations()
if (isLoading) return <Spinner />
if (error) console.warn('Using defaults:', error)

// Avoid - no loading state
const customizations = useLandingPageCustomizations().customizations
```

### 4. Use Semantic HTML
```typescript
// Good
<section aria-label="Hero" hidden={!componentVisibility.hero}>
  <h1>{customizations.content?.hero?.heading}</h1>
</section>

// Avoid
<div style={{ display: componentVisibility.hero ? 'block' : 'none' }}>
  {customizations.content?.hero?.heading}
</div>
```

### 5. Responsive CSS Variables
```css
/* Mobile-first */
:root {
  --container-width: 100%;
  --font-size-h1: 32px;
}

/* Desktop */
@media (min-width: 1024px) {
  :root {
    --container-width: 1200px;
    --font-size-h1: 64px;
  }
}
```

## Next Steps

1. **Integrate Hook:** Add `useLandingPageCustomizations` to NewLandingPage
2. **Update Components:** Use `componentVisibility` to conditionally render sections
3. **Apply Content:** Replace hardcoded content with `customizations.content`
4. **Style with CSS Variables:** Update CSS to use injected variables
5. **Test Locally:** Run test suites and verify behavior
6. **Deploy:** Push to production with CMS Settings configured

## Support & Documentation

- **Implementation Summary:** See `PHASE_4_IMPLEMENTATION_SUMMARY.md`
- **API Docs:** See Backend `src/app/api/cms-settings/INTEGRATION_GUIDE.md`
- **Type Definitions:** See `Frontend/src/utils/customizationLoader.ts` interfaces

## Questions?

Refer to:
1. Test files for usage examples
2. Implementation summary for architecture details
3. Type definitions for API contracts
4. Backend API documentation for endpoint details
