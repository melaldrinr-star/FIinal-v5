import { render, screen } from '@testing-library/react';
import {
  StatusBadge,
  GraduationStatusBadge,
  EmploymentStatusBadge,
  SkillsMatchBadge,
  type GraduationStatusValue,
  type EmploymentStatusValue,
  type SkillsMatchValue,
} from './StatusBadge';

/**
 * StatusBadge Component Test Suite
 * 
 * Tests for the StatusBadge component which displays color-coded status badges
 * for graduation status, employment status, and skills match.
 * 
 * Requirement: 2.0, 5.0, 6.0, 7.0
 */

describe('StatusBadge', () => {
  describe('Graduation Status Variants', () => {
    it('renders pending graduation status with correct styling', () => {
      render(<StatusBadge variant="pending" type="graduation" />);
      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('renders graduated status with correct styling (green)', () => {
      render(<StatusBadge variant="graduated" type="graduation" />);
      const badge = screen.getByText('Graduated');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders not_completed status with correct styling (red)', () => {
      render(<StatusBadge variant="not_completed" type="graduation" />);
      const badge = screen.getByText('Not Completed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('renders suspended status with correct styling (orange)', () => {
      render(<StatusBadge variant="suspended" type="graduation" />);
      const badge = screen.getByText('Suspended');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-700');
    });

    it('displays all graduation status values without errors', () => {
      const statuses: GraduationStatusValue[] = [
        'pending',
        'graduated',
        'not_completed',
        'suspended',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(
          <StatusBadge variant={status} type="graduation" />
        );
        expect(screen.getByText(/Pending|Graduated|Not Completed|Suspended/))
          .toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Employment Status Variants', () => {
    it('renders employed status with correct styling (green)', () => {
      render(<StatusBadge variant="employed" type="employment" />);
      const badge = screen.getByText('Employed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders unemployed status with correct styling (gray)', () => {
      render(<StatusBadge variant="unemployed" type="employment" />);
      const badge = screen.getByText('Unemployed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('renders self_employed status with correct styling (green)', () => {
      render(<StatusBadge variant="self_employed" type="employment" />);
      const badge = screen.getByText('Self-Employed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders pursuing_education status with correct styling (yellow)', () => {
      render(
        <StatusBadge variant="pursuing_education" type="employment" />
      );
      const badge = screen.getByText('Pursuing Education');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('renders deceased status with correct styling (slate)', () => {
      render(<StatusBadge variant="deceased" type="employment" />);
      const badge = screen.getByText('Deceased');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-slate-100', 'text-slate-700');
    });

    it('displays all employment status values without errors', () => {
      const statuses: EmploymentStatusValue[] = [
        'pending',
        'employed',
        'unemployed',
        'self_employed',
        'pursuing_education',
        'deceased',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(
          <StatusBadge variant={status} type="employment" />
        );
        expect(
          screen.getByText(
            /Pending|Employed|Unemployed|Self-Employed|Pursuing Education|Deceased/
          )
        ).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Skills Match Variants', () => {
    it('renders exact_match status with correct styling and icon', () => {
      render(<StatusBadge variant="exact_match" type="skills" />);
      const badge = screen.getByText('Exact Match', { exact: false });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
      expect(badge).toHaveTextContent('✓');
    });

    it('renders partial_match status with correct styling and icon', () => {
      render(<StatusBadge variant="partial_match" type="skills" />);
      const badge = screen.getByText('Partial Match', { exact: false });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
      expect(badge).toHaveTextContent('◐');
    });

    it('renders no_match status with correct styling and icon', () => {
      render(<StatusBadge variant="no_match" type="skills" />);
      const badge = screen.getByText('No Match', { exact: false });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
      expect(badge).toHaveTextContent('✗');
    });

    it('renders not_applicable status with correct styling and icon', () => {
      render(<StatusBadge variant="not_applicable" type="skills" />);
      const badge = screen.getByText('Not Applicable', { exact: false });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
      expect(badge).toHaveTextContent('—');
    });

    it('displays skills match with percentage', () => {
      render(
        <StatusBadge
          variant="partial_match"
          type="skills"
          percentage={65}
        />
      );
      const badge = screen.getByText('Partial Match (65%)');
      expect(badge).toBeInTheDocument();
    });

    it('displays all skills match values without errors', () => {
      const statuses: SkillsMatchValue[] = [
        'exact_match',
        'partial_match',
        'no_match',
        'not_applicable',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(
          <StatusBadge variant={status} type="skills" />
        );
        expect(
          screen.getByText(/Exact Match|Partial Match|No Match|Not Applicable/, {
            exact: false,
          })
        ).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Custom Label and Content', () => {
    it('uses custom label when provided', () => {
      render(
        <StatusBadge
          variant="employed"
          type="employment"
          label="Custom Label"
        />
      );
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('displays custom children instead of default label', () => {
      render(
        <StatusBadge variant="employed" type="employment">
          Custom Children
        </StatusBadge>
      );
      expect(screen.getByText('Custom Children')).toBeInTheDocument();
    });
  });

  describe('Percentage Display for Skills Match', () => {
    it('displays percentage when provided with skills match', () => {
      const { container } = render(
        <StatusBadge
          variant="exact_match"
          type="skills"
          percentage={95}
        />
      );
      expect(container).toHaveTextContent('95%');
    });

    it('displays percentage as 0 when provided', () => {
      const { container } = render(
        <StatusBadge
          variant="no_match"
          type="skills"
          percentage={0}
        />
      );
      expect(container).toHaveTextContent('0%');
    });

    it('displays percentage as 100 when provided', () => {
      const { container } = render(
        <StatusBadge
          variant="exact_match"
          type="skills"
          percentage={100}
        />
      );
      expect(container).toHaveTextContent('100%');
    });

    it('handles null percentage gracefully', () => {
      render(
        <StatusBadge
          variant="partial_match"
          type="skills"
          percentage={null}
        />
      );
      const badge = screen.getByText('Partial Match');
      expect(badge).toBeInTheDocument();
      expect(badge).not.toHaveTextContent('%');
    });
  });

  describe('Custom CSS Classes', () => {
    it('applies custom className to badge', () => {
      const { container } = render(
        <StatusBadge
          variant="employed"
          type="employment"
          className="custom-class"
        />
      );
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Dark Mode Compatibility', () => {
    it('includes dark mode classes in badge', () => {
      const { container } = render(
        <StatusBadge variant="employed" type="employment" />
      );
      const badge = container.firstChild;
      const className = badge?.className || '';
      expect(className).toMatch(/dark:/);
    });
  });
});

describe('GraduationStatusBadge Helper', () => {
  it('renders graduation status badge without type parameter', () => {
    render(<GraduationStatusBadge status="graduated" />);
    expect(screen.getByText('Graduated')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <GraduationStatusBadge status="pending" className="custom-class" />
    );
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });
});

describe('EmploymentStatusBadge Helper', () => {
  it('renders employment status badge without type parameter', () => {
    render(<EmploymentStatusBadge status="employed" />);
    expect(screen.getByText('Employed')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmploymentStatusBadge status="unemployed" className="custom-class" />
    );
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });
});

describe('SkillsMatchBadge Helper', () => {
  it('renders skills match badge with percentage', () => {
    render(
      <SkillsMatchBadge match="partial_match" percentage={65} />
    );
    expect(screen.getByText('Partial Match (65%)')).toBeInTheDocument();
  });

  it('renders skills match badge without percentage', () => {
    render(<SkillsMatchBadge match="exact_match" />);
    expect(screen.getByText('Exact Match')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SkillsMatchBadge match="no_match" className="custom-class" />
    );
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });
});

describe('Badge Icons', () => {
  it('displays checkmark icon for exact_match', () => {
    const { container } = render(
      <StatusBadge variant="exact_match" type="skills" />
    );
    expect(container).toHaveTextContent('✓');
  });

  it('displays partial icon for partial_match', () => {
    const { container } = render(
      <StatusBadge variant="partial_match" type="skills" />
    );
    expect(container).toHaveTextContent('◐');
  });

  it('displays mismatch icon for no_match', () => {
    const { container } = render(
      <StatusBadge variant="no_match" type="skills" />
    );
    expect(container).toHaveTextContent('✗');
  });

  it('displays em dash icon for not_applicable', () => {
    const { container } = render(
      <StatusBadge variant="not_applicable" type="skills" />
    );
    expect(container).toHaveTextContent('—');
  });
});
