import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnrollmentProvider, useEnrollment } from '../EnrollmentContext';
import { enrollmentService, Enrollment } from '../../services/enrollmentService';
import logger from '../../utils/logger';

// Mock the enrollmentService
vi.mock('../../services/enrollmentService', () => ({
  enrollmentService: {
    fetchEnrollments: vi.fn(),
    setEnrollmentUpdateHandler: vi.fn(),
    getConnectionStatus: vi.fn(),
    forceRefresh: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EnrollmentContext', () => {
  const mockTraineeId = 'trainee-456';
  const mockEnrollmentId = 'enroll-123';

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
    vi.clearAllMocks();
  });

  /**
   * Test component that uses enrollment context
   */
  const TestComponent = ({ traineeId }: { traineeId?: string }) => {
    const context = useEnrollment();

    if (traineeId) {
      React.useEffect(() => {
        context.setTraineeId(traineeId);
      }, [traineeId, context]);
    }

    return (
      <div>
        <div data-testid="connection-status">{context.connectionStatus}</div>
        <div data-testid="enrollments-count">{context.enrollments.length}</div>
        <div data-testid="loading">{context.loading ? 'loading' : 'not-loading'}</div>
        <div data-testid="error">{context.error || 'no-error'}</div>
        <div data-testid="trainee-id">{context.traineeId || 'no-id'}</div>
        {context.enrollments.map((e) => (
          <div key={e.id} data-testid={`enrollment-${e.id}`}>
            {e.status}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Test: Context updates when WebSocket enrollment-updated event received
   * Validates: Requirements 4.4
   */
  it('should update context when enrollment-updated event received', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Simulate enrollment update event
    const updatedEnrollment = {
      ...mockEnrollment,
      status: 'completed' as const,
    };

    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: updatedEnrollment,
      });
    });

    // Verify context is updated
    expect(screen.getByTestId(`enrollment-${mockEnrollmentId}`)).toHaveTextContent('completed');
  });

  /**
   * Test: Context updates when enrollment-added event received
   * Validates: Requirements 4.4
   */
  it('should add enrollment to context when enrollment-added event received', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    (enrollmentService.fetchEnrollments as any).mockResolvedValue([mockEnrollment]);

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Simulate enrollment added event
    act(() => {
      updateCallback({
        type: 'added',
        enrollment: mockEnrollment2,
      });
    });

    // Verify enrollment is added
    expect(screen.getByTestId('enrollments-count')).toHaveTextContent('2');
  });

  /**
   * Test: Context updates when enrollment-removed event received
   * Validates: Requirements 4.4
   */
  it('should remove enrollment from context when enrollment-removed event received', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    (enrollmentService.fetchEnrollments as any).mockResolvedValue([
      mockEnrollment,
      mockEnrollment2,
    ]);

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('2');
    });

    // Simulate enrollment removed event
    act(() => {
      updateCallback({
        type: 'removed',
        enrollmentId: mockEnrollmentId,
      });
    });

    // Verify enrollment is removed
    expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
  });

  /**
   * Test: Subscribers are notified of changes
   * Validates: Requirements 4.4
   */
  it('should notify subscribers when enrollment changes', async () => {
    let updateCallback: any;
    const subscriber = vi.fn();

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    const TestComponentWithSubscriber = () => {
      const context = useEnrollment();

      React.useEffect(() => {
        context.subscribe(subscriber);
      }, [context]);

      return (
        <div>
          <div data-testid="enrollments-count">{context.enrollments.length}</div>
        </div>
      );
    };

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponentWithSubscriber />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Simulate update event
    const updatedEnrollment = { ...mockEnrollment, status: 'completed' as const };

    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: updatedEnrollment,
      });
    });

    // Verify subscriber was called
    expect(subscriber).toHaveBeenCalledWith({
      type: 'updated',
      enrollment: updatedEnrollment,
    });
  });

  /**
   * Test: Context can be created with initial trainee ID
   * Validates: Requirements 4.4
   */
  it('should fetch enrollments on initialization with trainee ID', async () => {
    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(enrollmentService.fetchEnrollments).toHaveBeenCalledWith(mockTraineeId);
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });
  });

  /**
   * Test: Context handles fetch errors
   * Validates: Requirements 4.4
   */
  it('should handle fetch errors gracefully', async () => {
    const errorMessage = 'Failed to fetch enrollments';
    (enrollmentService.fetchEnrollments as any).mockRejectedValue(new Error(errorMessage));

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  /**
   * Test: getEnrollments returns current snapshot
   * Validates: Requirements 4.4
   */
  it('should return enrollments snapshot with getEnrollments', async () => {
    const TestComponentWithGetEnrollments = () => {
      const context = useEnrollment();
      const [count, setCount] = React.useState(0);

      const handleGetEnrollments = () => {
        const snapshot = context.getEnrollments();
        setCount(snapshot.length);
      };

      return (
        <div>
          <div data-testid="enrollments-count">{context.enrollments.length}</div>
          <button onClick={handleGetEnrollments}>Get Snapshot</button>
          <div data-testid="snapshot-count">{count}</div>
        </div>
      );
    };

    const { getByRole } = render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponentWithGetEnrollments />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Click get snapshot button
    act(() => {
      getByRole('button').click();
    });

    expect(screen.getByTestId('snapshot-count')).toHaveTextContent('1');
  });

  /**
   * Test: useEnrollment throws error when used outside provider
   * Validates: Requirements 4.4
   */
  it('should throw error when used outside of provider', () => {
    const TestComponentWithoutProvider = () => {
      const context = useEnrollment();
      return <div>{context.traineeId}</div>;
    };

    // Mock console.error to suppress error output in test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useEnrollment must be used within EnrollmentProvider');

    consoleSpy.mockRestore();
  });

  /**
   * Test: Multiple updates in rapid succession
   * Validates: Requirements 4.4
   */
  it('should handle multiple rapid updates correctly', async () => {
    let updateCallback: any;

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Send multiple updates rapidly
    act(() => {
      // Update 1: Change status
      updateCallback({
        type: 'updated',
        enrollment: { ...mockEnrollment, status: 'active' },
      });

      // Update 2: Add new enrollment
      updateCallback({
        type: 'added',
        enrollment: mockEnrollment2,
      });

      // Update 3: Update first enrollment again
      updateCallback({
        type: 'updated',
        enrollment: { ...mockEnrollment, status: 'completed' },
      });
    });

    // Verify final state
    expect(screen.getByTestId('enrollments-count')).toHaveTextContent('2');
    expect(screen.getByTestId(`enrollment-${mockEnrollmentId}`)).toHaveTextContent('completed');
  });

  /**
   * Test: Error handling when subscribers throw exceptions
   * Validates: Requirements 4.4
   * Ensures that if one subscriber throws an error, other subscribers are still notified
   */
  it('should handle subscriber errors gracefully without affecting other subscribers', async () => {
    let updateCallback: any;
    const workingSubscriber = vi.fn();
    const errorSubscriber = vi.fn(() => {
      throw new Error('Subscriber error');
    });
    const anotherWorkingSubscriber = vi.fn();

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    const TestComponentWithMultipleSubscribers = () => {
      const context = useEnrollment();

      React.useEffect(() => {
        context.subscribe(workingSubscriber);
        context.subscribe(errorSubscriber);
        context.subscribe(anotherWorkingSubscriber);
      }, [context]);

      return (
        <div>
          <div data-testid="enrollments-count">{context.enrollments.length}</div>
        </div>
      );
    };

    // Mock console.error to suppress error output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponentWithMultipleSubscribers />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Simulate update event - should call all subscribers despite one throwing error
    const updatedEnrollment = { ...mockEnrollment, status: 'completed' as const };

    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: updatedEnrollment,
      });
    });

    // Verify all subscribers were called
    expect(workingSubscriber).toHaveBeenCalledWith({
      type: 'updated',
      enrollment: updatedEnrollment,
    });

    expect(errorSubscriber).toHaveBeenCalledWith({
      type: 'updated',
      enrollment: updatedEnrollment,
    });

    expect(anotherWorkingSubscriber).toHaveBeenCalledWith({
      type: 'updated',
      enrollment: updatedEnrollment,
    });

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      '[EnrollmentContext] Subscriber callback error',
      expect.any(Object)
    );

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Multiple subscribers receive same updates independently
   * Validates: Requirements 4.4
   */
  it('should notify multiple independent subscribers of changes', async () => {
    let updateCallback: any;
    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();
    const subscriber3 = vi.fn();

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    const TestComponentWithMultipleSubscribers = () => {
      const context = useEnrollment();

      React.useEffect(() => {
        context.subscribe(subscriber1);
        context.subscribe(subscriber2);
        context.subscribe(subscriber3);
      }, [context]);

      return (
        <div>
          <div data-testid="enrollments-count">{context.enrollments.length}</div>
        </div>
      );
    };

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponentWithMultipleSubscribers />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // Verify all subscribers were called with the same event
    const updatedEnrollment = { ...mockEnrollment, status: 'completed' as const };

    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: updatedEnrollment,
      });
    });

    const expectedEvent = {
      type: 'updated',
      enrollment: updatedEnrollment,
    };

    expect(subscriber1).toHaveBeenCalledWith(expectedEvent);
    expect(subscriber2).toHaveBeenCalledWith(expectedEvent);
    expect(subscriber3).toHaveBeenCalledWith(expectedEvent);
  });

  /**
   * Test: Subscribers can be unsubscribed
   * Validates: Requirements 4.4
   */
  it('should allow subscribers to unsubscribe and stop receiving updates', async () => {
    let updateCallback: any;
    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();

    (enrollmentService.setEnrollmentUpdateHandler as any).mockImplementation((cb) => {
      updateCallback = cb;
      return vi.fn();
    });

    const TestComponentWithUnsubscribe = () => {
      const context = useEnrollment();
      const [unsub, setUnsub] = React.useState<(() => void) | null>(null);

      React.useEffect(() => {
        const unsubscribe1 = context.subscribe(subscriber1);
        const unsubscribe2 = context.subscribe(subscriber2);
        setUnsub(() => unsubscribe1);
      }, [context]);

      return (
        <div>
          <div data-testid="enrollments-count">{context.enrollments.length}</div>
          <button
            onClick={() => {
              if (unsub) unsub();
            }}
          >
            Unsubscribe First
          </button>
        </div>
      );
    };

    const { getByRole } = render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponentWithUnsubscribe />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('enrollments-count')).toHaveTextContent('1');
    });

    // First update - both subscribers should receive it
    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: { ...mockEnrollment, status: 'completed' as const },
      });
    });

    expect(subscriber1).toHaveBeenCalledTimes(1);
    expect(subscriber2).toHaveBeenCalledTimes(1);

    // Unsubscribe first subscriber
    act(() => {
      getByRole('button').click();
    });

    // Second update - only subscriber2 should receive it
    act(() => {
      updateCallback({
        type: 'updated',
        enrollment: { ...mockEnrollment, status: 'dropped' as const },
      });
    });

    expect(subscriber1).toHaveBeenCalledTimes(1); // Still 1, not called again
    expect(subscriber2).toHaveBeenCalledTimes(2); // Called again
  });

  /**
   * Test: Context tracks connection status updates
   * Validates: Requirements 4.4, 13.1
   */
  it('should update connection status when service status changes', async () => {
    let connectionStatus = 'connected';
    (enrollmentService.getConnectionStatus as any).mockImplementation(() => connectionStatus);

    render(
      <EnrollmentProvider initialTraineeId={mockTraineeId}>
        <TestComponent />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    // Simulate connection status change
    connectionStatus = 'reconnecting';

    // Wait for status poll interval to update
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('reconnecting');
    });
  });

  /**
   * Test: setTraineeId updates trainee and fetches new enrollments
   * Validates: Requirements 4.4
   */
  it('should fetch new enrollments when traineeId is changed', async () => {
    const testComponent = ({ traineeId }: { traineeId?: string }) => {
      const context = useEnrollment();

      React.useEffect(() => {
        if (traineeId) {
          context.setTraineeId(traineeId);
        }
      }, [traineeId, context]);

      return (
        <div>
          <div data-testid="trainee-id">{context.traineeId || 'none'}</div>
          <div data-testid="enrollments-count">{context.enrollments.length}</div>
        </div>
      );
    };

    const { rerender } = render(
      <EnrollmentProvider>
        <TestComponent traineeId={mockTraineeId} />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('trainee-id')).toHaveTextContent(mockTraineeId);
    });

    // Change to different trainee
    const newTraineeId = 'trainee-789';
    (enrollmentService.fetchEnrollments as any).mockResolvedValue([mockEnrollment2]);

    rerender(
      <EnrollmentProvider>
        <TestComponent traineeId={newTraineeId} />
      </EnrollmentProvider>
    );

    await waitFor(() => {
      expect(enrollmentService.fetchEnrollments).toHaveBeenCalledWith(newTraineeId);
    });
  });
});
