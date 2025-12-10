// src/contexts/sidebar-context.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

const SIDEBAR_COOKIE_NAME = "sidebar_desktop_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

interface SidebarContextType {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Helper to read the cookie safely on the client
const getInitialSidebarState = (): boolean => {
    if (typeof window === 'undefined') {
        return false; // Always render closed on the server
    }
    if (window.innerWidth < 768) {
        return false; // Default to closed on mobile
    }
    const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
        ?.split('=')[1];
    return cookieValue === 'expanded';
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(getInitialSidebarState);

  // This effect runs only on the client, after hydration.
  useEffect(() => {
    const handleResize = () => {
        // Force the sidebar closed on mobile screen sizes.
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };
    
    // Set initial state based on client-side screen size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);

    // Only save the state to cookie for desktop view
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const state = open ? 'expanded' : 'collapsed';
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${state}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }
  }, []);
  
  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);
  
  useHotkeys(`mod+${SIDEBAR_KEYBOARD_SHORTCUT}`, (event) => {
      event.preventDefault();
      toggle();
  }, { enableOnFormTags: true }, [toggle]);

  const isCollapsed = useMemo(() => !isOpen, [isOpen]);

  const value = useMemo(() => ({
    isOpen,
    setOpen,
    isCollapsed,
    toggle,
  }), [isOpen, setOpen, isCollapsed, toggle]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
