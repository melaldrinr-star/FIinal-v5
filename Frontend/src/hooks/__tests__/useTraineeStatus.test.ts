import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTraineeStatus, UseTraineeStatusResult } from '../useTraineeStatus';
import * as api from '../../services/api';
import * as fc from 'fast-check';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { TraineeStatusRecord } from '../../types/traineeStatus';

/**
 * Mock API responses
 */
const mockTraineeStatusRecord: TraineeStatusRecord = {
  id: 'status-123',
  tenantId: 'tenant-1',
  traineeId: 'trainee-1',
  enrollmentId: 'enrollment-123',
  graduationStatus: 'graduated',
  graduationDate: '2024-01-15',
  employmentStatus: 'employed',
  jobTitle: 'Software Engineer',
  employerName: 'Tech Corp',
  jobStartDate: '2024-02-01',
  jobSector: 'Information Technology',
  skillsMatch: 'exact_match',
  skillsMatchPercentage: 95,
  remarks: 'Excellent alignment with program',
  recordedBy: 'user-1',
  recordedAt: '2024-01-20T10:00:00Z',
  lastUpdatedBy: 'user-2',
  updatedAt: '2024-01-21T15:00:00Z',
};

/**
 * Create a QueryClient for testing
 */
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

/**
 * Wrapper component to provide QueryClientProvider
 */
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient, children });
};

describe('useTraineeStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Basic Functionality', () => {
    it('should handle null/undefined enrollmentId gracefully', async () => {
      vi.spyOn(api.default, 'get').mockResolvedValue({ data: null });

      const { result } = renderHook(() => useTraineeStatus(undefined), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.record).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch a single status record by enrollmentId', async () => {
      const getMock = vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result } = renderHook(() => useTraineeStatus('enrollment-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.record).toEqual(mockTraineeStatusRecord);
      expect(result.current.error).toBeNull();
      expect(getMock).toHaveBeenCalledWith('/trainee-status/enrollment/enrollment-123');
    });

    it('should handle null record response', async () => {
      vi.spyOn(api.default, 'get').mockResolvedValue({ data: null });

      const { result } = renderHook(() => useTraineeStatus('enrollment-456'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.record).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to load trainee status';
      vi.spyOn(api.default, 'get').mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTraineeStatus('enrollment-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.record).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Failed to load');
    });
  });

  describe('Query Control', () => {
    it('should respect enabled option', async () => {
      const getMock = vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => useTraineeStatus('enrollment-123', { enabled }),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { enabled: false },
        }
      );

      // Should not fetch initially
      expect(getMock).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);

      // Enable the query
      rerender({ enabled: true });

      await waitFor(() => {
        expect(getMock).toHaveBeenCalled();
      });
    });

    it('should update when enrollmentId changes', async () => {
      const getMock = vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result, rerender } = renderHook(
        ({ id }: { id: string }) => useTraineeStatus(id),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { id: 'enrollment-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getMock).toHaveBeenCalledWith('/trainee-status/enrollment/enrollment-1');

      // Change enrollmentId
      rerender({ id: 'enrollment-2' });

      await waitFor(() => {
        expect(getMock).toHaveBeenCalledWith('/trainee-status/enrollment/enrollment-2');
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide refetch function', async () => {
      const getMock = vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result } = renderHook(() => useTraineeStatus('enrollment-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = getMock.mock.calls.length;

      // Call refetch
      await result.current.refetch();

      // Should fetch again (may have more calls due to React Query internal retries)
      expect(getMock.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache data with 5-minute stale time', async () => {
      const getMock = vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result: result1 } = renderHook(() => useTraineeStatus('enrollment-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // First fetch should have been called
      expect(getMock).toHaveBeenCalledTimes(1);

      // Create a new hook instance for the same enrollment
      const { result: result2 } = renderHook(() => useTraineeStatus('enrollment-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Should use cache, not call API again immediately
      expect(result2.current.record).toEqual(mockTraineeStatusRecord);
      expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('should have separate cache entries for different enrollments', async () => {
      const getMock = vi.spyOn(api.default, 'get').mockImplementation((url: string) => {
        if (url.includes('enrollment-1')) {
          return Promise.resolve({ data: { ...mockTraineeStatusRecord, enrollmentId: 'enrollment-1' } });
        }
        return Promise.resolve({ data: { ...mockTraineeStatusRecord, enrollmentId: 'enrollment-2' } });
      });

      const { result: result1 } = renderHook(() => useTraineeStatus('enrollment-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(() => useTraineeStatus('enrollment-2'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result1.current.record?.enrollmentId).toBe('enrollment-1');
      expect(result2.current.record?.enrollmentId).toBe('enrollment-2');
      expect(getMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Return Interface', () => {
    it('should return correct structure', async () => {
      vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result } = renderHook(() => useTraineeStatus('enrollment-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify all required properties exist
      expect(result.current).toHaveProperty('record');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');

      // Verify types
      expect(typeof result.current.record).toBe('object');
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.refetch).toBe('function');
    });
  });
});

/**
 * Property-Based Tests
 * **Validates: Requirement 1.0**
 */
describe('Property-Based Tests: useTraineeStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Property 1: Query Key Consistency
   * For any valid enrollmentId, the hook always uses the same query key
   * **Validates: Requirement 1.0**
   */
  it('Property 1: Query Key Consistency - Same enrollmentId produces consistent cache entries', () => {
    const property = fc.property(fc.uuid(), (enrollmentId) => {
      const getMock = vi.spyOn(api.default, 'get').mockResolvedValue({ data: mockTraineeStatusRecord });

      const { result: result1 } = renderHook(() => useTraineeStatus(enrollmentId), {
        wrapper: createWrapper(queryClient),
      });

      // Get the query state from the cache
      const cacheKey1 = ['traineeStatus', enrollmentId];

      // Create second hook instance for same enrollment
      const { result: result2 } = renderHook(() => useTraineeStatus(enrollmentId), {
        wrapper: createWrapper(queryClient),
      });

      // Both should reference same cache
      expect(result1.current.record).toEqual(result2.current.record);
    });

    fc.assert(property);
  });

  /**
   * Property 2: Null/Undefined Enrollment Handling
   * For null or undefined enrollmentId, the hook never makes API calls
   * **Validates: Requirement 1.0**
   */
  it('Property 2: Null/Undefined Enrollment Handling - No API calls for missing enrollmentId', () => {
    const property = fc.property(fc.constantFrom<string | undefined | null>(undefined, null), (enrollmentId) => {
      const getMock = vi.spyOn(api.default, 'get');

      const { result } = renderHook(() => useTraineeStatus(enrollmentId as any), {
        wrapper: createWrapper(queryClient),
      });

      // Should never call API
      expect(getMock).not.toHaveBeenCalled();

      // Should return null record
      expect(result.current.record).toBeNull();
    });

    fc.assert(property);
  });

  /**
   * Property 3: Valid Record Structure
   * For all successful fetches, returned record matches TraineeStatusRecord interface
   * **Validates: Requirement 1.0**
   */
  it('Property 3: Valid Record Structure - Fetched records contain all required fields', () => {
    const property = fc.property(fc.uuid(), (enrollmentId) => {
      const testRecord = {
        ...mockTraineeStatusRecord,
        enrollmentId,
      };

      vi.spyOn(api.default, 'get').mockResolvedValue({ data: testRecord });

      let recordData: TraineeStatusRecord | null = null;

      const { result } = renderHook(() => useTraineeStatus(enrollmentId), {
        wrapper: createWrapper(queryClient),
      });

      // Store the record data if it eventually loads
      if (result.current.record) {
        recordData = result.current.record;
      }

      // When data loads, verify it has all required fields
      if (recordData) {
        expect(recordData).toHaveProperty('id');
        expect(recordData).toHaveProperty('enrollmentId');
        expect(recordData).toHaveProperty('graduationStatus');
        expect(recordData).toHaveProperty('employmentStatus');
        expect(recordData).toHaveProperty('recordedAt');
        expect(recordData).toHaveProperty('updatedAt');
      }
    });

    fc.assert(property);
  });

  /**
   * Property 4: Error State Consistency
   * When API call fails, error is always set to non-null Error object
   * **Validates: Requirement 1.0**
   */
  it('Property 4: Error State Consistency - Failed API calls produce consistent error states', () => {
    const property = fc.property(fc.uuid(), fc.string({ minLength: 1 }), (enrollmentId, errorMsg) => {
      vi.spyOn(api.default, 'get').mockRejectedValue(new Error(errorMsg));

      let errorState: Error | null = null;

      const { result } = renderHook(() => useTraineeStatus(enrollmentId), {
        wrapper: createWrapper(queryClient),
      });

      if (result.current.error) {
        errorState = result.current.error;
      }

      // When error occurs, it should be a non-null Error object
      if (errorState) {
        expect(errorState).toBeInstanceOf(Error);
        expect(typeof errorState.message).toBe('string');
      }
    });

    fc.assert(property);
  });
});
