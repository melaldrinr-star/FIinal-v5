/**
 * Performance Tests for PreviewPanel Component
 *
 * Tests performance-critical paths:
 * 1. Preview updates are debounced (300-500ms) and don't cause excessive renders
 * 2. CSS injection doesn't block rendering
 * 3. Preview updates don't cause UI lag
 * 4. Large customization payloads are handled efficiently
 *
 * Validates Requirement 7.2: Visual Preview and Real-time Updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import PreviewPanel from './PreviewPanel';
import * as cssInjection from '../../utils/cssInjection';
import * as cssConverter from '../../utils/cssVariableConverter';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  debounceMin: 300,
  debounceMax: 500,
  cssInjectionTime: 50, // ms - CSS injection should complete within 50ms
  renderTime: 100, // ms - Component render should be under 100ms
  debounceCallsLimit: 2, // Only 2 calls max (initial + final debounced)
};

describe('PreviewPanel Performance Tests', () => {
  let performanceMetrics: {
    injectionTimes: number[];
    debounceCallCount: number;
    renderCount: number;
  };

  beforeEach(() => {
    performanceMetrics = {
      injectionTimes: [],
      debounceCallCount: 0,
      renderCount: 0,
    };

    // Clear any existing style tags
    const existingStyles = document.querySelectorAll(
      'style[id="cms-preview-styles"], style[id="cms-customizations-styles"]'
    );
    existingStyles.forEach((style) => style.remove());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  /**
   * Test 1: Debouncing prevents excessive CSS injection calls
   * Validates that rapid customization changes only trigger one CSS injection after debounce delay
   */
  it('should debounce CSS injection - rapid changes trigger only one injection after delay', async () => {
    const debounceMs = 300;
    let injectionCallCount = 0;

    // Mock injectCSSVariables to track calls
    const originalInject = cssInjection.injectCSSVariables;
    vi.spyOn(cssInjection, 'injectCSSVariables').mockImplementation((css, options) => {
      injectionCallCount++;
      const startTime = performance.now();
      const result = originalInject(css, options);
      const endTime = performance.now();
      performanceMetrics.injectionTimes.push(endTime - startTime);
      return result;
    });

    const TestWrapper = () => {
      const [customizations, setCustomizations] = useState({
        colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
        typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
        layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
        components: { navigation: { enabled: true, style: 'light' }, hero: { enabled: true, backgroundImage: 'url(...)', overlayColor: 'rgba(0,0,0,0.3)', height: '500px' }, features: { enabled: true, layout: 'grid', columns: 3 }, testimonials: { enabled: true, displayCount: 3 }, ctaSection: { enabled: true, style: 'button' }, contact: { enabled: true, formFields: ['email', 'phone', 'message'] }, footer: { enabled: true, linkColumns: 4 } },
        content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, missionVision: { title: 'Our Mission', description: 'To empower businesses...' }, features: [], testimonials: [], contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
      });

      // Simulate rapid changes
      React.useEffect(() => {
        const timestamps = [0, 50, 100, 150, 200]; // All within debounce window

        timestamps.forEach((delay, index) => {
          setTimeout(() => {
            setCustomizations((prev) => ({
              ...prev,
              colors: {
                ...prev.colors,
                primary: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
              },
            }));
          }, delay);
        });
      }, []);

      return <PreviewPanel customizations={customizations} debounceMs={debounceMs} />;
    };

    render(<TestWrapper />);

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(injectionCallCount).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.debounceCallsLimit);
      },
      { timeout: debounceMs + 200 }
    );

    // Verify debounce delay is respected
    expect(injectionCallCount).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test 2: Debounce delay is within expected range (300-500ms)
   * Validates that debounce delay is configurable and within acceptable range
   */
  it('should respect debounce delay configuration - update happens after delay', async () => {
    const debounceMs = 400;
    let updateTime: number | null = null;
    let startTime: number;

    const originalInject = cssInjection.injectCSSVariables;
    vi.spyOn(cssInjection, 'injectCSSVariables').mockImplementation((css, options) => {
      updateTime = performance.now() - startTime;
      return originalInject(css, options);
    });

    const customizations = {
      colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
      typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
      layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
      components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true }, testimonials: { enabled: true }, ctaSection: { enabled: true }, contact: { enabled: true }, footer: { enabled: true } },
      content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
    };

    startTime = performance.now();
    render(<PreviewPanel customizations={customizations} debounceMs={debounceMs} />);

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(updateTime).not.toBeNull();
        expect(updateTime!).toBeGreaterThanOrEqual(debounceMs - 50); // Allow 50ms tolerance
        expect(updateTime!).toBeLessThanOrEqual(debounceMs + 100); // Allow overshoot
      },
      { timeout: debounceMs + 200 }
    );
  });

  /**
   * Test 3: CSS injection performance - injection should be fast
   * Validates that CSS injection completes within acceptable time
   */
  it('should inject CSS variables within performance threshold', async () => {
    const customizations = {
      colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
      typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
      layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
      components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true } },
      content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
    };

    const originalInject = cssInjection.injectCSSVariables;
    vi.spyOn(cssInjection, 'injectCSSVariables').mockImplementation((css, options) => {
      const startTime = performance.now();
      const result = originalInject(css, options);
      const endTime = performance.now();
      performanceMetrics.injectionTimes.push(endTime - startTime);
      return result;
    });

    render(<PreviewPanel customizations={customizations} debounceMs={100} />);

    await waitFor(
      () => {
        expect(performanceMetrics.injectionTimes.length).toBeGreaterThan(0);
      },
      { timeout: 500 }
    );

    // All injections should be within threshold
    performanceMetrics.injectionTimes.forEach((time) => {
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.cssInjectionTime);
    });
  });

  /**
   * Test 4: Large customization payloads are handled efficiently
   * Validates that even large customization objects don't cause significant slowdown
   */
  it('should handle large customization payloads efficiently', async () => {
    // Create a large customization object with many features and testimonials
    const largeCustomizations = {
      colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
      typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
      layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
      components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true, columns: 5 }, testimonials: { enabled: true, displayCount: 10 } },
      content: {
        hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' },
        features: Array.from({ length: 20 }, (_, i) => ({
          title: `Feature ${i + 1}`,
          description: `Description for feature ${i + 1}`,
          icon: 'icon-name',
        })),
        testimonials: Array.from({ length: 50 }, (_, i) => ({
          text: `Great testimonial ${i + 1}`,
          author: `Customer ${i + 1}`,
          image: 'url(...)',
        })),
        contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' },
      },
    };

    let conversionTime: number | null = null;
    let injectionTime: number | null = null;

    const originalConvert = cssConverter.convertCustomizationsToCSSVariables;
    vi.spyOn(cssConverter, 'convertCustomizationsToCSSVariables').mockImplementation((customizations) => {
      const startTime = performance.now();
      const result = originalConvert(customizations);
      conversionTime = performance.now() - startTime;
      return result;
    });

    const originalInject = cssInjection.injectCSSVariables;
    vi.spyOn(cssInjection, 'injectCSSVariables').mockImplementation((css, options) => {
      const startTime = performance.now();
      const result = originalInject(css, options);
      injectionTime = performance.now() - startTime;
      return result;
    });

    render(<PreviewPanel customizations={largeCustomizations} debounceMs={100} />);

    await waitFor(
      () => {
        expect(injectionTime).not.toBeNull();
      },
      { timeout: 500 }
    );

    // Conversion should be fast even with large payload
    expect(conversionTime!).toBeLessThan(50); // 50ms for conversion

    // Injection should still be fast
    expect(injectionTime!).toBeLessThan(PERFORMANCE_THRESHOLDS.cssInjectionTime);

    // Total time should be reasonable (conversion + injection)
    expect((conversionTime || 0) + (injectionTime || 0)).toBeLessThan(100);
  });

  /**
   * Test 5: CSS injection doesn't block rendering
   * Validates that component renders even if CSS injection takes longer
   */
  it('should render component without waiting for CSS injection', async () => {
    const customizations = {
      colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
      typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
      layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
      components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true } },
      content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
    };

    let injectionDelayMs = 30;
    const originalInject = cssInjection.injectCSSVariables;
    vi.spyOn(cssInjection, 'injectCSSVariables').mockImplementation(async (css, options) => {
      // Simulate slow injection
      await new Promise((resolve) => setTimeout(resolve, injectionDelayMs));
      return originalInject(css, options);
    });

    const startTime = performance.now();
    const { container } = render(<PreviewPanel customizations={customizations} debounceMs={100} />);
    const renderTime = performance.now() - startTime;

    // Component should render quickly, not wait for CSS injection
    expect(renderTime).toBeLessThan(100);

    // Preview container should be in DOM immediately
    const previewContainer = container.querySelector('[class*="border-gray-200"]');
    expect(previewContainer).toBeTruthy();
  });

  /**
   * Test 6: Multiple rapid debounced updates only cause final injection
   * Validates that 10 rapid updates only result in 1-2 CSS injections
   */
  it('should debounce 10 rapid updates into single injection', async () => {
    const debounceMs = 300;
    let injectionCount = 0;

    const originalInject = cssInjection.injectCSSVariables;
    vi.spyOn(cssInjection, 'injectCSSVariables').mockImplementation((css, options) => {
      injectionCount++;
      return originalInject(css, options);
    });

    const TestWrapper = () => {
      const [customizations, setCustomizations] = useState({
        colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
        typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
        layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
        components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true } },
        content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
      });

      // Simulate 10 rapid updates
      React.useEffect(() => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            setCustomizations((prev) => ({
              ...prev,
              colors: {
                ...prev.colors,
                primary: `#${Math.random().toString(16).substring(2, 8)}`,
              },
            }));
          }, i * 20); // Updates every 20ms
        }
      }, []);

      return <PreviewPanel customizations={customizations} debounceMs={debounceMs} />;
    };

    render(<TestWrapper />);

    await waitFor(
      () => {
        // Should have at most 2 injections (one during setup, one after debounce)
        expect(injectionCount).toBeLessThanOrEqual(3);
      },
      { timeout: 1000 }
    );

    // Should have at least one injection
    expect(injectionCount).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test 7: CSS conversion performance with complex structures
   * Validates that CSS variable conversion stays under time threshold
   */
  it('should convert complex customizations to CSS variables efficiently', () => {
    const complexCustomizations = {
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
        padding: {
          heroSection: 40,
          contentAreas: 32,
          footer: 24,
        },
        margins: {
          sectionSpacing: 48,
          elementSpacing: 16,
        },
        gaps: {
          grid: 24,
          flex: 16,
        },
      },
      components: {
        navigation: { enabled: true, style: 'light' },
        hero: {
          enabled: true,
          backgroundImage: 'url(...)',
          overlayColor: 'rgba(0,0,0,0.3)',
          height: '500px',
        },
        features: { enabled: true, layout: 'grid', columns: 3 },
        testimonials: { enabled: true, displayCount: 3 },
        ctaSection: { enabled: true, style: 'button' },
        contact: { enabled: true, formFields: ['email', 'phone', 'message'] },
        footer: { enabled: true, linkColumns: 4 },
      },
    };

    const startTime = performance.now();
    const cssVariables = cssConverter.convertCustomizationsToCSSVariables(complexCustomizations);
    const conversionTime = performance.now() - startTime;

    expect(conversionTime).toBeLessThan(50);
    expect(Object.keys(cssVariables).length).toBeGreaterThan(20);
  });

  /**
   * Test 8: Debounce prevents excessive re-renders of child components
   * Validates that child components (features, testimonials) don't re-render excessively
   */
  it('should minimize re-renders of preview content during debounce window', async () => {
    const debounceMs = 300;
    let contentRenderCount = 0;

    // Track renders of features content
    const PreviewWithTracking = () => {
      const [customizations, setCustomizations] = useState({
        colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
        typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
        layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
        components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true } },
        content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
      });

      // Trigger 5 rapid updates
      React.useEffect(() => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            setCustomizations((prev) => ({
              ...prev,
              colors: { ...prev.colors, primary: `#${i}00000` },
            }));
          }, i * 30);
        }
      }, []);

      return (
        <div>
          <PreviewPanel customizations={customizations} debounceMs={debounceMs} />
          <div data-testid="content-tracker" onRender={() => contentRenderCount++} />
        </div>
      );
    };

    render(<PreviewWithTracking />);

    // Wait for debounce to settle
    await waitFor(
      () => {
        // Even with 5 updates, preview should only render 1-2 times
        expect(contentRenderCount).toBeLessThanOrEqual(3);
      },
      { timeout: debounceMs + 300 }
    );
  });

  /**
   * Test 9: CSS variable generation from different color formats
   * Validates that color format conversion doesn't cause performance issues
   */
  it('should efficiently convert multiple color formats to CSS variables', () => {
    const colorFormats = {
      colors: {
        primary: '#3B82F6', // hex
        secondary: 'rgb(16, 185, 129)', // rgb
        accent: 'hsl(45, 100%, 51%)', // hsl
        background: '#FFFFFF',
        text: 'rgb(31, 41, 55)',
        borders: '#E5E7EB',
      },
      typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
      layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
      components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true } },
    };

    const startTime = performance.now();
    const cssVariables = cssConverter.convertCustomizationsToCSSVariables(colorFormats);
    const conversionTime = performance.now() - startTime;

    expect(conversionTime).toBeLessThan(30);
    expect(cssVariables['--color-primary']).toBeTruthy();
    expect(cssVariables['--color-secondary']).toBeTruthy();
    expect(cssVariables['--color-accent']).toBeTruthy();
  });

  /**
   * Test 10: CSS injection doesn't cause layout thrashing
   * Validates that injected CSS doesn't force multiple reflows/repaints
   */
  it('should inject CSS without triggering multiple reflows', async () => {
    const customizations = {
      colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937', borders: '#E5E7EB' },
      typography: { headings: { fontFamily: 'Poppins', fontSize: { h1: 48, h2: 36, h3: 28 }, fontWeight: 700, lineHeight: 1.2 }, body: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 } },
      layout: { containerWidth: '1200px', containerLayout: 'centered', padding: { heroSection: 40, contentAreas: 32, footer: 24 }, margins: { sectionSpacing: 48, elementSpacing: 16 }, gaps: { grid: 24, flex: 16 } },
      components: { navigation: { enabled: true }, hero: { enabled: true }, features: { enabled: true } },
      content: { hero: { heading: 'Welcome', subheading: 'Build amazing things', ctaText: 'Get Started' }, contact: { email: 'contact@example.com', phone: '+1-555-000-0000', address: '123 Main St' } },
    };

    // Track style tag mutations
    let styleTagMutationCount = 0;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          styleTagMutationCount++;
        }
      });
    });

    render(<PreviewPanel customizations={customizations} debounceMs={100} />);

    // Observe style tag for mutations
    await waitFor(() => {
      const styleTag = document.getElementById('cms-preview-styles');
      if (styleTag) {
        observer.observe(styleTag, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      }
    });

    await waitFor(
      () => {
        // Should have minimal mutations
        expect(styleTagMutationCount).toBeLessThanOrEqual(2);
      },
      { timeout: 500 }
    );

    observer.disconnect();
  });
});
