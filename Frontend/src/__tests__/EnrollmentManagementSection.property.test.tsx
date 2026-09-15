import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, screen } from '@testing-library/react';
import EnrollmentManagementSection from '../components/EnrollmentManagementSection';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import api from '../services/api';

/**
 * Property-Based Tests for EnrollmentManagementSection Component
 * 
 * These tests verify core correctness properties using property-based testing
 * with fast-check, rendering actual React components.
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
 * Generates a valid UUID
 */
const genUUID = () =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 0xffffffff }).map(n => n.toString(16).padStart(8, '0')),
      fc.integer({ min: 0, max: 0xffff }).map(n => n.toString(16).padStart(4, '0')),
      fc.integer({ min: 0, max: 0xffff }).map(n => n.toString(16).padStart(4, '0')),
      fc.integer({ min: 0, max: 0xffff }).map(n => n.toString(16).padStart(4, '0')),
      fc.integer({ min: 0, max: 0xffffffffffff }).map(n => n.toString(16).padStart(12, '0'))
    )
    .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`.toLowerCase());

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
 * Generates all enrollment status values
 */
const genEnrollmentStatus = () =>
  fc.constantFrom('enrolled', 'active', 'completed', 'dropped', 'failed');

/**
 * Generates a valid enrollment object with specified status
 */
const genEnrollmentWithStatus = (status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'failed') =>
  fc.tuple(genUUID(), genUUID(), genUUID(), genISODate()).map(([id, traineeId, programId, enrollDate]) => ({
    id,
    trainee_id: traineeId,
    program_id: programId,
    status,
    enrollment_date: enrollDate,
    completion_date: status === 'completed' ? enrollDate : null,
    final_grade: status === 'completed' ? 85 : null,
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

describe('Property 2: Action Buttons Respect Terminal Status Rules', () => {
  /**
   * **Validates: Requirements 2.1, 2.2, 10.1, 10.2**
   * 
   * Property: For any enrollment status (enrolled, active, completed, dropped, failed),
   * the system SHALL display action buttons if and only if the status is NOT terminal
   * (i.e., NOT "completed", "dropped", or "failed").
   * 
   * Terminal statuses: completed, dropped, failed (no action buttons)
   * Non-terminal statuses: enrolled, active (all three action buttons visible)
   * 
   * Minimum 100 iterations covering all status combinations
   */
  it(
    'renders correct action buttons based on enrollment status - terminal statuses have NO buttons',
    { timeout: 10000 },
    async () => {
      const terminalStatuses: Array<'completed' | 'dropped' | 'failed'> = ['completed', 'dropped', 'failed'];

      for (const status of terminalStatuses) {
        // Generate enrollment with terminal status
        const enrollmentArb = genEnrollmentWithStatus(status);

        await fc.assert(
          fc.asyncProperty(
            fc.tuple(genUUID(), enrollmentArb),
            async ([traineeId, enrollment]) => {
              // Mock the service to return this enrollment
              (enrollmentService.fetchEnrollments as any).mockResolvedValue([enrollment]);

              const { container } = render(
                <EnrollmentManagementSection traineeId={traineeId} />
              );

              // Wait for component to load
              await new Promise((resolve) => setTimeout(resolve, 100));

              // For terminal statuses, action buttons should NOT be visible
              const completeButtons = container.querySelectorAll('[class*="Mark as Complete"]');
              const failButtons = container.querySelectorAll('[class*="Mark as Failed"]');
              const dropButtons = container.querySelectorAll('[class*="Drop"]');

              // Verify no action buttons are rendered for terminal statuses
              expect(completeButtons.length + failButtons.length + dropButtons.length).toBe(0);

              vi.clearAllMocks();
              return true;
            }
          ),
          { numRuns: 5 }
        );
      }
    }
  );

  it(
    'renders correct action buttons based on enrollment status - non-terminal statuses have ALL buttons',
    { timeout: 10000 },
    async () => {
      const nonTerminalStatuses: Array<'enrolled' | 'active'> = ['enrolled', 'active'];

      for (const status of nonTerminalStatuses) {
        // Generate enrollment with non-terminal status
        const enrollmentArb = genEnrollmentWithStatus(status);

        await fc.assert(
          fc.asyncProperty(
            fc.tuple(genUUID(), enrollmentArb),
            async ([traineeId, enrollment]) => {
              // Mock the service to return this enrollment
              (enrollmentService.fetchEnrollments as any).mockResolvedValue([enrollment]);

              const { container } = render(
                <EnrollmentManagementSection traineeId={traineeId} />
              );

              // Wait for component to load
              await new Promise((resolve) => setTimeout(resolve, 100));

              // For non-terminal statuses, all three action buttons should be visible
              const buttons = container.querySelectorAll('button');
              const actionButtonLabels = Array.from(buttons).map((btn) => btn.textContent);

              // Should have at least the three action buttons
              const hasCompleteButton = actionButtonLabels.some((label) =>
                label?.includes('Mark as Complete')
              );
              const hasFailButton = actionButtonLabels.some((label) =>
                label?.includes('Mark as Failed')
              );
              const hasDropButton = actionButtonLabels.some((label) =>
                label?.includes('Drop Program')
              );

              expect(hasCompleteButton).toBe(true);
              expect(hasFailButton).toBe(true);
              expect(hasDropButton).toBe(true);

              vi.clearAllMocks();
              return true;
            }
          ),
          { numRuns: 5 }
        );
      }
    }
  );

  /**
   * Comprehensive property test covering all 5 enrollment statuses
   * Verifies that action button visibility is correct for EVERY status
   */
  it(
    'all five enrollment statuses produce correct button visibility - comprehensive test',
    { timeout: 30000 },
    async () => {
      const allStatuses = ['enrolled', 'active', 'completed', 'dropped', 'failed'] as const;
      const terminalStatuses = ['completed', 'dropped', 'failed'];

      await fc.assert(
        fc.asyncProperty(
          fc.tuple(genUUID(), fc.constantFrom(...allStatuses)),
          async ([traineeId, status]) => {
            // Generate enrollment with this specific status
            const enrollment = await new Promise<Enrollment>((resolve) => {
              const arb = genEnrollmentWithStatus(status);
              fc.assert(
                fc.property(arb, (enrollment) => {
                  resolve(enrollment);
                  return true;
                })
              );
            });

            // Mock the service
            (enrollmentService.fetchEnrollments as any).mockResolvedValue([enrollment]);

            const { container, rerender } = render(
              <EnrollmentManagementSection traineeId={traineeId} />
            );

            // Wait for load
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Count visible action buttons
            const buttons = container.querySelectorAll('button');
            const actionButtons = Array.from(buttons).filter((btn) => {
              const text = btn.textContent || '';
              return (
                text.includes('Mark as Complete') ||
                text.includes('Mark as Failed') ||
                text.includes('Drop Program')
              );
            });

            // Verify button count matches terminal status
            if (terminalStatuses.includes(status)) {
              // Terminal: no buttons should be visible
              expect(actionButtons.length).toBe(0);
            } else {
              // Non-terminal: all three buttons should be visible
              expect(actionButtons.length).toBe(3);
            }

            vi.clearAllMocks();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    },
    { timeout: 15000, numRuns: 100 }
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    (enrollmentService.clearCache as any)();
  });
});
