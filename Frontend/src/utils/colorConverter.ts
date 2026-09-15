/**
 * Color Format Converter Utility
 * Converts between hex, RGB, and HSL color formats
 * Validates color formats and provides conversion functions
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

/**
 * Validates and converts hex color to RGB
 * Supports #RGB, #RRGGBB, and #RRGGBBAA formats
 */
export function hexToRgb(hex: string): RGBColor | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Expand shorthand (#RGB to #RRGGBB)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Handle 8-character hex (with alpha)
  let alpha: number | undefined;
  if (hex.length === 8) {
    alpha = parseInt(hex.substring(6, 8), 16) / 255;
    hex = hex.substring(0, 6);
  }

  // Validate 6-character hex
  if (hex.length !== 6 || !/^[0-9A-F]{6}$/i.test(hex)) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b, a: alpha };
}

/**
 * Converts RGB to hex format
 * Returns #RRGGBB or #RRGGBBAA if alpha is present
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const hex = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;

  if (rgb.a !== undefined) {
    const alpha = Math.round(rgb.a * 255)
      .toString(16)
      .padStart(2, '0');
    return hex + alpha;
  }

  return hex;
}

/**
 * Parses RGB string format (e.g., "rgb(255, 0, 0)" or "rgb(255 0 0)")
 * Supports both comma and space separated values
 */
export function parseRgbString(rgbString: string): RGBColor | null {
  const rgbRegex = /rgba?\s*\(\s*(\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)(?:\s*,?\s*([0-9.]+))?\s*\)/i;
  const match = rgbString.match(rgbRegex);

  if (!match) {
    return null;
  }

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] ? parseFloat(match[4]) : undefined;

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    return null;
  }

  if (a !== undefined && (a < 0 || a > 1)) {
    return null;
  }

  return { r, g, b, a };
}

/**
 * Converts RGB to RGB string format
 * Returns "rgb(r, g, b)" or "rgba(r, g, b, a)" if alpha is present
 */
export function rgbToString(rgb: RGBColor): string {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));

  if (rgb.a !== undefined) {
    const a = Math.max(0, Math.min(1, rgb.a));
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Converts RGB to HSL
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

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
    a: rgb.a,
  };
}

/**
 * Converts HSL to RGB
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  let h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
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
    a: hsl.a,
  };
}

/**
 * Parses HSL string format (e.g., "hsl(360, 100%, 50%)" or "hsl(360 100% 50%)")
 */
export function parseHslString(hslString: string): HSLColor | null {
  const hslRegex = /hsla?\s*\(\s*(\d+)\s*,?\s*(\d+)%?\s*,?\s*(\d+)%?(?:\s*,?\s*([0-9.]+))?\s*\)/i;
  const match = hslString.match(hslRegex);

  if (!match) {
    return null;
  }

  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const l = parseInt(match[3], 10);
  const a = match[4] ? parseFloat(match[4]) : undefined;

  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
    return null;
  }

  if (a !== undefined && (a < 0 || a > 1)) {
    return null;
  }

  return { h, s, l, a };
}

/**
 * Converts HSL to HSL string format
 * Returns "hsl(h, s%, l%)" or "hsla(h, s%, l%, a)" if alpha is present
 */
export function hslToString(hsl: HSLColor): string {
  const h = Math.round(Math.max(0, Math.min(360, hsl.h)));
  const s = Math.round(Math.max(0, Math.min(100, hsl.s)));
  const l = Math.round(Math.max(0, Math.min(100, hsl.l)));

  if (hsl.a !== undefined) {
    const a = Math.max(0, Math.min(1, hsl.a));
    return `hsla(${h}, ${s}%, ${l}%, ${a.toFixed(2)})`;
  }

  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Generic color parser that detects format and converts to standardized format
 * Returns { hex, rgb, hsl } for any valid input format
 */
export function parseColor(colorString: string): { hex: string; rgb: RGBColor; hsl: HSLColor } | null {
  // Try hex first
  if (colorString.startsWith('#')) {
    const rgb = hexToRgb(colorString);
    if (rgb) {
      return {
        hex: rgbToHex(rgb),
        rgb,
        hsl: rgbToHsl(rgb),
      };
    }
  }

  // Try RGB
  if (colorString.toLowerCase().startsWith('rgb')) {
    const rgb = parseRgbString(colorString);
    if (rgb) {
      return {
        hex: rgbToHex(rgb),
        rgb,
        hsl: rgbToHsl(rgb),
      };
    }
  }

  // Try HSL
  if (colorString.toLowerCase().startsWith('hsl')) {
    const hsl = parseHslString(colorString);
    if (hsl) {
      const rgb = hslToRgb(hsl);
      return {
        hex: rgbToHex(rgb),
        rgb,
        hsl,
      };
    }
  }

  return null;
}

/**
 * Validates if a color string is in a valid format
 */
export function isValidColor(colorString: string): boolean {
  return parseColor(colorString) !== null;
}

/**
 * Checks if two colors are equivalent (accounting for different formats)
 */
export function areColorsEqual(color1: string, color2: string): boolean {
  const parsed1 = parseColor(color1);
  const parsed2 = parseColor(color2);

  if (!parsed1 || !parsed2) {
    return false;
  }

  // Compare RGB values (most reliable)
  return (
    parsed1.rgb.r === parsed2.rgb.r &&
    parsed1.rgb.g === parsed2.rgb.g &&
    parsed1.rgb.b === parsed2.rgb.b &&
    (parsed1.rgb.a ?? 1) === (parsed2.rgb.a ?? 1)
  );
}
