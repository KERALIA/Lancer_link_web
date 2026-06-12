'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';

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
 *  1. DOM attribute (set by inline script in layout.js before React hydrates)
 *  2. Absolute fallback → 'dark'
 *
 * The <html data-theme="..."> attribute is set by an inline blocking script in
 * layout.js BEFORE React hydrates, preventing any flash of wrong theme.
 * This provider reads that value on mount and keeps React state in sync.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  // One-time sync from DOM on mount.
  // useEffect only runs on the client, after hydration — no mismatch risk.
  useEffect(() => {
    const domTheme = document.documentElement.getAttribute('data-theme');
    if (domTheme && domTheme !== 'dark') {
      setTheme(domTheme);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Functional updater form avoids stale closure over `theme`.
  // DOM update happens inside the setter so it's always in sync with React state.
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) {}
      return next;
    });
  }, []);

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
