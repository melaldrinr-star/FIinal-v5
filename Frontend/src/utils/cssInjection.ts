/**
 * CSS Injection Utility
 *
 * Dynamically injects CSS variables into the document
 * Manages style tag creation, updates, and cleanup
 *
 * Requirements: 9.2, 9.3
 */

export interface CSSInjectionOptions {
  id?: string;
  debounce?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const DEFAULT_STYLE_ID = 'cms-customizations-styles';

/**
 * Inject CSS variables into document head
 * Creates or updates a <style> tag with the provided CSS string
 *
 * @param cssString - CSS string to inject
 * @param options - Injection options (id, debounce, callbacks)
 * @returns The created/updated style element
 */
export function injectCSSVariables(
  cssString: string,
  options: CSSInjectionOptions = {}
): HTMLStyleElement | null {
  const { id = DEFAULT_STYLE_ID, onSuccess, onError } = options;

  try {
    // Validate CSS string
    if (!cssString || cssString.trim() === '') {
      const error = new Error('CSS string cannot be empty');
      if (onError) onError(error);
      return null;
    }

    // Find or create style tag
    let styleTag = document.getElementById(id) as HTMLStyleElement;

    if (!styleTag) {
      // Create new style tag
      styleTag = document.createElement('style');
      styleTag.id = id;
      styleTag.type = 'text/css';
      document.head.appendChild(styleTag);
    }

    // Update style content
    styleTag.textContent = cssString;

    // Verify injection was successful
    if (styleTag.textContent !== cssString) {
      throw new Error('Failed to set style tag content');
    }

    if (onSuccess) onSuccess();
    return styleTag;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onError) onError(err);
    console.error('[CSS Injection Error]', err);
    return null;
  }
}

/**
 * Remove CSS variables from document
 * Removes the style tag with the given ID
 *
 * @param id - Style tag ID (defaults to DEFAULT_STYLE_ID)
 * @returns true if removed, false if not found
 */
export function removeCSSVariables(id: string = DEFAULT_STYLE_ID): boolean {
  try {
    const styleTag = document.getElementById(id);
    if (styleTag) {
      styleTag.remove();
      return true;
    }
    return false;
  } catch (error) {
    console.error('[CSS Removal Error]', error);
    return false;
  }
}

/**
 * Clear all custom CSS variables from document
 * Removes all style tags with the CMS customization ID
 */
export function clearAllCSSVariables(id: string = DEFAULT_STYLE_ID): void {
  try {
    const styleTags = document.querySelectorAll(`style[id="${id}"]`);
    styleTags.forEach((tag) => tag.remove());
  } catch (error) {
    console.error('[CSS Clear Error]', error);
  }
}

/**
 * Check if CSS variables are currently injected
 *
 * @param id - Style tag ID
 * @returns true if style tag exists, false otherwise
 */
export function areCSSVariablesInjected(id: string = DEFAULT_STYLE_ID): boolean {
  try {
    return document.getElementById(id) !== null;
  } catch {
    return false;
  }
}

/**
 * Get currently injected CSS string
 *
 * @param id - Style tag ID
 * @returns CSS string if found, null otherwise
 */
export function getInjectedCSS(id: string = DEFAULT_STYLE_ID): string | null {
  try {
    const styleTag = document.getElementById(id) as HTMLStyleElement;
    if (styleTag && styleTag.textContent) {
      return styleTag.textContent;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create debounced CSS injection function
 * Useful for real-time preview updates that happen frequently
 *
 * @param cssInjectorFunction - Function that performs CSS injection
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Debounced function
 */
export function createDebouncedCSSInjector(
  cssInjectorFunction: (cssString: string) => void,
  debounceMs: number = 300
): (cssString: string) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (cssString: string) => {
    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      cssInjectorFunction(cssString);
      timeoutId = null;
    }, debounceMs);
  };
}

/**
 * Inject CSS with automatic debouncing
 * Debounces rapid calls to injectCSSVariables
 *
 * @param cssString - CSS string to inject
 * @param debounceMs - Debounce delay (default: 300)
 * @param id - Style tag ID
 * @returns Function to cancel pending injection
 */
export function injectCSSWithDebounce(
  cssString: string,
  debounceMs: number = 300,
  id: string = DEFAULT_STYLE_ID
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  timeoutId = setTimeout(() => {
    injectCSSVariables(cssString, { id });
  }, debounceMs);

  return cancel;
}

/**
 * Batch inject multiple CSS configurations
 * Merges all CSS and injects as single style tag
 *
 * @param cssStrings - Array of CSS strings to merge
 * @param id - Style tag ID
 * @returns Merged CSS string that was injected
 */
export function batchInjectCSS(
  cssStrings: string[],
  id: string = DEFAULT_STYLE_ID
): string | null {
  try {
    // Filter empty strings
    const validCSSStrings = cssStrings.filter((css) => css && css.trim() !== '');

    if (validCSSStrings.length === 0) {
      return null;
    }

    // Merge all CSS strings with newlines
    const mergedCSS = validCSSStrings.join('\n\n');

    // Inject merged CSS
    injectCSSVariables(mergedCSS, { id });

    return mergedCSS;
  } catch (error) {
    console.error('[Batch CSS Injection Error]', error);
    return null;
  }
}

/**
 * Get CSS variable value from injected styles
 * Retrieves actual computed value from document
 *
 * @param variableName - CSS variable name (with or without --)
 * @param element - Element to get computed style from (defaults to document.documentElement)
 * @returns Variable value or null if not found
 */
export function getCSSVariableFromDocument(
  variableName: string,
  element: Element = document.documentElement
): string | null {
  try {
    const normalizedName = variableName.startsWith('--') ? variableName : `--${variableName}`;
    const computedStyle = getComputedStyle(element);
    const value = computedStyle.getPropertyValue(normalizedName).trim();
    return value || null;
  } catch (error) {
    console.error('[Get CSS Variable Error]', error);
    return null;
  }
}

/**
 * Inject CSS with fallback to defaults
 * If CSS injection fails, ensures page still renders with reasonable defaults
 *
 * @param cssString - CSS string to inject
 * @param fallbackCSS - Fallback CSS to inject if primary fails
 * @param id - Style tag ID
 * @returns true if primary CSS injected, false if fallback used
 */
export function injectCSSWithFallback(
  cssString: string,
  fallbackCSS: string,
  id: string = DEFAULT_STYLE_ID
): boolean {
  try {
    const result = injectCSSVariables(cssString, { id });
    if (result) {
      return true;
    }
  } catch (error) {
    console.warn('[CSS Injection Failed, Using Fallback]', error);
  }

  try {
    injectCSSVariables(fallbackCSS, { id: `${id}-fallback` });
    return false;
  } catch (error) {
    console.error('[Fallback CSS Injection Also Failed]', error);
    return false;
  }
}

/**
 * Watch for changes and automatically update injected CSS
 * Useful for reactive updates in frameworks like React
 *
 * @param cssGetter - Function that returns current CSS to inject
 * @param debounceMs - Debounce delay in milliseconds
 * @param id - Style tag ID
 * @returns Cleanup function to stop watching
 */
export function watchAndInjectCSS(
  cssGetter: () => string,
  debounceMs: number = 300,
  id: string = DEFAULT_STYLE_ID
): () => void {
  let previousCSS = '';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const checkAndUpdate = () => {
    const currentCSS = cssGetter();
    if (currentCSS !== previousCSS) {
      previousCSS = currentCSS;
      injectCSSVariables(currentCSS, { id });
    }
  };

  // Initial injection
  checkAndUpdate();

  // Set up interval for checking
  const intervalId = setInterval(checkAndUpdate, debounceMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Validate that CSS is properly injected and accessible
 *
 * @param id - Style tag ID
 * @returns Object with validation results
 */
export function validateCSSInjection(
  id: string = DEFAULT_STYLE_ID
): { isValid: boolean; message: string; details?: Record<string, any> } {
  try {
    const styleTag = document.getElementById(id) as HTMLStyleElement;

    if (!styleTag) {
      return {
        isValid: false,
        message: 'Style tag not found in document',
      };
    }

    if (styleTag.type !== 'text/css' && styleTag.type !== '') {
      return {
        isValid: false,
        message: `Invalid style tag type: ${styleTag.type}`,
      };
    }

    if (!styleTag.textContent || styleTag.textContent.trim() === '') {
      return {
        isValid: false,
        message: 'Style tag has no content',
      };
    }

    // Try to verify CSS is actually applied
    const hasRootSelector = styleTag.textContent.includes(':root');

    return {
      isValid: true,
      message: 'CSS successfully injected',
      details: {
        styleTagFound: true,
        hasContent: true,
        hasRootSelector,
        contentLength: styleTag.textContent.length,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
