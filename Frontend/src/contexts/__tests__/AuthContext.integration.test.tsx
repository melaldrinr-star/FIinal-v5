/**
 * Integration Tests for AuthContext with Post-Auth Handler
 * 
 * Tests the integration of Post-Auth Handler utility into AuthContext login/signup methods.
 * Validates: Requirements 4.1, 4.2, 5.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import { handlePostAuth } from '../../utils/postAuthHandler';
import authService from '../../services/authService';

// Mock dependencies
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    selectTenant: vi.fn(),
  },
}));

vi.mock('../../utils/postAuthHandler', () => ({
  handlePostAuth: vi.fn(),
}));

vi.mock('../../utils/activityLogger', () => ({
  authLogger: {
    login: vi.fn(),
    logout: vi.fn(),
    loginFailed: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AuthContext - Post-Auth Handler Integration', () => {
  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'trainee' as const,
    tenantId: 'tenant-456',
    tenantName: 'Test Tenant',
  };

  const mockProgramId = 'prog-789';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Default mock implementation
    vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(handlePostAuth).mockResolvedValue({
      targetPath: '/dashboard',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  /**
   * Test Suite: Login with Post-Auth Handler Integration
   */
  describe('login() with Post-Auth Handler', () => {
    /**
     * Test 1.1: Login Without Program Context
     * Validates: Requirement 4.3
     */
    it('should redirect to dashboard when no program_id in localStorage', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(true);
      expect(handlePostAuth).toHaveBeenCalledWith('user-123', 'login');
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
    });

    /**
     * Test 2.1: Login With Program Context - Valid Access
     * Validates: Requirements 4.1, 4.2
     */
    it('should redirect to program page when program_id stored and access granted', async () => {
      // Arrange
      localStorage.setItem('selected_program_id', mockProgramId);

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: `/programs/${mockProgramId}`,
        programId: mockProgramId,
        permissionDenied: false,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(true);
      expect(handlePostAuth).toHaveBeenCalledWith('user-123', 'login');
      expect(result.current.getPostAuthRedirectPath()).toBe(`/programs/${mockProgramId}`);
    });

    /**
     * Test 3.1: Login With Program Context - Access Denied
     * Validates: Requirements 4.1, 4.2
     */
    it('should redirect to dashboard when program_id stored but access denied', async () => {
      // Arrange
      localStorage.setItem('selected_program_id', mockProgramId);

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
        programId: mockProgramId,
        permissionDenied: true,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(true);
      expect(handlePostAuth).toHaveBeenCalledWith('user-123', 'login');
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
    });

    /**
     * Test 4.1: Login - Post-Auth Handler Called with Correct Context
     * Validates: Requirement 4.1
     */
    it('should call handlePostAuth with login context', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(handlePostAuth).toHaveBeenCalledWith(mockUser.id, 'login');
      expect(handlePostAuth).toHaveBeenCalledTimes(1);
    });

    /**
     * Test 5.1: Login - Backward Compatibility (no program context)
     * Validates: Requirement 4.3
     */
    it('should maintain backward compatibility - existing flows still work', async () => {
      // Arrange - no program context
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe(mockUser.id);
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
    });

    /**
     * Test 6.1: Login - Multi-Tenant Selection
     * Validates: Requirement 4.1
     */
    it('should not call handlePostAuth during multi-tenant selection', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue({
        requires_tenant_selection: true,
        selection_token: 'token-123',
        tenants: [
          { id: 'tenant-1', name: 'Tenant 1', is_primary: true },
          { id: 'tenant-2', name: 'Tenant 2', is_primary: false },
        ],
      } as any);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).not.toBe(true);
      expect((loginResult as any)?.requiresTenantSelection).toBe(true);
      expect(handlePostAuth).not.toHaveBeenCalled();
    });

    /**
     * Test 7.1: Login - API Error Handling
     * Validates: Requirement 4.1
     */
    it('should handle API errors gracefully', async () => {
      // Arrange
      vi.mocked(authService.login).mockRejectedValue(new Error('Network error'));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(handlePostAuth).not.toHaveBeenCalled();
    });
  });

  /**
   * Test Suite: Select Tenant with Post-Auth Handler Integration
   */
  describe('selectTenant() with Post-Auth Handler', () => {
    /**
     * Test 1.1: Select Tenant Without Program Context
     * Validates: Requirement 4.3
     */
    it('should redirect to dashboard after tenant selection without program_id', async () => {
      // Arrange
      vi.mocked(authService.selectTenant).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const selectResult = await act(async () => {
        return await result.current.selectTenant('token-123', 'tenant-456');
      });

      // Assert
      expect(selectResult).toBe(true);
      expect(handlePostAuth).toHaveBeenCalledWith('user-123', 'login');
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
    });

    /**
     * Test 2.1: Select Tenant With Program Context
     * Validates: Requirements 4.1, 4.2
     */
    it('should redirect to program page after tenant selection with program_id', async () => {
      // Arrange
      localStorage.setItem('selected_program_id', mockProgramId);

      vi.mocked(authService.selectTenant).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: `/programs/${mockProgramId}`,
        programId: mockProgramId,
        permissionDenied: false,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const selectResult = await act(async () => {
        return await result.current.selectTenant('token-123', 'tenant-456');
      });

      // Assert
      expect(selectResult).toBe(true);
      expect(handlePostAuth).toHaveBeenCalledWith('user-123', 'login');
      expect(result.current.getPostAuthRedirectPath()).toBe(`/programs/${mockProgramId}`);
    });

    /**
     * Test 3.1: Select Tenant - Post-Auth Handler Called
     * Validates: Requirement 4.1
     */
    it('should call handlePostAuth after successful tenant selection', async () => {
      // Arrange
      vi.mocked(authService.selectTenant).mockResolvedValue({
        user: mockUser,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.selectTenant('token-123', 'tenant-456');
      });

      // Assert
      expect(handlePostAuth).toHaveBeenCalledWith(mockUser.id, 'login');
      expect(handlePostAuth).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test Suite: Post-Auth Redirect Path Management
   */
  describe('getPostAuthRedirectPath()', () => {
    /**
     * Test 1.1: Get Post-Auth Redirect Path After Login
     * Validates: Requirement 4.1
     */
    it('should return the post-auth redirect path after login', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
    });

    /**
     * Test 2.1: Get Post-Auth Redirect Path for Program
     * Validates: Requirement 4.2
     */
    it('should return program page path when redirecting to program', async () => {
      // Arrange
      localStorage.setItem('selected_program_id', mockProgramId);

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: `/programs/${mockProgramId}`,
        programId: mockProgramId,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(result.current.getPostAuthRedirectPath()).toBe(`/programs/${mockProgramId}`);
    });

    /**
     * Test 3.1: Get Post-Auth Redirect Path Before Login
     * Validates: Requirement 4.1
     */
    it('should return null before any login attempt', async () => {
      // Arrange
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act & Assert
      expect(result.current.getPostAuthRedirectPath()).toBeNull();
    });
  });

  /**
   * Test Suite: Logout with Post-Auth Cleanup
   */
  describe('logout() - Clear post-auth state', () => {
    /**
     * Test 1.1: Logout Clears Post-Auth Redirect Path
     * Validates: Requirement 6.2
     */
    it('should clear post-auth redirect path on logout', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: `/programs/${mockProgramId}`,
        programId: mockProgramId,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.getPostAuthRedirectPath()).toBe(`/programs/${mockProgramId}`);

      // Act - Logout
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(result.current.getPostAuthRedirectPath()).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  /**
   * Test Suite: Integration - Complete Flows
   */
  describe('Complete Auth Flows', () => {
    /**
     * Test 1.1: Complete Login Flow - No Program
     * Validates: Requirement 4.3
     */
    it('should handle complete login flow without program context', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
      expect(handlePostAuth).toHaveBeenCalledWith(mockUser.id, 'login');
    });

    /**
     * Test 2.1: Complete Login Flow - With Program
     * Validates: Requirements 4.1, 4.2, 5.1
     */
    it('should handle complete login flow with program context', async () => {
      // Arrange
      localStorage.setItem('selected_program_id', mockProgramId);

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: `/programs/${mockProgramId}`,
        programId: mockProgramId,
        permissionDenied: false,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(loginResult).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.getPostAuthRedirectPath()).toBe(`/programs/${mockProgramId}`);
      expect(handlePostAuth).toHaveBeenCalledWith(mockUser.id, 'login');
    });

    /**
     * Test 3.1: Permission Check During Post-Auth
     * Validates: Requirement 10.1, 10.2
     */
    it('should verify permissions during post-auth handling', async () => {
      // Arrange
      localStorage.setItem('selected_program_id', mockProgramId);

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
      });

      vi.mocked(handlePostAuth).mockResolvedValue({
        targetPath: '/dashboard',
        programId: mockProgramId,
        permissionDenied: true,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Assert
      expect(handlePostAuth).toHaveBeenCalled();
      expect(result.current.getPostAuthRedirectPath()).toBe('/dashboard');
    });
  });
});
