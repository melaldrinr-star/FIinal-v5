/**
 * Feature Flag Service
 * 
 * Provides frontend access to feature flags configured in the admin panel.
 * Features are checked per-tenant and cached locally for performance.
 */

import api from './api';
import { logger } from '../utils/logger';

export const FeatureKeys = {
  INVENTORY_MANAGEMENT: 'inventory_management',
  CERTIFICATE_GENERATION: 'certificate_generation',
  QR_CODE_ATTENDANCE: 'qr_code_attendance',
  MOBILE_APP_ACCESS: 'mobile_app_access',
  WHATSAPP_NOTIFICATIONS: 'whatsapp_notifications',
  EMAIL_NOTIFICATIONS: 'email_notifications',
  SOCIAL_PROGRAM_SHARING: 'social_program_sharing',
} as const;

export type FeatureKey = typeof FeatureKeys[keyof typeof FeatureKeys];

interface FeatureFlag {
  id: string;
  tenant_id: string;
  feature_key: string;
  enabled: boolean;
  configuration?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Local cache for feature flags (5-minute TTL)
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  enabled: boolean;
  expiresAt: number;
}

const featureFlagCache = new Map<string, CacheEntry>();

function getCacheKey(tenantId: string, featureKey: string): string {
  return `${tenantId}:${featureKey}`;
}

function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

function setCacheEntry(tenantId: string, featureKey: string, enabled: boolean): void {
  const key = getCacheKey(tenantId, featureKey);
  featureFlagCache.set(key, {
    enabled,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Check if a feature is enabled for a given tenant.
 * Results are cached locally for 5 minutes to reduce API calls.
 * 
 * @param tenantId - The tenant UUID
 * @param featureKey - The feature key to check
 * @returns true if the feature is enabled, false otherwise
 */
export async function isFeatureEnabled(
  tenantId: string,
  featureKey: string
): Promise<boolean> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(tenantId, featureKey);
    const cached = featureFlagCache.get(cacheKey);

    if (isCacheValid(cached)) {
      return cached!.enabled;
    }

    // Fetch from API
    const response = await api.get<FeatureFlag[]>('/api/admin/feature-flags', {
      params: {
        tenant_id: tenantId,
      },
    });

    // Find the specific flag
    const flag = response.data?.find(f => f.feature_key === featureKey);
    const enabled = flag?.enabled ?? false;

    // Cache the result
    setCacheEntry(tenantId, featureKey, enabled);

    return enabled;
  } catch (error) {
    logger.warn(`Failed to check feature flag ${featureKey} for tenant ${tenantId}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    // On error, assume feature is disabled (fail closed for safety)
    return false;
  }
}

/**
 * Get all feature flags for a tenant.
 * 
 * @param tenantId - The tenant UUID
 * @returns Array of all feature flags
 */
export async function getFeatureFlags(tenantId: string): Promise<FeatureFlag[]> {
  try {
    const response = await api.get<FeatureFlag[]>('/api/admin/feature-flags', {
      params: {
        tenant_id: tenantId,
      },
    });

    return response.data ?? [];
  } catch (error) {
    logger.error('Failed to fetch feature flags', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Clear the local feature flag cache.
 * Useful when feature flags change and you want to re-fetch immediately.
 */
export function clearFeatureFlagCache(): void {
  featureFlagCache.clear();
}

export default {
  isFeatureEnabled,
  getFeatureFlags,
  clearFeatureFlagCache,
  FeatureKeys,
};
