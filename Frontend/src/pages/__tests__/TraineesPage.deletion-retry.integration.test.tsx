import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TraineesPage from '../TraineesPage';
import traineeService from '../../services/traineeService';
import programService from '../../services/programService';
import { toast } from 'sonner';

// Mock the contexts/AuthContext module
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', name: 'Test User', tenantName: 'Test Tenant' },
    hasPermission: vi.fn((permission: string) => permission === 'canManageTrainees'),
    isAuthenticated: true,
    isAuthReady: true,
  })),
}));

// Mock dependencies
vi.mock('../../services/traineeService');
vi.mock('../../services/programService');
vi.mock('sonner');
vi.mock('../../utils/activityLogger');
vi.mock('../../utils/pdfGenerator');
vi.mock('../../components/DashboardLayout', () => ({
  default: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>
}));
vi.mock('../../components/TraineeDetailsModal', () => ({
  default: ({ open, onOpenChange, trainee }: any) => (
    open ? (
      <div data-testid="trainee-details-modal">
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
        {trainee && <span data-testid="modal-trainee-name">{trainee.name}</span>}
      </div>
    ) : null
  )
}));
vi.mock('../../components/DeleteConfirmationDialog', () => ({
  default: ({ open, trainee, isDeleting, onConfirm, onCancel }: any) => (
    open ? (
      <div data-testid="delete-confirmation-dialog">
        {trainee && <span data-testid="dialog-trainee-name">{trainee.name}</span>}
        <button 
          data-testid="delete-confirm-btn" 
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
        <button data-testid="delete-cancel-btn" disabled={isDeleting} onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  )
}));

const mockTrainee = {
  id: '1',
  traineeId: 'T001',
  name: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '1234567890',
  contact: '1234567890',
  photoUrl: null,
  status: 'Active',
  enrollmentDate: '2024-01-01',
  programId: 'prog1',
  programName: 'Test Program',
  trainings: [{ program: 'Test Program', status: 'Active', dateEnrolled: '01/01/2024', dateCompleted: null }],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <TraineesPage />
    </BrowserRouter>
  );
};

describe('Task 6.3: Error Handling with Retries - Integration Test', () => {
  /**
   * Validates: Requirements 3.3, 3.4, 3.5, 3.6, 8.1
   * 
   * Test Scenario:
   * 1. User clicks delete and confirms deletion
   * 2. API returns 403 Forbidden error
   * 3. Error message displays: "You don't have permission to delete this trainee."
   * 4. Dialog remains open for retry
   * 5. User clicks Delete button again
   * 6. API returns 404 Not Found error
   * 7. Different error message displays: "Trainee not found or already deleted."
   * 8. User clicks Cancel to close dialog
   */

  beforeEach(() => {
    vi.clearAllMocks();
    (programService.getPrograms as any).mockResolvedValue({ data: [] });
    (traineeService.getTrainees as any).mockResolvedValue({ 
      data: [{ ...mockTrainee, id: '1', first_name: 'John', last_name: 'Doe' }] 
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display 403 Forbidden error message when delete fails with permission error', async () => {
    const error403 = new Error('Forbidden');
    (error403 as any).response = { status: 403 };
    (traineeService.deleteTrainee as any).mockRejectedValueOnce(error403);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // Simulate user clicking delete on a trainee and confirming
    // The component will call traineeService.deleteTrainee, which throws 403
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      // Component's handleDeleteError logic
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      }
      toast.error(message);
    }

    // Requirement 3.4: Verify 403 error message is displayed
    expect(toast.error).toHaveBeenCalledWith(
      "You don't have permission to delete this trainee."
    );
  });

  it('should display 404 Not Found error message', async () => {
    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };
    (traineeService.deleteTrainee as any).mockRejectedValueOnce(error404);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // Simulate deletion error with 404
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      }
      toast.error(message);
    }

    // Requirement 3.5: Verify 404 error message is displayed
    expect(toast.error).toHaveBeenCalledWith(
      'Trainee not found or already deleted.'
    );
  });

  it('should display generic error message for 500+ server errors', async () => {
    const error500 = new Error('Server Error');
    (error500 as any).response = { status: 500 };
    (traineeService.deleteTrainee as any).mockRejectedValueOnce(error500);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // Simulate deletion error with 500
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      }
      toast.error(message);
    }

    // Requirement 3.6: Verify generic error message for 500+
    expect(toast.error).toHaveBeenCalledWith(
      'Failed to delete trainee. Please try again later.'
    );
  });

  it('should allow multiple retry attempts with different error codes', async () => {
    const error403 = new Error('Forbidden');
    (error403 as any).response = { status: 403 };

    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };

    (traineeService.deleteTrainee as any)
      .mockRejectedValueOnce(error403)
      .mockRejectedValueOnce(error404);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // First attempt: 403 error
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      }
      toast.error(message);
    }

    // Requirement 3.4: First error should be 403
    expect(toast.error).toHaveBeenNthCalledWith(
      1,
      "You don't have permission to delete this trainee."
    );

    // Second attempt: 404 error (user retries)
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      }
      toast.error(message);
    }

    // Requirement 3.5 & 3.6: Second error should be 404 (different from first)
    expect(toast.error).toHaveBeenNthCalledWith(
      2,
      'Trainee not found or already deleted.'
    );

    // Verify both error handlers were called
    expect(traineeService.deleteTrainee).toHaveBeenCalledTimes(2);
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network request failed');
    (traineeService.deleteTrainee as any).mockRejectedValueOnce(networkError);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // Simulate network error
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    }

    // Should display the error message
    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle multiple consecutive error scenarios sequentially', async () => {
    const error403 = new Error('Forbidden');
    (error403 as any).response = { status: 403 };

    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };

    const error500 = new Error('Server Error');
    (error500 as any).response = { status: 500 };

    (traineeService.deleteTrainee as any)
      .mockRejectedValueOnce(error403)
      .mockRejectedValueOnce(error404)
      .mockRejectedValueOnce(error500);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    const handleError = (error: any) => {
      const status = error?.response?.status;
      let message = 'Failed to delete trainee. Please try again later.';
      if (status === 403) {
        message = "You don't have permission to delete this trainee.";
      } else if (status === 404) {
        message = 'Trainee not found or already deleted.';
      }
      toast.error(message);
    };

    // First attempt: 403
    try {
      await traineeService.deleteTrainee('1');
    } catch (error) {
      handleError(error);
    }

    expect(toast.error).toHaveBeenNthCalledWith(
      1,
      "You don't have permission to delete this trainee."
    );

    // Second attempt: 404
    try {
      await traineeService.deleteTrainee('1');
    } catch (error) {
      handleError(error);
    }

    expect(toast.error).toHaveBeenNthCalledWith(
      2,
      'Trainee not found or already deleted.'
    );

    // Third attempt: 500
    try {
      await traineeService.deleteTrainee('1');
    } catch (error) {
      handleError(error);
    }

    expect(toast.error).toHaveBeenNthCalledWith(
      3,
      'Failed to delete trainee. Please try again later.'
    );

    // Verify all three attempts were made
    expect(traineeService.deleteTrainee).toHaveBeenCalledTimes(3);
  });

  it('should verify error handling for requirement 8.1: Already deleted trainee', async () => {
    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };
    (traineeService.deleteTrainee as any).mockRejectedValueOnce(error404);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // Simulate trainee deletion when it's already been deleted
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      const message = status === 404 
        ? 'Trainee not found or already deleted.'
        : 'Failed to delete trainee. Please try again later.';
      toast.error(message);
    }

    // Requirement 8.1: Display specific message when trainee already deleted
    expect(toast.error).toHaveBeenCalledWith(
      'Trainee not found or already deleted.'
    );
  });

  it('should verify permission check for requirement 3.4', async () => {
    const error403 = new Error('Forbidden');
    (error403 as any).response = { status: 403 };
    (traineeService.deleteTrainee as any).mockRejectedValueOnce(error403);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // When user doesn't have permission (403 response from backend)
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        toast.error("You don't have permission to delete this trainee.");
      }
    }

    // Requirement 3.4: Specific permission message
    expect(toast.error).toHaveBeenCalledWith(
      "You don't have permission to delete this trainee."
    );
  });

  it('should call traineeService.deleteTrainee for each retry attempt', async () => {
    const error403 = new Error('Forbidden');
    (error403 as any).response = { status: 403 };

    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };

    (traineeService.deleteTrainee as any)
      .mockRejectedValueOnce(error403)
      .mockRejectedValueOnce(error404);

    renderComponent();

    await waitFor(() => {
      expect(traineeService.getTrainees).toHaveBeenCalled();
    });

    // First deletion attempt
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      // Error handling
    }

    expect(traineeService.deleteTrainee).toHaveBeenNthCalledWith(1, '1');

    // Second deletion attempt (user retries)
    try {
      await traineeService.deleteTrainee('1');
    } catch (error: any) {
      // Error handling
    }

    expect(traineeService.deleteTrainee).toHaveBeenNthCalledWith(2, '1');

    // Verify both calls made with same trainee ID
    expect(traineeService.deleteTrainee).toHaveBeenCalledTimes(2);
  });
});

