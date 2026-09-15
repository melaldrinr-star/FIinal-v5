/**
 * CSS Variable Converter Utility
 *
 * Converts customization JSONB data to CSS custom properties
 * Supports colors, typography, layout, spacing, and component settings
 *
 * Requirements: 9.2, 9.3
 */

export interface CSSVariables {
  [key: string]: string;
}

/**
 * Parse color value and convert to RGB for CSS
 */
export function parseColorToRGB(color: string): string | null {
  // Handle hex format (#RRGGBB or #RGB)
  const hexMatch = color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  // Handle rgb format (rgb(r, g, b))
  const rgbMatch = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
  }

  // Handle rgba format (rgba(r, g, b, a))
  const rgbaMatch = color.match(
    /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i
  );
  if (rgbaMatch) {
    return `${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${rgbaMatch[4]}`;
  }

  // Handle hsl format (hsl(h, s%, l%))
  const hslMatch = color.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]);
    const l = parseInt(hslMatch[3]);
    const rgb = hslToRgb(h, s, l);
    if (rgb) {
      return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }
  }

  return null;
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } | null {
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - ((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Convert customizations JSONB to CSS variables
 *
 * @param customizations - The full customization JSONB object
 * @returns Object with CSS variable names as keys and CSS values as values
 */
export function convertCustomizationsToCSSVariables(
  customizations: Record<string, any>
): CSSVariables {
  const variables: CSSVariables = {};

  // Process colors
  if (customizations.colors) {
    const { primary, secondary, accent, background, text, borders } = customizations.colors;

    if (primary) {
      const rgb = parseColorToRGB(primary);
      if (rgb) {
        variables['--color-primary'] = `rgb(${rgb})`;
        variables['--color-primary-rgb'] = rgb;
      }
    }
    if (secondary) {
      const rgb = parseColorToRGB(secondary);
      if (rgb) {
        variables['--color-secondary'] = `rgb(${rgb})`;
        variables['--color-secondary-rgb'] = rgb;
      }
    }
    if (accent) {
      const rgb = parseColorToRGB(accent);
      if (rgb) {
        variables['--color-accent'] = `rgb(${rgb})`;
        variables['--color-accent-rgb'] = rgb;
      }
    }
    if (background) {
      const rgb = parseColorToRGB(background);
      if (rgb) {
        variables['--color-background'] = `rgb(${rgb})`;
        variables['--color-background-rgb'] = rgb;
      }
    }
    if (text) {
      const rgb = parseColorToRGB(text);
      if (rgb) {
        variables['--color-text'] = `rgb(${rgb})`;
        variables['--color-text-rgb'] = rgb;
      }
    }
    if (borders) {
      const rgb = parseColorToRGB(borders);
      if (rgb) {
        variables['--color-borders'] = `rgb(${rgb})`;
        variables['--color-borders-rgb'] = rgb;
      }
    }
  }

  // Process typography
  if (customizations.typography) {
    const { headings, body } = customizations.typography;

    if (headings) {
      if (headings.fontFamily) {
        variables['--font-family-headings'] = `"${headings.fontFamily}", sans-serif`;
      }
      if (headings.fontSize) {
        if (headings.fontSize.h1) variables['--font-size-h1'] = `${headings.fontSize.h1}px`;
        if (headings.fontSize.h2) variables['--font-size-h2'] = `${headings.fontSize.h2}px`;
        if (headings.fontSize.h3) variables['--font-size-h3'] = `${headings.fontSize.h3}px`;
      }
      if (headings.fontWeight) {
        variables['--font-weight-headings'] = headings.fontWeight.toString();
      }
      if (headings.lineHeight) {
        variables['--line-height-headings'] = headings.lineHeight.toString();
      }
    }

    if (body) {
      if (body.fontFamily) {
        variables['--font-family-body'] = `"${body.fontFamily}", sans-serif`;
      }
      if (body.fontSize) {
        variables['--font-size-body'] = `${body.fontSize}px`;
      }
      if (body.fontWeight) {
        variables['--font-weight-body'] = body.fontWeight.toString();
      }
      if (body.lineHeight) {
        variables['--line-height-body'] = body.lineHeight.toString();
      }
    }
  }

  // Process layout
  if (customizations.layout) {
    const { containerWidth, containerLayout, padding, margins, gaps } = customizations.layout;

    if (containerWidth) {
      variables['--container-width'] = containerWidth;
    }
    if (containerLayout) {
      variables['--container-layout'] = containerLayout;
    }

    if (padding) {
      if (padding.heroSection !== undefined)
        variables['--padding-hero-section'] = `${padding.heroSection}px`;
      if (padding.contentAreas !== undefined)
        variables['--padding-content-areas'] = `${padding.contentAreas}px`;
      if (padding.footer !== undefined) variables['--padding-footer'] = `${padding.footer}px`;
    }

    if (margins) {
      if (margins.sectionSpacing !== undefined)
        variables['--margin-section-spacing'] = `${margins.sectionSpacing}px`;
      if (margins.elementSpacing !== undefined)
        variables['--margin-element-spacing'] = `${margins.elementSpacing}px`;
    }

    if (gaps) {
      if (gaps.grid !== undefined) variables['--gap-grid'] = `${gaps.grid}px`;
      if (gaps.flex !== undefined) variables['--gap-flex'] = `${gaps.flex}px`;
    }
  }

  // Process components
  if (customizations.components) {
    const { hero, features, ctaSection } = customizations.components;

    if (hero) {
      if (hero.height) variables['--hero-height'] = hero.height;
      if (hero.overlayColor) variables['--hero-overlay-color'] = hero.overlayColor;
    }

    if (features) {
      if (features.columns !== undefined) variables['--features-columns'] = features.columns.toString();
    }

    if (ctaSection) {
      if (ctaSection.style) variables['--cta-style'] = ctaSection.style;
    }
  }

  return variables;
}

/**
 * Generate CSS string from variables object
 *
 * @param variables - CSS variables object
 * @returns CSS string with :root selector
 */
export function generateCSSString(variables: CSSVariables): string {
  if (Object.keys(variables).length === 0) {
    return '';
  }

  const cssLines = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${cssLines}\n}`;
}

/**
 * Validate CSS variable is properly formatted
 *
 * @param variable - CSS variable string
 * @returns true if valid CSS variable format
 */
export function isValidCSSVariable(variable: string): boolean {
  // Check if it's a valid CSS custom property value
  // Should not contain newlines, be non-empty, and ideally parseable as CSS
  if (!variable || variable.trim() === '') {
    return false;
  }

  // Check for potentially dangerous characters
  if (variable.includes(';') && !variable.match(/^url\(/)) {
    // Allow semicolons in url() but not elsewhere
    return false;
  }

  return true;
}

/**
 * Merge multiple CSS variable objects
 *
 * @param variableSets - Array of CSS variable objects to merge
 * @returns Merged CSS variables object
 */
export function mergeCSSVariables(...variableSets: CSSVariables[]): CSSVariables {
  return Object.assign({}, ...variableSets);
}

/**
 * Get CSS variable value for a specific key
 *
 * @param variables - CSS variables object
 * @param key - Variable key (with or without --)
 * @returns Variable value or null if not found
 */
export function getCSSVariableValue(variables: CSSVariables, key: string): string | null {
  const normalizedKey = key.startsWith('--') ? key : `--${key}`;
  return variables[normalizedKey] || null;
}
