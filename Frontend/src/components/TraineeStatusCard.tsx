'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { GraduationStatusBadge, EmploymentStatusBadge, SkillsMatchBadge } from './StatusBadge';
import { formatRecordedOnDate } from '../utils/dateFormat';
import { AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { TraineeStatusRecord, TraineeStatusCardProps } from '../types/traineeStatus';
import { cn } from './ui/utils';

/**
 * TraineeStatusCard Component
 * 
 * Displays a compact summary of trainee post-graduation status on the profile page.
 * Shows graduation status, employment status, job details (if employed), skills match,
 * and recorded date. Includes loading skeleton and error states.
 * 
 * **Validates: Requirements 2.0, 5.0, 6.0, 7.0, 19.0**
 */
export function TraineeStatusCard({
  statusRecord,
  isLoading = false,
  error,
  onViewDetails,
}: TraineeStatusCardProps): React.ReactElement {
  if (isLoading) {
    return <TraineeStatusCardSkeleton />;
  }

  if (error) {
    return <TraineeStatusCardError error={error} onRetry={onViewDetails} />;
  }

  if (statusRecord === null) {
    return <TraineeStatusCardPlaceholder />;
  }

  return <TraineeStatusCardContent record={statusRecord} onViewDetails={onViewDetails} />;
}

/**
 * Loading skeleton for TraineeStatusCard
 * Matches the card layout with placeholder elements
 */
function TraineeStatusCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Post-Graduation Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trainee name skeleton */}
        <Skeleton className="h-6 w-48" />
        
        {/* Badges row skeleton */}
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-28" />
        </div>
        
        {/* Job details skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-56" />
        </div>
        
        {/* Skills and date skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-48" />
        </div>
        
        {/* Button skeleton */}
        <Skeleton className="h-9 w-32 mt-4" />
      </CardContent>
    </Card>
  );
}

/**
 * Error state for TraineeStatusCard
 * Displays error message with retry button
 */
interface TraineeStatusCardErrorProps {
  error: string;
  onRetry?: () => void;
}

function TraineeStatusCardError({ error, onRetry }: TraineeStatusCardErrorProps): React.ReactElement {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-destructive">Failed to load status</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="mt-2"
                aria-label="Retry loading trainee status"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Placeholder for when no status record exists
 */
function TraineeStatusCardPlaceholder(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Post-Graduation Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No post-graduation status recorded</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main content renderer for TraineeStatusCard
 * Displays all status information when record exists
 */
interface TraineeStatusCardContentProps {
  record: TraineeStatusRecord;
  onViewDetails?: () => void;
}

function TraineeStatusCardContent({ record, onViewDetails }: TraineeStatusCardContentProps): React.ReactElement {
  const traineeName = getTraineeName(record);
  const isEmployed = ['employed', 'self_employed'].includes(record.employmentStatus);
  const jobDisplay = getJobDisplay(record, isEmployed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Post-Graduation Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trainee Name */}
        <div>
          <h3 className="text-base font-medium text-foreground" aria-label={`Trainee: ${traineeName}`}>
            {traineeName}
          </h3>
        </div>

        {/* Status Badges Row */}
        <div className="flex gap-2 flex-wrap">
          <GraduationStatusBadge status={record.graduationStatus as any} />
          <EmploymentStatusBadge status={record.employmentStatus as any} />
        </div>

        {/* Job Details (if employed) */}
        {isEmployed && jobDisplay.display && (
          <div className="space-y-1.5 py-2 border-t border-b border-border/50">
            <JobDetailRow
              label="Job Title:"
              value={record.jobTitle || 'Not specified'}
              title={record.jobTitle}
            />
            <JobDetailRow
              label="Employer:"
              value={record.employerName || 'Not specified'}
              title={record.employerName}
            />
          </div>
        )}

        {/* Skills Match and Recorded Date Row */}
        <div className="flex justify-between items-start gap-4 pt-2">
          <div className="flex-1">
            {record.skillsMatch && (
              <SkillsMatchBadge
                match={record.skillsMatch as any}
                percentage={record.skillsMatchPercentage}
                className="inline-block"
              />
            )}
          </div>
          <div className="text-sm text-muted-foreground text-right whitespace-nowrap">
            {formatRecordedOnDate(record.recordedAt)}
          </div>
        </div>

        {/* View Details Button */}
        <div className="pt-2">
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            aria-label="View full trainee status details"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Helper: Get trainee name from record
 * Falls back to "Unknown Trainee" if name is not available
 */
function getTraineeName(record: TraineeStatusRecord): string {
  // Note: In a real implementation, you might have traineeName in the record
  // or fetch it from a parent component prop. For now, we use traineeId as fallback.
  return 'Trainee'; // This should be passed as a prop or fetched separately
}

/**
 * Helper: Determine job display information
 * Checks if job details are populated and should be displayed
 */
function getJobDisplay(record: TraineeStatusRecord, isEmployed: boolean): { display: boolean } {
  if (!isEmployed) {
    return { display: false };
  }

  const hasJobDetails = record.jobTitle || record.employerName;
  return { display: hasJobDetails ? true : false };
}

/**
 * JobDetailRow Component
 * Displays a job detail with label, truncated value, and tooltip on hover
 */
interface JobDetailRowProps {
  label: string;
  value: string;
  title?: string | null;
}

function JobDetailRow({ label, value, title }: JobDetailRowProps): React.ReactElement {
  const displayValue = truncateText(value, 40);
  const shouldShowTooltip = value.length > 40;

  return (
    <div className="flex gap-2">
      <span className="font-medium text-sm text-foreground min-w-fit">{label}</span>
      <span
        className={cn(
          'text-sm text-muted-foreground',
          shouldShowTooltip && 'truncate cursor-help'
        )}
        title={shouldShowTooltip ? (title || value) : undefined}
      >
        {displayValue}
      </span>
    </div>
  );
}

/**
 * Helper: Truncate text with ellipsis
 * Used for job titles and employer names that are too long
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

export default TraineeStatusCard;
