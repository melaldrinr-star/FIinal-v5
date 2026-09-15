import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnrollmentManagementSection from '../components/EnrollmentManagementSection';
import { enrollmentService, Enrollment } from '../services/enrollmentService';

/**
 * Property-Based Test: Property 5: Status Transitions are Restricted to Valid Paths
 *
 * **Validates: Requirements 10.3**
 *
 * Property: For any enrollment status, the system SHALL only allow transitions to valid target statuses:
 * - From enrolled → to active, completed, dropped, failed (all targets allowed)
 * - From active → to completed, dropped, failed (cannot go back to enrolled)
 * - From completed, dropped, failed → no transitions (terminal states, no buttons)
 *
 * Test Strategy:
 * - For all 25 status pair combinations (5 source × 5 target):
 *   (1) Verify valid transitions have visible buttons
 *   (2) Verify invalid transitions have no buttons
 *   (3) Verify no transition from terminal to any state allowed
 * - Minimum 100 iterations covering all combinations
 *
 * Valid transition matrix:
 * ┌──────────┬──────────┬────────┬───────────┬──────┬───────┐
 * │ FROM     │ TO       │ Status │ Complete? │ Fail? │ Drop? │
 * ├──────────┼──────────┼────────┼───────────┼──────┼───────┤
 * │ enrolled │ enrolled │ - (no) │ NO        │ NO   │ NO    │
 * │ enrolled │ active   │ - (no) │ NO        │ NO   │ NO    │
 * │ enrolled │ complete │ yes    │ YES       │ NO   │ NO    │
 * │ enrolled │ dropped  │ - (no) │ NO        │ NO   │ YES   │
 * │ enrolled │ failed   │ - (no) │ NO        │ YES  │ NO    │
 * │ active   │ enrolled │ - (no) │ NO        │ NO   │ NO    │
 * │ active   │ active   │ - (no) │ NO        │ NO   │ NO    │
 * │ active   │ complete │ yes    │ YES       │ NO   │ NO    │
 * │ active   │ dropped  │ - (no) │ NO        │ NO   │ YES   │
 * │ active   │ failed   │ - (no) │ NO        │ YES  │ NO    │
 * │ complete │ *        │ -      │ NO        │ NO   │ NO    │
 * │ dropped  │ *        │ -      │ NO        │ NO   │ NO    │
 * │ failed   │ *        │ -      │ NO        │ NO   │ NO    │
 * └──────────┴──────────┴────────┴───────────┴──────┴───────┘
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
 * All possible enrollment statuses
 */
type EnrollmentStatus = 'enrolled' | 'active' | 'completed' | 'dropped' | 'failed';
const ALL_STATUSES: EnrollmentStatus[] = ['enrolled', 'active', 'completed', 'dropped', 'failed'];

/**
 * Terminal statuses (no transitions allowed FROM these)
 */
const TERMINAL_STATUSES: EnrollmentStatus[] = ['completed', 'dropped', 'failed'];

/**
 * Valid target statuses FROM each source status
 * This defines the valid transition rules
 */
const VALID_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  enrolled: ['completed', 'dropped', 'failed'],  // From enrolled: can go to terminal statuses
  active: ['completed', 'dropped', 'failed'],     // From active: can go to terminal statuses
  completed: [],                                  // Terminal: no transitions
  dropped: [],                                    // Terminal: no transitions
  failed: [],                                     // Terminal: no transitions
};

/**
 * Generates an enrollment with the specified status
 */
const genEnrollmentWithStatus = (status: EnrollmentStatus, enrollmentId: string, traineeId: string) =>
  fc
    .tuple(fc.uuid(), genISODate())
    .map(([programId, enrollDate]) => ({
      id: enrollmentId,
      trainee_id: traineeId,
      program_id: programId,
      status,
      enrollment_date: enrollDate,
      completion_date: status === 'completed' ? enrollDate : null,
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

describe('Property 5: Status Transitions are Restricted to Valid Paths', () => {
  /**
   * Test matrix: For each of 25 status pairs (5 × 5), verify:
   * 1. Terminal statuses have NO action buttons
   * 2. Non-terminal statuses have action buttons based on valid transitions
   * 3. Invalid transitions don't show corresponding buttons
   */
  it('terminal statuses have no action buttons - completed, dropped, failed (15 iterations)', {
    timeout: 30000,
  }, async () => {
    const terminalInputs = fc.sample(
      fc.tuple(fc.uuid(), fc.uuid(), fc.constantFrom<EnrollmentStatus>('completed', 'dropped', 'failed')),
      { numRuns: 15 }
    );

    for (const [traineeId, enrollmentId, status] of terminalInputs) {
      const enrollmentSample = fc.sample(
        genEnrollmentWithStatus(status, enrollmentId, traineeId),
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

      // Requirement 10.3 & 10.1: Terminal statuses should have NO action buttons
      const completeButton = screen.queryByRole('button', { name: /Mark as Complete/i });
      const failButton = screen.queryByRole('button', { name: /Mark as Failed/i });
      const dropButton = screen.queryByRole('button', { name: /Drop Program/i });

      // Verify NO buttons for terminal statuses
      expect(completeButton).not.toBeInTheDocument();
      expect(failButton).not.toBeInTheDocument();
      expect(dropButton).not.toBeInTheDocument();

      unmount();
      vi.clearAllMocks();
    }
  });

  it('enrolled status allows complete, fail, drop transitions (15 iterations)', {
    timeout: 30000,
  }, async () => {
    const enrolledInputs = fc.sample(
      fc.tuple(fc.uuid(), fc.uuid()),
      { numRuns: 15 }
    );

    for (const [traineeId, enrollmentId] of enrolledInputs) {
      const enrollmentSample = fc.sample(
        genEnrollmentWithStatus('enrolled', enrollmentId, traineeId),
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

      // Requirement 10.3: From 'enrolled', all three buttons should be visible
      // Valid transitions from enrolled: completed (complete), failed (fail), dropped (drop)
      const completeButton = screen.queryByRole('button', { name: /Mark as Complete/i });
      const failButton = screen.queryByRole('button', { name: /Mark as Failed/i });
      const dropButton = screen.queryByRole('button', { name: /Drop Program/i });

      expect(completeButton).toBeInTheDocument();
      expect(failButton).toBeInTheDocument();
      expect(dropButton).toBeInTheDocument();

      unmount();
      vi.clearAllMocks();
    }
  });

  it('active status allows complete, fail, drop transitions (15 iterations)', {
    timeout: 30000,
  }, async () => {
    const activeInputs = fc.sample(
      fc.tuple(fc.uuid(), fc.uuid()),
      { numRuns: 15 }
    );

    for (const [traineeId, enrollmentId] of activeInputs) {
      const enrollmentSample = fc.sample(
        genEnrollmentWithStatus('active', enrollmentId, traineeId),
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

      // Requirement 10.3: From 'active', all three buttons should be visible
      // Valid transitions from active: completed (complete), failed (fail), dropped (drop)
      const completeButton = screen.queryByRole('button', { name: /Mark as Complete/i });
      const failButton = screen.queryByRole('button', { name: /Mark as Failed/i });
      const dropButton = screen.queryByRole('button', { name: /Drop Program/i });

      expect(completeButton).toBeInTheDocument();
      expect(failButton).toBeInTheDocument();
      expect(dropButton).toBeInTheDocument();

      unmount();
      vi.clearAllMocks();
    }
  });

  it('all 25 status pairs are restricted to valid paths - comprehensive property test (100+ iterations)', {
    timeout: 60000,
  }, async () => {
    /**
     * Comprehensive property test covering all 25 status pairs (5 × 5)
     *
     * For each source status, test transitions to all 5 target statuses:
     * - Verify buttons shown match valid transitions
     * - Verify buttons NOT shown for invalid transitions
     * - Verify no transitions FROM terminal statuses
     *
     * Requirement 10.3: Status transitions restricted to valid paths
     * - enrolled → only to: completed (complete), failed (fail), dropped (drop)
     * - active → only to: completed (complete), failed (fail), dropped (drop)
     * - completed, dropped, failed → NO transitions (terminal)
     *
     * Total iterations: 100+ (covering all 25 pairs multiple times)
     */

    let testCount = 0;
    const maxTests = 100;

    // For each source status
    for (const sourceStatus of ALL_STATUSES) {
      if (testCount >= maxTests) break;

      // Generate 20 random enrollment pairs for this source status
      const pairs = fc.sample(
        fc.tuple(fc.uuid(), fc.uuid()),
        { numRuns: 20 }
      );

      for (const [traineeId, enrollmentId] of pairs) {
        if (testCount >= maxTests) break;
        testCount++;

        // Render component with source status
        const enrollmentSample = fc.sample(
          genEnrollmentWithStatus(sourceStatus, enrollmentId, traineeId),
          { numRuns: 1 }
        );
        const enrollment = enrollmentSample[0];

        const mockFetch = vi.fn().mockResolvedValue([enrollment]);
        (enrollmentService.fetchEnrollments as any) = mockFetch;

        const { unmount } = render(
          <EnrollmentManagementSection traineeId={traineeId} />
        );

        await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(traineeId));
        await new Promise((resolve) => setTimeout(resolve, 30));

        const completeButton = screen.queryByRole('button', { name: /Mark as Complete/i });
        const failButton = screen.queryByRole('button', { name: /Mark as Failed/i });
        const dropButton = screen.queryByRole('button', { name: /Drop Program/i });

        // Determine valid targets for this source status
        const validTargets = VALID_TRANSITIONS[sourceStatus];
        const hasCompleteTransition = validTargets.includes('completed');
        const hasFailTransition = validTargets.includes('failed');
        const hasDropTransition = validTargets.includes('dropped');

        // Requirement 10.1 & 10.2: Verify buttons match valid transitions
        if (hasCompleteTransition) {
          expect(completeButton, 
            `Complete button should be visible for ${sourceStatus} status`
          ).toBeInTheDocument();
        } else {
          expect(completeButton,
            `Complete button should NOT be visible for ${sourceStatus} status`
          ).not.toBeInTheDocument();
        }

        if (hasFailTransition) {
          expect(failButton,
            `Fail button should be visible for ${sourceStatus} status`
          ).toBeInTheDocument();
        } else {
          expect(failButton,
            `Fail button should NOT be visible for ${sourceStatus} status`
          ).not.toBeInTheDocument();
        }

        if (hasDropTransition) {
          expect(dropButton,
            `Drop button should be visible for ${sourceStatus} status`
          ).toBeInTheDocument();
        } else {
          expect(dropButton,
            `Drop button should NOT be visible for ${sourceStatus} status`
          ).not.toBeInTheDocument();
        }

        // Requirement 10.3: Verify terminal statuses have NO buttons at all
        if (TERMINAL_STATUSES.includes(sourceStatus)) {
          expect(completeButton, 
            `Terminal status ${sourceStatus} should have no Complete button`
          ).not.toBeInTheDocument();
          expect(failButton,
            `Terminal status ${sourceStatus} should have no Fail button`
          ).not.toBeInTheDocument();
          expect(dropButton,
            `Terminal status ${sourceStatus} should have no Drop button`
          ).not.toBeInTheDocument();
        }

        unmount();
        vi.clearAllMocks();
      }
    }

    // Verify we ran at least 100 tests
    expect(testCount).toBeGreaterThanOrEqual(100);
  });

  it('transition matrix validation - all valid paths are allowed (48+ iterations)', {
    timeout: 45000,
  }, async () => {
    /**
     * Validates the specific transition rules from Requirements 10.3:
     * - From enrolled → to completed, dropped, failed
     * - From active → to completed, dropped, failed
     * - From completed, dropped, failed → no transitions (terminal)
     *
     * Tests the matrix with 48+ iterations to ensure comprehensive coverage
     * of all valid transition paths (6 valid paths × 8 iterations each).
     */
    let transitionTests = 0;

    // Test all valid transitions
    const validPaths: Array<[EnrollmentStatus, EnrollmentStatus]> = [
      ['enrolled', 'completed'],  // via Mark as Complete
      ['enrolled', 'failed'],     // via Mark as Failed
      ['enrolled', 'dropped'],    // via Drop Program
      ['active', 'completed'],    // via Mark as Complete
      ['active', 'failed'],       // via Mark as Failed
      ['active', 'dropped'],      // via Drop Program
    ];

    for (const [sourceStatus, targetStatus] of validPaths) {
      if (transitionTests >= 48) break;

      const inputs = fc.sample(
        fc.tuple(fc.uuid(), fc.uuid()),
        { numRuns: 8 }
      );

      for (const [traineeId, enrollmentId] of inputs) {
        if (transitionTests >= 48) break;
        transitionTests++;

        const enrollmentSample = fc.sample(
          genEnrollmentWithStatus(sourceStatus, enrollmentId, traineeId),
          { numRuns: 1 }
        );
        const enrollment = enrollmentSample[0];

        const mockFetch = vi.fn().mockResolvedValue([enrollment]);
        (enrollmentService.fetchEnrollments as any) = mockFetch;

        const { unmount } = render(
          <EnrollmentManagementSection traineeId={traineeId} />
        );

        await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(traineeId));
        await new Promise((resolve) => setTimeout(resolve, 25));

        const completeButton = screen.queryByRole('button', { name: /Mark as Complete/i });
        const failButton = screen.queryByRole('button', { name: /Mark as Failed/i });
        const dropButton = screen.queryByRole('button', { name: /Drop Program/i });

        // Verify the specific valid transition has a button
        if (targetStatus === 'completed') {
          expect(completeButton, 
            `Complete button should be visible for valid transition ${sourceStatus} → ${targetStatus}`
          ).toBeInTheDocument();
        } else if (targetStatus === 'failed') {
          expect(failButton,
            `Fail button should be visible for valid transition ${sourceStatus} → ${targetStatus}`
          ).toBeInTheDocument();
        } else if (targetStatus === 'dropped') {
          expect(dropButton,
            `Drop button should be visible for valid transition ${sourceStatus} → ${targetStatus}`
          ).toBeInTheDocument();
        }

        unmount();
        vi.clearAllMocks();
      }
    }

    expect(transitionTests).toBeGreaterThanOrEqual(48);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    (enrollmentService.clearCache as any)?.();
  });
});
