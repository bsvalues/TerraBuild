import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'standard' | 'advanced';
type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const defaultThemeContext: ThemeContextType = {
  theme: 'standard',
  mode: 'light',
  setTheme: () => {},
  setMode: () => {},
  toggleMode: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultMode?: Mode;
}

export function TerraBuildThemeProvider({
  children,
  defaultTheme = 'standard',
  defaultMode = 'light',
}: ThemeProviderProps) {
  // Initialize theme state from localStorage if available, otherwise use default
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('terraBuildTheme');
    return (savedTheme as Theme) || defaultTheme;
  });

  // Initialize mode state from localStorage if available, otherwise use default
  const [mode, setMode] = useState<Mode>(() => {
    const savedMode = localStorage.getItem('terraBuildMode');
    return (savedMode as Mode) || defaultMode;
  });

  // Toggle between light and dark mode
  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Update document with theme classes when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Update data attributes for theme
    root.setAttribute('data-theme', theme);
    
    // Update dark mode class
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('terraBuildTheme', theme);
    localStorage.setItem('terraBuildMode', mode);
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTerraBuildTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTerraBuildTheme must be used within a TerraBuildThemeProvider');
  }
  return context;
}

export default TerraBuildThemeProvider;