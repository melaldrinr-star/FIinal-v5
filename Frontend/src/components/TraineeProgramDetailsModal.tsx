import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  GraduationCap,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { getThumbnailUrl } from '../services/api';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  instructor?: string | null;
  duration_weeks?: number;
  max_trainees?: number;
  thumbnail_path?: string;
  image_path?: string;
  icon?: React.ReactNode;
}

interface TraineeProgramDetailsModalProps {
  program: Program | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnroll?: () => void;
  isEnrolling?: boolean;
  isEnrolled?: boolean;
  enrollmentStatus?: 'accepting' | 'in-progress' | 'completed';
  enrollmentDate?: Date;
  graduatedDate?: Date;
}

export default function TraineeProgramDetailsModal({
  program,
  open,
  onOpenChange,
  onEnroll,
  isEnrolling = false,
  isEnrolled = false,
  enrollmentStatus = 'accepting',
  enrollmentDate,
  graduatedDate,
}: TraineeProgramDetailsModalProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  if (!program) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const photoUrl = getThumbnailUrl(program.thumbnail_path || program.image_path);

  const getEnrollmentMessage = () => {
    if (isEnrolled) {
      if (enrollmentStatus === 'completed' && graduatedDate) {
        return `Completed on ${formatDate(graduatedDate.toString())}`;
      }
      if (enrollmentStatus === 'in-progress' && enrollmentDate) {
        return `Enrolled since ${formatDate(enrollmentDate.toString())}`;
      }
      return 'You are enrolled in this program';
    }
    return null;
  };

  const getButtonLabel = () => {
    if (isEnrolled) {
      if (enrollmentStatus === 'completed') return 'Completed';
      if (enrollmentStatus === 'in-progress') return 'Enrolled';
    }
    return 'Apply Now';
  };

  const isButtonDisabled = isEnrolled || isEnrolling;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <GraduationCap className="size-6" />
            {program.name}
          </DialogTitle>
          <DialogDescription>
            Program details and enrollment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Program Image */}
          {photoUrl && !imageLoadFailed && (
            <div className="flex justify-center">
              <img
                src={photoUrl}
                alt={program.name}
                className="h-48 w-full rounded-lg object-cover shadow-md"
                onError={() => setImageLoadFailed(true)}
              />
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant={program.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {program.status}
            </Badge>
            {isEnrolled && (
              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                {enrollmentStatus === 'completed' ? 'Completed' : 'Enrolled'}
              </Badge>
            )}
          </div>

          {/* Description */}
          {program.description && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {program.description}
              </p>
            </div>
          )}

          {/* Program Details Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Start Date */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Calendar className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Start Date</p>
                <p className="text-sm font-semibold mt-0.5">
                  {formatDate(program.start_date)}
                </p>
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
                <Calendar className="size-4 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">End Date</p>
                <p className="text-sm font-semibold mt-0.5">
                  {formatDate(program.end_date)}
                </p>
              </div>
            </div>

            {/* Duration */}
            {program.duration_weeks && (
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                  <Clock className="size-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {program.duration_weeks} week{program.duration_weeks !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Instructor */}
            {program.instructor && (
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <User className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Instructor</p>
                  <p className="text-sm font-semibold mt-0.5">{program.instructor}</p>
                </div>
              </div>
            )}

            {/* Max Trainees */}
            {program.max_trainees && (
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
                  <Users className="size-4 text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Max Trainees</p>
                  <p className="text-sm font-semibold mt-0.5">{program.max_trainees}</p>
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Status Info */}
          {isEnrolled && (
            <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                    {enrollmentStatus === 'completed'
                      ? 'Program Completed'
                      : 'Enrollment Confirmed'}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {getEnrollmentMessage()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner for Pending Enrollment */}
          {!isEnrolled && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-5 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-100">!</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                    Ready to apply?
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Click the button below to submit your application. Staff will review and confirm your enrollment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-col">
          {!isEnrolled && onEnroll && (
            <Button
              onClick={onEnroll}
              disabled={isButtonDisabled}
              className="w-full gap-2"
              size="lg"
            >
              {isEnrolling ? 'Submitting...' : getButtonLabel()}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEnrolling}
            className="w-full"
          >
            {isEnrolled ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
