# Program Sharing Error Handler - Integration Guide

**Requirement Coverage**: Requirements 8.1, 8.3, 8.4

This document explains how to use the Program Sharing Error Handler utility in your components and services.

## Overview

The `programSharingErrorHandler` utility provides a centralized way to handle errors during the program sharing flow. It offers:

- **Structured error types** for different error scenarios
- **User-friendly error messages** that are non-technical and actionable
- **Logging for debugging** with context about each error
- **Automatic redirects** to safe fallback pages
- **LocalStorage cleanup** to prevent stale program references

## Error Types

The utility handles these error scenarios:

| Error Type | User Message | Fallback Path | When It Occurs |
|-----------|-------------|--------------|-----------------|
| `InvalidProgramId` | "Invalid program ID format" | `/` | Malformed UUID or null/undefined program ID |
| `InactiveProgram` | "This program is no longer available" | `/programs` | Program is deleted, expired, or disabled |
| `PermissionDenied` | "You don't have permission to access this program" | `/dashboard` | User lacks access (private program, prerequisites not met) |
| `ApiError` | "Unable to validate program. Please try again." | `/` | Network errors, timeouts, server errors |
| `NotFound` | "This program is no longer available" | `/programs` | Program doesn't exist in database |

## Basic Usage

### 1. Handling Invalid Program ID

```typescript
import { handleInvalidProgramIdError, redirectAfterError } from '@/utils/programSharingErrorHandler';

const programId = extractProgramIdFromUrl();

if (!isValidProgramId(programId)) {
  const error = handleInvalidProgramIdError(programId);
  
  // Display error to user
  toast.error(error.userMessage);
  
  // Redirect to safe page (clears LocalStorage automatically)
  redirectAfterError(error);
}
```

### 2. Handling Inactive Program

```typescript
import { handleValidationResult, redirectAfterError } from '@/utils/programSharingErrorHandler';

const validationResult = await api.get(`/programs/${programId}/validate-share`);

const error = handleValidationResult(validationResult, programId);
if (error) {
  toast.error(error.userMessage);
  redirectAfterError(error);
  return;
}
```

### 3. Handling Permission Denied

```typescript
import { handlePermissionVerificationResult, redirectAfterError } from '@/utils/programSharingErrorHandler';

const permissionResult = await api.post(`/programs/${programId}/verify-access`, { userId });

const error = handlePermissionVerificationResult(permissionResult, programId, userId);
if (error) {
  toast.error(error.userMessage);
  redirectAfterError(error);
  return;
}
```

### 4. Handling API Errors

```typescript
import { classifyAndHandleError, redirectAfterError } from '@/utils/programSharingErrorHandler';

try {
  const result = await validateProgram(programId);
} catch (apiError) {
  const error = classifyAndHandleError(apiError, programId, 'validateProgram');
  
  toast.error(error.userMessage);
  redirectAfterError(error);
}
```

## Complete Example: LinkHandlerPage Integration

Here's how to integrate the error handler into the LinkHandlerPage:

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { programSharingService } from '@/services/programSharingService';
import {
  handleInvalidProgramIdError,
  handleValidationResult,
  handlePermissionVerificationResult,
  classifyAndHandleError,
  redirectAfterError,
  logProgramSharingError,
  isValidProgramId,
} from '@/utils/programSharingErrorHandler';
import { logger } from '@/utils/logger';

export default function LinkHandlerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleProgramLink = async () => {
      try {
        setLoading(true);

        // 1. Extract program_id from query parameter
        const programId = searchParams.get('program_id');

        // 2. Handle missing or invalid program ID
        if (!isValidProgramId(programId)) {
          const error = handleInvalidProgramIdError(programId);
          toast.error(error.userMessage);
          logProgramSharingError(error, { action: 'extract_program_id' });
          redirectAfterError(error, (path) => navigate(path, { replace: true }));
          return;
        }

        // 3. Validate program exists and is active
        try {
          const validationResult = await programSharingService.validateProgramShare(
            programId as string
          );

          const validationError = handleValidationResult(validationResult, programId as string);
          if (validationError) {
            toast.error(validationError.userMessage);
            logProgramSharingError(validationError, { action: 'validate_program' });
            redirectAfterError(validationError, (path) => navigate(path, { replace: true }));
            return;
          }

          // 4. Store program_id in LocalStorage for later use
          localStorage.setItem('selected_program_id', programId as string);

          // 5. Route user based on authentication status
          if (!isAuthReady) {
            return; // Still checking auth
          }

          if (isAuthenticated) {
            // Authenticated user - route to program page
            navigate(`/programs/${programId}`, { replace: true });
          } else {
            // Unauthenticated user - route to login
            navigate('/login', { replace: true });
          }
        } catch (apiError) {
          // 6. Handle API errors with automatic classification
          const error = classifyAndHandleError(apiError, programId as string, 'validateProgram');
          toast.error(error.userMessage);
          logProgramSharingError(error, { action: 'validate_program_api' });
          redirectAfterError(error, (path) => navigate(path, { replace: true }));
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthReady) {
      handleProgramLink();
    }
  }, [searchParams, navigate, isAuthenticated, isAuthReady]);

  if (loading || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Validating program...</p>
        </div>
      </div>
    );
  }

  return null;
}
```

## Advanced Usage

### Custom Error Logging

```typescript
import { logProgramSharingError, createProgramSharingError } from '@/utils/programSharingErrorHandler';

const error = createProgramSharingError(ProgramSharingErrorType.PermissionDenied, {
  programId: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  reason: 'User has not completed prerequisites',
});

// Log with additional context
logProgramSharingError(error, {
  action: 'verify_access',
  timestamp: new Date().toISOString(),
  source: 'LinkHandlerPage',
});
```

### Error Recovery and Retry

```typescript
import { isErrorRecoverable } from '@/utils/programSharingErrorHandler';

const error = await handleProgramLink();

if (error && isErrorRecoverable(error)) {
  // Show retry button to user
  toast.error(error.userMessage, {
    action: {
      label: 'Retry',
      onClick: () => handleProgramLink(), // Retry the operation
    },
  });
} else {
  // Non-recoverable error - show fallback page
  redirectAfterError(error);
}
```

### Custom Redirect Function

```typescript
import { redirectAfterError } from '@/utils/programSharingErrorHandler';

const customRedirect = (path: string) => {
  // Use React Router instead of window.location
  navigate(path, { replace: true });
};

redirectAfterError(error, customRedirect);
```

## Testing

The error handler includes comprehensive test coverage for all error scenarios. Run tests with:

```bash
npm test -- programSharingErrorHandler.test.ts --run
```

### Test Examples

```typescript
describe('Invalid Program ID', () => {
  it('should handle null program ID', () => {
    const error = handleInvalidProgramIdError(null);
    expect(error.type).toBe(ProgramSharingErrorType.InvalidProgramId);
    expect(error.userMessage).toBe('Invalid program ID format');
    expect(error.fallbackPath).toBe('/');
  });
});

describe('Inactive Program', () => {
  it('should handle inactive program validation', () => {
    const result = {
      isValid: false,
      isActive: false,
      isPublic: true,
    };
    const error = handleValidationResult(result, '550e8400-e29b-41d4-a716-446655440000');
    expect(error?.type).toBe(ProgramSharingErrorType.InactiveProgram);
  });
});
```

## API Reference

### Error Creation

- `createProgramSharingError(type, details?)` - Create structured error object
- `handleInvalidProgramIdError(programId)` - Handle invalid ID format
- `handleInactiveProgramError(programId, reason?)` - Handle inactive program
- `handlePermissionDeniedError(programId, userId?, reason?)` - Handle permission denied
- `handleApiError(error, programId?)` - Handle API/network errors
- `handleProgramNotFoundError(programId)` - Handle not found

### Error Processing

- `handleValidationResult(validationResult, programId)` - Process validation response
- `handlePermissionVerificationResult(verifyResult, programId, userId?)` - Process permission check
- `classifyAndHandleError(apiError, programId?, context?)` - Auto-classify API errors

### Error Handling

- `logProgramSharingError(error, context?)` - Log error for debugging
- `redirectAfterError(error, redirectFn?)` - Clear storage and redirect
- `getUserFriendlyErrorMessage(error)` - Get user-friendly message
- `isErrorRecoverable(error)` - Check if user can retry

## Browser Session Persistence

The error handler automatically clears `selected_program_id` from LocalStorage when redirecting after errors, ensuring:

- **No stale program references** persist across sessions
- **Clean state** for next program link click
- **Selective deletion** - only removes program key, preserves other storage

```typescript
// Before redirect
localStorage.setItem('other_key', 'value');
localStorage.setItem('selected_program_id', 'program-id');

// After redirectAfterError()
console.log(localStorage.getItem('selected_program_id')); // null
console.log(localStorage.getItem('other_key')); // 'value' (preserved)
```

## Monitoring and Debugging

All errors are logged using the `logger` utility:

```typescript
// Error level logs
logger.error('API error during program sharing validation', {
  error: 'Network timeout',
  programId: 'program-123',
});

// Warning level logs
logger.warn('Inactive program accessed', {
  programId: 'program-456',
  reason: 'Program has been deleted',
});
```

Check browser console or centralized logging service for debugging.

## Best Practices

1. **Always validate** program ID format before API calls
2. **Use error handler** for consistent messaging across the app
3. **Log context** with errors for easier debugging
4. **Test error scenarios** with mock API responses
5. **Provide user feedback** immediately with toast notifications
6. **Clean up LocalStorage** automatically via redirectAfterError()
7. **Use custom redirects** (React Router) instead of window.location when possible

## Troubleshooting

### Error messages not displaying

```typescript
// ✓ Correct
toast.error(error.userMessage);

// ✗ Avoid
toast.error(error.message); // Technical message, not user-friendly
```

### LocalStorage not being cleared

```typescript
// ✓ Correct
redirectAfterError(error); // Clears storage automatically

// ✗ Avoid
navigate('/fallback'); // Doesn't clear storage
```

### API errors not classified correctly

```typescript
// ✓ Correct
const error = classifyAndHandleError(apiError, programId, 'operation_name');

// ✗ Avoid
throw apiError; // Lost context and classification
```
