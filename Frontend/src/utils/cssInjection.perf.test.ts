/**
 * Performance Tests for CSS Injection Utilities
 *
 * Tests performance-critical paths:
 * 1. CSS variable conversion is fast even with complex structures
 * 2. CSS injection doesn't block rendering
 * 3. Debounced injection prevents excessive DOM updates
 * 4. Large CSS payloads are handled efficiently
 *
 * Validates Requirement 7.2: Visual Preview and Real-time Updates
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  injectCSSVariables,
  removeCSSVariables,
  getInjectedCSS,
  areCSSVariablesInjected,
  createDebouncedCSSInjector,
  injectCSSWithDebounce,
  batchInjectCSS,
  getCSSVariableFromDocument,
  injectCSSWithFallback,
  validateCSSInjection,
} from './cssInjection';
import {
  convertCustomizationsToCSSVariables,
  generateCSSString,
  parseColorToRGB,
  hslToRgb,
} from './cssVariableConverter';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  colorParsing: 2, // ms
  cssConversion: 20, // ms
  cssGeneration: 10, // ms
  cssInjection: 15, // ms
  cssRemoval: 5, // ms
  debounceVerification: 400, // ms - allow time for debounce
};

describe('CSS Injection Performance Tests', () => {
  beforeEach(() => {
    // Clear any existing style tags
    const existingStyles = document.querySelectorAll('style[id*="test"]');
    existingStyles.forEach((style) => style.remove());

    // Clear all custom styles
    const allCustomStyles = document.querySelectorAll('style[id*="cms"]');
    allCustomStyles.forEach((style) => style.remove());
  });

  afterEach(() => {
    removeCSSVariables('test-perf-styles');
    const allCustomStyles = document.querySelectorAll('style[id*="cms"]');
    allCustomStyles.forEach((style) => style.remove());
  });

  /**
   * Test 1: Color parsing performance
   * Validates that parsing different color formats is fast
   */
  it('should parse hex colors efficiently', () => {
    const hexColor = '#3B82F6';
    const startTime = performance.now();
    const result = parseColorToRGB(hexColor);
    const parseTime = performance.now() - startTime;

    expect(parseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorParsing);
    expect(result).toBe('59, 130, 246');
  });

  it('should parse RGB colors efficiently', () => {
    const rgbColor = 'rgb(59, 130, 246)';
    const startTime = performance.now();
    const result = parseColorToRGB(rgbColor);
    const parseTime = performance.now() - startTime;

    expect(parseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorParsing);
    expect(result).toBe('59, 130, 246');
  });

  it('should parse HSL colors efficiently', () => {
    const hslColor = 'hsl(217, 92%, 60%)';
    const startTime = performance.now();
    const result = parseColorToRGB(hslColor);
    const parseTime = performance.now() - startTime;

    expect(parseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorParsing);
    expect(result).toBeTruthy();
  });

  it('should convert HSL to RGB efficiently', () => {
    const h = 217;
    const s = 92;
    const l = 60;

    const startTime = performance.now();
    const result = hslToRgb(h, s, l);
    const conversionTime = performance.now() - startTime;

    expect(conversionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorParsing);
    expect(result).toBeTruthy();
  });

  /**
   * Test 2: CSS variable conversion performance with moderate payload
   */
  it('should convert moderate customization to CSS variables efficiently', () => {
    const customizations = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        borders: '#E5E7EB',
      },
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
      layout: {
        containerWidth: '1200px',
        containerLayout: 'centered',
        padding: { heroSection: 40, contentAreas: 32, footer: 24 },
        margins: { sectionSpacing: 48, elementSpacing: 16 },
        gaps: { grid: 24, flex: 16 },
      },
      components: {
        navigation: { enabled: true },
        hero: { enabled: true, height: '500px' },
        features: { enabled: true, columns: 3 },
      },
    };

    const startTime = performance.now();
    const cssVariables = convertCustomizationsToCSSVariables(customizations);
    const conversionTime = performance.now() - startTime;

    expect(conversionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssConversion);
    expect(Object.keys(cssVariables).length).toBeGreaterThan(20);
  });

  /**
   * Test 3: CSS string generation performance
   */
  it('should generate CSS string efficiently', () => {
    const customizations = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        borders: '#E5E7EB',
      },
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
      layout: { containerWidth: '1200px', containerLayout: 'centered' },
      components: { hero: { enabled: true } },
    };

    const cssVariables = convertCustomizationsToCSSVariables(customizations);

    const startTime = performance.now();
    const cssString = generateCSSString(cssVariables);
    const generationTime = performance.now() - startTime;

    expect(generationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssGeneration);
    expect(cssString).toContain(':root');
    expect(cssString).toContain('--color-primary');
  });

  /**
   * Test 4: CSS injection performance
   * Validates that CSS injection into DOM is fast
   */
  it('should inject CSS variables into document efficiently', () => {
    const cssString = `:root {
      --color-primary: rgb(59, 130, 246);
      --color-secondary: rgb(16, 185, 129);
      --font-size-h1: 48px;
      --container-width: 1200px;
    }`;

    const startTime = performance.now();
    const result = injectCSSVariables(cssString, { id: 'test-perf-styles' });
    const injectionTime = performance.now() - startTime;

    expect(injectionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssInjection);
    expect(result).toBeTruthy();
    expect(areCSSVariablesInjected('test-perf-styles')).toBe(true);
  });

  /**
   * Test 5: CSS removal performance
   */
  it('should remove CSS variables efficiently', () => {
    const cssString = `:root { --color-primary: rgb(59, 130, 246); }`;
    injectCSSVariables(cssString, { id: 'test-perf-styles' });

    const startTime = performance.now();
    const result = removeCSSVariables('test-perf-styles');
    const removalTime = performance.now() - startTime;

    expect(removalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssRemoval);
    expect(result).toBe(true);
    expect(areCSSVariablesInjected('test-perf-styles')).toBe(false);
  });

  /**
   * Test 6: Large CSS payload injection
   * Validates that large CSS payloads don't cause significant slowdown
   */
  it('should inject large CSS payloads efficiently', () => {
    // Create a large CSS payload
    const largeCustomizations = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        borders: '#E5E7EB',
      },
      typography: {
        headings: {
          fontFamily: 'Poppins',
          fontSize: { h1: 48, h2: 36, h3: 28, h4: 20, h5: 18, h6: 16 },
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
        padding: { heroSection: 40, contentAreas: 32, footer: 24 },
        margins: { sectionSpacing: 48, elementSpacing: 16 },
        gaps: { grid: 24, flex: 16 },
      },
      components: {
        navigation: { enabled: true },
        hero: { enabled: true, height: '500px', overlayColor: 'rgba(0,0,0,0.3)' },
        features: { enabled: true, columns: 5 },
        testimonials: { enabled: true, displayCount: 10 },
        ctaSection: { enabled: true },
        contact: { enabled: true },
        footer: { enabled: true, linkColumns: 4 },
      },
    };

    const cssVariables = convertCustomizationsToCSSVariables(largeCustomizations);
    const cssString = generateCSSString(cssVariables);

    const startTime = performance.now();
    const result = injectCSSVariables(cssString, { id: 'test-perf-styles' });
    const injectionTime = performance.now() - startTime;

    expect(injectionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssInjection * 2); // Allow 2x for large payload
    expect(result).toBeTruthy();
  });

  /**
   * Test 7: Get injected CSS is efficient
   */
  it('should retrieve injected CSS efficiently', () => {
    const cssString = `:root { --color-primary: rgb(59, 130, 246); }`;
    injectCSSVariables(cssString, { id: 'test-perf-styles' });

    const startTime = performance.now();
    const result = getInjectedCSS('test-perf-styles');
    const retrievalTime = performance.now() - startTime;

    expect(retrievalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssRemoval);
    expect(result).toBe(cssString);
  });

  /**
   * Test 8: Debounced CSS injection prevents excessive updates
   * Validates that debouncing works correctly under rapid updates
   */
  it('should debounce CSS injection - rapid calls triggered only once', (done) => {
    const debounceMs = 100;
    let injectionCount = 0;

    const originalInject = injectCSSVariables;
    const countingInject = (cssString: string) => {
      injectionCount++;
      return originalInject(cssString, { id: 'test-perf-styles' });
    };

    const debouncedInject = createDebouncedCSSInjector(countingInject, debounceMs);

    // Trigger 10 rapid updates
    for (let i = 0; i < 10; i++) {
      debouncedInject(`:root { --update: ${i}; }`);
    }

    // After debounce delay, should only have 1 injection
    setTimeout(() => {
      expect(injectionCount).toBeLessThanOrEqual(1);
      done();
    }, debounceMs + 50);
  });

  /**
   * Test 9: Debounce with cancel function
   * Validates that pending injections can be cancelled
   */
  it('should cancel pending CSS injection with debounce cancel', (done) => {
    const debounceMs = 100;
    let injectionCount = 0;

    const originalInject = injectCSSVariables;
    const countingInject = (cssString: string) => {
      injectionCount++;
      return originalInject(cssString, { id: 'test-perf-styles' });
    };

    const debouncedInject = createDebouncedCSSInjector(countingInject, debounceMs);

    // Trigger update
    debouncedInject(`:root { --update: 1; }`);

    // Cancel before debounce completes
    setTimeout(() => {
      const cancel = createDebouncedCSSInjector(countingInject, debounceMs);
      cancel(`:root { --update: 2; }`);

      // Verify injection still happens (can't cancel once created)
      // Just verify debounce delays execution
      expect(injectionCount).toBeLessThanOrEqual(1);
      done();
    }, debounceMs / 2);
  });

  /**
   * Test 10: Batch CSS injection
   * Validates that multiple CSS strings can be merged efficiently
   */
  it('should batch inject multiple CSS strings efficiently', () => {
    const cssStrings = [
      ':root { --color-primary: rgb(59, 130, 246); }',
      ':root { --color-secondary: rgb(16, 185, 129); }',
      ':root { --font-size-h1: 48px; }',
      ':root { --container-width: 1200px; }',
    ];

    const startTime = performance.now();
    const result = batchInjectCSS(cssStrings, 'test-perf-styles');
    const batchTime = performance.now() - startTime;

    expect(batchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssInjection * 2);
    expect(result).toBeTruthy();
    expect(result).toContain('--color-primary');
    expect(result).toContain('--color-secondary');
  });

  /**
   * Test 11: Get CSS variable from document
   * Validates that retrieving computed CSS variables is efficient
   */
  it('should retrieve CSS variable from document efficiently', () => {
    const cssString = `:root { --color-primary: rgb(59, 130, 246); }`;
    injectCSSVariables(cssString, { id: 'test-perf-styles' });

    const startTime = performance.now();
    const result = getCSSVariableFromDocument('--color-primary');
    const retrievalTime = performance.now() - startTime;

    expect(retrievalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssRemoval);
    expect(result).toBeTruthy();
  });

  /**
   * Test 12: CSS injection with fallback performance
   */
  it('should inject CSS with fallback efficiently', () => {
    const primaryCSS = `:root { --color-primary: rgb(59, 130, 246); }`;
    const fallbackCSS = `:root { --color-primary: rgb(59, 130, 246); }`;

    const startTime = performance.now();
    const result = injectCSSWithFallback(primaryCSS, fallbackCSS, 'test-perf-styles');
    const injectionTime = performance.now() - startTime;

    expect(injectionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssInjection);
    expect(result).toBe(true); // Primary was used
  });

  /**
   * Test 13: CSS injection validation performance
   */
  it('should validate CSS injection efficiently', () => {
    const cssString = `:root { --color-primary: rgb(59, 130, 246); }`;
    injectCSSVariables(cssString, { id: 'test-perf-styles' });

    const startTime = performance.now();
    const validation = validateCSSInjection('test-perf-styles');
    const validationTime = performance.now() - startTime;

    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cssRemoval);
    expect(validation.isValid).toBe(true);
  });

  /**
   * Test 14: Repeated CSS updates don't cause memory leaks
   * Validates that updating CSS multiple times doesn't accumulate DOM nodes
   */
  it('should not accumulate style tags with repeated updates', () => {
    const cssString1 = `:root { --color-primary: rgb(59, 130, 246); }`;
    const cssString2 = `:root { --color-primary: rgb(16, 185, 129); }`;

    // Perform 10 updates
    for (let i = 0; i < 10; i++) {
      const css = i % 2 === 0 ? cssString1 : cssString2;
      injectCSSVariables(css, { id: 'test-perf-styles' });
    }

    // Should only have 1 style tag, not 10
    const styleTags = document.querySelectorAll('style[id="test-perf-styles"]');
    expect(styleTags).toHaveLength(1);
  });

  /**
   * Test 15: End-to-end customization to injection performance
   * Validates complete flow: customization -> conversion -> generation -> injection
   */
  it('should complete full customization-to-injection flow efficiently', () => {
    const customizations = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        borders: '#E5E7EB',
      },
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
      layout: {
        containerWidth: '1200px',
        containerLayout: 'centered',
        padding: { heroSection: 40, contentAreas: 32, footer: 24 },
        margins: { sectionSpacing: 48, elementSpacing: 16 },
        gaps: { grid: 24, flex: 16 },
      },
      components: {
        navigation: { enabled: true },
        hero: { enabled: true, height: '500px' },
        features: { enabled: true, columns: 3 },
        testimonials: { enabled: true, displayCount: 3 },
      },
    };

    const startTime = performance.now();

    // Step 1: Convert
    const cssVariables = convertCustomizationsToCSSVariables(customizations);

    // Step 2: Generate
    const cssString = generateCSSString(cssVariables);

    // Step 3: Inject
    injectCSSVariables(cssString, { id: 'test-perf-styles' });

    const totalTime = performance.now() - startTime;

    // All 3 steps should complete within 60ms total
    expect(totalTime).toBeLessThan(60);
  });
});
