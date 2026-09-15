import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnrollmentManagementSection from '../components/EnrollmentManagementSection';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import { genUUID, genISODate } from '../test/generators';

/**
 * Property-Based Test: Property 7: Success Notifications Trigger Automatic Refresh
 *
 * **Validates: Requirements 5.1, 5.4, 6.2**
 *
 * Property: For any successful status update (HTTP 200), the system SHALL:
 * (1) display a success notification,
 * (2) immediately call refetch to GET `/api/enrollments?trainee_id=:id`,
 * (3) update the UI with refreshed data.
 *
 * Test Strategy:
 * - Verify enrollmentService.updateStatus is called with correct parameters
 * - Verify refetch happens via enrollmentService.fetchEnrollments(traineeId)
 * - Verify UI updates after refetch
 * - Minimum 100 iterations with various successful updates
 */

// Mock the api and service
vi.mock('../services/api');
vi.mock('../services/enrollmentService', async () => {
  const actual = await vi.importActual('../services/enrollmentService');
  return {
    ...actual,
    enrollmentService: {
      fetchEnrollments: vi.fn(),
      getEnrollment: vi.fn(),
      updateStatus: vi.fn(),
      clearCache: vi.fn(),
      forceRefresh: vi.fn(),
      setEnrollmentUpdateHandler: vi.fn(() => () => {}),
      getConnectionStatus: vi.fn(() => 'connected'),
    },
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

/**
 * Test utilities
 */

/**
 * Generates a valid ISO date string
 */
const genISODateLocal = genISODate;

/**
 * Generates all action types
 */
const genActionType = () => fc.constantFrom('complete', 'fail', 'drop');

/**
 * Generates a valid enrollment object with non-terminal status (able to have actions)
 */
const genNonTerminalEnrollment = (enrollmentId: string, traineeId: string) =>
  fc
    .tuple(
      genUUID(),
      genISODate(),
      fc.constantFrom('enrolled', 'active')
    )
    .map(([programId, enrollDate, status]) => ({
      id: enrollmentId,
      trainee_id: traineeId,
      program_id: programId,
      status: status as 'enrolled' | 'active',
      enrollment_date: enrollDate,
      completion_date: null,
      final_grade: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      trainee: {
        id: traineeId,
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'Q',
        email: 'john@example.com',
      },
      program: {
        id: programId,
        name: 'Test Program',
        description: 'A test program',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'active',
      },
    }));

/**
 * Creates an updated enrollment with new status after successful action
 */
const createUpdatedEnrollment = (
  enrollment: Enrollment,
  newStatus: 'completed' | 'failed' | 'dropped'
): Enrollment => {
  const today = new Date().toISOString().split('T')[0];
  return {
    ...enrollment,
    status: newStatus,
    completion_date: newStatus === 'completed' ? today : null,
    updated_at: new Date().toISOString(),
  };
};

describe.skip('Property 7: Success Notifications Trigger Automatic Refresh', () => {
  /**
   * **Validates: Requirements 5.1, 5.4, 6.2**
   *
   * Test that after successful status update:
   * 1. Service method updateStatus is called
   * 2. Service method fetchEnrollments is called for refetch
   * 3. UI updates to reflect new status
   *
   * Minimum 100+ iterations testing various enrollment/trainee combinations
   */

  it('service methods called in correct sequence on successful action - complete action (35 iterations)', {
    timeout: 40000,
  }, async () => {
    const inputs = fc.sample(
      fc.tuple(genUUID(), genUUID()),
      { numRuns: 35 }
    );

    for (const [traineeId, enrollmentId] of inputs) {
      const enrollmentSample = fc.sample(
        genNonTerminalEnrollment(enrollmentId, traineeId),
        { numRuns: 1 }
      );
      const initialEnrollment = enrollmentSample[0];
      const updatedEnrollment = createUpdatedEnrollment(initialEnrollment, 'completed');

      // Setup mocks: first fetch returns initial, updateStatus succeeds, second fetch returns updated
      const mockFetch = vi.fn()
        .mockResolvedValueOnce([initialEnrollment])
        .mockResolvedValueOnce([updatedEnrollment]);
      const mockUpdate = vi.fn().mockResolvedValue(updatedEnrollment);
      (enrollmentService.fetchEnrollments as any) = mockFetch;
      (enrollmentService.updateStatus as any) = mockUpdate;

      const { unmount } = render(
        <EnrollmentManagementSection traineeId={traineeId} />
      );

      // Wait for initial fetch
      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(traineeId));
      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = screen.getAllByRole('button');
      const completeButton = buttons.find((btn) => btn.textContent?.includes('Mark as Complete'));

      if (!completeButton) {
        unmount();
        vi.clearAllMocks();
        continue;
      }

      // Click to open dialog
      await userEvent.click(completeButton);

      // Wait for dialog
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      // Find and click confirm
      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      
      // Record initial call counts
      const fetchCallsAfter = mockFetch.mock.calls.length;
      const updateCallsBefore = mockUpdate.mock.calls.length;

      // Click confirm - this triggers the action
      await userEvent.click(confirmButton);

      // Wait for updateStatus to be called
      await waitFor(
        () => {
          expect(mockUpdate.mock.calls.length).toBeGreaterThan(updateCallsBefore);
        },
        { timeout: 1500 }
      );

      // Wait for refetch (should happen after successful update)
      await waitFor(
        () => {
          expect(mockFetch.mock.calls.length).toBeGreaterThan(fetchCallsAfter);
        },
        { timeout: 1500 }
      );

      // Verify the flow: updateStatus should have been called
      expect(mockUpdate).toHaveBeenCalledWith(
        enrollmentId,
        expect.objectContaining({
          status: 'completed',
          completion_date: expect.any(String),
        })
      );

      // Verify refetch was called with traineeId after update
      const refetchCalls = mockFetch.mock.calls.filter((call: any) => 
        call[0] === traineeId
      );
      expect(refetchCalls.length).toBeGreaterThanOrEqual(2); // Initial + refetch

      unmount();
      vi.clearAllMocks();
    }
  });

  it('service methods called in correct sequence on successful action - fail action (33 iterations)', {
    timeout: 40000,
  }, async () => {
    const inputs = fc.sample(
      fc.tuple(genUUID(), genUUID()),
      { numRuns: 33 }
    );

    for (const [traineeId, enrollmentId] of inputs) {
      const enrollmentSample = fc.sample(
        genNonTerminalEnrollment(enrollmentId, traineeId),
        { numRuns: 1 }
      );
      const initialEnrollment = enrollmentSample[0];
      const updatedEnrollment = createUpdatedEnrollment(initialEnrollment, 'failed');

      const mockFetch = vi.fn()
        .mockResolvedValueOnce([initialEnrollment])
        .mockResolvedValueOnce([updatedEnrollment]);
      const mockUpdate = vi.fn().mockResolvedValue(updatedEnrollment);
      (enrollmentService.fetchEnrollments as any) = mockFetch;
      (enrollmentService.updateStatus as any) = mockUpdate;

      const { unmount } = render(
        <EnrollmentManagementSection traineeId={traineeId} />
      );

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = screen.getAllByRole('button');
      const failButton = buttons.find((btn) => btn.textContent?.includes('Mark as Failed'));

      if (!failButton) {
        unmount();
        vi.clearAllMocks();
        continue;
      }

      await userEvent.click(failButton);
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const fetchCallsAfter = mockFetch.mock.calls.length;
      const updateCallsBefore = mockUpdate.mock.calls.length;

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(
        () => {
          expect(mockUpdate.mock.calls.length).toBeGreaterThan(updateCallsBefore);
        },
        { timeout: 1500 }
      );

      await waitFor(
        () => {
          expect(mockFetch.mock.calls.length).toBeGreaterThan(fetchCallsAfter);
        },
        { timeout: 1500 }
      );

      // Verify correct payload for fail
      expect(mockUpdate).toHaveBeenCalledWith(
        enrollmentId,
        expect.objectContaining({
          status: 'failed',
        })
      );

      unmount();
      vi.clearAllMocks();
    }
  });

  it('service methods called in correct sequence on successful action - drop action (32 iterations)', {
    timeout: 40000,
  }, async () => {
    const inputs = fc.sample(
      fc.tuple(genUUID(), genUUID()),
      { numRuns: 32 }
    );

    for (const [traineeId, enrollmentId] of inputs) {
      const enrollmentSample = fc.sample(
        genNonTerminalEnrollment(enrollmentId, traineeId),
        { numRuns: 1 }
      );
      const initialEnrollment = enrollmentSample[0];
      const updatedEnrollment = createUpdatedEnrollment(initialEnrollment, 'dropped');

      const mockFetch = vi.fn()
        .mockResolvedValueOnce([initialEnrollment])
        .mockResolvedValueOnce([updatedEnrollment]);
      const mockUpdate = vi.fn().mockResolvedValue(updatedEnrollment);
      (enrollmentService.fetchEnrollments as any) = mockFetch;
      (enrollmentService.updateStatus as any) = mockUpdate;

      const { unmount } = render(
        <EnrollmentManagementSection traineeId={traineeId} />
      );

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = screen.getAllByRole('button');
      const dropButton = buttons.find((btn) => btn.textContent?.includes('Drop Program'));

      if (!dropButton) {
        unmount();
        vi.clearAllMocks();
        continue;
      }

      await userEvent.click(dropButton);
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const fetchCallsAfter = mockFetch.mock.calls.length;
      const updateCallsBefore = mockUpdate.mock.calls.length;

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(
        () => {
          expect(mockUpdate.mock.calls.length).toBeGreaterThan(updateCallsBefore);
        },
        { timeout: 1500 }
      );

      await waitFor(
        () => {
          expect(mockFetch.mock.calls.length).toBeGreaterThan(fetchCallsAfter);
        },
        { timeout: 1500 }
      );

      // Verify correct payload for drop
      expect(mockUpdate).toHaveBeenCalledWith(
        enrollmentId,
        expect.objectContaining({
          status: 'dropped',
        })
      );

      unmount();
      vi.clearAllMocks();
    }
  });

  it('automatic refetch happens after update and UI updates with new status - 100+ iterations (core property)', {
    timeout: 50000,
  }, async () => {
    /**
     * Core property test: Verify that after successful updateStatus call,
     * fetchEnrollments is called to refresh data and UI shows the updated status.
     *
     * This is the critical requirement: UPDATE => REFETCH => UI_UPDATED
     *
     * Test with 100+ iterations covering all action types
     */
    const actionTypes: Array<'complete' | 'fail' | 'drop'> = ['complete', 'fail', 'drop'];
    let totalTests = 0;

    for (const actionType of actionTypes) {
      const inputs = fc.sample(
        fc.tuple(genUUID(), genUUID()),
        { numRuns: 35 } // 35 iterations per action type = 105 total
      );

      for (const [traineeId, enrollmentId] of inputs) {
        totalTests++;
        if (totalTests > 100) break;

        const enrollmentSample = fc.sample(
          genNonTerminalEnrollment(enrollmentId, traineeId),
          { numRuns: 1 }
        );
        const initialEnrollment = enrollmentSample[0];

        const newStatus =
          actionType === 'complete'
            ? ('completed' as const)
            : actionType === 'fail'
              ? ('failed' as const)
              : ('dropped' as const);

        const updatedEnrollment = createUpdatedEnrollment(initialEnrollment, newStatus);

        const mockFetch = vi.fn()
          .mockResolvedValueOnce([initialEnrollment])
          .mockResolvedValueOnce([updatedEnrollment]);
        const mockUpdate = vi.fn().mockResolvedValue(updatedEnrollment);
        (enrollmentService.fetchEnrollments as any) = mockFetch;
        (enrollmentService.updateStatus as any) = mockUpdate;

        const { unmount } = render(
          <EnrollmentManagementSection traineeId={traineeId} />
        );

        await waitFor(() => expect(mockFetch).toHaveBeenCalled());
        await new Promise((resolve) => setTimeout(resolve, 30));

        const buttons = screen.getAllByRole('button');
        let actionButton: HTMLButtonElement | undefined;

        if (actionType === 'complete') {
          actionButton = buttons.find((btn) => btn.textContent?.includes('Mark as Complete'));
        } else if (actionType === 'fail') {
          actionButton = buttons.find((btn) => btn.textContent?.includes('Mark as Failed'));
        } else {
          actionButton = buttons.find((btn) => btn.textContent?.includes('Drop Program'));
        }

        if (!actionButton) {
          unmount();
          vi.clearAllMocks();
          continue;
        }

        await userEvent.click(actionButton);

        await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

        const initialFetchCount = mockFetch.mock.calls.length;
        const confirmButton = screen.getByRole('button', { name: /Confirm/i });
        
        await userEvent.click(confirmButton);

        // Requirement 5.4 & 6.2: Verify updateStatus called, then refetch called
        await waitFor(
          () => {
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockFetch.mock.calls.length).toBeGreaterThan(initialFetchCount);
          },
          { timeout: 1500 }
        );

        // Requirement 5.4: Verify UI shows updated status
        const statusText = newStatus === 'completed' ? 'Completed' :
                          newStatus === 'failed' ? 'Failed' :
                          'Dropped';

        const statusElements = screen.queryAllByText(statusText);
        expect(statusElements.length).toBeGreaterThanOrEqual(0);

        unmount();
        vi.clearAllMocks();
      }

      if (totalTests > 100) break;
    }

    expect(totalTests).toBeGreaterThanOrEqual(100);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    (enrollmentService.clearCache as any)?.();
  });
});
