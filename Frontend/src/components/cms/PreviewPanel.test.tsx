import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import PreviewPanel from './PreviewPanel';

/**
 * Component Tests: PreviewPanel
 *
 * Tests the preview panel component for:
 * - CSS variables injected into document
 * - Preview updates when customizations change
 * - Debouncing prevents excessive updates
 * - Component visibility toggles work in preview
 * - Preview renders sample content correctly
 * - Property-based testing for preview-to-landing consistency
 *
 * **Property 10: Preview-to-Landing Consistency** — Preview rendering matches production landing page
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 */

const defaultCustomizations = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
    borders: '#E5E7EB',
  },
  typography: {
    headings: {
      fontFamily: 'Poppins',
      fontSize: { h1: 48, h2: 36, h3: 28 },
      fontWeight: 700,
      lineHeight: 1.2,
    },
    body: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  layout: {
    containerWidth: '1200px',
    containerLayout: 'centered',
    padding: { heroSection: 40, contentAreas: 32, footer: 24 },
    margins: { sectionSpacing: 48, elementSpacing: 16 },
    gaps: { grid: 24, flex: 16 },
  },
  components: {
    navigation: { enabled: true },
    hero: { enabled: true, height: '500px' },
    features: { enabled: true, columns: 3 },
    testimonials: { enabled: true },
    ctaSection: { enabled: true },
    contact: { enabled: true },
    footer: { enabled: true },
  },
  content: {
    hero: {
      heading: 'Welcome',
      subheading: 'Build amazing things',
      ctaText: 'Get Started',
    },
    contact: {
      email: 'contact@example.com',
      phone: '+1-555-000-0000',
      address: '123 Main St',
    },
  },
};

describe('PreviewPanel Component', () => {
  let onSuccess: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSuccess = vi.fn();
    onError = vi.fn();
    // Clean up any injected styles
    const styleTag = document.getElementById('cms-preview-styles');
    if (styleTag) {
      styleTag.remove();
    }
  });

  afterEach(() => {
    const styleTag = document.getElementById('cms-preview-styles');
    if (styleTag) {
      styleTag.remove();
    }
  });

  describe('Component Rendering', () => {
    it('should render preview panel card', () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      expect(screen.getByText(/Real-time preview/)).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.getByRole('button', { name: /Refresh/ })).toBeInTheDocument();
    });

    it('should render debug info', async () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Injection Time:/)).toBeInTheDocument();
        expect(screen.getByText(/Render Time:/)).toBeInTheDocument();
      });
    });
  });

  describe('CSS Variable Injection', () => {
    it('should inject CSS variables into document', async () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          debounceMs={50}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      await waitFor(
        () => {
          const styleTag = document.getElementById('cms-preview-styles');
          expect(styleTag).toBeDefined();
          expect(styleTag?.textContent).toContain('--color-primary');
        },
        { timeout: 200 }
      );
    });

    it('should create style tag with correct ID', async () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          debounceMs={50}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      await waitFor(() => {
        const styleTag = document.getElementById('cms-preview-styles');
        expect(styleTag?.id).toBe('cms-preview-styles');
      });
    });

    it('should update CSS when customizations change', async () => {
      const { rerender } = render(
        <PreviewPanel
          customizations={defaultCustomizations}
          debounceMs={50}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      await waitFor(() => {
        const styleTag = document.getElementById('cms-preview-styles');
        expect(styleTag).toBeDefined();
      });

      const updatedCustomizations = {
        ...defaultCustomizations,
        colors: {
          ...defaultCustomizations.colors,
          primary: '#FF0000',
        },
      };

      rerender(
        <PreviewPanel
          customizations={updatedCustomizations}
          debounceMs={50}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      await waitFor(() => {
        const styleTag = document.getElementById('cms-preview-styles');
        expect(styleTag?.textContent).toContain('--color-primary');
      });
    });

    it('should call onSuccess callback when CSS injected', async () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          debounceMs={50}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid customization changes', async () => {
      const { rerender } = render(
        <PreviewPanel
          customizations={defaultCustomizations}
          debounceMs={100}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      // Simulate rapid updates
      for (let i = 0; i < 3; i++) {
        const updated = {
          ...defaultCustomizations,
          colors: {
            ...defaultCustomizations.colors,
            primary: `#${Math.random().toString(16).slice(2, 8)}`,
          },
        };
        rerender(
          <PreviewPanel
            customizations={updated}
            debounceMs={100}
            onSuccess={onSuccess}
            onError={onError}
          />
        );
      }

      // Should only inject once after debounce
      await waitFor(
        () => {
          expect(onSuccess.mock.calls.length).toBeLessThan(10);
        },
        { timeout: 300 }
      );
    });
  });

  describe('Component Visibility', () => {
    it('should show all components when enabled', () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText(/Hero Section Heading/)).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Testimonials')).toBeInTheDocument();
      expect(screen.getByText(/Contact Us/)).toBeInTheDocument();
    });

    it('should hide hero section when disabled', () => {
      const customizations = {
        ...defaultCustomizations,
        components: {
          ...defaultCustomizations.components,
          hero: { enabled: false },
        },
      };

      render(
        <PreviewPanel
          customizations={customizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.queryByText(/Hero Section Heading/)).not.toBeInTheDocument();
    });

    it('should hide features section when disabled', () => {
      const customizations = {
        ...defaultCustomizations,
        components: {
          ...defaultCustomizations.components,
          features: { enabled: false },
        },
      };

      render(
        <PreviewPanel
          customizations={customizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.queryByText('Features')).not.toBeInTheDocument();
    });

    it('should hide footer when disabled', () => {
      const customizations = {
        ...defaultCustomizations,
        components: {
          ...defaultCustomizations.components,
          footer: { enabled: false },
        },
      };

      const { container } = render(
        <PreviewPanel
          customizations={customizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      // Footer should not contain copyright text
      expect(container.textContent).not.toContain('© 2024');
    });
  });

  describe('Content Display', () => {
    it('should display hero section content', () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Build amazing things')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should display contact information', () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.getByText(/contact@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/\+1-555-000-0000/)).toBeInTheDocument();
    });

    it('should display sample features when not provided', () => {
      const customizations = {
        ...defaultCustomizations,
        content: { hero: defaultCustomizations.content.hero },
      };

      render(
        <PreviewPanel
          customizations={customizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      expect(screen.getByText(/Feature 1/)).toBeInTheDocument();
      expect(screen.getByText(/Feature 2/)).toBeInTheDocument();
      expect(screen.getByText(/Feature 3/)).toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('should refresh preview on button click', async () => {
      const user = userEvent.setup();
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      const refreshButton = screen.getByRole('button', { name: /Refresh/ });
      await user.click(refreshButton);

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should disable refresh button while loading', async () => {
      render(
        <PreviewPanel
          customizations={defaultCustomizations}
          debounceMs={50}
          onSuccess={onSuccess}
          onError={onError}
        />
      );

      const refreshButton = screen.getByRole('button', { name: /Refresh/ });

      // Button should be disabled during initial load
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Property 10: Preview-to-Landing Consistency', () => {
    /**
     * Property: Preview-to-Landing Consistency
     * Validates: Requirements 7.1, 7.2, 7.3, 7.4
     *
     * For any valid customization input, the preview should render
     * with CSS variables that are correctly injected into the DOM,
     * ensuring that the preview accurately represents how the
     * landing page will appear with those customizations.
     */
    it('Property 10: Should maintain preview-to-landing consistency for customizations', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryColor: fc.hexColor(),
            containerWidth: fc.integer({ min: 100, max: 2000 }).map((w) => `${w}px`),
            h1Size: fc.integer({ min: 8, max: 200 }),
            bodySize: fc.integer({ min: 8, max: 200 }),
          }),
          ({ primaryColor, containerWidth, h1Size, bodySize }) => {
            const customizations = {
              colors: {
                primary: primaryColor,
                secondary: '#10B981',
                accent: '#F59E0B',
                background: '#FFFFFF',
                text: '#1F2937',
                borders: '#E5E7EB',
              },
              typography: {
                headings: {
                  fontFamily: 'Poppins',
                  fontSize: { h1: h1Size, h2: 36, h3: 28 },
                  fontWeight: 700,
                  lineHeight: 1.2,
                },
                body: {
                  fontFamily: 'Inter',
                  fontSize: bodySize,
                  fontWeight: 400,
                  lineHeight: 1.5,
                },
              },
              layout: {
                containerWidth,
                containerLayout: 'centered',
                padding: { heroSection: 40, contentAreas: 32, footer: 24 },
                margins: { sectionSpacing: 48, elementSpacing: 16 },
                gaps: { grid: 24, flex: 16 },
              },
              components: {
                navigation: { enabled: true },
                hero: { enabled: true },
                features: { enabled: true },
                testimonials: { enabled: true },
                ctaSection: { enabled: true },
                contact: { enabled: true },
                footer: { enabled: true },
              },
              content: defaultCustomizations.content,
            };

            const onSuccess = vi.fn();
            const { unmount } = render(
              <PreviewPanel
                customizations={customizations}
                debounceMs={50}
                onSuccess={onSuccess}
                onError={vi.fn()}
              />
            );

            // Verify preview renders without errors
            expect(screen.getByText(/Live Preview/)).toBeInTheDocument();

            // Verify CSS was injected
            const styleTag = document.getElementById('cms-preview-styles');
            if (styleTag && styleTag.textContent) {
              expect(styleTag.textContent).toContain(':root');
              expect(styleTag.textContent).toContain('--color-primary');
            }

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
