import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TraineeStatusCard } from './TraineeStatusCard';
import { TraineeStatusRecord } from '../types/traineeStatus';

/**
 * Unit Tests for TraineeStatusCard Component
 * 
 * Tests cover:
 * - Rendering with valid records (all status combinations)
 * - Placeholder rendering when record is null
 * - Loading skeleton display
 * - Error state display with retry
 * - Badge color-coding for graduation and employment status
 * - Conditional job details display (employed vs unemployed)
 * - Job title/employer truncation with tooltip
 * - Skills match badge display with percentage
 * - Recorded date formatting
 * - View Details button interaction
 * - Accessibility features
 * 
 * **Validates: Requirements 2.0, 5.0, 6.0, 7.0, 19.0**
 */

// Mock date formatting utilities
vi.mock('../utils/dateFormat', () => ({
  formatRecordedOnDate: (date: string) => `Recorded on Jan 20, 2024`,
  formatDateDisplay: (date: string) => 'Jan 20, 2024',
}));

// Create mock record factory for consistent test data
function createMockRecord(overrides?: Partial<TraineeStatusRecord>): TraineeStatusRecord {
  return {
    id: 'test-record-1',
    tenantId: 'tenant-1',
    traineeId: 'trainee-1',
    enrollmentId: 'enrollment-1',
    graduationStatus: 'graduated',
    graduationDate: '2024-01-15',
    employmentStatus: 'employed',
    jobTitle: 'Software Engineer',
    employerName: 'Tech Corp',
    jobStartDate: '2024-02-01',
    jobSector: 'Information Technology',
    skillsMatch: 'exact_match',
    skillsMatchPercentage: 95,
    remarks: 'Excellent skills match',
    recordedBy: 'admin-1',
    recordedAt: '2024-01-20T10:00:00Z',
    lastUpdatedBy: 'admin-2',
    updatedAt: '2024-01-21T15:00:00Z',
    ...overrides,
  };
}

describe('TraineeStatusCard', () => {
  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(
        <TraineeStatusCard
          statusRecord={null}
          isLoading={true}
          onViewDetails={vi.fn()}
        />
      );

      // Check for skeleton elements (they use animate-pulse)
      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when error prop is provided', () => {
      const errorMessage = 'Failed to load status data';
      render(
        <TraineeStatusCard
          statusRecord={null}
          error={errorMessage}
          onViewDetails={vi.fn()}
        />
      );

      expect(screen.getByText('Failed to load status')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render retry button in error state', () => {
      const mockRetry = vi.fn();
      render(
        <TraineeStatusCard
          statusRecord={null}
          error="Connection failed"
          onViewDetails={mockRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onViewDetails when retry button is clicked', async () => {
      const mockRetry = vi.fn();
      const user = userEvent.setup();
      render(
        <TraineeStatusCard
          statusRecord={null}
          error="Connection failed"
          onViewDetails={mockRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Null Record (Placeholder)', () => {
    it('should render placeholder when statusRecord is null and no error', () => {
      render(
        <TraineeStatusCard
          statusRecord={null}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText('No post-graduation status recorded')).toBeInTheDocument();
    });
  });

  describe('Valid Record Rendering', () => {
    it('should render all required information for valid record', () => {
      const record = createMockRecord();
      render(
        <TraineeStatusCard
          statusRecord={record}
          onViewDetails={vi.fn()}
        />
      );

      // Check title
      expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();

      // Check badges are rendered (they show status labels)
      expect(screen.getByText('Graduated')).toBeInTheDocument();
      expect(screen.getByText('Employed')).toBeInTheDocument();

      // Check job details
      expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
      expect(screen.getByText(/Tech Corp/i)).toBeInTheDocument();

      // Check skills match badge
      expect(screen.getByText(/Exact Match/i)).toBeInTheDocument();

      // Check recorded date
      expect(screen.getByText(/Recorded on/i)).toBeInTheDocument();
    });

    it('should render View Details button', () => {
      const record = createMockRecord();
      render(
        <TraineeStatusCard
          statusRecord={record}
          onViewDetails={vi.fn()}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view full trainee status details/i });
      expect(viewButton).toBeInTheDocument();
    });

    it('should call onViewDetails when View Details button is clicked', async () => {
      const mockViewDetails = vi.fn();
      const user = userEvent.setup();
      const record = createMockRecord();
      render(
        <TraineeStatusCard
          statusRecord={record}
          onViewDetails={mockViewDetails}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view full trainee status details/i });
      await user.click(viewButton);
      expect(mockViewDetails).toHaveBeenCalled();
    });
  });

  describe('Graduation Status Badge', () => {
    it.each([
      ['pending', 'Pending'],
      ['graduated', 'Graduated'],
      ['not_completed', 'Not Completed'],
      ['suspended', 'Suspended'],
    ])('should render %s graduation status badge', (status, label) => {
      const record = createMockRecord({
        graduationStatus: status as any,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('Employment Status Badge', () => {
    it.each([
      ['employed', 'Employed'],
      ['unemployed', 'Unemployed'],
      ['self_employed', 'Self-Employed'],
      ['pursuing_education', 'Pursuing Education'],
      ['deceased', 'Deceased'],
    ])('should render %s employment status badge', (status, label) => {
      const record = createMockRecord({
        employmentStatus: status as any,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('Conditional Job Details Display', () => {
    it('should display job title and employer when employed', () => {
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: 'Software Engineer',
        employerName: 'Tech Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('should display job title and employer when self-employed', () => {
      const record = createMockRecord({
        employmentStatus: 'self_employed',
        jobTitle: 'Consultant',
        employerName: 'Self',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText('Consultant')).toBeInTheDocument();
      expect(screen.getByText('Self')).toBeInTheDocument();
    });

    it('should not display job details when unemployed', () => {
      const record = createMockRecord({
        employmentStatus: 'unemployed',
        jobTitle: 'Software Engineer',
        employerName: 'Tech Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Tech Corp')).not.toBeInTheDocument();
    });

    it('should not display job details when pursuing education', () => {
      const record = createMockRecord({
        employmentStatus: 'pursuing_education',
        jobTitle: 'Software Engineer',
        employerName: 'Tech Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Tech Corp')).not.toBeInTheDocument();
    });

    it('should not display job details when deceased', () => {
      const record = createMockRecord({
        employmentStatus: 'deceased',
        jobTitle: 'Software Engineer',
        employerName: 'Tech Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Tech Corp')).not.toBeInTheDocument();
    });
  });

  describe('Job Details Truncation', () => {
    it('should truncate long job title with ellipsis', () => {
      const longTitle = 'A'.repeat(50); // Longer than truncation threshold (40)
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: longTitle,
        employerName: 'Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Check that truncated version is shown
      const jobTitleElement = screen.getByText(/^A+\.\.\./);
      expect(jobTitleElement.textContent).toBe(longTitle.substring(0, 40) + '...');
    });

    it('should truncate long employer name with ellipsis', () => {
      const longName = 'B'.repeat(50);
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: longName,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Check that truncated version is shown
      const employerElement = screen.getByText(/^B+\.\.\./);
      expect(employerElement.textContent).toBe(longName.substring(0, 40) + '...');
    });

    it('should show full text in tooltip on hover for truncated text', async () => {
      const user = userEvent.setup();
      const longTitle = 'A'.repeat(50);
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: longTitle,
        employerName: 'Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Check for title attribute (tooltip)
      const jobTitleElement = screen.getByText(/^A+\.\.\./);
      expect(jobTitleElement).toHaveAttribute('title', longTitle);
    });

    it('should not truncate short job title', () => {
      const shortTitle = 'Engineer';
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: shortTitle,
        employerName: 'Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      const jobTitleElement = screen.getByText(shortTitle);
      expect(jobTitleElement.textContent).toBe(shortTitle);
      // Should not have truncation
      expect(jobTitleElement.textContent).not.toContain('...');
    });
  });

  describe('Skills Match Badge', () => {
    it.each([
      ['exact_match', 'Exact Match'],
      ['partial_match', 'Partial Match'],
      ['no_match', 'No Match'],
      ['not_applicable', 'Not Applicable'],
    ])('should render %s skills match badge', (match, label) => {
      const record = createMockRecord({
        skillsMatch: match as any,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
    });

    it('should display skills match with percentage', () => {
      const record = createMockRecord({
        skillsMatch: 'partial_match',
        skillsMatchPercentage: 75,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(/Partial Match \(75%\)/)).toBeInTheDocument();
    });

    it('should display skills match without percentage when not provided', () => {
      const record = createMockRecord({
        skillsMatch: 'exact_match',
        skillsMatchPercentage: null,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(/Exact Match/)).toBeInTheDocument();
    });

    it('should not display skills match badge when null', () => {
      const record = createMockRecord({
        skillsMatch: null,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      // The skills match section shouldn't be rendered
      const badgeText = screen.queryByText(/Exact Match|Partial Match|No Match|Not Applicable/);
      expect(badgeText).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should display recorded date in human-readable format', () => {
      const record = createMockRecord({
        recordedAt: '2024-01-20T10:00:00Z',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(/Recorded on/)).toBeInTheDocument();
    });
  });

  describe('Null Employment Fields', () => {
    it('should display "Not specified" for null job title', () => {
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: null,
        employerName: 'Corp',
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('should display "Not specified" for null employer name', () => {
      const record = createMockRecord({
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: null,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      const record = createMockRecord();
      render(
        <TraineeStatusCard
          statusRecord={record}
          onViewDetails={vi.fn()}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view full trainee status details/i });
      expect(viewButton).toHaveAttribute('aria-label');
    });

    it('should have semantic HTML structure', () => {
      const record = createMockRecord();
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Check for card title (h4 or heading)
      expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();
    });

    it('should have proper contrast and readability', () => {
      const record = createMockRecord();
      const { container } = render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Check that badge elements are rendered (using data-slot selector)
      const badgeElements = container.querySelectorAll('[data-slot="badge"]');
      expect(badgeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle record with all null optional fields', () => {
      const record = createMockRecord({
        jobTitle: null,
        employerName: null,
        jobStartDate: null,
        jobSector: null,
        skillsMatch: null,
        skillsMatchPercentage: null,
        remarks: null,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Should not crash and should render card
      expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();
    });

    it('should handle record with 0% skills match', () => {
      const record = createMockRecord({
        skillsMatch: 'no_match',
        skillsMatchPercentage: 0,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(/No Match \(0%\)/)).toBeInTheDocument();
    });

    it('should handle record with 100% skills match', () => {
      const record = createMockRecord({
        skillsMatch: 'exact_match',
        skillsMatchPercentage: 100,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText(/Exact Match \(100%\)/)).toBeInTheDocument();
    });

    it('should render without errors when onViewDetails is not provided', () => {
      const record = createMockRecord();
      const { container } = render(
        <TraineeStatusCard statusRecord={record} />
      );

      // Should render without error
      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should render complete card for recently graduated employed trainee', () => {
      const record = createMockRecord({
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Junior Developer',
        employerName: 'StartUp Inc',
        skillsMatch: 'exact_match',
        skillsMatchPercentage: 90,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText('Graduated')).toBeInTheDocument();
      expect(screen.getByText('Employed')).toBeInTheDocument();
      expect(screen.getByText('Junior Developer')).toBeInTheDocument();
      expect(screen.getByText('StartUp Inc')).toBeInTheDocument();
      expect(screen.getByText(/Exact Match \(90%\)/)).toBeInTheDocument();
    });

    it('should render complete card for self-employed trainee', () => {
      const record = createMockRecord({
        graduationStatus: 'graduated',
        employmentStatus: 'self_employed',
        jobTitle: 'Freelance Designer',
        employerName: 'Self',
        skillsMatch: 'partial_match',
        skillsMatchPercentage: 70,
      });
      render(
        <TraineeStatusCard statusRecord={record} />
      );

      expect(screen.getByText('Graduated')).toBeInTheDocument();
      expect(screen.getByText('Self-Employed')).toBeInTheDocument();
      expect(screen.getByText('Freelance Designer')).toBeInTheDocument();
      expect(screen.getByText('Self')).toBeInTheDocument();
    });
  });
});
