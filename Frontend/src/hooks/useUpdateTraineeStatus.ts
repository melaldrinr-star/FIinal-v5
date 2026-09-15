/**
 * useUpdateTraineeStatus Hook
 *
 * Provides mutations for updating and deleting trainee status records using React Query.
 * Handles both PATCH (update) and DELETE (soft delete) operations with automatic query invalidation.
 *
 * Features:
 * - Uses React Query useMutation for PATCH /api/trainee-status/{recordId}
 * - Uses React Query useMutation for DELETE /api/trainee-status/{recordId}
 * - Automatically invalidates related query caches on success
 * - Implements retry: 0 policy (don't retry write operations)
 * - Provides user-friendly error handling with logging
 * - Returns { updateStatus, deleteStatus, isLoading, error }
 *
 * **Validates: Requirements 10.0, 14.0**
 *
 * Example usage - Update:
 * ```typescript
 * const { updateStatus, isLoading, error } = useUpdateTraineeStatus();
 * const handleSave = async (recordId: string, data: Partial<TraineeStatusRecord>) => {
 *   try {
 *     const updated = await updateStatus(recordId, data);
 *     toast.success('Status updated successfully');
 *   } catch (err) {
 *     toast.error(err.message);
 *   }
 * };
 * ```
 *
 * Example usage - Delete:
 * ```typescript
 * const { deleteStatus, isLoading, error } = useUpdateTraineeStatus();
 * const handleDelete = async (recordId: string) => {
 *   try {
 *     await deleteStatus(recordId);
 *     toast.success('Status record deleted successfully');
 *   } catch (err) {
 *     toast.error(err.message);
 *   }
 * };
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { TraineeStatusRecord } from '../types/traineeStatus';
import logger from '../utils/logger';
import { invalidationStrategies } from '../services/queryClient';

/**
 * Success response from delete mutation
 */
export interface DeleteStatusResponse {
  success: true;
  message: string;
}

/**
 * Hook return type
 */
export interface UseUpdateTraineeStatusResult {
  /**
   * Mutation function to update a status record.
   * @param recordId - The ID of the record to update
   * @param data - Partial data to update (only provided fields will be updated)
   * @returns Promise with the updated record
   */
  updateStatus: (recordId: string, data: Partial<TraineeStatusRecord>) => Promise<TraineeStatusRecord>;

  /**
   * Mutation function to delete a status record (soft delete).
   * @param recordId - The ID of the record to delete
   * @returns Promise with success message
   */
  deleteStatus: (recordId: string) => Promise<DeleteStatusResponse>;

  /**
   * True if either mutation is currently in progress (loading state)
   */
  isLoading: boolean;

  /**
   * Error object if either mutation fails, null if successful or not yet executed
   */
  error: Error | null;
}

/**
 * Hook to manage trainee status record mutations (update and delete)
 *
 * Combines two mutations for:
 * 1. PATCH /api/trainee-status/{recordId} - update existing record
 * 2. DELETE /api/trainee-status/{recordId} - soft delete record
 *
 * Both mutations invalidate related query caches on success to keep data in sync.
 *
 * Query invalidation strategy:
 * - Invalidates ['traineeStatus'] and ['traineeStatuses'] query keys
 * - React Query automatically refetches affected queries based on their staleTime
 * - For single record queries: uses staleTime of 5 minutes
 * - For table queries: uses staleTime of 1 minute
 *
 * @returns Object with updateStatus, deleteStatus, isLoading, and error
 */
export function useUpdateTraineeStatus(): UseUpdateTraineeStatusResult {
  const queryClient = useQueryClient();

  /**
   * Update mutation for PATCH /api/trainee-status/{recordId}
   *
   * Lifecycle:
   * 1. Validates input parameters
   * 2. Sends PATCH request with partial update data
   * 3. On success: invalidates caches and returns updated record
   * 4. On error: logs error with context and throws for caller to handle
   */
  const updateMutation = useMutation({
    mutationFn: async ({
      recordId,
      data,
    }: {
      recordId: string;
      data: Partial<TraineeStatusRecord>;
    }): Promise<TraineeStatusRecord> => {
      if (!recordId || !data) {
        throw new Error('Record ID and data are required for update');
      }

      try {
        logger.info('[useUpdateTraineeStatus] Updating status record', {
          recordId,
          fieldCount: Object.keys(data).length,
        });

        // Send PATCH request to update the record
        const response = await api.patch<TraineeStatusRecord>(
          `/trainee-status/${recordId}`,
          data
        );

        // Extract the updated record from response
        // The API returns { success, data: TraineeStatusRecord }
        const updatedRecord = response.data;

        logger.info('[useUpdateTraineeStatus] Update successful', {
          recordId,
          updatedAt: updatedRecord.updatedAt,
        });

        return updatedRecord;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update status record';

        logger.error('[useUpdateTraineeStatus] Update failed', {
          recordId,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }
    },

    /**
     * On success: invalidate related query caches using optimized strategy
     * This triggers React Query to mark cached data as stale and refetch if needed
     * Using selective invalidation instead of invalidating entire families
     */
    onSuccess: () => {
      logger.info('[useUpdateTraineeStatus] Invalidating query caches');
      invalidationStrategies.invalidateAllTraineeStatuses(queryClient);
    },

    /**
     * Mutation options:
     * - retry: 0 -> Don't retry failed write operations
     *   Write operations should fail immediately so user can correct/retry manually
     */
    retry: 0,
  });

  /**
   * Delete mutation for DELETE /api/trainee-status/{recordId}
   *
   * Lifecycle:
   * 1. Validates input parameter (recordId)
   * 2. Sends DELETE request for soft delete
   * 3. On success: invalidates caches and returns success response
   * 4. On error: logs error with context and throws for caller to handle
   */
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string): Promise<DeleteStatusResponse> => {
      if (!recordId) {
        throw new Error('Record ID is required for deletion');
      }

      try {
        logger.info('[useUpdateTraineeStatus] Deleting status record', {
          recordId,
        });

        // Send DELETE request to soft-delete the record
        // API sets deleted_at timestamp but doesn't remove the record
        const response = await api.delete<DeleteStatusResponse>(
          `/trainee-status/${recordId}`
        );

        // Extract response
        // The API returns { success: true, message: string }
        const result = response.data || { success: true, message: 'Status record deleted successfully' };

        logger.info('[useUpdateTraineeStatus] Delete successful', {
          recordId,
          message: result.message,
        });

        return result as DeleteStatusResponse;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to delete status record';

        logger.error('[useUpdateTraineeStatus] Delete failed', {
          recordId,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }
    },

    /**
     * On success: invalidate related query caches after delete
     * This triggers React Query to mark cached data as stale and refetch
     * Using optimized invalidation strategy
     */
    onSuccess: () => {
      logger.info('[useUpdateTraineeStatus] Invalidating query caches after delete');
      invalidationStrategies.invalidateAllTraineeStatuses(queryClient);
    },

    /**
     * Mutation options:
     * - retry: 0 -> Don't retry failed write operations
     *   Write operations should fail immediately so user can correct/retry manually
     */
    retry: 0,
  });

  return {
    /**
     * Update a trainee status record
     * Throws error if validation fails or API call fails
     */
    updateStatus: (recordId: string, data: Partial<TraineeStatusRecord>) =>
      updateMutation.mutateAsync({ recordId, data }),

    /**
     * Delete (soft delete) a trainee status record
     * Throws error if API call fails
     */
    deleteStatus: (recordId: string) => deleteMutation.mutateAsync(recordId),

    /**
     * Loading state: true if either mutation is in progress
     */
    isLoading: updateMutation.isPending || deleteMutation.isPending,

    /**
     * Error state: returns error from whichever mutation failed
     * Priority: update error if exists, otherwise delete error
     */
    error: updateMutation.error || deleteMutation.error || null,
  };
}
