/**
 * Tests for RequirementAnalyticsDashboard Component (Task 4.5)
 *
 * Covers:
 * - Successful rendering of analytics data
 * - Loading skeleton display
 * - 403 Forbidden access denied message
 * - Error handling with retry capability
 * - Responsive design
 * - Summary statistics display
 * - Requirement breakdown cards
 * - Refresh functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequirementAnalyticsDashboard from './RequirementAnalyticsDashboard';
import * as useRequirementsAnalyticsModule from '../hooks/useRequirementsAnalytics';
import type { RequirementsAnalytics } from '../types/requirements';

// Mock the hook
vi.mock('../hooks/useRequirementsAnalytics');

// Mock the logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockAnalyticsData: RequirementsAnalytics = {
  by_requirement: [
    {
      requirement_id: 'req-1',
      requirement_type: 'accomplished_learners_profile',
      display_name: "Accomplished Learner's Profile Form",
      is_mandatory: true,
      completion_rate: 85.5,
      total_trainees: 100,
      verified_count: 85,
      rejected_count: 5,
      rejection_rate: 5.6,
      avg_time_to_completion_days: 3.2,
    },
    {
      requirement_id: 'req-2',
      requirement_type: 'birth_certificate',
      display_name: 'Photocopy of Birth Certificate (NSO/PSA)',
      is_mandatory: true,
      completion_rate: 90.0,
      total_trainees: 100,
      verified_count: 90,
      rejected_count: 2,
      rejection_rate: 2.2,
      avg_time_to_completion_days: 2.8,
    },
  ],
  summary: {
    total_requirements: 7,
    avg_completion_rate: 87.75,
    avg_rejection_rate: 3.9,
  },
  timestamp: new Date().toISOString(),
};

describe('RequirementAnalyticsDashboard Component (Task 4.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful data rendering', () => {
    it('should render analytics dashboard with data', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('Requirements Analytics')).toBeInTheDocument();
      expect(screen.getByText('Avg Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Rejection Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Requirement Types')).toBeInTheDocument();
      expect(screen.getByText('Completion by Requirement')).toBeInTheDocument();
    });

    it('should display summary statistics with correct values', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('87.8%')).toBeInTheDocument();
      expect(screen.getByText('3.9%')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should display all requirement cards', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText("Accomplished Learner's Profile Form")).toBeInTheDocument();
      expect(screen.getByText('Photocopy of Birth Certificate (NSO/PSA)')).toBeInTheDocument();
    });

    it('should display mandatory badges for mandatory requirements', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      const mandatoryBadges = screen.getAllByText('Mandatory');
      expect(mandatoryBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('should display completion rates', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('85.5%')).toBeInTheDocument();
      expect(screen.getByText('90.0%')).toBeInTheDocument();
    });

    it('should display verified and rejected counts', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getAllByText(/Verified:/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Rejected:/)[0]).toBeInTheDocument();
    });

    it('should display rejection rates', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('5.6%')).toBeInTheDocument();
      expect(screen.getByText('2.2%')).toBeInTheDocument();
    });

    it('should display last updated timestamp', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should display loading skeleton while data is being fetched', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      const skeletonContainers = document.querySelectorAll('.animate-pulse');
      expect(skeletonContainers.length).toBeGreaterThan(0);
    });
  });

  describe('403 Forbidden error handling', () => {
    it('should display access denied message for non-admin users', async () => {
      const forbiddenError = new Error('Access Forbidden');
      (forbiddenError as any).response = { status: 403 };

      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: forbiddenError,
        isForbidden: true,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display error message when fetch fails', async () => {
      const error = new Error('Failed to load analytics');

      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('Failed to Load Analytics')).toBeInTheDocument();
      expect(screen.getByText(error.message)).toBeInTheDocument();
    });

    it('should provide retry button in error state', async () => {
      const error = new Error('Network error');
      const mockRefetch = vi.fn();

      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
        isForbidden: false,
        refetch: mockRefetch,
      });

      render(<RequirementAnalyticsDashboard />);

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      expect(retryButton).toBeInTheDocument();

      await userEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Empty data handling', () => {
    it('should display message when no analytics data is available', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: {
          by_requirement: [],
          summary: {
            total_requirements: 0,
            avg_completion_rate: 0,
            avg_rejection_rate: 0,
          },
          timestamp: new Date().toISOString(),
        },
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('No analytics data available yet')).toBeInTheDocument();
    });

    it('should display message when data is null', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('No analytics data available yet')).toBeInTheDocument();
    });
  });

  describe('Refresh functionality', () => {
    it('should call refetch when refresh button is clicked', async () => {
      const mockRefetch = vi.fn();

      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: mockRefetch,
      });

      render(<RequirementAnalyticsDashboard />);

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons[0];

      await userEvent.click(refreshButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Component props', () => {
    it('should pass refreshInterval to hook', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      const refreshInterval = 60000;
      render(<RequirementAnalyticsDashboard refreshInterval={refreshInterval} />);

      expect(useRequirementsAnalyticsModule.useRequirementsAnalytics).toHaveBeenCalledWith({
        refetchInterval: refreshInterval,
      });
    });

    it('should work without any props', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      expect(screen.getByText('Requirements Analytics')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have button with title attribute for refresh', async () => {
      (useRequirementsAnalyticsModule.useRequirementsAnalytics as any).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        isError: false,
        error: null,
        isForbidden: false,
        refetch: vi.fn(),
      });

      render(<RequirementAnalyticsDashboard />);

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons[0];

      expect(refreshButton).toHaveAttribute('title');
    });
  });
});
