import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from './tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'vitrine:theme-preference';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue>({
  colors: DARK_COLORS,
  mode: 'dark',
  resolvedMode: 'dark',
  setMode: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setModeState(stored);
      }
      setHydrated(true);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'auto') return systemScheme === 'light' ? 'light' : 'dark';
    return mode;
  }, [mode, systemScheme]);

  const colors = resolvedMode === 'light' ? LIGHT_COLORS : DARK_COLORS;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, mode, resolvedMode, setMode }),
    [colors, mode, resolvedMode, setMode],
  );

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
