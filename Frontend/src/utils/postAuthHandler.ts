/**
 * Post-Auth Handler Utility
 * 
 * Executes after successful login/signup to handle program context from shared links.
 * Checks for stored program_id and routes user appropriately.
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 5.1
 */

import { logger } from './logger';

interface PostAuthHandlerResult {
  targetPath: string;
  programId?: string;
  programName?: string;
  permissionDenied?: boolean;
}

/**
 * Handle post-authentication routing based on program context
 * 
 * Logic:
 * 1. Check LocalStorage for stored program_id
 * 2. If program present: redirect to program detail page
 * 3. If program absent: redirect to dashboard (normal behavior)
 * 
 * Note: We skip verify-access check because:
 * - LinkHandlerPage already validated the program exists and is active
 * - Trainees can enroll in any active program via social sharing
 * - The enrollment form handles permission checks
 * 
 * @param userId - Authenticated user ID
 * @param context - Authentication context: 'login' or 'signup'
 * @returns Promise with target path and optional program details
 */
export async function handlePostAuth(
  userId: string,
  context: 'login' | 'signup'
): Promise<PostAuthHandlerResult> {
  try {
    // Step 1: Check LocalStorage for stored program_id
    const storedProgramId = localStorage.getItem('selected_program_id');
    console.log('[postAuthHandler] storedProgramId from localStorage:', storedProgramId);
    console.log('[postAuthHandler] localStorage keys:', Object.keys(localStorage));

    if (!storedProgramId) {
      logger.debug('No program context found in LocalStorage during post-auth', { userId, context });
      return {
        targetPath: '/dashboard',
      };
    }

    logger.debug('Program context found during post-auth', {
      userId,
      context,
      programId: storedProgramId,
    });

    // Step 2: Redirect to program page (validation already done by LinkHandlerPage)
    logger.debug('User accessing program from social shared link', {
      userId,
      programId: storedProgramId,
    });

    return {
      targetPath: /programs/,
      programId: storedProgramId,
      permissionDenied: false,
    };
  } catch (error) {
    logger.error('Unexpected error in post-auth handler', { error });
    return {
      targetPath: '/dashboard',
    };
  }
}

/**
 * Clear program reference from LocalStorage after successful enrollment
 * 
 * @param force - If true, clears regardless of enrollment status
 */
export function cleanupProgramReference(force: boolean = false): void {
  try {
    const programId = localStorage.getItem('selected_program_id');
    if (programId || force) {
      localStorage.removeItem('selected_program_id');
      logger.debug('Program reference cleared from LocalStorage', { programId });
    }
  } catch (error) {
    logger.error('Error clearing program reference', { error });
  }
}

/**
 * Check if user has program context stored
 * 
 * @returns Program ID if stored, null otherwise
 */
export function getProgramContext(): string | null {
  try {
    return localStorage.getItem('selected_program_id');
  } catch (error) {
    logger.error('Error retrieving program context', { error });
    return null;
  }
}

/**
 * Store program ID in LocalStorage
 * 
 * @param programId - Program ID to store
 */
export function setProgramContext(programId: string): void {
  try {
    localStorage.setItem('selected_program_id', programId);
    logger.debug('Program context stored in LocalStorage', { programId });
  } catch (error) {
    logger.error('Error storing program context', { error });
    throw error;
  }
}