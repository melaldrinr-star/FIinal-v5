/**
 * Contrast Text Utility
 * Automatically determines text color (black or white) based on background luminance
 */

/**
 * Calculate relative luminance of a color
 * Uses WCAG 2.0 formula
 */
export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(x => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Parse color string to RGB values
 * Supports hex, rgb, rgba, and named colors
 */
export const parseColor = (color: string): { r: number; g: number; b: number } | null => {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b };
    }
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
};

/**
 * Get contrasting text color (black or white) based on background
 * Returns 'white' or 'black'
 */
export const getContrastTextColor = (backgroundColor: string): 'white' | 'black' => {
  const rgb = parseColor(backgroundColor);
  if (!rgb) return 'white'; // Default fallback

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  // If luminance > 0.5, background is light, use black text
  // If luminance <= 0.5, background is dark, use white text
  return luminance > 0.5 ? 'black' : 'white';
};

/**
 * Get CSS class for contrasting text
 */
export const getContrastTextClass = (backgroundColor: string): string => {
  return getContrastTextColor(backgroundColor) === 'white' ? 'text-white' : 'text-black';
};
