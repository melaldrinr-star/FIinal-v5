import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import TypographyCustomizer, { TypographyValues } from './TypographyCustomizer';
import { toast } from 'sonner';

/**
 * Component Tests: TypographyCustomizer
 *
 * Tests the typography customization sub-component for:
 * - Font family dropdown renders with options
 * - Font size inputs validated as numbers
 * - Font weight values accepted
 * - Line height values accepted
 * - Preview updated with typography changes
 * - Property-based testing for typography consistency
 *
 * **Property 8: Typography Consistency** — Saved typography values match preview rendering
 * **Validates: Requirements 3.3, 3.4, 3.5**
 */

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultTypography: TypographyValues = {
  headings: {
    fontFamily: 'Poppins',
    fontSize: {
      h1: 48,
      h2: 36,
      h3: 28,
    },
    fontWeight: 700,
    lineHeight: 1.2,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
  },
};

describe('TypographyCustomizer Component', () => {
  let onChange: ReturnType<typeof vi.fn>;
  let onPreviewUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    onPreviewUpdate = vi.fn();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render typography customization card with title', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Typography Customization')).toBeInTheDocument();
      expect(
        screen.getByText(/Customize fonts, sizes, weights, and line heights/)
      ).toBeInTheDocument();
    });

    it('should render headings section with font family dropdown', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Headings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Poppins')).toBeInTheDocument();
    });

    it('should render body text section with font family dropdown', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Body Text')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Inter')).toBeInTheDocument();
    });

    it('should render font size inputs for h1, h2, h3', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByDisplayValue('48')).toBeInTheDocument(); // H1
      expect(screen.getByDisplayValue('36')).toBeInTheDocument(); // H2
      expect(screen.getByDisplayValue('28')).toBeInTheDocument(); // H3
    });

    it('should render font weight selector for headings', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const headingWeightInputs = screen.getAllByRole('combobox');
      expect(headingWeightInputs.length).toBeGreaterThanOrEqual(4); // Font families + weights
    });

    it('should render line height inputs for headings and body', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const lineHeightInputs = screen.getAllByDisplayValue((value) =>
        /^[0-9.]+$/.test(value.toString())
      );
      expect(lineHeightInputs.length).toBeGreaterThanOrEqual(2); // At least h lineHeight and body lineHeight
    });

    it('should render typography preview sections', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const previews = screen.getAllByText('Preview:');
      expect(previews.length).toBe(2); // Headings preview + body preview
    });
  });

  describe('Font Family Selection', () => {
    it('should handle heading font family change', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const fontFamilySelects = screen.getAllByRole('combobox');
      const headingFontSelect = fontFamilySelects[0];

      await user.click(headingFontSelect);
      const robotoOption = screen.getByRole('option', { name: /Roboto/ });
      await user.click(robotoOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          headings: expect.objectContaining({
            fontFamily: 'Roboto',
          }),
        })
      );
      expect(onPreviewUpdate).toHaveBeenCalled();
    });

    it('should handle body font family change', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const fontFamilySelects = screen.getAllByRole('combobox');
      const bodyFontSelect = fontFamilySelects[1]; // Second selector

      await user.click(bodyFontSelect);
      const ralewayOption = screen.getByRole('option', { name: /Raleway/ });
      await user.click(ralewayOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            fontFamily: 'Raleway',
          }),
        })
      );
    });
  });

  describe('Font Size Validation', () => {
    it('should accept valid font size values for headings', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const h1Input = screen.getByDisplayValue('48');
      await user.clear(h1Input);
      await user.type(h1Input, '56');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          headings: expect.objectContaining({
            fontSize: expect.objectContaining({
              h1: 56,
            }),
          }),
        })
      );
    });

    it('should reject font size below minimum (8px)', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const h1Input = screen.getByDisplayValue('48');
      await user.clear(h1Input);
      await user.type(h1Input, '5');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Font size must be between 8 and 200px')
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should reject font size above maximum (200px)', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const h1Input = screen.getByDisplayValue('48');
      await user.clear(h1Input);
      await user.type(h1Input, '250');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Font size must be between 8 and 200px')
      );
    });

    it('should handle empty font size input', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const h1Input = screen.getByDisplayValue('48');
      await user.clear(h1Input);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Invalid font size')).toBeInTheDocument();
      });
    });

    it('should accept valid body font size', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const bodyFontSizeInput = screen.getByDisplayValue('16');
      await user.clear(bodyFontSizeInput);
      await user.type(bodyFontSizeInput, '18');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            fontSize: 18,
          }),
        })
      );
    });
  });

  describe('Font Weight Selection', () => {
    it('should accept heading font weight values', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const weightSelects = screen.getAllByRole('combobox');
      // Find weight selector (typically second selector in headings section)
      const headingWeightSelect = weightSelects[2]; // After font family and possibly another

      await user.click(headingWeightSelect);
      const boldOption = screen.getByRole('option', { name: /800/ });
      await user.click(boldOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          headings: expect.objectContaining({
            fontWeight: 800,
          }),
        })
      );
    });

    it('should accept body font weight values', async () => {
      const user = userEvent.setup();
      const modifiedTypography = {
        ...defaultTypography,
        body: {
          ...defaultTypography.body,
          fontWeight: 400,
        },
      };

      render(
        <TypographyCustomizer
          typography={modifiedTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const weightSelects = screen.getAllByRole('combobox');
      const bodyWeightSelect = weightSelects[3]; // After headings selectors

      await user.click(bodyWeightSelect);
      const semiboldOption = screen.getByRole('option', { name: /600/ });
      await user.click(semiboldOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            fontWeight: 600,
          }),
        })
      );
    });
  });

  describe('Line Height Validation', () => {
    it('should accept valid line height values', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const lineHeightInputs = screen.getAllByDisplayValue((value) =>
        value.toString() === '1.2' || value.toString() === '1.5'
      );
      const headingLineHeightInput = lineHeightInputs[0];

      await user.clear(headingLineHeightInput);
      await user.type(headingLineHeightInput, '1.4');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          headings: expect.objectContaining({
            lineHeight: 1.4,
          }),
        })
      );
    });

    it('should reject line height below minimum (0.5)', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const lineHeightInputs = screen.getAllByDisplayValue((value) =>
        value.toString() === '1.2' || value.toString() === '1.5'
      );
      const headingLineHeightInput = lineHeightInputs[0];

      await user.clear(headingLineHeightInput);
      await user.type(headingLineHeightInput, '0.3');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Line height must be between 0.5 and 4')
      );
    });

    it('should reject line height above maximum (4)', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const lineHeightInputs = screen.getAllByDisplayValue((value) =>
        value.toString() === '1.2' || value.toString() === '1.5'
      );
      const bodyLineHeightInput = lineHeightInputs[1];

      await user.clear(bodyLineHeightInput);
      await user.type(bodyLineHeightInput, '5');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Line height must be between 0.5 and 4')
      );
    });

    it('should handle empty line height input', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const lineHeightInputs = screen.getAllByDisplayValue((value) =>
        value.toString() === '1.2' || value.toString() === '1.5'
      );
      const headingLineHeightInput = lineHeightInputs[0];

      await user.clear(headingLineHeightInput);

      await waitFor(() => {
        expect(screen.getByText('Line height must be between 0.5 and 4')).toBeInTheDocument();
      });
    });
  });

  describe('Preview Updates', () => {
    it('should display typography preview for headings', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const h1Preview = screen.getByText('The Quick Brown Fox');
      expect(h1Preview).toBeInTheDocument();
      expect(h1Preview).toHaveStyle({
        fontFamily: 'Poppins',
        fontSize: '48px',
        fontWeight: '700',
        lineHeight: '1.2',
      });
    });

    it('should display typography preview for body text', () => {
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const bodyPreview = screen.getByText(
        /This is a sample of your body text/
      );
      expect(bodyPreview).toBeInTheDocument();
      expect(bodyPreview).toHaveStyle({
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
      });
    });

    it('should call onPreviewUpdate when heading font size changes', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const h1Input = screen.getByDisplayValue('48');
      await user.clear(h1Input);
      await user.type(h1Input, '52');

      expect(onPreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          headings: expect.objectContaining({
            fontSize: expect.objectContaining({
              h1: 52,
            }),
          }),
        })
      );
    });

    it('should call onPreviewUpdate when body font changes', async () => {
      const user = userEvent.setup();
      render(
        <TypographyCustomizer
          typography={defaultTypography}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const bodyFontSizeInput = screen.getByDisplayValue('16');
      await user.clear(bodyFontSizeInput);
      await user.type(bodyFontSizeInput, '18');

      expect(onPreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            fontSize: 18,
          }),
        })
      );
    });
  });

  describe('Property 8: Typography Consistency', () => {
    /**
     * Property: Typography Consistency
     * Validates: Requirements 3.3, 3.4, 3.5
     *
     * For any valid typography configuration, the saved values should match
     * what is rendered in the preview.
     */
    it('Property 8: Should maintain typography consistency between saved values and preview rendering', () => {
      fc.assert(
        fc.property(
          fc.record({
            h1: fc.integer({ min: 8, max: 200 }),
            h2: fc.integer({ min: 8, max: 200 }),
            h3: fc.integer({ min: 8, max: 200 }),
            bodySize: fc.integer({ min: 8, max: 200 }),
            headingWeight: fc.oneof(
              fc.constant(100),
              fc.constant(400),
              fc.constant(700),
              fc.constant(900)
            ),
            bodyWeight: fc.oneof(
              fc.constant(100),
              fc.constant(400),
              fc.constant(700),
              fc.constant(900)
            ),
            headingLineHeight: fc.float({ min: 0.5, max: 4, noNaN: true }),
            bodyLineHeight: fc.float({ min: 0.5, max: 4, noNaN: true }),
          }),
          ({ h1, h2, h3, bodySize, headingWeight, bodyWeight, headingLineHeight, bodyLineHeight }) => {
            const typography: TypographyValues = {
              headings: {
                fontFamily: 'Poppins',
                fontSize: { h1, h2, h3 },
                fontWeight: headingWeight,
                lineHeight: headingLineHeight,
              },
              body: {
                fontFamily: 'Inter',
                fontSize: bodySize,
                fontWeight: bodyWeight,
                lineHeight: bodyLineHeight,
              },
            };

            const { unmount } = render(
              <TypographyCustomizer
                typography={typography}
                onChange={vi.fn()}
                onPreviewUpdate={vi.fn()}
              />
            );

            // Get preview elements
            const headingPreviews = screen.getAllByText('The Quick Brown Fox');
            const bodyPreview = screen.getByText(/This is a sample of your body text/);

            // Verify heading preview styles match saved values
            const h1Preview = headingPreviews[0];
            expect(h1Preview).toHaveStyle({
              fontSize: `${h1}px`,
              fontWeight: `${headingWeight}`,
              lineHeight: `${headingLineHeight}`,
            });

            // Verify body preview styles match saved values
            expect(bodyPreview).toHaveStyle({
              fontSize: `${bodySize}px`,
              fontWeight: `${bodyWeight}`,
              lineHeight: `${bodyLineHeight}`,
            });

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
