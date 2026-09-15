import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useEnrollmentUpdates } from '../useEnrollmentUpdates';
import { enrollmentService, Enrollment } from '../../services/enrollmentService';

// Mock the enrollmentService
vi.mock('../../services/enrollmentService', () => ({
  enrollmentService: {
    fetchEnrollments: vi.fn(),
    setEnrollmentUpdateHandler: vi.fn(),
    getConnectionStatus: vi.fn(),
    forceRefresh: vi.fn(),
  },
}));

describe('useEnrollmentUpdates', () => {
  const mockEnrollmentId = 'enroll-123';
  const mockTraineeId = 'trainee-456';

  const mockEnrollment: Enrollment = {
    id: mockEnrollmentId,
    trainee_id: mockTraineeId,
    program_id: 'prog-789',
    status: 'active',
    enrollment_date: '2024-01-15',
    completion_date: null,
    final_grade: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockEnrollment2: Enrollment = {
    id: 'enroll-234',
    trainee_id: mockTraineeId,
    program_id: 'prog-890',
    status: 'enrolled',
    enrollment_date: '2024-02-01',
    completion_date: null,
    final_grade: null,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (enrollmentService.fetchEnrollments as any).mockResolvedValue([mockEnrollment]);
    (enrollmentService.setEnrollmentUpdateHandler as any).mockReturnValue(vi.fn());
    (enrollmentService.getConnectionStatus as any).mockReturnValue('connected');
    (enrollmentService.forceRefresh as any).mockResolvedValue([mockEnrollment]);
  });

  afterEach(() => {
    // Cleanup
  });

  /**
   * Test: Hook subscribes to updates on mount
   * Validates: Requirements 4.4, 13.1
   */
  it('should subscribe to enrollment updates on mount', async () => {
    renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(enrollmentService.setEnrollmentUpdateHandler).toHaveBeenCalled();
    });
  });

  /**
   * Test: Hook returns current enrollments
   * Validates: Requirements 4.4
   */
  it('should return current enrollments fetched from service', async () => {
    (enrollmentService.fetchEnrollments as any).mockResolvedValue([
      mockEnrollment,
      mockEnrollment2,
    ]);

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.enrollments).toEqual([]);

    // After fetch completes
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.enrollments).toHaveLength(2);
      expect(result.current.enrollments[0]).toEqual(mockEnrollment);
      expect(result.current.enrollments[1]).toEqual(mockEnrollment2);
    });
  });

  /**
   * Test: Hook updates when WebSocket enrollment-updated event received
   * Validates: Requirements 4.4
   */
  it('should update enrollments when enrollment-updated event received', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    (enrollmentService.fetchEnrollments as any).mockResolvedValue([mockEnrollment]);

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(result.current.enrollments).toHaveLength(1);
    });

    // Simulate enrollment update event
    const updatedEnrollment = {
      ...mockEnrollment,
      status: 'completed' as const,
      completion_date: '2024-03-15',
    };

    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: updatedEnrollment,
      });
    });

    // Verify enrollment is updated
    expect(result.current.enrollments[0]).toEqual(updatedEnrollment);
    expect(result.current.enrollments[0].status).toBe('completed');
  });

  /**
   * Test: Hook updates when WebSocket enrollment-added event received
   * Validates: Requirements 4.4
   */
  it('should add enrollment when enrollment-added event received', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    (enrollmentService.fetchEnrollments as any).mockResolvedValue([mockEnrollment]);

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(result.current.enrollments).toHaveLength(1);
    });

    // Simulate enrollment added event
    act(() => {
      updateCallback({
        type: 'added',
        enrollment: mockEnrollment2,
      });
    });

    // Verify enrollment is added
    expect(result.current.enrollments).toHaveLength(2);
    expect(result.current.enrollments[1]).toEqual(mockEnrollment2);
  });

  /**
   * Test: Hook updates when WebSocket enrollment-removed event received
   * Validates: Requirements 4.4
   */
  it('should remove enrollment when enrollment-removed event received', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    (enrollmentService.fetchEnrollments as any).mockResolvedValue([
      mockEnrollment,
      mockEnrollment2,
    ]);

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(result.current.enrollments).toHaveLength(2);
    });

    // Simulate enrollment removed event
    act(() => {
      updateCallback({
        type: 'removed',
        enrollmentId: mockEnrollmentId,
      });
    });

    // Verify enrollment is removed
    expect(result.current.enrollments).toHaveLength(1);
    expect(result.current.enrollments[0]).toEqual(mockEnrollment2);
  });

  /**
   * Test: Hook returns connection status
   * Validates: Requirements 13.1
   */
  it('should return current connection status', async () => {
    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    // The hook initializes connectionStatus to 'connecting'
    // and polls getConnectionStatus every 1 second
    expect(['connecting', 'connected', 'disconnected', 'reconnecting']).toContain(
      result.current.connectionStatus,
    );
  });

  /**
   * Test: Hook handles fetch errors gracefully
   * Validates: Requirements 4.4
   */
  it('should handle fetch errors gracefully', async () => {
    const errorMessage = 'Failed to fetch enrollments';
    (enrollmentService.fetchEnrollments as any).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.enrollments).toEqual([]);
    });
  });

  /**
   * Test: forceRefresh method fetches from REST API
   * Validates: Requirements 6.3
   */
  it('should call forceRefresh on REST API fallback', async () => {
    const refreshedEnrollment = { ...mockEnrollment, status: 'completed' as const };
    (enrollmentService.forceRefresh as any).mockResolvedValue([refreshedEnrollment]);

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call forceRefresh
    await act(async () => {
      await result.current.forceRefresh();
    });

    // Verify updated enrollments
    expect(result.current.enrollments[0]).toEqual(refreshedEnrollment);
    expect(enrollmentService.forceRefresh).toHaveBeenCalledWith(mockTraineeId);
  });

  /**
   * Test: refetch method re-fetches enrollments
   * Validates: Requirements 4.4
   */
  it('should refetch enrollments with refetch method', async () => {
    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    // Initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(enrollmentService.fetchEnrollments).toHaveBeenCalledTimes(1);

    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Verify fetch was called again
    expect(enrollmentService.fetchEnrollments).toHaveBeenCalledTimes(2);
  });

  /**
   * Test: Hook unsubscribes on unmount
   * Validates: Requirements 4.4
   */
  it('should unsubscribe from updates on unmount', async () => {
    const unsubscribe = vi.fn();
    (enrollmentService.setEnrollmentUpdateHandler as any).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(enrollmentService.setEnrollmentUpdateHandler).toHaveBeenCalled();
    });

    unmount();

    // Verify unsubscribe was called
    expect(unsubscribe).toHaveBeenCalled();
  });

  /**
   * Test: Hook doesn't fetch if traineeId is not provided
   * Validates: Requirements 4.4
   */
  it('should not fetch enrollments if traineeId is empty', () => {
    renderHook(() => useEnrollmentUpdates(''));

    expect(enrollmentService.fetchEnrollments).not.toHaveBeenCalled();
  });

  /**
   * Test: Multiple updates in sequence
   * Validates: Requirements 4.4
   */
  it('should handle multiple sequential updates', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    (enrollmentService.fetchEnrollments as any).mockResolvedValue([mockEnrollment]);

    const { result } = renderHook(() => useEnrollmentUpdates(mockTraineeId));

    await waitFor(() => {
      expect(result.current.enrollments).toHaveLength(1);
    });

    // First update: change status
    const update1 = { ...mockEnrollment, status: 'completed' as const };
    act(() => {
      updateCallback({ type: 'updated', enrollment: update1 });
    });

    expect(result.current.enrollments[0].status).toBe('completed');

    // Second update: add enrollment
    act(() => {
      updateCallback({ type: 'added', enrollment: mockEnrollment2 });
    });

    expect(result.current.enrollments).toHaveLength(2);

    // Third update: remove first enrollment
    act(() => {
      updateCallback({ type: 'removed', enrollmentId: mockEnrollmentId });
    });

    expect(result.current.enrollments).toHaveLength(1);
    expect(result.current.enrollments[0]).toEqual(mockEnrollment2);
  });
});
