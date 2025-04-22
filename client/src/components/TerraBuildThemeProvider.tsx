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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mode, setMode] = useState<Mode>(defaultMode);

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    
    // Base colors for both themes
    const baseColors = {
      light: {
        background: '#ffffff',
        foreground: '#001529',
        muted: '#f5f5f5',
        border: '#e0e0e0',
      },
      dark: {
        background: '#001529',
        foreground: '#ffffff',
        muted: '#002a4a',
        border: '#003a5a',
      },
    };

    // Standard theme colors
    const standardColors = {
      light: {
        primary: '#00b8d4',
        secondary: '#0091a7',
        accent: '#00e5ff',
      },
      dark: {
        primary: '#00e5ff',
        secondary: '#00b8d4',
        accent: '#00e5ff',
      },
    };

    // Advanced theme colors (more vibrant and with glow effects)
    const advancedColors = {
      light: {
        primary: '#00e5ff',
        secondary: '#00b8d4',
        accent: '#00f2ff',
      },
      dark: {
        primary: '#00f2ff',
        secondary: '#00e5ff',
        accent: '#80fbff',
      },
    };

    // Select the appropriate color scheme
    const baseColorScheme = baseColors[mode];
    const themeColorScheme = theme === 'standard' ? standardColors[mode] : advancedColors[mode];

    // Apply colors
    root.style.setProperty('--tb-background', baseColorScheme.background);
    root.style.setProperty('--tb-foreground', baseColorScheme.foreground);
    root.style.setProperty('--tb-muted', baseColorScheme.muted);
    root.style.setProperty('--tb-border', baseColorScheme.border);
    root.style.setProperty('--tb-primary', themeColorScheme.primary);
    root.style.setProperty('--tb-secondary', themeColorScheme.secondary);
    root.style.setProperty('--tb-accent', themeColorScheme.accent);

    // Set the theme class
    root.classList.remove('theme-standard', 'theme-advanced', 'light-mode', 'dark-mode');
    root.classList.add(`theme-${theme}`, `${mode}-mode`);

    // Advanced theme specific styles
    if (theme === 'advanced') {
      root.style.setProperty(
        '--tb-shadow-light',
        `0 0 10px ${mode === 'dark' ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 229, 255, 0.2)'}`,
      );
      root.style.setProperty(
        '--tb-shadow-medium',
        `0 0 20px ${mode === 'dark' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 229, 255, 0.3)'}`,
      );
      root.style.setProperty(
        '--tb-shadow-strong',
        `0 0 30px ${mode === 'dark' ? 'rgba(0, 229, 255, 0.5)' : 'rgba(0, 229, 255, 0.4)'}`,
      );
    } else {
      root.style.setProperty('--tb-shadow-light', '0 0 10px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--tb-shadow-medium', '0 0 20px rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--tb-shadow-strong', '0 0 30px rgba(0, 0, 0, 0.2)');
    }
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTerraBuildTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTerraBuildTheme must be used within a TerraBuildThemeProvider');
  }
  return context;
}

export default TerraBuildThemeProvider;