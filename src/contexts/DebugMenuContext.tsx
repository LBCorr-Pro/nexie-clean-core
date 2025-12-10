// src/contexts/DebugMenuContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { BottomBarConfig } from '@/lib/types/menus'; // Corrigido

const LOG_WINDOW_VISIBLE_KEY = 'nexie_dev_log_window_visible';
const ACTING_BAR_VISIBLE_KEY = 'nexie_dev_acting_bar_visible';

interface DebugMenuContextType {
  isLogVisible: boolean;
  toggleLogVisibility: () => void;
  isActingBarVisible: boolean;
  toggleActingBar: () => void;
  bottomBarPreviewConfig: BottomBarConfig | null;
  setBottomBarPreviewConfig: (config: BottomBarConfig | null) => void;
}

const DebugMenuContext = createContext<DebugMenuContextType | undefined>(undefined);

export const useDebugMenu = () => {
  const context = useContext(DebugMenuContext);
  if (!context) {
    throw new Error('useDebugMenu must be used within a DebugMenuProvider');
  }
  return context;
};

// Helper function to get initial state from localStorage safely on the client
const getInitialStateFromStorage = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    // CORREÇÃO: Apenas faz o parse se o item não for nulo e não for uma string vazia.
    return item && item.trim() !== '' ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const DebugMenuProvider = ({ children }: { children: ReactNode }) => {
    const [isLogVisible, setIsLogVisible] = useState(() => getInitialStateFromStorage(LOG_WINDOW_VISIBLE_KEY, false));
    const [isActingBarVisible, setIsActingBarVisible] = useState(() => getInitialStateFromStorage(ACTING_BAR_VISIBLE_KEY, true));
    const [bottomBarPreviewConfig, setBottomBarPreviewConfig] = useState<BottomBarConfig | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(LOG_WINDOW_VISIBLE_KEY, JSON.stringify(isLogVisible));
        } catch (error) {
            console.warn(`Error writing to localStorage for log window:`, error);
        }
    }
  }, [isLogVisible]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(ACTING_BAR_VISIBLE_KEY, JSON.stringify(isActingBarVisible));
        } catch (error) {
            console.warn(`Error writing to localStorage for acting bar:`, error);
        }
    }
  }, [isActingBarVisible]);

  const toggleLogVisibility = useCallback(() => setIsLogVisible(prev => !prev), []);
  const toggleActingBar = useCallback(() => setIsActingBarVisible(prev => !prev), []);

  const value = {
    isLogVisible,
    toggleLogVisibility,
    isActingBarVisible,
    toggleActingBar,
    bottomBarPreviewConfig,
    setBottomBarPreviewConfig,
  };

  return (
    <DebugMenuContext.Provider value={value}>
      {children}
    </DebugMenuContext.Provider>
  );
};
