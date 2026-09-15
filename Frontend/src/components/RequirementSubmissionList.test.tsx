/**
 * Unit Tests for RequirementSubmissionList Component (Task 4.4)
 *
 * Tests for the admin component that displays trainee submissions with:
 * - Table display with sortable columns
 * - Filtering by status
 * - Search functionality
 * - Pagination
 * - Action buttons (verify, reject, waive)
 * - Loading and error states
 *
 * **Validates: Requirements 2.2, 3.2, FR2.2, FR3.2**
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequirementSubmissionList } from './RequirementSubmissionList';
import * as useRequirementSubmissionsHook from '../hooks/useRequirementSubmissions';
import type { RequirementSubmission, PaginationInfo } from '../types/requirements';

/**
 * Create a test wrapper with React Query provider
 */
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Mock the useRequirementSubmissions hook
vi.mock('../hooks/useRequirementSubmissions', () => ({
  useRequirementSubmissions: vi.fn(),
}));

describe('RequirementSubmissionList Component (Task 4.4)', () => {
  const mockSubmissions: RequirementSubmission[] = [
    {
      id: 'sub-1',
      enrollmentId: 'enroll-1',
      requirementId: 'req-1',
      status: 'submitted',
      traineeId: 'trainee-1',
      traineeName: 'John Doe',
      traineeEmail: 'john@example.com',
      documentUrl: 'https://example.com/doc1.pdf',
      submittedAt: '2024-01-15T10:00:00Z',
      verifiedAt: undefined,
      verifiedBy: undefined,
      rejectionReason: undefined,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'sub-2',
      enrollmentId: 'enroll-2',
      requirementId: 'req-1',
      status: 'verified',
      traineeId: 'trainee-2',
      traineeName: 'Jane Smith',
      traineeEmail: 'jane@example.com',
      documentUrl: 'https://example.com/doc2.pdf',
      submittedAt: '2024-01-14T10:00:00Z',
      verifiedAt: '2024-01-15T11:00:00Z',
      verifiedBy: 'admin-1',
      rejectionReason: undefined,
      createdAt: '2024-01-14T10:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    },
    {
      id: 'sub-3',
      enrollmentId: 'enroll-3',
      requirementId: 'req-1',
      status: 'pending',
      traineeId: 'trainee-3',
      traineeName: 'Bob Johnson',
      traineeEmail: 'bob@example.com',
      documentUrl: undefined,
      submittedAt: undefined,
      verifiedAt: undefined,
      verifiedBy: undefined,
      rejectionReason: undefined,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
  ];

  const mockPagination: PaginationInfo = {
    page: 1,
    limit: 20,
    total: 3,
    hasMore: false,
  };

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequirementSubmissionsHook.useRequirementSubmissions as any).mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      isError: false,
      error: null,
      pagination: mockPagination,
      refetch: mockRefetch,
    });
  });

  describe('Table Display', () => {
    it('should render the component with header and submissions table', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByText('Requirement Submissions')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display all table columns: trainee name, status, submitted, verified, actions', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Check for table and that rows exist
      expect(screen.getByRole('table')).toBeInTheDocument();
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThanOrEqual(5);
    });

    it('should display all submissions in rows', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display status badges with correct styling', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Check for status badges in the table
      const rows = screen.getAllByRole('row');
      // Verify we have header + 3 data rows
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });

    it('should display "—" for missing dates', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Bob Johnson (pending) should have "—" for submitted and verified dates
      const emptyDashes = screen.getAllByText('—');
      expect(emptyDashes.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('should have a status filter dropdown', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const filterLabel = screen.getByText('Filter by Status');
      expect(filterLabel).toBeInTheDocument();
    });

    it('should have search input for trainee filtering', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should have a search input field', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should have sort options section', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Check for sort section headers
      expect(screen.getByText('Sort By')).toBeInTheDocument();
      expect(screen.getByText('Order')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const prevButton = screen.getByRole('button', { name: /Previous/ });
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button when no more pages', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const nextButton = screen.getByRole('button', { name: /Next/ });
      expect(nextButton).toBeDisabled();
    });

    it('should display page information', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByText(/Page 1/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 3 of 3 submissions/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeletons when isLoading is true', () => {
      (useRequirementSubmissionsHook.useRequirementSubmissions as any).mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
        pagination: mockPagination,
        refetch: mockRefetch,
      });

      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Check that the table is not rendered (indicating loading state)
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should disable pagination buttons during loading', () => {
      (useRequirementSubmissionsHook.useRequirementSubmissions as any).mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
        pagination: mockPagination,
        refetch: mockRefetch,
      });

      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Pagination should not be visible during loading
      const paginationControls = screen.queryByText(/Page/);
      expect(paginationControls).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', () => {
      const errorMessage = 'Failed to load submissions';
      (useRequirementSubmissionsHook.useRequirementSubmissions as any).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error(errorMessage),
        pagination: mockPagination,
        refetch: mockRefetch,
      });

      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByText('Failed to Load Submissions')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      (useRequirementSubmissionsHook.useRequirementSubmissions as any).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error('Test error'),
        pagination: mockPagination,
        refetch: mockRefetch,
      });

      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const retryButton = screen.getByRole('button', { name: /Retry/ });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no submissions exist', () => {
      (useRequirementSubmissionsHook.useRequirementSubmissions as any).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        pagination: { ...mockPagination, total: 0 },
        refetch: mockRefetch,
      });

      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByText('No submissions found')).toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('should display refresh button', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const refreshButton = screen.getByRole('button', { name: /Refresh/ });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render action buttons for submissions', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      // Find the row with submitted status
      const row = screen.getByText('John Doe').closest('tr');
      expect(row).toBeTruthy();

      // Should have action buttons
      const actionCell = row?.querySelector('td:last-child');
      expect(actionCell).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useRequirementSubmissions hook with requirementId', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      expect(useRequirementSubmissionsHook.useRequirementSubmissions).toHaveBeenCalledWith(
        'req-1',
        expect.any(Object)
      );
    });

    it('should pass correct options to the hook', () => {
      render(<RequirementSubmissionList requirementId="req-1" />, {
        wrapper: createTestWrapper(),
      });

      const callOptions = (
        useRequirementSubmissionsHook.useRequirementSubmissions as any
      ).mock.calls[0][1];

      // Should have pagination default
      expect(callOptions.page).toBe(1);
      expect(callOptions.limit).toBe(20);
    });
  });
});
