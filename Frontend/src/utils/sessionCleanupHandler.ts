/**
 * Session Cleanup Handler Utility
 * 
 * Manages cleanup of program reference context after successful authentication
 * and enrollment completion. Handles selective deletion of LocalStorage keys
 * to maintain other stored data while removing the shared program reference.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

export const PROGRAM_ID_KEY = 'selected_program_id';

/**
 * Trigger types that can initiate cleanup
 */
export type CleanupTrigger = 'enrollment_complete' | 'explicit_dismiss' | 'auth_complete' | 'session_expire';

/**
 * Configuration for cleanup operation
 */
export interface CleanupConfig {
  trigger: CleanupTrigger;
  force?: boolean; // Force cleanup regardless of enrollment status
  onBeforeCleanup?: () => Promise<boolean>; // Hook before cleanup, return false to prevent
}

/**
 * Result of cleanup operation
 */
export interface CleanupResult {
  success: boolean;
  wasCleanedUp: boolean;
  previousValue?: string;
  error?: string;
}

/**
 * Cleans up program reference from LocalStorage after successful enrollment
 * 
 * Behavior:
 * - Removes 'selected_program_id' key from LocalStorage
 * - Does NOT affect other LocalStorage keys (selective deletion)
 * - Handles cases where program_id doesn't exist (idempotent)
 * - Returns information about what was cleaned up
 * 
 * @param config Configuration for cleanup operation
 * @returns Result of cleanup operation including whether key was removed
 */
export async function cleanupProgramReference(config: CleanupConfig): Promise<CleanupResult> {
  try {
    // Check if LocalStorage is available
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        wasCleanedUp: false,
        error: 'LocalStorage is not available',
      };
    }

    // Get current value before cleanup
    const previousValue = localStorage.getItem(PROGRAM_ID_KEY) || undefined;

    // Call beforeCleanup hook if provided
    if (config.onBeforeCleanup) {
      const shouldProceed = await config.onBeforeCleanup();
      if (!shouldProceed) {
        return {
          success: true,
          wasCleanedUp: false,
          previousValue,
          error: 'Cleanup prevented by onBeforeCleanup hook',
        };
      }
    }

    // Determine if cleanup should proceed
    const shouldCleanup = config.force || isCleanupTriggerValid(config.trigger);

    if (!shouldCleanup) {
      return {
        success: true,
        wasCleanedUp: false,
        previousValue,
      };
    }

    // Selective deletion - only remove the program_id key
    const hadValue = previousValue !== null && previousValue !== undefined;

    if (hadValue) {
      localStorage.removeItem(PROGRAM_ID_KEY);
    }

    return {
      success: true,
      wasCleanedUp: hadValue,
      previousValue: hadValue ? previousValue : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      wasCleanedUp: false,
      error: `Cleanup failed: ${errorMessage}`,
    };
  }
}

/**
 * Determines if a cleanup trigger is valid for actually removing the program_id
 * 
 * Rules:
 * - 'enrollment_complete': Always cleanup after enrollment
 * - 'explicit_dismiss': Always cleanup on user dismissal
 * - 'auth_complete': Clean up after successful auth
 * - 'session_expire': Clean up on session expiry
 * 
 * @param trigger The cleanup trigger type
 * @returns Whether this trigger should result in cleanup
 */
function isCleanupTriggerValid(trigger: CleanupTrigger): boolean {
  const validTriggers: CleanupTrigger[] = [
    'enrollment_complete',
    'explicit_dismiss',
    'auth_complete',
    'session_expire',
  ];
  return validTriggers.includes(trigger);
}

/**
 * Checks if LocalStorage is available and accessible
 * 
 * @returns Whether LocalStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves the currently stored program_id from LocalStorage
 * 
 * @returns The stored program_id or undefined if not present
 */
export function getStoredProgramId(): string | undefined {
  try {
    if (!isLocalStorageAvailable()) {
      return undefined;
    }
    const value = localStorage.getItem(PROGRAM_ID_KEY);
    return value || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sets the program_id in LocalStorage
 * 
 * @param programId The program ID to store
 * @returns Whether the store operation was successful
 */
export function setStoredProgramId(programId: string): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    localStorage.setItem(PROGRAM_ID_KEY, programId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a program_id is currently stored
 * 
 * @returns Whether a program_id is stored
 */
export function hasProgramIdStored(): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    return localStorage.getItem(PROGRAM_ID_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Gets the count of items in LocalStorage
 * Used for testing that cleanup doesn't affect other keys
 * 
 * @returns Number of items in LocalStorage
 */
export function getLocalStorageItemCount(): number {
  try {
    if (!isLocalStorageAvailable()) {
      return 0;
    }
    return localStorage.length;
  } catch {
    return 0;
  }
}

/**
 * Clears all LocalStorage (for test cleanup)
 * WARNING: This clears everything, use with caution
 */
export function clearAllLocalStorage(): void {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.clear();
    }
  } catch {
    // Silently fail if clearing is not possible
  }
}
