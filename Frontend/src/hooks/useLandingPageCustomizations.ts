/**
 * Hook: useLandingPageCustomizations
 *
 * Integrates customization loading and CSS injection for landing page
 * Handles component visibility, CSS variable injection, and error fallbacks
 *
 * Requirements: 9.1, 9.3, 9.4, 9.5
 * Phase: 4 - Landing Page Integration
 */

import { useEffect, useState, useCallback } from 'react';
import {
  loadCustomizations,
  CustomizationSettings,
  DEFAULT_CUSTOMIZATIONS,
  CustomizationLoaderOptions,
} from '../utils/customizationLoader';
import {
  convertCustomizationsToCSSVariables,
  generateCSSString,
} from '../utils/cssVariableConverter';
import {
  injectCSSVariables,
  removeCSSVariables,
} from '../utils/cssInjection';

export interface UseLandingPageCustomizationsOptions {
  autoLoad?: boolean;
  debounceMs?: number;
  loaderOptions?: CustomizationLoaderOptions;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface UseLandingPageCustomizationsResult {
  customizations: CustomizationSettings;
  isLoading: boolean;
  error: Error | null;
  componentVisibility: Record<string, boolean>;
  reload: () => Promise<void>;
}

const STYLE_ID = 'landing-page-customizations';

/**
 * Hook for integrating customizations into landing page
 *
 * Features:
 * - Automatically loads customizations on component mount
 * - Injects CSS variables into document head
 * - Manages component visibility based on customization settings
 * - Handles errors gracefully with fallback to defaults
 * - Supports manual reload
 * - Cleans up styles on unmount
 *
 * @param options - Configuration options
 * @returns Hook result with customizations, loading state, error, and reload function
 */
export function useLandingPageCustomizations(
  options: UseLandingPageCustomizationsOptions = {}
): UseLandingPageCustomizationsResult {
  const {
    autoLoad = true,
    debounceMs = 300,
    loaderOptions = {},
    onError,
    onSuccess,
  } = options;

  const [customizations, setCustomizations] = useState<CustomizationSettings>(DEFAULT_CUSTOMIZATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [componentVisibility, setComponentVisibility] = useState<Record<string, boolean>>({});

  // Extract component visibility from customizations
  const updateComponentVisibility = useCallback((customs: CustomizationSettings) => {
    const visibility: Record<string, boolean> = {};

    if (customs.components) {
      // Set visibility for each component
      Object.entries(customs.components).forEach(([key, config]) => {
        visibility[key] = config?.enabled !== false; // Default to enabled if not specified
      });
    }

    // Ensure all standard components have a value
    const standardComponents = [
      'navigation',
      'hero',
      'features',
      'testimonials',
      'ctaSection',
      'contact',
      'footer',
    ];
    standardComponents.forEach((comp) => {
      if (!(comp in visibility)) {
        visibility[comp] = true; // Default to enabled
      }
    });

    setComponentVisibility(visibility);
  }, []);

  // Inject CSS variables into document
  const injectCustomizationsCSS = useCallback((customs: CustomizationSettings) => {
    try {
      // Convert customizations to CSS variables
      const cssVariables = convertCustomizationsToCSSVariables(customs);

      // Generate CSS string
      const cssString = generateCSSString(cssVariables);

      // Inject into document
      if (cssString) {
        injectCSSVariables(cssString, {
          id: STYLE_ID,
          onError: (err) => {
            console.warn('[Landing Page Customizations] CSS injection error:', err);
          },
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[Landing Page Customizations] CSS conversion/injection failed:', error);
      throw error;
    }
  }, []);

  // Load customizations
  const loadAndApplyCustomizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load customizations from API
      const loaded = await loadCustomizations({
        ...loaderOptions,
        onError: (err) => {
          if (loaderOptions.onError) loaderOptions.onError(err);
          setError(err);
          if (onError) onError(err);
        },
      });

      // Update state
      setCustomizations(loaded);

      // Update component visibility
      updateComponentVisibility(loaded);

      // Inject CSS variables
      injectCustomizationsCSS(loaded);

      setIsLoading(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setCustomizations(DEFAULT_CUSTOMIZATIONS);
      updateComponentVisibility(DEFAULT_CUSTOMIZATIONS);
      setIsLoading(false);
      if (onError) onError(error);
    }
  }, [loaderOptions, updateComponentVisibility, injectCustomizationsCSS, onError, onSuccess]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadAndApplyCustomizations();
    }

    // Cleanup: remove injected styles on unmount
    return () => {
      removeCSSVariables(STYLE_ID);
    };
  }, [autoLoad, loadAndApplyCustomizations]);

  // Manual reload function
  const reload = useCallback(async () => {
    await loadAndApplyCustomizations();
  }, [loadAndApplyCustomizations]);

  return {
    customizations,
    isLoading,
    error,
    componentVisibility,
    reload,
  };
}

/**
 * Hook for checking if a component should be visible
 * Returns false if component is disabled in customizations
 *
 * @param componentName - Name of the component (e.g., 'hero', 'features')
 * @param componentVisibility - Component visibility map from useLandingPageCustomizations
 * @returns true if component should be visible, false otherwise
 */
export function useComponentVisibility(
  componentName: string,
  componentVisibility: Record<string, boolean>
): boolean {
  return componentVisibility[componentName] !== false;
}

/**
 * Hook for applying customizations to a specific component
 * Returns CSS class names and styling based on customizations
 *
 * @param customizations - Customization settings
 * @param componentName - Name of the component
 * @returns Object with className, style, and other properties for component
 */
export function useComponentCustomization(
  customizations: CustomizationSettings,
  componentName: string
) {
  const componentConfig = customizations.components?.[componentName];

  return {
    isEnabled: componentConfig?.enabled !== false,
    config: componentConfig || {},
    customColors: customizations.colors || {},
    customTypography: customizations.typography || {},
    customLayout: customizations.layout || {},
  };
}

/**
 * Hook for getting customized content
 * Returns content from customizations with fallback to defaults
 *
 * @param customizations - Customization settings
 * @param contentPath - Path to content (e.g., 'hero.heading', 'features')
 * @param defaultValue - Default value if not found in customizations
 * @returns Customized content or default value
 */
export function useCustomizedContent(
  customizations: CustomizationSettings,
  contentPath: string,
  defaultValue: any = null
): any {
  const parts = contentPath.split('.');

  let value = customizations.content;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return defaultValue;
    }
  }

  return value || defaultValue;
}
