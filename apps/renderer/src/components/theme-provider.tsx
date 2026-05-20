/* eslint-disable react-refresh/only-export-components */
'use client';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

// Defines a type alias for the possible theme values.
type Theme = 'dark' | 'light' | 'system';

// Describes the shape of the context's value.
interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Defines the props for the ThemeProvider component.
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Sets the initial state for the context.
const initialState: ThemeProviderContextType = {
  theme: 'system',
  setTheme: () => null,
};

// Creates the React Context with the defined type and initial state.
const ThemeProviderContext = createContext<ThemeProviderContextType>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  // Initializes the theme state from local storage or uses the default theme.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  // A side effect to apply the selected theme to the HTML document.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Detects the system's color scheme preference.
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Creates the value object to be provided by the context.
  const value: ThemeProviderContextType = {
    theme,
    // Function to update local storage and the theme state.
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    // The provider component makes the value available to its children.
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// A custom hook for consuming the theme context.
export function useTheme(): ThemeProviderContextType {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    // Ensures the hook is used within the provider.
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
