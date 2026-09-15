import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import EnrollmentManagementSection from './EnrollmentManagementSection';
import * as enrollmentServiceModule from '../services/enrollmentService';
import type { Enrollment } from '../services/enrollmentService';

// Mock dependencies
vi.mock('../services/enrollmentService', () => ({
  enrollmentService: {
    fetchEnrollments: vi.fn(),
    setEnrollmentUpdateHandler: vi.fn(() => vi.fn()), // Returns unsubscribe function
    getConnectionStatus: vi.fn(() => 'connected'),
    forceRefresh: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createTestEnrollment = (overrides?: Partial<Enrollment>): Enrollment => ({
  id: 'test-' + Math.random().toString(36).substring(7),
  trainee_id: 'trainee-' + Math.random().toString(36).substring(7),
  program_id: 'prog-' + Math.random().toString(36).substring(7),
  status: 'enrolled',
  enrollment_date: '2024-01-15',
  completion_date: null,
  final_grade: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  program: {
    id: 'p1',
    name: 'TestProgram',
    description: 'Test',
    start_date: '2024-01-15',
    end_date: '2024-06-15',
    status: 'active',
  },
  trainee: {
    id: 't1',
    first_name: 'Test',
    last_name: 'User',
    middle_name: 'M',
    email: 'test@example.com',
  },
  ...overrides,
});

describe(
  'EnrollmentManagementSection - Property Tests',
  { timeout: 60000 },
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Property 9: Enrollment Metadata Displays All Required Fields', () => {
      /**
       * **Validates: Requirements 1.2, 11.1, 11.2, 11.3**
       *
       * For any enrollment with various field combinations, all required metadata SHALL be rendered:
       * program name, enrollment status (as badge), enrollment date (YYYY-MM-DD format),
       * completion date or "N/A" if not applicable, final grade or "N/A" if not applicable.
       *
       * Test Strategy: Generate enrollments with:
       * (1) all fields present, (2) missing completion_date, (3) missing final_grade, (4) both missing
       * Render component and verify all required fields are visible with consistent formatting
       * Minimum 100 iterations with field combinations
       */
      it(
        'should display all required metadata fields for any enrollment field combination',
        { timeout: 60000 },
        async () => {
          // Define all enrollment statuses for property testing
          const statuses: Enrollment['status'][] = ['enrolled', 'active', 'completed', 'dropped', 'failed'];

          // Generate test data with all field combinations
          const fieldCombinationGenerator = fc.tuple(
            fc.constantFrom(...statuses),
            fc.boolean(), // has completion_date
            fc.boolean()  // has final_grade
          );

          await fc.assert(
            fc.asyncProperty(
              fieldCombinationGenerator,
              async ([status, hasCompletionDate, hasFinalGrade]) => {
                vi.clearAllMocks();

                // Create enrollment with appropriate field values based on combination
                const enrollment = createTestEnrollment({
                  status,
                  completion_date: hasCompletionDate ? '2024-05-20' : null,
                  final_grade: hasFinalGrade ? fc.sample(fc.integer({ min: 0, max: 100 }), 1)[0] : null,
                });

                vi.mocked(enrollmentServiceModule.enrollmentService.fetchEnrollments).mockResolvedValueOnce([
                  enrollment,
                ]);

                const { unmount } = render(<EnrollmentManagementSection traineeId="t1" />);

                try {
                  await waitFor(() => {
                    // Verify all required fields are present

                    // 1. Program name must be visible
                    expect(screen.getByText('TestProgram')).toBeTruthy();

                    // 2. Enrollment status badge must be visible with correct label
                    const statusLabels: Record<Enrollment['status'], string> = {
                      enrolled: 'Enrolled',
                      active: 'Active',
                      completed: 'Completed',
                      dropped: 'Dropped',
                      failed: 'Failed',
                    };
                    expect(screen.getByText(statusLabels[status])).toBeTruthy();

                    // 3. Enrollment date must be visible in YYYY-MM-DD format
                    expect(screen.getByText('2024-01-15')).toBeTruthy();

                    // 4. Completion date must be visible or show N/A
                    if (hasCompletionDate) {
                      expect(screen.getByText('2024-05-20')).toBeTruthy();
                    } else {
                      // Must have N/A for completion date
                      const naElements = screen.getAllByText('N/A');
                      expect(naElements.length).toBeGreaterThan(0);
                    }

                    // 5. Final grade must be visible as percentage or show N/A
                    if (hasFinalGrade) {
                      const gradeElement = Array.from(screen.getAllByText(/\d+%/)).find(
                        (el) => el.textContent?.includes('%')
                      );
                      expect(gradeElement).toBeTruthy();
                    } else {
                      // Must have N/A for final grade
                      const naElements = screen.getAllByText('N/A');
                      expect(naElements.length).toBeGreaterThan(0);
                    }

                    // 6. Verify consistent formatting
                    // Check that the component renders without errors and is readable
                    const enrollmentCard = screen.getByText('TestProgram').closest('.ds-card');
                    expect(enrollmentCard).toBeTruthy();
                  });
                } finally {
                  unmount();
                }
              }
            ),
            { numRuns: 120 } // Run 120 iterations to exceed minimum of 100
          );
        }
      );

      /**
       * Test all required fields are present and consistently formatted for all statuses
       */
      it(
        'should display required fields consistently across all enrollment statuses',
        { timeout: 30000 },
        async () => {
          const statuses: Enrollment['status'][] = ['enrolled', 'active', 'completed', 'dropped', 'failed'];

          await fc.assert(
            fc.asyncProperty(
              fc.constantFrom(...statuses),
              async (status) => {
                vi.clearAllMocks();
                const enrollment = createTestEnrollment({
                  status,
                  completion_date: '2024-05-20',
                  final_grade: 85,
                });

                vi.mocked(enrollmentServiceModule.enrollmentService.fetchEnrollments).mockResolvedValueOnce([
                  enrollment,
                ]);

                const { unmount } = render(<EnrollmentManagementSection traineeId="t1" />);

                try {
                  await waitFor(() => {
                    // All required fields must be present
                    expect(screen.getByText('TestProgram')).toBeTruthy();

                    const statusLabels: Record<Enrollment['status'], string> = {
                      enrolled: 'Enrolled',
                      active: 'Active',
                      completed: 'Completed',
                      dropped: 'Dropped',
                      failed: 'Failed',
                    };
                    expect(screen.getByText(statusLabels[status])).toBeTruthy();

                    // Dates formatted as YYYY-MM-DD
                    expect(screen.getByText('2024-01-15')).toBeTruthy();
                    expect(screen.getByText('2024-05-20')).toBeTruthy();

                    // Grade formatted as percentage
                    expect(screen.getByText('85%')).toBeTruthy();
                  });
                } finally {
                  unmount();
                }
              }
            ),
            { numRuns: 20 }
          );
        }
      );

      /**
       * Test that N/A is displayed for missing optional fields
       */
      it(
        'should display N/A for each missing optional field independently',
        { timeout: 30000 },
        async () => {
          // Test cases: (hasCompletion, hasFinalGrade)
          const testCases: Array<[boolean, boolean, string]> = [
            [false, false, 'both missing'],
            [false, true, 'completion_date missing'],
            [true, false, 'final_grade missing'],
          ];

          for (const [hasCompletion, hasGrade, description] of testCases) {
            vi.clearAllMocks();
            const enrollment = createTestEnrollment({
              completion_date: hasCompletion ? '2024-05-20' : null,
              final_grade: hasGrade ? 85 : null,
            });

            vi.mocked(enrollmentServiceModule.enrollmentService.fetchEnrollments).mockResolvedValueOnce([
              enrollment,
            ]);

            const { unmount } = render(<EnrollmentManagementSection traineeId="t1" />);

            try {
              await waitFor(() => {
                const naElements = screen.getAllByText('N/A');

                if (!hasCompletion && !hasGrade) {
                  // Both missing: should have 2 N/A values
                  expect(naElements.length).toBeGreaterThanOrEqual(2);
                } else if (!hasCompletion || !hasGrade) {
                  // One missing: should have at least 1 N/A value
                  expect(naElements.length).toBeGreaterThanOrEqual(1);
                }
              });
            } finally {
              unmount();
            }
          }
        }
      );

      /**
       * Test that dates are always formatted as YYYY-MM-DD
       */
      it(
        'should format enrollment and completion dates as YYYY-MM-DD for any valid dates',
        { timeout: 30000 },
        async () => {
          // Generate random valid dates
          const dateArb = fc.tuple(fc.integer({ min: 2020, max: 2024 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }));

          await fc.assert(
            fc.asyncProperty(dateArb, async ([year, month, day]) => {
              vi.clearAllMocks();

              const monthStr = String(month).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${year}-${monthStr}-${dayStr}`;

              const enrollment = createTestEnrollment({
                enrollment_date: dateStr,
                completion_date: dateStr,
              });

              vi.mocked(enrollmentServiceModule.enrollmentService.fetchEnrollments).mockResolvedValueOnce([
                enrollment,
              ]);

              const { unmount } = render(<EnrollmentManagementSection traineeId="t1" />);

              try {
                await waitFor(() => {
                  // Should find the formatted date (appears twice: enrollment and completion)
                  const dateElements = screen.getAllByText(dateStr);
                  expect(dateElements.length).toBeGreaterThanOrEqual(2);

                  // Verify format is correct YYYY-MM-DD
                  dateElements.forEach((el) => {
                    expect(el.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                  });
                });
              } finally {
                unmount();
              }
            }),
            { numRuns: 20 }
          );
        }
      );

      /**
       * Test that grades are formatted as percentages for any valid grade
       */
      it(
        'should format final grades as percentages for all valid grade values',
        { timeout: 30000 },
        async () => {
          await fc.assert(
            fc.asyncProperty(fc.integer({ min: 0, max: 100 }), async (grade) => {
              vi.clearAllMocks();
              const enrollment = createTestEnrollment({ final_grade: grade });

              vi.mocked(enrollmentServiceModule.enrollmentService.fetchEnrollments).mockResolvedValueOnce([
                enrollment,
              ]);

              const { unmount } = render(<EnrollmentManagementSection traineeId="t1" />);

              try {
                await waitFor(() => {
                  const gradeText = `${grade}%`;
                  expect(screen.getByText(gradeText)).toBeTruthy();

                  // Verify it's formatted with the % symbol
                  const element = screen.getByText(gradeText);
                  expect(element.textContent).toBe(gradeText);
                });
              } finally {
                unmount();
              }
            }),
            { numRuns: 50 }
          );
        }
      );
    });
  }
);
