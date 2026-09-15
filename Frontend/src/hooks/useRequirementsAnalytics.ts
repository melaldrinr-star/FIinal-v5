/**
 * useRequirementsAnalytics Hook
 *
 * Fetches requirements analytics data (completion rates, rejection counts by requirement)
 * from GET /api/requirements/analytics endpoint (admin only).
 *
 * Features:
 * - Uses React Query with longer stale time for analytics data (5 minutes)
 * - Handles 403 Forbidden errors for non-admin users gracefully
 * - Returns `isForbidden` flag to distinguish permission errors from other errors
 * - Implements exponential backoff retry strategy (2 retries)
 * - Provides manual refetch capability
 * - Caches analytics data with optimized TTL
 *
 * **Validates: Frontend data fetching layer**
 *
 * Example usage:
 * ```typescript
 * const { data, isLoading, isError, error, isForbidden } = useRequirementsAnalytics();
 *
 * if (isForbidden) {
 *   return <AccessDeniedMessage />;
 * }
 *
 * if (isLoading) {
 *   return <AnalyticsSkeleton />;
 * }
 *
 * if (isError) {
 *   return <ErrorMessage error={error} />;
 * }
 *
 * return (
 *   <div>
 *     <AnalyticsDashboard analytics={data} />
 *   </div>
 * );
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { RequirementsAnalytics } from '../types/requirements';
import logger from '../utils/logger';
import { queryKeys } from '../services/queryClient';

/**
 * Hook options interface
 */
export interface UseRequirementsAnalyticsOptions {
  /**
   * Whether to enable the query.
   * Defaults to true - set to false for conditional queries.
   */
  enabled?: boolean;

  /**
   * Refetch interval in milliseconds.
   * Defaults to undefined (no automatic refetch).
   * Set to a value (e.g., 5 * 60 * 1000) to refetch periodically.
   */
  refetchInterval?: number;
}

/**
 * Hook return type
 */
export interface UseRequirementsAnalyticsResult {
  /** Analytics data with completion rates and rejection counts */
  data: RequirementsAnalytics | null;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Whether a fetch error occurred (includes 403 Forbidden) */
  isError: boolean;
  /** Error object if fetch failed, null if successful */
  error: Error | null;
  /** Whether the error is a 403 Forbidden (non-admin access) */
  isForbidden: boolean;
  /** Function to manually refetch analytics data */
  refetch: () => Promise<void>;
}

/**
 * Cache stale time for analytics: 5 minutes (300,000 ms)
 * Analytics data is less frequently updated and can be cached longer than operational data.
 * This reduces API load while keeping data relatively current.
 */
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Determine if an error is a 403 Forbidden error
 *
 * @param error - Error object (typically from axios or React Query)
 * @returns true if the error is a 403 Forbidden
 */
function isForbiddenError(error: any): boolean {
  // Check for axios error structure
  if (error?.response?.status === 403) {
    return true;
  }

  // Check for other common error structures
  if (error?.status === 403) {
    return true;
  }

  return false;
}

/**
 * Hook to fetch requirements analytics data (admin only)
 *
 * Analytics endpoint returns:
 * - Completion rates by requirement type
 * - Rejection counts and rates by requirement
 * - Average time-to-completion
 * - Summary statistics across all requirements
 *
 * Non-admin users receive 403 Forbidden error, which is handled gracefully
 * via the `isForbidden` flag rather than throwing.
 *
 * @param options - Hook options (enabled, refetchInterval)
 * @returns Object with analytics data, loading/error states, and refetch function
 *
 * Query Behavior:
 * - Query key: queryKeys.requirementsAnalytics.all
 * - Enabled: enabled parameter (defaults to true)
 * - Stale time: 5 minutes (analytics data)
 * - Retry: 2 attempts with exponential backoff (but not on 403 Forbidden)
 * - Refetch on window focus: enabled
 */
export function useRequirementsAnalytics(
  options: UseRequirementsAnalyticsOptions = {}
): UseRequirementsAnalyticsResult {
  const { enabled = true, refetchInterval } = options;

  /**
   * Query function to fetch analytics from the API
   */
  const queryFn = async (): Promise<RequirementsAnalytics> => {
    try {
      logger.info('[useRequirementsAnalytics] Fetching analytics from API');

      const response = await api.get<RequirementsAnalytics>('/requirements/analytics');

      // Extract analytics data
      const analyticsData = response.data;

      logger.info('[useRequirementsAnalytics] Fetch successful', {
        requirementsCount: analyticsData.by_requirement?.length || 0,
        avgCompletionRate: analyticsData.summary?.avg_completion_rate,
      });

      return analyticsData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load requirements analytics';

      logger.error('[useRequirementsAnalytics] Fetch failed', {
        error: errorMessage,
        status: (err as any)?.response?.status,
      });

      throw err;
    }
  };

  /**
   * Use React Query to manage the query state
   */
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<RequirementsAnalytics, Error>({
    queryKey: ['requirementsAnalytics'],
    queryFn,
    enabled,
    staleTime: STALE_TIME,
    // Don't retry on 403 Forbidden (non-admin users)
    retry: (failureCount, error) => {
      if (isForbiddenError(error)) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchInterval,
  });

  /**
   * Wrapper around React Query's refetch for consistent interface
   */
  const refetch = async () => {
    await queryRefetch();
  };

  return {
    data: data ?? null,
    isLoading,
    isError: !!error,
    error: error ?? null,
    isForbidden: isForbiddenError(error),
    refetch,
  };
}
