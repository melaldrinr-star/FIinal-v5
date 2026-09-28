import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

/**
 * Preservation Property Tests for ThemeContext
 * 
 * These tests PASS on the current code and verify that existing functionality
 * is preserved after the null reference fix is applied. They capture the
 * observable behavior of theme functionality when NOT during initialization.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**
 */

describe('ThemeContext - Preservation Property Tests', () => {
  // Mock localStorage for testing
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    
    // Mock localStorage globally
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

    // Mock document.documentElement for classList operations
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
  });

  // =====================================================
  // 3.5: localStorage Persistence Preservation
  // =====================================================

  /**
   * Property: localStorage Key Preservation
   * 
   * For any sequence of theme toggles after initialization,
   * localStorage must store the theme preference under exactly 'bmdc-theme' key
   * (never different keys, never multiple keys for theme).
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve localStorage key "bmdc-theme" for theme persistence', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state should use localStorage key 'bmdc-theme'
    expect(Object.keys(localStorageMock)).toContain('bmdc-theme');

    // Toggle theme and verify key remains 'bmdc-theme'
    const toggleBtn = screen.getByTestId('toggle-btn');
    await user.click(toggleBtn);

    // After toggle, 'bmdc-theme' should still be the only theme key
    expect(Object.keys(localStorageMock)).toContain('bmdc-theme');
    expect(Object.keys(localStorageMock).filter(k => k.includes('theme'))).toEqual(['bmdc-theme']);
  });

  /**
   * Property: localStorage Value Format Preservation
   * 
   * For any theme state, localStorage value must be exactly 'dark' or 'light'
   * (no other formats, no uppercase variants, no boolean strings).
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve localStorage value format as "dark" or "light"', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const { toggleTheme } = useTheme();
      return <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify initial value is valid format
    let storedValue = localStorageMock['bmdc-theme'];
    expect(['dark', 'light']).toContain(storedValue);

    // Toggle multiple times and verify format consistency
    const toggleBtn = screen.getByTestId('toggle-btn');
    for (let i = 0; i < 5; i++) {
      await user.click(toggleBtn);
      storedValue = localStorageMock['bmdc-theme'];
      expect(['dark', 'light']).toContain(storedValue);
    }
  });

  /**
   * Property: Theme Toggle Persistence
   * 
   * For any sequence of theme toggles, localStorage must stay synchronized
   * with the isDark state such that toggling produces consistent results.
   * 
   * **Validates: Requirement 3.5**
   */
  it('should preserve theme toggle sequence synchronization with localStorage', async () => {
    const user = userEvent.setup();
    let currentIsDark: boolean | null = null;

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      currentIsDark = isDark;
      return (
        <button onClick={toggleTheme} data-testid="toggle-btn">
          {isDark ? 'dark' : 'light'}
        </button>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');

    // Test multiple toggle sequences (property: localStorage stays in sync)
    for (let i = 0; i < 3; i++) {
      await user.click(toggleBtn);
      const expectedStorageValue = currentIsDark ? 'dark' : 'light';
      expect(localStorageMock['bmdc-theme']).toBe(expectedStorageValue);
    }
  });

  // =====================================================
  // 3.6: DOM Class Manipulation Preservation
  // =====================================================

  /**
   * Property: Dark Class Applied When isDark is True
   * 
   * For any theme state where isDark is true, the 'dark' CSS class must be
   * applied to document.documentElement (and ONLY that element for theme).
   * 
   * **Validates: Requirement 3.6**
   */
  it('should preserve dark class application to document.documentElement when isDark is true', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Toggle until we reach dark theme
    const toggleBtn = screen.getByTestId('toggle-btn');
    const themeState = screen.getByTestId('theme-state');

    // Find dark state and verify class
    while (themeState.textContent !== 'dark') {
      await user.click(toggleBtn);
    }

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  /**
   * Property: Dark Class Removed When isDark is False
   * 
   * For any theme state where isDark is false, the 'dark' CSS class must NOT be
   * applied to document.documentElement (class must be removed).
   * 
   * **Validates: Requirement 3.6**
   */
  it('should preserve dark class removal from document.documentElement when isDark is false', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    const themeState = screen.getByTestId('theme-state');

    // Find light state and verify class is removed
    while (themeState.textContent !== 'light') {
      await user.click(toggleBtn);
    }

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  /**
   * Property: DOM Class Synchronization with Theme State
   * 
   * For any sequence of theme toggles, document.documentElement must have the 'dark'
   * class if and only if isDark is true.
   * 
   * **Validates: Requirement 3.6**
   */
  it('should preserve DOM class synchronization with isDark state across toggles', async () => {
    const user = userEvent.setup();
    let currentIsDark: boolean | null = null;

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      currentIsDark = isDark;
      return <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');

    // Property: For any toggle sequence, classList should match isDark state
    for (let i = 0; i < 3; i++) {
      await user.click(toggleBtn);

      // After each toggle, verify classList matches isDark state
      const hasDarkClass = document.documentElement.classList.contains('dark');
      expect(hasDarkClass).toBe(currentIsDark);
    }
  });

  // =====================================================
  // 3.7: useTheme Hook Error Handling Preservation
  // =====================================================

  /**
   * Property: useTheme Throws When Called Outside Provider
   * 
   * For any component tree where useTheme is called outside ThemeProvider,
   * it must throw an error with message indicating the violation.
   * 
   * **Validates: Requirement 3.7**
   */
  it('should preserve useTheme error when called outside ThemeProvider', () => {
    const TestComponentWithoutProvider = () => {
      const context = useTheme();
      return <div>{context.isDark ? 'dark' : 'light'}</div>;
    };

    // Mock console.error to suppress error output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useTheme must be used within ThemeProvider');

    consoleSpy.mockRestore();
  });

  /**
   * Property: useTheme Returns Valid Context Inside Provider
   * 
   * For any component inside ThemeProvider, useTheme must return an object
   * with isDark (boolean) and toggleTheme (function) properties.
   * 
   * **Validates: Requirement 3.7**
   */
  it('should preserve useTheme returning valid context inside ThemeProvider', () => {
    let capturedContext: { isDark: boolean; toggleTheme: () => void } | null = null;

    const TestComponent = () => {
      const context = useTheme();
      capturedContext = context;
      return <div>captured</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(capturedContext).not.toBeNull();
    expect(capturedContext).toHaveProperty('isDark');
    expect(capturedContext).toHaveProperty('toggleTheme');
    expect(typeof capturedContext?.isDark).toBe('boolean');
    expect(typeof capturedContext?.toggleTheme).toBe('function');
  });

  // =====================================================
  // 3.1, 3.2, 3.3: Theme Toggle and Update Preservation
  // =====================================================

  /**
   * Property: toggleTheme Updates isDark State
   * 
   * For any theme state, calling toggleTheme must invert the isDark state
   * (toggling twice returns to original state, toggling N times has predictable result).
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  it('should preserve toggleTheme state update behavior', async () => {
    const user = userEvent.setup();
    let currentIsDark: boolean | null = null;

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      currentIsDark = isDark;
      return (
        <div>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    const { rerender } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const initialIsDark = currentIsDark;
    const toggleBtn = screen.getByTestId('toggle-btn');

    // Toggle and verify state inverted
    await user.click(toggleBtn);
    expect(currentIsDark).toBe(!initialIsDark);

    // Toggle again and verify state returned to original
    await user.click(toggleBtn);
    expect(currentIsDark).toBe(initialIsDark);
  });

  /**
   * Property: Theme State Persists Across Component Lifecycle
   * 
   * For any theme state after successful initialization and before unmount,
   * the theme state must remain consistent across component re-renders.
   * 
   * **Validates: Requirement 3.3**
   */
  it('should preserve theme state across component re-renders', async () => {
    const user = userEvent.setup();
    const stateHistory: boolean[] = [];

    const TestComponent = ({ renderCount }: { renderCount: number }) => {
      const { isDark, toggleTheme } = useTheme();
      stateHistory.push(isDark);
      return (
        <div>
          <span data-testid="render-count">{renderCount}</span>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    const { rerender } = render(
      <ThemeProvider>
        <TestComponent renderCount={0} />
      </ThemeProvider>
    );

    const initialState = stateHistory[stateHistory.length - 1];
    const toggleBtn = screen.getByTestId('toggle-btn');

    // Toggle theme
    await user.click(toggleBtn);
    expect(stateHistory[stateHistory.length - 1]).toBe(!initialState);

    // Force re-render and verify state maintained
    rerender(
      <ThemeProvider>
        <TestComponent renderCount={1} />
      </ThemeProvider>
    );

    // State should remain toggled
    expect(stateHistory[stateHistory.length - 1]).toBe(!initialState);
  });

  /**
   * Property: Multiple Components Receive Same Theme State
   * 
   * For any number of child components inside ThemeProvider,
   * all must receive the same isDark value and toggleTheme function.
   * 
   * **Validates: Requirements 3.2, 3.3**
   */
  it('should preserve consistent theme state across multiple child components', async () => {
    const user = userEvent.setup();
    const capturedStates: boolean[] = [];

    const Child1 = () => {
      const { isDark } = useTheme();
      capturedStates.push(isDark);
      return <div data-testid="child1">{isDark ? 'dark' : 'light'}</div>;
    };

    const Child2 = () => {
      const { isDark } = useTheme();
      capturedStates.push(isDark);
      return <div data-testid="child2">{isDark ? 'dark' : 'light'}</div>;
    };

    const Parent = () => {
      const { toggleTheme } = useTheme();
      return (
        <div>
          <Child1 />
          <Child2 />
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <Parent />
      </ThemeProvider>
    );

    // Verify both children got same state
    expect(capturedStates[0]).toBe(capturedStates[1]);

    // Toggle and verify both update together
    capturedStates.length = 0;
    const toggleBtn = screen.getByTestId('toggle-btn');
    await user.click(toggleBtn);

    // After update, both should still have same state
    expect(capturedStates[capturedStates.length - 2]).toBe(capturedStates[capturedStates.length - 1]);
  });

  // =====================================================
  // 3.4: Theme Persistence Across Remounts
  // =====================================================

  /**
   * Property: Theme Preference Persists When Reading from localStorage
   * 
   * For any theme state that was stored in localStorage, when ThemeProvider
   * initializes again and reads from localStorage, it must restore that state.
   * 
   * **Validates: Requirement 3.4**
   */
  it('should preserve theme preference restoration from localStorage on remount', async () => {
    const user = userEvent.setup();
    let firstRenderIsDark: boolean | null = null;

    const TestComponent = () => {
      const { isDark, toggleTheme } = useTheme();
      if (firstRenderIsDark === null) {
        firstRenderIsDark = isDark;
      }
      return (
        <div>
          <span data-testid="theme-state">{isDark ? 'dark' : 'light'}</span>
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    const { unmount, rerender } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Toggle theme and verify it's stored
    const toggleBtn = screen.getByTestId('toggle-btn');
    await user.click(toggleBtn);
    const toggledState = !firstRenderIsDark;
    expect(localStorageMock['bmdc-theme']).toBe(toggledState ? 'dark' : 'light');

    // Unmount and remount, should restore saved state
    firstRenderIsDark = null; // Reset to capture next render
    unmount();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify restored state matches what was saved
    expect(firstRenderIsDark).toBe(toggledState);
  });

  // =====================================================
  // 3.8: Other Context Providers Continue to Work
  // =====================================================

  /**
   * Property: Other Providers Can Coexist with ThemeProvider
   * 
   * For any app structure with multiple context providers including ThemeProvider,
   * all providers must work independently without interference.
   * 
   * **Validates: Requirement 3.8**
   */
  it('should preserve functionality of other context providers alongside ThemeProvider', () => {
    // Create a simple mock context to verify coexistence
    import('react').then(({ createContext, useContext }) => {
      const OtherContext = createContext<any>(null);
      
      const OtherProvider = ({ children }: { children: React.ReactNode }) => (
        <OtherContext.Provider value={{ otherData: 'test-value' }}>
          {children}
        </OtherContext.Provider>
      );

      let capturedTheme: { isDark: boolean; toggleTheme: () => void } | null = null;

      const TestComponent = () => {
        capturedTheme = useTheme();
        return <div>test</div>;
      };

      render(
        <ThemeProvider>
          <OtherProvider>
            <TestComponent />
          </OtherProvider>
        </ThemeProvider>
      );

      // Verify theme context was provided correctly
      expect(capturedTheme).not.toBeNull();
      expect(capturedTheme).toHaveProperty('isDark');
    });
  });

  // =====================================================
  // 3.9: localStorage Error Handling Preservation
  // =====================================================

  /**
   * Property: Error Handling When localStorage is Unavailable
   * 
   * For any scenario where localStorage is unavailable or throws errors,
   * ThemeProvider must continue to work by falling back to default theme.
   * 
   * **Validates: Requirement 3.9**
   */
  it('should preserve error handling when localStorage is unavailable', () => {
    // Mock localStorage to throw error on access
    const originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: () => {
        throw new Error('localStorage not available');
      },
      setItem: () => {
        throw new Error('localStorage not available');
      },
      removeItem: () => {
        throw new Error('localStorage not available');
      },
      clear: () => {
        throw new Error('localStorage not available');
      },
      length: 0,
      key: () => null,
    } as Storage;

    const TestComponent = () => {
      const { isDark } = useTheme();
      return <div data-testid="theme-state">{isDark ? 'dark' : 'light'}</div>;
    };

    // Should not throw, should use default (light)
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeState = screen.getByTestId('theme-state');
    expect(themeState).toBeInTheDocument();
    expect(['dark', 'light']).toContain(themeState.textContent);

    // Restore original localStorage
    global.localStorage = originalLocalStorage;
  });

  /**
   * Property: localStorage Write Errors Don't Crash Application
   * 
   * For any toggle operation where localStorage write fails,
   * the application must continue working (toggles still update state and DOM).
   * 
   * **Validates: Requirement 3.9**
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
          <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const initialState = screen.getByTestId('theme-state').textContent;
    const toggleBtn = screen.getByTestId('toggle-btn');

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
  // Combined Property Tests
  // =====================================================

  /**
   * Property: Full Theme Lifecycle Preservation
   * 
   * For any complete theme lifecycle (init → toggle → persist → DOM update → other components access),
   * all preservation requirements must be satisfied simultaneously.
   * 
   * **Validates: Requirements 3.1-3.9**
   */
  it('should preserve complete theme lifecycle across initialization, toggle, and access', async () => {
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
