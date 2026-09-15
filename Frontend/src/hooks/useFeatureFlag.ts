/**
 * useFeatureFlag - React Hook for Feature Flag Checking
 * 
 * Usage:
 * ```tsx
 * const { isEnabled, isLoading, error } = useFeatureFlag(
 *   tenantId,
 *   FeatureKeys.SOCIAL_PROGRAM_SHARING
 * );
 * 
 * if (isEnabled) {
 *   // Render feature
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import featureFlagService, { FeatureKey } from '../services/featureFlagService';
import { logger } from '../utils/logger';

interface UseFeatureFlagResult {
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useFeatureFlag(
  tenantId: string | undefined,
  featureKey: FeatureKey
): UseFeatureFlagResult {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(!tenantId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setIsLoading(false);
      setIsEnabled(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const enabled = await featureFlagService.isFeatureEnabled(tenantId, featureKey);

        if (mounted) {
          setIsEnabled(enabled);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (mounted) {
          setError(error);
          logger.error('Failed to check feature flag', {
            tenantId,
            featureKey,
            error: error.message,
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tenantId, featureKey]);

  return { isEnabled, isLoading, error };
}
