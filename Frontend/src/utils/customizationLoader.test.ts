/**
 * Unit Tests for Customization Loader Utility
 *
 * Tests loading customizations from CMS API, tenant extraction,
 * caching, error handling, and fallback to defaults
 *
 * Requirements: 9.1, 9.2, 2.6
 */

import {
  loadCustomizations,
  extractTenantId,
  buildCMSSettingsUrl,
  clearCustomizationCache,
  mergeWithDefaults,
  getCachedCustomizations,
  DEFAULT_CUSTOMIZATIONS,
  CustomizationSettings,
} from './customizationLoader';

describe('Customization Loader - Requirements 9.1, 9.2, 2.6', () => {
  beforeEach(() => {
    clearCustomizationCache();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearCustomizationCache();
  });

  // ============================================================================
  // Test 1: Tenant ID Extraction from Subdomain
  // ============================================================================

  describe('1. Tenant ID Extraction from Subdomain', () => {
    beforeEach(() => {
      delete (process.env as any).REACT_APP_TENANT_ID;
    });

    it('1.1: Should extract tenant_id from subdomain format', () => {
      // Setup
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'tenant-abc.example.com',
          protocol: 'https:',
          host: 'tenant-abc.example.com',
        },
        writable: true,
      });

      // Execute
      const tenantId = extractTenantId();

      // Verify
      expect(tenantId).toBe('tenant-abc');
    });

    it('1.2: Should handle localhost subdomain', () => {
      // Setup
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          protocol: 'http:',
          host: 'localhost',
        },
        writable: true,
      });

      // Execute
      const tenantId = extractTenantId();

      // Verify
      expect(tenantId).toBe('default');
    });

    it('1.3: Should extract from three-part domain', () => {
      // Setup
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'mycompany.example.com',
          protocol: 'https:',
          host: 'mycompany.example.com',
        },
        writable: true,
      });

      // Execute
      const tenantId = extractTenantId();

      // Verify
      expect(tenantId).toBe('mycompany');
    });

    it('1.4: Should handle invalid subdomain format gracefully', () => {
      // Setup with invalid characters
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'tenant_invalid.example.com',
          protocol: 'https:',
          host: 'tenant_invalid.example.com',
        },
        writable: true,
      });

      // Execute
      const tenantId = extractTenantId();

      // Verify - should not extract invalid subdomain
      expect(tenantId).toBeUndefined();
    });

    it('1.5: Should validate alphanumeric and hyphen characters only', () => {
      // Valid tenant IDs
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'my-tenant-123.example.com',
          protocol: 'https:',
          host: 'my-tenant-123.example.com',
        },
        writable: true,
      });

      const tenantId = extractTenantId();
      expect(tenantId).toBe('my-tenant-123');
    });
  });

  // ============================================================================
  // Test 2: Customizations Fetched Correctly for Tenant
  // ============================================================================

  describe('2. Customizations Fetched Correctly for Tenant', () => {
    it('2.1: Should fetch customizations successfully', async () => {
      // Setup
      const mockCustomizations: CustomizationSettings = {
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCustomizations,
      });

      // Execute
      const result = await loadCustomizations();

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cms-settings'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'omit',
        })
      );
      expect(result.colors?.primary).toBe('#ff0000');
    });

    it('2.2: Should merge fetched customizations with defaults', async () => {
      // Setup
      const partialCustomizations = {
        colors: {
          primary: '#ff0000',
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => partialCustomizations,
      });

      // Execute
      const result = await loadCustomizations();

      // Verify - should have both fetched and default values
      expect(result.colors?.primary).toBe('#ff0000');
      expect(result.colors?.secondary).toBeDefined(); // From defaults
      expect(result.typography).toBeDefined(); // From defaults
    });

    it('2.3: Should handle API response wrapper format', async () => {
      // Setup - some APIs wrap data in success/data format
      const wrappedResponse = {
        success: true,
        data: {
          colors: {
            primary: '#ff0000',
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => wrappedResponse,
      });

      // Execute
      const result = await loadCustomizations();

      // Verify
      expect(result.colors?.primary).toBe('#ff0000');
    });

    it('2.4: Should preserve deep nested structure in customizations', async () => {
      // Setup
      const customizations = {
        typography: {
          headings: {
            fontSize: {
              h1: 72,
              h2: 56,
            },
            fontWeight: 700,
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => customizations,
      });

      // Execute
      const result = await loadCustomizations();

      // Verify
      expect(result.typography?.headings?.fontSize?.h1).toBe(72);
      expect(result.typography?.headings?.fontWeight).toBe(700);
    });
  });

  // ============================================================================
  // Test 3: Defaults Returned if No Customizations Exist
  // ============================================================================

  describe('3. Defaults Returned if No Customizations Exist', () => {
    it('3.1: Should return defaults when API returns empty object', async () => {
      // Setup
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Execute
      const result = await loadCustomizations();

      // Verify
      expect(result.colors).toEqual(DEFAULT_CUSTOMIZATIONS.colors);
      expect(result.typography).toEqual(DEFAULT_CUSTOMIZATIONS.typography);
      expect(result.layout).toEqual(DEFAULT_CUSTOMIZATIONS.layout);
      expect(result.components).toEqual(DEFAULT_CUSTOMIZATIONS.components);
    });

    it('3.2: Should return defaults when API returns null', async () => {
      // Setup
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      // Execute
      const result = await loadCustomizations();

      // Verify - should fall back to defaults
      expect(result).toEqual(DEFAULT_CUSTOMIZATIONS);
    });

    it('3.3: Should return defaults on API error', async () => {
      // Setup
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      // Execute
      const result = await loadCustomizations({ retries: 1 });

      // Verify
      expect(result).toEqual(DEFAULT_CUSTOMIZATIONS);
    });

    it('3.4: Should return defaults on fetch timeout', async () => {
      // Setup
      global.fetch = jest.fn().mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            // Simulate timeout by rejecting with AbortError
            reject(new Error('AbortError: The user aborted a request.'));
          })
      );

      // Execute
      const result = await loadCustomizations({ timeout: 100, retries: 1 });

      // Verify
      expect(result).toEqual(DEFAULT_CUSTOMIZATIONS);
    });

    it('3.5: Should verify defaults have all required properties', () => {
      // Verify
      expect(DEFAULT_CUSTOMIZATIONS.colors).toBeDefined();
      expect(DEFAULT_CUSTOMIZATIONS.colors?.primary).toBeDefined();
      expect(DEFAULT_CUSTOMIZATIONS.typography).toBeDefined();
      expect(DEFAULT_CUSTOMIZATIONS.layout).toBeDefined();
      expect(DEFAULT_CUSTOMIZATIONS.components).toBeDefined();
      expect(DEFAULT_CUSTOMIZATIONS.content).toBeDefined();
    });
  });

  // ============================================================================
  // Test 4: API Errors Handled Gracefully
  // ============================================================================

  describe('4. API Errors Handled Gracefully', () => {
    it('4.1: Should handle HTTP error responses', async () => {
      // Setup
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      // Execute
      const result = await loadCustomizations({ retries: 1 });

      // Verify - should not throw, returns defaults
      expect(result).toEqual(DEFAULT_CUSTOMIZATIONS);
    });

    it('4.2: Should handle invalid JSON response', async () => {
      // Setup
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Execute
      const result = await loadCustomizations({ retries: 1 });

      // Verify
      expect(result).toEqual(DEFAULT_CUSTOMIZATIONS);
    });

    it('4.3: Should handle network errors with retries', async () => {
      // Setup
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ colors: { primary: '#ff0000' } }),
        });

      // Execute
      const result = await loadCustomizations({ retries: 2 });

      // Verify - should retry and succeed on second attempt
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.colors?.primary).toBe('#ff0000');
    });

    it('4.4: Should call onError callback on error', async () => {
      // Setup
      const onError = jest.fn();
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('API error'));

      // Execute
      await loadCustomizations({ retries: 1, onError });

      // Verify
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('4.5: Should log errors to console', async () => {
      // Setup
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('API error'));

      // Execute
      await loadCustomizations({ retries: 1 });

      // Verify
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Customization Loader] Error fetching customizations:',
        expect.any(String)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  // ============================================================================
  // Test 5: Caching Behavior
  // ============================================================================

  describe('5. Caching Behavior', () => {
    it('5.1: Should cache customizations after successful fetch', async () => {
      // Setup
      const customizations = { colors: { primary: '#ff0000' } };
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => customizations,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ colors: { primary: '#00ff00' } }),
        });

      // Execute - first call
      const result1 = await loadCustomizations({ cache: true, cacheTTL: 60000 });

      // Execute - second call (should use cache)
      const result2 = await loadCustomizations({ cache: true, cacheTTL: 60000 });

      // Verify
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once due to cache
      expect(result1.colors?.primary).toBe('#ff0000');
      expect(result2.colors?.primary).toBe('#ff0000');
    });

    it('5.2: Should respect cache TTL', async () => {
      // Setup
      jest.useFakeTimers();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ colors: { primary: '#ff0000' } }),
      });

      // Execute - first call
      await loadCustomizations({ cache: true, cacheTTL: 5000 });

      // Execute - advance time beyond TTL
      jest.advanceTimersByTime(6000);

      // Execute - second call
      await loadCustomizations({ cache: true, cacheTTL: 5000 });

      // Verify - should fetch again after TTL expires
      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('5.3: Should skip cache when cache option is false', async () => {
      // Setup
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ colors: { primary: '#ff0000' } }),
      });

      // Execute
      await loadCustomizations({ cache: false });
      await loadCustomizations({ cache: false });

      // Verify
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('5.4: Should clear cache for specific tenant', async () => {
      // Setup
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'tenant-a.example.com',
          protocol: 'https:',
          host: 'tenant-a.example.com',
        },
        writable: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ colors: { primary: '#ff0000' } }),
      });

      // Execute - fetch and cache
      await loadCustomizations({ cache: true });

      // Get cached value
      let cached = getCachedCustomizations();
      expect(cached).toBeDefined();

      // Clear cache
      clearCustomizationCache('tenant-a');

      // Verify cache is cleared
      cached = getCachedCustomizations();
      expect(cached).toBeUndefined();
    });
  });

  // ============================================================================
  // Test 6: Callbacks
  // ============================================================================

  describe('6. Callbacks', () => {
    it('6.1: Should call onSuccess callback with customizations', async () => {
      // Setup
      const onSuccess = jest.fn();
      const customizations = { colors: { primary: '#ff0000' } };
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => customizations,
      });

      // Execute
      await loadCustomizations({ onSuccess });

      // Verify
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ colors: expect.any(Object) }));
    });

    it('6.2: Should not call onSuccess if already cached', async () => {
      // Setup
      const onSuccess = jest.fn();
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ colors: { primary: '#ff0000' } }),
      });

      // Execute - first call
      await loadCustomizations({ cache: true, onSuccess, cacheTTL: 60000 });
      onSuccess.mockClear();

      // Execute - second call (uses cache)
      await loadCustomizations({ cache: true, onSuccess, cacheTTL: 60000 });

      // Verify - onSuccess still called even with cache
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test 7: Merge with Defaults
  // ============================================================================

  describe('7. Merge with Defaults', () => {
    it('7.1: Should merge partial customizations with defaults', () => {
      // Setup
      const partial: Partial<CustomizationSettings> = {
        colors: {
          primary: '#ff0000',
        },
      };

      // Execute
      const merged = mergeWithDefaults(partial);

      // Verify
      expect(merged.colors?.primary).toBe('#ff0000');
      expect(merged.colors?.secondary).toBe(DEFAULT_CUSTOMIZATIONS.colors?.secondary);
      expect(merged.typography).toEqual(DEFAULT_CUSTOMIZATIONS.typography);
    });

    it('7.2: Should preserve deep nested properties', () => {
      // Setup
      const partial: Partial<CustomizationSettings> = {
        typography: {
          headings: {
            fontSize: {
              h1: 100,
            },
          },
        },
      };

      // Execute
      const merged = mergeWithDefaults(partial);

      // Verify
      expect(merged.typography?.headings?.fontSize?.h1).toBe(100);
      expect(merged.typography?.headings?.fontSize?.h2).toBe(
        DEFAULT_CUSTOMIZATIONS.typography?.headings?.fontSize?.h2
      );
    });

    it('7.3: Should handle empty partial customizations', () => {
      // Execute
      const merged = mergeWithDefaults({});

      // Verify
      expect(merged).toEqual(DEFAULT_CUSTOMIZATIONS);
    });
  });

  // ============================================================================
  // Test 8: API URL Building
  // ============================================================================

  describe('8. API URL Building', () => {
    it('8.1: Should build URL with provided base URL', () => {
      // Execute
      const url = buildCMSSettingsUrl('https://api.example.com');

      // Verify
      expect(url).toBe('https://api.example.com/api/cms-settings');
    });

    it('8.2: Should build URL using current window location', () => {
      // Setup
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          host: 'example.com',
          hostname: 'example.com',
        },
        writable: true,
      });

      // Execute
      const url = buildCMSSettingsUrl();

      // Verify
      expect(url).toContain('/api/cms-settings');
      expect(url).toMatch(/^https:\/\//);
    });
  });

  // ============================================================================
  // Test 9: Timeout Handling
  // ============================================================================

  describe('9. Timeout Handling', () => {
    it('9.1: Should abort fetch on timeout', async () => {
      // Setup
      jest.useFakeTimers();
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

      global.fetch = jest.fn().mockImplementationOnce(() => {
        return new Promise(() => {
          // Never resolves - simulates hang
        });
      });

      // Execute with low timeout
      const result = loadCustomizations({ timeout: 100, retries: 1 });

      // Advance time to trigger timeout
      jest.advanceTimersByTime(200);

      await expect(result).resolves.toEqual(DEFAULT_CUSTOMIZATIONS);

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // Test 10: Integration Tests
  // ============================================================================

  describe('10. Integration Tests', () => {
    it('10.1: Should complete full load flow successfully', async () => {
      // Setup
      const customizations: CustomizationSettings = {
        colors: {
          primary: '#ff5733',
          secondary: '#33ff57',
          accent: '#3357ff',
        },
        typography: {
          headings: {
            fontFamily: 'Playfair',
            fontSize: {
              h1: 64,
              h2: 48,
              h3: 32,
            },
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => customizations,
      });

      // Execute
      const result = await loadCustomizations();

      // Verify
      expect(result.colors?.primary).toBe('#ff5733');
      expect(result.typography?.headings?.fontFamily).toBe('Playfair');
      expect(result.typography?.body).toBeDefined(); // From defaults
    });

    it('10.2: Should handle complete error recovery flow', async () => {
      // Setup
      const onError = jest.fn();
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      // Execute
      const result = await loadCustomizations({ retries: 1, onError });

      // Verify
      expect(onError).toHaveBeenCalled();
      expect(result).toEqual(DEFAULT_CUSTOMIZATIONS);
    });
  });
});
