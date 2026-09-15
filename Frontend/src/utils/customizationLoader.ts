/**
 * Customization Loader Utility
 *
 * Fetches landing page customizations from the CMS Settings API
 * Extracts tenant_id from subdomain or custom domain mapping
 * Handles tenant context without authentication
 *
 * Requirements: 9.1, 9.2, 2.6
 * Phase: 4 - Landing Page Integration
 */

export interface CustomizationSettings {
  id?: string;
  tenant_id?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    borders?: string;
  };
  typography?: {
    headings?: {
      fontFamily?: string;
      fontSize?: {
        h1?: number;
        h2?: number;
        h3?: number;
      };
      fontWeight?: number;
      lineHeight?: number;
    };
    body?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: number;
      lineHeight?: number;
    };
  };
  layout?: {
    containerWidth?: string;
    containerLayout?: string;
    padding?: {
      heroSection?: number;
      contentAreas?: number;
      footer?: number;
    };
    margins?: {
      sectionSpacing?: number;
      elementSpacing?: number;
    };
    gaps?: {
      grid?: number;
      flex?: number;
    };
  };
  components?: {
    [key: string]: {
      enabled?: boolean;
      [key: string]: any;
    };
  };
  content?: {
    hero?: {
      heading?: string;
      subheading?: string;
      ctaText?: string;
      ctaUrl?: string;
    };
    features?: Array<{
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
    }>;
    testimonials?: Array<{
      text?: string;
      author?: string;
      authorImage?: string;
      authorTitle?: string;
    }>;
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
      socialLinks?: {
        [key: string]: string;
      };
    };
  };
  [key: string]: any;
}

export interface CustomizationLoaderOptions {
  apiBaseUrl?: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  onError?: (error: Error) => void;
  onSuccess?: (customizations: CustomizationSettings) => void;
}

export const DEFAULT_CUSTOMIZATIONS: CustomizationSettings = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#28a745',
    background: '#ffffff',
    text: '#212529',
    borders: '#dee2e6',
  },
  typography: {
    headings: {
      fontFamily: 'Inter',
      fontSize: {
        h1: 48,
        h2: 36,
        h3: 24,
      },
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  layout: {
    containerWidth: '1200px',
    containerLayout: 'centered',
    padding: {
      heroSection: 60,
      contentAreas: 40,
      footer: 40,
    },
    margins: {
      sectionSpacing: 80,
      elementSpacing: 20,
    },
    gaps: {
      grid: 20,
      flex: 10,
    },
  },
  components: {
    navigation: { enabled: true },
    hero: { enabled: true },
    features: { enabled: true },
    testimonials: { enabled: true },
    ctaSection: { enabled: true },
    contact: { enabled: true },
    footer: { enabled: true },
  },
  content: {
    hero: {
      heading: 'Welcome to Our Platform',
      subheading: 'Build amazing things with us',
      ctaText: 'Get Started',
      ctaUrl: '/signup',
    },
    features: [],
    testimonials: [],
    contact: {
      email: 'contact@example.com',
      phone: '',
      address: '',
      socialLinks: {},
    },
  },
};

// In-memory cache for customizations
const customizationCache = new Map<string, { data: CustomizationSettings; timestamp: number }>();

/**
 * Extract tenant ID from current domain/subdomain
 * Supports:
 * - Subdomain format: tenant-name.example.com -> tenant-name
 * - Environment variable override for custom domain mapping
 *
 * @returns Tenant ID or undefined if not extractable
 */
export function extractTenantId(): string | undefined {
  // First, try to get from environment variable (custom domain mapping)
  const envTenantId = process.env.REACT_APP_TENANT_ID || import.meta.env.VITE_TENANT_ID;
  if (envTenantId) {
    return envTenantId;
  }

  // Extract from subdomain
  if (typeof window === 'undefined') {
    // Server-side rendering - cannot extract from window.location
    return undefined;
  }

  const hostname = window.location.hostname;

  // Handle localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'default';
  }

  // Extract subdomain (first part before first dot)
  const parts = hostname.split('.');

  // For "tenant.example.com", extract "tenant"
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Validate subdomain format (alphanumeric and hyphens)
    if (/^[a-z0-9-]+$/.test(subdomain)) {
      return subdomain;
    }
  }

  return undefined;
}

/**
 * Build API URL for fetching customizations
 * Defaults to the same host as the application
 *
 * @param apiBaseUrl - Optional base URL override
 * @returns Full API URL for cms-settings endpoint
 */
export function buildCMSSettingsUrl(apiBaseUrl?: string): string {
  if (apiBaseUrl) {
    return `${apiBaseUrl}/api/cms-settings`;
  }

  if (typeof window === 'undefined') {
    // Server-side rendering
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/cms-settings`;
  }

  // Use the same origin as the current application
  const protocol = window.location.protocol;
  const host = window.location.host;

  return `${protocol}//${host}/api/cms-settings`;
}

/**
 * Fetch customizations from the CMS API
 * Uses tenant context extracted from subdomain/domain
 *
 * @param options - Loader options
 * @returns Promise resolving to customization settings
 *
 * Requirements: 9.1, 9.2, 2.6
 */
export async function loadCustomizations(
  options: CustomizationLoaderOptions = {}
): Promise<CustomizationSettings> {
  const {
    apiBaseUrl,
    timeout = 5000,
    retries = 3,
    cache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    onError,
    onSuccess,
  } = options;

  try {
    // Extract tenant ID from domain/subdomain
    const tenantId = extractTenantId();

    // Build cache key
    const cacheKey = `customizations_${tenantId || 'default'}`;

    // Check cache first
    if (cache) {
      const cached = customizationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        if (onSuccess) onSuccess(cached.data);
        return cached.data;
      }
    }

    // Build API URL
    const apiUrl = buildCMSSettingsUrl(apiBaseUrl);

    // Fetch with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          // Don't include credentials since this is a public endpoint
          credentials: 'omit',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch customizations: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid customization response format');
        }

        // Handle API success response wrapper (if applicable)
        const customizations = data.success ? data.data : data;

        // Merge with defaults to fill in missing properties
        const mergedCustomizations = mergeWithDefaults(customizations);

        // Store in cache
        if (cache) {
          customizationCache.set(cacheKey, {
            data: mergedCustomizations,
            timestamp: Date.now(),
          });
        }

        if (onSuccess) onSuccess(mergedCustomizations);
        return mergedCustomizations;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors, not on validation errors
        if (attempt < retries - 1 && lastError.message.includes('Failed to fetch')) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Failed to load customizations after retries');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.warn('[Customization Loader] Error fetching customizations:', err.message);

    if (onError) onError(err);

    // Return defaults on error
    return DEFAULT_CUSTOMIZATIONS;
  }
}

/**
 * Merge fetched customizations with defaults
 * Ensures all required properties exist
 *
 * @param customizations - Fetched customization settings
 * @returns Merged customizations with defaults
 */
export function mergeWithDefaults(
  customizations: Partial<CustomizationSettings>
): CustomizationSettings {
  return {
    ...DEFAULT_CUSTOMIZATIONS,
    ...customizations,
    colors: {
      ...DEFAULT_CUSTOMIZATIONS.colors,
      ...(customizations.colors || {}),
    },
    typography: {
      ...DEFAULT_CUSTOMIZATIONS.typography,
      headings: {
        ...DEFAULT_CUSTOMIZATIONS.typography?.headings,
        ...(customizations.typography?.headings || {}),
      },
      body: {
        ...DEFAULT_CUSTOMIZATIONS.typography?.body,
        ...(customizations.typography?.body || {}),
      },
    },
    layout: {
      ...DEFAULT_CUSTOMIZATIONS.layout,
      ...(customizations.layout || {}),
      padding: {
        ...DEFAULT_CUSTOMIZATIONS.layout?.padding,
        ...(customizations.layout?.padding || {}),
      },
      margins: {
        ...DEFAULT_CUSTOMIZATIONS.layout?.margins,
        ...(customizations.layout?.margins || {}),
      },
      gaps: {
        ...DEFAULT_CUSTOMIZATIONS.layout?.gaps,
        ...(customizations.layout?.gaps || {}),
      },
    },
    components: {
      ...DEFAULT_CUSTOMIZATIONS.components,
      ...(customizations.components || {}),
    },
    content: {
      ...DEFAULT_CUSTOMIZATIONS.content,
      ...(customizations.content || {}),
      contact: {
        ...DEFAULT_CUSTOMIZATIONS.content?.contact,
        ...(customizations.content?.contact || {}),
      },
    },
  };
}

/**
 * Clear customization cache
 * Useful for testing or forcing a refresh
 *
 * @param tenantId - Optional tenant ID to clear specific cache, or undefined to clear all
 */
export function clearCustomizationCache(tenantId?: string): void {
  if (tenantId) {
    customizationCache.delete(`customizations_${tenantId}`);
  } else {
    customizationCache.clear();
  }
}

/**
 * Preload customizations (typically called on app startup)
 * Fetches and caches customizations for faster access
 *
 * @param options - Loader options
 * @returns Promise that resolves after preload completes
 */
export async function preloadCustomizations(
  options: CustomizationLoaderOptions = {}
): Promise<void> {
  try {
    await loadCustomizations(options);
  } catch (error) {
    console.warn('[Customization Loader] Preload warning:', error);
    // Preload failure is not critical - defaults will be used
  }
}

/**
 * Get customizations from cache
 * Returns cached customizations if available, undefined otherwise
 *
 * @param tenantId - Optional tenant ID to look up
 * @returns Cached customizations or undefined
 */
export function getCachedCustomizations(tenantId?: string): CustomizationSettings | undefined {
  const cacheKey = `customizations_${tenantId || extractTenantId() || 'default'}`;
  const cached = customizationCache.get(cacheKey);
  return cached?.data;
}
