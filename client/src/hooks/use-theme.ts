import { useState, useEffect } from 'react';

interface Theme {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>({
    primary: '#2563eb', // Default blue
    variant: 'professional',
    appearance: 'light',
    radius: 0.5
  });

  useEffect(() => {
    // Try to load theme from localStorage or any theme provider
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        setTheme(JSON.parse(storedTheme));
      } else {
        // If no stored theme, try to load from theme.json
        fetch('/theme.json')
          .then(response => response.json())
          .then(themeData => {
            setTheme(themeData);
          })
          .catch(err => {
            console.log('Could not load theme.json, using defaults', err);
          });
      }
    } catch (err) {
      console.log('Error loading theme, using defaults', err);
    }
  }, []);

  return { theme };
}