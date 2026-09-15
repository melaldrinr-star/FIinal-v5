/**
 * RequirementAnalyticsDashboard Component
 *
 * Displays analytics for training requirements including:
 * - Completion rates by requirement type
 * - Rejection counts and rates
 * - Summary statistics (avg completion rate, avg rejection rate)
 * - Visual representation via progress bars and stat cards
 *
 * Features:
 * - Admin-only access (shows access denied for non-admins)
 * - Loading skeleton while fetching
 * - Error handling and retry capability
 * - Responsive design (mobile and desktop)
 * - Uses shadcn/ui components and Tailwind CSS
 * - Optional auto-refresh via refreshInterval prop
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { AlertTriangle, Lock, BarChart3, TrendingUp, TrendingDown, RotateCw } from 'lucide-react';
import { useRequirementsAnalytics } from '../hooks/useRequirementsAnalytics';
import type { RequirementAnalytic, AnalyticsSummary } from '../types/requirements';
import logger from '../utils/logger';

/**
 * Component props
 */
interface RequirementAnalyticsDashboardProps {
  /** Optional refresh interval in milliseconds (e.g., 5 * 60 * 1000 for 5 minutes) */
  refreshInterval?: number;
}

/**
 * Status badge colors for completion rates
 */
function getCompletionBadgeColor(rate: number): string {
  if (rate >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (rate >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (rate >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

/**
 * Get icon for completion rate
 */
function getCompletionIcon(rate: number) {
  if (rate >= 80) return <TrendingUp className="w-4 h-4" />;
  if (rate >= 40) return <BarChart3 className="w-4 h-4" />;
  return <TrendingDown className="w-4 h-4" />;
}

/**
 * Loading skeleton for dashboard
 */
function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary stats skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requirements list skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                <div className="h-4 bg-muted rounded w-48" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-64" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Access denied error state
 */
function AccessDeniedMessage() {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="py-8">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-900">Access Denied</p>
            <p className="text-sm text-yellow-800 mt-1">
              You don't have permission to view requirements analytics. Only administrators can access this feature.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error state with retry button
 */
interface ErrorMessageProps {
  error: Error | null;
  onRetry: () => void;
  isLoading: boolean;
}

function ErrorMessage({ error, onRetry, isLoading }: ErrorMessageProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="py-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Failed to Load Analytics</p>
              <p className="text-sm text-red-800 mt-1">
                {error?.message || 'An error occurred while fetching analytics. Please try again.'}
              </p>
            </div>
          </div>
          <Button
            onClick={onRetry}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="ml-4 flex-shrink-0"
          >
            <RotateCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Summary statistics card
 */
interface SummaryStatsProps {
  summary: AnalyticsSummary;
}

function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Average Completion Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">Avg Completion Rate</CardDescription>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{summary.avg_completion_rate.toFixed(1)}%</p>
            <Progress value={summary.avg_completion_rate} className="h-2" />
            <p className="text-xs text-muted-foreground">Across all requirements</p>
          </div>
        </CardContent>
      </Card>

      {/* Average Rejection Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">Avg Rejection Rate</CardDescription>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{summary.avg_rejection_rate.toFixed(1)}%</p>
            <Progress value={summary.avg_rejection_rate} className="h-2" />
            <p className="text-xs text-muted-foreground">Requiring resubmission</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Requirements */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">Total Requirement Types</CardDescription>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{summary.total_requirements}</p>
            <p className="text-xs text-muted-foreground">Tracked in system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Requirement analytics card
 */
interface RequirementAnalyticsCardProps {
  requirement: RequirementAnalytic;
}

function RequirementAnalyticsCard({ requirement }: RequirementAnalyticsCardProps) {
  return (
    <div className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
      {/* Header with name and badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm truncate">{requirement.display_name}</h4>
            {requirement.is_mandatory && (
              <Badge variant="default" className="text-xs flex-shrink-0">
                Mandatory
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {requirement.total_trainees} trainees
          </p>
        </div>
      </div>

      {/* Completion rate progress bar and percentage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Completion Rate</span>
          <div className="flex items-center gap-1">
            {getCompletionIcon(requirement.completion_rate)}
            <Badge variant="outline" className={`text-xs ${getCompletionBadgeColor(requirement.completion_rate)}`}>
              {requirement.completion_rate.toFixed(1)}%
            </Badge>
          </div>
        </div>
        <Progress value={requirement.completion_rate} className="h-2" />
      </div>

      {/* Submission breakdown */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground">Verified: <span className="font-semibold text-green-700">{requirement.verified_count}</span></p>
          <p className="text-muted-foreground">Rejected: <span className="font-semibold text-red-700">{requirement.rejected_count}</span></p>
        </div>
        <div>
          <p className="text-muted-foreground">Rejection Rate:</p>
          <p className="font-semibold">
            <span className={requirement.rejection_rate > 10 ? 'text-red-600' : 'text-green-600'}>
              {requirement.rejection_rate.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>

      {/* Average time to completion (if available) */}
      {requirement.avg_time_to_completion_days !== undefined && (
        <p className="text-xs text-muted-foreground">
          Avg completion time: <span className="font-semibold">{requirement.avg_time_to_completion_days.toFixed(1)} days</span>
        </p>
      )}
    </div>
  );
}

/**
 * Main RequirementAnalyticsDashboard Component
 */
export default function RequirementAnalyticsDashboard({
  refreshInterval,
}: RequirementAnalyticsDashboardProps) {
  const { data, isLoading, isError, error, isForbidden, refetch } = useRequirementsAnalytics({
    refetchInterval: refreshInterval,
  });
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(!!refreshInterval);

  // Log component mount and unmount
  useEffect(() => {
    logger.info('[RequirementAnalyticsDashboard] Component mounted', {
      refreshInterval,
      autoRefreshEnabled,
    });

    return () => {
      logger.info('[RequirementAnalyticsDashboard] Component unmounted');
    };
  }, [refreshInterval, autoRefreshEnabled]);

  // Handle 403 Forbidden (non-admin access)
  if (isForbidden) {
    return <AccessDeniedMessage />;
  }

  // Handle loading state
  if (isLoading) {
    return <AnalyticsDashboardSkeleton />;
  }

  // Handle error state
  if (isError) {
    return <ErrorMessage error={error} onRetry={refetch} isLoading={isLoading} />;
  }

  // Handle no data
  if (!data || !data.by_requirement || data.by_requirement.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No analytics data available yet</p>
            <p className="text-xs text-muted-foreground">Analytics will appear once requirement submissions are tracked</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and refresh button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Requirements Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track completion rates and submission status across all requirements
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          size="sm"
          variant="outline"
          title="Refresh analytics data"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Summary statistics */}
      <SummaryStats summary={data.summary} />

      {/* Requirements breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completion by Requirement</CardTitle>
          <CardDescription>
            {data.by_requirement.length} requirement{data.by_requirement.length !== 1 ? 's' : ''} tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {data.by_requirement
              .sort((a, b) => b.completion_rate - a.completion_rate)
              .map((requirement) => (
                <RequirementAnalyticsCard
                  key={requirement.requirement_id}
                  requirement={requirement}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Last updated timestamp */}
      {data.timestamp && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
