/**
 * CSS Color Conversion Utility
 * Provides conversion functions between hex, RGB, and HSL color formats
 * with support for CSS variable generation and validation
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number; // alpha channel (0-1)
}

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a?: number; // alpha channel (0-1)
}

// Regex patterns for validation
const HEX_PATTERN = /^#([A-F0-9]{6}|[A-F0-9]{3}|[A-F0-9]{8}|[A-F0-9]{4})$/i;
const RGB_PATTERN = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;
const HSL_PATTERN = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)$/;

/**
 * Convert hex color to RGB format
 * Supports 3, 4, 6, and 8 digit hex formats (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
 */
export function hexToRgb(hex: string): RGBColor {
  const normalized = hex.replace('#', '').toUpperCase();

  let r: number, g: number, b: number;
  let a: number | undefined;

  if (normalized.length === 3) {
    // #RGB -> #RRGGBB
    r = parseInt(normalized[0] + normalized[0], 16);
    g = parseInt(normalized[1] + normalized[1], 16);
    b = parseInt(normalized[2] + normalized[2], 16);
  } else if (normalized.length === 4) {
    // #RGBA -> #RRGGBBAA
    r = parseInt(normalized[0] + normalized[0], 16);
    g = parseInt(normalized[1] + normalized[1], 16);
    b = parseInt(normalized[2] + normalized[2], 16);
    a = Math.round((parseInt(normalized[3], 16) / 255) * 100) / 100;
  } else if (normalized.length === 6) {
    // #RRGGBB
    r = parseInt(normalized.substr(0, 2), 16);
    g = parseInt(normalized.substr(2, 2), 16);
    b = parseInt(normalized.substr(4, 2), 16);
  } else if (normalized.length === 8) {
    // #RRGGBBAA
    r = parseInt(normalized.substr(0, 2), 16);
    g = parseInt(normalized.substr(2, 2), 16);
    b = parseInt(normalized.substr(4, 2), 16);
    a = Math.round((parseInt(normalized.substr(6, 2), 16) / 255) * 100) / 100;
  } else {
    throw new Error(`Invalid hex color format: ${hex}`);
  }

  return { r, g, b, ...(a !== undefined && { a }) };
}

/**
 * Convert RGB color to hex format
 * Outputs 6-digit hex (#RRGGBB) or 8-digit (#RRGGBBAA) if alpha present
 */
export function rgbToHex(color: RGBColor): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;

  if (color.a !== undefined) {
    const alpha = Math.round(color.a * 255).toString(16).padStart(2, '0');
    return hex + alpha;
  }

  return hex;
}

/**
 * Convert hex to HSL format
 */
export function hexToHsl(hex: string): HSLColor {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * Convert HSL to hex format
 */
export function hslToHex(hsl: HSLColor): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

/**
 * Convert RGB to HSL format
 */
export function rgbToHsl(color: RGBColor): HSLColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    ...(color.a !== undefined && { a: color.a })
  };
}

/**
 * Convert HSL to RGB format
 */
export function hslToRgb(color: HSLColor): RGBColor {
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    ...(color.a !== undefined && { a: color.a })
  };
}

/**
 * Parse a color string (hex, rgb, or hsl format) and return hex
 */
export function parseColorToHex(color: string): string {
  const trimmed = color.trim();

  // Try hex
  if (HEX_PATTERN.test(trimmed)) {
    return trimmed;
  }

  // Try rgb/rgba
  const rgbMatch = trimmed.match(RGB_PATTERN);
  if (rgbMatch) {
    const rgb: RGBColor = {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
    if (rgbMatch[4]) {
      rgb.a = parseFloat(rgbMatch[4]);
    }
    return rgbToHex(rgb);
  }

  // Try hsl/hsla
  const hslMatch = trimmed.match(HSL_PATTERN);
  if (hslMatch) {
    const hsl: HSLColor = {
      h: parseInt(hslMatch[1], 10),
      s: parseInt(hslMatch[2], 10),
      l: parseInt(hslMatch[3], 10)
    };
    if (hslMatch[4]) {
      hsl.a = parseFloat(hslMatch[4]);
    }
    return hslToHex(hsl);
  }

  throw new Error(`Invalid color format: ${color}`);
}

/**
 * Convert color to RGB string format (for CSS)
 */
export function colorToRgbString(color: string | RGBColor): string {
  let rgb: RGBColor;

  if (typeof color === 'string') {
    const hex = parseColorToHex(color);
    rgb = hexToRgb(hex);
  } else {
    rgb = color;
  }

  if (rgb.a !== undefined) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
  }

  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Convert color to HSL string format (for CSS)
 */
export function colorToHslString(color: string | HSLColor): string {
  let hsl: HSLColor;

  if (typeof color === 'string') {
    const hex = parseColorToHex(color);
    hsl = hexToHsl(hex);
  } else {
    hsl = color;
  }

  if (hsl.a !== undefined) {
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
  }

  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Validate if a color string is in a valid format
 */
export function isValidColor(color: string): boolean {
  try {
    parseColorToHex(color);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert customization settings to CSS variables
 * Handles nested structures and generates valid CSS custom property values
 */
export function settingsToCSSVariables(settings: Record<string, any>): Record<string, string> {
  const cssVars: Record<string, string> = {};

  const processValue = (key: string, value: any): void => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        processValue(`${key}-${nestedKey}`, nestedValue);
      });
    } else if (typeof value === 'string') {
      // Try to parse as color
      if (isValidColor(value)) {
        cssVars[`--${key}`] = value;
      } else {
        // Regular string value
        cssVars[`--${key}`] = value;
      }
    } else if (typeof value === 'number') {
      // Check if it looks like a color value (0-255 range) or a size
      if (value >= 0 && value <= 255 && key.includes('color')) {
        // Likely RGB component, skip
        return;
      }
      cssVars[`--${key}`] = String(value);
    } else if (typeof value === 'boolean') {
      cssVars[`--${key}`] = value ? 'true' : 'false';
    }
  };

  Object.entries(settings).forEach(([key, value]) => {
    processValue(key, value);
  });

  return cssVars;
}
