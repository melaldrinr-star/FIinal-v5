/**
 * Tests for useRequirementsAnalytics Hook
 *
 * Covers:
 * - Successful analytics data fetching
 * - 403 Forbidden error handling for non-admin users
 * - Other error scenarios (500, network errors)
 * - Loading and error states
 * - Manual refetch capability
 * - Query options (enabled, refetchInterval)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRequirementsAnalytics } from './useRequirementsAnalytics';
import api from '../services/api';
import type { RequirementsAnalytics } from '../types/requirements';

// Mock the api service
vi.mock('../services/api');

// Mock the logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

/**
 * Create a React Query wrapper with a fresh QueryClient for each test
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests - the hook defines its own retry logic
        retry: false,
        // Disable refetch on mount/focus for tests
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Mock analytics data
 */
const mockAnalyticsData: RequirementsAnalytics = {
  by_requirement: [
    {
      requirement_id: 'req-1',
      requirement_type: 'accomplished_learners_profile',
      display_name: "Accomplished Learner's Profile Form",
      is_mandatory: true,
      completion_rate: 85.5,
      total_trainees: 100,
      verified_count: 85,
      rejected_count: 5,
      rejection_rate: 5.6, // 5 / (85 + 5)
      avg_time_to_completion_days: 3.2,
    },
    {
      requirement_id: 'req-2',
      requirement_type: 'birth_certificate',
      display_name: 'Photocopy of Birth Certificate (NSO/PSA)',
      is_mandatory: true,
      completion_rate: 90.0,
      total_trainees: 100,
      verified_count: 90,
      rejected_count: 2,
      rejection_rate: 2.2, // 2 / (90 + 2)
      avg_time_to_completion_days: 2.8,
    },
  ],
  summary: {
    total_requirements: 7,
    avg_completion_rate: 87.75,
    avg_rejection_rate: 3.9,
  },
  timestamp: new Date().toISOString(),
};

describe('useRequirementsAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful data fetching', () => {
    it('should fetch and return analytics data', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAnalyticsData);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isForbidden).toBe(false);
    });

    it('should call API with correct endpoint', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/requirements/analytics');
      });
    });

    it('should include all analytics fields in response', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const data = result.current.data!;
      expect(data.by_requirement).toBeDefined();
      expect(data.by_requirement.length).toBeGreaterThan(0);
      expect(data.summary).toBeDefined();
      expect(data.summary.avg_completion_rate).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('403 Forbidden error handling', () => {
    it('should set isForbidden flag when receiving 403 error', async () => {
      const forbiddenError = new Error('Access Forbidden');
      (forbiddenError as any).response = { status: 403 };

      (api.get as any).mockRejectedValue(forbiddenError);

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isForbidden).toBe(true);
      expect(result.current.isError).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).not.toBeNull();
    });

    it('should not retry on 403 Forbidden', async () => {
      const forbiddenError = new Error('Access Forbidden');
      (forbiddenError as any).response = { status: 403 };

      (api.get as any).mockRejectedValue(forbiddenError);

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only be called once (no retries on 403)
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Other error handling', () => {
    it('should handle server errors (500) and set error state', async () => {
      const serverError = new Error('Internal Server Error');
      (serverError as any).response = { status: 500 };

      (api.get as any).mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      // Wait for the error to be processed
      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(result.current.error).not.toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');

      (api.get as any).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('Hook options', () => {
    it('should respect enabled option', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result } = renderHook(() => useRequirementsAnalytics({ enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should start query when enabled changes to true', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result, rerender } = renderHook(
        ({ enabled }) => useRequirementsAnalytics({ enabled }),
        {
          initialProps: { enabled: false },
          wrapper: createWrapper(),
        }
      );

      expect(api.get).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe('Refetch capability', () => {
    it('should provide refetch function', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = (api.get as any).mock.calls.length;

      await result.current.refetch();

      await waitFor(() => {
        expect((api.get as any).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Data transformation', () => {
    it('should preserve analytics data structure', async () => {
      (api.get as any).mockResolvedValue({
        data: mockAnalyticsData,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const data = result.current.data!;

      // Check by_requirement array
      expect(Array.isArray(data.by_requirement)).toBe(true);
      data.by_requirement.forEach((req) => {
        expect(req.requirement_id).toBeDefined();
        expect(req.display_name).toBeDefined();
        expect(req.completion_rate).toBeDefined();
        expect(req.rejected_count).toBeDefined();
      });

      // Check summary
      expect(data.summary.total_requirements).toBeGreaterThan(0);
      expect(data.summary.avg_completion_rate).toBeGreaterThanOrEqual(0);
      expect(data.summary.avg_rejection_rate).toBeGreaterThanOrEqual(0);
    });

    it('should return null data when not loaded', () => {
      (api.get as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockAnalyticsData }), 1000))
      );

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('Loading and error states', () => {
    it('should track loading state correctly', async () => {
      (api.get as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockAnalyticsData }), 50))
      );

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty analytics response', async () => {
      const emptyAnalytics: RequirementsAnalytics = {
        by_requirement: [],
        summary: {
          total_requirements: 0,
          avg_completion_rate: 0,
          avg_rejection_rate: 0,
        },
        timestamp: new Date().toISOString(),
      };

      (api.get as any).mockResolvedValue({
        data: emptyAnalytics,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.by_requirement).toHaveLength(0);
      expect(result.current.data?.summary.total_requirements).toBe(0);
    });

    it('should handle missing optional fields', async () => {
      const minimalAnalytics: RequirementsAnalytics = {
        by_requirement: [
          {
            requirement_id: 'req-1',
            requirement_type: 'test',
            display_name: 'Test Requirement',
            is_mandatory: true,
            completion_rate: 50,
            total_trainees: 100,
            verified_count: 50,
            rejected_count: 0,
            rejection_rate: 0,
            // avg_time_to_completion_days is optional
          },
        ],
        summary: {
          total_requirements: 1,
          avg_completion_rate: 50,
          avg_rejection_rate: 0,
        },
        timestamp: new Date().toISOString(),
      };

      (api.get as any).mockResolvedValue({
        data: minimalAnalytics,
      });

      const { result } = renderHook(() => useRequirementsAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.by_requirement[0].requirement_id).toBe('req-1');
    });
  });
});
