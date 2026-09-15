import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  injectCSSVariables,
  removeCSSVariables,
  clearAllCSSVariables,
  areCSSVariablesInjected,
  getInjectedCSS,
  createDebouncedCSSInjector,
  injectCSSWithDebounce,
  batchInjectCSS,
  getCSSVariableFromDocument,
  injectCSSWithFallback,
  validateCSSInjection,
} from './cssInjection';

/**
 * Unit Tests: CSS Injection Utility
 *
 * Tests the CSS injection utility for:
 * - Style tag created in document.head
 * - CSS variables injected correctly
 * - Previous style tag replaced on update
 * - Invalid CSS handled gracefully
 *
 * **Validates: Requirements 9.2, 9.3**
 */

describe('CSS Injection Utility', () => {
  const testStyleId = 'test-cms-styles';
  const testCSS = ':root { --color-primary: rgb(255, 0, 0); }';

  beforeEach(() => {
    // Clean up before each test
    const styleTag = document.getElementById(testStyleId);
    if (styleTag) {
      styleTag.remove();
    }
  });

  afterEach(() => {
    // Clean up after each test
    clearAllCSSVariables(testStyleId);
  });

  describe('injectCSSVariables', () => {
    it('should create style tag in document head', () => {
      const result = injectCSSVariables(testCSS, { id: testStyleId });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(testStyleId);
      expect(result?.parentElement).toBe(document.head);
    });

    it('should inject CSS content correctly', () => {
      injectCSSVariables(testCSS, { id: testStyleId });

      const styleTag = document.getElementById(testStyleId) as HTMLStyleElement;
      expect(styleTag.textContent).toBe(testCSS);
    });

    it('should have correct style type', () => {
      injectCSSVariables(testCSS, { id: testStyleId });

      const styleTag = document.getElementById(testStyleId) as HTMLStyleElement;
      expect(styleTag.type).toBe('text/css');
    });

    it('should replace existing style tag on update', () => {
      const css1 = ':root { --color-primary: rgb(255, 0, 0); }';
      const css2 = ':root { --color-primary: rgb(0, 255, 0); }';

      injectCSSVariables(css1, { id: testStyleId });
      const firstTag = document.getElementById(testStyleId);

      injectCSSVariables(css2, { id: testStyleId });
      const secondTag = document.getElementById(testStyleId);

      // Should be the same tag (updated, not replaced)
      expect(firstTag).toBe(secondTag);
      expect(secondTag?.textContent).toBe(css2);
    });

    it('should return null for empty CSS string', () => {
      const result = injectCSSVariables('', { id: testStyleId });
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only CSS', () => {
      const result = injectCSSVariables('   ', { id: testStyleId });
      expect(result).toBeNull();
    });

    it('should call onSuccess callback', () => {
      const onSuccess = vi.fn();
      injectCSSVariables(testCSS, { id: testStyleId, onSuccess });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback on failure', () => {
      const onError = vi.fn();
      injectCSSVariables('', { id: testStyleId, onError });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('removeCSSVariables', () => {
    it('should remove style tag from document', () => {
      injectCSSVariables(testCSS, { id: testStyleId });
      expect(document.getElementById(testStyleId)).not.toBeNull();

      removeCSSVariables(testStyleId);
      expect(document.getElementById(testStyleId)).toBeNull();
    });

    it('should return true when removing existing tag', () => {
      injectCSSVariables(testCSS, { id: testStyleId });
      const result = removeCSSVariables(testStyleId);

      expect(result).toBe(true);
    });

    it('should return false when tag does not exist', () => {
      const result = removeCSSVariables('nonexistent-id');
      expect(result).toBe(false);
    });
  });

  describe('clearAllCSSVariables', () => {
    it('should clear all CSS variables', () => {
      injectCSSVariables(testCSS, { id: testStyleId });
      expect(document.getElementById(testStyleId)).not.toBeNull();

      clearAllCSSVariables(testStyleId);
      expect(document.getElementById(testStyleId)).toBeNull();
    });

    it('should handle multiple style tags with same ID', () => {
      // Create multiple style tags with same ID (edge case)
      const tag1 = document.createElement('style');
      tag1.id = testStyleId;
      document.head.appendChild(tag1);

      const tag2 = document.createElement('style');
      tag2.id = testStyleId;
      document.head.appendChild(tag2);

      clearAllCSSVariables(testStyleId);

      const remaining = document.querySelectorAll(`style[id="${testStyleId}"]`);
      expect(remaining.length).toBe(0);
    });
  });

  describe('areCSSVariablesInjected', () => {
    it('should return true when CSS is injected', () => {
      injectCSSVariables(testCSS, { id: testStyleId });
      expect(areCSSVariablesInjected(testStyleId)).toBe(true);
    });

    it('should return false when CSS is not injected', () => {
      expect(areCSSVariablesInjected(testStyleId)).toBe(false);
    });

    it('should return false after CSS is removed', () => {
      injectCSSVariables(testCSS, { id: testStyleId });
      removeCSSVariables(testStyleId);

      expect(areCSSVariablesInjected(testStyleId)).toBe(false);
    });
  });

  describe('getInjectedCSS', () => {
    it('should retrieve injected CSS', () => {
      injectCSSVariables(testCSS, { id: testStyleId });
      const retrieved = getInjectedCSS(testStyleId);

      expect(retrieved).toBe(testCSS);
    });

    it('should return null when CSS not injected', () => {
      const retrieved = getInjectedCSS(testStyleId);
      expect(retrieved).toBeNull();
    });

    it('should return null when style tag exists but is empty', () => {
      const styleTag = document.createElement('style');
      styleTag.id = testStyleId;
      document.head.appendChild(styleTag);

      const retrieved = getInjectedCSS(testStyleId);
      expect(retrieved).toBeNull();

      styleTag.remove();
    });
  });

  describe('createDebouncedCSSInjector', () => {
    it('should debounce multiple calls', async () => {
      const injector = vi.fn();
      const debounced = createDebouncedCSSInjector(injector, 50);

      debounced('css1');
      debounced('css2');
      debounced('css3');

      expect(injector).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(injector).toHaveBeenCalledTimes(1);
      expect(injector).toHaveBeenCalledWith('css3');
    });

    it('should respect custom debounce delay', async () => {
      const injector = vi.fn();
      const debounced = createDebouncedCSSInjector(injector, 100);

      debounced('css');

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(injector).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(injector).toHaveBeenCalled();
    });
  });

  describe('injectCSSWithDebounce', () => {
    it('should inject CSS after debounce delay', async () => {
      injectCSSWithDebounce(testCSS, 50, testStyleId);

      expect(document.getElementById(testStyleId)).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(document.getElementById(testStyleId)).not.toBeNull();
      expect(getInjectedCSS(testStyleId)).toBe(testCSS);
    });

    it('should allow canceling pending injection', async () => {
      const cancel = injectCSSWithDebounce(testCSS, 100, testStyleId);

      cancel();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(document.getElementById(testStyleId)).toBeNull();
    });
  });

  describe('batchInjectCSS', () => {
    it('should merge and inject multiple CSS strings', () => {
      const css1 = ':root { --color-primary: rgb(255, 0, 0); }';
      const css2 = ':root { --color-secondary: rgb(0, 255, 0); }';

      batchInjectCSS([css1, css2], testStyleId);

      const injected = getInjectedCSS(testStyleId);
      expect(injected).toContain(css1);
      expect(injected).toContain(css2);
    });

    it('should filter empty strings', () => {
      const css1 = ':root { --color-primary: rgb(255, 0, 0); }';
      const css2 = '';
      const css3 = '   ';

      const result = batchInjectCSS([css1, css2, css3], testStyleId);

      expect(result).not.toBeNull();
      expect(result).toContain(css1);
      expect(result).not.toContain(css2);
    });

    it('should return null for all empty strings', () => {
      const result = batchInjectCSS(['', '   '], testStyleId);
      expect(result).toBeNull();
    });
  });

  describe('getCSSVariableFromDocument', () => {
    it('should get CSS variable value with -- prefix', () => {
      injectCSSVariables(':root { --test-color: rgb(255, 0, 0); }', { id: testStyleId });

      const value = getCSSVariableFromDocument('--test-color');
      expect(value).toBeDefined();
    });

    it('should get CSS variable value without -- prefix', () => {
      injectCSSVariables(':root { --test-color: rgb(255, 0, 0); }', { id: testStyleId });

      const value = getCSSVariableFromDocument('test-color');
      expect(value).toBeDefined();
    });

    it('should return null for non-existent variable', () => {
      const value = getCSSVariableFromDocument('--nonexistent-variable');
      expect(value).toBeNull();
    });

    it('should work with custom element', () => {
      const customElement = document.createElement('div');
      document.body.appendChild(customElement);

      injectCSSVariables(':root { --test-color: rgb(255, 0, 0); }', { id: testStyleId });

      const value = getCSSVariableFromDocument('--test-color', customElement);
      expect(value).toBeDefined();

      customElement.remove();
    });
  });

  describe('injectCSSWithFallback', () => {
    it('should use primary CSS when successful', () => {
      const primaryCSS = ':root { --color-primary: rgb(255, 0, 0); }';
      const fallbackCSS = ':root { --color-primary: rgb(0, 0, 0); }';

      const result = injectCSSWithFallback(primaryCSS, fallbackCSS, testStyleId);

      expect(result).toBe(true);
      expect(getInjectedCSS(testStyleId)).toBe(primaryCSS);
    });

    it('should use fallback CSS when primary fails', () => {
      const primaryCSS = '';
      const fallbackCSS = ':root { --color-primary: rgb(0, 0, 0); }';

      const result = injectCSSWithFallback(primaryCSS, fallbackCSS, testStyleId);

      expect(result).toBe(false);
      // Fallback should be injected with different ID
      expect(document.getElementById(`${testStyleId}-fallback`)).not.toBeNull();
    });
  });

  describe('validateCSSInjection', () => {
    it('should validate successful injection', () => {
      injectCSSVariables(testCSS, { id: testStyleId });

      const result = validateCSSInjection(testStyleId);

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('successfully injected');
    });

    it('should report when style tag not found', () => {
      const result = validateCSSInjection('nonexistent-id');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should report when style tag has no content', () => {
      const styleTag = document.createElement('style');
      styleTag.id = testStyleId;
      document.head.appendChild(styleTag);

      const result = validateCSSInjection(testStyleId);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no content');

      styleTag.remove();
    });

    it('should include validation details', () => {
      injectCSSVariables(testCSS, { id: testStyleId });

      const result = validateCSSInjection(testStyleId);

      expect(result.details).toBeDefined();
      expect(result.details?.styleTagFound).toBe(true);
      expect(result.details?.hasContent).toBe(true);
      expect(result.details?.contentLength).toBeGreaterThan(0);
    });
  });
});
