/**
 * Integration Examples: RequirementDefinitionForm Component
 *
 * This file demonstrates how to integrate RequirementDefinitionForm
 * into pages and workflows.
 *
 * NOT a test file - just examples for developers.
 */

import { RequirementDefinitionForm } from './RequirementDefinitionForm';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

/**
 * Example 1: Create Requirement Definition Page
 * Shows how to use the component for creating new requirements
 */
export function CreateRequirementDefinitionPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Create Requirement Definition">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">New Requirement Definition</h1>
          <p className="text-muted-foreground">
            Define a new training requirement for your organization
          </p>
        </div>

        <RequirementDefinitionForm
          onSuccess={() => {
            // After successful creation, navigate to the requirements list
            navigate('/requirements');
          }}
        />
      </div>
    </DashboardLayout>
  );
}

/**
 * Example 2: Edit Requirement Definition Page
 * Shows how to use the component for editing existing requirements
 */
export function EditRequirementDefinitionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <DashboardLayout title="Edit Requirement Definition">
        <div className="text-center py-12">
          <p className="text-red-600">Requirement ID not provided</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Requirement Definition">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Edit Requirement Definition</h1>
          <p className="text-muted-foreground">
            Update the requirement definition details
          </p>
        </div>

        <RequirementDefinitionForm
          requirementId={id}
          onSuccess={() => {
            // After successful update, navigate to the requirement detail page
            navigate(`/requirements/${id}`);
          }}
        />
      </div>
    </DashboardLayout>
  );
}

/**
 * Example 3: Embedded in Modal/Dialog
 * Shows how to use the component in a modal context
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface RequirementDefinitionModalProps {
  isOpen: boolean;
  requirementId?: string;
  onClose: () => void;
}

export function RequirementDefinitionModal({
  isOpen,
  requirementId,
  onClose,
}: RequirementDefinitionModalProps) {
  const isEditMode = !!requirementId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Edit Requirement Definition'
              : 'Create Requirement Definition'}
          </DialogTitle>
        </DialogHeader>

        <RequirementDefinitionForm
          requirementId={requirementId}
          onSuccess={() => {
            // Close modal after successful submission
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Example 4: Requirements Management Page with Actions
 * Shows the form in context with requirement listing
 */
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Plus } from 'lucide-react';

export function RequirementsManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);

  return (
    <DashboardLayout title="Requirements Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Requirement Definitions</h1>
            <p className="text-muted-foreground">
              Manage training requirements for your organization
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Requirement
          </Button>
        </div>

        {/* Create Form (inline) */}
        {showCreateForm && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Requirement</h2>
            <RequirementDefinitionForm
              onSuccess={() => {
                setShowCreateForm(false);
                // Optionally refresh the requirements list
              }}
            />
          </Card>
        )}

        {/* Edit Form (inline) */}
        {editingRequirementId && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Requirement</h2>
            <RequirementDefinitionForm
              requirementId={editingRequirementId}
              onSuccess={() => {
                setEditingRequirementId(null);
                // Optionally refresh the requirements list
              }}
            />
          </Card>
        )}

        {/* Requirements List (placeholder) */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">All Requirements</h2>
          <p className="text-muted-foreground">
            Requirements list would be shown here using RequirementDefinitionsList component
          </p>
          <div className="mt-4 space-y-2">
            {/* Example requirement item with edit button */}
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Birth Certificate Copy</p>
                <p className="text-sm text-muted-foreground">
                  Photocopy of NSO/PSA Birth Certificate
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRequirementId('example-id')}
              >
                Edit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/**
 * Example 5: With Advanced Configuration
 * Shows how to handle more complex scenarios
 */
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function AdvancedRequirementManagementPage() {
  const navigate = useNavigate();

  const handleCreateSuccess = useCallback(() => {
    // Show success notification
    toast.success('Requirement created! You can now assign it to trainees.');

    // Optionally navigate
    setTimeout(() => {
      navigate('/requirements');
    }, 2000);
  }, [navigate]);

  const handleUpdateSuccess = useCallback(() => {
    // Show success notification
    toast.success('Requirement updated successfully.');

    // Optionally refetch data or invalidate cache
    // This would happen automatically through React Query
  }, []);

  return (
    <DashboardLayout title="Advanced Requirement Management">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Create Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Create New Requirement</h2>
          <RequirementDefinitionForm onSuccess={handleCreateSuccess} />
        </div>

        {/* Divider */}
        <div className="my-8 border-t" />

        {/* Edit Section (example with ID from URL or state) */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Edit Requirement</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a requirement from the list above to edit it
          </p>
          {/* Form would render here with requirementId from selection */}
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * Notes for Integration:
 *
 * 1. The component handles its own validation and error states
 * 2. No need to manually manage form data - React Hook Form handles it
 * 3. The onSuccess callback is the signal that form submission completed
 * 4. Always wrap in QueryClientProvider if not already in app
 * 5. Toast notifications are handled by the component
 * 6. Loading states are managed internally - no need to pass loading prop
 *
 * Common Patterns:
 * - Use in Modal: Wrap in Dialog component, close on onSuccess
 * - Use in Page: Render directly, navigate on onSuccess
 * - Use in Section: Conditionally render based on state, hide on onSuccess
 * - Use in Inline: Show/hide with state, refresh list on onSuccess
 *
 * Error Handling:
 * - Component shows inline error messages
 * - Toast notifications appear for submission errors
 * - Validation errors show field-level messages
 * - Network errors are caught and displayed
 *
 * Performance:
 * - Form validation is debounced (onBlur mode)
 * - API calls are optimized with React Query
 * - No unnecessary re-renders thanks to React Hook Form
 * - Query invalidation is targeted for efficiency
 */
