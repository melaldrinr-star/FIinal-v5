/**
 * Program Sharing LocalStorage Utilities
 *
 * Provides type-safe accessors for storing and managing program context
 * in browser LocalStorage. Handles program_id persistence across navigation
 * and browser sessions.
 *
 * Requirements Addressed: 2.2, 6.2, 6.3, 9.1, 9.2
 */

/**
 * LocalStorage key for storing selected program ID
 */
const SELECTED_PROGRAM_ID_KEY = 'selected_program_id';

/**
 * LocalStorage key for storing enrollment source
 */
const ENROLLMENT_SOURCE_KEY = 'enrollment_source';

/**
 * Valid enrollment sources for tracking
 */
export type EnrollmentSource = 'social_share' | 'direct' | 'admin_assigned';

/**
 * Represents program context stored in LocalStorage
 */
export interface ProgramContext {
  selectedProgramId: string | null;
  enrollmentSource?: EnrollmentSource;
}

/**
 * Error thrown when LocalStorage operations fail
 */
export class StorageError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(`LocalStorage ${operation} failed: ${message}`);
    this.name = 'StorageError';
  }
}

/**
 * Stores a program ID in LocalStorage
 *
 * @param programId - UUID of the program to store
 * @param source - Optional enrollment source for tracking
 * @throws StorageError if storage operation fails
 *
 * **Validates: Requirements 2.2, 5.1**
 */
export function setSelectedProgramId(
  programId: string,
  source: EnrollmentSource = 'social_share'
): void {
  try {
    // Validate program ID format (basic UUID check)
    if (!isValidUUID(programId)) {
      throw new Error(`Invalid program ID format: ${programId}`);
    }

    localStorage.setItem(SELECTED_PROGRAM_ID_KEY, programId);
    localStorage.setItem(ENROLLMENT_SOURCE_KEY, source);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      throw error;
    }

    // Handle quota exceeded or other storage errors
    if (
      error instanceof Error &&
      (error.name === 'QuotaExceededError' || error.message.includes('quota'))
    ) {
      throw new StorageError('Storage quota exceeded', 'setItem');
    }

    throw new StorageError(
      error instanceof Error ? error.message : 'Unknown error',
      'setItem'
    );
  }
}

/**
 * Retrieves the selected program ID from LocalStorage
 *
 * @returns The stored program ID, or null if not found
 * @throws StorageError if storage operation fails
 *
 * **Validates: Requirements 2.2, 5.2, 9.2**
 */
export function getSelectedProgramId(): string | null {
  try {
    const value = localStorage.getItem(SELECTED_PROGRAM_ID_KEY);
    return value;
  } catch (error) {
    throw new StorageError(
      error instanceof Error ? error.message : 'Unknown error',
      'getItem'
    );
  }
}

/**
 * Retrieves the complete program context from LocalStorage
 *
 * @returns Object containing selected program ID and enrollment source
 * @throws StorageError if storage operation fails
 *
 * **Validates: Requirements 2.2, 5.1**
 */
export function getProgramContext(): ProgramContext {
  try {
    const selectedProgramId = localStorage.getItem(SELECTED_PROGRAM_ID_KEY);
    const enrollmentSource = (localStorage.getItem(
      ENROLLMENT_SOURCE_KEY
    ) || 'direct') as EnrollmentSource;

    return {
      selectedProgramId,
      enrollmentSource,
    };
  } catch (error) {
    throw new StorageError(
      error instanceof Error ? error.message : 'Unknown error',
      'getItem'
    );
  }
}

/**
 * Checks if a program ID is stored in LocalStorage
 *
 * @returns true if a program ID is currently stored, false otherwise
 * @throws StorageError if storage operation fails
 *
 * **Validates: Requirements 2.2, 3.1**
 */
export function hasProgramContext(): boolean {
  try {
    return localStorage.getItem(SELECTED_PROGRAM_ID_KEY) !== null;
  } catch (error) {
    throw new StorageError(
      error instanceof Error ? error.message : 'Unknown error',
      'getItem'
    );
  }
}

/**
 * Removes the selected program ID from LocalStorage (selective deletion)
 *
 * Only removes the program-related keys without affecting other stored data.
 *
 * @throws StorageError if storage operation fails
 *
 * **Validates: Requirements 6.2, 6.3, 9.5**
 */
export function clearProgramContext(): void {
  try {
    localStorage.removeItem(SELECTED_PROGRAM_ID_KEY);
    localStorage.removeItem(ENROLLMENT_SOURCE_KEY);
  } catch (error) {
    throw new StorageError(
      error instanceof Error ? error.message : 'Unknown error',
      'removeItem'
    );
  }
}

/**
 * Retrieves enrollment source from LocalStorage
 *
 * @returns The stored enrollment source, or 'direct' as default
 * @throws StorageError if storage operation fails
 *
 * **Validates: Requirements 5.5**
 */
export function getEnrollmentSource(): EnrollmentSource {
  try {
    const source = localStorage.getItem(ENROLLMENT_SOURCE_KEY);
    return (source as EnrollmentSource) || 'direct';
  } catch (error) {
    throw new StorageError(
      error instanceof Error ? error.message : 'Unknown error',
      'getItem'
    );
  }
}

/**
 * Safely parses and validates stored program context
 *
 * Handles corrupted or invalid data gracefully, returning null for
 * invalid entries rather than throwing errors.
 *
 * @returns Valid program ID if stored data is valid, null otherwise
 *
 * **Validates: Requirements 2.4, 6.2**
 */
export function getProgramContextSafe(): string | null {
  try {
    const programId = localStorage.getItem(SELECTED_PROGRAM_ID_KEY);

    // Check if value exists and is valid
    if (programId === null) {
      return null;
    }

    // Validate UUID format
    if (!isValidUUID(programId)) {
      // Corrupted data - remove it and return null
      try {
        localStorage.removeItem(SELECTED_PROGRAM_ID_KEY);
      } catch {
        // Silently fail if unable to remove
      }
      return null;
    }

    return programId;
  } catch {
    // If any error occurs, return null rather than throwing
    return null;
  }
}

/**
 * Validates if a string is a valid UUID
 *
 * Checks for UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @param uuid - String to validate
 * @returns true if string matches UUID format, false otherwise
 *
 * @internal
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Hook wrapper for LocalStorage operations
 *
 * Provides React-compatible interface for program context management
 */
export function useLocalStorageProgramContext() {
  return {
    setProgram: setSelectedProgramId,
    getProgram: getSelectedProgramId,
    getContext: getProgramContext,
    hasContext: hasProgramContext,
    clearContext: clearProgramContext,
    getProgramSafe: getProgramContextSafe,
    getEnrollmentSource,
  };
}
