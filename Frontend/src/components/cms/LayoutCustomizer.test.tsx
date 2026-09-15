import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import LayoutCustomizer, { LayoutValues } from './LayoutCustomizer';
import { toast } from 'sonner';

/**
 * Component Tests: LayoutCustomizer
 *
 * Tests the layout customization sub-component for:
 * - Container width input validated
 * - Layout selector works
 * - Padding values accepted
 * - Margin values accepted
 * - Gap values accepted
 * - Preview updates with layout changes
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const defaultLayout: LayoutValues = {
  containerWidth: '1200px',
  containerLayout: 'centered',
  padding: {
    heroSection: 40,
    contentAreas: 32,
    footer: 24,
  },
  margins: {
    sectionSpacing: 48,
    elementSpacing: 16,
  },
  gaps: {
    grid: 24,
    flex: 16,
  },
};

describe('LayoutCustomizer Component', () => {
  let onChange: ReturnType<typeof vi.fn>;
  let onPreviewUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    onPreviewUpdate = vi.fn();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render layout customization card with title', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      expect(screen.getByText('Layout & Spacing Customization')).toBeInTheDocument();
      expect(
        screen.getByText(/Configure container layout, widths, padding, margins, and gaps/)
      ).toBeInTheDocument();
    });

    it('should render container width input', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      expect(screen.getByDisplayValue('1200px')).toBeInTheDocument();
    });

    it('should render container layout selector', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      expect(screen.getByDisplayValue('centered')).toBeInTheDocument();
    });

    it('should render padding inputs for hero, content, and footer', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      expect(screen.getByDisplayValue('40')).toBeInTheDocument(); // Hero padding
      expect(screen.getByDisplayValue('32')).toBeInTheDocument(); // Content padding
      expect(screen.getByDisplayValue('24')).toBeInTheDocument(); // Footer padding
    });

    it('should render margin inputs for section and element spacing', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      expect(screen.getByDisplayValue('48')).toBeInTheDocument(); // Section spacing
      expect(screen.getByDisplayValue('16')).toBeInTheDocument(); // Element spacing
    });

    it('should render gap inputs for grid and flex', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const gapInputs = screen.getAllByDisplayValue((value) =>
        ['24', '16'].includes(value.toString())
      );
      expect(gapInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should render preview sections', () => {
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const previews = screen.getAllByText('Preview:');
      expect(previews.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Container Width Validation', () => {
    it('should accept valid pixel-based container width', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const widthInput = screen.getByDisplayValue('1200px');
      await user.clear(widthInput);
      await user.type(widthInput, '1400px');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          containerWidth: '1400px',
        })
      );
    });

    it('should accept valid percentage-based container width', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const widthInput = screen.getByDisplayValue('1200px');
      await user.clear(widthInput);
      await user.type(widthInput, '90%');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          containerWidth: '90%',
        })
      );
    });

    it('should reject container width below minimum', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const widthInput = screen.getByDisplayValue('1200px');
      await user.clear(widthInput);
      await user.type(widthInput, '50px');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Container width must be')
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should reject invalid container width format', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const widthInput = screen.getByDisplayValue('1200px');
      await user.clear(widthInput);
      await user.type(widthInput, 'invalid');

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Layout Type Selection', () => {
    it('should handle full-width layout selection', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const layoutSelect = screen.getByDisplayValue('centered');
      await user.click(layoutSelect);
      const fullWidthOption = screen.getByRole('option', { name: /Full Width/ });
      await user.click(fullWidthOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          containerLayout: 'full-width',
        })
      );
    });

    it('should handle sidebar layout selection', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const layoutSelect = screen.getByDisplayValue('centered');
      await user.click(layoutSelect);
      const sidebarOption = screen.getByRole('option', { name: /Sidebar/ });
      await user.click(sidebarOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          containerLayout: 'sidebar',
        })
      );
    });
  });

  describe('Padding Validation', () => {
    it('should accept valid hero section padding', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const heroPaddingInputs = screen.getAllByDisplayValue('40');
      const heroPaddingInput = heroPaddingInputs[0];
      await user.clear(heroPaddingInput);
      await user.type(heroPaddingInput, '50');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          padding: expect.objectContaining({
            heroSection: 50,
          }),
        })
      );
    });

    it('should reject padding above maximum', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const heroPaddingInputs = screen.getAllByDisplayValue('40');
      const heroPaddingInput = heroPaddingInputs[0];
      await user.clear(heroPaddingInput);
      await user.type(heroPaddingInput, '250');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Padding must be between 0 and 200px')
      );
    });

    it('should accept zero padding', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const heroPaddingInputs = screen.getAllByDisplayValue('40');
      const heroPaddingInput = heroPaddingInputs[0];
      await user.clear(heroPaddingInput);
      await user.type(heroPaddingInput, '0');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          padding: expect.objectContaining({
            heroSection: 0,
          }),
        })
      );
    });
  });

  describe('Margin Validation', () => {
    it('should accept valid section spacing margin', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const marginInputs = screen.getAllByDisplayValue('48');
      const sectionSpacingInput = marginInputs[0];
      await user.clear(sectionSpacingInput);
      await user.type(sectionSpacingInput, '64');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          margins: expect.objectContaining({
            sectionSpacing: 64,
          }),
        })
      );
    });

    it('should reject margin above maximum', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const marginInputs = screen.getAllByDisplayValue('48');
      const sectionSpacingInput = marginInputs[0];
      await user.clear(sectionSpacingInput);
      await user.type(sectionSpacingInput, '400');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Margin must be between 0 and 300px')
      );
    });
  });

  describe('Gap Validation', () => {
    it('should accept valid grid gap', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const gapInputs = screen.getAllByDisplayValue((value) =>
        ['24', '16'].includes(value.toString())
      );
      const gridGapInput = gapInputs[0];
      await user.clear(gridGapInput);
      await user.type(gridGapInput, '32');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          gaps: expect.objectContaining({
            grid: 32,
          }),
        })
      );
    });

    it('should reject gap above maximum', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const gapInputs = screen.getAllByDisplayValue((value) =>
        ['24', '16'].includes(value.toString())
      );
      const gridGapInput = gapInputs[0];
      await user.clear(gridGapInput);
      await user.type(gridGapInput, '150');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Gap must be between 0 and 100px')
      );
    });
  });

  describe('Preview Updates', () => {
    it('should call onPreviewUpdate when container width changes', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const widthInput = screen.getByDisplayValue('1200px');
      await user.clear(widthInput);
      await user.type(widthInput, '1400px');

      expect(onPreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          containerWidth: '1400px',
        })
      );
    });

    it('should call onPreviewUpdate when padding changes', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const heroPaddingInputs = screen.getAllByDisplayValue('40');
      const heroPaddingInput = heroPaddingInputs[0];
      await user.clear(heroPaddingInput);
      await user.type(heroPaddingInput, '50');

      expect(onPreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          padding: expect.objectContaining({
            heroSection: 50,
          }),
        })
      );
    });

    it('should call onPreviewUpdate when gap changes', async () => {
      const user = userEvent.setup();
      render(
        <LayoutCustomizer layout={defaultLayout} onChange={onChange} onPreviewUpdate={onPreviewUpdate} />
      );

      const gapInputs = screen.getAllByDisplayValue((value) =>
        ['24', '16'].includes(value.toString())
      );
      const gridGapInput = gapInputs[0];
      await user.clear(gridGapInput);
      await user.type(gridGapInput, '32');

      expect(onPreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          gaps: expect.objectContaining({
            grid: 32,
          }),
        })
      );
    });
  });

  describe('Property-Based Testing', () => {
    it('should handle valid numeric spacing values across ranges', () => {
      fc.assert(
        fc.property(
          fc.record({
            heroSpacing: fc.integer({ min: 0, max: 200 }),
            contentSpacing: fc.integer({ min: 0, max: 200 }),
            footerSpacing: fc.integer({ min: 0, max: 200 }),
            sectionMargin: fc.integer({ min: 0, max: 300 }),
            elementMargin: fc.integer({ min: 0, max: 300 }),
            gridGap: fc.integer({ min: 0, max: 100 }),
            flexGap: fc.integer({ min: 0, max: 100 }),
          }),
          (values) => {
            const layout: LayoutValues = {
              containerWidth: '1200px',
              containerLayout: 'centered',
              padding: {
                heroSection: values.heroSpacing,
                contentAreas: values.contentSpacing,
                footer: values.footerSpacing,
              },
              margins: {
                sectionSpacing: values.sectionMargin,
                elementSpacing: values.elementMargin,
              },
              gaps: {
                grid: values.gridGap,
                flex: values.flexGap,
              },
            };

            const onChange = vi.fn();
            const { unmount } = render(
              <LayoutCustomizer layout={layout} onChange={onChange} onPreviewUpdate={vi.fn()} />
            );

            // Verify all inputs render with correct values
            expect(screen.getByDisplayValue(values.heroSpacing.toString())).toBeInTheDocument();
            expect(screen.getByDisplayValue(values.gridGap.toString())).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
