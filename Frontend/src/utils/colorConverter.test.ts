import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  parseRgbString,
  parseHslString,
  rgbToString,
  hslToString,
  parseColor,
  isValidColor,
  areColorsEqual,
} from './colorConverter';

/**
 * Tests for Color Converter Utility
 * Validates color format parsing and conversion functions
 * Required for Property 7: Color Format Conversion
 */

describe('Color Converter Utility', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      const result = hexToRgb('#FF5733');
      expect(result).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should convert 3-digit hex to RGB', () => {
      const result = hexToRgb('#F57');
      expect(result).toEqual({ r: 255, g: 85, b: 119 });
    });

    it('should handle lowercase hex', () => {
      const result = hexToRgb('#ff5733');
      expect(result).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should handle hex with alpha', () => {
      const result = hexToRgb('#FF573380');
      expect(result).toEqual({ r: 255, g: 87, b: 51, a: expect.any(Number) });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('not-a-hex')).toBeNull();
      expect(hexToRgb('#GG0000')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      const result = rgbToHex({ r: 255, g: 87, b: 51 });
      expect(result).toBe('#FF5733');
    });

    it('should handle RGB with alpha', () => {
      const result = rgbToHex({ r: 255, g: 87, b: 51, a: 0.5 });
      expect(result).toMatch(/^#FF5733[0-9A-Fa-f]{2}$/);
    });

    it('should clamp RGB values', () => {
      const result = rgbToHex({ r: 300, g: -10, b: 127 });
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Hex/RGB Round-trip Conversion', () => {
    it('should convert hex to RGB and back to same hex', () => {
      const original = '#FF5733';
      const rgb = hexToRgb(original);
      const hexBack = rgbToHex(rgb!);
      expect(hexBack.toLowerCase()).toBe(original.toLowerCase());
    });

    it('should convert 3-digit hex through RGB and back correctly', () => {
      const hex3 = '#F57';
      const rgb = hexToRgb(hex3);
      const hexBack = rgbToHex(rgb!);
      // Should expand to 6-digit equivalent
      expect(hexBack).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL', () => {
      const result = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should handle grayscale colors', () => {
      const result = rgbToHsl({ r: 128, g: 128, b: 128 });
      expect(result.s).toBe(0);
      expect(result.l).toBe(50);
    });

    it('should preserve alpha channel', () => {
      const result = rgbToHsl({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(result.a).toBe(0.5);
    });
  });

  describe('hslToRgb', () => {
    it('should convert HSL to RGB', () => {
      const result = hslToRgb({ h: 0, s: 100, l: 50 });
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should handle grayscale HSL', () => {
      const result = hslToRgb({ h: 0, s: 0, l: 128 });
      expect(result.r).toBe(result.g);
      expect(result.g).toBe(result.b);
    });
  });

  describe('RGB/HSL Round-trip Conversion', () => {
    it('should convert RGB to HSL and back to same RGB', () => {
      const original = { r: 255, g: 87, b: 51 };
      const hsl = rgbToHsl(original);
      const rgbBack = hslToRgb(hsl);
      expect(rgbBack.r).toBe(original.r);
      expect(rgbBack.g).toBe(original.g);
      expect(rgbBack.b).toBe(original.b);
    });

    it('should handle HSL to RGB and back', () => {
      const original = { h: 9, s: 100, l: 60 };
      const rgb = hslToRgb(original);
      const hslBack = rgbToHsl(rgb);
      expect(hslBack.h).toBe(original.h);
      expect(hslBack.s).toBe(original.s);
      expect(hslBack.l).toBe(original.l);
    });
  });

  describe('parseRgbString', () => {
    it('should parse rgb(r, g, b) format', () => {
      const result = parseRgbString('rgb(255, 87, 51)');
      expect(result).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should parse rgba(r, g, b, a) format', () => {
      const result = parseRgbString('rgba(255, 87, 51, 0.5)');
      expect(result).toEqual({ r: 255, g: 87, b: 51, a: 0.5 });
    });

    it('should parse space-separated format', () => {
      const result = parseRgbString('rgb(255 87 51)');
      expect(result).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should return null for invalid format', () => {
      expect(parseRgbString('not-rgb')).toBeNull();
      expect(parseRgbString('rgb(300, 400, 500)')).toBeNull();
    });
  });

  describe('parseHslString', () => {
    it('should parse hsl(h, s%, l%) format', () => {
      const result = parseHslString('hsl(9, 100%, 60%)');
      expect(result).toEqual({ h: 9, s: 100, l: 60 });
    });

    it('should parse hsla(h, s%, l%, a) format', () => {
      const result = parseHslString('hsla(9, 100%, 60%, 0.5)');
      expect(result).toEqual({ h: 9, s: 100, l: 60, a: 0.5 });
    });

    it('should parse space-separated format', () => {
      const result = parseHslString('hsl(9 100% 60%)');
      expect(result).toEqual({ h: 9, s: 100, l: 60 });
    });

    it('should return null for invalid format', () => {
      expect(parseHslString('not-hsl')).toBeNull();
      expect(parseHslString('hsl(400, 100%, 60%)')).toBeNull();
    });
  });

  describe('rgbToString', () => {
    it('should convert RGB to rgb() string', () => {
      const result = rgbToString({ r: 255, g: 87, b: 51 });
      expect(result).toBe('rgb(255, 87, 51)');
    });

    it('should convert RGB with alpha to rgba() string', () => {
      const result = rgbToString({ r: 255, g: 87, b: 51, a: 0.5 });
      expect(result).toMatch(/^rgba\(255, 87, 51, [0-9.]+\)$/);
    });
  });

  describe('hslToString', () => {
    it('should convert HSL to hsl() string', () => {
      const result = hslToString({ h: 9, s: 100, l: 60 });
      expect(result).toBe('hsl(9, 100%, 60%)');
    });

    it('should convert HSL with alpha to hsla() string', () => {
      const result = hslToString({ h: 9, s: 100, l: 60, a: 0.5 });
      expect(result).toMatch(/^hsla\(9, 100%, 60%, [0-9.]+\)$/);
    });
  });

  describe('parseColor', () => {
    it('should parse hex colors', () => {
      const result = parseColor('#FF5733');
      expect(result).toHaveProperty('hex');
      expect(result).toHaveProperty('rgb');
      expect(result).toHaveProperty('hsl');
    });

    it('should parse RGB colors', () => {
      const result = parseColor('rgb(255, 87, 51)');
      expect(result).toHaveProperty('hex');
      expect(result).toHaveProperty('rgb');
      expect(result).toHaveProperty('hsl');
    });

    it('should parse HSL colors', () => {
      const result = parseColor('hsl(9, 100%, 60%)');
      expect(result).toHaveProperty('hex');
      expect(result).toHaveProperty('rgb');
      expect(result).toHaveProperty('hsl');
    });

    it('should return null for invalid colors', () => {
      expect(parseColor('not-a-color')).toBeNull();
      expect(parseColor('invalid')).toBeNull();
    });
  });

  describe('isValidColor', () => {
    it('should return true for valid hex colors', () => {
      expect(isValidColor('#FF5733')).toBe(true);
      expect(isValidColor('#F57')).toBe(true);
    });

    it('should return true for valid RGB colors', () => {
      expect(isValidColor('rgb(255, 87, 51)')).toBe(true);
      expect(isValidColor('rgba(255, 87, 51, 0.5)')).toBe(true);
    });

    it('should return true for valid HSL colors', () => {
      expect(isValidColor('hsl(9, 100%, 60%)')).toBe(true);
      expect(isValidColor('hsla(9, 100%, 60%, 0.5)')).toBe(true);
    });

    it('should return false for invalid colors', () => {
      expect(isValidColor('not-a-color')).toBe(false);
      expect(isValidColor('#GGGGGG')).toBe(false);
      expect(isValidColor('rgb(300, 400, 500)')).toBe(false);
    });
  });

  describe('areColorsEqual', () => {
    it('should recognize equal hex colors', () => {
      expect(areColorsEqual('#FF5733', '#FF5733')).toBe(true);
    });

    it('should recognize hex and RGB as equal', () => {
      expect(areColorsEqual('#FF5733', 'rgb(255, 87, 51)')).toBe(true);
    });

    it('should recognize hex and HSL as equal', () => {
      expect(areColorsEqual('#FF5733', 'hsl(9, 100%, 60%)')).toBe(true);
    });

    it('should recognize RGB and HSL as equal', () => {
      expect(areColorsEqual('rgb(255, 87, 51)', 'hsl(9, 100%, 60%)')).toBe(true);
    });

    it('should recognize different colors as not equal', () => {
      expect(areColorsEqual('#FF5733', '#000000')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle white color', () => {
      const hex = hexToRgb('#FFFFFF');
      expect(hex).toEqual({ r: 255, g: 255, b: 255 });

      const hsl = rgbToHsl(hex!);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(100);
    });

    it('should handle black color', () => {
      const hex = hexToRgb('#000000');
      expect(hex).toEqual({ r: 0, g: 0, b: 0 });

      const hsl = rgbToHsl(hex!);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(0);
    });

    it('should handle boundary RGB values', () => {
      const rgb = { r: 0, g: 127, b: 255 };
      const hex = rgbToHex(rgb);
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);

      const hexBack = hexToRgb(hex);
      expect(hexBack?.r).toBe(0);
      expect(hexBack?.g).toBe(127);
      expect(hexBack?.b).toBe(255);
    });
  });
});
