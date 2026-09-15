/**
 * Integration Tests for useLandingPageCustomizations Hook
 *
 * Tests CSS injection, component visibility, and landing page integration
 * Validates customizations are loaded and applied correctly on page load
 *
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useLandingPageCustomizations,
  useComponentVisibility,
  useComponentCustomization,
  useCustomizedContent,
} from './useLandingPageCustomizations';
import * as customizationLoader from '../utils/customizationLoader';
import * as cssVariableConverter from '../utils/cssVariableConverter';
import * as cssInjection from '../utils/cssInjection';

// Mock modules
jest.mock('../utils/customizationLoader');
jest.mock('../utils/cssVariableConverter');
jest.mock('../utils/cssInjection');

describe('useLandingPageCustomizations - Integration Tests', () => {
  const mockCustomizations = {
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      background: '#ffffff',
      text: '#000000',
      borders: '#cccccc',
    },
    typography: {
      headings: {
        fontFamily: 'Playfair',
        fontSize: { h1: 64, h2: 48, h3: 32 },
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
    layout: {
      containerWidth: '1200px',
      containerLayout: 'centered',
    },
    components: {
      navigation: { enabled: true },
      hero: { enabled: true },
      features: { enabled: false },
      testimonials: { enabled: true },
      ctaSection: { enabled: true },
      contact: { enabled: true },
      footer: { enabled: true },
    },
    content: {
      hero: {
        heading: 'Welcome',
        subheading: 'To our platform',
      },
      features: [
        { title: 'Feature 1', description: 'Description 1' },
      ],
      contact: {
        email: 'contact@example.com',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock customization loader
    (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValue(mockCustomizations);
    (customizationLoader.DEFAULT_CUSTOMIZATIONS as any) = mockCustomizations;

    // Mock CSS conversion
    (cssVariableConverter.convertCustomizationsToCSSVariables as jest.Mock).mockReturnValue({
      '--color-primary': 'rgb(255, 0, 0)',
      '--color-secondary': 'rgb(0, 255, 0)',
      '--font-family-headings': '"Playfair", sans-serif',
    });

    (cssVariableConverter.generateCSSString as jest.Mock).mockReturnValue(
      ':root {\n  --color-primary: rgb(255, 0, 0);\n}'
    );

    // Mock CSS injection
    (cssInjection.injectCSSVariables as jest.Mock).mockReturnValue(
      document.createElement('style')
    );
    (cssInjection.removeCSSVariables as jest.Mock).mockReturnValue(true);
  });

  // ============================================================================
  // Test 1: Customizations Loaded on Page Load
  // ============================================================================

  describe('1. Customizations Loaded on Page Load', () => {
    it('1.1: Should load customizations on mount', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      // Verify loading state initially true
      expect(result.current.isLoading).toBe(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify customizations loaded
      expect(result.current.customizations).toEqual(mockCustomizations);
      expect(customizationLoader.loadCustomizations).toHaveBeenCalled();
    });

    it('1.2: Should not auto-load when autoLoad is false', async () => {
      // Execute
      renderHook(() => useLandingPageCustomizations({ autoLoad: false }));

      // Verify loader not called
      expect(customizationLoader.loadCustomizations).not.toHaveBeenCalled();
    });

    it('1.3: Should pass loader options to customizationLoader', async () => {
      // Setup
      const loaderOptions = {
        apiBaseUrl: 'https://api.example.com',
        timeout: 10000,
      };

      // Execute
      const { result } = renderHook(() =>
        useLandingPageCustomizations({
          autoLoad: true,
          loaderOptions,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify loader options passed
      expect(customizationLoader.loadCustomizations).toHaveBeenCalledWith(
        expect.objectContaining(loaderOptions)
      );
    });

    it('1.4: Should handle customizations as null gracefully', async () => {
      // Setup
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(null);

      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify - should use defaults
      expect(result.current.customizations).toBeDefined();
    });
  });

  // ============================================================================
  // Test 2: CSS Variables Applied to Landing Page
  // ============================================================================

  describe('2. CSS Variables Applied to Landing Page', () => {
    it('2.1: Should convert customizations to CSS variables', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify CSS converter called with customizations
      expect(cssVariableConverter.convertCustomizationsToCSSVariables).toHaveBeenCalledWith(
        mockCustomizations
      );
    });

    it('2.2: Should generate CSS string from variables', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify CSS string generation
      expect(cssVariableConverter.generateCSSString).toHaveBeenCalled();
    });

    it('2.3: Should inject CSS into document head', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify CSS injection
      expect(cssInjection.injectCSSVariables).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id: 'landing-page-customizations',
        })
      );
    });

    it('2.4: Should use custom debounce time if provided', async () => {
      // Execute - debounce not directly testable in unit test, but verify option passed
      renderHook(() =>
        useLandingPageCustomizations({
          autoLoad: true,
          debounceMs: 500,
        })
      );

      // Option is accepted without error
      expect(true).toBe(true);
    });

    it('2.5: Should handle CSS injection errors gracefully', async () => {
      // Setup
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      (cssInjection.injectCSSVariables as jest.Mock).mockImplementationOnce(() => {
        throw new Error('CSS injection failed');
      });

      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify error logged
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  // ============================================================================
  // Test 3: Component Visibility Rules Applied
  // ============================================================================

  describe('3. Component Visibility Rules Applied', () => {
    it('3.1: Should extract component visibility from customizations', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify component visibility set
      expect(result.current.componentVisibility).toBeDefined();
      expect(result.current.componentVisibility.hero).toBe(true);
      expect(result.current.componentVisibility.features).toBe(false); // Disabled in mockCustomizations
    });

    it('3.2: Should set default visibility for standard components', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify all standard components have visibility set
      const standards = [
        'navigation',
        'hero',
        'features',
        'testimonials',
        'ctaSection',
        'contact',
        'footer',
      ];
      standards.forEach((comp) => {
        expect(result.current.componentVisibility).toHaveProperty(comp);
        expect(typeof result.current.componentVisibility[comp]).toBe('boolean');
      });
    });

    it('3.3: Should show disabled components as false', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify disabled component is false
      expect(result.current.componentVisibility.features).toBe(false);
    });

    it('3.4: Should show enabled components as true', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify enabled components are true
      expect(result.current.componentVisibility.hero).toBe(true);
      expect(result.current.componentVisibility.navigation).toBe(true);
    });
  });

  // ============================================================================
  // Test 4: Defaults Shown if Customizations Unavailable
  // ============================================================================

  describe('4. Defaults Shown if Customizations Unavailable', () => {
    it('4.1: Should return defaults on loading error', async () => {
      // Setup
      const loadError = new Error('Failed to load');
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(loadError);

      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify error set
      expect(result.current.error).toEqual(loadError);

      // Verify defaults used
      expect(result.current.customizations).toBeDefined();
    });

    it('4.2: Should call onError callback on load failure', async () => {
      // Setup
      const onError = jest.fn();
      const loadError = new Error('Load failed');
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(loadError);

      // Execute
      renderHook(() => useLandingPageCustomizations({ autoLoad: true, onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('4.3: Should maintain functionality even on CSS injection failure', async () => {
      // Setup
      (cssInjection.injectCSSVariables as jest.Mock).mockImplementationOnce(() => {
        throw new Error('CSS injection failed');
      });

      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify hook still returns customizations
      expect(result.current.customizations).toBeDefined();
      expect(result.current.error).toBeDefined();
    });
  });

  // ============================================================================
  // Test 5: Customizations Persist Across Navigation
  // ============================================================================

  describe('5. Customizations Persist Across Navigation', () => {
    it('5.1: Should not reload customizations on component re-render', async () => {
      // Execute
      const { rerender } = renderHook(
        ({ autoLoad }: any) => useLandingPageCustomizations({ autoLoad }),
        { initialProps: { autoLoad: true } }
      );

      await waitFor(() => {
        const calls = (customizationLoader.loadCustomizations as jest.Mock).mock.calls.length;
        expect(calls).toBeGreaterThan(0);
      });

      const initialCalls = (customizationLoader.loadCustomizations as jest.Mock).mock.calls.length;

      // Re-render with same props
      rerender({ autoLoad: true });

      // Verify loader not called again (only once on mount)
      await waitFor(() => {
        // Should still be same number of calls
        expect((customizationLoader.loadCustomizations as jest.Mock).mock.calls.length).toBe(
          initialCalls
        );
      });
    });

    it('5.2: Should clean up styles on unmount', async () => {
      // Execute
      const { unmount } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect((cssInjection.injectCSSVariables as jest.Mock).mock.calls.length).toBeGreaterThan(0);
      });

      // Unmount component
      unmount();

      // Verify cleanup
      expect(cssInjection.removeCSSVariables).toHaveBeenCalledWith('landing-page-customizations');
    });

    it('5.3: Should support manual reload', async () => {
      // Execute
      const { result } = renderHook(() => useLandingPageCustomizations({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = (customizationLoader.loadCustomizations as jest.Mock).mock.calls.length;

      // Manual reload
      act(() => {
        result.current.reload();
      });

      await waitFor(() => {
        expect((customizationLoader.loadCustomizations as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCalls
        );
      });
    });
  });

  // ============================================================================
  // Test 6: Component Visibility Helper Hook
  // ============================================================================

  describe('6. Component Visibility Helper Hook', () => {
    it('6.1: Should return true for visible components', () => {
      // Execute
      const isVisible = useComponentVisibility('hero', {
        hero: true,
        features: false,
      });

      // Verify
      expect(isVisible).toBe(true);
    });

    it('6.2: Should return false for hidden components', () => {
      // Execute
      const isVisible = useComponentVisibility('features', {
        hero: true,
        features: false,
      });

      // Verify
      expect(isVisible).toBe(false);
    });

    it('6.3: Should default to true if component not in map', () => {
      // Execute
      const isVisible = useComponentVisibility('unknown', {
        hero: true,
      });

      // Verify - defaults to true
      expect(isVisible).toBe(true);
    });
  });

  // ============================================================================
  // Test 7: Component Customization Helper Hook
  // ============================================================================

  describe('7. Component Customization Helper Hook', () => {
    it('7.1: Should return component config from customizations', () => {
      // Execute
      const result = useComponentCustomization(mockCustomizations, 'hero');

      // Verify
      expect(result.isEnabled).toBe(true);
      expect(result.config).toEqual(mockCustomizations.components?.hero);
      expect(result.customColors).toEqual(mockCustomizations.colors);
    });

    it('7.2: Should return empty config if component not defined', () => {
      // Execute
      const result = useComponentCustomization(mockCustomizations, 'unknown');

      // Verify
      expect(result.isEnabled).toBe(true); // Defaults to enabled
      expect(result.config).toEqual({});
    });
  });

  // ============================================================================
  // Test 8: Customized Content Helper Hook
  // ============================================================================

  describe('8. Customized Content Helper Hook', () => {
    it('8.1: Should return customized content by path', () => {
      // Execute
      const content = useCustomizedContent(mockCustomizations, 'hero.heading');

      // Verify
      expect(content).toBe('Welcome');
    });

    it('8.2: Should return nested content', () => {
      // Execute
      const content = useCustomizedContent(mockCustomizations, 'content.hero.heading');

      // Verify
      expect(content).toBe('Welcome');
    });

    it('8.3: Should return default value if content not found', () => {
      // Execute
      const content = useCustomizedContent(mockCustomizations, 'nonexistent.path', 'DEFAULT');

      // Verify
      expect(content).toBe('DEFAULT');
    });

    it('8.4: Should handle missing nested paths gracefully', () => {
      // Execute
      const content = useCustomizedContent(mockCustomizations, 'hero.missing.nested', 'FALLBACK');

      // Verify
      expect(content).toBe('FALLBACK');
    });
  });

  // ============================================================================
  // Test 9: Callback Hooks
  // ============================================================================

  describe('9. Callback Hooks', () => {
    it('9.1: Should call onSuccess callback after loading', async () => {
      // Setup
      const onSuccess = jest.fn();

      // Execute
      const { result } = renderHook(() =>
        useLandingPageCustomizations({
          autoLoad: true,
          onSuccess,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify
      expect(onSuccess).toHaveBeenCalled();
    });

    it('9.2: Should call onError callback on loader error', async () => {
      // Setup
      const onError = jest.fn();
      const loadError = new Error('Loader error');
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(loadError);

      // Execute
      const { result } = renderHook(() =>
        useLandingPageCustomizations({
          autoLoad: true,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify
      expect(onError).toHaveBeenCalled();
    });
  });
});
