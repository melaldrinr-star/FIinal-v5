import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnrollmentManagementSection from '../EnrollmentManagementSection';
import { enrollmentService } from '../../services/enrollmentService';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../services/enrollmentService', () => ({
  enrollmentService: {
    fetchEnrollments: vi.fn(),
    updateStatus: vi.fn(),
    getEnrollment: vi.fn(),
    clearCache: vi.fn(),
    forceRefresh: vi.fn(),
    setEnrollmentUpdateHandler: vi.fn(() => () => {}),
    getConnectionStatus: vi.fn(() => 'connected'),
  },
}));
vi.mock('sonner');

describe('EnrollmentManagementSection - Error Handling', () => {
  const mockTraineeId = 'trainee-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Task 6.1: Retry Functionality for Failed Requests
  // ============================================================================

  describe('Task 6.1: Retry functionality for failed requests', () => {
    it('should display retry button when fetch fails (Task 6.1)', async () => {
      // Arrange: Mock fetchEnrollments to fail
      const mockError = new Error('Failed to load enrollments');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(mockError);

      // Act: Render component
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert: Error state should be displayed with retry button
      await waitFor(() => {
        expect(screen.getAllByText(/Failed to Load Enrollments/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should reset error state and call fetchEnrollments on retry (Task 6.1)', async () => {
      // Arrange: First call fails, second succeeds
      const mockEnrollments = [
        {
          id: 'e1',
          trainee_id: mockTraineeId,
          program_id: 'p1',
          status: 'active' as const,
          enrollment_date: '2024-01-01',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          program: { id: 'p1', name: 'Test Program', start_date: '2024-01-01', end_date: '2024-12-31', status: 'active' },
        },
      ];

      vi.mocked(enrollmentService.fetchEnrollments)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockEnrollments);

      // Act: Render and click retry
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      // Assert: fetchEnrollments should be called twice (initial + retry)
      await waitFor(() => {
        expect(enrollmentService.fetchEnrollments).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Test Program')).toBeInTheDocument();
      });
    });

    it('should show loading state during retry (Task 6.1)', async () => {
      // Arrange
      vi.mocked(enrollmentService.fetchEnrollments)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementationOnce(
          () => new Promise((resolve) => {
            setTimeout(() => {
              resolve([]);
            }, 100);
          })
        );

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

      // Assert: Loading skeleton should be shown
      await waitFor(() => {
        const animatedCards = document.querySelectorAll('.animate-pulse');
        expect(animatedCards.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });
  });

  // ============================================================================
  // Task 6.2: Specific Error Handling for Each HTTP Status Code
  // ============================================================================

  describe('Task 6.2: Specific error handling for each HTTP status code', () => {
    it('should handle 404 error (trainee not found) (Task 6.2)', async () => {
      // Arrange
      const error404 = new Error('404: Trainee not found');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(error404);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Trainee Not Found/i)).toBeInTheDocument();
        expect(screen.getByText(/verify the trainee ID/i)).toBeInTheDocument();
      });
    });

    it('should handle 403 error (unauthorized) (Task 6.2)', async () => {
      // Arrange
      const error403 = new Error('403: Forbidden - permission denied');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(error403);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Permission Denied/i)).toBeInTheDocument();
        expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
      });
    });

    it.skip('should handle 500+ error (server error) (Task 6.2)', async () => {
      // Arrange
      const error500 = new Error('500: Internal server error');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(error500);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Server Error/i)).toBeInTheDocument();
        expect(screen.getByText(/try again in a moment/i)).toBeInTheDocument();
      });
    });

    it('should handle network error (Task 6.2)', async () => {
      // Arrange
      const networkError = new Error('Network error: ECONNREFUSED');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(networkError);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
        expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
      });
    });

    it.skip('should handle 409 conflict on update (Task 6.2)', async () => {
      // Arrange: Mock enrollment fetch and auto-refresh after conflict
      const mockEnrollment = {
        id: 'e1',
        trainee_id: mockTraineeId,
        program_id: 'p1',
        status: 'active' as const,
        enrollment_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        completion_date: null,
        final_grade: null,
        program: { id: 'p1', name: 'Test Program', description: 'Test', start_date: '2024-01-01', end_date: '2024-12-31', status: 'active' },
        trainee: { id: mockTraineeId, first_name: 'John', last_name: 'Doe', middle_name: '', email: 'john@test.com' },
      };

      vi.mocked(enrollmentService.fetchEnrollments).mockResolvedValue([mockEnrollment]);

      const conflictError = new Error('409: Conflict - enrollment updated');
      vi.mocked(enrollmentService.updateStatus).mockRejectedValueOnce(conflictError);

      // Act
      const { unmount } = render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Program')).toBeInTheDocument();
      });

      // Find and click the Mark as Complete button
      const buttons = screen.getAllByRole('button');
      const completeButton = buttons.find(btn => btn.textContent?.includes('Mark as Complete'));
      expect(completeButton).toBeTruthy();
      
      fireEvent.click(completeButton!);

      // Wait for dialog to appear and confirm
      await waitFor(() => {
        // The dialog uses AlertDialog which renders as role="alertdialog"
        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button');
      const confirmButton = confirmButtons.find(btn => btn.textContent?.includes('Confirm'));
      fireEvent.click(confirmButton!);

      // Assert: Error toast should show conflict message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Data Conflict',
          expect.objectContaining({
            description: expect.stringContaining('updated by another user'),
          })
        );
      });
      
      unmount();
    });
  });

  // ============================================================================
  // Task 6.3: Validation Error Handling
  // ============================================================================

  describe('Task 6.3: Validation error handling', () => {
    it('should detect and log validation errors (Task 6.3)', async () => {
      // Arrange
      const validationError = new Error('Enrollment data validation failed: Invalid status');
      const consoleSpy = vi.spyOn(console, 'error');

      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(validationError);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert: Console should log validation error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Validation Error]'),
          expect.any(Object)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should display generic error message for validation errors (Task 6.3)', async () => {
      // Arrange
      const validationError = new Error('Zod error: Expected string');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(validationError);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert: User should see generic message, not technical details
      await waitFor(() => {
        expect(screen.getByText(/Data Format Error/i)).toBeInTheDocument();
        expect(screen.getByText(/server returned unexpected data/i)).toBeInTheDocument();
      });
    });

    it('should prevent component crash on validation error (Task 6.3)', async () => {
      // Arrange
      const validationError = new Error('Enrollment data validation failed: Invalid enrollment_date');
      vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValue(validationError);

      // Act
      const { container } = render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      // Assert: Component should still render (not crash)
      await waitFor(() => {
        expect(container).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should log validation error with timestamp during retry (Task 6.3)', async () => {
      // Arrange
      const validationError = new Error('Enrollment data validation failed: Invalid status');
      const consoleSpy = vi.spyOn(console, 'error');

      vi.mocked(enrollmentService.fetchEnrollments)
        .mockRejectedValueOnce(validationError)
        .mockRejectedValueOnce(validationError);

      // Act
      render(
        <EnrollmentManagementSection 
          traineeId={mockTraineeId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

      // Assert: Retry should also log validation error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Validation Error]'),
          expect.any(Object)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Combined Error Scenarios
  // ============================================================================

  describe('Combined error handling scenarios', () => {
    it('should handle multiple error types correctly', async () => {
      // Arrange
      const errors = [
        new Error('404: Not found'),
        new Error('403: Forbidden'),
        new Error('500: Server error'),
        new Error('Network error'),
      ];

      const expectedMessages = [
        'Trainee Not Found',
        'Permission Denied',
        'Server Error',
        'Network Error',
      ];

      // Act & Assert for each error type
      for (let i = 0; i < errors.length; i++) {
        vi.mocked(enrollmentService.fetchEnrollments).mockRejectedValueOnce(errors[i]);

        const { unmount } = render(
          <EnrollmentManagementSection 
            traineeId={mockTraineeId}
          />
        );

        await waitFor(() => {
          expect(screen.getByText(expectedMessages[i])).toBeInTheDocument();
        });

        unmount();
        vi.clearAllMocks();
      }
    });
  });
});
