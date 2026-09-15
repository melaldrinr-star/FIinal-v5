import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseColorToRGB,
  hslToRgb,
  convertCustomizationsToCSSVariables,
  generateCSSString,
  isValidCSSVariable,
  mergeCSSVariables,
  getCSSVariableValue,
} from './cssVariableConverter';

/**
 * Unit Tests: CSS Variable Conversion Utility
 *
 * Tests the CSS variable converter for:
 * - Color values converted to valid CSS
 * - Typography values converted to valid CSS
 * - Spacing values converted to valid CSS
 * - Nested structures handled correctly
 * - Property-based testing for CSS conversion correctness
 *
 * **Property 11: CSS Conversion Correctness** — CSS custom properties generated are valid and parseable
 * **Validates: Requirements 9.2, 9.3**
 */

describe('CSS Variable Converter Utility', () => {
  describe('parseColorToRGB', () => {
    it('should parse hex color #RRGGBB format', () => {
      const result = parseColorToRGB('#FF5733');
      expect(result).toBe('255, 87, 51');
    });

    it('should parse hex color #RGB format (short)', () => {
      const result = parseColorToRGB('#F00');
      expect(result).toBe('255, 0, 0');
    });

    it('should parse rgb format', () => {
      const result = parseColorToRGB('rgb(255, 100, 50)');
      expect(result).toBe('255, 100, 50');
    });

    it('should parse rgba format', () => {
      const result = parseColorToRGB('rgba(255, 100, 50, 0.5)');
      expect(result).toBe('255, 100, 50, 0.5');
    });

    it('should parse hsl format', () => {
      const result = parseColorToRGB('hsl(0, 100%, 50%)');
      expect(result).toBeDefined();
      expect(result).toMatch(/^\d+, \d+, \d+$/);
    });

    it('should return null for invalid color format', () => {
      const result = parseColorToRGB('not-a-color');
      expect(result).toBeNull();
    });

    it('should handle lowercase hex', () => {
      const result = parseColorToRGB('#ff5733');
      expect(result).toBe('255, 87, 51');
    });

    it('should handle uppercase rgb format', () => {
      const result = parseColorToRGB('RGB(255, 100, 50)');
      expect(result).toBe('255, 100, 50');
    });
  });

  describe('hslToRgb', () => {
    it('should convert red hsl to rgb', () => {
      const result = hslToRgb(0, 100, 50);
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert green hsl to rgb', () => {
      const result = hslToRgb(120, 100, 50);
      expect(result?.g).toBeGreaterThan(result?.r!);
      expect(result?.g).toBeGreaterThan(result?.b!);
    });

    it('should convert blue hsl to rgb', () => {
      const result = hslToRgb(240, 100, 50);
      expect(result).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle grayscale values', () => {
      const result = hslToRgb(0, 0, 50);
      expect(result?.r).toEqual(result?.g);
      expect(result?.g).toEqual(result?.b);
    });

    it('should handle white', () => {
      const result = hslToRgb(0, 0, 100);
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(255);
      expect(result?.b).toBe(255);
    });

    it('should handle black', () => {
      const result = hslToRgb(0, 0, 0);
      expect(result?.r).toBe(0);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
    });
  });

  describe('convertCustomizationsToCSSVariables', () => {
    it('should convert color customizations', () => {
      const customizations = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
          borders: '#E5E7EB',
        },
      };

      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(variables['--color-primary']).toBeDefined();
      expect(variables['--color-secondary']).toBeDefined();
      expect(variables['--color-accent']).toBeDefined();
      expect(variables['--color-background']).toBeDefined();
      expect(variables['--color-text']).toBeDefined();
      expect(variables['--color-borders']).toBeDefined();

      // Should also have RGB versions
      expect(variables['--color-primary-rgb']).toBeDefined();
    });

    it('should convert typography customizations', () => {
      const customizations = {
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
      };

      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(variables['--font-family-headings']).toBe('"Poppins", sans-serif');
      expect(variables['--font-family-body']).toBe('"Inter", sans-serif');
      expect(variables['--font-size-h1']).toBe('48px');
      expect(variables['--font-size-h2']).toBe('36px');
      expect(variables['--font-size-h3']).toBe('28px');
      expect(variables['--font-size-body']).toBe('16px');
      expect(variables['--font-weight-headings']).toBe('700');
      expect(variables['--font-weight-body']).toBe('400');
      expect(variables['--line-height-headings']).toBe('1.2');
      expect(variables['--line-height-body']).toBe('1.5');
    });

    it('should convert layout customizations', () => {
      const customizations = {
        layout: {
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
        },
      };

      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(variables['--container-width']).toBe('1200px');
      expect(variables['--container-layout']).toBe('centered');
      expect(variables['--padding-hero-section']).toBe('40px');
      expect(variables['--padding-content-areas']).toBe('32px');
      expect(variables['--padding-footer']).toBe('24px');
      expect(variables['--margin-section-spacing']).toBe('48px');
      expect(variables['--margin-element-spacing']).toBe('16px');
      expect(variables['--gap-grid']).toBe('24px');
      expect(variables['--gap-flex']).toBe('16px');
    });

    it('should convert component customizations', () => {
      const customizations = {
        components: {
          hero: {
            enabled: true,
            height: '500px',
            overlayColor: 'rgba(0, 0, 0, 0.3)',
          },
          features: {
            enabled: true,
            columns: 3,
          },
          ctaSection: {
            enabled: true,
            style: 'button',
          },
        },
      };

      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(variables['--hero-height']).toBe('500px');
      expect(variables['--hero-overlay-color']).toBe('rgba(0, 0, 0, 0.3)');
      expect(variables['--features-columns']).toBe('3');
      expect(variables['--cta-style']).toBe('button');
    });

    it('should handle full customizations object', () => {
      const customizations = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
        },
        typography: {
          body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
        },
        layout: {
          containerWidth: '1200px',
        },
      };

      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(Object.keys(variables).length).toBeGreaterThan(0);
      expect(variables['--color-primary']).toBeDefined();
      expect(variables['--font-family-body']).toBeDefined();
      expect(variables['--container-width']).toBeDefined();
    });

    it('should handle empty customizations', () => {
      const customizations = {};
      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(Object.keys(variables).length).toBe(0);
    });

    it('should handle partial customizations', () => {
      const customizations = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const variables = convertCustomizationsToCSSVariables(customizations);

      expect(variables['--color-primary']).toBeDefined();
      expect(variables['--color-secondary']).toBeUndefined();
    });
  });

  describe('generateCSSString', () => {
    it('should generate valid CSS string', () => {
      const variables = {
        '--color-primary': 'rgb(59, 130, 246)',
        '--font-size-body': '16px',
      };

      const css = generateCSSString(variables);

      expect(css).toContain(':root {');
      expect(css).toContain('--color-primary: rgb(59, 130, 246);');
      expect(css).toContain('--font-size-body: 16px;');
      expect(css).toContain('}');
    });

    it('should return empty string for empty variables', () => {
      const css = generateCSSString({});
      expect(css).toBe('');
    });

    it('should format CSS correctly with proper indentation', () => {
      const variables = {
        '--color-primary': 'rgb(59, 130, 246)',
        '--color-secondary': 'rgb(16, 185, 129)',
      };

      const css = generateCSSString(variables);

      // Should have proper formatting
      expect(css).toContain('  --');
      expect(css.startsWith(':root')).toBe(true);
      expect(css.endsWith('}')).toBe(true);
    });
  });

  describe('isValidCSSVariable', () => {
    it('should accept valid CSS values', () => {
      expect(isValidCSSVariable('rgb(255, 0, 0)')).toBe(true);
      expect(isValidCSSVariable('16px')).toBe(true);
      expect(isValidCSSVariable('"Inter", sans-serif')).toBe(true);
      expect(isValidCSSVariable('1.2')).toBe(true);
    });

    it('should reject empty values', () => {
      expect(isValidCSSVariable('')).toBe(false);
      expect(isValidCSSVariable('   ')).toBe(false);
    });

    it('should reject potentially dangerous values', () => {
      // Values with semicolons outside of url() are suspicious
      expect(isValidCSSVariable('rgb(255,0,0);color:red')).toBe(false);
    });

    it('should allow url() with parentheses', () => {
      expect(isValidCSSVariable('url(https://example.com/image.jpg)')).toBe(true);
    });
  });

  describe('mergeCSSVariables', () => {
    it('should merge single variable object', () => {
      const variables = { '--color-primary': 'rgb(255, 0, 0)' };
      const merged = mergeCSSVariables(variables);

      expect(merged).toEqual(variables);
    });

    it('should merge multiple variable objects', () => {
      const variables1 = { '--color-primary': 'rgb(255, 0, 0)' };
      const variables2 = { '--color-secondary': 'rgb(0, 255, 0)' };

      const merged = mergeCSSVariables(variables1, variables2);

      expect(merged['--color-primary']).toBe('rgb(255, 0, 0)');
      expect(merged['--color-secondary']).toBe('rgb(0, 255, 0)');
    });

    it('should allow later values to override earlier ones', () => {
      const variables1 = { '--color-primary': 'rgb(255, 0, 0)' };
      const variables2 = { '--color-primary': 'rgb(0, 0, 255)' };

      const merged = mergeCSSVariables(variables1, variables2);

      expect(merged['--color-primary']).toBe('rgb(0, 0, 255)');
    });

    it('should handle empty merge', () => {
      const merged = mergeCSSVariables();
      expect(Object.keys(merged).length).toBe(0);
    });
  });

  describe('getCSSVariableValue', () => {
    it('should get value by variable key with --', () => {
      const variables = { '--color-primary': 'rgb(255, 0, 0)' };
      const value = getCSSVariableValue(variables, '--color-primary');

      expect(value).toBe('rgb(255, 0, 0)');
    });

    it('should get value by variable key without --', () => {
      const variables = { '--color-primary': 'rgb(255, 0, 0)' };
      const value = getCSSVariableValue(variables, 'color-primary');

      expect(value).toBe('rgb(255, 0, 0)');
    });

    it('should return null for non-existent variable', () => {
      const variables = { '--color-primary': 'rgb(255, 0, 0)' };
      const value = getCSSVariableValue(variables, '--non-existent');

      expect(value).toBeNull();
    });
  });

  describe('Property 11: CSS Conversion Correctness', () => {
    /**
     * Property: CSS Conversion Correctness
     * Validates: Requirements 9.2, 9.3
     *
     * For any valid customization input, the generated CSS variables
     * should be valid and parseable. All generated values should be
     * valid CSS property values.
     */
    it('Property 11: Should generate valid CSS for all customization combinations', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryColor: fc.hexColor(),
            secondaryColor: fc.hexColor(),
            fontSize: fc.integer({ min: 8, max: 200 }),
            fontWeight: fc.oneof(
              fc.constant(400),
              fc.constant(700),
              fc.constant(900)
            ),
            lineHeight: fc.float({ min: 0.5, max: 4, noNaN: true }),
            containerWidth: fc.integer({ min: 100, max: 2000 }),
            padding: fc.integer({ min: 0, max: 200 }),
          }),
          ({ primaryColor, secondaryColor, fontSize, fontWeight, lineHeight, containerWidth, padding }) => {
            const customizations = {
              colors: {
                primary: primaryColor,
                secondary: secondaryColor,
              },
              typography: {
                body: {
                  fontFamily: 'Inter',
                  fontSize,
                  fontWeight,
                  lineHeight,
                },
              },
              layout: {
                containerWidth: `${containerWidth}px`,
                padding: { heroSection: padding, contentAreas: padding, footer: padding },
              },
            };

            const variables = convertCustomizationsToCSSVariables(customizations);

            // All variables should be defined for provided customizations
            expect(variables['--color-primary']).toBeDefined();
            expect(variables['--color-secondary']).toBeDefined();
            expect(variables['--font-size-body']).toBeDefined();
            expect(variables['--font-weight-body']).toBeDefined();
            expect(variables['--line-height-body']).toBeDefined();
            expect(variables['--container-width']).toBeDefined();

            // All variables should be valid CSS
            Object.values(variables).forEach((value) => {
              expect(isValidCSSVariable(value)).toBe(true);
            });

            // Should be able to generate valid CSS string
            const css = generateCSSString(variables);
            expect(css.length).toBeGreaterThan(0);
            expect(css).toContain(':root {');
            expect(css).toContain('}');
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
