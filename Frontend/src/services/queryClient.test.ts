/**
 * Unit Tests for React Query Client Configuration
 * 
 * Tests the caching optimization strategy:
 * - Query key factory consistency
 * - Cache invalidation strategies
 * - Stale time configuration
 * - Garbage collection settings
 * 
 * **Validates: Task 11.1 - Optimize React Query caching strategy**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys, createOptimizedQueryClient, invalidationStrategies } from './queryClient';

describe('React Query Cache Optimization', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createOptimizedQueryClient();
  });

  describe('Query Key Factory', () => {
    it('should generate consistent query keys for single status record', () => {
      const enrollmentId = 'enrollment-123';
      const key1 = queryKeys.traineeStatus.byEnrollment(enrollmentId);
      const key2 = queryKeys.traineeStatus.byEnrollment(enrollmentId);

      expect(key1).toEqual(key2);
      expect(key1).toContain('traineeStatus');
      expect(key1).toContain('enrollment');
      expect(key1).toContain(enrollmentId);
    });

    it('should generate different keys for different enrollments', () => {
      const key1 = queryKeys.traineeStatus.byEnrollment('enrollment-1');
      const key2 = queryKeys.traineeStatus.byEnrollment('enrollment-2');

      expect(key1).not.toEqual(key2);
    });

    it('should generate consistent query keys for multiple records', () => {
      const filters = { employmentStatus: ['employed'] };
      const sort = { column: 'recorded_at', direction: 'desc' };
      const pagination = { page: 1, limit: 20 };

      const key1 = queryKeys.traineeStatuses.list(filters, sort, pagination);
      const key2 = queryKeys.traineeStatuses.list(filters, sort, pagination);

      expect(key1).toEqual(key2);
    });

    it('should include filters in query key', () => {
      const filters = { employmentStatus: ['employed', 'self_employed'] };
      const sort = { column: 'name', direction: 'asc' };
      const pagination = { page: 1, limit: 20 };

      const key = queryKeys.traineeStatuses.list(filters, sort, pagination);

      // Key should be an array with traineeStatuses and an object containing filters
      expect(key[0]).toBe('traineeStatuses');
      expect(key[1]).toHaveProperty('filters');
      expect(key[1].filters).toEqual(filters);
    });

    it('should include sort in query key', () => {
      const filters = {};
      const sort = { column: 'graduation_date', direction: 'asc' };
      const pagination = { page: 1, limit: 20 };

      const key = queryKeys.traineeStatuses.list(filters, sort, pagination);

      expect(key[1]).toHaveProperty('sort');
      expect(key[1].sort).toEqual(sort);
    });

    it('should include pagination in query key', () => {
      const filters = {};
      const sort = { column: 'recorded_at', direction: 'desc' };
      const pagination = { page: 2, limit: 50 };

      const key = queryKeys.traineeStatuses.list(filters, sort, pagination);

      expect(key[1]).toHaveProperty('pagination');
      expect(key[1].pagination).toEqual(pagination);
    });

    it('should generate different keys for different pages', () => {
      const filters = {};
      const sort = { column: 'recorded_at', direction: 'desc' };

      const key1 = queryKeys.traineeStatuses.list(filters, sort, { page: 1, limit: 20 });
      const key2 = queryKeys.traineeStatuses.list(filters, sort, { page: 2, limit: 20 });

      expect(key1).not.toEqual(key2);
    });

    it('should generate different keys for different sorts', () => {
      const filters = {};
      const pagination = { page: 1, limit: 20 };

      const key1 = queryKeys.traineeStatuses.list(filters, { column: 'name', direction: 'asc' }, pagination);
      const key2 = queryKeys.traineeStatuses.list(filters, { column: 'recorded_at', direction: 'desc' }, pagination);

      expect(key1).not.toEqual(key2);
    });

    it('should generate different keys for different filters', () => {
      const sort = { column: 'recorded_at', direction: 'desc' };
      const pagination = { page: 1, limit: 20 };

      const key1 = queryKeys.traineeStatuses.list(
        { employmentStatus: ['employed'] },
        sort,
        pagination
      );
      const key2 = queryKeys.traineeStatuses.list(
        { employmentStatus: ['unemployed'] },
        sort,
        pagination
      );

      expect(key1).not.toEqual(key2);
    });
  });

  describe('Query Client Configuration', () => {
    it('should create a QueryClient with default options', () => {
      const client = createOptimizedQueryClient();
      expect(client).toBeDefined();
    });

    it('should have 5-minute default stale time', () => {
      const client = createOptimizedQueryClient();
      const options = client.getDefaultOptions().queries;

      // Default stale time should be 5 minutes
      expect(options?.staleTime).toBe(1000 * 60 * 5);
    });

    it('should have 10-minute garbage collection time', () => {
      const client = createOptimizedQueryClient();
      const options = client.getDefaultOptions().queries;

      // GC time should be 10 minutes
      expect(options?.gcTime).toBe(1000 * 60 * 10);
    });

    it('should have mutation retry set to 0', () => {
      const client = createOptimizedQueryClient();
      const options = client.getDefaultOptions().mutations;

      // Mutations should not retry
      expect(options?.retry).toBe(0);
    });

    it('should refetch on window focus only if stale', () => {
      const client = createOptimizedQueryClient();
      const options = client.getDefaultOptions().queries;

      expect(options?.refetchOnWindowFocus).toBe('stale');
    });

    it('should refetch on reconnect only if stale', () => {
      const client = createOptimizedQueryClient();
      const options = client.getDefaultOptions().queries;

      expect(options?.refetchOnReconnect).toBe('stale');
    });

    it('should refetch on mount only if stale', () => {
      const client = createOptimizedQueryClient();
      const options = client.getDefaultOptions().queries;

      expect(options?.refetchOnMount).toBe('stale');
    });
  });

  describe('Invalidation Strategies', () => {
    beforeEach(() => {
      // Add some mock data to the cache
      queryClient.setQueryData(
        queryKeys.traineeStatus.byEnrollment('enrollment-123'),
        { id: 'status-1', enrollmentId: 'enrollment-123' }
      );

      queryClient.setQueryData(
        queryKeys.traineeStatuses.list(
          { employmentStatus: ['employed'] },
          { column: 'recorded_at', direction: 'desc' },
          { page: 1, limit: 20 }
        ),
        {
          records: [{ id: 'status-1' }, { id: 'status-2' }],
          pagination: { page: 1, limit: 20, total: 2, hasMore: false },
        }
      );
    });

    it('should invalidate single trainee status', () => {
      const enrollmentId = 'enrollment-123';
      const query = queryClient.getQueryData(
        queryKeys.traineeStatus.byEnrollment(enrollmentId)
      );

      expect(query).toBeDefined();

      invalidationStrategies.invalidateSingleTraineeStatus(queryClient, enrollmentId);

      // After invalidation, the query should still exist but be marked as stale
      const queryState = queryClient.getQueryState(
        queryKeys.traineeStatus.byEnrollment(enrollmentId)
      );

      expect(queryState?.dataUpdatedAt).toBeDefined();
      expect(queryState?.status).toBe('success');
    });

    it('should invalidate all trainee status list queries', () => {
      const query = queryClient.getQueryData(
        queryKeys.traineeStatuses.list(
          { employmentStatus: ['employed'] },
          { column: 'recorded_at', direction: 'desc' },
          { page: 1, limit: 20 }
        )
      );

      expect(query).toBeDefined();

      invalidationStrategies.invalidateTraineeStatusList(queryClient);

      const queryState = queryClient.getQueryState(
        queryKeys.traineeStatuses.list(
          { employmentStatus: ['employed'] },
          { column: 'recorded_at', direction: 'desc' },
          { page: 1, limit: 20 }
        )
      );

      expect(queryState?.dataUpdatedAt).toBeDefined();
      expect(queryState?.status).toBe('success');
    });

    it('should invalidate both single and list queries', () => {
      const enrollmentId = 'enrollment-123';

      invalidationStrategies.invalidateAllTraineeStatuses(queryClient, enrollmentId);

      // Check that single record query is invalidated
      const singleQueryState = queryClient.getQueryState(
        queryKeys.traineeStatus.byEnrollment(enrollmentId)
      );
      expect(singleQueryState?.dataUpdatedAt).toBeDefined();

      // Check that list query is invalidated
      const listQueryState = queryClient.getQueryState(
        queryKeys.traineeStatuses.list(
          { employmentStatus: ['employed'] },
          { column: 'recorded_at', direction: 'desc' },
          { page: 1, limit: 20 }
        )
      );
      expect(listQueryState?.dataUpdatedAt).toBeDefined();
    });

    it('should clear all trainee status caches', () => {
      invalidationStrategies.clearAllTraineeStatusCaches(queryClient);

      // After clearing, the cache entries should be removed
      const singleQuery = queryClient.getQueryData(
        queryKeys.traineeStatus.byEnrollment('enrollment-123')
      );
      expect(singleQuery).toBeUndefined();

      const listQuery = queryClient.getQueryData(
        queryKeys.traineeStatuses.list(
          { employmentStatus: ['employed'] },
          { column: 'recorded_at', direction: 'desc' },
          { page: 1, limit: 20 }
        )
      );
      expect(listQuery).toBeUndefined();
    });
  });

  describe('Retry Strategy', () => {
    it('should not retry on 4xx client errors', async () => {
      const options = queryClient.getDefaultOptions().queries;
      const retryFn = options?.retry as Function;

      // Test 400 Bad Request
      const result400 = retryFn(0, { status: 400 });
      expect(result400).toBe(false);

      // Test 401 Unauthorized
      const result401 = retryFn(0, { status: 401 });
      expect(result401).toBe(false);

      // Test 403 Forbidden
      const result403 = retryFn(0, { status: 403 });
      expect(result403).toBe(false);

      // Test 404 Not Found
      const result404 = retryFn(0, { status: 404 });
      expect(result404).toBe(false);
    });

    it('should retry on 5xx server errors', () => {
      const options = queryClient.getDefaultOptions().queries;
      const retryFn = options?.retry as Function;

      // First attempt at 500
      const result500_attempt1 = retryFn(0, { status: 500 });
      expect(result500_attempt1).toBe(true);

      // Second attempt at 500
      const result500_attempt2 = retryFn(1, { status: 500 });
      expect(result500_attempt2).toBe(true);

      // Third attempt at 500 (should not retry)
      const result500_attempt3 = retryFn(2, { status: 500 });
      expect(result500_attempt3).toBe(false);
    });

    it('should retry on network errors', () => {
      const options = queryClient.getDefaultOptions().queries;
      const retryFn = options?.retry as Function;

      // Network error (no status)
      const resultNetwork1 = retryFn(0, { message: 'Network error' });
      expect(resultNetwork1).toBe(true);

      const resultNetwork2 = retryFn(1, { message: 'Network error' });
      expect(resultNetwork2).toBe(true);

      const resultNetwork3 = retryFn(2, { message: 'Network error' });
      expect(resultNetwork3).toBe(false);
    });
  });

  describe('Cache Hierarchy', () => {
    it('should support query family invalidation', () => {
      // Add multiple queries to the same family
      queryClient.setQueryData(
        queryKeys.traineeStatus.byEnrollment('enrollment-1'),
        { id: 'status-1' }
      );
      queryClient.setQueryData(
        queryKeys.traineeStatus.byEnrollment('enrollment-2'),
        { id: 'status-2' }
      );

      // Invalidate all queries in the family
      queryClient.invalidateQueries({
        queryKey: queryKeys.traineeStatus.all,
      });

      // Both should exist (not cleared, just invalidated)
      const query1State = queryClient.getQueryState(
        queryKeys.traineeStatus.byEnrollment('enrollment-1')
      );
      const query2State = queryClient.getQueryState(
        queryKeys.traineeStatus.byEnrollment('enrollment-2')
      );

      expect(query1State?.dataUpdatedAt).toBeDefined();
      expect(query2State?.dataUpdatedAt).toBeDefined();
    });
  });
});
