import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

/**
 * Preservation Property Tests for ThemeContext
 * 
 * These tests PASS on the current UNFIXED code and verify that existing 
 * functionality is preserved after the null reference fix is applied.
 * They validate the baseline behavior that must be maintained.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Preservation Properties:
 * - For all properly wrapped components: useTheme returns context object
 * - For all theme toggle operations: preference is saved and restored
 * - For all localStorage availability states: persistence works or fails gracefully
 */

describe('ThemeContext - Preservation Properties (Before Fix)', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    
    global.localStorage = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
      length: 0,
      key: (index: number) => Object.keys(localStorageMock)[index] || null,
    } as Storage;

    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
  });

  // =====================================================
  // Property 3.1: useTheme Inside ThemeProvider Context
  // =====================================================

  /**
   * Property: For ANY component properly wrapped in ThemeProvider,
   * useTheme() returns a valid context object with isDark and toggleTheme.
   * 
   * This property tests preservation of core hook functionality when used correctly.
   * 
   * **Validates: Requirement 3.1**
   */
  it('should preserve useTheme returning valid context when inside ThemeProvider', () => {
    let capturedContext: { isDark: boolean; toggleTheme: () => void } | null = null;

    const TestComponent = () => {
      const context = useTheme();
      capturedContext = context;
      return <div data-testid="test">{context.isDark ? 'dark' : 'light'}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Property 1: Context is not null/undefined
    expect(capturedContext).not.toBeNull();
    expect(capturedContext).not.toBeUndefined();

    // Property 2: Context has required properties
    expect(capturedContext).toHaveProperty('isDark');
    expect(capturedContext).toHaveProperty('toggleTheme');

    // Property 3: isDark is a boolean
    expect(typeof capturedContext?.isDark).toBe('boolean');

    // Property 4: toggleTheme is a function
    expect(typeof capturedContext?.toggleTheme).toBe('function');
  });

  /**
   * Property: For ANY component correctly wrapped in ThemeProvider,
   * the toggleTheme function inverts isDark state when called.
   * 
   * This property ensures toggle functionality is preserved.
   * 
   * **Validates: Requirement 3.1, 3.2**
   */
  it('should preserve toggleTheme inverting isDark state', async () => {
    let currentIsDark: boolean | null = null;

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      currentIsDark = isDark;
      return (
        <button onClick={toggleTheme} data-testid="toggle">
          {isDark ? 'dark' : 'light'}
        </button>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const user = userEvent.setup();
    const toggleBtn = screen.getByTestId('toggle');

    // Property: Toggling inverts the state
    const beforeToggle = currentIsDark;
    await user.click(toggleBtn);
    const afterToggle = currentIsDark;

    expect(afterToggle).toBe(!beforeToggle);

    // Property: Toggling twice returns to original state
    await user.click(toggleBtn);
    expect(currentIsDark).toBe(beforeToggle);
  });

  // =====================================================
  // Property 3.2: Multiple Components Share Theme State
  // =====================================================

  /**
   * Property: For ANY number of child components inside ThemeProvider,
   * all components receive the same isDark value when hook is called.
   * 
   * This property ensures theme state is shared correctly across components.
   * 
   * **Validates: Requirement 3.2**
   */
  it('should preserve consistent isDark value across child components', () => {
    const capturedStates: boolean[] = [];

    const ChildComponent = ({ id }: { id: number }) => {
      const { isDark } = useTheme();
      capturedStates.push(isDark);
      return <div data-testid={`child-${id}`}>{isDark ? 'dark' : 'light'}</div>;
    };

    const ParentComponent = () => {
      return (
        <div>
          <ChildComponent id={1} />
          <ChildComponent id={2} />
          <ChildComponent id={3} />
        </div>
      );
    };

    render(
      <ThemeProvider>
        <ParentComponent />
      </ThemeProvider>
    );

    // Property 1: All children got values
    expect(capturedStates.length).toBe(3);

    // Property 2: All children have the same isDark value
    const firstValue = capturedStates[0];
    capturedStates.forEach((value) => {
      expect(value).toBe(firstValue);
    });
  });

  // =====================================================
  // Property 3.3: localStorage Persistence
  // =====================================================

  /**
   * Property: For ANY sequence of theme toggles, localStorage persists
   * the theme preference under 'bmdc-theme' key with value 'dark' or 'light'.
   * 
   * This property ensures persistence mechanism is preserved.
   * 
   * **Validates: Requirement 3.3, 3.5**
   */
  it('should preserve localStorage persistence across toggles', async () => {
    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Property 1: Initial state is in localStorage
    const initialState = screen.getByTestId('state').textContent as string;
    expect(localStorageMock['bmdc-theme']).toBe(initialState);

    const user = userEvent.setup();
    const toggleBtn = screen.getByTestId('toggle');

    // Property 2: After toggles, localStorage is updated
    for (let i = 0; i < 2; i++) {
      await user.click(toggleBtn);
      await waitFor(() => {
        const currentState = screen.getByTestId('state').textContent;
        const expectedValue = currentState;
        expect(localStorageMock['bmdc-theme']).toBe(expectedValue);
      });
    }

    // Property 3: localStorage key is exactly 'bmdc-theme'
    expect(Object.keys(localStorageMock)).toContain('bmdc-theme');
  });

  /**
   * Property: For ANY initial theme state stored in localStorage,
   * ThemeProvider reads and applies it on initialization.
   * 
   * This property ensures theme restoration from storage works.
   * 
   * **Validates: Requirement 3.4**
   */
  it('should preserve theme restoration from localStorage on initialization', () => {
    let capturedInitialState: boolean | null = null;

    const TestComponent = () => {
      const { isDark } = useTheme();
      if (capturedInitialState === null) {
        capturedInitialState = isDark;
      }
      return <div data-testid="test">{isDark ? 'dark' : 'light'}</div>;
    };

    // Set initial state in localStorage
    localStorageMock['bmdc-theme'] = 'dark';

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Property: Initial isDark matches localStorage value
    expect(capturedInitialState).toBe(true);
  });

  // =====================================================
  // Property 3.4: DOM Class Application
  // =====================================================

  /**
   * Property: For ANY isDark state, document.documentElement has 'dark' class
   * if and only if isDark is true.
   * 
   * This property ensures DOM class management is preserved.
   * 
   * **Validates: Requirement 3.4**
   */
  it('should preserve dark class application matching isDark state', async () => {
    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const user = userEvent.setup();
    const toggleBtn = screen.getByTestId('toggle');

    // Property 1: Initial dark class matches initial isDark
    let currentState = screen.getByTestId('state').textContent as string;
    let hasDarkClass = document.documentElement.classList.contains('dark');
    expect(hasDarkClass).toBe(currentState === 'dark');

    // Property 2: After toggles, class matches isDark
    for (let i = 0; i < 2; i++) {
      await user.click(toggleBtn);
      await waitFor(() => {
        currentState = screen.getByTestId('state').textContent as string;
        hasDarkClass = document.documentElement.classList.contains('dark');
        expect(hasDarkClass).toBe(currentState === 'dark');
      });
    }
  });

  // =====================================================
  // Property 3.5: localStorage Fallback Behavior
  // =====================================================

  /**
   * Property: For ANY theme state, when localStorage is unavailable,
   * ThemeProvider continues to work with default (light) theme.
   * 
   * This property ensures robustness when storage fails.
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve functionality when localStorage is unavailable', () => {
    const originalLocalStorage = global.localStorage;

    // Mock localStorage to throw on access
    global.localStorage = {
      getItem: () => {
        throw new Error('Storage unavailable');
      },
      setItem: () => {
        throw new Error('Storage unavailable');
      },
      removeItem: () => {
        throw new Error('Storage unavailable');
      },
      clear: () => {
        throw new Error('Storage unavailable');
      },
      length: 0,
      key: () => null,
    } as Storage;

    let capturedContext: { isDark: boolean; toggleTheme: () => void } | null = null;

    const TestComponent = () => {
      const context = useTheme();
      capturedContext = context;
      return <div>{context.isDark ? 'dark' : 'light'}</div>;
    };

    // Should not throw even if localStorage is unavailable
    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).not.toThrow();

    // Property: Context should be valid even if storage failed
    expect(capturedContext).not.toBeNull();
    expect(capturedContext).toHaveProperty('isDark');
    expect(typeof capturedContext?.isDark).toBe('boolean');

    // Restore localStorage
    global.localStorage = originalLocalStorage;
  });

  /**
   * Property: For ANY toggle operation where localStorage write fails,
   * the application must continue working (toggles still update state and DOM).
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve functionality when localStorage write fails during toggle', async () => {
    const user = userEvent.setup();

    // Mock localStorage.setItem to throw error
    const originalSetItem = global.localStorage.setItem;
    global.localStorage.setItem = () => {
      throw new Error('localStorage write failed');
    };

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const initialState = screen.getByTestId('theme-state').textContent;
    const toggleBtn = screen.getByTestId('toggle');

    // Toggle should work despite localStorage error
    await user.click(toggleBtn);

    // Theme state and DOM should still update
    const newState = screen.getByTestId('theme-state').textContent;
    expect(newState).not.toBe(initialState);
    expect(['dark', 'light']).toContain(newState);

    // Restore original setItem
    global.localStorage.setItem = originalSetItem;
  });

  // =====================================================
  // Combined Preservation Properties
  // =====================================================

  /**
   * Property: For ANY complete theme lifecycle (init → toggle → persist → DOM update),
   * all preservation requirements are satisfied simultaneously.
   * 
   * This property validates the complete lifecycle.
   * 
   * **Validates: Requirements 3.1-3.5**
   */
  it('should preserve complete theme lifecycle across all operations', async () => {
    const user = userEvent.setup();

    const ComponentA = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="comp-a-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-in-a">Toggle in A</button>
        </div>
      );
    };

    const ComponentB = () => {
      const { isDark } = useTheme();
      return <div data-testid="comp-b-state">{isDark ? 'dark' : 'light'}</div>;
    };

    render(
      <ThemeProvider>
        <ComponentA />
        <ComponentB />
      </ThemeProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('comp-a-state').textContent).toBe(
      screen.getByTestId('comp-b-state').textContent
    );

    // Toggle and verify all components update
    const toggleBtn = screen.getByTestId('toggle-in-a');
    await user.click(toggleBtn);

    // Verify components have matching state after toggle
    expect(screen.getByTestId('comp-a-state').textContent).toBe(
      screen.getByTestId('comp-b-state').textContent
    );

    // Verify localStorage was updated
    const expectedStorage = screen.getByTestId('comp-a-state').textContent === 'dark' ? 'dark' : 'light';
    expect(localStorageMock['bmdc-theme']).toBe(expectedStorage);

    // Verify DOM class is synchronized
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const isDarkState = screen.getByTestId('comp-a-state').textContent === 'dark';
    expect(hasDarkClass).toBe(isDarkState);
  });
});
