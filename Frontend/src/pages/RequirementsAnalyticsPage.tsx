/**
 * RequirementsAnalyticsPage
 *
 * Admin page for viewing analytics and reporting on training requirements.
 * Provides comprehensive analytics dashboard with charts and statistics.
 *
 * **Validates: Task 5.3 - RequirementsAnalyticsPage container**
 *
 * Features:
 * - Display analytics dashboard with requirement completion rates
 * - Show rejection counts and rates by requirement
 * - Summary statistics for all requirements
 * - Visual representation via progress bars and stat cards
 * - Breadcrumb navigation
 * - Responsive design for mobile, tablet, and desktop
 * - Error boundaries and loading states
 * - Admin role verification
 * - Optional auto-refresh capability
 *
 * Requirements Integration:
 * - Validates Requirement FR5.1: Requirement completion analytics
 * - Validates Requirement FR5.2: Trainee enrollment progress dashboard
 * - Validates NFR5: Usability - clear UI, responsive design
 * - Validates NFR4: Security - admin role check, tenant isolation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import RequirementAnalyticsDashboard from '../components/RequirementAnalyticsDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertTriangle,
  ChevronRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import logger from '../utils/logger';

/**
 * Breadcrumb navigation component
 * Shows the current page path in the admin interface
 */
function AnalyticsBreadcrumb() {
  return (
    <nav className="flex items-center gap-1 text-xs sm:text-sm mb-4">
      <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
        Dashboard
      </a>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium text-foreground">Requirements Analytics</span>
    </nav>
  );
}

/**
 * RequirementsAnalyticsPage Component
 *
 * Main admin interface for requirement analytics and reporting.
 * Orchestrates the requirement analytics workflow for administrators.
 *
 * Access Control:
 * - Requires 'local_admin' or 'super_admin' role
 * - Enforces tenant isolation (admins only see their tenant's analytics)
 *
 * Layout:
 * - Header with page title and refresh button
 * - Breadcrumb navigation
 * - Error boundary for component protection
 * - RequirementAnalyticsDashboard component for main content
 * - Loading states and empty states
 * - Responsive design for all screen sizes
 * - Optional 5-minute auto-refresh interval
 */
export default function RequirementsAnalyticsPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Log page access
  React.useEffect(() => {
    logger.info('RequirementsAnalyticsPage mounted', {
      userRole: user?.role,
      userId: user?.id,
    });
  }, [user]);

  // Access control: Only local_admin and super_admin can access this page
  if (!user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4 sm:py-16">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="size-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Loading...</h2>
              <p className="text-sm text-muted-foreground">Verifying authentication status...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canViewAnalytics = user?.role === 'local_admin' || user?.role === 'super_admin';

  if (!canViewAnalytics) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <AnalyticsBreadcrumb />
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertTriangle className="size-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">Access Denied</h3>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                  Only administrators can view requirements analytics. Please contact your system administrator if you need access to this feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a re-render of the dashboard by updating the key
    setRefreshKey(prev => prev + 1);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="space-y-4 md:space-y-6">
          {/* Breadcrumb Navigation */}
          <AnalyticsBreadcrumb />

          {/* Page Header */}
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-lg sm:text-2xl font-bold">
                <BarChart3 className="size-6 sm:size-8 flex-shrink-0" />
                <span>Requirements Analytics</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Track completion rates, rejection counts, and requirement statistics
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="sm:size-default w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Information Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
              View comprehensive analytics on requirement completion rates, rejection counts, and average time-to-completion. Use this data to identify areas for improvement in the enrollment requirements process.
            </AlertDescription>
          </Alert>

          {/* Main Content: Analytics Dashboard */}
          <div className="mt-6 md:mt-8">
            <ErrorBoundary>
              <RequirementAnalyticsDashboard
                key={refreshKey}
                refreshInterval={5 * 60 * 1000}
              />
            </ErrorBoundary>
          </div>

          {/* Quick Links Section */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate('/admin/requirements')}
                >
                  View All Requirements
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate('/admin/requirements/new')}
                >
                  Create New Requirement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
