import React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('bmdc-theme');
      return saved ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bmdc-theme', isDark ? 'dark' : 'light');
    } catch {
      // Storage unavailable, continue without persistence
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  // If context is undefined (hook called outside ThemeProvider),
  // return safe default values instead of throwing an error.
  // This allows components to render gracefully with default theme.
  if (!context) {
    // Optional debug-level warning for developers to identify components
    // not wrapped in ThemeProvider during development
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        '[ThemeContext] useTheme hook called outside ThemeProvider. ' +
        'Using safe default values (isDark: false, toggleTheme: no-op). ' +
        'Wrap your component in ThemeProvider to enable theme switching.'
      );
    }
    
    // Return safe default values
    return {
      isDark: false,
      toggleTheme: () => {
        // No-op function for safe fallback
      },
    };
  }
  
  return context;
}
