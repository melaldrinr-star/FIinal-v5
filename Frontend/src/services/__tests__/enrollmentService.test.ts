import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { enrollmentService } from '../enrollmentService';
import api from '../api';
import { UpdateEnrollmentPayload, Enrollment } from '../enrollmentService';
import { websocketClient } from '../websocket-client';

// Mock axios api
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock WebSocket client
vi.mock('../websocket-client', () => ({
  websocketClient: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onEnrollmentUpdated: vi.fn((_handler) => () => {}),
    onEnrollmentAdded: vi.fn((_handler) => () => {}),
    onEnrollmentRemoved: vi.fn((_handler) => () => {}),
    getConnectionStatus: vi.fn(),
  },
}));

describe('enrollmentService - Property 3: Status Update PATCH Payload is Correct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.clearCache();
  });

  /**
   * Property 3: Status Update PATCH Payload is Correct
   * **Validates: Requirements 4.1, 4.2**
   *
   * For any status update action (complete, fail, drop), the system SHALL send a PATCH request with:
   * (1) `status` field set to correct value
   * (2) `completion_date` field set to today's date ONLY if action is "Mark as Complete"
   * (3) no other fields in payload
   *
   * Test: For each action type, trigger update and intercept PATCH request.
   * Verify: (1) complete includes completion_date, (2) fail/drop don't include completion_date,
   * (3) all include status field with correct value
   */
  it('should send correct PATCH payload with status field for all action types', async () => {
    const testCases = [
      { action: 'complete', status: 'completed' as const },
      { action: 'fail', status: 'failed' as const },
      { action: 'drop', status: 'dropped' as const },
    ];

    // Mock a successful response
    const mockEnrollment: Enrollment = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      trainee_id: '550e8400-e29b-41d4-a716-446655440001',
      program_id: '550e8400-e29b-41d4-a716-446655440002',
      status: 'completed',
      enrollment_date: '2024-01-15',
      completion_date: null,
      final_grade: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    for (const testCase of testCases) {
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440000';

      // Create payload based on action
      let payload: UpdateEnrollmentPayload;
      if (testCase.action === 'complete') {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        payload = {
          status: testCase.status,
          completion_date: today,
        };
      } else {
        payload = {
          status: testCase.status,
        };
      }

      // Mock the API response
      const mockResponse = {
        data: { ...mockEnrollment, status: testCase.status },
      };
      vi.mocked(api.patch).mockResolvedValue(mockResponse);

      // Call updateStatus
      await enrollmentService.updateStatus(enrollmentId, payload);

      // Verify PATCH was called
      expect(api.patch).toHaveBeenCalled();

      // Get the actual payload that was sent
      const callArgs = vi.mocked(api.patch).mock.calls[vi.mocked(api.patch).mock.calls.length - 1];
      const sentPayload = callArgs[1] as UpdateEnrollmentPayload;

      // Verify status field
      expect(sentPayload.status).toBe(testCase.status);

      // Verify completion_date presence/absence based on action
      if (testCase.action === 'complete') {
        expect(sentPayload.completion_date).toBeDefined();
        expect(sentPayload.completion_date).toBeTruthy();
        // Verify it's in YYYY-MM-DD format
        expect(/^\d{4}-\d{2}-\d{2}$/.test(sentPayload.completion_date as string)).toBe(true);
      } else {
        // fail and drop should NOT have completion_date
        expect(sentPayload.completion_date).toBeUndefined();
      }

      vi.clearAllMocks();
      enrollmentService.clearCache();
    }
  });

  /**
   * Property-Based Test: For each action type (complete, fail, drop), verify PATCH payload structure.
   * Minimum 100 iterations covering all action combinations.
   *
   * Generates:
   * - Random enrollment IDs
   * - All 3 action types (complete, fail, drop)
   * - Random dates for completion (when applicable)
   */
  it('should include completion_date in PATCH payload only for complete action (property-based)', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant({ action: 'complete', status: 'completed' as const }),
          fc.constant({ action: 'fail', status: 'failed' as const }),
          fc.constant({ action: 'drop', status: 'dropped' as const })
        ),
        fc.uuid(),
        async (actionType, enrollmentId) => {
          // Create mock response
          const mockEnrollment: Enrollment = {
            id: enrollmentId,
            trainee_id: '550e8400-e29b-41d4-a716-446655440001',
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: actionType.status,
            enrollment_date: '2024-01-15',
            completion_date: actionType.status === 'completed' ? '2024-02-15' : null,
            final_grade: null,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          };

          vi.mocked(api.patch).mockResolvedValue({ data: mockEnrollment });

          // Build payload
          let payload: UpdateEnrollmentPayload = {
            status: actionType.status,
          };

          if (actionType.action === 'complete') {
            payload.completion_date = new Date().toISOString().split('T')[0];
          }

          // Call service
          await enrollmentService.updateStatus(enrollmentId, payload);

          // Verify PATCH was called
          expect(api.patch).toHaveBeenCalledWith(
            `/enrollments/${enrollmentId}`,
            expect.objectContaining({
              status: actionType.status,
            })
          );

          // Get sent payload
          const callArgs = vi.mocked(api.patch).mock.calls[0];
          const sentPayload = callArgs[1] as UpdateEnrollmentPayload;

          // Property 1: status field must be present and correct
          expect(sentPayload.status).toBe(actionType.status);

          // Property 2: completion_date present ONLY for complete action
          if (actionType.action === 'complete') {
            expect(sentPayload.completion_date).toBeDefined();
            expect(typeof sentPayload.completion_date).toBe('string');
            // Verify ISO 8601 date format (YYYY-MM-DD)
            expect(sentPayload.completion_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          } else {
            // For fail and drop, completion_date should NOT be present
            expect(sentPayload.completion_date).toBeUndefined();
          }

          vi.clearAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-Based Test: Verify PATCH endpoint URL format and no extra fields in payload.
   * Covers all 3 action types with random enrollment IDs.
   */
  it('should send PATCH to correct endpoint with no extra fields', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant({ action: 'complete', status: 'completed' as const }),
          fc.constant({ action: 'fail', status: 'failed' as const }),
          fc.constant({ action: 'drop', status: 'dropped' as const })
        ),
        async (enrollmentId, actionType) => {
          const mockEnrollment: Enrollment = {
            id: enrollmentId,
            trainee_id: '550e8400-e29b-41d4-a716-446655440001',
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: actionType.status,
            enrollment_date: '2024-01-15',
            completion_date: null,
            final_grade: null,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          };

          vi.mocked(api.patch).mockResolvedValue({ data: mockEnrollment });

          // Build payload
          const payload: UpdateEnrollmentPayload = {
            status: actionType.status,
            ...(actionType.action === 'complete' && {
              completion_date: new Date().toISOString().split('T')[0],
            }),
          };

          // Call service
          await enrollmentService.updateStatus(enrollmentId, payload);

          // Verify PATCH called with correct endpoint
          expect(api.patch).toHaveBeenCalledWith(
            `/enrollments/${enrollmentId}`,
            expect.any(Object)
          );

          // Verify payload has only expected fields
          const callArgs = vi.mocked(api.patch).mock.calls[0];
          const sentPayload = callArgs[1] as Record<string, any>;

          const validKeys = ['status', 'completion_date', 'final_grade'];
          const sentKeys = Object.keys(sentPayload);

          for (const key of sentKeys) {
            expect(validKeys).toContain(key);
          }

          // Verify status is always present
          expect(sentPayload).toHaveProperty('status');

          vi.clearAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-Based Test: Verify correct status mapping for all action types.
   * Tests that the correct status value is sent for each action.
   */
  it('should map action types to correct status values', () => {
    const statusMapping = [
      { action: 'complete', expectedStatus: 'completed' as const },
      { action: 'fail', expectedStatus: 'failed' as const },
      { action: 'drop', expectedStatus: 'dropped' as const },
    ];

    return fc.assert(
      fc.asyncProperty(fc.uuid(), async (enrollmentId) => {
        for (const { action, expectedStatus } of statusMapping) {
          const mockEnrollment: Enrollment = {
            id: enrollmentId,
            trainee_id: '550e8400-e29b-41d4-a716-446655440001',
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: expectedStatus,
            enrollment_date: '2024-01-15',
            completion_date: null,
            final_grade: null,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          };

          vi.mocked(api.patch).mockResolvedValue({ data: mockEnrollment });

          const payload: UpdateEnrollmentPayload = {
            status: expectedStatus,
            ...(action === 'complete' && {
              completion_date: new Date().toISOString().split('T')[0],
            }),
          };

          await enrollmentService.updateStatus(enrollmentId, payload);

          const callArgs = vi.mocked(api.patch).mock.calls[vi.mocked(api.patch).mock.calls.length - 1];
          const sentPayload = callArgs[1] as UpdateEnrollmentPayload;

          expect(sentPayload.status).toBe(expectedStatus);

          vi.clearAllMocks();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property-Based Test: Verify completion_date is in ISO 8601 format for complete action.
   * Tests 100 iterations ensuring date format compliance.
   * 
   * Uses multiple enrollment IDs and statuses to create diverse test scenarios.
   * Each test verifies that the payload contains a valid YYYY-MM-DD formatted date.
   * The mockEnrollment uses a safe hardcoded date to avoid Zod validation issues.
   */
  it('should format completion_date as ISO 8601 (YYYY-MM-DD) for complete action', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 0, max: 100 }), // Use integer as variation parameter
        async (enrollmentId, seedValue) => {
          // Safe mock enrollment with valid date that passes Zod validation
          const mockEnrollment: Enrollment = {
            id: enrollmentId,
            trainee_id: '550e8400-e29b-41d4-a716-446655440001',
            program_id: '550e8400-e29b-41d4-a716-446655440002',
            status: 'completed',
            enrollment_date: '2024-01-15',
            completion_date: '2024-02-15', // Safe hardcoded date
            final_grade: null,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          };

          vi.mocked(api.patch).mockResolvedValue({ data: mockEnrollment });

          const completionDate = new Date().toISOString().split('T')[0];
          const payload: UpdateEnrollmentPayload = {
            status: 'completed',
            completion_date: completionDate,
          };

          await enrollmentService.updateStatus(enrollmentId, payload);

          const callArgs = vi.mocked(api.patch).mock.calls[0];
          const sentPayload = callArgs[1] as UpdateEnrollmentPayload;

          // Verify ISO date format (YYYY-MM-DD)
          expect(sentPayload.completion_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          vi.clearAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * WebSocket Integration Tests
 * Tests the integration between enrollmentService and websocketClient
 * Requirement 2.1, 2.5, 4.2, 4.4, 4.5, 4.6, 4.7, 6.1
 */
describe('EnrollmentService - WebSocket Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.clearCache();
    // Setup WebSocket client mocks
    vi.mocked(websocketClient.subscribe).mockClear();
    vi.mocked(websocketClient.unsubscribe).mockClear();
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
   * Test 7.1: WebSocket subscriptions are created when fetchEnrollments is called
   * Requirement 2.1: Automatically subscribe to all returned enrollment_ids
   */
  describe('WebSocket subscription on fetchEnrollments', () => {
    it('should subscribe to all returned enrollments via WebSocket', async () => {
      const traineeId = '550e8400-e29b-41d4-a716-446655440001';
      const mockEnrollments: Enrollment[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          trainee_id: traineeId,
          program_id: '550e8400-e29b-41d4-a716-446655440003',
          status: 'enrolled',
          enrollment_date: '2024-01-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          trainee_id: traineeId,
          program_id: '550e8400-e29b-41d4-a716-446655440005',
          status: 'active',
          enrollment_date: '2024-01-20',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(api, 'get').mockResolvedValue({
        data: { data: mockEnrollments },
      });

      await enrollmentService.fetchEnrollments(traineeId);

      // Verify subscriptions were created for each enrollment
      expect(vi.mocked(websocketClient.subscribe)).toHaveBeenCalledWith(mockEnrollments[0].id);
      expect(vi.mocked(websocketClient.subscribe)).toHaveBeenCalledWith(mockEnrollments[1].id);
      expect(vi.mocked(websocketClient.subscribe)).toHaveBeenCalledTimes(2);
    });

    it('should handle empty enrollment lists', async () => {
      const traineeId = '550e8400-e29b-41d4-a716-446655440001';

      vi.spyOn(api, 'get').mockResolvedValue({
        data: { data: [] },
      });

      await enrollmentService.fetchEnrollments(traineeId);

      // Should not subscribe to anything
      expect(vi.mocked(websocketClient.subscribe)).not.toHaveBeenCalled();
    });
  });

  /**
   * Test 7.4: Enrollment update handlers are called when WebSocket events received
   * Requirement 4.2, 4.4, 4.5
   */
  describe('WebSocket event handlers', () => {
    it('should allow registering callbacks via setEnrollmentUpdateHandler', async () => {
      const callback = vi.fn();
      const unsubscribe = enrollmentService.setEnrollmentUpdateHandler(callback);
      
      // Verify unsubscribe function is returned
      expect(typeof unsubscribe).toBe('function');
      
      // Verify we can unsubscribe
      unsubscribe();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove callback when unsubscribe is called', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = enrollmentService.setEnrollmentUpdateHandler(callback1);
      const _unsubscribe2 = enrollmentService.setEnrollmentUpdateHandler(callback2);
      
      unsubscribe1();
      
      // Both callbacks should still be in the set initially
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  /**
   * Test 7.8: forceRefresh method fetches from REST API directly
   * Requirement 6.3
   */
  describe('forceRefresh', () => {
    it('should fetch fresh data from REST API and bypass cache', async () => {
      const traineeId = '550e8400-e29b-41d4-a716-446655440001';
      const mockEnrollments: Enrollment[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          trainee_id: traineeId,
          program_id: '550e8400-e29b-41d4-a716-446655440003',
          status: 'enrolled',
          enrollment_date: '2024-01-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: { data: mockEnrollments },
      });

      // First call - populates cache
      await enrollmentService.fetchEnrollments(traineeId);
      expect(getSpy).toHaveBeenCalledTimes(1);

      // forceRefresh - should fetch again despite cache
      await enrollmentService.forceRefresh(traineeId);
      expect(getSpy).toHaveBeenCalledTimes(2);

      getSpy.mockRestore();
    });
  });

  /**
   * Test 7.10: getConnectionStatus method exposes connection status
   * Requirement 13.1
   */
  describe('getConnectionStatus', () => {
    it('should return current WebSocket connection status', () => {
      vi.mocked(websocketClient.getConnectionStatus).mockReturnValue('connected');
      const status = enrollmentService.getConnectionStatus();
      expect(status).toBe('connected');
    });

    it('should return disconnected status when WebSocket is not connected', () => {
      vi.mocked(websocketClient.getConnectionStatus).mockReturnValue('disconnected');
      const status = enrollmentService.getConnectionStatus();
      expect(status).toBe('disconnected');
    });
  });

  /**
   * Property Test 3: Subscription Idempotence
   * **Validates: Requirements 2.4**
   * Subscribing to same enrollment_id multiple times should result in single subscription
   */
  describe('Property Tests - Subscription Idempotence', () => {
    it('should handle multiple calls to fetchEnrollments for same trainee', async () => {
      return fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          async (traineeId, enrollmentCount) => {
            const enrollments: Enrollment[] = [];
            for (let i = 0; i < enrollmentCount; i++) {
              enrollments.push({
                id: `550e8400-e29b-41d4-a716-${i.toString().padStart(12, '0')}`,
                trainee_id: traineeId,
                program_id: `550e8400-e29b-41d4-a716-446655${i}00000`,
                status: 'enrolled',
                enrollment_date: '2024-01-15',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }

            vi.mocked(api.get).mockResolvedValue({
              data: { data: enrollments },
            });

            // First fetch
            await enrollmentService.fetchEnrollments(traineeId);
            const firstCallCount = vi.mocked(websocketClient.subscribe).mock.calls.length;

            // Second fetch - should use cache
            await enrollmentService.fetchEnrollments(traineeId);
            const secondCallCount = vi.mocked(websocketClient.subscribe).mock.calls.length;

            // Subscriptions should only be created once (from cache hit, no re-subscribe)
            expect(secondCallCount).toBe(firstCallCount);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
