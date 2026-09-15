/**
 * Program Sharing Router
 * 
 * Responsible for routing users to appropriate pages based on their authentication status
 * and whether they have a program pre-selected from a shared link.
 * 
 * Routing Table:
 * | User Type        | Program ID | Action |
 * |------------------|-----------|--------|
 * | Authenticated    | Present   | /programs/{programId} |
 * | Authenticated    | Absent    | /dashboard |
 * | Unauthenticated  | Present   | /login |
 * | Unauthenticated  | Absent    | /login (or default login behavior) |
 */

export enum UserType {
  Authenticated = 'authenticated',
  Unauthenticated = 'unauthenticated',
}

export interface RoutingDecision {
  targetPath: string;
  preserveProgram: boolean;
}

/**
 * Validates that a program ID is a valid UUID format
 * @param programId - The program ID to validate
 * @returns true if valid UUID format, false otherwise
 */
export function isValidProgramId(programId: string | null | undefined): boolean {
  if (!programId || typeof programId !== 'string') {
    return false;
  }

  // Standard UUID regex pattern (accepting v1, v2, v3, v4, v5)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(programId);
}

/**
 * Routes a user to the appropriate page based on their authentication status
 * and whether they have a pre-selected program from a shared link.
 * 
 * @param userType - The user's authentication status
 * @param programId - The program ID (if present from shared link)
 * @returns RoutingDecision with target path and whether to preserve program context
 * 
 * **Validates: Requirements 3.1, 3.5, 7.1, 7.2**
 */
export function routeUserForProgramSharing(
  userType: UserType,
  programId: string | null | undefined
): RoutingDecision {
  // Validate program ID format if provided
  const hasValidProgramId = isValidProgramId(programId);

  switch (userType) {
    case UserType.Authenticated:
      if (hasValidProgramId && programId) {
        // Authenticated user with program pre-selected from share link
        // Route to program detail page
        return {
          targetPath: `/programs/${programId}`,
          preserveProgram: true,
        };
      } else {
        // Authenticated user without program context
        // Route to normal dashboard
        return {
          targetPath: '/dashboard',
          preserveProgram: false,
        };
      }

    case UserType.Unauthenticated:
    default:
      if (hasValidProgramId) {
        // Unauthenticated user with program pre-selected from share link
        // Route to login page (program stored in LocalStorage for post-auth routing)
        return {
          targetPath: '/login',
          preserveProgram: true,
        };
      } else {
        // Unauthenticated user without program context
        // Route to login page (normal behavior)
        return {
          targetPath: '/login',
          preserveProgram: false,
        };
      }
  }
}

/**
 * Determines the appropriate user type based on authentication context
 * @param isAuthenticated - Whether the user is currently authenticated
 * @returns UserType enum value
 */
export function determineUserType(isAuthenticated: boolean): UserType {
  return isAuthenticated ? UserType.Authenticated : UserType.Unauthenticated;
}

/**
 * Extracts program ID from URL query parameters
 * @param searchParams - URLSearchParams object from window.location or similar
 * @returns The program_id query parameter value, or null if not present
 */
export function extractProgramIdFromUrl(searchParams: URLSearchParams | string): string | null {
  let params: URLSearchParams;

  if (typeof searchParams === 'string') {
    // Handle string input (e.g., "?program_id=abc123")
    params = new URLSearchParams(searchParams);
  } else {
    params = searchParams;
  }

  const programId = params.get('program_id');
  return programId;
}
