/**
 * Comprehensive Error Handling Service
 *
 * Provides centralized error handling for API responses with:
 * - Error type detection and classification
 * - HTTP status code mapping
 * - User-friendly error messages
 * - Recovery action handling
 * - Form-level validation error extraction
 * - Rate limiting detection
 * - Debug logging
 * - React hooks for component integration
 */

import { toast } from 'sonner';

// ============================================================================
// ERROR TYPE DEFINITIONS
// ============================================================================

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  NO_INTERNET = 'NO_INTERNET',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FIELD_ERROR = 'FIELD_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  MFA_REQUIRED = 'MFA_REQUIRED',

  // OTP/2FA errors
  INVALID_OTP = 'INVALID_OTP',
  EXPIRED_OTP = 'EXPIRED_OTP',
  MAX_OTP_ATTEMPTS = 'MAX_OTP_ATTEMPTS',
  OTP_NOT_FOUND = 'OTP_NOT_FOUND',

  // Password errors
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  CURRENT_PASSWORD_INCORRECT = 'CURRENT_PASSWORD_INCORRECT',
  PASSWORD_RESET_EXPIRED = 'PASSWORD_RESET_EXPIRED',

  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Other
  UNKNOWN = 'UNKNOWN',
}

export interface ApiErrorResponse {
  success?: boolean;
  error?: string;
  message?: string;
  errors?: Record<string, string[] | string>;
  details?: Record<string, any>;
  code?: string;
  status?: number;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfter?: number;
}

export interface ParsedError {
  code: ErrorCode;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  fieldErrors?: Record<string, string>;
  isRecoverable: boolean;
  recoveryAction?: 'retry' | 'resend' | 'reset' | 'refresh' | 'login';
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  locked?: boolean;
  details?: Record<string, any>;
}

export interface DisplayErrorOptions {
  showToast?: boolean;
  showModal?: boolean;
  duration?: number;
  onDismiss?: () => void;
}

// ============================================================================
// ERROR PARSING UTILITIES
// ============================================================================

/**
 * Parse an API error response into a structured error object
 */
export function parseApiError(error: any): ParsedError {
  const defaultError: ParsedError = {
    code: ErrorCode.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message: 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.',
    isRecoverable: true,
  };

  if (!error) {
    return defaultError;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      ...defaultError,
      message: error,
      userMessage: error,
    };
  }

  // Handle network/fetch errors
  if (error instanceof TypeError || error instanceof ReferenceError) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      severity: ErrorSeverity.ERROR,
      message: error.message,
      userMessage: 'Network connection failed. Please check your internet and try again.',
      isRecoverable: true,
      recoveryAction: 'retry',
    };
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
    return {
      code: ErrorCode.TIMEOUT,
      severity: ErrorSeverity.WARNING,
      message: 'Request timed out',
      userMessage: 'The request took too long. Please try again.',
      isRecoverable: true,
      recoveryAction: 'retry',
    };
  }

  // Parse API response errors
  const errorData = error.response?.data || error.data || error;
  const status = error.response?.status || error.status || 500;

  // ── Validation errors (400, 422) ──────────────────────────────────────
  if (status === 400 || status === 422) {
    // Check if it's a field validation error
    if (errorData.errors && typeof errorData.errors === 'object') {
      const fieldErrors: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(errorData.errors)) {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : (msgs as string);
      }

      return {
        code: ErrorCode.VALIDATION_ERROR,
        severity: ErrorSeverity.WARNING,
        message: 'Validation failed',
        userMessage: errorData.error || 'Please check your input and try again.',
        fieldErrors,
        isRecoverable: true,
      };
    }

    // Check for specific validation patterns
    const msg = errorData.error || errorData.message || '';

    if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('code')) {
      if (msg.toLowerCase().includes('expired')) {
        return {
          code: ErrorCode.EXPIRED_OTP,
          severity: ErrorSeverity.WARNING,
          message: msg,
          userMessage: 'Verification code has expired. Please request a new one.',
          isRecoverable: true,
          recoveryAction: 'resend',
        };
      }
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
        const remaining = errorData.remainingAttempts ?? 0;
        return {
          code: ErrorCode.INVALID_OTP,
          severity: ErrorSeverity.WARNING,
          message: msg,
          userMessage: remaining > 0 
            ? `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'Too many failed attempts.',
          isRecoverable: remaining > 0,
          remainingAttempts: remaining,
          recoveryAction: remaining > 0 ? 'resend' : undefined,
        };
      }
      if (msg.toLowerCase().includes('max') || msg.toLowerCase().includes('attempt')) {
        return {
          code: ErrorCode.MAX_OTP_ATTEMPTS,
          severity: ErrorSeverity.ERROR,
          message: msg,
          userMessage: 'Too many verification attempts. Please request a new code.',
          isRecoverable: true,
          recoveryAction: 'resend',
          locked: errorData.locked || true,
        };
      }
    }

    if (msg.toLowerCase().includes('password')) {
      if (msg.toLowerCase().includes('weak')) {
        return {
          code: ErrorCode.WEAK_PASSWORD,
          severity: ErrorSeverity.WARNING,
          message: msg,
          userMessage: msg || 'Password does not meet strength requirements.',
          isRecoverable: true,
        };
      }
      if (msg.toLowerCase().includes('mismatch') || msg.toLowerCase().includes('do not match')) {
        return {
          code: ErrorCode.PASSWORD_MISMATCH,
          severity: ErrorSeverity.WARNING,
          message: msg,
          userMessage: 'Passwords do not match. Please try again.',
          isRecoverable: true,
        };
      }
      if (msg.toLowerCase().includes('incorrect')) {
        return {
          code: ErrorCode.CURRENT_PASSWORD_INCORRECT,
          severity: ErrorSeverity.WARNING,
          message: msg,
          userMessage: 'Current password is incorrect.',
          isRecoverable: true,
        };
      }
    }

    return {
      code: ErrorCode.VALIDATION_ERROR,
      severity: ErrorSeverity.WARNING,
      message: msg || 'Validation failed',
      userMessage: msg || 'Please check your input and try again.',
      isRecoverable: true,
    };
  }

  // ── Unauthorized errors (401) ─────────────────────────────────────────
  if (status === 401) {
    const msg = errorData.error || errorData.message || '';

    if (msg.toLowerCase().includes('2fa') || msg.toLowerCase().includes('mfa')) {
      return {
        code: ErrorCode.MFA_REQUIRED,
        severity: ErrorSeverity.WARNING,
        message: msg,
        userMessage: 'Enter your verification code to continue.',
        isRecoverable: true,
        recoveryAction: 'retry',
      };
    }

    if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('session')) {
      return {
        code: ErrorCode.SESSION_EXPIRED,
        severity: ErrorSeverity.WARNING,
        message: msg,
        userMessage: 'Your session has expired. Please log in again.',
        isRecoverable: true,
        recoveryAction: 'login',
      };
    }

    return {
      code: ErrorCode.UNAUTHORIZED,
      severity: ErrorSeverity.WARNING,
      message: msg || 'Invalid credentials',
      userMessage: msg || 'Invalid email or password. Please try again.',
      isRecoverable: true,
    };
  }

  // ── Forbidden errors (403) ────────────────────────────────────────────
  if (status === 403) {
    return {
      code: ErrorCode.FORBIDDEN,
      severity: ErrorSeverity.ERROR,
      message: 'Access denied',
      userMessage: 'You do not have permission to perform this action.',
      isRecoverable: false,
    };
  }

  // ── Not found errors (404) ────────────────────────────────────────────
  if (status === 404) {
    const msg = errorData.error || errorData.message || '';
    return {
      code: ErrorCode.NOT_FOUND,
      severity: ErrorSeverity.WARNING,
      message: msg || 'Resource not found',
      userMessage: msg || 'The requested resource was not found.',
      isRecoverable: false,
    };
  }

  // ── Conflict errors (409) ─────────────────────────────────────────────
  if (status === 409) {
    const msg = errorData.error || errorData.message || '';
    return {
      code: ErrorCode.CONFLICT,
      severity: ErrorSeverity.WARNING,
      message: msg || 'Conflict',
      userMessage: msg || 'This resource already exists.',
      isRecoverable: true,
    };
  }

  // ── Rate limiting errors (429) ────────────────────────────────────────
  if (status === 429) {
    const retryAfter = errorData.retryAfter || 
                       parseInt(error.response?.headers?.['retry-after'] || '60', 10) || 
                       60;
    return {
      code: ErrorCode.RATE_LIMITED,
      severity: ErrorSeverity.WARNING,
      message: 'Too many requests',
      userMessage: `Too many requests. Please wait ${retryAfter} seconds and try again.`,
      isRecoverable: true,
      recoveryAction: 'retry',
      retryAfterSeconds: retryAfter,
    };
  }

  // ── Server errors (5xx) ───────────────────────────────────────────────
  if (status >= 500) {
    if (status === 503) {
      return {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        severity: ErrorSeverity.CRITICAL,
        message: 'Service temporarily unavailable',
        userMessage: 'Our service is temporarily unavailable. Please try again later.',
        isRecoverable: true,
        recoveryAction: 'retry',
      };
    }

    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: 'Internal server error',
      userMessage: 'A server error occurred. Please try again or contact support.',
      isRecoverable: true,
      recoveryAction: 'retry',
    };
  }

  // Default error
  const msg = errorData.error || errorData.message || 'An error occurred';
  return {
    ...defaultError,
    message: msg,
    userMessage: msg,
  };
}

// ============================================================================
// ERROR DISPLAY UTILITIES
// ============================================================================

/**
 * Display an error to the user using toast/modal
 */
export function displayError(
  error: any,
  options: DisplayErrorOptions = {}
): void {
  const {
    showToast = true,
    showModal = false,
    duration = 3000,
    onDismiss,
  } = options;

  const parsed = parseApiError(error);

  if (showToast) {
    const toastFn = parsed.severity === ErrorSeverity.ERROR || 
                    parsed.severity === ErrorSeverity.CRITICAL 
      ? toast.error 
      : toast.warning;

    toastFn(parsed.userMessage, {
      duration,
      onDismiss,
    });
  }

  if (showModal) {
    // Modal display would be handled by the calling component
    // This is a placeholder for modal integration
    console.error('[Error Modal]', parsed.userMessage);
  }
}

/**
 * Extract field-level validation errors from parsed error
 */
export function getFieldErrors(error: any): Record<string, string> {
  const parsed = parseApiError(error);
  return parsed.fieldErrors || {};
}

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverable(error: any): boolean {
  return parseApiError(error).isRecoverable;
}

/**
 * Get the recovery action for an error
 */
export function getRecoveryAction(error: any): 'retry' | 'resend' | 'reset' | 'refresh' | 'login' | undefined {
  return parseApiError(error).recoveryAction;
}

/**
 * Format retry timer for display (e.g., "Retry in 30s")
 */
export function formatRetryTimer(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

/**
 * Check if user should wait before retrying (based on rate limit)
 */
export function shouldWait(error: any): boolean {
  const parsed = parseApiError(error);
  return parsed.code === ErrorCode.RATE_LIMITED ||
         parsed.code === ErrorCode.TOO_MANY_REQUESTS;
}

/**
 * Get retry-after seconds from error
 */
export function getRetryAfterSeconds(error: any): number | null {
  return parseApiError(error).retryAfterSeconds || null;
}

/**
 * Check if the error represents a locked account/resource
 */
export function isLocked(error: any): boolean {
  return parseApiError(error).locked || false;
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(error: any): number | null {
  return parseApiError(error).remainingAttempts || null;
}

/**
 * Log error for debugging
 */
export function logError(error: any, context?: Record<string, any>): void {
  const parsed = parseApiError(error);

  const logEntry = {
    timestamp: new Date().toISOString(),
    code: parsed.code,
    severity: parsed.severity,
    message: parsed.message,
    userMessage: parsed.userMessage,
    context,
    fieldErrors: parsed.fieldErrors,
    isRecoverable: parsed.isRecoverable,
  };

  if (parsed.severity === ErrorSeverity.CRITICAL) {
    console.error('[CRITICAL]', logEntry);
  } else if (parsed.severity === ErrorSeverity.ERROR) {
    console.error('[ERROR]', logEntry);
  } else {
    console.warn('[WARNING]', logEntry);
  }

  // Send to error tracking service if needed (e.g., Sentry)
  // trackError(logEntry);
}

/**
 * Handle recovery action for an error
 */
export async function handleRecoveryAction(
  error: any,
  actions: {
    retry?: () => Promise<void>;
    resend?: () => Promise<void>;
    reset?: () => Promise<void>;
    refresh?: () => Promise<void>;
    login?: () => Promise<void>;
  }
): Promise<void> {
  const action = getRecoveryAction(error);

  if (!action) {
    console.warn('[Recovery] No recovery action available for error');
    return;
  }

  const actionFn = actions[action];
  if (!actionFn) {
    console.warn(`[Recovery] Action '${action}' not implemented`);
    return;
  }

  try {
    await actionFn();
  } catch (recoveryError) {
    console.error(`[Recovery] Action '${action}' failed:`, recoveryError);
    throw recoveryError;
  }
}

// ============================================================================
// REACT HOOK FOR ERROR HANDLING
// ============================================================================

/**
 * React hook for managing error state and recovery
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<ParsedError | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const retryTimerRef = React.useRef<NodeJS.Timeout>();

  const handleError = React.useCallback((err: any) => {
    const parsed = parseApiError(err);
    setError(parsed);
    displayError(err, { showToast: true });
    logError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback(async (retryFn: () => Promise<void>) => {
    if (!error?.isRecoverable) {
      console.warn('[Retry] Error is not recoverable');
      return;
    }

    if (error.retryAfterSeconds && error.retryAfterSeconds > 0) {
      setIsRetrying(true);
      let remaining = error.retryAfterSeconds;

      retryTimerRef.current = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          setIsRetrying(false);
          clearInterval(retryTimerRef.current);
        }
      }, 1000);

      return;
    }

    try {
      setIsRetrying(true);
      await retryFn();
      clearError();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRetrying(false);
    }
  }, [error, handleError, clearError]);

  React.useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
      }
    };
  }, []);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry,
  };
}

// Import React for the hook
import React from 'react';
