import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, Zap } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import type { TraineeStatusCardProps } from '../../types/traineeStatus';
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_COLORS,
  GRADUATION_STATUS_LABELS,
  GRADUATION_STATUS_COLORS,
  SKILLS_MATCH_LABELS,
  SKILLS_MATCH_COLORS,
} from '../../types/traineeStatus';
import { formatDateDisplay, formatRecordedOnDate } from '../../utils/dateFormat';
import {
  StatusBadge,
  GraduationStatusBadge,
  EmploymentStatusBadge,
  SkillsMatchBadge,
} from '../StatusBadge';

/**
 * TraineeStatusCard Component
 *
 * Displays a compact summary of trainee post-graduation status on the profile page.
 * Shows graduation status, employment status, skills match, and key employment details.
 * Provides a "View Details" button to open the full modal for editing.
 *
 * Renders different states:
 * - Loading: Skeleton loader with animation
 * - Error: Error message with retry option
 * - No Record: Placeholder message when status doesn't exist
 * - Data: Full status information with all key details
 *
 * **Performance Optimization:** Memoized with React.memo to prevent unnecessary
 * re-renders when parent components update but card props remain unchanged.
 * This is especially beneficial on the trainee profile page where other sections
 * may update frequently.
 *
 * **Validates: Requirements 2.0, 5.0, 6.0, 7.0, 19.0**
 */
const TraineeStatusCardComponent = React.forwardRef<
  HTMLDivElement,
  TraineeStatusCardProps
>(({ statusRecord, isLoading = false, error, onViewDetails }, ref) => {
  // Render loading skeleton
  if (isLoading) {
    return <TraineeStatusCardSkeleton innerRef={ref} />;
  }

  // Render error state
  if (error) {
    return (
      <Card ref={ref} className="border-red-200 bg-red-50" role="alert" aria-live="polite" aria-label="Error loading trainee status">
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render placeholder when no record exists
  if (!statusRecord) {
    return (
      <Card ref={ref} role="region" aria-label="No trainee status available">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Zap className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">
              No post-graduation status recorded
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Status information will appear here once recorded
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render data state
  return (
    <Card ref={ref} className="overflow-hidden" role="region" aria-label="Trainee post-graduation status information">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base" id="status-card-title">Post-Graduation Status</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Graduation Section */}
        <section aria-labelledby="graduation-heading" role="region">
          <div className="space-y-2">
            <h4 id="graduation-heading" className="text-xs font-semibold uppercase text-muted-foreground">
              Graduation
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <GraduationStatusBadge status={statusRecord.graduationStatus} />
              {statusRecord.graduationDate && (
                <span className="text-sm text-muted-foreground">
                  {formatDateDisplay(statusRecord.graduationDate)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Employment Section */}
        <section aria-labelledby="employment-heading" role="region">
          <div className="space-y-2">
            <h4 id="employment-heading" className="text-xs font-semibold uppercase text-muted-foreground">
              Employment
            </h4>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <EmploymentStatusBadge status={statusRecord.employmentStatus} />
              </div>

              {/* Job Details (if employed or self-employed) */}
              {['employed', 'self_employed'].includes(statusRecord.employmentStatus) && (
                <div className="space-y-1 text-sm" role="group" aria-labelledby="job-details-label">
                  <p id="job-details-label" className="sr-only">Job position and employer details</p>
                  {statusRecord.jobTitle && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-muted-foreground min-w-20">Job:</span>
                      <span
                        title={statusRecord.jobTitle}
                        className="truncate text-foreground"
                        aria-label={`Job title: ${statusRecord.jobTitle}`}
                      >
                        {statusRecord.jobTitle}
                      </span>
                    </div>
                  )}
                  {statusRecord.employerName && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-muted-foreground min-w-20">Employer:</span>
                      <span
                        title={statusRecord.employerName}
                        className="truncate text-foreground"
                        aria-label={`Employer: ${statusRecord.employerName}`}
                      >
                        {statusRecord.employerName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Unemployment Reason (if unemployed) */}
              {statusRecord.employmentStatus === 'unemployed' &&
                statusRecord.unemploymentReason && (
                  <div className="text-sm" role="group" aria-labelledby="unemployment-reason-label">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-muted-foreground min-w-20" id="unemployment-reason-label">
                        Reason:
                      </span>
                      <span
                        title={statusRecord.unemploymentReason}
                        className="truncate text-foreground"
                        aria-label={`Unemployment reason: ${statusRecord.unemploymentReason}`}
                      >
                        {statusRecord.unemploymentReason}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </section>

        {/* Skills Assessment Section */}
        <section aria-labelledby="skills-heading" role="region">
          <div className="space-y-2">
            <h4 id="skills-heading" className="text-xs font-semibold uppercase text-muted-foreground">
              Skills Assessment
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {statusRecord.skillsMatch && (
                <SkillsMatchBadge
                  match={statusRecord.skillsMatch}
                  percentage={statusRecord.skillsMatchPercentage}
                />
              )}
            </div>
          </div>
        </section>

        {/* Recorded Date */}
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {formatRecordedOnDate(statusRecord.recordedAt)}
          </p>
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="w-full"
            aria-label="View full details of trainee post-graduation status, including employment history and remarks"
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

TraineeStatusCardComponent.displayName = 'TraineeStatusCard';

/**
 * Memoized version of TraineeStatusCard
 * Prevents re-renders when props haven't changed, improving performance
 * on the trainee profile page when other sections update.
 */
export const TraineeStatusCard = React.memo(TraineeStatusCardComponent);

/**
 * TraineeStatusCardSkeleton Component
 *
 * Displays a skeleton loading state for the TraineeStatusCard.
 * Provides visual feedback while data is being fetched.
 */
function TraineeStatusCardSkeleton(
  props: React.ComponentProps<typeof Card> & { innerRef?: React.Ref<HTMLDivElement> }
) {
  const { innerRef, ...cardProps } = props;

  return (
    <Card ref={innerRef} {...cardProps}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Graduation Section Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Employment Section Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Skills Section Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>

        {/* Recorded Date Skeleton */}
        <div className="border-t pt-3">
          <Skeleton className="h-3 w-32" />
        </div>

        {/* View Details Button Skeleton */}
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export { TraineeStatusCardSkeleton };
