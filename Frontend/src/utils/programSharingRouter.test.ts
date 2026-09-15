import { describe, test, expect } from 'vitest';
import {
  UserType,
  routeUserForProgramSharing,
  determineUserType,
  extractProgramIdFromUrl,
  isValidProgramId,
} from './programSharingRouter';

/**
 * Unit Tests for Program Sharing Router
 * 
 * Tests all routing table combinations and edge cases for the program sharing feature.
 * 
 * **Validates: Requirements 3.1, 3.5, 7.1, 7.2**
 * **Property 4: Routing Determinism** — Same input combinations always route to same target path
 */

describe('Program Sharing Router', () => {
  describe('isValidProgramId', () => {
    test('should accept valid UUID format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];

      validUUIDs.forEach(uuid => {
        expect(isValidProgramId(uuid)).toBe(true);
      });
    });

    test('should accept valid UUID in lowercase', () => {
      expect(isValidProgramId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    test('should accept valid UUID in uppercase', () => {
      expect(isValidProgramId('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    test('should accept valid UUID with mixed case', () => {
      expect(isValidProgramId('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
    });

    test('should reject invalid UUID format', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123-456-789',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '550e8400-e29b-31d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
      ];

      invalidUUIDs.forEach(uuid => {
        expect(isValidProgramId(uuid)).toBe(false);
      });
    });

    test('should reject null or undefined', () => {
      expect(isValidProgramId(null)).toBe(false);
      expect(isValidProgramId(undefined)).toBe(false);
    });

    test('should reject empty string', () => {
      expect(isValidProgramId('')).toBe(false);
    });

    test('should reject non-string types', () => {
      expect(isValidProgramId(123 as any)).toBe(false);
      expect(isValidProgramId({} as any)).toBe(false);
      expect(isValidProgramId([] as any)).toBe(false);
    });
  });

  describe('determineUserType', () => {
    test('should return Authenticated when isAuthenticated is true', () => {
      expect(determineUserType(true)).toBe(UserType.Authenticated);
    });

    test('should return Unauthenticated when isAuthenticated is false', () => {
      expect(determineUserType(false)).toBe(UserType.Unauthenticated);
    });
  });

  describe('extractProgramIdFromUrl', () => {
    test('should extract program_id from URLSearchParams', () => {
      const params = new URLSearchParams('program_id=550e8400-e29b-41d4-a716-446655440000');
      const result = extractProgramIdFromUrl(params);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should extract program_id from query string', () => {
      const queryString = '?program_id=550e8400-e29b-41d4-a716-446655440000';
      const result = extractProgramIdFromUrl(queryString);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should return null when program_id is missing', () => {
      const params = new URLSearchParams('other_param=value');
      expect(extractProgramIdFromUrl(params)).toBeNull();
    });

    test('should return null when query string is empty', () => {
      expect(extractProgramIdFromUrl('')).toBeNull();
      expect(extractProgramIdFromUrl(new URLSearchParams())).toBeNull();
    });

    test('should handle multiple query parameters', () => {
      const queryString = '?utm_source=facebook&program_id=550e8400-e29b-41d4-a716-446655440000&utm_medium=social';
      const result = extractProgramIdFromUrl(queryString);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should handle URLSearchParams with multiple parameters', () => {
      const params = new URLSearchParams('utm_source=facebook&program_id=550e8400-e29b-41d4-a716-446655440000');
      const result = extractProgramIdFromUrl(params);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('routeUserForProgramSharing - Routing Table', () => {
    const VALID_PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440000';

    describe('Authenticated user + Program Present', () => {
      test('should route to program detail page', () => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          VALID_PROGRAM_ID
        );

        expect(decision.targetPath).toBe(`/programs/${VALID_PROGRAM_ID}`);
        expect(decision.preserveProgram).toBe(true);
      });

      test('should return program-preserving path', () => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          VALID_PROGRAM_ID
        );

        expect(decision.preserveProgram).toBe(true);
      });
    });

    describe('Authenticated user + Program Absent', () => {
      test('should route to dashboard', () => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          null
        );

        expect(decision.targetPath).toBe('/dashboard');
      });

      test('should not preserve program', () => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          null
        );

        expect(decision.preserveProgram).toBe(false);
      });

      test('should route to dashboard when program ID is undefined', () => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          undefined
        );

        expect(decision.targetPath).toBe('/dashboard');
      });

      test('should route to dashboard when program ID is empty string', () => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          ''
        );

        expect(decision.targetPath).toBe('/dashboard');
      });
    });

    describe('Unauthenticated user + Program Present', () => {
      test('should route to login page', () => {
        const decision = routeUserForProgramSharing(
          UserType.Unauthenticated,
          VALID_PROGRAM_ID
        );

        expect(decision.targetPath).toBe('/login');
      });

      test('should preserve program context', () => {
        const decision = routeUserForProgramSharing(
          UserType.Unauthenticated,
          VALID_PROGRAM_ID
        );

        expect(decision.preserveProgram).toBe(true);
      });
    });

    describe('Unauthenticated user + Program Absent', () => {
      test('should route to login page (normal behavior)', () => {
        const decision = routeUserForProgramSharing(
          UserType.Unauthenticated,
          null
        );

        expect(decision.targetPath).toBe('/login');
      });

      test('should not preserve program', () => {
        const decision = routeUserForProgramSharing(
          UserType.Unauthenticated,
          null
        );

        expect(decision.preserveProgram).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    const VALID_PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440000';

    test('should handle invalid program ID format for authenticated user', () => {
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        'invalid-program-id'
      );

      // Invalid program ID should be treated as absent
      expect(decision.targetPath).toBe('/dashboard');
      expect(decision.preserveProgram).toBe(false);
    });

    test('should handle invalid program ID format for unauthenticated user', () => {
      const decision = routeUserForProgramSharing(
        UserType.Unauthenticated,
        'not-a-valid-uuid'
      );

      // Invalid program ID should be treated as absent, still go to login
      expect(decision.targetPath).toBe('/login');
      expect(decision.preserveProgram).toBe(false);
    });

    test('should treat malicious input safely', () => {
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        '../../../etc/passwd'
      );

      // Should treat as invalid program ID
      expect(decision.targetPath).toBe('/dashboard');
      expect(decision.preserveProgram).toBe(false);
    });

    test('should handle extremely long program ID', () => {
      const longId = 'a'.repeat(1000);
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        longId
      );

      expect(decision.targetPath).toBe('/dashboard');
      expect(decision.preserveProgram).toBe(false);
    });

    test('should handle special characters in program ID', () => {
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        '<script>alert("xss")</script>'
      );

      expect(decision.targetPath).toBe('/dashboard');
      expect(decision.preserveProgram).toBe(false);
    });
  });

  describe('Routing Determinism (Property 4)', () => {
    const VALID_PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440000';

    test('should produce same route for authenticated user with program (determinism)', () => {
      const decision1 = routeUserForProgramSharing(
        UserType.Authenticated,
        VALID_PROGRAM_ID
      );
      const decision2 = routeUserForProgramSharing(
        UserType.Authenticated,
        VALID_PROGRAM_ID
      );
      const decision3 = routeUserForProgramSharing(
        UserType.Authenticated,
        VALID_PROGRAM_ID
      );

      expect(decision1.targetPath).toBe(decision2.targetPath);
      expect(decision2.targetPath).toBe(decision3.targetPath);
      expect(decision1.preserveProgram).toBe(decision2.preserveProgram);
      expect(decision2.preserveProgram).toBe(decision3.preserveProgram);
    });

    test('should produce same route for authenticated user without program (determinism)', () => {
      const decision1 = routeUserForProgramSharing(UserType.Authenticated, null);
      const decision2 = routeUserForProgramSharing(UserType.Authenticated, null);
      const decision3 = routeUserForProgramSharing(UserType.Authenticated, null);

      expect(decision1.targetPath).toBe(decision2.targetPath);
      expect(decision2.targetPath).toBe(decision3.targetPath);
      expect(decision1.preserveProgram).toBe(decision2.preserveProgram);
    });

    test('should produce same route for unauthenticated user with program (determinism)', () => {
      const decision1 = routeUserForProgramSharing(
        UserType.Unauthenticated,
        VALID_PROGRAM_ID
      );
      const decision2 = routeUserForProgramSharing(
        UserType.Unauthenticated,
        VALID_PROGRAM_ID
      );
      const decision3 = routeUserForProgramSharing(
        UserType.Unauthenticated,
        VALID_PROGRAM_ID
      );

      expect(decision1.targetPath).toBe(decision2.targetPath);
      expect(decision2.targetPath).toBe(decision3.targetPath);
      expect(decision1.preserveProgram).toBe(decision2.preserveProgram);
    });

    test('should produce same route for unauthenticated user without program (determinism)', () => {
      const decision1 = routeUserForProgramSharing(
        UserType.Unauthenticated,
        null
      );
      const decision2 = routeUserForProgramSharing(
        UserType.Unauthenticated,
        null
      );
      const decision3 = routeUserForProgramSharing(
        UserType.Unauthenticated,
        null
      );

      expect(decision1.targetPath).toBe(decision2.targetPath);
      expect(decision2.targetPath).toBe(decision3.targetPath);
      expect(decision1.preserveProgram).toBe(decision2.preserveProgram);
    });
  });

  describe('Multiple Program IDs and Routing Consistency', () => {
    test('should route consistently across different valid program IDs', () => {
      const programIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '12345678-1234-4234-b234-123456789012',
      ];

      programIds.forEach(programId => {
        const decision = routeUserForProgramSharing(
          UserType.Authenticated,
          programId
        );

        expect(decision.targetPath).toBe(`/programs/${programId}`);
        expect(decision.preserveProgram).toBe(true);
      });
    });

    test('should handle program ID case variations consistently', () => {
      const programIdLower = '550e8400-e29b-41d4-a716-446655440000';
      const programIdUpper = '550E8400-E29B-41D4-A716-446655440000';

      const decision1 = routeUserForProgramSharing(UserType.Authenticated, programIdLower);
      const decision2 = routeUserForProgramSharing(UserType.Authenticated, programIdUpper);

      // Both should be valid and route to the same logical path
      expect(decision1.preserveProgram).toBe(true);
      expect(decision2.preserveProgram).toBe(true);
      expect(decision1.targetPath).toBe(`/programs/${programIdLower}`);
      expect(decision2.targetPath).toBe(`/programs/${programIdUpper}`);
    });
  });

  describe('Integration with URL extraction', () => {
    test('should work with extracted program ID from URL', () => {
      const queryString = '?program_id=550e8400-e29b-41d4-a716-446655440000';
      const extractedProgramId = extractProgramIdFromUrl(queryString);
      
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        extractedProgramId
      );

      expect(decision.targetPath).toBe('/programs/550e8400-e29b-41d4-a716-446655440000');
      expect(decision.preserveProgram).toBe(true);
    });

    test('should handle missing program ID from URL extraction', () => {
      const queryString = '?other_param=value';
      const extractedProgramId = extractProgramIdFromUrl(queryString);
      
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        extractedProgramId
      );

      expect(decision.targetPath).toBe('/dashboard');
      expect(decision.preserveProgram).toBe(false);
    });
  });

  describe('Requirements Validation', () => {
    /**
     * Requirement 3.1: User-type detection routes appropriately
     */
    test('should satisfy Requirement 3.1 - detect and route authenticated users with program', () => {
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(decision.targetPath).toMatch(/^\/programs\//);
      expect(decision.preserveProgram).toBe(true);
    });

    /**
     * Requirement 3.5: Route unauthenticated users to login
     */
    test('should satisfy Requirement 3.5 - route unauthenticated users with program to login', () => {
      const decision = routeUserForProgramSharing(
        UserType.Unauthenticated,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(decision.targetPath).toBe('/login');
    });

    /**
     * Requirement 7.1: Normal operation without program reference
     */
    test('should satisfy Requirement 7.1 - route authenticated user to dashboard without program', () => {
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        null
      );

      expect(decision.targetPath).toBe('/dashboard');
      expect(decision.preserveProgram).toBe(false);
    });

    /**
     * Requirement 7.2: Router without program follows standard logic
     */
    test('should satisfy Requirement 7.2 - router without program uses standard routing', () => {
      const authenticatedDecision = routeUserForProgramSharing(
        UserType.Authenticated,
        null
      );
      const unauthenticatedDecision = routeUserForProgramSharing(
        UserType.Unauthenticated,
        null
      );

      expect(authenticatedDecision.targetPath).toBe('/dashboard');
      expect(unauthenticatedDecision.targetPath).toBe('/login');
    });
  });
});
