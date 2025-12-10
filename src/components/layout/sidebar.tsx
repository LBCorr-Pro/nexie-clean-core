// src/components/layout/sidebar.tsx
"use client";

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useSidebar } from '@/contexts/sidebar-context';
import { AppLogo } from './app-logo';
import { SidebarNav } from './sidebar-nav';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNxAppearance } from '@/hooks/use-nx-appearance';

// The re-usable content of the sidebar
const SidebarContent = () => {
  const { isCollapsed } = useSidebar();
  const { appearanceSettings } = useNxAppearance();

  if (!appearanceSettings?.sidebarVisible) {
      return null;
  }
  
  const sidebarClasses = cn(
      "main-sidebar",
      { 'collapsed': isCollapsed }
  );

  return (
      <aside className={sidebarClasses}>
        <header className="sidebar-header">
          <AppLogo />
        </header>
        <ScrollArea className="sidebar-content-area">
          <SidebarNav />
        </ScrollArea>
        <footer className="sidebar-footer">
          Powered by Nexie
        </footer>
      </aside>
  );
};

// Component for the mobile menu that uses the Sheet.
const MobileSheet = () => {
    const { isOpen, setOpen } = useSidebar();
    return (
        <Sheet open={isOpen} onOpenChange={setOpen}>
            <SheetContent side="left" className="mobile-sidebar-sheet" showCloseButton={false}>
                {/* 
                  Accessibility fix: Add a SheetHeader with a visually hidden title.
                  This satisfies the requirement of the underlying Radix Dialog component.
                */}
                <SheetHeader className="sr-only">
                    <SheetTitle>Main Menu</SheetTitle>
                    <SheetDescription>Primary application navigation menu.</SheetDescription>
                </SheetHeader>
                <SidebarContent />
            </SheetContent>
        </Sheet>
    );
};

export const Sidebar = () => {
    return (
        <>
            {/* Renders the mobile Sheet, controlled by CSS `md:hidden` */}
            <div className="block md:hidden">
              <MobileSheet />
            </div>
            {/* Renders the desktop sidebar, controlled by CSS `hidden md:block` */}
            <div className="main-sidebar-peer hidden md:block">
                <SidebarContent />
            </div>
        </>
    );
};
