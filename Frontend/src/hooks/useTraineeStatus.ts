/**
 * useTraineeStatus Hook
 *
 * Fetches a single trainee status record by enrollment ID using React Query.
 * Provides loading, error states, and refetch functionality.
 *
 * Features:
 * - Uses React Query with queryKey ['traineeStatus', enrollmentId]
 * - Fetches from GET /api/trainee-status/enrollment/{enrollmentId}
 * - Handles null/undefined enrollment ID gracefully (doesn't query if missing)
 * - Caches data with 5-minute stale time (profile page use case)
 * - Provides refetch capability for manual updates
 * - Implements exponential backoff retry strategy (2 retries)
 * - Returns { record, isLoading, error, refetch }
 *
 * **Validates: Requirements 1.0**
 *
 * Example usage:
 * ```typescript
 * const { record, isLoading, error, refetch } = useTraineeStatus('enrollment-123');
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorMessage error={error} onRetry={refetch} />;
 * return <TraineeStatusCard record={record} />;
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { TraineeStatusRecord } from '../types/traineeStatus';
import logger from '../utils/logger';
import { queryKeys } from '../services/queryClient';

/**
 * Hook options interface
 */
export interface UseTraineeStatusOptions {
  /**
   * Whether to enable the query.
   * Defaults to true - set to false for conditional queries.
   */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseTraineeStatusResult {
  /** The fetched trainee status record, or null if not found */
  record: TraineeStatusRecord | null;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error object if fetch failed, null if successful */
  error: Error | null;
  /** Function to manually refetch the status record */
  refetch: () => Promise<void>;
}

/**
 * Cache stale time: 5 minutes (300,000 ms) for profile page
 * Profile pages don't refresh frequently, so 5 minutes is appropriate.
 * This means data is considered fresh for 5 minutes before being eligible for refetch.
 */
const STALE_TIME = 5 * 60 * 1000;

/**
 * Hook to fetch a single trainee status record by enrollment ID using React Query
 *
 * @param enrollmentId - The enrollment ID to fetch status for (optional)
 * @param options - Hook options (enabled, etc.)
 * @returns Object with record, isLoading, error, and refetch function
 *
 * Query Behavior:
 * - Query key: ['traineeStatus', enrollmentId]
 * - Enabled: !!enrollmentId && enabled (doesn't query if enrollmentId is missing or disabled)
 * - Stale time: 5 minutes
 * - Retry: 2 attempts with exponential backoff
 * - Refetch on window focus: enabled (keeps data fresh)
 */
export function useTraineeStatus(
  enrollmentId?: string,
  options: UseTraineeStatusOptions = {}
): UseTraineeStatusResult {
  const { enabled = true } = options;

  /**
   * Query function to fetch the status record from the API
   */
  const queryFn = async (): Promise<TraineeStatusRecord | null> => {
    if (!enrollmentId) {
      return null;
    }

    try {
      logger.info('[useTraineeStatus] Fetching from API', { enrollmentId });

      // Fetch from API
      const response = await api.get<TraineeStatusRecord>(
        `/trainee-status/enrollment/${enrollmentId}`
      );

      // Extract the record from response
      // The API returns { success, data: TraineeStatusRecord | null }
      const statusRecord = response.data || null;

      logger.info('[useTraineeStatus] Fetch successful', {
        enrollmentId,
        hasRecord: !!statusRecord,
      });

      return statusRecord;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load trainee status';

      logger.error('[useTraineeStatus] Fetch failed', {
        enrollmentId,
        error: errorMessage,
      });

      throw err;
    }
  };

  /**
   * Use React Query to manage the query state
   * Query key includes enrollmentId so each enrollment gets its own cache entry
   * Using centralized query key factory for consistency
   */
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<TraineeStatusRecord | null, Error>({
    queryKey: queryKeys.traineeStatus.byEnrollment(enrollmentId || ''),
    queryFn,
    // Only query if enrollmentId exists AND query is enabled
    enabled: !!enrollmentId && enabled,
    // Data is fresh for 5 minutes
    staleTime: STALE_TIME,
    // Retry twice with exponential backoff (1000ms, 2000ms)
    retry: 2,
    // Refetch on window focus to keep data fresh
    refetchOnWindowFocus: true,
  });

  /**
   * Wrapper around React Query's refetch to provide consistent interface
   * Cast the promise return to match our interface expectations
   */
  const refetch = async () => {
    await queryRefetch();
  };

  return {
    record: data ?? null,
    isLoading,
    error,
    refetch,
  };
}
