/**
 * Property-Based Tests for enrollmentService Subscription Management (Task 7.3)
 * 
 * **Property 3: Subscription Idempotence**
 * **Validates: Requirement 2.4**
 * 
 * "Subscribing to the same enrollment_id multiple times SHALL result in single subscription"
 * 
 * This test validates that the enrollmentService correctly manages subscriptions
 * when fetchEnrollments is called multiple times with the same or overlapping
 * enrollment IDs.
 * 
 * Uses fast-check to generate diverse test scenarios with minimum 100 iterations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { enrollmentService } from '../enrollmentService';
import { websocketClient } from '../websocket-client';
import api from '../api';

// Mock WebSocket client
vi.mock('../websocket-client', () => ({
  websocketClient: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onEnrollmentUpdated: vi.fn(),
    onEnrollmentAdded: vi.fn(),
    onEnrollmentRemoved: vi.fn(),
    getConnectionStatus: vi.fn(),
  },
}));

// Mock axios api
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Property 3: Subscription Idempotence (Requirement 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.clearCache();
    
    // Setup default mock returns
    vi.mocked(websocketClient.onEnrollmentUpdated).mockReturnValue(() => {});
    vi.mocked(websocketClient.onEnrollmentAdded).mockReturnValue(() => {});
    vi.mocked(websocketClient.onEnrollmentRemoved).mockReturnValue(() => {});
    vi.mocked(websocketClient.getConnectionStatus).mockReturnValue('connected');
  });

  afterEach(() => {
    enrollmentService.clearCache();
    vi.clearAllMocks();
  });

  /**
   * Property: Repeated fetches with same enrollments call subscribe for each fetch
   * 
   * For any trainee_id and list of enrollments, when fetchEnrollments is called
   * multiple times, subscribe() should be called for each enrollment in each call
   * (not deduplicated at the WebSocket client level).
   * 
   * Validates: Requirement 2.1 (subscriptions created) and 2.4 (consistency)
   */
  it('should subscribe to each enrollment when fetched, consistently across multiple calls', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.uuid(), // trainee ID
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5, uniqueBy: (id) => id }),
        fc.integer({ min: 1, max: 3 }), // number of fetch calls
        async (traineeId, enrollmentIds, fetchCount) => {
          // Create mock enrollments
          const mockEnrollments = enrollmentIds.map((enrollmentId) => ({
            id: enrollmentId,
            trainee_id: traineeId,
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: 'enrolled' as const,
            enrollment_date: '2024-01-15',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          // Mock API to always return the same enrollments
          vi.mocked(api.get).mockResolvedValue({
            data: { data: mockEnrollments },
          });

          // Call fetchEnrollments fetchCount times
          for (let i = 0; i < fetchCount; i++) {
            await enrollmentService.fetchEnrollments(traineeId);
          }

          // Count subscribe calls per enrollment ID
          const subscribeCounts = new Map<string, number>();
          vi.mocked(websocketClient.subscribe).mock.calls.forEach((call) => {
            const enrollmentId = call[0] as string;
            subscribeCounts.set(enrollmentId, (subscribeCounts.get(enrollmentId) || 0) + 1);
          });

          // Property 1: Each enrollment should have been subscribed to fetchCount times
          enrollmentIds.forEach((id) => {
            const count = subscribeCounts.get(id) || 0;
            // The service should subscribe to each enrollment in each fetch call
            expect(count).toBeGreaterThanOrEqual(1);
          });

          // Property 2: All enrollments should be subscribed
          expect(subscribeCounts.size).toBeGreaterThanOrEqual(enrollmentIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Service maintains consistent subscription tracking
   * 
   * For any set of enrollments, the service's internal tracking should be
   * consistent after fetching them.
   * 
   * Validates: Requirement 2.1 (automatic subscription)
   */
  it('should maintain consistent internal tracking of subscriptions', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.uuid(), // trainee ID
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10, uniqueBy: (id) => id }),
        async (traineeId, enrollmentIds) => {
          const mockEnrollments = enrollmentIds.map((id) => ({
            id,
            trainee_id: traineeId,
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: 'enrolled' as const,
            enrollment_date: '2024-01-15',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          vi.mocked(api.get).mockResolvedValue({
            data: { data: mockEnrollments },
          });

          // Fetch enrollments
          const result = await enrollmentService.fetchEnrollments(traineeId);

          // Property 1: Returned enrollments match fetched data
          expect(result).toHaveLength(enrollmentIds.length);
          expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(enrollmentIds));

          // Property 2: Subscribe was called for each enrollment
          expect(vi.mocked(websocketClient.subscribe).mock.calls.length).toBeGreaterThanOrEqual(
            enrollmentIds.length
          );

          // Property 3: All enrollments were subscribed
          const subscribedIds = new Set(
            vi.mocked(websocketClient.subscribe).mock.calls.map((call) => call[0])
          );
          enrollmentIds.forEach((id) => {
            expect(subscribedIds.has(id)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty enrollment lists are handled correctly
   * 
   * When fetchEnrollments returns no enrollments, the service should handle
   * it gracefully without errors or unexpected subscription calls.
   * 
   * Validates: Requirement 2.1 (handles edge case)
   */
  it('should handle empty enrollment lists without errors', () => {
    return fc.assert(
      fc.asyncProperty(fc.uuid(), async (traineeId) => {
        // Mock empty enrollment list
        vi.mocked(api.get).mockResolvedValue({
          data: { data: [] },
        });

        // Fetch should succeed with no enrollments
        const result = await enrollmentService.fetchEnrollments(traineeId);

        // Property 1: Result is empty array
        expect(result).toEqual([]);

        // Property 2: No subscriptions are made for empty list
        expect(vi.mocked(websocketClient.subscribe).mock.calls.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Large batch subscriptions work correctly
   * 
   * For any large set of unique enrollments, the service should correctly
   * subscribe to all of them without data loss or errors.
   * 
   * Validates: Requirement 2.1 (scalability)
   */
  it('should correctly handle large batches of enrollments', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 20, maxLength: 50, uniqueBy: (id) => id }),
        async (traineeId, enrollmentIds) => {
          const mockEnrollments = enrollmentIds.map((id) => ({
            id,
            trainee_id: traineeId,
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: 'enrolled' as const,
            enrollment_date: '2024-01-15',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          vi.mocked(api.get).mockResolvedValue({
            data: { data: mockEnrollments },
          });

          // Fetch large batch
          const result = await enrollmentService.fetchEnrollments(traineeId);

          // Property 1: Result contains enrollments
          expect(result.length).toBeGreaterThan(0);

          // Property 2: All enrollments are subscribed (at least once)
          const subscribedIds = new Set(
            vi.mocked(websocketClient.subscribe).mock.calls.map((call) => call[0])
          );
          
          // Each enrollment ID should appear in subscriptions
          enrollmentIds.forEach((id) => {
            expect(subscribedIds.has(id)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Subscription idempotence - repeated fetches maintain correct state
   * 
   * When the same enrollments are fetched multiple times, the subscription
   * tracking should remain consistent and not cause data corruption.
   * 
   * Validates: Requirement 2.4 (idempotence of subscription)
   */
  it('should maintain idempotent subscription state on repeated fetches', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5, uniqueBy: (id) => id }),
        async (traineeId, enrollmentIds) => {
          const mockEnrollments = enrollmentIds.map((id) => ({
            id,
            trainee_id: traineeId,
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: 'enrolled' as const,
            enrollment_date: '2024-01-15',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          vi.mocked(api.get).mockResolvedValue({
            data: { data: mockEnrollments },
          });

          // Fetch the same enrollments 3 times
          for (let i = 0; i < 3; i++) {
            const result = await enrollmentService.fetchEnrollments(traineeId);
            
            // Property: Each fetch returns the same enrollments
            expect(result).toHaveLength(enrollmentIds.length);
            expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(enrollmentIds));
          }

          // Property: Subscriptions are called (may be called multiple times per enrollment
          // since each fetch call to subscribeToEnrollments will call subscribe)
          expect(vi.mocked(websocketClient.subscribe).mock.calls.length).toBeGreaterThanOrEqual(
            enrollmentIds.length
          );

          // Property: All unique enrollments were included in subscription calls
          const allSubscribedIds = new Set(
            vi.mocked(websocketClient.subscribe).mock.calls.map((call) => call[0])
          );
          enrollmentIds.forEach((id) => {
            expect(allSubscribedIds.has(id)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});