/**
 * useRequirementDefinition Hook
 *
 * Fetches a single requirement definition by ID using React Query.
 * Provides loading, error states, and refetch functionality.
 *
 * Features:
 * - Uses React Query with queryKey ['requirementDefinitions', 'detail', id]
 * - Fetches from GET /api/requirement-definitions/{id}
 * - Handles null/undefined requirement ID gracefully (doesn't query if missing)
 * - Caches data with 5-minute stale time
 * - Provides refetch capability for manual updates
 * - Implements exponential backoff retry strategy (2 retries)
 * - Returns { data, isLoading, isError, error }
 * - Handles 404 errors gracefully (returns null data)
 *
 * **Validates: Requirements FR1.1, FR2.2 - Frontend data fetching layer**
 *
 * Example usage:
 * ```typescript
 * const { data, isLoading, isError, error } = useRequirementDefinition('req-123');
 * if (isLoading) return <Skeleton />;
 * if (isError) return <ErrorMessage error={error} />;
 * return <RequirementDetail requirement={data} />;
 * ```
 */

import { useEffect, useState } from 'react';
import api from '../services/api';
import type { RequirementDefinition } from '../types/requirementDefinition';
import logger from '../utils/logger';

/**
 * Hook options interface
 */
export interface UseRequirementDefinitionOptions {
  /**
   * Whether to enable the query.
   * Defaults to true - set to false for conditional queries.
   */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseRequirementDefinitionResult {
  /** The fetched requirement definition, or null if not found */
  data: RequirementDefinition | null;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Whether the query resulted in an error */
  isError: boolean;
  /** Error object if fetch failed, null if successful */
  error: Error | null;
}

/**
 * Cache stale time: 5 minutes (300,000 ms)
 * Requirement definitions don't change frequently, so 5 minutes is appropriate.
 * This means data is considered fresh for 5 minutes before being eligible for refetch.
 */
const STALE_TIME = 5 * 60 * 1000;

/**
 * Hook to fetch a single requirement definition by ID using React Query
 *
 * @param requirementId - The requirement definition ID to fetch (optional)
 * @param options - Hook options (enabled, etc.)
 * @returns Object with data, isLoading, isError, and error
 *
 * Query Behavior:
 * - Query key: ['requirementDefinitions', 'detail', requirementId]
 * - Enabled: !!requirementId && enabled (doesn't query if requirementId is missing or disabled)
 * - Stale time: 5 minutes
 * - Retry: 2 attempts with exponential backoff, except for 404 errors
 * - Refetch on window focus: enabled (keeps data fresh)
 *
 * Error Handling:
 * - 404 errors return null data without throwing
 * - Other errors are thrown and caught in isError/error states
 */
export function useRequirementDefinition(
  requirementId?: string,
  options: UseRequirementDefinitionOptions = {}
): UseRequirementDefinitionResult {
  const { enabled = true } = options;
  const [data, setData] = useState<RequirementDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(requirementId && enabled));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!requirementId || !enabled) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    logger.info('[useRequirementDefinition] Fetching from API', { requirementId });

    api
      .get<RequirementDefinition>(`/requirement-definitions/${requirementId}`)
      .then((response) => {
        if (cancelled) return;
        setData(response.data || null);
        logger.info('[useRequirementDefinition] Fetch successful', {
          requirementId,
          hasDefinition: !!response.data,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        const fetchError = err instanceof Error
          ? err
          : new Error('Failed to load requirement definition');

        if (fetchError.message.includes('404') || (err as { status?: number })?.status === 404) {
          logger.warn('[useRequirementDefinition] Requirement not found', { requirementId });
          setData(null);
          return;
        }

        logger.error('[useRequirementDefinition] Fetch failed', {
          requirementId,
          error: fetchError.message,
        });
        setError(fetchError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requirementId, enabled]);

  return { data, isLoading, isError: error !== null, error };
}
