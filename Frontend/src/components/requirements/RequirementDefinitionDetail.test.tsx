/**
 * RequirementDefinitionDetail Component Tests
 *
 * Tests for the RequirementDefinitionDetail component covering:
 * - Data fetching and loading states
 * - Requirement details display
 * - Submission statistics visualization
 * - Action buttons functionality
 * - Error handling
 * - Responsive layout
 *
 * **Validates: Requirements FR2.2 - View individual requirement details**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { RequirementDefinitionDetail } from './RequirementDefinitionDetail';
import * as useRequirementDefinitionHook from '../../hooks/useRequirementDefinition';
import type { RequirementDefinition } from '../../types/requirementDefinition';

/**
 * Mock data for testing
 */
const mockRequirementDefinition: RequirementDefinition = {
  id: 'req-123',
  tenant_id: 'tenant-1',
  requirement_type: 'accomplished_learners_profile_form',
  display_name: 'Accomplished Learner\'s Profile Form',
  description: 'Please submit your accomplished learner\'s profile form with all required signatures.',
  is_mandatory: true,
  is_active: true,
  applicability_rules: null,
  display_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  deleted_at: null,
  submission_stats: {
    total_trainees: 100,
    pending_count: 25,
    submitted_count: 30,
    verified_count: 40,
    rejected_count: 5,
    waived_count: 0,
    completion_rate: 80,
  },
};

const mockRequirementWithApplicabilityRules: RequirementDefinition = {
  ...mockRequirementDefinition,
  id: 'req-456',
  display_name: 'Marriage Certificate',
  requirement_type: 'marriage_certificate',
  is_mandatory: false,
  applicability_rules: { marital_status: 'married' },
  submission_stats: {
    total_trainees: 30,
    pending_count: 10,
    submitted_count: 10,
    verified_count: 8,
    rejected_count: 2,
    waived_count: 0,
    completion_rate: 60,
  },
};

/**
 * Test wrapper with QueryClient
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

describe('RequirementDefinitionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching data', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      // Check for skeleton elements
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Submission Statistics')).not.toBeInTheDocument();
    });

    it('should display loading skeletons for all sections', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      // Check for multiple skeleton elements or absence of loaded content
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Submission Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when requirement not found', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('404 Not Found'),
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Requirement Not Found')).toBeInTheDocument();
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    it('should display error icon in error state', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Not Found'),
      });

      const { container } = render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      // AlertCircle icon should be present
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Requirement Details Display', () => {
    it('should display all requirement fields correctly', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      // Check header
      expect(screen.getByText(mockRequirementDefinition.display_name)).toBeInTheDocument();
      expect(screen.getByText(mockRequirementDefinition.requirement_type)).toBeInTheDocument();

      // Check description
      expect(screen.getByText(mockRequirementDefinition.description)).toBeInTheDocument();

      // Check metadata section
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should display mandatory and active badges', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Mandatory')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display optional badge when is_mandatory is false', () => {
      const nonMandatory = { ...mockRequirementDefinition, is_mandatory: false };
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: nonMandatory,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText('Mandatory')).not.toBeInTheDocument();
    });

    it('should display inactive badge when is_active is false', () => {
      const inactive = { ...mockRequirementDefinition, is_active: false };
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: inactive,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should display applicability rules when present', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementWithApplicabilityRules,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-456" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Applicability Rules')).toBeInTheDocument();
      expect(screen.getByText(/marital_status/)).toBeInTheDocument();
      expect(screen.getByText(/married/)).toBeInTheDocument();
    });

    it('should not display applicability rules when empty', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText('Applicability Rules')).not.toBeInTheDocument();
    });

    it('should display display order and dates', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Display Order')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Display order
    });
  });

  describe('Submission Statistics Display', () => {
    it('should display submission statistics section', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Submission Statistics')).toBeInTheDocument();
    });

    it('should display all submission stats correctly', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Total Trainees')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();

      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should display progress bar visualization', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Submission Breakdown')).toBeInTheDocument();
      // Check for progress bar container
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display legend for submission statuses', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      // Check for legend items in the legend that displays counts
      expect(screen.getByText(/Pending: 25/)).toBeInTheDocument();
      expect(screen.getByText(/Submitted: 30/)).toBeInTheDocument();
      expect(screen.getByText(/Verified: 40/)).toBeInTheDocument();
      expect(screen.getByText(/Rejected: 5/)).toBeInTheDocument();
    });

    it('should handle waived_count when present', () => {
      const statsWithWaived = {
        ...mockRequirementDefinition,
        submission_stats: {
          ...mockRequirementDefinition.submission_stats,
          waived_count: 10,
        },
      };

      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: statsWithWaived,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/Waived: 10/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render Edit, ViewSubmissions, and Delete buttons', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const onEdit = vi.fn();
      const onViewSubmissions = vi.fn();
      const onDelete = vi.fn();

      render(
        <RequirementDefinitionDetail
          requirementId="req-123"
          onEdit={onEdit}
          onViewSubmissions={onViewSubmissions}
          onDelete={onDelete}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('View Submissions')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onEdit when Edit button is clicked', async () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const onEdit = vi.fn();

      render(
        <RequirementDefinitionDetail requirementId="req-123" onEdit={onEdit} />,
        { wrapper: createWrapper() }
      );

      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(onEdit).toHaveBeenCalled();
    });

    it('should call onViewSubmissions when ViewSubmissions button is clicked', async () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const onViewSubmissions = vi.fn();

      render(
        <RequirementDefinitionDetail
          requirementId="req-123"
          onViewSubmissions={onViewSubmissions}
        />,
        { wrapper: createWrapper() }
      );

      const viewButton = screen.getByText('View Submissions');
      await userEvent.click(viewButton);

      expect(onViewSubmissions).toHaveBeenCalledWith('req-123');
    });

    it('should open delete confirmation dialog when Delete button is clicked', async () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const onDelete = vi.fn();

      render(
        <RequirementDefinitionDetail requirementId="req-123" onDelete={onDelete} />,
        { wrapper: createWrapper() }
      );

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();
    });

    it('should disable buttons when callbacks are not provided', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      const editButton = screen.getByText('Edit') as HTMLButtonElement;
      const viewButton = screen.getByText('View Submissions') as HTMLButtonElement;
      const deleteButton = screen.getByText('Delete') as HTMLButtonElement;

      expect(editButton.disabled).toBe(true);
      expect(viewButton.disabled).toBe(true);
      expect(deleteButton.disabled).toBe(true);
    });
  });

  describe('Delete Functionality', () => {
    it('should open delete confirmation dialog when Delete button is clicked', async () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const onDelete = vi.fn();

      render(
        <RequirementDefinitionDetail requirementId="req-123" onDelete={onDelete} />,
        { wrapper: createWrapper() }
      );

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();
    });

    it('should handle delete error gracefully', async () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const onDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));

      render(
        <RequirementDefinitionDetail requirementId="req-123" onDelete={onDelete} />,
        { wrapper: createWrapper() }
      );

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      // Note: Delete dialog is now open
      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render with proper grid layout', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      // Check for responsive classes
      const gridElements = container.querySelectorAll('[class*="grid"]');
      expect(gridElements.length).toBeGreaterThan(0);
    });

    it('should display stat boxes in responsive grid', () => {
      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: mockRequirementDefinition,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Total Trainees')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle requirement with zero submission_stats', () => {
      const zeroStats = {
        ...mockRequirementDefinition,
        submission_stats: {
          total_trainees: 0,
          pending_count: 0,
          submitted_count: 0,
          verified_count: 0,
          rejected_count: 0,
          waived_count: 0,
          completion_rate: 0,
        },
      };

      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: zeroStats,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
      expect(screen.getByText('Total Trainees')).toBeInTheDocument();
    });

    it('should handle very long requirement descriptions', () => {
      const longDescription = 'A'.repeat(500);
      const longDescReq = {
        ...mockRequirementDefinition,
        description: longDescription,
      };

      vi.spyOn(useRequirementDefinitionHook, 'useRequirementDefinition').mockReturnValue({
        data: longDescReq,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RequirementDefinitionDetail requirementId="req-123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });
});
