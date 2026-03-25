'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'emerald' | 'rose' | 'amber' | 'cyan';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_PALETTES: Record<AccentColor, { primary: string; light: string; border: string; ring: string; text: string }> = {
  blue:    { primary: '#3b82f6', light: '#dbeafe', border: '#bfdbfe', ring: '#3b82f6', text: '#1d4ed8' },
  purple:  { primary: '#8b5cf6', light: '#ede9fe', border: '#ddd6fe', ring: '#8b5cf6', text: '#6d28d9' },
  emerald: { primary: '#10b981', light: '#d1fae5', border: '#a7f3d0', ring: '#10b981', text: '#065f46' },
  rose:    { primary: '#f43f5e', light: '#ffe4e6', border: '#fecdd3', ring: '#f43f5e', text: '#be123c' },
  amber:   { primary: '#f59e0b', light: '#fef3c7', border: '#fde68a', ring: '#f59e0b', text: '#b45309' },
  cyan:    { primary: '#06b6d4', light: '#cffafe', border: '#a5f3fc', ring: '#06b6d4', text: '#0e7490' },
};

function applyTheme(resolved: 'light' | 'dark', accent: AccentColor) {
  const html = document.documentElement;
  if (resolved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  const palette = ACCENT_PALETTES[accent];
  html.style.setProperty('--accent-primary', palette.primary);
  html.style.setProperty('--accent-light', palette.light);
  html.style.setProperty('--accent-border', palette.border);
  html.style.setProperty('--accent-ring', palette.ring);
  html.style.setProperty('--accent-text', palette.text);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('untangle_theme') as Theme) || 'light';
    const savedAccent = (localStorage.getItem('untangle_accent') as AccentColor) || 'blue';
    setThemeState(savedTheme);
    setAccentColorState(savedAccent);
  }, []);

  // Resolve and apply theme whenever theme or system preference changes
  useEffect(() => {
    if (!mounted) return;

    const resolveAndApply = () => {
      let resolved: 'light' | 'dark' = 'light';
      if (theme === 'dark') {
        resolved = 'dark';
      } else if (theme === 'auto') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = 'light';
      }
      setResolvedTheme(resolved);
      applyTheme(resolved, accentColor);
    };

    resolveAndApply();

    // Listen to system preference changes for 'auto' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'auto') resolveAndApply();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, accentColor, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('untangle_theme', newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    localStorage.setItem('untangle_accent', newColor);
  };

  // Render children normally, but wait until mounted to avoid incorrect initial theme flashing
  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor, resolvedTheme }}>
      <div className={!mounted ? 'invisible' : ''} style={!mounted ? { display: 'none' } : {}}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ACCENT_PALETTES };
