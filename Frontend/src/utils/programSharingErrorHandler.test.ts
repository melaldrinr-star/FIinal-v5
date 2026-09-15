/**
 * Tests for Program Sharing Error Handler
 * 
 * Validates: Requirements 8.1, 8.3, 8.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProgramSharingErrorType,
  createProgramSharingError,
  handleInvalidProgramIdError,
  handleInactiveProgramError,
  handlePermissionDeniedError,
  handleApiError,
  handleProgramNotFoundError,
  logProgramSharingError,
  redirectAfterError,
  handleValidationResult,
  handlePermissionVerificationResult,
  classifyAndHandleError,
  getUserFriendlyErrorMessage,
  isErrorRecoverable,
} from './programSharingErrorHandler';
import { logger } from './logger';

// Mock the logger
vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Program Sharing Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createProgramSharingError', () => {
    it('should create InvalidProgramId error with correct message', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.InvalidProgramId);

      expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
      expect(error.message).toBe('Invalid program ID format');
      expect(error.fallbackPath).toBe('/');
    });

    it('should create InactiveProgram error with correct message', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.InactiveProgram);

      expect(error.type).toBe(ProgramSharingErrorType.InactiveProgram);
      expect(error.message).toBe('This program is no longer available');
      expect(error.fallbackPath).toBe('/programs');
    });

    it('should create PermissionDenied error with correct message', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.PermissionDenied);

      expect(error.type).toBe(ProgramSharingErrorType.PermissionDenied);
      expect(error.message).toBe("You don't have permission to access this program");
      expect(error.fallbackPath).toBe('/dashboard');
    });

    it('should create ApiError with correct message', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.ApiError);

      expect(error.type).toBe(ProgramSharingErrorType.ApiError);
      expect(error.message).toBe('Unable to validate program. Please try again.');
      expect(error.fallbackPath).toBe('/');
    });

    it('should include details in error object', () => {
      const details = { programId: 'test-id', userId: 'user-123' };
      const error = createProgramSharingError(
        ProgramSharingErrorType.InvalidProgramId,
        details
      );

      expect(error.details).toEqual(details);
    });
  });

  describe('handleInvalidProgramIdError', () => {
    it('should handle null program ID', () => {
      const error = handleInvalidProgramIdError(null);

      expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
      expect(error.userMessage).toBe('Invalid program ID format');
      expect(logger.warn).toHaveBeenCalledWith('Invalid program ID format detected', {
        programId: null,
        receivedType: 'object',
      });
    });

    it('should handle undefined program ID', () => {
      const error = handleInvalidProgramIdError(undefined);

      expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle empty string program ID', () => {
      const error = handleInvalidProgramIdError('');

      expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
      expect(error.details?.programId).toBe('');
    });

    it('should handle malformed UUID', () => {
      const malformedId = 'not-a-uuid';
      const error = handleInvalidProgramIdError(malformedId);

      expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
      expect(error.details?.programId).toBe(malformedId);
    });
  });

  describe('handleInactiveProgramError', () => {
    it('should create inactive program error', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const error = handleInactiveProgramError(programId);

      expect(error.type).toBe(ProgramSharingErrorType.InactiveProgram);
      expect(error.message).toBe('This program is no longer available');
      expect(error.fallbackPath).toBe('/programs');
    });

    it('should include reason in error details', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const reason = 'Program has been deleted';
      const error = handleInactiveProgramError(programId, reason);

      expect(error.details?.reason).toBe(reason);
    });

    it('should log warning with program details', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      handleInactiveProgramError(programId, 'Expired');

      expect(logger.warn).toHaveBeenCalledWith('Inactive program accessed', {
        programId,
        reason: 'Expired',
      });
    });
  });

  describe('handlePermissionDeniedError', () => {
    it('should create permission denied error', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const error = handlePermissionDeniedError(programId);

      expect(error.type).toBe(ProgramSharingErrorType.PermissionDenied);
      expect(error.message).toBe("You don't have permission to access this program");
      expect(error.fallbackPath).toBe('/dashboard');
    });

    it('should include user ID and reason in error details', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const userId = 'user-123';
      const reason = 'Private program';
      const error = handlePermissionDeniedError(programId, userId, reason);

      expect(error.details?.userId).toBe(userId);
      expect(error.details?.reason).toBe(reason);
    });

    it('should log warning with permission context', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const userId = 'user-456';
      handlePermissionDeniedError(programId, userId, 'Insufficient permissions');

      expect(logger.warn).toHaveBeenCalledWith('Permission denied for program access', {
        programId,
        userId,
        reason: 'Insufficient permissions',
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle Error object', () => {
      const apiError = new Error('Network timeout');
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const error = handleApiError(apiError, programId);

      expect(error.type).toBe(ProgramSharingErrorType.ApiError);
      expect(error.message).toBe('Unable to validate program. Please try again.');
      expect(error.details?.originalError).toBe('Network timeout');
    });

    it('should handle unknown error type', () => {
      const apiError = { code: 'ERR_NETWORK', statusCode: 500 };
      const error = handleApiError(apiError);

      expect(error.type).toBe(ProgramSharingErrorType.ApiError);
    });

    it('should include program ID in error details', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const error = handleApiError(new Error('Server error'), programId);

      expect(error.details?.programId).toBe(programId);
    });

    it('should log error with stack trace', () => {
      const apiError = new Error('API failed');
      handleApiError(apiError);

      expect(logger.error).toHaveBeenCalledWith(
        'API error during program sharing validation',
        expect.objectContaining({
          error: 'API failed',
        })
      );
    });
  });

  describe('handleProgramNotFoundError', () => {
    it('should create not found error', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const error = handleProgramNotFoundError(programId);

      expect(error.type).toBe(ProgramSharingErrorType.NotFound);
      expect(error.message).toBe('This program is no longer available');
      expect(error.fallbackPath).toBe('/programs');
    });

    it('should include program ID in error details', () => {
      const programId = '550e8400-e29b-41d4-a716-446655440000';
      const error = handleProgramNotFoundError(programId);

      expect(error.details?.programId).toBe(programId);
    });
  });

  describe('logProgramSharingError', () => {
    it('should log API error with appropriate level', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.ApiError, {
        originalError: 'Network timeout',
      });

      logProgramSharingError(error);

      expect(logger.error).toHaveBeenCalledWith('Program sharing API error', {
        errorType: ProgramSharingErrorType.ApiError,
        message: 'Unable to validate program. Please try again.',
        fallbackPath: '/',
        originalError: 'Network timeout',
      });
    });

    it('should log permission error with warning level', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.PermissionDenied, {
        userId: 'user-123',
      });

      logProgramSharingError(error);

      expect(logger.warn).toHaveBeenCalledWith('Program sharing permission denied', {
        errorType: ProgramSharingErrorType.PermissionDenied,
        message: "You don't have permission to access this program",
        fallbackPath: '/dashboard',
        userId: 'user-123',
      });
    });

    it('should include additional context in logs', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.InactiveProgram);
      const context = { action: 'validate_program', timestamp: '2024-01-01T00:00:00Z' };

      logProgramSharingError(error, context);

      expect(logger.warn).toHaveBeenCalledWith('Program sharing error', {
        errorType: ProgramSharingErrorType.InactiveProgram,
        message: 'This program is no longer available',
        fallbackPath: '/programs',
        action: 'validate_program',
        timestamp: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('redirectAfterError', () => {
    it('should clear program context from LocalStorage before redirect', () => {
      localStorage.setItem('selected_program_id', '550e8400-e29b-41d4-a716-446655440000');
      const redirectFn = vi.fn();
      const error = createProgramSharingError(ProgramSharingErrorType.InactiveProgram);

      redirectAfterError(error, redirectFn);

      expect(localStorage.getItem('selected_program_id')).toBeNull();
      expect(redirectFn).toHaveBeenCalledWith('/programs');
    });

    it('should use provided redirect function', () => {
      const redirectFn = vi.fn();
      const error = createProgramSharingError(ProgramSharingErrorType.PermissionDenied);

      redirectAfterError(error, redirectFn);

      expect(redirectFn).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle default redirect (window.location.href)', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as any;

      const error = createProgramSharingError(ProgramSharingErrorType.ApiError);
      redirectAfterError(error);

      expect(window.location.href).toBe('/');

      window.location = originalLocation;
    });

    it('should handle LocalStorage errors gracefully', () => {
      const redirectFn = vi.fn();
      const error = createProgramSharingError(ProgramSharingErrorType.InactiveProgram);

      // Mock LocalStorage to throw error
      const removeItemSpy = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

      redirectAfterError(error, redirectFn);

      expect(logger.error).toHaveBeenCalledWith(
        'Error clearing program context from LocalStorage',
        expect.any(Object)
      );
      expect(redirectFn).toHaveBeenCalled();

      removeItemSpy.mockRestore();
    });
  });

  describe('handleValidationResult', () => {
    it('should return null for valid program', () => {
      const result = {
        isValid: true,
        isActive: true,
        isPublic: true,
      };

      const error = handleValidationResult(result, '550e8400-e29b-41d4-a716-446655440000');
      expect(error).toBeNull();
    });

    it('should handle inactive program', () => {
      const result = {
        isValid: false,
        isActive: false,
        isPublic: true,
      };

      const error = handleValidationResult(result, '550e8400-e29b-41d4-a716-446655440000');
      expect(error?.type).toBe(ProgramSharingErrorType.InactiveProgram);
    });

    it('should handle private program', () => {
      const result = {
        isValid: false,
        isActive: true,
        isPublic: false,
      };

      const error = handleValidationResult(result, '550e8400-e29b-41d4-a716-446655440000');
      expect(error?.type).toBe(ProgramSharingErrorType.PermissionDenied);
    });

    it('should handle invalid result', () => {
      const result = {
        isValid: false,
        isActive: true,
        isPublic: true,
      };

      const error = handleValidationResult(result, '550e8400-e29b-41d4-a716-446655440000');
      expect(error?.type).toBe(ProgramSharingErrorType.NotFound);
    });
  });

  describe('handlePermissionVerificationResult', () => {
    it('should return null when user has access', () => {
      const result = {
        canAccess: true,
      };

      const error = handlePermissionVerificationResult(
        result,
        '550e8400-e29b-41d4-a716-446655440000',
        'user-123'
      );
      expect(error).toBeNull();
    });

    it('should create PermissionDenied error when access is denied', () => {
      const result = {
        canAccess: false,
        reason: 'User does not meet prerequisites',
      };

      const error = handlePermissionVerificationResult(
        result,
        '550e8400-e29b-41d4-a716-446655440000',
        'user-123'
      );
      expect(error?.type).toBe(ProgramSharingErrorType.PermissionDenied);
      expect(error?.details?.reason).toBe('User does not meet prerequisites');
    });
  });

  describe('classifyAndHandleError', () => {
    it('should classify timeout errors', () => {
      const error = { message: 'timeout error', code: 'ECONNABORTED' };

      const result = classifyAndHandleError(error, '550e8400-e29b-41d4-a716-446655440000');
      expect(result.type).toBe(ProgramSharingErrorType.ApiError);
      expect(result.details?.reason).toBe('timeout');
    });

    it('should classify 404 errors as not found', () => {
      const error = { status: 404, message: 'not found' };

      const result = classifyAndHandleError(error, '550e8400-e29b-41d4-a716-446655440000');
      expect(result.type).toBe(ProgramSharingErrorType.NotFound);
    });

    it('should classify 403 errors as permission denied', () => {
      const error = { status: 403, message: 'forbidden' };

      const result = classifyAndHandleError(error, '550e8400-e29b-41d4-a716-446655440000');
      expect(result.type).toBe(ProgramSharingErrorType.PermissionDenied);
    });

    it('should classify 400 errors as invalid program ID', () => {
      const error = { status: 400, message: 'validation error' };

      const result = classifyAndHandleError(error, '550e8400-e29b-41d4-a716-446655440000');
      expect(result.type).toBe(ProgramSharingErrorType.InvalidProgramId);
    });

    it('should default to API error for unknown errors', () => {
      const error = { status: 500, message: 'internal server error' };

      const result = classifyAndHandleError(error, '550e8400-e29b-41d4-a716-446655440000');
      expect(result.type).toBe(ProgramSharingErrorType.ApiError);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return user-friendly message for each error type', () => {
      const errorTypes: ProgramSharingErrorType[] = [
        ProgramSharingErrorType.InvalidProgramId,
        ProgramSharingErrorType.InactiveProgram,
        ProgramSharingErrorType.PermissionDenied,
        ProgramSharingErrorType.ApiError,
      ];

      errorTypes.forEach((type) => {
        const error = createProgramSharingError(type);
        const message = getUserFriendlyErrorMessage(error);

        expect(message).toBeTruthy();
        expect(message).toBe(error.userMessage);
      });
    });
  });

  describe('isErrorRecoverable', () => {
    it('should return true for API errors', () => {
      const error = createProgramSharingError(ProgramSharingErrorType.ApiError);
      expect(isErrorRecoverable(error)).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      const nonRecoverableTypes = [
        ProgramSharingErrorType.InvalidProgramId,
        ProgramSharingErrorType.InactiveProgram,
        ProgramSharingErrorType.PermissionDenied,
        ProgramSharingErrorType.NotFound,
      ];

      nonRecoverableTypes.forEach((type) => {
        const error = createProgramSharingError(type);
        expect(isErrorRecoverable(error)).toBe(false);
      });
    });
  });

  describe('Integration: Error handling workflow', () => {
    it('should handle invalid program ID format error scenario', () => {
      // Simulate user clicking link with malformed program_id
      const programId = 'not-a-uuid';
      const error = handleInvalidProgramIdError(programId);

      // Verify error properties
      expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
      expect(error.userMessage).toBe('Invalid program ID format');

      // Verify message is user-friendly
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toBe('Invalid program ID format');

      // Verify error is logged
      logProgramSharingError(error, { action: 'validate_link' });
      expect(logger.warn).toHaveBeenCalled();

      // Verify redirect clears context
      const redirectFn = vi.fn();
      redirectAfterError(error, redirectFn);
      expect(redirectFn).toHaveBeenCalledWith('/');
    });

    it('should handle inactive program error scenario', () => {
      localStorage.setItem('selected_program_id', '550e8400-e29b-41d4-a716-446655440000');

      // Simulate validation detecting inactive program
      const result = {
        isValid: false,
        isActive: false,
        isPublic: true,
      };
      const error = handleValidationResult(result, '550e8400-e29b-41d4-a716-446655440000');

      expect(error?.type).toBe(ProgramSharingErrorType.InactiveProgram);
      expect(error?.userMessage).toBe('This program is no longer available');

      // Verify redirect clears context and routes to programs page
      const redirectFn = vi.fn();
      redirectAfterError(error!, redirectFn);

      expect(localStorage.getItem('selected_program_id')).toBeNull();
      expect(redirectFn).toHaveBeenCalledWith('/programs');
    });

    it('should handle permission denied error scenario', () => {
      localStorage.setItem('selected_program_id', '550e8400-e29b-41d4-a716-446655440000');

      // Simulate permission check failing
      const result = {
        canAccess: false,
        reason: 'Private program',
      };
      const error = handlePermissionVerificationResult(
        result,
        '550e8400-e29b-41d4-a716-446655440000',
        'user-123'
      );

      expect(error?.type).toBe(ProgramSharingErrorType.PermissionDenied);
      expect(error?.userMessage).toBe("You don't have permission to access this program");

      // Verify redirect clears context and routes to dashboard
      const redirectFn = vi.fn();
      redirectAfterError(error!, redirectFn);

      expect(localStorage.getItem('selected_program_id')).toBeNull();
      expect(redirectFn).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle API error scenario with retry capability', () => {
      // Simulate API timeout
      const apiError = new Error('Network timeout');
      const error = handleApiError(apiError, '550e8400-e29b-41d4-a716-446655440000');

      expect(error.type).toBe(ProgramSharingErrorType.ApiError);
      expect(error.userMessage).toBe('Unable to validate program. Please try again.');

      // Verify error is recoverable
      expect(isErrorRecoverable(error)).toBe(true);

      // Verify user can retry
      logProgramSharingError(error, { action: 'validate_program', attempt: 1 });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
