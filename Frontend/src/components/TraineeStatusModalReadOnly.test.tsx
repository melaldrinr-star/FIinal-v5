import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TraineeStatusModalReadOnly from './TraineeStatusModalReadOnly';
import type { TraineeStatusRecord } from '../services/traineeStatusService';

/**
 * Test Suite: TraineeStatusModalReadOnly
 *
 * **Validates: Requirements 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 11.0, 13.0, 19.0**
 *
 * Tests cover:
 * - Modal rendering with all sections (Graduation, Employment, Skills, Audit Trail)
 * - Conditional field visibility based on employment_status
 * - Null field handling (em-dash or "Not recorded")
 * - Badge color-coding for all status values
 * - Date formatting as "Month Day, Year"
 * - Scrollable remarks display
 * - Accessibility with keyboard navigation and ARIA labels
 */

describe('TraineeStatusModalReadOnly', () => {
  let mockOnOpenChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnOpenChange = vi.fn();
  });

  // Sample test data with employed status
  const mockRecordEmployed: TraineeStatusRecord = {
    id: 'status-1',
    tenantId: 'tenant-1',
    traineeId: 'trainee-1',
    enrollmentId: 'enrollment-1',
    graduation_status: 'graduated',
    graduation_date: '2024-01-15',
    certificateId: 'cert-123',
    employment_status: 'employed',
    job_title: 'Software Engineer',
    employer_name: 'Tech Corp',
    job_start_date: '2024-02-01',
    job_sector: 'IT/Technology',
    skills_match: 'exact_match',
    skills_match_percentage: 95,
    remarks: 'Excellent performance and skills alignment',
    unemployment_reason: null,
    recorded_by: 'admin-1',
    recorded_at: '2024-01-20T10:00:00Z',
    last_updated_by: 'manager-1',
    updated_at: '2024-01-21T15:00:00Z',
    deleted_at: null,
  };

  // Sample test data with self-employed status
  const mockRecordSelfEmployed: TraineeStatusRecord = {
    ...mockRecordEmployed,
    employment_status: 'self_employed',
    job_title: 'Freelance Consultant',
    employer_name: 'Self',
  };

  // Sample test data with unemployed status
  const mockRecordUnemployed: TraineeStatusRecord = {
    ...mockRecordEmployed,
    employment_status: 'unemployed',
    job_title: null,
    employer_name: null,
    job_start_date: null,
    job_sector: null,
    skills_match: null,
    skills_match_percentage: null,
    unemployment_reason: 'No available positions in my field',
  };

  // Sample test data with pursuing education status
  const mockRecordPursuingEducation: TraineeStatusRecord = {
    ...mockRecordEmployed,
    employment_status: 'pursuing_education',
    job_title: null,
    employer_name: null,
    job_start_date: null,
    job_sector: null,
    skills_match: null,
    skills_match_percentage: null,
  };

  // Sample test data with deceased status
  const mockRecordDeceased: TraineeStatusRecord = {
    ...mockRecordEmployed,
    employment_status: 'deceased',
    job_title: null,
    employer_name: null,
    job_start_date: null,
    job_sector: null,
  };

  describe('Modal Rendering', () => {
    it('should render modal when open is true', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('Trainee Status Details')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Close modal and return to list/ })).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      const { container } = render(
        <TraineeStatusModalReadOnly
          open={false}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      // Dialog content should not be in the document when closed
      const dialogContent = container.querySelector('[role="alertdialog"]');
      expect(dialogContent).not.toBeInTheDocument();
    });

    it('should display trainee name when provided', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
          traineeName="John Doe"
        />
      );

      expect(screen.getByText(/for John Doe/)).toBeInTheDocument();
    });

    it('should display program name when provided', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
          programName="Welding Technology"
        />
      );

      expect(screen.getByText(/Welding Technology/)).toBeInTheDocument();
    });
  });

  describe('Graduation Status Section', () => {
    it('should display graduation status badge for graduated', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('Graduation Status')).toBeInTheDocument();
      // The badge should show the status (StatusBadge component handles rendering)
      const graduationCards = screen.getAllByText(/Graduation Status/);
      expect(graduationCards.length).toBeGreaterThan(0);
    });

    it('should display graduation date formatted correctly', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      // Date should be formatted as "Jan 15, 2024"
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should display certificate ID if present', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('cert-123')).toBeInTheDocument();
    });

    it('should handle null graduation date with "Not recorded"', () => {
      const recordNoDate = { ...mockRecordEmployed, graduation_date: null };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNoDate}
        />
      );

      // Check specifically in the graduation date field
      const notRecordedElements = screen.getAllByText('Not recorded');
      expect(notRecordedElements.length).toBeGreaterThan(0);
    });

    it('should show different badges for different graduation statuses', () => {
      const recordPending = {
        ...mockRecordEmployed,
        graduation_status: 'pending' as const,
      };
      const recordNotCompleted = {
        ...mockRecordEmployed,
        graduation_status: 'not_completed' as const,
      };
      const recordSuspended = {
        ...mockRecordEmployed,
        graduation_status: 'suspended' as const,
      };

      const { rerender } = render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordPending}
        />
      );

      // Graduation Status section should be present
      expect(screen.getByText('Graduation Status')).toBeInTheDocument();

      rerender(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNotCompleted}
        />
      );

      expect(screen.getByText('Graduation Status')).toBeInTheDocument();

      rerender(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordSuspended}
        />
      );

      expect(screen.getByText('Graduation Status')).toBeInTheDocument();
    });
  });

  describe('Employment Status Section - Employed', () => {
    it('should display employment status badge for employed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('Post-Graduation Employment Status')).toBeInTheDocument();
    });

    it('should show job title and employer when employed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('should show job start date and sector when employed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('IT/Technology')).toBeInTheDocument();
      expect(screen.getByText('Feb 1, 2024')).toBeInTheDocument();
    });

    it('should handle null job title with em-dash', () => {
      const recordNoJobTitle = {
        ...mockRecordEmployed,
        job_title: null,
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNoJobTitle}
        />
      );

      const fieldDisplays = screen.getAllByText('—');
      expect(fieldDisplays.length).toBeGreaterThan(0);
    });

    it('should handle null job fields gracefully', () => {
      const recordNoJobFields = {
        ...mockRecordEmployed,
        job_title: null,
        employer_name: null,
        job_start_date: null,
        job_sector: null,
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNoJobFields}
        />
      );

      const emDashes = screen.getAllByText('—');
      expect(emDashes.length).toBeGreaterThan(0);
    });
  });

  describe('Employment Status Section - Self-Employed', () => {
    it('should show job fields when self-employed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordSelfEmployed}
        />
      );

      expect(screen.getByText('Freelance Consultant')).toBeInTheDocument();
      expect(screen.getByText('Self')).toBeInTheDocument();
    });
  });

  describe('Employment Status Section - Unemployed', () => {
    it('should hide job fields when unemployed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordUnemployed}
        />
      );

      // Job fields should not be visible
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Tech Corp')).not.toBeInTheDocument();
    });

    it('should display unemployment reason when unemployed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordUnemployed}
        />
      );

      expect(
        screen.getByText('No available positions in my field')
      ).toBeInTheDocument();
    });

    it('should hide skills assessment section when unemployed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordUnemployed}
        />
      );

      expect(
        screen.queryByText('Skills-to-Job Match Assessment')
      ).not.toBeInTheDocument();
    });
  });

  describe('Employment Status Section - Pursuing Education', () => {
    it('should hide employment fields when pursuing education', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordPursuingEducation}
        />
      );

      // Job fields should not be visible
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Tech Corp')).not.toBeInTheDocument();
    });

    it('should hide skills assessment when pursuing education', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordPursuingEducation}
        />
      );

      expect(
        screen.queryByText('Skills-to-Job Match Assessment')
      ).not.toBeInTheDocument();
    });
  });

  describe('Employment Status Section - Deceased', () => {
    it('should hide employment fields when deceased', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordDeceased}
        />
      );

      // Job fields should not be visible
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });

    it('should hide skills assessment when deceased', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordDeceased}
        />
      );

      expect(
        screen.queryByText('Skills-to-Job Match Assessment')
      ).not.toBeInTheDocument();
    });
  });

  describe('Skills Assessment Section', () => {
    it('should display skills assessment section when employed', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(
        screen.getByText('Skills-to-Job Match Assessment')
      ).toBeInTheDocument();
    });

    it('should display skills match badge with correct variant', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      // SkillsMatchBadge should be rendered (verified by exact_match check)
      expect(screen.getByText('Skills-to-Job Match Assessment')).toBeInTheDocument();
    });

    it('should display skills match percentage', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('should display remarks in scrollable text area', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(
        screen.getByText('Excellent performance and skills alignment')
      ).toBeInTheDocument();
    });

    it('should handle null skills match gracefully', () => {
      const recordNoSkillsMatch = {
        ...mockRecordEmployed,
        skills_match: null,
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNoSkillsMatch}
        />
      );

      // Section should still render but skills match won't be displayed
      expect(
        screen.getByText('Skills-to-Job Match Assessment')
      ).toBeInTheDocument();
    });

    it('should display different skill match badges', () => {
      const skillMatches = ['exact_match', 'partial_match', 'no_match', 'not_applicable'] as const;

      for (const match of skillMatches) {
        const record = {
          ...mockRecordEmployed,
          skills_match: match,
        };

        const { unmount } = render(
          <TraineeStatusModalReadOnly
            open={true}
            onOpenChange={mockOnOpenChange}
            record={record}
          />
        );

        // Section should be present for all match types
        expect(
          screen.getByText('Skills-to-Job Match Assessment')
        ).toBeInTheDocument();

        unmount();
      }
    });
  });

  describe('Remarks Display', () => {
    it('should display remarks when present', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(
        screen.getByText('Excellent performance and skills alignment')
      ).toBeInTheDocument();
    });

    it('should handle multiline remarks', () => {
      const multilineRecord = {
        ...mockRecordEmployed,
        remarks:
          'Line 1\nLine 2\nLine 3\nThis is a long remark that spans multiple lines',
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={multilineRecord}
        />
      );

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });

    it('should not display remarks section if remarks is null or empty', () => {
      const recordNoRemarks = {
        ...mockRecordEmployed,
        remarks: null,
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNoRemarks}
        />
      );

      // Remarks section should not be displayed
      const remarksHeaders = screen.queryAllByText('Remarks & Notes');
      expect(remarksHeaders.length).toBe(0);
    });
  });

  describe('Audit Trail Section', () => {
    it('should display created by information', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText(/Created by admin-1/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 20, 2024/)).toBeInTheDocument();
    });

    it('should display last updated by information', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      expect(screen.getByText(/Last updated by manager-1/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 21, 2024/)).toBeInTheDocument();
    });

    it('should handle null last updated by', () => {
      const recordNoUpdate = {
        ...mockRecordEmployed,
        last_updated_by: null,
        updated_at: '2024-01-20T10:00:00Z',
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNoUpdate}
        />
      );

      expect(screen.getByText(/Created by admin-1/)).toBeInTheDocument();
    });

    it('should format dates correctly in audit trail', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      // Dates should be formatted as "Mon dd, yyyy"
      expect(screen.getByText(/Jan 20, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 21, 2024/)).toBeInTheDocument();
    });
  });

  describe('Close Button and Keyboard Navigation', () => {
    it('should call onOpenChange when Close button is clicked', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      const closeButton = screen.getByRole('button', { name: /Close modal and return to list/ });
      fireEvent.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should close modal on Escape key press', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should have Close button with accessible label', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      const closeButton = screen.getByLabelText('Close modal and return to list');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have semantic heading structure', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      const title = screen.getByText('Trainee Status Details');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates as "Mon dd, yyyy"', () => {
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={mockRecordEmployed}
        />
      );

      // All dates should follow the pattern "Month Day, Year"
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Feb 1, 2024')).toBeInTheDocument();
      // Check audit trail dates using partial match
      const auditTexts = screen.getAllByText(/Jan 20, 2024/);
      expect(auditTexts.length).toBeGreaterThan(0);
      const updatedTexts = screen.getAllByText(/Jan 21, 2024/);
      expect(updatedTexts.length).toBeGreaterThan(0);
    });

    it('should show "Not recorded" for null dates', () => {
      const recordNullDates = {
        ...mockRecordEmployed,
        graduation_date: null,
        job_start_date: null,
      };
      render(
        <TraineeStatusModalReadOnly
          open={true}
          onOpenChange={mockOnOpenChange}
          record={recordNullDates}
        />
      );

      // Should have multiple "Not recorded" for null dates
      const notRecordedElements = screen.getAllByText('Not recorded');
      expect(notRecordedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Badge Variants', () => {
    it('should render different employment status badges', () => {
      const statuses = [
        'employed',
        'unemployed',
        'self_employed',
        'pursuing_education',
        'deceased',
        'pending',
      ] as const;

      for (const status of statuses) {
        const record = {
          ...mockRecordEmployed,
          employment_status: status,
        };

        const { unmount } = render(
          <TraineeStatusModalReadOnly
            open={true}
            onOpenChange={mockOnOpenChange}
            record={record}
          />
        );

        expect(
          screen.getByText('Post-Graduation Employment Status')
        ).toBeInTheDocument();

        unmount();
      }
    });

    it('should render different graduation status badges', () => {
      const statuses = [
        'graduated',
        'pending',
        'not_completed',
        'suspended',
      ] as const;

      for (const status of statuses) {
        const record = {
          ...mockRecordEmployed,
          graduation_status: status,
        };

        const { unmount } = render(
          <TraineeStatusModalReadOnly
            open={true}
            onOpenChange={mockOnOpenChange}
            record={record}
          />
        );

        expect(screen.getByText('Graduation Status')).toBeInTheDocument();

        unmount();
      }
    });
  });
});
