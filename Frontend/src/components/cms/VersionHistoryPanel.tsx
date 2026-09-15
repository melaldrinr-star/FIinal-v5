import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface VersionHistoryItem {
  id: string;
  version_number: number;
  created_at: string;
  created_by_admin_id?: string;
  change_summary?: string;
  settings_data: Record<string, any>;
}

export interface VersionHistoryPanelProps {
  onRollbackSuccess?: (version: VersionHistoryItem) => void;
  apiBaseUrl?: string;
}

/**
 * VersionHistoryPanel - Displays version history with preview and rollback capabilities
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
 * 
 * Features:
 * - Fetches version history on mount
 * - Displays versions with metadata (timestamp, changes summary, creator)
 * - Preview button to view version details
 * - Rollback button with confirmation dialog
 * - Success notification after rollback
 * - Loading and error states
 */
export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  onRollbackSuccess,
  apiBaseUrl = '',
}) => {
  const [versions, setVersions] = useState<VersionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionHistoryItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [rollbackInProgress, setRollbackInProgress] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState<VersionHistoryItem | null>(null);

  /**
   * Fetch version history on mount
   * Requirement 13.2: Display a list of previous customization versions with timestamps and changes summary
   */
  useEffect(() => {
    fetchVersionHistory();
  }, []);

  const fetchVersionHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/cms-settings/versions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401 ? 'Unauthorized' : 'Failed to fetch version history'
        );
      }

      const data = await response.json();
      setVersions(Array.isArray(data) ? data : data.versions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load version history';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Requirement 13.3: When an admin selects a previous version, the System SHALL preview that version before applying it
   */
  const handlePreview = (version: VersionHistoryItem) => {
    setSelectedVersion(version);
    setShowPreview(true);
  };

  /**
   * Requirement 13.4: When an admin confirms rollback, the System SHALL restore the selected previous version as the current customization
   * 
   * This shows the confirmation dialog before rollback
   */
  const handleRollbackClick = (version: VersionHistoryItem) => {
    setVersionToRollback(version);
    setShowRollbackConfirm(true);
  };

  /**
   * Execute the rollback API call
   */
  const executeRollback = async () => {
    if (!versionToRollback) return;

    try {
      setRollbackInProgress(true);
      const response = await fetch(
        `${apiBaseUrl}/api/cms-settings/versions/${versionToRollback.id}/rollback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to rollback version');
      }

      const data = await response.json();

      // Show success notification
      toast.success(
        `Rolled back to version ${versionToRollback.version_number} successfully`
      );

      // Refresh version history
      await fetchVersionHistory();

      // Call callback if provided
      if (onRollbackSuccess) {
        onRollbackSuccess(versionToRollback);
      }

      setShowRollbackConfirm(false);
      setVersionToRollback(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rollback version';
      setError(message);
      toast.error(message);
    } finally {
      setRollbackInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && versions.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchVersionHistory} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version List */}
      <div className="space-y-2">
        {versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground">No version history available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Version {version.version_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {version.change_summary && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {version.change_summary}
                    </p>
                  )}
                  {version.created_by_admin_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Created by: {version.created_by_admin_id}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(version)}
                    data-testid={`preview-button-${version.id}`}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRollbackClick(version)}
                    data-testid={`rollback-button-${version.id}`}
                  >
                    Rollback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <h3 className="text-lg font-semibold mb-4">
              Version {selectedVersion.version_number} Preview
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Created: {format(new Date(selectedVersion.created_at), 'PPpp')}
                </p>
                {selectedVersion.change_summary && (
                  <p className="text-sm text-foreground">
                    Changes: {selectedVersion.change_summary}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Settings Data:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64 text-foreground">
                  {JSON.stringify(selectedVersion.settings_data, null, 2)}
                </pre>
              </div>
            </div>

            <Button onClick={() => setShowPreview(false)} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              {versionToRollback && (
                <>
                  Are you sure you want to rollback to Version {versionToRollback.version_number}
                  ?
                  <br />
                  <span className="text-xs text-muted-foreground mt-2 block">
                    Created: {format(new Date(versionToRollback.created_at), 'PPpp')}
                  </span>
                  This action will restore the configuration from that version.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={rollbackInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRollback}
              disabled={rollbackInProgress}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="rollback-confirm-button"
            >
              {rollbackInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rolling back...
                </>
              ) : (
                'Rollback'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VersionHistoryPanel;
