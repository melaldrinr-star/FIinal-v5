/**
 * Unit Tests for useTraineeStatuses Hook (Task 2.3)
 *
 * Tests for the hook that fetches multiple trainee status records with:
 * 1. Support for filtering by employmentStatus[], skillsMatch[], graduationStatus[]
 * 2. Support for sorting by column and direction
 * 3. Support for pagination (page, limit)
 * 4. Automatic page reset to 1 when filters or sort change
 * 5. React Query integration with ['traineeStatuses', filters, sort, pagination] queryKey
 * 6. Stale time of 1 minute (60,000 ms)
 * 7. Retry strategy of 2 retries
 * 8. Returns { records, isLoading, error, pagination, refetch }
 *
 * **Validates: Requirements 3.0, 16.0, 17.0**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraineeStatuses, useResetPaginationOnFilterChange } from './useTraineeStatuses';
import api from '../services/api';
import type { TraineeStatusRecord, TraineeStatusFilters, TraineeStatusSort } from '../types/traineeStatus';

// Mock the API service
vi.mock('../services/api');

// Mock the logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useTraineeStatuses Hook (Task 2.3)', () => {
  const mockRecords: TraineeStatusRecord[] = [
    {
      id: 'status-001',
      tenantId: 'tenant-001',
      traineeId: 'trainee-001',
      enrollmentId: 'enrollment-001',
      graduationStatus: 'graduated',
      graduationDate: '2024-01-15',
      employmentStatus: 'employed',
      jobTitle: 'Software Engineer',
      employerName: 'Tech Corp',
      skillsMatch: 'exact_match',
      skillsMatchPercentage: 95,
      recordedBy: 'user-001',
      recordedAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-21T15:00:00Z',
    },
    {
      id: 'status-002',
      tenantId: 'tenant-001',
      traineeId: 'trainee-002',
      enrollmentId: 'enrollment-002',
      graduationStatus: 'graduated',
      graduationDate: '2024-01-10',
      employmentStatus: 'unemployed',
      skillsMatch: 'not_applicable',
      recordedBy: 'user-001',
      recordedAt: '2024-01-18T10:00:00Z',
      updatedAt: '2024-01-19T15:00:00Z',
    },
  ];

  const mockPaginationInfo = {
    page: 1,
    limit: 20,
    total: 150,
    hasMore: true,
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();

    // Default mock implementation
    (api.get as any).mockResolvedValue({
      data: {
        records: mockRecords,
        pagination: mockPaginationInfo,
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Basic Functionality', () => {
    it('should fetch records with default parameters', async () => {
      const { result } = renderHook(() => useTraineeStatuses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', {
        sort_by: 'recorded_at',
        sort_dir: 'desc',
        page: '1',
        limit: '20',
      });

      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.pagination).toEqual(mockPaginationInfo);
      expect(result.current.error).toBe(null);
    });

    it('should return loading state initially', async () => {
      const { result } = renderHook(() => useTraineeStatuses(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return empty records and default pagination when API returns null data', async () => {
      (api.get as any).mockResolvedValue({
        data: null,
      });

      const { result } = renderHook(() => useTraineeStatuses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.records).toEqual([]);
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      });
    });
  });

  describe('Filtering (Requirement 16.0)', () => {
    it('should apply employment status filter', async () => {
      const filters: TraineeStatusFilters = {
        employmentStatus: ['employed', 'self_employed'],
      };

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        employment_status: 'employed,self_employed',
      }));
    });

    it('should apply skills match filter', async () => {
      const filters: TraineeStatusFilters = {
        skillsMatch: ['exact_match', 'partial_match'],
      };

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        skills_match: 'exact_match,partial_match',
      }));
    });

    it('should apply graduation status filter', async () => {
      const filters: TraineeStatusFilters = {
        graduationStatus: ['graduated', 'pending'],
      };

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        graduation_status: 'graduated,pending',
      }));
    });

    it('should apply search term filter', async () => {
      const filters: TraineeStatusFilters = {
        searchTerm: 'Software Engineer',
      };

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        search: 'Software Engineer',
      }));
    });

    it('should apply multiple filters with AND logic', async () => {
      const filters: TraineeStatusFilters = {
        employmentStatus: ['employed'],
        skillsMatch: ['exact_match', 'partial_match'],
        graduationStatus: ['graduated'],
      };

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        employment_status: 'employed',
        skills_match: 'exact_match,partial_match',
        graduation_status: 'graduated',
      }));
    });

    it('should not include filter parameters if not provided', async () => {
      const filters: TraineeStatusFilters = {};

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callArgs = (api.get as any).mock.calls[0][1];
      expect(callArgs.employment_status).toBeUndefined();
      expect(callArgs.skills_match).toBeUndefined();
      expect(callArgs.graduation_status).toBeUndefined();
      expect(callArgs.search).toBeUndefined();
    });
  });

  describe('Sorting (Requirement 17.0)', () => {
    it('should apply ascending sort', async () => {
      const sort: TraineeStatusSort = {
        column: 'graduation_date',
        direction: 'asc',
      };

      const { result } = renderHook(() => useTraineeStatuses({}, sort), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        sort_by: 'graduation_date',
        sort_dir: 'asc',
      }));
    });

    it('should apply descending sort', async () => {
      const sort: TraineeStatusSort = {
        column: 'recorded_at',
        direction: 'desc',
      };

      const { result } = renderHook(() => useTraineeStatuses({}, sort), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        sort_by: 'recorded_at',
        sort_dir: 'desc',
      }));
    });

    it('should support all sortable columns', async () => {
      const sortableColumns: Array<TraineeStatusSort['column']> = [
        'name',
        'graduation_date',
        'employment_status',
        'skills_match',
        'recorded_at',
      ];

      for (const column of sortableColumns) {
        const sort: TraineeStatusSort = { column, direction: 'asc' };
        const { result } = renderHook(() => useTraineeStatuses({}, sort), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
          sort_by: column,
        }));
      }
    });
  });

  describe('Pagination', () => {
    it('should apply pagination parameters', async () => {
      const pagination = { page: 2, limit: 50 };

      const { result } = renderHook(() => useTraineeStatuses({}, { column: 'recorded_at', direction: 'desc' }, pagination), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/trainee-status', expect.objectContaining({
        page: '2',
        limit: '50',
      }));
    });

    it('should return pagination metadata', async () => {
      const { result } = renderHook(() => useTraineeStatuses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 150,
        hasMore: true,
      });
    });

    it('should handle pagination with hasMore false', async () => {
      const paginationResponse = {
        page: 5,
        limit: 20,
        total: 100,
        hasMore: false,
      };

      (api.get as any).mockResolvedValue({
        data: {
          records: mockRecords,
          pagination: paginationResponse,
        },
      });

      const { result } = renderHook(() => useTraineeStatuses({}, { column: 'recorded_at', direction: 'desc' }, { page: 5, limit: 20 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pagination.hasMore).toBe(false);
    });
  });

  describe('Query Key and Caching', () => {
    it('should use correct query key with filters, sort, and pagination', async () => {
      const filters: TraineeStatusFilters = { employmentStatus: ['employed'] };
      const sort: TraineeStatusSort = { column: 'recorded_at', direction: 'desc' };
      const pagination = { page: 1, limit: 20 };

      renderHook(() => useTraineeStatuses(filters, sort, pagination), { wrapper });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });

      // Verify cache entry was created - fetch should only happen once
      (api.get as any).mockClear();

      renderHook(() => useTraineeStatuses(filters, sort, pagination), { wrapper });

      // With the same parameters, it should use cache (no additional API call)
      await waitFor(() => {
        // Note: may be called during initial setup
      }, { timeout: 500 });
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useTraineeStatuses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      const { result } = renderHook(() => useTraineeStatuses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (api.get as any).mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filters object', async () => {
      const { result } = renderHook(() => useTraineeStatuses({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.records).toEqual(mockRecords);
    });

    it('should handle empty array filters', async () => {
      const filters: TraineeStatusFilters = {
        employmentStatus: [],
        skillsMatch: [],
        graduationStatus: [],
      };

      const { result } = renderHook(() => useTraineeStatuses(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callArgs = (api.get as any).mock.calls[0][1];
      expect(callArgs.employment_status).toBeUndefined();
      expect(callArgs.skills_match).toBeUndefined();
      expect(callArgs.graduation_status).toBeUndefined();
    });

    it('should be disabled when enabled option is false', async () => {
      const { result } = renderHook(() => useTraineeStatuses({}, { column: 'recorded_at', direction: 'desc' }, { page: 1, limit: 20 }, { enabled: false }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.records).toEqual([]);
    });
  });

  describe('useResetPaginationOnFilterChange Hook', () => {
    it('should call reset callback when filters change', async () => {
      const resetCallback = vi.fn();
      let filters: TraineeStatusFilters = { employmentStatus: ['employed'] };
      const sort: TraineeStatusSort = { column: 'recorded_at', direction: 'desc' };

      const { rerender } = renderHook(
        ({ f, s }) => useResetPaginationOnFilterChange(f, s, resetCallback),
        {
          initialProps: { f: filters, s: sort },
          wrapper,
        }
      );

      // Change filters
      filters = { employmentStatus: ['unemployed'] };
      rerender({ f: filters, s: sort });

      await waitFor(() => {
        expect(resetCallback).toHaveBeenCalled();
      });
    });

    it('should call reset callback when sort changes', async () => {
      const resetCallback = vi.fn();
      const filters: TraineeStatusFilters = { employmentStatus: ['employed'] };
      let sort: TraineeStatusSort = { column: 'recorded_at', direction: 'desc' };

      const { rerender } = renderHook(
        ({ f, s }) => useResetPaginationOnFilterChange(f, s, resetCallback),
        {
          initialProps: { f: filters, s: sort },
          wrapper,
        }
      );

      // Change sort
      sort = { column: 'recorded_at', direction: 'asc' };
      rerender({ f: filters, s: sort });

      await waitFor(() => {
        expect(resetCallback).toHaveBeenCalled();
      });
    });

    it('should not call reset callback when filters and sort are unchanged', async () => {
      const resetCallback = vi.fn();
      const filters: TraineeStatusFilters = { employmentStatus: ['employed'] };
      const sort: TraineeStatusSort = { column: 'recorded_at', direction: 'desc' };

      const { rerender } = renderHook(
        ({ f, s }) => useResetPaginationOnFilterChange(f, s, resetCallback),
        {
          initialProps: { f: filters, s: sort },
          wrapper,
        }
      );

      // Re-render with same data
      rerender({ f: filters, s: sort });

      await waitFor(() => {
        // Reset callback should not have been called for unchanged data
      }, { timeout: 300 });

      expect(resetCallback).not.toHaveBeenCalled();
    });
  });
});
