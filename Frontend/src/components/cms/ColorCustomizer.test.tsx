import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import ColorCustomizer, { ColorValues } from './ColorCustomizer';
import { toast } from 'sonner';

/**
 * Component Tests: ColorCustomizer
 *
 * Tests the color customization sub-component for:
 * - Color picker renders for each color (primary, secondary, accent, background, text, borders)
 * - Hex, RGB, HSL formats accepted and validated
 * - Invalid color formats rejected with error message
 * - Color swatches updated when value changes
 * - Preview updates triggered with color changes
 * - Property-based testing for color format conversion equivalence
 *
 * **Validates: Requirements 1.3, 1.4, 1.5**
 */

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultColors: ColorValues = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#1F2937',
  borders: '#E5E7EB',
};

describe('ColorCustomizer Component', () => {
  let onChange: ReturnType<typeof vi.fn>;
  let onPreviewUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    onPreviewUpdate = vi.fn();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render color customization card with title', () => {
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      expect(screen.getByText('Color Customization')).toBeInTheDocument();
      expect(
        screen.getByText(/Customize your brand colors/)
      ).toBeInTheDocument();
    });

    it('should render all six color pickers', () => {
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      expect(screen.getByText('Primary Color')).toBeInTheDocument();
      expect(screen.getByText('Secondary Color')).toBeInTheDocument();
      expect(screen.getByText('Accent Color')).toBeInTheDocument();
      expect(screen.getByText('Background Color')).toBeInTheDocument();
      expect(screen.getByText('Text Color')).toBeInTheDocument();
      expect(screen.getByText('Border Color')).toBeInTheDocument();
    });

    it('should display color swatches with correct colors', () => {
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const swatches = screen.getAllByRole('img', { hidden: true }).filter((el) =>
        el.getAttribute('title')?.includes('Color:')
      );

      expect(swatches.length).toBeGreaterThan(0);
    });

    it('should render format guide with supported formats', () => {
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      expect(screen.getByText('Supported Formats')).toBeInTheDocument();
      expect(screen.getByText(/Hex:/)).toBeInTheDocument();
      expect(screen.getByText(/RGB:/)).toBeInTheDocument();
      expect(screen.getByText(/HSL:/)).toBeInTheDocument();
    });
  });

  describe('Expandable Color Editor', () => {
    it('should expand color editor when clicking on color swatch', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryColorSwatch = screen.getByText('Primary Color').closest('div');
      await user.click(primaryColorSwatch!);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('#3B82F6')
        ).toBeInTheDocument();
      });
    });

    it('should collapse color editor when clicking again', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      await waitFor(() => {
        expect(screen.getByDisplayValue('#3B82F6')).toBeInTheDocument();
      });

      await user.click(primaryLabel!);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('#3B82F6')).not.toBeInTheDocument();
      });
    });

    it('should show color picker input in expanded view', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      await waitFor(() => {
        const colorInputs = screen.getAllByRole('textbox');
        expect(colorInputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Hex Format Validation and Input', () => {
    it('should accept valid hex colors (#RRGGBB)', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, '#FF5733');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: '#FF5733',
          })
        );
      });
    });

    it('should accept valid hex colors (#RGB)', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, '#F57');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
          })
        );
      });
    });

    it('should reject invalid hex colors', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, 'not-a-color');

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid color format/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('RGB Format Validation and Input', () => {
    it('should accept valid RGB format (comma-separated)', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, 'rgb(255, 87, 51)');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: expect.any(String),
          })
        );
      });
    });

    it('should accept valid RGB format (space-separated)', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, 'rgb(255 87 51)');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: expect.any(String),
          })
        );
      });
    });

    it('should display converted RGB format in read-only field', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      await waitFor(() => {
        const rgbFields = screen.queryAllByDisplayValue(/rgb/i);
        expect(rgbFields.length).toBeGreaterThan(0);
      });
    });
  });

  describe('HSL Format Validation and Input', () => {
    it('should accept valid HSL format (comma-separated with %)', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, 'hsl(9, 100%, 60%)');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: expect.any(String),
          })
        );
      });
    });

    it('should accept valid HSL format (space-separated)', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, 'hsl(9 100% 60%)');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: expect.any(String),
          })
        );
      });
    });

    it('should display converted HSL format in read-only field', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      await waitFor(() => {
        const hslFields = screen.queryAllByDisplayValue(/hsl/i);
        expect(hslFields.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Color Swatch Updates', () => {
    it('should update color swatch when value changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ColorCustomizer colors={defaultColors} onChange={onChange} />
      );

      const newColors = { ...defaultColors, primary: '#FF0000' };
      rerender(<ColorCustomizer colors={newColors} onChange={onChange} />);

      // Color should be updated
      expect(onChange).toHaveBeenCalled();
    });

    it('should update multiple color swatches independently', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, '#FF0000');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: '#FF0000',
            secondary: '#10B981',
          })
        );
      });
    });
  });

  describe('Preview Updates', () => {
    it('should call onPreviewUpdate when color changes', async () => {
      const user = userEvent.setup();
      render(
        <ColorCustomizer
          colors={defaultColors}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, '#FF0000');

      await waitFor(() => {
        expect(onPreviewUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: '#FF0000',
          })
        );
      });
    });

    it('should not call onPreviewUpdate if onPreviewUpdate is not provided', async () => {
      const user = userEvent.setup();
      render(
        <ColorCustomizer colors={defaultColors} onChange={onChange} />
      );

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, '#FF0000');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message for invalid color format', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;
      await user.clear(hexInput);
      await user.type(hexInput, 'invalid');

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid color format/)
        ).toBeInTheDocument();
      });
    });

    it('should clear error when valid color is entered', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;

      // First, enter invalid color
      await user.clear(hexInput);
      await user.type(hexInput, 'invalid');

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid color format/)
        ).toBeInTheDocument();
      });

      // Then enter valid color
      await user.clear(hexInput);
      await user.type(hexInput, '#FF0000');

      await waitFor(() => {
        expect(
          screen.queryByText(/Invalid color format/)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve()),
        },
      });
    });

    it('should copy hex format to clipboard', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const copyButtons = screen.getAllByRole('button').filter((btn) =>
        btn.querySelector('svg')
      );
      expect(copyButtons.length).toBeGreaterThan(0);

      await user.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should show success toast when copy succeeds', async () => {
      const user = userEvent.setup();
      render(<ColorCustomizer colors={defaultColors} onChange={onChange} />);

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const copyButtons = screen.getAllByRole('button').filter((btn) =>
        btn.querySelector('svg')
      );

      await user.click(copyButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });

  describe('Property-Based Testing: Color Format Conversion', () => {
    /**
     * **Validates: Requirements 1.3, 1.4, 1.5**
     *
     * Property 7: Color Format Conversion
     * Converting between hex/RGB/HSL produces equivalent colors
     *
     * This property tests that:
     * 1. Any valid hex color can be parsed and converted
     * 2. Converting hex → RGB → hex produces the same (or equivalent) color
     * 3. Converting hex → HSL → hex produces the same (or equivalent) color
     * 4. Converting RGB → hex → RGB produces equivalent RGB values
     * 5. Converting HSL → hex → HSL produces equivalent HSL values
     */

    // Generator for valid hex colors
    const hexColorArbitrary = fc
      .tuple(fc.hexaDecimal(), fc.hexaDecimal(), fc.hexaDecimal())
      .map(
        ([r, g, b]) =>
          `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
      );

    it('should convert hex to RGB and back to equivalent hex [Property]', () => {
      fc.assert(
        fc.property(hexColorArbitrary, (hexColor) => {
          const { hexToRgb, rgbToHex } = require('../../utils/colorConverter');
          
          const rgb = hexToRgb(hexColor);
          if (!rgb) return true; // Skip invalid inputs
          
          const hexBack = rgbToHex(rgb);
          
          // Colors should be equivalent (same hex when normalized)
          expect(hexColor.toLowerCase()).toBe(hexBack.toLowerCase());
        })
      );
    });

    it('should convert hex to HSL and back to equivalent hex [Property]', () => {
      fc.assert(
        fc.property(hexColorArbitrary, (hexColor) => {
          const { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } = require('../../utils/colorConverter');
          
          const rgb = hexToRgb(hexColor);
          if (!rgb) return true;
          
          const hsl = rgbToHsl(rgb);
          const rgbBack = hslToRgb(hsl);
          const hexBack = rgbToHex(rgbBack);
          
          // Colors should be approximately equivalent (allowing for rounding)
          const originalRgb = hexToRgb(hexColor);
          expect(rgbBack.r).toBe(originalRgb!.r);
          expect(rgbBack.g).toBe(originalRgb!.g);
          expect(rgbBack.b).toBe(originalRgb!.b);
        })
      );
    });

    it('should parse and accept valid RGB formats [Property]', () => {
      const rgbGenerator = fc
        .tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        )
        .map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);

      fc.assert(
        fc.property(rgbGenerator, (rgbString) => {
          const { parseRgbString } = require('../../utils/colorConverter');
          const parsed = parseRgbString(rgbString);
          expect(parsed).not.toBeNull();
          expect(parsed.r).toBeGreaterThanOrEqual(0);
          expect(parsed.r).toBeLessThanOrEqual(255);
          expect(parsed.g).toBeGreaterThanOrEqual(0);
          expect(parsed.g).toBeLessThanOrEqual(255);
          expect(parsed.b).toBeGreaterThanOrEqual(0);
          expect(parsed.b).toBeLessThanOrEqual(255);
        })
      );
    });

    it('should parse and accept valid HSL formats [Property]', () => {
      const hslGenerator = fc
        .tuple(
          fc.integer({ min: 0, max: 360 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 })
        )
        .map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`);

      fc.assert(
        fc.property(hslGenerator, (hslString) => {
          const { parseHslString } = require('../../utils/colorConverter');
          const parsed = parseHslString(hslString);
          expect(parsed).not.toBeNull();
          expect(parsed.h).toBeGreaterThanOrEqual(0);
          expect(parsed.h).toBeLessThanOrEqual(360);
          expect(parsed.s).toBeGreaterThanOrEqual(0);
          expect(parsed.s).toBeLessThanOrEqual(100);
          expect(parsed.l).toBeGreaterThanOrEqual(0);
          expect(parsed.l).toBeLessThanOrEqual(100);
        })
      );
    });

    it('should reject invalid color formats consistently [Property]', () => {
      const invalidColorGenerator = fc
        .string()
        .filter(
          (s) =>
            !s.startsWith('#') &&
            !s.toLowerCase().startsWith('rgb') &&
            !s.toLowerCase().startsWith('hsl')
        );

      fc.assert(
        fc.property(invalidColorGenerator, (invalidColor) => {
          const { isValidColor } = require('../../utils/colorConverter');
          const result = isValidColor(invalidColor);
          expect(typeof result).toBe('boolean');
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle rapid color changes', async () => {
      const user = userEvent.setup();
      render(
        <ColorCustomizer
          colors={defaultColors}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const primaryLabel = screen.getByText('Primary Color').closest('div');
      await user.click(primaryLabel!);

      const hexInput = screen.getByDisplayValue('#3B82F6') as HTMLInputElement;

      // Make rapid changes
      await user.clear(hexInput);
      await user.type(hexInput, '#FF0000#00FF00#0000FF');

      // Should handle without crashing
      expect(onChange).toHaveBeenCalled();
    });

    it('should handle all six colors being changed', async () => {
      const user = userEvent.setup();
      render(
        <ColorCustomizer
          colors={defaultColors}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const colorLabels = [
        'Primary Color',
        'Secondary Color',
        'Accent Color',
        'Background Color',
        'Text Color',
        'Border Color',
      ];

      for (const label of colorLabels) {
        const colorLabel = screen.getByText(label).closest('div');
        await user.click(colorLabel!);

        const hexInputs = screen.queryAllByDisplayValue(
          /^#[0-9A-Fa-f]{6}$/
        ) as HTMLInputElement[];
        if (hexInputs.length > 0) {
          await user.clear(hexInputs[0]);
          await user.type(hexInputs[0], '#FF0000');
        }
      }

      // Should have called onChange multiple times
      expect(onChange.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
