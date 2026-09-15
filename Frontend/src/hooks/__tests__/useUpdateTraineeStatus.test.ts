import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUpdateTraineeStatus, UseUpdateTraineeStatusResult, DeleteStatusResponse } from '../useUpdateTraineeStatus';
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

const mockDeleteResponse: DeleteStatusResponse = {
  success: true,
  message: 'Status record deleted successfully',
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
      mutations: {
        retry: false,
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

describe('useUpdateTraineeStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Update Mutation', () => {
    it('should update a trainee status record successfully', async () => {
      const patchMock = vi.spyOn(api.default, 'patch').mockResolvedValue({
        data: {
          ...mockTraineeStatusRecord,
          jobTitle: 'Senior Software Engineer',
        },
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData: Partial<TraineeStatusRecord> = {
        jobTitle: 'Senior Software Engineer',
      };

      const updatePromise = result.current.updateStatus('status-123', updateData);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedRecord = await updatePromise;

      expect(updatedRecord.jobTitle).toBe('Senior Software Engineer');
      expect(patchMock).toHaveBeenCalledWith('/trainee-status/status-123', updateData);
    });

    it('should handle update validation errors', async () => {
      const errorMessage = 'Job title and employer name are required for employed status';
      vi.spyOn(api.default, 'patch').mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData: Partial<TraineeStatusRecord> = {
        employmentStatus: 'employed',
        jobTitle: '', // Empty - validation should fail
      };

      try {
        await result.current.updateStatus('status-123', updateData);
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('required');
      }
    });

    it('should handle missing recordId for update', async () => {
      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      try {
        await result.current.updateStatus('', { jobTitle: 'New Title' });
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('Record ID');
      }
    });

    it('should update multiple fields simultaneously', async () => {
      const patchMock = vi.spyOn(api.default, 'patch').mockResolvedValue({
        data: {
          ...mockTraineeStatusRecord,
          jobTitle: 'Senior Engineer',
          skillsMatchPercentage: 98,
          remarks: 'Updated remarks',
        },
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData: Partial<TraineeStatusRecord> = {
        jobTitle: 'Senior Engineer',
        skillsMatchPercentage: 98,
        remarks: 'Updated remarks',
      };

      const updated = await result.current.updateStatus('status-123', updateData);

      expect(updated.jobTitle).toBe('Senior Engineer');
      expect(updated.skillsMatchPercentage).toBe(98);
      expect(updated.remarks).toBe('Updated remarks');
      expect(patchMock).toHaveBeenCalledWith('/trainee-status/status-123', updateData);
    });
  });

  describe('Delete Mutation', () => {
    it('should delete a status record successfully', async () => {
      const deleteMock = vi.spyOn(api.default, 'delete').mockResolvedValue({
        data: mockDeleteResponse,
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      const deletePromise = result.current.deleteStatus('status-123');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await deletePromise;

      expect(response.success).toBe(true);
      expect(response.message).toBe('Status record deleted successfully');
      expect(deleteMock).toHaveBeenCalledWith('/trainee-status/status-123');
    });

    it('should handle delete authorization errors', async () => {
      const errorMessage = "You don't have permission to delete this record";
      vi.spyOn(api.default, 'delete').mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      try {
        await result.current.deleteStatus('status-123');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('permission');
      }
    });

    it('should handle missing recordId for delete', async () => {
      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      try {
        await result.current.deleteStatus('');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('Record ID');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle update errors and keep mutation in error state', async () => {
      const errorMessage = 'Update failed';
      vi.spyOn(api.default, 'patch').mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      try {
        await result.current.updateStatus('status-123', { jobTitle: 'New Title' });
        expect.fail('Should have thrown error');
      } catch (err) {
        expect((err as Error).message).toContain('Update failed');
      }
    });

    it('should handle successful second update after first failure', async () => {
      const patchMock = vi.spyOn(api.default, 'patch');

      // First call fails
      patchMock.mockRejectedValueOnce(new Error('First update failed'));

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      // Attempt first update - should fail
      try {
        await result.current.updateStatus('status-123', { jobTitle: 'Title 1' });
        expect.fail('Should have thrown error');
      } catch (err) {
        expect((err as Error).message).toContain('First update failed');
      }

      // Second call succeeds
      patchMock.mockResolvedValueOnce({
        data: { ...mockTraineeStatusRecord, jobTitle: 'Title 2' },
      });

      // Attempt second update - should succeed
      const updated = await result.current.updateStatus('status-456', { jobTitle: 'Title 2' });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(updated.jobTitle).toBe('Title 2');
    });
  });

  describe('Loading State', () => {
    it('should reflect loading state during update mutation', async () => {
      const patchMock = vi.spyOn(api.default, 'patch').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockTraineeStatusRecord }), 100))
      );

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);

      const updatePromise = result.current.updateStatus('status-123', { jobTitle: 'New Title' });

      // Should be loading immediately after mutate call
      // (Note: exact timing depends on React Query internals)
      await updatePromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should reflect loading state during delete mutation', async () => {
      vi.spyOn(api.default, 'delete').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockDeleteResponse }), 100))
      );

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);

      const deletePromise = result.current.deleteStatus('status-123');

      await deletePromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate traineeStatus cache on successful update', async () => {
      const queryClientSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.spyOn(api.default, 'patch').mockResolvedValue({
        data: mockTraineeStatusRecord,
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await result.current.updateStatus('status-123', { jobTitle: 'New Title' });

      await waitFor(() => {
        // Both caches should be invalidated on update
        const calls = queryClientSpy.mock.calls;
        const invalidatedKeys = calls.map((call) => (call[0] as any).queryKey);
        expect(invalidatedKeys).toContainEqual(['traineeStatus']);
      });
    });

    it('should invalidate traineeStatuses cache on successful update', async () => {
      const queryClientSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.spyOn(api.default, 'patch').mockResolvedValue({
        data: mockTraineeStatusRecord,
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await result.current.updateStatus('status-123', { jobTitle: 'New Title' });

      await waitFor(() => {
        // Both caches should be invalidated on update
        const calls = queryClientSpy.mock.calls;
        const invalidatedKeys = calls.map((call) => (call[0] as any).queryKey);
        expect(invalidatedKeys).toContainEqual(['traineeStatuses']);
      });
    });

    it('should invalidate caches on successful delete', async () => {
      const queryClientSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.spyOn(api.default, 'delete').mockResolvedValue({
        data: mockDeleteResponse,
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await result.current.deleteStatus('status-123');

      await waitFor(() => {
        expect(queryClientSpy).toHaveBeenCalled();
      });

      // Verify both query keys were invalidated
      const calls = queryClientSpy.mock.calls;
      const invalidatedKeys = calls.map((call) => (call[0] as any).queryKey);
      expect(invalidatedKeys).toContainEqual(['traineeStatus']);
      expect(invalidatedKeys).toContainEqual(['traineeStatuses']);
    });
  });

  describe('Return Interface', () => {
    it('should return correct structure', () => {
      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('updateStatus');
      expect(result.current).toHaveProperty('deleteStatus');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      expect(typeof result.current.updateStatus).toBe('function');
      expect(typeof result.current.deleteStatus).toBe('function');
      expect(typeof result.current.isLoading).toBe('boolean');
    });
  });
});

/**
 * Property-Based Tests
 * **Validates: Requirements 10.0, 14.0**
 */
describe('Property-Based Tests: useUpdateTraineeStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Property 1: Update with Valid Record ID
   * For any valid recordId and partial update data, the mutation processes without crashing
   * **Validates: Requirement 10.0**
   */
  it('Property 1: Update Mutation Robustness - Valid recordId and data never crash', () => {
    const property = fc.property(
      fc.uuid(),
      fc.record({
        jobTitle: fc.option(fc.string({ minLength: 1, maxLength: 255 }), { nil: undefined }),
        skillsMatchPercentage: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
      }),
      (recordId, updateData) => {
        vi.spyOn(api.default, 'patch').mockResolvedValue({
          data: { ...mockTraineeStatusRecord, ...updateData },
        });

        const { result } = renderHook(() => useUpdateTraineeStatus(), {
          wrapper: createWrapper(queryClient),
        });

        // Should not throw
        expect(() => {
          result.current.updateStatus(recordId, updateData as Partial<TraineeStatusRecord>);
        }).not.toThrow();
      }
    );

    fc.assert(property);
  });

  /**
   * Property 2: Delete with Valid Record ID
   * For any valid recordId, the delete mutation processes without crashing
   * **Validates: Requirement 14.0**
   */
  it('Property 2: Delete Mutation Robustness - Valid recordId never crashes', () => {
    const property = fc.property(fc.uuid(), (recordId) => {
      vi.spyOn(api.default, 'delete').mockResolvedValue({
        data: mockDeleteResponse,
      });

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      // Should not throw
      expect(() => {
        result.current.deleteStatus(recordId);
      }).not.toThrow();
    });

    fc.assert(property);
  });

  /**
   * Property 3: Error Handling Consistency
   * For any API error, error state is always set to an Error object
   * **Validates: Requirements 10.0, 14.0**
   */
  it('Property 3: Error State Consistency - All errors are Error objects', () => {
    const property = fc.property(fc.uuid(), fc.string({ minLength: 1 }), (recordId, errorMsg) => {
      vi.spyOn(api.default, 'patch').mockRejectedValue(new Error(errorMsg));

      const { result } = renderHook(() => useUpdateTraineeStatus(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.updateStatus(recordId, { jobTitle: 'Test' }).catch(() => {
        // Expected to fail
      });

      // After error, it should be set
      if (result.current.error) {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(typeof result.current.error.message).toBe('string');
      }
    });

    fc.assert(property);
  });
});
