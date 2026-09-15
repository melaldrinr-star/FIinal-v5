import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConnectionStatusIndicator from '../ConnectionStatusIndicator';
import { ConnectionStatus } from '../../services/enrollmentService';

/**
 * Test suite for ConnectionStatusIndicator component
 *
 * **Validates: Requirements 6.5, 13.2**
 *
 * Tests verify that the component correctly displays:
 * - Visual indicators for different connection states
 * - Appropriate icons and text for each state
 * - Accessibility attributes (ARIA labels, roles)
 * - Responsive sizing options
 * - Optional label display
 * - Tooltip/title attributes for state information
 */
describe('ConnectionStatusIndicator', () => {
  /**
   * Test: Connected state displays correct styling and icon
   */
  describe('Connected State', () => {
    it('should display connected state with green styling', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={true}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('bg-green-50');
      expect(container).toHaveClass('border-green-200');
      // Text color is applied to children (icon and label), verify they have correct color
      const label = screen.getByText('Connected');
      expect(label).toHaveClass('text-green-700');
    });

    it('should display "Connected" label in connected state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={true}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should have correct ARIA label for connected state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute(
        'aria-label',
        'WebSocket connected - real-time updates enabled'
      );
    });

    it('should have correct tooltip text for connected state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('title', 'Connected - Real-time updates active');
    });

    it('should not animate icon in connected state', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');
    });
  });

  /**
   * Test: Reconnecting state displays correct styling and icon
   */
  describe('Reconnecting State', () => {
    it('should display reconnecting state with amber styling', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={true}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('bg-amber-50');
      expect(container).toHaveClass('border-amber-200');
      // Text color is applied to children (icon and label)
      const label = screen.getByText('Reconnecting');
      expect(label).toHaveClass('text-amber-700');
    });

    it('should display "Reconnecting" label in reconnecting state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={true}
        />
      );

      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });

    it('should have correct ARIA label for reconnecting state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute(
        'aria-label',
        'WebSocket reconnecting - attempting to restore connection'
      );
    });

    it('should have correct tooltip text for reconnecting state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('title', 'Reconnecting - Please wait');
    });

    it('should animate icon in reconnecting state', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  /**
   * Test: Connecting state displays correct styling and icon
   */
  describe('Connecting State', () => {
    it('should display connecting state with blue styling', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connecting"
          showLabel={true}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('bg-blue-50');
      expect(container).toHaveClass('border-blue-200');
      // Text color is applied to children (icon and label)
      const label = screen.getByText('Connecting');
      expect(label).toHaveClass('text-blue-700');
    });

    it('should display "Connecting" label in connecting state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connecting"
          showLabel={true}
        />
      );

      expect(screen.getByText('Connecting')).toBeInTheDocument();
    });

    it('should have correct ARIA label for connecting state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connecting"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute(
        'aria-label',
        'WebSocket connecting - establishing connection'
      );
    });

    it('should have correct tooltip text for connecting state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connecting"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('title', 'Connecting - Please wait');
    });

    it('should animate icon in connecting state', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connecting"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  /**
   * Test: Disconnected state displays correct styling and icon
   */
  describe('Disconnected State', () => {
    it('should display disconnected state with gray styling', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="disconnected"
          showLabel={true}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('bg-gray-50');
      expect(container).toHaveClass('border-gray-200');
      // Text color is applied to children (icon and label)
      const label = screen.getByText('Offline');
      expect(label).toHaveClass('text-gray-600');
    });

    it('should display "Offline" label in disconnected state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="disconnected"
          showLabel={true}
        />
      );

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should have correct ARIA label for disconnected state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="disconnected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute(
        'aria-label',
        'WebSocket disconnected - using REST API fallback'
      );
    });

    it('should have correct tooltip text for disconnected state', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="disconnected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('title', 'Offline - Using fallback updates');
    });

    it('should not animate icon in disconnected state', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="disconnected"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');
    });
  });

  /**
   * Test: Size prop controls icon and text sizing
   */
  describe('Size Prop', () => {
    it('should use small icon size when size="sm"', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          size="sm"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('should use medium icon size when size="md"', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          size="md"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-5', 'w-5');
    });

    it('should use large icon size when size="lg"', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          size="lg"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('should use small text size when size="sm"', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          size="sm"
          showLabel={true}
        />
      );

      const label = screen.getByText('Connected');
      expect(label).toHaveClass('text-xs');
    });

    it('should use medium text size when size="md"', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          size="md"
          showLabel={true}
        />
      );

      const label = screen.getByText('Connected');
      expect(label).toHaveClass('text-sm');
    });

    it('should use large text size when size="lg"', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          size="lg"
          showLabel={true}
        />
      );

      const label = screen.getByText('Connected');
      expect(label).toHaveClass('text-base');
    });

    it('should default to size="sm" when size prop not provided', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  /**
   * Test: showLabel prop controls label visibility
   */
  describe('showLabel Prop', () => {
    it('should display label when showLabel=true', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={true}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should hide label when showLabel=false', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    it('should display label by default when showLabel not provided', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  /**
   * Test: className prop allows custom styling
   */
  describe('className Prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          className="custom-class"
        />
      );

      const statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('custom-class');
    });

    it('should combine default classes with custom className', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          className="custom-class"
        />
      );

      const statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('custom-class');
      expect(statusDiv).toHaveClass('inline-flex');
      expect(statusDiv).toHaveClass('bg-green-50');
    });
  });

  /**
   * Test: Accessibility features
   */
  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should have aria-live="polite" for live region updates', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label with descriptive text', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const container = screen.getByRole('status');
      expect(container.getAttribute('aria-label')).toBeTruthy();
    });

    it('should hide icon from screen readers with aria-hidden', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  /**
   * Test: State transitions (re-renders with different status)
   */
  describe('State Transitions', () => {
    it('should update styling when connectionStatus prop changes from connected to reconnecting', () => {
      const { rerender } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      let container = screen.getByRole('status');
      expect(container).toHaveClass('bg-green-50');

      rerender(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      container = screen.getByRole('status');
      expect(container).toHaveClass('bg-amber-50');
    });

    it('should update label when connectionStatus changes', () => {
      const { rerender } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={true}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();

      rerender(
        <ConnectionStatusIndicator
          connectionStatus="disconnected"
          showLabel={true}
        />
      );

      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should start animation when transitioning to reconnecting state', () => {
      const { container, rerender } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      let icon = container.querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');

      rerender(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      icon = container.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('should stop animation when transitioning from reconnecting to connected', () => {
      const { container, rerender } = render(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      let icon = container.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');

      rerender(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      icon = container.querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');
    });
  });

  /**
   * Test: Invalid or unknown status defaults to disconnected styling
   */
  describe('Unknown Status Handling', () => {
    it('should default to disconnected styling for unknown status', () => {
      render(
        <ConnectionStatusIndicator
          connectionStatus="unknown" as ConnectionStatus
          showLabel={true}
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('bg-gray-50');
      // Text color is applied to children (icon and label)
      const label = screen.getByText('Unknown');
      expect(label).toHaveClass('text-gray-600');
    });
  });

  /**
   * Test: Non-intrusive design characteristics
   */
  describe('Design Characteristics', () => {
    it('should use inline-flex for compact layout', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('inline-flex');
    });

    it('should have rounded borders for subtle appearance', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('rounded-md');
    });

    it('should use light background colors for non-intrusive appearance', () => {
      const { rerender, container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      let statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('bg-green-50');

      rerender(
        <ConnectionStatusIndicator
          connectionStatus="reconnecting"
          showLabel={false}
        />
      );

      statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('bg-amber-50');
    });

    it('should have border for definition without being intrusive', () => {
      const { container } = render(
        <ConnectionStatusIndicator
          connectionStatus="connected"
          showLabel={false}
        />
      );

      const statusDiv = container.firstChild;
      expect(statusDiv).toHaveClass('border');
      expect(statusDiv).toHaveClass('border-green-200');
    });
  });

  /**
   * Test: All status states consistency
   */
  describe('All Status States Coverage', () => {
    const statuses: ConnectionStatus[] = ['connecting', 'connected', 'disconnected', 'reconnecting'];

    statuses.forEach((status) => {
      it(`should render correctly for status: ${status}`, () => {
        render(
          <ConnectionStatusIndicator
            connectionStatus={status}
            showLabel={true}
            size="md"
          />
        );

        const container = screen.getByRole('status');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('inline-flex');
        expect(container).toHaveClass('items-center');
        expect(container).toHaveClass('gap-1.5');
      });
    });
  });
});
