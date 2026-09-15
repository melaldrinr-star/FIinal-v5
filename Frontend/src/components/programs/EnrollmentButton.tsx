import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';

export type EnrollmentStatus = 'not-enrolled' | 'enrolled' | 'graduate';

interface EnrollmentButtonState {
  status: EnrollmentStatus;
  label: string;
  disabled: boolean;
  tooltip?: string;
}

interface EnrollmentButtonProps {
  state: EnrollmentButtonState;
  onClick?: () => void;
  isLoading?: boolean;
  hidden?: boolean;
  className?: string;
}

/**
 * Get the button state based on enrollment information
 */
export function getEnrollmentButtonState(
  isEnrolled: boolean,
  programStatus: 'accepting' | 'in-progress' | 'completed',
  enrollmentDate?: Date,
  graduatedDate?: Date
): EnrollmentButtonState {
  // Not enrolled and program is accepting enrollments
  if (!isEnrolled && programStatus === 'accepting') {
    return {
      status: 'not-enrolled',
      label: 'Enroll',
      disabled: false,
    };
  }

  // Enrolled and program is in progress
  if (isEnrolled && programStatus === 'in-progress') {
    return {
      status: 'enrolled',
      label: 'Enrolled',
      disabled: true,
      tooltip: enrollmentDate
        ? `Enrolled on ${formatDate(enrollmentDate)}`
        : 'Already enrolled in this program',
    };
  }

  // Enrolled and program is completed / graduated
  if (isEnrolled && programStatus === 'completed' && graduatedDate) {
    return {
      status: 'graduate',
      label: 'Graduate',
      disabled: true,
      tooltip: `Completed on ${formatDate(graduatedDate)}`,
    };
  }

  // Fallback for enrolled without graduation (shouldn't happen in normal flow)
  if (isEnrolled) {
    return {
      status: 'enrolled',
      label: 'Enrolled',
      disabled: true,
      tooltip: 'Already enrolled in this program',
    };
  }

  // Default fallback (program not accepting enrollments)
  return {
    status: 'not-enrolled',
    label: 'Enrollment Closed',
    disabled: true,
    tooltip: 'This program is not currently accepting new enrollments',
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EnrollmentButton({
  state,
  onClick,
  isLoading = false,
  hidden = false,
  className,
}: EnrollmentButtonProps) {
  const button = (
    <Button
      onClick={onClick}
      disabled={state.disabled || isLoading}
      variant={state.status === 'not-enrolled' ? 'default' : 'secondary'}
      size="sm"
      className={cn(
        'transition-all duration-300',
        hidden ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto',
        className
      )}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {state.label}
    </Button>
  );

  // Only wrap in tooltip if there's a tooltip message
  if (state.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{state.tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

/**
 * Helper hook to manage enrollment button state
 */
export function useEnrollmentButtonState(
  isEnrolled: boolean,
  programStatus: 'accepting' | 'in-progress' | 'completed',
  enrollmentDate?: Date,
  graduatedDate?: Date
) {
  return getEnrollmentButtonState(
    isEnrolled,
    programStatus,
    enrollmentDate,
    graduatedDate
  );
}
