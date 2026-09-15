/**
 * Tests for useRequirementDefinition Hook
 *
 * Tests cover:
 * - Successful data fetching with caching
 * - Error handling and graceful 404 responses
 * - Loading states
 * - Conditional queries (disabled when ID is missing)
 *
 * **Validates: Requirements FR1.1, FR2.2 - Frontend data fetching layer**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRequirementDefinition } from './useRequirementDefinition';
import api from '../services/api';
import logger from '../utils/logger';

// Mock dependencies
vi.mock('../services/api');
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock data
const mockRequirementDefinition = {
  id: 'req-uuid-001',
  tenant_id: 'tenant-uuid-001',
  requirement_type: 'accomplished_learners_profile_form',
  display_name: "Accomplished Learner's Profile Form",
  description: 'A form documenting the trainee\'s learning journey...',
  is_mandatory: true,
  is_active: true,
  applicability_rules: null,
  display_order: 1,
  submission_stats: {
    total_trainees: 100,
    pending_count: 30,
    submitted_count: 40,
    verified_count: 25,
    rejected_count: 5,
    completion_rate: 50,
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  deleted_at: null,
};

describe('useRequirementDefinition', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  /**
   * Helper function to render hook with QueryClientProvider
   */
  const renderHookWithProvider = (
    hook: () => ReturnType<typeof useRequirementDefinition>,
    initialClient?: QueryClient
  ) => {
    const client = initialClient || queryClient;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return renderHook(hook, { wrapper });
  };

  describe('Successful Fetching', () => {
    it('should fetch and return requirement definition', async () => {
      // Mock successful API response
      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: mockRequirementDefinition,
      });

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001')
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify data is returned correctly
      expect(result.current.data).toEqual(mockRequirementDefinition);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();

      // Verify API was called correctly
      expect(api.get).toHaveBeenCalledWith('/requirement-definitions/req-uuid-001');
    });

    it('should cache data and not refetch on remount', async () => {
      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: mockRequirementDefinition,
      });

      // First render
      const { result: result1 } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001'),
        queryClient
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Verify API called once
      expect(api.get).toHaveBeenCalledTimes(1);

      // Second render with same ID should use cached data
      const { result: result2 } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001'),
        queryClient
      );

      // Should immediately have data (cached)
      expect(result2.current.data).toEqual(mockRequirementDefinition);

      // API should still have been called only once
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should include submission stats in response', async () => {
      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: mockRequirementDefinition,
      });

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.submission_stats).toEqual({
        total_trainees: 100,
        pending_count: 30,
        submitted_count: 40,
        verified_count: 25,
        rejected_count: 5,
        completion_rate: 50,
      });
    });

    it('should fetch different requirement types', async () => {
      const marriageCertReq = {
        ...mockRequirementDefinition,
        id: 'req-uuid-003',
        requirement_type: 'marriage_certificate',
        display_name: 'Photocopy of Marriage Certificate',
        is_mandatory: false,
        applicability_rules: { marital_status: 'married' },
      };

      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: marriageCertReq,
      });

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-003')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.applicability_rules).toEqual({
        marital_status: 'married',
      });
      expect(result.current.data?.is_mandatory).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const notFoundError = new Error('Request failed with status code 404');
      (notFoundError as any).status = 404;
      (api.get as any).mockRejectedValueOnce(notFoundError);

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('nonexistent-id')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have null data, not throw error
      expect(result.current.data).toBeNull();
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not call API when requirementId is missing', () => {
      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition(undefined)
      );

      // Should not call API if ID is missing
      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should not call API when requirementId is empty string', () => {
      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('')
      );

      // Should not call API for empty ID
      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      (api.get as any).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001')
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.isError).toBe(false);
    });
  });

  describe('Conditional Queries', () => {
    it('should not query if enabled is false', () => {
      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001', { enabled: false })
      );

      // Should not call API if disabled
      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should query when enabled is explicitly true', async () => {
      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: mockRequirementDefinition,
      });

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001', { enabled: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockRequirementDefinition);
    });
  });

  describe('Different Requirement Types', () => {
    it('should fetch birth certificate requirement with null applicability rules', async () => {
      const birthCertReq = {
        ...mockRequirementDefinition,
        id: 'req-uuid-002',
        requirement_type: 'birth_certificate',
        display_name: 'Photocopy of Birth Certificate',
        applicability_rules: null,
      };

      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: birthCertReq,
      });

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-002')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.applicability_rules).toBeNull();
      expect(result.current.data?.requirement_type).toBe('birth_certificate');
    });
  });

  describe('Null Data Handling', () => {
    it('should handle API returning null data', async () => {
      (api.get as any).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      const { result } = renderHookWithProvider(() =>
        useRequirementDefinition('req-uuid-001')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isError).toBe(false);
    });
  });
});
