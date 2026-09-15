/**
 * Unit tests for CSS color conversion utility
 * Tests hex to RGB, RGB to hex, HSL to hex, hex to HSL conversions
 * Tests invalid color format rejection and conversion accuracy/precision
 */

import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  rgbToHsl,
  hslToRgb,
  parseColorToHex,
  colorToRgbString,
  colorToHslString,
  isValidColor,
  settingsToCSSVariables,
  RGBColor,
  HSLColor
} from './cssConversion';

describe('Color Conversion Utility', () => {
  describe('Hex to RGB Conversion', () => {
    it('should convert 6-digit hex to RGB', () => {
      const result = hexToRgb('#FF0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert lowercase hex to RGB', () => {
      const result = hexToRgb('#ff0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert 3-digit hex to RGB', () => {
      const result = hexToRgb('#F00');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert hex with alpha channel (8-digit)', () => {
      const result = hexToRgb('#FF0000FF');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should convert 4-digit hex with alpha', () => {
      const result = hexToRgb('#F00F');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should handle partial alpha transparency', () => {
      const result = hexToRgb('#FF000080');
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
      expect(result.a).toBeCloseTo(0.5, 1);
    });

    it('should convert white', () => {
      const result = hexToRgb('#FFFFFF');
      expect(result).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert black', () => {
      const result = hexToRgb('#000000');
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should throw error on invalid hex format', () => {
      expect(() => hexToRgb('#GGGGGG')).toThrow();
      expect(() => hexToRgb('#12')).toThrow();
      expect(() => hexToRgb('red')).toThrow();
    });
  });

  describe('RGB to Hex Conversion', () => {
    it('should convert RGB to 6-digit hex', () => {
      const result = rgbToHex({ r: 255, g: 0, b: 0 });
      expect(result).toBe('#FF0000');
    });

    it('should convert RGB with alpha to 8-digit hex', () => {
      const result = rgbToHex({ r: 255, g: 0, b: 0, a: 1 });
      expect(result).toBe('#FF0000FF');
    });

    it('should convert partial alpha', () => {
      const result = rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(result).toBe('#FF000080');
    });

    it('should clamp RGB values to 0-255 range', () => {
      const result = rgbToHex({ r: 300, g: -10, b: 128 });
      expect(result).toBe('#FF0080');
    });

    it('should convert white', () => {
      const result = rgbToHex({ r: 255, g: 255, b: 255 });
      expect(result).toBe('#FFFFFF');
    });

    it('should convert black', () => {
      const result = rgbToHex({ r: 0, g: 0, b: 0 });
      expect(result).toBe('#000000');
    });

    it('should convert 128,128,128 to gray', () => {
      const result = rgbToHex({ r: 128, g: 128, b: 128 });
      expect(result).toBe('#808080');
    });
  });

  describe('Hex to HSL Conversion', () => {
    it('should convert red hex to HSL', () => {
      const result = hexToHsl('#FF0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert green hex to HSL', () => {
      const result = hexToHsl('#00FF00');
      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert blue hex to HSL', () => {
      const result = hexToHsl('#0000FF');
      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert white to HSL', () => {
      const result = hexToHsl('#FFFFFF');
      expect(result.l).toBe(100);
      expect(result.s).toBe(0);
    });

    it('should convert black to HSL', () => {
      const result = hexToHsl('#000000');
      expect(result.l).toBe(0);
      expect(result.s).toBe(0);
    });

    it('should convert gray to HSL', () => {
      const result = hexToHsl('#808080');
      expect(result.s).toBe(0);
      expect(result.l).toBe(50);
    });

    it('should preserve alpha in HSL conversion', () => {
      const result = hexToHsl('#FF0000FF');
      expect(result.a).toBeDefined();
    });
  });

  describe('HSL to Hex Conversion', () => {
    it('should convert red HSL to hex', () => {
      const result = hslToHex({ h: 0, s: 100, l: 50 });
      expect(result).toBe('#FF0000');
    });

    it('should convert green HSL to hex', () => {
      const result = hslToHex({ h: 120, s: 100, l: 50 });
      expect(result).toBe('#00FF00');
    });

    it('should convert blue HSL to hex', () => {
      const result = hslToHex({ h: 240, s: 100, l: 50 });
      expect(result).toBe('#0000FF');
    });

    it('should convert white HSL to hex', () => {
      const result = hslToHex({ h: 0, s: 0, l: 100 });
      expect(result).toBe('#FFFFFF');
    });

    it('should convert black HSL to hex', () => {
      const result = hslToHex({ h: 0, s: 0, l: 0 });
      expect(result).toBe('#000000');
    });

    it('should handle HSL with alpha', () => {
      const result = hslToHex({ h: 0, s: 100, l: 50, a: 0.5 });
      expect(result).toBe('#FF000080');
    });
  });

  describe('RGB to HSL Conversion', () => {
    it('should convert red RGB to HSL', () => {
      const result = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert gray RGB to HSL', () => {
      const result = rgbToHsl({ r: 128, g: 128, b: 128 });
      expect(result.s).toBe(0);
      expect(result.l).toBe(50);
    });

    it('should preserve alpha channel', () => {
      const result = rgbToHsl({ r: 255, g: 0, b: 0, a: 0.75 });
      expect(result.a).toBe(0.75);
    });
  });

  describe('HSL to RGB Conversion', () => {
    it('should convert red HSL to RGB', () => {
      const result = hslToRgb({ h: 0, s: 100, l: 50 });
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should convert achromatic (gray) HSL to RGB', () => {
      const result = hslToRgb({ h: 0, s: 0, l: 50 });
      expect(result.r).toBe(128);
      expect(result.g).toBe(128);
      expect(result.b).toBe(128);
    });

    it('should preserve alpha channel', () => {
      const result = hslToRgb({ h: 0, s: 100, l: 50, a: 0.5 });
      expect(result.a).toBe(0.5);
    });
  });

  describe('Round-trip conversions (A->B->A)', () => {
    it('should convert hex -> RGB -> hex with accuracy', () => {
      const original = '#3B82F6';
      const rgb = hexToRgb(original);
      const result = rgbToHex(rgb);
      expect(result).toBe(original);
    });

    it('should convert hex -> HSL -> hex with accuracy', () => {
      const original = '#FF5733';
      const hsl = hexToHsl(original);
      const result = hslToHex(hsl);
      expect(result).toBe(original);
    });

    it('should convert RGB -> hex -> RGB with accuracy', () => {
      const original: RGBColor = { r: 100, g: 150, b: 200 };
      const hex = rgbToHex(original);
      const result = hexToRgb(hex);
      expect(result.r).toBe(original.r);
      expect(result.g).toBe(original.g);
      expect(result.b).toBe(original.b);
    });

    it('should convert HSL -> hex -> HSL with accuracy', () => {
      const original: HSLColor = { h: 120, s: 75, l: 60 };
      const hex = hslToHex(original);
      const hsl = hexToHsl(hex);
      expect(hsl.h).toBe(original.h);
      expect(hsl.s).toBe(original.s);
      expect(hsl.l).toBe(original.l);
    });

    it('should convert RGB -> HSL -> RGB with accuracy', () => {
      const original: RGBColor = { r: 200, g: 100, b: 50 };
      const hsl = rgbToHsl(original);
      const result = hslToRgb(hsl);
      expect(Math.abs(result.r - original.r)).toBeLessThan(2);
      expect(Math.abs(result.g - original.g)).toBeLessThan(2);
      expect(Math.abs(result.b - original.b)).toBeLessThan(2);
    });
  });

  describe('Parse Color to Hex', () => {
    it('should parse hex color string', () => {
      const result = parseColorToHex('#FF0000');
      expect(result).toBe('#FF0000');
    });

    it('should parse RGB string', () => {
      const result = parseColorToHex('rgb(255, 0, 0)');
      expect(result).toBe('#FF0000');
    });

    it('should parse RGBA string with alpha', () => {
      const result = parseColorToHex('rgba(255, 0, 0, 1)');
      expect(result).toBe('#FF0000FF');
    });

    it('should parse HSL string', () => {
      const result = parseColorToHex('hsl(0, 100%, 50%)');
      expect(result).toBe('#FF0000');
    });

    it('should parse HSLA string with alpha', () => {
      const result = parseColorToHex('hsla(0, 100%, 50%, 1)');
      expect(result).toBe('#FF0000FF');
    });

    it('should handle RGB with spaces', () => {
      const result = parseColorToHex('rgb( 255 , 0 , 0 )');
      expect(result).toBe('#FF0000');
    });

    it('should throw error on invalid format', () => {
      expect(() => parseColorToHex('not-a-color')).toThrow();
      expect(() => parseColorToHex('rgb(256, 0, 0)')).toThrow();
    });
  });

  describe('Color to RGB String', () => {
    it('should convert hex to RGB string', () => {
      const result = colorToRgbString('#FF0000');
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('should convert RGB object to RGB string', () => {
      const result = colorToRgbString({ r: 255, g: 0, b: 0 });
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('should convert with alpha channel', () => {
      const result = colorToRgbString({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });
  });

  describe('Color to HSL String', () => {
    it('should convert hex to HSL string', () => {
      const result = colorToHslString('#FF0000');
      expect(result).toBe('hsl(0, 100%, 50%)');
    });

    it('should convert HSL object to HSL string', () => {
      const result = colorToHslString({ h: 120, s: 100, l: 50 });
      expect(result).toBe('hsl(120, 100%, 50%)');
    });

    it('should convert with alpha channel', () => {
      const result = colorToHslString({ h: 0, s: 100, l: 50, a: 0.5 });
      expect(result).toBe('hsla(0, 100%, 50%, 0.5)');
    });
  });

  describe('Color Validation', () => {
    it('should validate hex colors', () => {
      expect(isValidColor('#FF0000')).toBe(true);
      expect(isValidColor('#F00')).toBe(true);
      expect(isValidColor('#FF0000FF')).toBe(true);
    });

    it('should validate RGB colors', () => {
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true);
    });

    it('should validate HSL colors', () => {
      expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true);
      expect(isValidColor('hsla(0, 100%, 50%, 0.5)')).toBe(true);
    });

    it('should reject invalid color formats', () => {
      expect(isValidColor('not-a-color')).toBe(false);
      expect(isValidColor('#GGGGGG')).toBe(false);
      expect(isValidColor('red')).toBe(false);
      expect(isValidColor('rgb(256, 0, 0)')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidColor('')).toBe(false);
    });
  });

  describe('Settings to CSS Variables', () => {
    it('should convert flat color settings to CSS variables', () => {
      const settings = {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00'
        }
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--colors-primary']).toBe('#FF0000');
      expect(result['--colors-secondary']).toBe('#00FF00');
    });

    it('should convert numeric values to CSS variables', () => {
      const settings = {
        typography: {
          fontSize: 16,
          lineHeight: 1.5
        }
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--typography-fontSize']).toBe('16');
      expect(result['--typography-lineHeight']).toBe('1.5');
    });

    it('should convert string values to CSS variables', () => {
      const settings = {
        fonts: {
          family: 'Inter'
        }
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--fonts-family']).toBe('Inter');
    });

    it('should convert boolean values to CSS variables', () => {
      const settings = {
        display: {
          enabled: true,
          visible: false
        }
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--display-enabled']).toBe('true');
      expect(result['--display-visible']).toBe('false');
    });

    it('should handle nested objects', () => {
      const settings = {
        spacing: {
          sections: {
            padding: 32,
            margin: 16
          }
        }
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--spacing-sections-padding']).toBe('32');
      expect(result['--spacing-sections-margin']).toBe('16');
    });

    it('should skip null and undefined values', () => {
      const settings = {
        color1: '#FF0000',
        color2: null,
        color3: undefined
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--color1']).toBe('#FF0000');
      expect(result['--color2']).toBeUndefined();
      expect(result['--color3']).toBeUndefined();
    });

    it('should handle complex nested structure', () => {
      const settings = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981'
        },
        typography: {
          heading: {
            fontSize: 32,
            fontWeight: 700
          },
          body: {
            fontSize: 16,
            lineHeight: 1.5
          }
        },
        spacing: {
          padding: 16,
          margin: 8
        }
      };
      const result = settingsToCSSVariables(settings);
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result['--colors-primary']).toBe('#3B82F6');
      expect(result['--typography-heading-fontSize']).toBe('32');
      expect(result['--typography-body-lineHeight']).toBe('1.5');
      expect(result['--spacing-padding']).toBe('16');
    });
  });

  describe('Precision and Accuracy', () => {
    it('should maintain color accuracy through multiple conversions', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      colors.forEach(color => {
        const rgb = hexToRgb(color);
        const hex = rgbToHex(rgb);
        expect(hex).toBe(color);
      });
    });

    it('should handle edge cases for RGB values', () => {
      const edgeCases = [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 },
        { r: 1, g: 1, b: 1 },
        { r: 254, g: 254, b: 254 },
        { r: 127, g: 128, b: 129 }
      ];
      edgeCases.forEach(rgb => {
        const hex = rgbToHex(rgb);
        const result = hexToRgb(hex);
        expect(result.r).toBe(rgb.r);
        expect(result.g).toBe(rgb.g);
        expect(result.b).toBe(rgb.b);
      });
    });

    it('should handle hue wrapping at 360 degrees', () => {
      const hsl: HSLColor = { h: 359, s: 100, l: 50 };
      const hex = hslToHex(hsl);
      const result = hexToHsl(hex);
      // Hue at 359 should wrap correctly
      expect(result.h).toBeGreaterThanOrEqual(0);
      expect(result.h).toBeLessThanOrEqual(360);
    });

    it('should maintain alpha channel precision', () => {
      const alphaValues = [0, 0.25, 0.5, 0.75, 1];
      alphaValues.forEach(alpha => {
        const rgb: RGBColor = { r: 255, g: 0, b: 0, a: alpha };
        const hex = rgbToHex(rgb);
        const result = hexToRgb(hex);
        expect(result.a).toBeDefined();
        expect(Math.abs((result.a || 0) - alpha)).toBeLessThan(0.01);
      });
    });
  });

  describe('Invalid Color Format Rejection', () => {
    it('should reject colors with out-of-range RGB values', () => {
      expect(() => parseColorToHex('rgb(256, 0, 0)')).toThrow();
      expect(() => parseColorToHex('rgb(0, -1, 0)')).toThrow();
    });

    it('should reject malformed hex colors', () => {
      expect(() => hexToRgb('#GGGGGG')).toThrow();
      expect(() => hexToRgb('#12345')).toThrow();
    });

    it('should reject malformed RGB strings', () => {
      expect(() => parseColorToHex('rgb(255, 0)')).toThrow();
      expect(() => parseColorToHex('rgb(a, b, c)')).toThrow();
    });

    it('should reject malformed HSL strings', () => {
      expect(() => parseColorToHex('hsl(0, 100%, 150%)')).toThrow();
      expect(() => parseColorToHex('hsl(0, 100%, 50')).toThrow();
    });

    it('should reject non-color strings', () => {
      expect(() => parseColorToHex('banana')).toThrow();
      expect(() => parseColorToHex('123')).toThrow();
      expect(() => parseColorToHex('')).toThrow();
    });
  });

  describe('CSS Conversion Correctness', () => {
    it('should generate valid CSS custom properties for colors', () => {
      const settings = {
        primary: '#FF0000',
        secondary: '#00FF00'
      };
      const result = settingsToCSSVariables(settings);
      expect(result['--primary']).toBe('#FF0000');
      expect(result['--secondary']).toBe('#00FF00');
      Object.entries(result).forEach(([key, value]) => {
        expect(key).toMatch(/^--[\w-]+$/);
        expect(typeof value).toBe('string');
      });
    });

    it('should generate parseable CSS variable syntax', () => {
      const settings = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B'
        }
      };
      const vars = settingsToCSSVariables(settings);
      Object.entries(vars).forEach(([name, value]) => {
        // Valid CSS variable reference format
        const cssVarRef = `var(${name})`;
        expect(cssVarRef).toMatch(/^var\(--[\w-]+\)$/);
        // Value should be valid CSS
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });
  });
});
