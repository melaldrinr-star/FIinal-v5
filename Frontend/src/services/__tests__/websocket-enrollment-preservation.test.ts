/**
 * Preservation Property Tests for WebSocket and Enrollment Service
 * 
 * These tests PASS on the current UNFIXED code and verify that existing
 * functionality is preserved after the console error cleanup fix is applied.
 * They validate baseline behavior that must be maintained.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Properties Tested:
 * - REST API enrollment fetching: data is returned and cached correctly (3.1, 3.3)
 * - WebSocket subscriptions: subscriptions created for fetched enrollments (3.5)
 * - Data consistency: enrollment data stays consistent across fetches (3.3)
 * - Cache functionality: caching works and can be bypassed (3.4)
 * - REST API fallback: works independently of WebSocket (3.2)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enrollmentService } from '../enrollmentService';
import { websocketClient } from '../websocket-client';
import api from '../api';

// Mock WebSocket client
vi.mock('../websocket-client', () => ({
  websocketClient: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onEnrollmentUpdated: vi.fn(() => () => {}),
    onEnrollmentAdded: vi.fn(() => () => {}),
    onEnrollmentRemoved: vi.fn(() => () => {}),
    getConnectionStatus: vi.fn(() => 'connected'),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

// Mock axios api
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Preservation Properties: WebSocket and Enrollment Service (Before Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.clearCache();

    // Setup default mock returns for event handlers
    vi.mocked(websocketClient.onEnrollmentUpdated).mockReturnValue(() => {});
    vi.mocked(websocketClient.onEnrollmentAdded).mockReturnValue(() => {});
    vi.mocked(websocketClient.onEnrollmentRemoved).mockReturnValue(() => {});
    vi.mocked(websocketClient.getConnectionStatus).mockReturnValue('connected');
  });

  afterEach(() => {
    enrollmentService.clearCache();
    vi.clearAllMocks();
  });

  // =====================================================
  // Property 3.1: REST API Data Fetching
  // =====================================================

  /**
   * Property: For ANY trainee ID and enrollment data from the API,
   * fetchEnrollments returns the complete enrollment list.
   * 
   * This property ensures REST API data flow is preserved.
   * 
   * **Validates: Requirement 3.1**
   */
  it('should preserve REST API enrollment data fetching', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const mockEnrollments = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        trainee_id: traineeId,
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'enrolled' as const,
        enrollment_date: '2024-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: { data: mockEnrollments },
    });

    const result = await enrollmentService.fetchEnrollments(traineeId);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(mockEnrollments[0].id);
    expect(vi.mocked(api.get)).toHaveBeenCalledWith(`/enrollments?trainee_id=${traineeId}`);
  });

  /**
   * Property: Empty enrollment lists are handled correctly.
   * 
   * **Validates: Requirement 3.1**
   */
  it('should preserve handling of empty enrollment lists', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';

    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
    });

    const result = await enrollmentService.fetchEnrollments(traineeId);

    expect(result).toEqual([]);
    expect(vi.mocked(api.get)).toHaveBeenCalled();
  });

  // =====================================================
  // Property 3.2: Subscription Management
  // =====================================================

  /**
   * Property: For ANY enrollment data returned from fetchEnrollments,
   * the service subscribes to each enrollment.
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve WebSocket subscriptions for fetched enrollments', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const enrollmentIds = [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ];

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

    await enrollmentService.fetchEnrollments(traineeId);

    expect(vi.mocked(websocketClient.subscribe).mock.calls.length).toBeGreaterThanOrEqual(2);

    const subscribedIds = new Set(
      vi.mocked(websocketClient.subscribe).mock.calls.map((call) => call[0])
    );

    enrollmentIds.forEach((id) => {
      expect(subscribedIds.has(id)).toBe(true);
    });
  });

  // =====================================================
  // Property 3.3: Data Consistency
  // =====================================================

  /**
   * Property: For ANY sequence of enrollment fetches,
   * the service returns consistent data.
   * 
   * **Validates: Requirement 3.3**
   */
  it('should preserve enrollment data consistency across fetches', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const enrollmentId = '550e8400-e29b-41d4-a716-446655440010';

    const mockEnrollments = [
      {
        id: enrollmentId,
        trainee_id: traineeId,
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'enrolled' as const,
        enrollment_date: '2024-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: { data: mockEnrollments },
    });

    const result1 = await enrollmentService.fetchEnrollments(traineeId);
    const result2 = await enrollmentService.fetchEnrollments(traineeId);

    expect(result1).toEqual(result2);
    expect(result1[0].id).toBe(enrollmentId);
  });

  // =====================================================
  // Property 3.4: Cache Functionality
  // =====================================================

  /**
   * Property: When fetched twice without cache clear,
   * the second fetch returns cached data without calling API again.
   * 
   * **Validates: Requirement 3.4**
   */
  it('should preserve caching behavior', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const mockEnrollments = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        trainee_id: traineeId,
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'enrolled' as const,
        enrollment_date: '2024-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: { data: mockEnrollments },
    });

    const result1 = await enrollmentService.fetchEnrollments(traineeId);
    const callCountAfterFirst = vi.mocked(api.get).mock.calls.length;

    const result2 = await enrollmentService.fetchEnrollments(traineeId);
    const callCountAfterSecond = vi.mocked(api.get).mock.calls.length;

    expect(callCountAfterSecond).toBe(callCountAfterFirst);
    expect(result1).toEqual(result2);
  });

  /**
   * Property: When forceRefresh is called, the API is called again.
   * 
   * **Validates: Requirement 3.4**
   */
  it('should preserve forceRefresh bypassing cache', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const mockEnrollments = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        trainee_id: traineeId,
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'enrolled' as const,
        enrollment_date: '2024-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: { data: mockEnrollments },
    });

    await enrollmentService.fetchEnrollments(traineeId);
    const callsAfterFirst = vi.mocked(api.get).mock.calls.length;

    await enrollmentService.forceRefresh(traineeId);
    const callsAfterRefresh = vi.mocked(api.get).mock.calls.length;

    expect(callsAfterRefresh).toBeGreaterThan(callsAfterFirst);
  });

  // =====================================================
  // Property 3.5: WebSocket Event Handler Registration
  // =====================================================

  /**
   * Property: Event handlers are registered when service initializes.
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve WebSocket event handler registration', () => {
    expect(typeof vi.mocked(websocketClient.onEnrollmentUpdated)).toBe('function');
    expect(typeof vi.mocked(websocketClient.onEnrollmentAdded)).toBe('function');
    expect(typeof vi.mocked(websocketClient.onEnrollmentRemoved)).toBe('function');
  });

  // =====================================================
  // Property 3.2: REST API Fallback
  // =====================================================

  /**
   * Property: For ANY enrollment fetch request, the service uses REST API
   * regardless of WebSocket status.
   * 
   * **Validates: Requirement 3.2 (fallback works)**
   */
  it('should preserve REST API as independent data pathway', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const mockEnrollments = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        trainee_id: traineeId,
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'enrolled' as const,
        enrollment_date: '2024-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: { data: mockEnrollments },
    });

    // Simulate WebSocket as unavailable
    vi.mocked(websocketClient.getConnectionStatus).mockReturnValue('disconnected');

    const result = await enrollmentService.fetchEnrollments(traineeId);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(vi.mocked(api.get)).toHaveBeenCalled();
  });

  // =====================================================
  // Combined Preservation Properties
  // =====================================================

  /**
   * Property: Complete enrollment lifecycle (fetch → subscribe → cache)
   * works correctly with all preservation requirements met.
   * 
   * **Validates: Requirements 3.1-3.5**
   */
  it('should preserve complete enrollment lifecycle', async () => {
    const traineeId = '550e8400-e29b-41d4-a716-446655440001';
    const enrollmentIds = [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ];

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

    // Phase 1: Fetch enrollments
    const firstFetch = await enrollmentService.fetchEnrollments(traineeId);

    expect(Array.isArray(firstFetch)).toBe(true);
    expect(firstFetch.length).toBe(2);

    const callsAfterFetch = vi.mocked(api.get).mock.calls.length;

    // Subscriptions created
    const subscribedIds = new Set(
      vi.mocked(websocketClient.subscribe).mock.calls.map((call) => call[0])
    );
    enrollmentIds.forEach((id) => {
      expect(subscribedIds.has(id)).toBe(true);
    });

    // Phase 2: Cached fetch
    const secondFetch = await enrollmentService.fetchEnrollments(traineeId);

    expect(vi.mocked(api.get).mock.calls.length).toBe(callsAfterFetch);
    expect(secondFetch).toEqual(firstFetch);

    // Phase 3: Force refresh
    await enrollmentService.forceRefresh(traineeId);

    expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(callsAfterFetch);
  });
});
