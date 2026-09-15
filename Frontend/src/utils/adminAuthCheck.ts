/**
 * Admin Authorization Check Utility
 *
 * Verifies that the current user has admin role before accessing admin panel
 * Provides checks for admin status and role-based access control
 *
 * Requirements: 12.1, 12.2, 12.3
 */

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthCheckResult {
  isAuthorized: boolean;
  message: string;
  user?: AuthUser;
}

/**
 * Check if user has admin role
 *
 * @param user - Current authenticated user
 * @returns true if user has admin or superadmin role
 */
export function isUserAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  const adminRoles = ['admin', 'superadmin'];
  return adminRoles.includes(user.role.toLowerCase());
}

/**
 * Check if user has superadmin role
 *
 * @param user - Current authenticated user
 * @returns true if user has superadmin role
 */
export function isUserSuperAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return user.role.toLowerCase() === 'superadmin';
}

/**
 * Get current user from storage or session
 *
 * @returns Current authenticated user or null
 */
export function getCurrentUser(): AuthUser | null {
  try {
    // Try to get from localStorage first
    const userJson = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
    if (userJson) {
      return JSON.parse(userJson) as AuthUser;
    }
  } catch (error) {
    console.error('[Auth Check Error]', error);
  }

  return null;
}

/**
 * Check admin authorization for accessing admin panel
 *
 * @returns Authorization check result with message
 */
export function checkAdminAuthorization(): AuthCheckResult {
  const user = getCurrentUser();

  if (!user) {
    return {
      isAuthorized: false,
      message: 'You must be logged in to access the admin panel',
    };
  }

  if (!isUserAdmin(user)) {
    return {
      isAuthorized: false,
      message: `Access denied. Your role '${user.role}' does not have permission to access the admin panel. Only admin and superadmin users can access this area.`,
      user,
    };
  }

  return {
    isAuthorized: true,
    message: `Welcome, ${user.email}!`,
    user,
  };
}

/**
 * Validate that user can perform admin operation
 *
 * @param operation - Operation name (e.g., 'save_settings', 'delete_version')
 * @param user - User to check (uses current user if not provided)
 * @returns true if authorized
 */
export function isOperationAuthorized(operation: string, user?: AuthUser | null): boolean {
  const userToCheck = user || getCurrentUser();

  if (!userToCheck) {
    return false;
  }

  // Admin-only operations
  const adminOperations = ['save_settings', 'delete_version', 'delete_audit_log'];

  // Superadmin-only operations
  const superadminOperations = ['delete_all_settings', 'reset_system'];

  if (superadminOperations.includes(operation)) {
    return isUserSuperAdmin(userToCheck);
  }

  if (adminOperations.includes(operation)) {
    return isUserAdmin(userToCheck);
  }

  // Default: allow if admin
  return isUserAdmin(userToCheck);
}

/**
 * Create error message for unauthorized access
 *
 * @param reason - Reason for denial
 * @returns Formatted error message
 */
export function createUnauthorizedError(reason: string): Error {
  return new Error(`Unauthorized: ${reason}`);
}

/**
 * Get user display name
 *
 * @param user - User object
 * @returns Display name (email or fallback)
 */
export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) {
    return 'Unknown User';
  }

  return user.email || `User ${user.id}`;
}

/**
 * Format role name for display
 *
 * @param role - Role string
 * @returns Formatted role name
 */
export function formatRoleName(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if user can edit settings (not just view)
 *
 * @param user - User to check
 * @returns true if user can edit
 */
export function canEditSettings(user: AuthUser | null | undefined): boolean {
  return isUserAdmin(user);
}

/**
 * Check if user can delete versions
 *
 * @param user - User to check
 * @returns true if user can delete
 */
export function canDeleteVersions(user: AuthUser | null | undefined): boolean {
  return isUserSuperAdmin(user);
}

/**
 * Check if user can view audit logs
 *
 * @param user - User to check
 * @returns true if user can view
 */
export function canViewAuditLogs(user: AuthUser | null | undefined): boolean {
  return isUserAdmin(user);
}
