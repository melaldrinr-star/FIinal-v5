/**
 * Program Sharing Error Handler
 * 
 * Utility for handling errors that occur during the program sharing flow.
 * Provides consistent error messaging and appropriate redirects for each error scenario.
 * 
 * Handles:
 * - Invalid program_id format
 * - Inactive program
 * - Permission denied
 * - API errors
 * 
 * **Validates: Requirements 8.1, 8.3, 8.4**
 */

import { logger } from './logger';

export enum ProgramSharingErrorType {
  InvalidProgramId = 'INVALID_PROGRAM_ID',
  InactiveProgram = 'INACTIVE_PROGRAM',
  PermissionDenied = 'PERMISSION_DENIED',
  ApiError = 'API_ERROR',
  NotFound = 'NOT_FOUND',
  Unknown = 'UNKNOWN',
}

export interface ProgramSharingError {
  type: ProgramSharingErrorType;
  message: string;
  userMessage: string;
  fallbackPath: string;
  details?: Record<string, any>;
}

/**
 * User-friendly error messages for program sharing edge cases
 */
const ERROR_MESSAGES: Record<ProgramSharingErrorType, { message: string; fallback: string }> = {
  [ProgramSharingErrorType.InvalidProgramId]: {
    message: 'Invalid program ID format',
    fallback: '/',
  },
  [ProgramSharingErrorType.InactiveProgram]: {
    message: 'This program is no longer available',
    fallback: '/programs',
  },
  [ProgramSharingErrorType.PermissionDenied]: {
    message: "You don't have permission to access this program",
    fallback: '/dashboard',
  },
  [ProgramSharingErrorType.NotFound]: {
    message: 'This program is no longer available',
    fallback: '/programs',
  },
  [ProgramSharingErrorType.ApiError]: {
    message: 'Unable to validate program. Please try again.',
    fallback: '/',
  },
  [ProgramSharingErrorType.Unknown]: {
    message: 'An unexpected error occurred',
    fallback: '/',
  },
};

/**
 * Creates a structured error object for program sharing scenarios
 * 
 * @param type - Error type enum
 * @param details - Optional additional details for logging
 * @returns Structured error object
 */
export function createProgramSharingError(
  type: ProgramSharingErrorType,
  details?: Record<string, any>
): ProgramSharingError {
  const errorConfig = ERROR_MESSAGES[type];

  const error: ProgramSharingError = {
    type,
    message: errorConfig.message,
    userMessage: errorConfig.message,
    fallbackPath: errorConfig.fallback,
    details,
  };

  return error;
}

/**
 * Handles invalid program ID format
 * 
 * Example: malformed UUID, empty string, null
 * 
 * @param programId - The program ID that was invalid
 * @returns Structured error
 */
export function handleInvalidProgramIdError(programId: string | null | undefined): ProgramSharingError {
  logger.warn('Invalid program ID format detected', {
    programId,
    receivedType: typeof programId,
  });

  return createProgramSharingError(ProgramSharingErrorType.InvalidProgramId, {
    programId,
    receivedType: typeof programId,
  });
}

/**
 * Handles inactive or deleted program
 * 
 * When program exists but is not active or has been deleted
 * 
 * @param programId - The program ID that was inactive
 * @param reason - Optional reason for inactivity
 * @returns Structured error
 */
export function handleInactiveProgramError(
  programId: string,
  reason?: string
): ProgramSharingError {
  logger.warn('Inactive program accessed', {
    programId,
    reason,
  });

  const error = createProgramSharingError(ProgramSharingErrorType.InactiveProgram, {
    programId,
    reason,
  });

  return error;
}

/**
 * Handles permission denied scenarios
 * 
 * When user lacks permission to view/enroll in program
 * 
 * @param programId - The program ID
 * @param userId - The user ID (optional, for logging)
 * @param reason - Specific reason permission was denied
 * @returns Structured error
 */
export function handlePermissionDeniedError(
  programId: string,
  userId?: string,
  reason?: string
): ProgramSharingError {
  logger.warn('Permission denied for program access', {
    programId,
    userId,
    reason,
  });

  return createProgramSharingError(ProgramSharingErrorType.PermissionDenied, {
    programId,
    userId,
    reason,
  });
}

/**
 * Handles API errors during program validation
 * 
 * Network errors, server errors, timeouts, etc.
 * 
 * @param error - The underlying error
 * @param programId - Program ID being validated (if available)
 * @returns Structured error
 */
export function handleApiError(error: Error | unknown, programId?: string): ProgramSharingError {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  logger.error('API error during program sharing validation', {
    error: errorMessage,
    programId,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return createProgramSharingError(ProgramSharingErrorType.ApiError, {
    originalError: errorMessage,
    programId,
  });
}

/**
 * Handles program not found scenario
 * 
 * Specific case when program doesn't exist in database
 * 
 * @param programId - The program ID that wasn't found
 * @returns Structured error
 */
export function handleProgramNotFoundError(programId: string): ProgramSharingError {
  logger.warn('Program not found', {
    programId,
  });

  return createProgramSharingError(ProgramSharingErrorType.NotFound, {
    programId,
  });
}

/**
 * Logs error for debugging and monitoring
 * 
 * @param error - The program sharing error
 * @param context - Additional context (page, action, etc.)
 */
export function logProgramSharingError(
  error: ProgramSharingError,
  context?: Record<string, any>
): void {
  const logData = {
    errorType: error.type,
    message: error.message,
    fallbackPath: error.fallbackPath,
    ...error.details,
    ...context,
  };

  if (error.type === ProgramSharingErrorType.ApiError) {
    logger.error('Program sharing API error', logData);
  } else if (error.type === ProgramSharingErrorType.PermissionDenied) {
    logger.warn('Program sharing permission denied', logData);
  } else {
    logger.warn('Program sharing error', logData);
  }
}

/**
 * Handles redirect after error
 * 
 * Clears program context from LocalStorage and prepares redirect
 * 
 * @param error - The error that occurred
 * @param redirectFn - Function to call for navigation (e.g., window.location.href)
 */
export function redirectAfterError(
  error: ProgramSharingError,
  redirectFn?: (path: string) => void
): void {
  // Clear program context from LocalStorage
  try {
    localStorage.removeItem('selected_program_id');
  } catch (e) {
    logger.error('Error clearing program context from LocalStorage', { error: e });
  }

  // Perform redirect
  const redirect = redirectFn || ((path: string) => {
    window.location.href = path;
  });

  redirect(error.fallbackPath);
}

/**
 * Centralized error handler for program sharing validation
 * 
 * Processes validation results and creates appropriate errors
 * 
 * @param validationResult - Result from program validation endpoint
 * @param programId - Program ID being validated
 * @returns Error if validation failed, null if successful
 */
export function handleValidationResult(
  validationResult: {
    isValid?: boolean;
    isActive?: boolean;
    isPublic?: boolean;
    error?: string;
  },
  programId: string
): ProgramSharingError | null {
  // Check if validation failed
  if (!validationResult.isValid) {
    // Determine specific error type
    if (!validationResult.isActive) {
      return handleInactiveProgramError(programId, 'Program is not active');
    }

    if (!validationResult.isPublic) {
      return handlePermissionDeniedError(
        programId,
        undefined,
        'Program is not available for public enrollment'
      );
    }

    // Generic validation failure
    return handleProgramNotFoundError(programId);
  }

  // Validation successful
  return null;
}

/**
 * Handles permission verification result
 * 
 * Processes permission check responses
 * 
 * @param verifyResult - Result from permission verification endpoint
 * @param programId - Program ID being checked
 * @param userId - User ID making the request
 * @returns Error if permission denied, null if successful
 */
export function handlePermissionVerificationResult(
  verifyResult: {
    canAccess?: boolean;
    reason?: string;
  },
  programId: string,
  userId?: string
): ProgramSharingError | null {
  if (!verifyResult.canAccess) {
    return handlePermissionDeniedError(programId, userId, verifyResult.reason);
  }

  return null;
}

/**
 * Comprehensive error classification and response handler
 * 
 * Analyzes API error response and returns appropriate ProgramSharingError
 * 
 * @param apiError - Error from API call
 * @param programId - Program ID being accessed
 * @param context - Error context (what operation was being performed)
 * @returns Classified error
 */
export function classifyAndHandleError(
  apiError: any,
  programId?: string,
  context: string = 'unknown'
): ProgramSharingError {
  // Handle network/timeout errors
  if (apiError?.message?.includes('timeout') || apiError?.code === 'ECONNABORTED') {
    logger.error('Network timeout in program sharing', { programId, context });
    return createProgramSharingError(ProgramSharingErrorType.ApiError, {
      reason: 'timeout',
      programId,
      context,
    });
  }

  // Handle not found responses
  if (apiError?.status === 404 || apiError?.message?.includes('not found')) {
    return handleProgramNotFoundError(programId || 'unknown');
  }

  // Handle permission errors
  if (apiError?.status === 403 || apiError?.message?.includes('permission')) {
    return handlePermissionDeniedError(programId, undefined, 'Access forbidden');
  }

  // Handle validation errors
  if (apiError?.status === 400 || apiError?.message?.includes('validation')) {
    return handleInvalidProgramIdError(programId);
  }

  // Default API error
  return handleApiError(apiError, programId);
}

/**
 * Gets user-friendly error message
 * 
 * @param error - The program sharing error
 * @returns User-friendly message
 */
export function getUserFriendlyErrorMessage(error: ProgramSharingError): string {
  return error.userMessage;
}

/**
 * Determines if error is recoverable
 * 
 * Some errors (like API timeouts) may be retryable
 * 
 * @param error - The program sharing error
 * @returns true if user can retry
 */
export function isErrorRecoverable(error: ProgramSharingError): boolean {
  const recoverableTypes = [ProgramSharingErrorType.ApiError];
  return recoverableTypes.includes(error.type);
}
