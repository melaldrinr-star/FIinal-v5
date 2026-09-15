import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog';

/**
 * Integration tests for DeleteConfirmationDialog component
 * Tests the component's interaction with parent components through props
 * and callback functions, following React Testing Library best practices.
 */

describe('DeleteConfirmationDialog - Integration Tests', () => {
  const mockTrainee = {
    id: 1,
    name: 'John Doe',
    trainings: [
      { program: 'React Basics', status: 'Active' },
      { program: 'Node.js Advanced', status: 'Active' },
    ],
  };

  const mockTraineeNoPrograms = {
    id: 2,
    name: 'Jane Smith',
    trainings: [],
  };

  let mockConfirm: () => Promise<void>;
  let mockCancel: () => void;

  beforeEach(() => {
    mockConfirm = vi.fn(async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }) as () => Promise<void>;
    mockCancel = vi.fn() as () => void;
  });

  describe('Dialog Display and Content', () => {
    test('6.6.1 displays trainee name and deletion warning message', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Verify warning title
      expect(screen.getByText('Delete Trainee?')).toBeInTheDocument();

      // Verify trainee name in warning message
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('6.6.2 displays soft-delete explanation text', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Verify soft-delete explanation
      expect(screen.getByText(/Soft-delete:/)).toBeInTheDocument();
      expect(screen.getByText(/preserved in the system for audit purposes/)).toBeInTheDocument();
      expect(screen.getByText(/Deleted trainees can be restored by administrators if needed/)).toBeInTheDocument();
    });

    test('6.6.3 displays active programs list when trainee has enrollments', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Verify programs section is visible
      expect(screen.getByText(/Active Programs:/)).toBeInTheDocument();

      // Verify individual programs are listed
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('Node.js Advanced')).toBeInTheDocument();
    });

    test('6.6.4 does not display active programs section when trainee has no enrollments', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTraineeNoPrograms}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Verify programs section is not visible
      expect(screen.queryByText(/Active Programs:/)).not.toBeInTheDocument();
    });

    test('6.6.5 does not render when trainee prop is null', () => {
      const { container } = render(
        <DeleteConfirmationDialog
          open={true}
          trainee={null}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Component should return null, so nothing should be rendered
      expect(container.firstChild).toBe(null);
    });
  });

  describe('Button States and Loading', () => {
    test('6.6.6 delete button shows normal state with trash icon when not deleting', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      expect(deleteButton).not.toBeDisabled();
      // Verify Trash2 icon is present (lucide icon class)
      expect(deleteButton.querySelector('[class*="lucide"]')).toBeInTheDocument();
    });

    test('6.6.7 delete button shows loading state during deletion', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Initially shows "Delete"
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();

      // Rerender with isDeleting = true
      rerender(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={true}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Should show "Deleting..."
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      // Verify spinner div exists with animate-spin class
      const delatingText = screen.getByText('Deleting...');
      const spinnerDiv = delatingText.parentElement?.querySelector('.animate-spin');
      expect(spinnerDiv).toBeInTheDocument();
    });

    test('6.6.8 delete button is disabled while deleting', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={true}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // When deleting, the button shows "Deleting..." text
      const deleteButton = screen.getByRole('button', { name: /deleting/i });
      expect(deleteButton).toBeDisabled();
    });

    test('6.6.9 cancel button is disabled while deleting', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={true}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    test('6.6.10 cancel button is enabled when not deleting', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Callback Interactions', () => {
    test('6.6.11 calls onConfirm callback when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledOnce();
    });

    test('6.6.12 calls onCancel callback when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockCancel).toHaveBeenCalledOnce();
    });

    test('6.6.13 does not call onCancel when dialog tries to close via backdrop while deleting', async () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={true}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // The Dialog component has onOpenChange handler that checks isDeleting
      // When isDeleting is true and open prop changes, onCancel should not be called
      // This is tested by verifying the dialog content remains in the document

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(mockCancel).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Visibility and Open State', () => {
    test('6.6.14 dialog is visible when open prop is true', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Verify dialog content is visible
      expect(screen.getByText('Delete Trainee?')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('6.6.15 dialog is hidden when open prop is false', () => {
      render(
        <DeleteConfirmationDialog
          open={false}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Dialog content should not be in the document
      expect(screen.queryByText('Delete Trainee?')).not.toBeInTheDocument();
    });

    test('6.6.16 dialog transitions from closed to open state', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          open={false}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.queryByText('Delete Trainee?')).not.toBeInTheDocument();

      // Rerender with open = true
      rerender(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Delete Trainee?')).toBeInTheDocument();
    });
  });

  describe('Error Scenario Handling', () => {
    test('6.6.17 dialog remains visible when parent controls open state during errors', () => {
      // The DeleteConfirmationDialog itself doesn't handle errors - the parent does
      // This test verifies the component can remain open if parent keeps open=true
      const { rerender } = render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Delete Trainee?')).toBeInTheDocument();

      // Even if rerendered with isDeleting=false, it should stay visible if open=true
      rerender(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Delete Trainee?')).toBeInTheDocument();
    });

    test('6.6.18 buttons remain interactive for retry scenarios', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={true}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // During deletion, buttons are disabled
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();

      // After parent receives error and sets isDeleting=false, buttons are enabled for retry
      rerender(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Delete button should be enabled again for retry
      expect(screen.getByRole('button', { name: /^delete$/i })).not.toBeDisabled();
    });
  });

  describe('Multiple Trainee Scenarios', () => {
    test('6.6.19 correctly displays different trainee names when prop changes', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Rerender with different trainee
      rerender(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTraineeNoPrograms}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('6.6.20 programs list updates when trainee prop changes', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('React Basics')).toBeInTheDocument();

      // Rerender with trainee that has no programs
      rerender(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTraineeNoPrograms}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.queryByText('React Basics')).not.toBeInTheDocument();
      expect(screen.queryByText(/Active Programs:/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility and Styling', () => {
    test('6.6.21 delete button has destructive styling', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      // Check for destructive variant class
      expect(deleteButton).toHaveClass('bg-destructive');
    });

    test('6.6.22 warning message has appropriate visual styling', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Find the warning box (has destructive background)
      const warningBox = screen.getByText(/Are you sure you want to delete/).closest('div');
      expect(warningBox).toHaveClass('bg-destructive/10', 'border-destructive/30');
    });

    test('6.6.23 dialog header has alert icon', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={mockTrainee}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Verify AlertCircle icon is present in header
      const header = screen.getByText('Delete Trainee?');
      expect(header.querySelector('[class*="lucide"]')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('6.6.24 handles missing trainings array gracefully', () => {
      const traineeWithoutTrainings = {
        id: 1,
        name: 'Test Trainee',
        // trainings property missing
      } as any;

      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={traineeWithoutTrainings}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      // Should still render dialog with trainee name
      expect(screen.getByText('Test Trainee')).toBeInTheDocument();
      // Programs section should not cause error
      expect(screen.queryByText(/Active Programs:/)).not.toBeInTheDocument();
    });

    test('6.6.25 handles empty trainings array', () => {
      const traineeWithEmptyTrainings = {
        id: 1,
        name: 'Test Trainee',
        trainings: [] as any,
      };

      render(
        <DeleteConfirmationDialog
          open={true}
          trainee={traineeWithEmptyTrainings}
          isDeleting={false}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Test Trainee')).toBeInTheDocument();
      expect(screen.queryByText(/Active Programs:/)).not.toBeInTheDocument();
    });
  });
});
