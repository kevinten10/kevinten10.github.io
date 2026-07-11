'use client';

import { createContext, useContext, useEffect, useCallback, useSyncExternalStore, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'kevinten-theme';
const themeListeners = new Set<() => void>();

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

function subscribeToTheme(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };

  themeListeners.add(onStoreChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener('storage', handleStorage);
  };
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Keep the in-page theme usable when storage is unavailable.
  }
  themeListeners.forEach(listener => listener());
}

function getServerTheme(): Theme {
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, getServerTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Update theme-color meta
    const meta = document.getElementById('theme-color-meta');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0F172A' : '#F8FAFC');
    }
  }, [theme]);

  const toggle = useCallback(() => {
    storeTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
