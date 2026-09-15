import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';

/**
 * Trainee data passed to the confirmation dialog
 */
interface Trainee {
  id: number;
  name: string;
  trainings?: Array<{ program: string; status: string }>;
}

/**
 * Props for the DeleteConfirmationDialog component
 * 
 * @interface DeleteConfirmationDialogProps
 */
interface DeleteConfirmationDialogProps {
  /**
   * Controls whether the dialog is open or closed.
   * When false, the dialog is hidden (unless deletion is in progress).
   */
  open: boolean;

  /**
   * The trainee object to be deleted. Contains:
   * - `id`: Unique identifier
   * - `name`: Full name of the trainee
   * - `trainings`: Optional array of enrolled programs with status
   * 
   * @example
   * ```tsx
   * trainee={{
   *   id: 123,
   *   name: "John Doe",
   *   trainings: [
   *     { program: "React Basics", status: "Active" }
   *   ]
   * }}
   * ```
   */
  trainee: Trainee | null;

  /**
   * Indicates whether a deletion operation is in progress.
   * When true:
   * - Delete button is disabled and shows loading spinner
   * - Cancel button is disabled
   * - Dialog cannot be closed via backdrop click
   * - User cannot dismiss the dialog
   */
  isDeleting: boolean;

  /**
   * Callback function invoked when the user confirms deletion.
   * Called when the Delete button is clicked.
   * 
   * This function should:
   * 1. Call the API to delete the trainee
   * 2. Update the UI state (remove from list, close modals)
   * 3. Display a success notification
   * 4. Handle any errors via try-catch
   * 
   * @returns A Promise that resolves when deletion completes
   * 
   * @example
   * ```tsx
   * onConfirm={async () => {
   *   await traineeService.deleteTrainee(trainee.id);
   *   // Handle success...
   * }}
   * ```
   */
  onConfirm: () => Promise<void>;

  /**
   * Callback function invoked when the user cancels the deletion.
   * Called when:
   * 1. Cancel button is clicked
   * 2. Backdrop is clicked (if isDeleting is false)
   * 
   * This function should close the dialog and reset any related state.
   * 
   * @example
   * ```tsx
   * onCancel={() => setDeleteDialogOpen(false)}
   * ```
   */
  onCancel: () => void;
}

/**
 * DeleteConfirmationDialog Component
 * 
 * A modal dialog that confirms trainee deletion before executing the action.
 * Provides safety through explicit confirmation, clear messaging about soft-delete,
 * and display of active program information.
 * 
 * **Features:**
 * - Displays trainee name in warning message
 * - Shows soft-delete explanation (data is preserved for audit purposes)
 * - Lists active programs the trainee is enrolled in (if any)
 * - Loading state with spinner during deletion
 * - Prevents accidental dismissal during deletion (no backdrop close, disabled buttons)
 * - Allows retry on error (dialog stays open)
 * 
 * **Styling:**
 * - Destructive warning colors (red/orange) for delete button
 * - Secondary styling for cancel button
 * - Alert icon in title to emphasize action severity
 * - Badge components for program display
 * - Animated spinner during deletion
 * 
 * **Accessibility:**
 * - Semantic HTML with Dialog primitive
 * - Clear button labels ("Delete", "Cancel")
 * - Appropriate color contrast for readability
 * - Focus management handled by Dialog component
 * 
 * @component
 * 
 * @example
 * ```tsx
 * const [deleteOpen, setDeleteOpen] = useState(false);
 * const [isDeleting, setIsDeleting] = useState(false);
 * 
 * const handleDelete = async () => {
 *   setIsDeleting(true);
 *   try {
 *     await traineeService.deleteTrainee(trainee.id);
 *     setDeleteOpen(false);
 *     toast.success("Trainee deleted successfully");
 *   } catch (error) {
 *     toast.error("Failed to delete trainee");
 *   } finally {
 *     setIsDeleting(false);
 *   }
 * };
 * 
 * return (
 *   <DeleteConfirmationDialog
 *     open={deleteOpen}
 *     trainee={trainee}
 *     isDeleting={isDeleting}
 *     onConfirm={handleDelete}
 *     onCancel={() => setDeleteOpen(false)}
 *   />
 * );
 * ```
 */
export default function DeleteConfirmationDialog({
  open,
  trainee,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  if (!trainee) return null;

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent dialog from being closed while deletion is in progress
    if (!newOpen && !isDeleting) {
      onCancel();
    }
  };

  const handleConfirmClick = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Delete Trainee?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone immediately, but the trainee record will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning message */}
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-sm font-medium text-destructive">
              Are you sure you want to delete <span className="font-semibold">{trainee.name}</span>?
            </p>
          </div>

          {/* Explanation */}
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <strong>Soft-delete:</strong> The trainee data will be preserved in the system for audit purposes but will no longer appear in the active trainee list.
            </p>
            {trainee.trainings && trainee.trainings.length > 0 && (
              <p className="text-muted-foreground">
                <strong>Note:</strong> This trainee is enrolled in {trainee.trainings.length} active program(s).
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Deleted trainees can be restored by administrators if needed.
            </p>
          </div>

          {/* Active programs list (if any) */}
          {trainee.trainings && trainee.trainings.length > 0 && (
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Active Programs:</p>
              <div className="flex flex-wrap gap-1">
                {trainee.trainings.map((training, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {training.program}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
