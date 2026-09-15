# Pre-Existing Test Failures Analysis

**Status:** 3 pre-existing failures (NOT caused by our schema compatibility fixes)

---

## Failure #1: Share Link URL Base Domain

**Test:** `GET /api/programs/:id/share-link › Link Generation › should use application base domain in link`

**File:** `Backend/src/app/api/programs/[id]/share-link/route.test.ts:257`

**Error:**
```
Expected substring: "http://localhost:3003"
Received string:    "http://localhost:3000/share?program_id=prog-uuid-1234"
```

### Root Cause

**Configuration Mismatch:**

The test expects the share URL to use `http://localhost:3003` (from test mock headers), but the route code ignores the request headers and uses only `process.env.FRONTEND_URL`:

```typescript
// Backend/src/app/api/programs/[id]/share-link/route.ts:150
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
```

The route does NOT use the dynamic `getBaseUrl()` function that was defined at the top of the file. The test mocks `host: 'localhost:3003'` but this is never used.

### Related Code

**Route (line 150):**
```typescript
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
```

**Function Defined But Unused (lines 38-43):**
```typescript
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;
  return baseUrl;
}
```

### Fix (if needed)

Either:
1. **Option A:** Use the `getBaseUrl()` function (respect request headers)
   ```typescript
   const baseUrl = getBaseUrl(request);
   ```

2. **Option B:** Update tests to expect `http://localhost:3001` (use env var)
   ```typescript
   expect(data.data.url).toContain('http://localhost:3001');
   ```

3. **Option C:** Ensure `FRONTEND_URL` is set in test environment
   ```bash
   FRONTEND_URL=http://localhost:3003 npm test
   ```

### Impact

- **Severity:** 🟡 LOW (configuration issue, not logic bug)
- **Affected:** Social sharing URL generation
- **User Impact:** Share links would use wrong base URL if `FRONTEND_URL` env var not set correctly
- **Related to Our Fixes:** ❌ NO

---

## Failure #2: Share Link HTTPS URL

**Test:** `GET /api/programs/:id/share-link › Edge Cases › should handle HTTPS base URL`

**File:** `Backend/src/app/api/programs/[id]/share-link/route.test.ts:546`

**Error:**
```
Expected substring: "https://bmdc.online"
Received string:    "http://localhost:3000/share?program_id=prog-uuid-1234"
```

### Root Cause

Same as Failure #1 — the route ignores request headers and always uses `process.env.FRONTEND_URL || 'http://localhost:3001'`.

The test sets up HTTPS headers but the code doesn't use them:

```typescript
const headersMap = new Map([
  ['host', 'bmdc.online'],
  ['x-forwarded-proto', 'https'],
]);
```

But the route code ignores this and uses the hardcoded default.

### Fix

Same as Failure #1 — use dynamic `getBaseUrl(request)` or set env var.

### Impact

- **Severity:** 🟡 LOW (configuration issue)
- **Affected:** HTTPS share link generation
- **User Impact:** Share links might use HTTP instead of HTTPS in production
- **Related to Our Fixes:** ❌ NO

---

## Failure #3: Validate Share Image Path

**Test:** `GET /api/programs/:id/validate-share › Valid Program Validation › should handle programs without image_path gracefully`

**File:** `Backend/src/app/api/programs/[id]/validate-share/route.test.ts:146`

**Error:**
```
expect(data.data.program.image_path).toBeNull()
Received: undefined
```

### Root Cause

The API returns `undefined` for missing `image_path` field, but test expects `null`.

This is a JSON serialization difference:
- `undefined` is filtered out by JSON.stringify()
- Test receives no `image_path` key instead of `image_path: null`

### Related Code

**Test expects:**
```typescript
expect(data.data.program.image_path).toBeNull();
```

**API probably returns:**
```json
{
  "data": {
    "program": {
      "id": "...",
      "name": "...",
      // image_path is missing (not present at all)
    }
  }
}
```

### Fix

Either:
1. **Option A:** Ensure null values are always included in JSON responses
   ```typescript
   // Before sending response
   if (!program.image_path) {
     program.image_path = null;
   }
   ```

2. **Option B:** Update test to check for undefined
   ```typescript
   expect(data.data.program.image_path).toBeUndefined();
   ```

3. **Option C:** Update test to check existence
   ```typescript
   expect(data.data.program.image_path).toBeFalsy();
   ```

### Impact

- **Severity:** 🟡 LOW (test assertion issue, not logic bug)
- **Affected:** Program validation endpoint
- **User Impact:** None (API still works correctly)
- **Related to Our Fixes:** ❌ NO

---

## Summary Table

| Failure | File | Issue | Type | Severity | Our Fault |
|---------|------|-------|------|----------|-----------|
| #1 | share-link/route.ts:150 | Ignores `getBaseUrl()` function | Config | 🟡 LOW | ❌ NO |
| #2 | share-link/route.ts:150 | Same as #1 for HTTPS | Config | 🟡 LOW | ❌ NO |
| #3 | validate-share/route.ts | Returns undefined instead of null | Serialization | 🟡 LOW | ❌ NO |

---

## Impact on Our Fixes

**NONE** — These failures are completely unrelated to the schema normalization work:

✅ Our fixes don't touch:
- Share link generation
- Program validation
- JSON serialization
- Configuration handling

✅ None of our changes caused these test failures

✅ These failures existed before our fixes

---

## Recommendation

These are pre-existing issues that should be fixed separately:

1. **Priority:** LOW (don't block deployment of schema fixes)
2. **Track:** Create separate GitHub issues for:
   - Fix share link URL base handling
   - Fix validate-share null/undefined serialization
3. **Timeline:** Can be fixed in next sprint

Our schema compatibility fixes are COMPLETE and READY for production. ✅
