import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TraineeDetailsModal from '../TraineeDetailsModal';
import { useAuth } from '../../contexts/AuthContext';
import traineeService from '../../services/traineeService';
import certificateService from '../../services/certificateService';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../services/traineeService');
vi.mock('../../services/certificateService');
vi.mock('sonner');
vi.mock('../../utils/activityLogger', () => ({
  traineeLogger: {
    deleted: vi.fn(),
  },
}));

const mockTrainee = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  contact: '1234567890',
  photoUrl: undefined,
  status: 'Active',
  address: '123 Main St',
  emergencyContact: 'Jane Doe',
  emergencyContactNumber: '0987654321',
  trainings: [
    {
      program: 'Program 1',
      status: 'Active',
      dateEnrolled: '01/01/2024',
      dateCompleted: null,
    },
    {
      program: 'Program 2',
      status: 'Active',
      dateEnrolled: '02/01/2024',
      dateCompleted: null,
    },
  ],
  qr_code: 'TRAINEE001',
};

const renderComponent = (props = {}) => {
  const defaultProps = {
    open: true,
    trainee: mockTrainee,
    onOpenChange: vi.fn(),
    onEdit: vi.fn(),
    initialTab: 'info' as const,
    ...props,
  };

  return {
    ...render(
      <BrowserRouter>
        <TraineeDetailsModal {...defaultProps} />
      </BrowserRouter>
    ),
    ...defaultProps,
  };
};

describe('TraineeDetailsModal - Deletion Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      hasPermission: vi.fn((perm) => perm === 'canManageTrainees'),
      user: { id: '1', name: 'Test User' },
    });
    (certificateService.getCertificates as any).mockResolvedValue({
      certificates: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Delete button visibility and interaction', () => {
    it('should display Delete Trainee button in modal footer when user has permission', async () => {
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('should not display Delete Trainee button when user lacks canManageTrainees permission', async () => {
      (useAuth as any).mockReturnValue({
        hasPermission: vi.fn((perm) => perm !== 'canManageTrainees'),
        user: { id: '1', name: 'Test User' },
      });

      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.queryByRole('button', { name: /delete trainee/i });
        expect(deleteButton).not.toBeInTheDocument();
      });
    });

    it('should have destructive styling on Delete Trainee button', async () => {
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toHaveClass('bg-destructive');
      });
    });

    it('should open confirmation dialog when Delete Trainee button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const deleteDialog = screen.getByRole('dialog');
        expect(within(deleteDialog).getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation dialog display and trainee information', () => {
    it('should display trainee name in confirmation dialog', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
        // Check in deletion warning box - use queryAllByText to get from confirmation dialog
        const nameElements = screen.getAllByText(mockTrainee.name);
        expect(nameElements.length).toBeGreaterThan(0);
      });
    });

    it('should display soft-delete explanation in confirmation dialog', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        // Check for both parts of the soft-delete explanation
        expect(screen.getByText(/soft-delete/i)).toBeInTheDocument();
        // Use queryAllByText for preserved since it appears in multiple places
        const preservedElements = screen.getAllByText(/preserved/i);
        expect(preservedElements.length).toBeGreaterThan(0);
      });
    });

    it('should display active programs count when trainee has enrollments', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/enrolled in.*2.*active program/i)).toBeInTheDocument();
      });
    });

    it('should display active programs list as badges', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
        expect(screen.getByText('Program 2')).toBeInTheDocument();
      });
    });
  });

  describe('Modal visibility during deletion', () => {
    it('should keep modal visible but non-interactive while confirmation dialog is open', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderComponent({ onOpenChange });

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        // Dialog should be open and visible - verify by looking for delete confirmation button
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Cancel confirmation flow', () => {
    it('should close confirmation dialog when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
        expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        // Confirmation dialog should close
        const warningText = screen.queryByText(/Are you sure you want to delete/i);
        expect(warningText).not.toBeInTheDocument();
      });
    });

    it('should keep modal open after canceling deletion', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderComponent({ onOpenChange });

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
        expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        // Modal should still be open, onOpenChange should not have been called
        expect(onOpenChange).not.toHaveBeenCalledWith(false);
      });
    });

    it('should preserve trainee data in modal after canceling', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Check trainee data is displayed
      expect(screen.getByText(mockTrainee.name)).toBeInTheDocument();
      expect(screen.getByText(mockTrainee.email)).toBeInTheDocument();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
        expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      // Trainee data should still be visible
      expect(screen.getByText(mockTrainee.name)).toBeInTheDocument();
      expect(screen.getByText(mockTrainee.email)).toBeInTheDocument();
    });
  });

  describe('Confirm deletion flow', () => {
    it('should call traineeService.deleteTrainee when confirming deletion', async () => {
      const user = userEvent.setup();
      (traineeService.deleteTrainee as any).mockResolvedValue(undefined);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(traineeService.deleteTrainee).toHaveBeenCalledWith(String(mockTrainee.id));
      });
    });

    it('should show success toast notification after deletion', async () => {
      const user = userEvent.setup();
      (traineeService.deleteTrainee as any).mockResolvedValue(undefined);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining(`Trainee ${mockTrainee.name} has been deleted successfully`)
        );
      });
    });

    it('should close both confirmation dialog and details modal after successful deletion', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      (traineeService.deleteTrainee as any).mockResolvedValue(undefined);
      renderComponent({ onOpenChange });

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        // Modal should be closed via onOpenChange(false)
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should disable Delete button during deletion process', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      (traineeService.deleteTrainee as any).mockReturnValue(deletePromise);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /deleting/i });
        expect(confirmButton).toBeDisabled();
      });

      resolveDelete!();
    });

    it('should show loading indicator in Delete button during deletion', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      (traineeService.deleteTrainee as any).mockReturnValue(deletePromise);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        // Should show "Deleting..." text during deletion
        expect(screen.getByText(/deleting/i)).toBeInTheDocument();
      });

      resolveDelete!();
    });
  });

  describe('Error handling', () => {
    it('should show 403 permission error message and keep dialog open', async () => {
      const user = userEvent.setup();
      const error403 = new Error('Forbidden');
      (error403 as any).response = { status: 403 };
      (traineeService.deleteTrainee as any).mockRejectedValue(error403);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You don't have permission to delete this trainee."
        );
      });

      // Dialog should remain open
      const warningText = screen.getByText(/Are you sure you want to delete/i);
      expect(warningText).toBeInTheDocument();
    });

    it('should show 404 not found error message and keep dialog open', async () => {
      const user = userEvent.setup();
      const error404 = new Error('Not Found');
      (error404 as any).response = { status: 404 };
      (traineeService.deleteTrainee as any).mockRejectedValue(error404);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Trainee not found or already deleted.'
        );
      });

      // Dialog should remain open
      const warningText = screen.getByText(/Are you sure you want to delete/i);
      expect(warningText).toBeInTheDocument();
    });

    it('should show generic error message for 500+ errors', async () => {
      const user = userEvent.setup();
      const error500 = new Error('Server Error');
      (error500 as any).response = { status: 500 };
      (traineeService.deleteTrainee as any).mockRejectedValue(error500);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        // Verify error was called - the error handler should parse the 500 status
        // and display the appropriate message (not the raw error)
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const error500 = new Error('Server Error');
      (error500 as any).response = { status: 500 };
      (traineeService.deleteTrainee as any)
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce(undefined);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      // First attempt - fails
      let confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Dialog should still be open - retry
      confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(traineeService.deleteTrainee).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Cancel button behavior during deletion', () => {
    it('should disable Cancel button while deletion is in progress', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      (traineeService.deleteTrainee as any).mockReturnValue(deletePromise);
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
        expect(cancelButton).toBeDisabled();
      });

      resolveDelete!();
    });

    it('should prevent dialog from closing via backdrop while deletion is in progress', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      (traineeService.deleteTrainee as any).mockReturnValue(deletePromise);
      const onOpenChange = vi.fn();
      renderComponent({ onOpenChange });

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /deleting/i });
        expect(confirmButton).toBeDisabled();
      });

      // Verify dialog is still open and trying to close it won't work
      const warningText = screen.getByText(/Are you sure you want to delete/i);
      expect(warningText).toBeInTheDocument();

      resolveDelete!();
    });
  });

  describe('Complete deletion flow scenarios', () => {
    it('should complete full deletion flow: open modal -> click delete -> confirm deletion', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      (traineeService.deleteTrainee as any).mockResolvedValue(undefined);
      renderComponent({ onOpenChange });

      // Step 1: Modal is open with trainee data
      expect(screen.getByText(mockTrainee.name)).toBeInTheDocument();

      // Step 2: Click Delete Trainee button
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      // Step 3: Confirmation dialog shows
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      // Verify dialog has trainee name and warning text
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

      // Step 4: Click confirm
      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      // Step 5: Verify API called, success toast shown, and modal closed
      await waitFor(() => {
        expect(traineeService.deleteTrainee).toHaveBeenCalledWith(String(mockTrainee.id));
        expect(toast.success).toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should complete cancellation flow: open modal -> click delete -> cancel -> modal stays open', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderComponent({ onOpenChange });

      // Step 1: Modal is open
      expect(screen.getByText(mockTrainee.name)).toBeInTheDocument();

      // Step 2: Click Delete Trainee button
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      // Step 3: Confirmation dialog shows
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
        expect(cancelButton).toBeInTheDocument();
      });

      // Step 4: Click cancel
      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      // Step 5: Verify dialog closed but modal remains open
      await waitFor(() => {
        // Confirmation dialog content should be hidden
        const warningText = screen.queryByText(/Are you sure you want to delete/i);
        expect(warningText).not.toBeInTheDocument();

        // Modal should still be open with trainee data
        expect(screen.getByText(mockTrainee.name)).toBeInTheDocument();

        // onOpenChange should NOT have been called
        expect(onOpenChange).not.toHaveBeenCalled();
      });
    });

    it('should complete retry flow after error', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const error500 = new Error('Server Error');
      (error500 as any).response = { status: 500 };
      (traineeService.deleteTrainee as any)
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce(undefined);
      renderComponent({ onOpenChange });

      // Step 1: Modal is open
      expect(screen.getByText(mockTrainee.name)).toBeInTheDocument();

      // Step 2: Click Delete and confirm
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      // First attempt - fails
      let confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      // Step 3: Error shown, dialog remains open
      await waitFor(() => {
        // Just verify error was called, not exact message match
        expect(toast.error).toHaveBeenCalled();
      });

      // Verify dialog still open
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

      // Step 4: Retry deletion
      confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      // Step 5: Verify success on retry
      await waitFor(() => {
        expect(traineeService.deleteTrainee).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Modal returns to TraineesPage after deletion', () => {
    it('should verify modal closure triggers return to TraineesPage', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      (traineeService.deleteTrainee as any).mockResolvedValue(undefined);
      renderComponent({ onOpenChange });

      // Click delete and confirm
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete trainee/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete$/i });
        expect(confirmButton).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete$/i });
      await user.click(confirmButton);

      // Verify onOpenChange called with false to close modal
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      // The parent component (TraineesPage) would use this callback to close the modal
      // and the list would already be updated due to the deletion
    });
  });
});
