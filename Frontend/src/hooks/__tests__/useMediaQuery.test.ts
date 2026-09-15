import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMediaQuery, breakpoints } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaListeners: Record<string, Array<(event: any) => void>> = {};

  const createMatchMedia = (matches: boolean) => {
    return (query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn((event: string, listener: (event: any) => void) => {
        if (event === 'change') {
          if (!matchMediaListeners[query]) {
            matchMediaListeners[query] = [];
          }
          matchMediaListeners[query].push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string) => {
        if (event === 'change' && matchMediaListeners[query]) {
          matchMediaListeners[query] = [];
        }
      }),
    });
  };

  beforeEach(() => {
    matchMediaListeners = {};
    // Set up default window.matchMedia for testing
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const isDesktop = query === '(min-width: 1024px)';
      return createMatchMedia(isDesktop)(query);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial match status', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(typeof result.current).toBe('boolean');
  });

  it('should detect desktop breakpoint correctly', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(min-width: 1024px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);
  });

  it('should detect mobile breakpoint correctly', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(max-width: 639px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(true);
  });

  it('should add event listener on mount', () => {
    const addEventListenerMock = vi.fn();

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(min-width: 1024px)',
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
    });

    renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerMock = vi.fn();
    const addEventListenerMock = vi.fn();

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(min-width: 1024px)',
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should handle complex media queries', () => {
    const complexQuery = '(min-width: 768px) and (max-width: 1023px)';

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: complexQuery,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery(complexQuery));

    expect(window.matchMedia).toHaveBeenCalledWith(complexQuery);
    expect(result.current).toBe(false);
  });
});

describe('breakpoints', () => {
  it('should export common breakpoint queries', () => {
    expect(breakpoints.mobile).toBe('(max-width: 639px)');
    expect(breakpoints.tablet).toBe('(min-width: 768px) and (max-width: 1023px)');
    expect(breakpoints.desktop).toBe('(min-width: 1024px)');
    expect(breakpoints.wide).toBe('(min-width: 1280px)');
    expect(breakpoints.ultraWide).toBe('(min-width: 1536px)');
  });
});
