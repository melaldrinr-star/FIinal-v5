import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';
import { formatDateDisplay, formatCreatedByDate, formatLastUpdatedByDate } from '../utils/dateFormat';
import {
  GraduationStatusBadge,
  EmploymentStatusBadge,
  SkillsMatchBadge,
} from './StatusBadge';
import type { TraineeStatusRecord } from '../services/traineeStatusService';

interface TraineeStatusModalReadOnlyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: TraineeStatusRecord;
  traineeName?: string;
  programName?: string;
}

/**
 * Render a field with proper null handling
 * Displays em-dash (—) or "Not recorded" for null/empty values
 */
function FieldDisplay({ label, value, className = '' }: { label: string; value: string | null | undefined; className?: string }) {
  const displayValue = value && value.trim() ? value : '—';

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-foreground break-words">{displayValue}</p>
    </div>
  );
}

/**
 * TraineeStatusModalReadOnly Component
 *
 * **Validates: Requirements 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 11.0, 13.0, 19.0**
 *
 * Displays a trainee status record in read-only format with sections for:
 * - Graduation Status (badge + date)
 * - Employment Status (badge + conditional fields)
 * - Skills Assessment (badge + percentage + remarks)
 * - Audit Trail (created/updated timestamps)
 *
 * Features:
 * - All fields displayed as read-only text
 * - Null fields shown as em-dash (—)
 * - Color-coded badges for all status values
 * - Conditional field visibility based on employment_status
 * - Scrollable remarks in text area (read-only)
 * - Date formatting as "Month Day, Year"
 * - Keyboard navigation: Esc closes modal, Tab navigates
 * - Semantic HTML and ARIA labels for accessibility
 */
export default function TraineeStatusModalReadOnly({
  open,
  onOpenChange,
  record,
  traineeName,
  programName,
}: TraineeStatusModalReadOnlyProps) {
  // Handle keyboard navigation (TASK 10.2)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc key closes modal (TASK 10.2)
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Determine if employment requires job fields display
  const showJobFields =
    record.employment_status === 'employed' ||
    record.employment_status === 'self_employed';

  // Determine if employment is unemployed
  const isUnemployed = record.employment_status === 'unemployed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        role="alertdialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <DialogHeader>
          <DialogTitle id="modal-title" className="flex items-center justify-between">
            <span>Trainee Status Details</span>
            <DialogClose
              aria-label="Close modal"
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogClose>
          </DialogTitle>
          <DialogDescription id="modal-description">
            Complete post-graduation outcome and employment information
            {traineeName && ` for ${traineeName}`}
            {programName && ` - ${programName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Graduation Status Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Graduation Status</span>
                <GraduationStatusBadge status={record.graduation_status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FieldDisplay
                  label="Status"
                  value={record.graduation_status.replace('_', ' ')}
                />
                <FieldDisplay
                  label="Graduation Date"
                  value={formatDateDisplay(record.graduation_date)}
                />
              </div>
              {record.certificateId && (
                <FieldDisplay label="Certificate ID" value={record.certificateId} />
              )}
            </CardContent>
          </Card>

          {/* Employment Status Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Post-Graduation Employment Status</span>
                <EmploymentStatusBadge status={record.employment_status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employment Status Value */}
              <FieldDisplay
                label="Employment Status"
                value={record.employment_status.replace(/_/g, ' ')}
              />

              {/* Job Details (if employed or self-employed) */}
              {/* TASK 2.8: Conditional field visibility */}
              {showJobFields && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <FieldDisplay label="Job Title" value={record.job_title} />
                  <FieldDisplay label="Employer Name" value={record.employer_name} />
                  <FieldDisplay label="Job Start Date" value={formatDateDisplay(record.job_start_date)} />
                  <FieldDisplay label="Industry/Sector" value={record.job_sector} />
                </div>
              )}

              {/* Unemployment Reason (if unemployed) */}
              {/* TASK 2.8: Conditional field visibility */}
              {isUnemployed && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <FieldDisplay
                    label="Reason for Unemployment"
                    value={record.unemployment_reason}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Assessment Section */}
          {/* Only show if employed (skills match only applies when employed) */}
          {record.employment_status === 'employed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills-to-Job Match Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Skills Match Badge */}
                {record.skills_match && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Skills Match
                    </span>
                    <SkillsMatchBadge
                      match={record.skills_match}
                      percentage={record.skills_match_percentage}
                    />
                  </div>
                )}

                {/* Skills Match Percentage */}
                {record.skills_match_percentage !== null &&
                  record.skills_match_percentage !== undefined && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Skills Match Percentage
                      </p>
                      <p className="text-sm text-foreground">{record.skills_match_percentage}%</p>
                    </div>
                  )}

                {/* Remarks - Scrollable Text Area (read-only) */}
                {record.remarks && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Remarks & Notes
                    </p>
                    <div className="bg-muted/50 border border-muted-foreground/20 rounded-md p-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {record.remarks}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit Trail Section */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {record.recorded_by && record.recorded_at && (
                <p aria-label="Record creation information">
                  {formatCreatedByDate(record.recorded_by, record.recorded_at)}
                </p>
              )}
              {record.last_updated_by && record.updated_at && (
                <p aria-label="Record update information">
                  {formatLastUpdatedByDate(record.last_updated_by, record.updated_at)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Close Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            tabIndex={0}
            aria-label="Close modal and return to list"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
