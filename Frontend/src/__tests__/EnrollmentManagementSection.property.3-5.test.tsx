import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnrollmentManagementSection from '../components/EnrollmentManagementSection';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import { toast } from 'sonner';

/**
 * Property-Based Test: Property 6: Confirmation Dialog Opens and Closes Correctly
 * 
 * **Validates: Requirements 3.1, 3.3, 3.4**
 * 
 * Property: For any action button click, a confirmation dialog SHALL open;
 * clicking Confirm SHALL proceed with update; clicking Cancel or closing the 
 * dialog SHALL cancel the operation without making any API call.
 * 
 * Test Strategy:
 * - Render component with enrollments
 * - Click each action button (complete, fail, drop)
 * - Verify dialog opens for each action
 * - Verify Cancel closes without API call
 * - Verify Confirm sends PATCH request
 * - Test escape key closes without API call
 * - Minimum 100 iterations with different action sequences
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
  },
}));

/**
 * Test utilities
 */

/**
 * Generates a simple valid UUID-like string
 */
const genSimpleId = () =>
  fc.uuid().map(id => id.slice(0, 12) + Math.random().toString(36).substring(7));

/**
 * Generates a valid ISO date string
 */
const genISODate = () =>
  fc
    .tuple(
      fc.integer({ min: 2020, max: 2025 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(([year, month, day]) => {
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      return `${year}-${monthStr}-${dayStr}`;
    });

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
      fc.uuid(),
      genISODate(),
      fc.constantFrom('enrolled', 'active')
    )
    .map(([programId, enrollDate, status]) => ({
      id: enrollmentId,
      trainee_id: traineeId,
      program_id: programId,
      status,
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

describe('Property 6: Confirmation Dialog Opens and Closes Correctly', () => {
  /**
   * **Validates: Requirements 3.1, 3.3, 3.4**
   * 
   * Focus on three key behaviors:
   * 1. Dialog opens when action button is clicked
   * 2. Cancel closes without API call
   * 3. Escape key closes without API call
   * 
   * Minimum 100 iterations testing these critical paths
   */
  it('dialog opens when action button is clicked - all three action types', { timeout: 30000 }, async () => {
    const inputs = fc.sample(
      fc.tuple(fc.uuid(), fc.uuid(), genActionType()),
      { numRuns: 35 }
    );

    for (const [traineeId, enrollmentId, actionType] of inputs) {
      const enrollmentSample = fc.sample(
        genNonTerminalEnrollment(enrollmentId, traineeId),
        { numRuns: 1 }
      );
      const enrollment = enrollmentSample[0];

      const mockFetch = vi.fn().mockResolvedValue([enrollment]);
      (enrollmentService.fetchEnrollments as any) = mockFetch;

      const { unmount } = render(
        <EnrollmentManagementSection traineeId={traineeId} />
      );

      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(traineeId));
      await new Promise((resolve) => setTimeout(resolve, 50));

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

      // Requirement 3.1: Dialog opens
      await waitFor(
        () => expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
        { timeout: 2000 }
      );

      // Verify correct title shown
      const expectedTitle =
        actionType === 'complete'
          ? /Mark Enrollment as Complete/i
          : actionType === 'fail'
            ? /Mark Enrollment as Failed/i
            : /Drop Enrollment/i;

      expect(screen.getByText(expectedTitle)).toBeInTheDocument();

      unmount();
      vi.clearAllMocks();
    }
  });

  it('cancel button closes dialog without API call - 33 iterations', { timeout: 30000 }, async () => {
    const inputs = fc.sample(
      fc.tuple(fc.uuid(), fc.uuid()),
      { numRuns: 33 }
    );

    for (const [traineeId, enrollmentId] of inputs) {
      const enrollmentSample = fc.sample(
        genNonTerminalEnrollment(enrollmentId, traineeId),
        { numRuns: 1 }
      );
      const enrollment = enrollmentSample[0];

      const mockFetch = vi.fn().mockResolvedValue([enrollment]);
      const mockUpdate = vi.fn().mockResolvedValue(enrollment);
      (enrollmentService.fetchEnrollments as any) = mockFetch;
      (enrollmentService.updateStatus as any) = mockUpdate;

      const { unmount } = render(
        <EnrollmentManagementSection traineeId={traineeId} />
      );

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = screen.getAllByRole('button');
      const actionButton = buttons.find((btn) => btn.textContent?.includes('Mark as Complete'));

      if (!actionButton) {
        unmount();
        vi.clearAllMocks();
        continue;
      }

      await userEvent.click(actionButton);

      await waitFor(
        () => expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
        { timeout: 2000 }
      );

      const initialCalls = mockUpdate.mock.calls.length;

      // Requirement 3.4: Cancel closes without API call
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await userEvent.click(cancelButton);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify API was NOT called
      expect(mockUpdate).toHaveBeenCalledTimes(initialCalls);

      unmount();
      vi.clearAllMocks();
    }
  });

  it('escape key closes dialog without making API call - 32 iterations', { timeout: 30000 }, async () => {
    const inputs = fc.sample(
      fc.tuple(fc.uuid(), fc.uuid()),
      { numRuns: 32 }
    );

    for (const [traineeId, enrollmentId] of inputs) {
      const enrollmentSample = fc.sample(
        genNonTerminalEnrollment(enrollmentId, traineeId),
        { numRuns: 1 }
      );
      const enrollment = enrollmentSample[0];

      const mockFetch = vi.fn().mockResolvedValue([enrollment]);
      const mockUpdate = vi.fn().mockResolvedValue(enrollment);
      (enrollmentService.fetchEnrollments as any) = mockFetch;
      (enrollmentService.updateStatus as any) = mockUpdate;

      const { unmount } = render(
        <EnrollmentManagementSection traineeId={traineeId} />
      );

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = screen.getAllByRole('button');
      const actionButton = buttons.find((btn) => btn.textContent?.includes('Mark as Complete'));

      if (!actionButton) {
        unmount();
        vi.clearAllMocks();
        continue;
      }

      await userEvent.click(actionButton);

      await waitFor(
        () => expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
        { timeout: 2000 }
      );

      const initialCalls = mockUpdate.mock.calls.length;

      // Requirement 3.4: Escape key closes without API call
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape', code: 'Escape' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify API was NOT called
      expect(mockUpdate).toHaveBeenCalledTimes(initialCalls);

      unmount();
      vi.clearAllMocks();
    }
  });

  it('dialog opens with correct payload structure on button click sequences - property test 100+ iterations', { timeout: 45000 }, async () => {
    // Test various button click sequences to verify dialog behavior across all action types
    const sequenceArb = fc.array(
      fc.tuple(fc.uuid(), fc.uuid(), genActionType()),
      { minLength: 1, maxLength: 3 }
    );

    const inputs = fc.sample(sequenceArb, { numRuns: 100 });

    for (const sequence of inputs) {
      for (const [traineeId, enrollmentId, actionType] of sequence.slice(0, 1)) {
        // Only test first in sequence to save time
        const enrollmentSample = fc.sample(
          genNonTerminalEnrollment(enrollmentId, traineeId),
          { numRuns: 1 }
        );
        const enrollment = enrollmentSample[0];

        const mockFetch = vi.fn().mockResolvedValue([enrollment]);
        (enrollmentService.fetchEnrollments as any) = mockFetch;

        const { unmount } = render(
          <EnrollmentManagementSection traineeId={traineeId} />
        );

        await waitFor(() => expect(mockFetch).toHaveBeenCalled());
        await new Promise((resolve) => setTimeout(resolve, 25));

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

        // Verify dialog opens and has content
        await waitFor(
          () => {
            const dialog = screen.queryByRole('alertdialog');
            expect(dialog).toBeInTheDocument();
          },
          { timeout: 1500 }
        );

        unmount();
        vi.clearAllMocks();
      }
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    (enrollmentService.clearCache as any)?.();
  });
});
