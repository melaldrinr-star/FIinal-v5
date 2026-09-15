/**
 * Enrollment Action Hook
 *
 * Handles the enrollment action from the Program Modal, including:
 * 1. Calling POST /api/enrollments with trainee_id and program_id
 * 2. Including source: 'social_share' if program came from shared link
 * 3. Showing "Successfully enrolled!" message on success
 * 4. Calling cleanupProgramReference() to remove program_id from LocalStorage
 * 5. Showing error message on failure and keeping program_id for retry
 *
 * Requirements: 5.5, 6.1, 6.2
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '../services/api';
import { cleanupProgramReference, PROGRAM_ID_KEY } from '../utils/sessionCleanupHandler';
import logger from '../utils/logger';

/**
 * Enrollment response from the API
 */
export interface EnrollmentResponse {
  id: string;
  trainee_id: string;
  program_id: string;
  status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'failed';
  enrollment_date: string;
}

/**
 * Hook for handling enrollment actions
 */
export function useEnrollmentAction() {
  const [loading, setLoading] = useState(false);

  /**
   * Determines if the program came from a shared link
   * by checking if it's stored in LocalStorage
   */
  const isFromSocialShare = useCallback((programId: string): boolean => {
    try {
      const storedProgramId = localStorage.getItem(PROGRAM_ID_KEY);
      return storedProgramId === programId;
    } catch {
      return false;
    }
  }, []);

  /**
   * Handles the enrollment action
   * @param traineeId - The trainee's ID
   * @param programId - The program's ID
   * @returns The enrollment response data
   */
  const handleEnroll = useCallback(
    async (traineeId: string, programId: string): Promise<EnrollmentResponse | undefined> => {
      try {
        setLoading(true);

        // Determine enrollment source based on whether program came from shared link
        const source = isFromSocialShare(programId) ? 'social_share' : 'direct';

        logger.info('[Enrollment] Starting enrollment', {
          traineeId,
          programId,
          source,
        });

        // Call POST /api/enrollments with trainee_id, program_id, and source
        const response = await api.post<EnrollmentResponse>('/enrollments', {
          trainee_id: traineeId,
          program_id: programId,
          source,
        });

        const enrollmentData = response.data;

        logger.info('[Enrollment] Enrollment successful', {
          enrollmentId: enrollmentData.id,
          status: enrollmentData.status,
          source,
        });

        // Show success message
        toast.success('Successfully enrolled!');

        // Call cleanupProgramReference to remove program_id from LocalStorage
        const cleanupResult = await cleanupProgramReference({
          trigger: 'enrollment_complete',
          force: false,
        });

        logger.info('[Enrollment] Cleanup completed', {
          wasCleanedUp: cleanupResult.wasCleanedUp,
          previousValue: cleanupResult.previousValue,
        });

        setLoading(false);
        return enrollmentData;
      } catch (error) {
        setLoading(false);

        // Extract error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as any)?.response?.data?.error || 'Failed to enroll in program';

        logger.error('[Enrollment] Enrollment failed', {
          traineeId,
          programId,
          error: errorMessage,
        });

        // Show error message
        toast.error(`Failed to enroll: ${errorMessage}`);

        // Keep program_id in LocalStorage for retry
        // (don't call cleanup on error)

        return undefined;
      }
    },
    [isFromSocialShare]
  );

  return {
    handleEnroll,
    loading,
  };
}
