'use client';

import { createContext, useContext, useEffect, useState } from 'react';

/**
 * ThemeContext — exposes { theme, toggleTheme }
 * theme: 'dark' | 'light'
 */
const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

/**
 * ThemeProvider
 *
 * Priority order:
 *  1. localStorage (user's explicit choice)
 *  2. prefers-color-scheme OS setting
 *  3. Absolute fallback → 'dark'
 *
 * The <html data-theme="..."> attribute is set by the inline script in layout.js
 * BEFORE React hydrates, preventing any flash of wrong theme.
 * This provider then syncs React state to that value.
 */
export function ThemeProvider({ children }) {
  // Initialize to null so we know we haven't read from DOM yet
  const [theme, setTheme] = useState(null);

  // On mount: read the theme that the inline script already applied to <html>
  useEffect(() => {
    const applied = document.documentElement.getAttribute('data-theme') ?? 'dark';
    setTheme(applied);
  }, []);

  // Whenever theme changes, persist to localStorage and update <html>
  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Don't render children until we've determined the theme to avoid mismatch
  if (theme === null) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Convenience hook */
export function useTheme() {
  return useContext(ThemeContext);
}
