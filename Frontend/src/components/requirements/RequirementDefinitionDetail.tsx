/**
 * RequirementDefinitionDetail Component
 *
 * Displays comprehensive information about a single requirement definition.
 * Includes requirement metadata, submission statistics, and action buttons.
 *
 * Features:
 * - Fetches requirement data using useRequirementDefinition hook
 * - Displays all requirement fields with visual formatting
 * - Shows submission statistics in bars and numerical format
 * - Includes Edit, Delete, and ViewSubmissions action buttons
 * - Loading skeleton while fetching
 * - Error state if requirement not found
 * - Responsive design for mobile and desktop
 * - Color-coded status indicators
 *
 * **Validates: Requirements FR2.2 - View individual requirement details**
 *
 * Example usage:
 * ```tsx
 * <RequirementDefinitionDetail
 *   requirementId="req-123"
 *   onEdit={() => console.log('Edit clicked')}
 * />
 * ```
 */

import React, { useState } from 'react';
import { useRequirementDefinition } from '../../hooks/useRequirementDefinition';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { RequirementDefinition } from '../../types/requirementDefinition';
import { RequirementSubmittedTraineesList } from '../RequirementSubmittedTraineesList';

interface RequirementDefinitionDetailProps {
  /** The ID of the requirement definition to display */
  requirementId: string;
  /** Callback when Edit button is clicked */
  onEdit?: () => void;
  /** Callback when Delete button is clicked */
  onDelete?: (id: string) => void;
}

/**
 * Component to display the requirement definition detail
 */
export function RequirementDefinitionDetail({
  requirementId,
  onEdit,
  onDelete,
}: RequirementDefinitionDetailProps) {
  const { data: requirement, isLoading, isError, error } = useRequirementDefinition(requirementId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handles delete action
   */
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(requirementId);
        setDeleteDialogOpen(false);
        toast.success('Requirement deleted successfully');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete requirement');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Loading skeleton
   */
  if (isLoading) {
    return <RequirementDefinitionDetailSkeleton />;
  }

  /**
   * Error state
   */
  if (isError || !requirement) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Requirement Not Found</h3>
            <p className="text-sm text-red-800">
              {error?.message || 'The requirement definition could not be loaded.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{requirement.display_name}</CardTitle>
              <CardDescription className="mt-2 text-sm">
                {requirement.requirement_type}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {requirement.is_mandatory && (
                <Badge variant="default" className="bg-red-600 hover:bg-red-700">
                  Mandatory
                </Badge>
              )}
              {requirement.is_active ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div>
            <h4 className="font-semibold text-sm text-gray-600">Description</h4>
            <p className="mt-1 text-sm text-gray-900">{requirement.description}</p>
          </div>

          {/* Applicability Rules */}
          {requirement.applicability_rules && Object.keys(requirement.applicability_rules).length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Applicability Rules</h4>
              <div className="mt-2 rounded-md bg-blue-50 p-3">
                <pre className="overflow-auto text-xs text-gray-700">
                  {JSON.stringify(requirement.applicability_rules, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-gray-600">Display Order</p>
              <p className="mt-1 text-sm text-gray-900">{requirement.display_order}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Created</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(requirement.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Updated</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(requirement.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          onClick={onEdit}
          disabled={!onEdit}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
        <Button
          onClick={() => setDeleteDialogOpen(true)}
          disabled={!onDelete}
          className="flex items-center gap-2"
          variant="destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{requirement.display_name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <RequirementSubmittedTraineesList
        requirementId={requirement.id}
        requirementType={requirement.requirement_type}
      />
    </div>
  );
}

/**
 * Loading skeleton for RequirementDefinitionDetail
 */
function RequirementDefinitionDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default RequirementDefinitionDetail;
