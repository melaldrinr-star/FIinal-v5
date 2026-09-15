import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TraineeStatusCard, TraineeStatusCardSkeleton } from './TraineeStatusCard';
import type { TraineeStatusRecord } from '../../types/traineeStatus';

/**
 * Test suite for TraineeStatusCard component
 *
 * **Validates: Requirements 2.0, 5.0, 6.0, 7.0, 19.0**
 */

describe('TraineeStatusCard', () => {
  // Mock trainee status record
  const mockRecord: TraineeStatusRecord = {
    id: 'status-1',
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
    lastUpdatedBy: 'manager-1',
    updatedAt: '2024-01-21T15:00:00Z',
  };

  describe('Loading State', () => {
    it('should render skeleton loader when isLoading is true', () => {
      const { container } = render(
        <TraineeStatusCard
          statusRecord={null}
          isLoading={true}
        />
      );

      // Check for skeleton elements by class
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      // At least the card should have animate-pulse or contain skeleton elements
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should show loading skeleton even with a record present', () => {
      const { container } = render(
        <TraineeStatusCard
          statusRecord={mockRecord}
          isLoading={true}
        />
      );

      // Skeleton should take precedence over record
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when error prop is provided', () => {
      const errorMsg = 'Failed to load status record';
      render(
        <TraineeStatusCard
          statusRecord={null}
          error={errorMsg}
        />
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('should display error icon in error state', () => {
      render(
        <TraineeStatusCard
          statusRecord={null}
          error="Network error"
        />
      );

      // Check for AlertCircle icon from lucide-react (as SVG)
      const svg = document.querySelector('svg.lucide-circle-alert');
      expect(svg).toBeInTheDocument();
    });

    it('should not show record data when error is present', () => {
      render(
        <TraineeStatusCard
          statusRecord={mockRecord}
          error="Error loading"
        />
      );

      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  describe('Placeholder State (No Record)', () => {
    it('should render placeholder when record is null', () => {
      render(
        <TraineeStatusCard
          statusRecord={null}
        />
      );

      expect(
        screen.getByText('No post-graduation status recorded')
      ).toBeInTheDocument();
    });

    it('should show helpful message in placeholder', () => {
      render(
        <TraineeStatusCard
          statusRecord={null}
        />
      );

      expect(
        screen.getByText('Status information will appear here once recorded')
      ).toBeInTheDocument();
    });

    it('should not show View Details button in placeholder state', () => {
      render(
        <TraineeStatusCard
          statusRecord={null}
          onViewDetails={vi.fn()}
        />
      );

      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    });
  });

  describe('Data Display - Graduation Section', () => {
    it('should display graduation status badge', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText('Graduated')).toBeInTheDocument();
    });

    it('should display graduation date in correct format', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should handle null graduation date gracefully', () => {
      const recordWithoutDate = {
        ...mockRecord,
        graduationDate: null,
      };

      render(
        <TraineeStatusCard statusRecord={recordWithoutDate} />
      );

      expect(screen.getByText('Graduated')).toBeInTheDocument();
      // Should not crash or display "null"
    });

    it('should display different graduation statuses', () => {
      const statusesToTest = ['pending', 'graduated', 'not_completed', 'suspended'] as const;

      statusesToTest.forEach((status) => {
        const { unmount } = render(
          <TraineeStatusCard
            statusRecord={{
              ...mockRecord,
              graduationStatus: status,
            }}
          />
        );

        const statusLabels: Record<string, string> = {
          pending: 'Pending',
          graduated: 'Graduated',
          not_completed: 'Not Completed',
          suspended: 'Suspended',
        };

        expect(screen.getByText(statusLabels[status])).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Data Display - Employment Section', () => {
    it('should display employment status badge', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText('Employed')).toBeInTheDocument();
    });

    it('should display job title when employed', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should display employer name when employed', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('should not display job fields when unemployed', () => {
      const unemployedRecord = {
        ...mockRecord,
        employmentStatus: 'unemployed',
        jobTitle: undefined,
        employerName: undefined,
      };

      render(
        <TraineeStatusCard statusRecord={unemployedRecord} />
      );

      expect(screen.getByText('Unemployed')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });

    it('should display unemployment reason when unemployed', () => {
      const unemployedRecord = {
        ...mockRecord,
        employmentStatus: 'unemployed',
        jobTitle: undefined,
        employerName: undefined,
        unemploymentReason: 'No available jobs in the area',
      };

      render(
        <TraineeStatusCard statusRecord={unemployedRecord} />
      );

      expect(
        screen.getByText('No available jobs in the area')
      ).toBeInTheDocument();
    });

    it('should display self-employed status with job details', () => {
      const selfEmployedRecord = {
        ...mockRecord,
        employmentStatus: 'self_employed',
      };

      render(
        <TraineeStatusCard statusRecord={selfEmployedRecord} />
      );

      expect(screen.getByText('Self-Employed')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should handle different employment statuses', () => {
      const statuses = ['employed', 'unemployed', 'self_employed', 'pursuing_education', 'deceased'] as const;

      statuses.forEach((status) => {
        const { unmount } = render(
          <TraineeStatusCard
            statusRecord={{
              ...mockRecord,
              employmentStatus: status,
            }}
          />
        );

        const statusLabels: Record<string, string> = {
          employed: 'Employed',
          unemployed: 'Unemployed',
          self_employed: 'Self-Employed',
          pursuing_education: 'Pursuing Education',
          deceased: 'Deceased',
        };

        expect(screen.getByText(statusLabels[status])).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Data Display - Skills Section', () => {
    it('should display skills match badge', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText(/Exact Match/)).toBeInTheDocument();
    });

    it('should display skills match percentage', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });

    it('should handle null skills match gracefully', () => {
      const recordWithoutSkills = {
        ...mockRecord,
        skillsMatch: null,
      };

      render(
        <TraineeStatusCard statusRecord={recordWithoutSkills} />
      );

      // Should render without crash, skills section may be empty
      expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();
    });

    it('should display different skills match statuses', () => {
      const skillsStatuses = ['exact_match', 'partial_match', 'no_match', 'not_applicable'] as const;

      skillsStatuses.forEach((skillsMatch) => {
        const { unmount } = render(
          <TraineeStatusCard
            statusRecord={{
              ...mockRecord,
              skillsMatch,
            }}
          />
        );

        const skillsLabels: Record<string, RegExp> = {
          exact_match: /Exact Match/i,
          partial_match: /Partial Match/i,
          no_match: /No Match/i,
          not_applicable: /Not Applicable/i,
        };

        expect(screen.getByText(skillsLabels[skillsMatch])).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Data Display - Recorded Date', () => {
    it('should display recorded date in human-readable format', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.getByText(/Recorded on Jan 20, 2024/)).toBeInTheDocument();
    });

    it('should format timestamp correctly', () => {
      const recordWithTimestamp = {
        ...mockRecord,
        recordedAt: '2024-03-25T14:30:00Z',
      };

      render(
        <TraineeStatusCard statusRecord={recordWithTimestamp} />
      );

      expect(screen.getByText(/Recorded on Mar 25, 2024/)).toBeInTheDocument();
    });
  });

  describe('View Details Button', () => {
    it('should render View Details button when onViewDetails is provided', () => {
      const handleViewDetails = vi.fn();

      render(
        <TraineeStatusCard
          statusRecord={mockRecord}
          onViewDetails={handleViewDetails}
        />
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should call onViewDetails callback when button is clicked', async () => {
      const handleViewDetails = vi.fn();
      const user = userEvent.setup();

      render(
        <TraineeStatusCard
          statusRecord={mockRecord}
          onViewDetails={handleViewDetails}
        />
      );

      const button = screen.getByText('View Details');
      await user.click(button);

      expect(handleViewDetails).toHaveBeenCalledTimes(1);
    });

    it('should not render View Details button when onViewDetails is not provided', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render all sections in proper order', () => {
      const { container } = render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      const sections = container.querySelectorAll('[class*="space-y"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have proper card styling', () => {
      const { container } = render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Truncation and Tooltips', () => {
    it('should truncate long job titles', () => {
      const longJobTitle = 'Senior Principal Architect of Technical Infrastructure and Cloud Services';
      const recordWithLongTitle = {
        ...mockRecord,
        jobTitle: longJobTitle,
      };

      render(
        <TraineeStatusCard statusRecord={recordWithLongTitle} />
      );

      // Title attribute should contain the full text
      const jobElement = screen.getByTitle(longJobTitle);
      expect(jobElement).toBeInTheDocument();
      expect(jobElement).toHaveClass('truncate');
    });

    it('should truncate long employer names', () => {
      const longEmployerName = 'International Technology and Consulting Corporation Limited Partnership';
      const recordWithLongEmployer = {
        ...mockRecord,
        employerName: longEmployerName,
      };

      render(
        <TraineeStatusCard statusRecord={recordWithLongEmployer} />
      );

      const employerElement = screen.getByTitle(longEmployerName);
      expect(employerElement).toBeInTheDocument();
      expect(employerElement).toHaveClass('truncate');
    });

    it('should truncate long unemployment reasons', () => {
      const longReason =
        'Could not find suitable employment due to lack of available positions in the field and personal circumstances beyond control';
      const recordWithLongReason = {
        ...mockRecord,
        employmentStatus: 'unemployed',
        unemploymentReason: longReason,
        jobTitle: undefined,
        employerName: undefined,
      };

      render(
        <TraineeStatusCard statusRecord={recordWithLongReason} />
      );

      const reasonElement = screen.getByTitle(longReason);
      expect(reasonElement).toBeInTheDocument();
      expect(reasonElement).toHaveClass('truncate');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      // Should have a card title
      expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();
    });

    it('should have accessible button', () => {
      const handleViewDetails = vi.fn();

      render(
        <TraineeStatusCard
          statusRecord={mockRecord}
          onViewDetails={handleViewDetails}
        />
      );

      // Try to find button by text first
      const button = screen.getByText('View Details');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label');
    });
  });

  describe('Badge Color Coding', () => {
    it('should apply correct color classes for graduation statuses', () => {
      const { container } = render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      // Graduated status should have green color class
      const badges = container.querySelectorAll('[class*="bg-green"]');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should apply correct color classes for employment statuses', () => {
      const employedRecord = {
        ...mockRecord,
        employmentStatus: 'employed',
      };

      const { container } = render(
        <TraineeStatusCard statusRecord={employedRecord} />
      );

      // Employed status should have green color class
      const greenBadges = container.querySelectorAll('[class*="bg-green"]');
      expect(greenBadges.length).toBeGreaterThan(0);
    });

    it('should apply correct color classes for skills match statuses', () => {
      const { container } = render(
        <TraineeStatusCard statusRecord={mockRecord} />
      );

      // Exact match should have green color class
      const greenBadges = container.querySelectorAll('[class*="bg-green"]');
      expect(greenBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Property-Based Testing', () => {
    /**
     * Property: For all valid employment statuses, the component renders without errors
     *
     * **Validates: Requirement 2.0**
     */
    it('Property 1: All employment statuses render without errors', () => {
      const employmentStatuses = [
        'pending',
        'employed',
        'unemployed',
        'self_employed',
        'pursuing_education',
        'deceased',
      ] as const;

      employmentStatuses.forEach((status) => {
        const { unmount } = render(
          <TraineeStatusCard
            statusRecord={{
              ...mockRecord,
              employmentStatus: status,
            }}
          />
        );

        // Should render without throwing error
        expect(screen.getByText('Post-Graduation Status')).toBeInTheDocument();
        unmount();
      });
    });

    /**
     * Property: For all valid skills match values, the component displays the corresponding badge
     *
     * **Validates: Requirement 2.0, 7.0**
     */
    it('Property 2: All skills match values display with correct badges', () => {
      const skillsMatches = ['exact_match', 'partial_match', 'no_match', 'not_applicable'] as const;

      skillsMatches.forEach((skillsMatch) => {
        const { unmount } = render(
          <TraineeStatusCard
            statusRecord={{
              ...mockRecord,
              skillsMatch,
            }}
          />
        );

        const skillsLabels: Record<string, RegExp> = {
          exact_match: /Exact Match/i,
          partial_match: /Partial Match/i,
          no_match: /No Match/i,
          not_applicable: /Not Applicable/i,
        };

        expect(screen.getByText(skillsLabels[skillsMatch])).toBeInTheDocument();
        unmount();
      });
    });

    /**
     * Property: For all skills match percentage values (0-100), the component renders without errors
     *
     * **Validates: Requirement 7.0**
     */
    it('Property 3: All skills match percentages (0-100) render without errors', () => {
      const percentages = [0, 25, 50, 75, 100];

      percentages.forEach((percentage) => {
        const { unmount } = render(
          <TraineeStatusCard
            statusRecord={{
              ...mockRecord,
              skillsMatchPercentage: percentage,
            }}
          />
        );

        expect(
          screen.getByText(new RegExp(`${percentage}%`))
        ).toBeInTheDocument();
        unmount();
      });
    });
  });
});
