// src/app/[locale]/(app)/layout.tsx
"use client";

import React from "react";
import { ReactNode } from "react";
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from "@/components/layout/header";
import { BottomNavigationBar } from "@/components/layout/bottom-navigation-bar";
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { cn } from "@/lib/utils";

// RouteGuard is no longer needed here, as the new AppOrchestrator handles it globally.

const pageVariants: Record<string, Variants> = {
  none: { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  'slide-up': { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } },
  'slide-down': { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } },
  'slide-left': { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } },
  'slide-right': { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } },
  'zoom-in': { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
  'zoom-out': { initial: { opacity: 1, scale: 1 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { appearanceSettings } = useNxAppearance();

  const selectedTransition = appearanceSettings?.enablePageTransitions && appearanceSettings?.pageTransitionType
    ? pageVariants[appearanceSettings.pageTransitionType]
    : pageVariants.none;

  const transitionDuration = appearanceSettings?.pageTransitionDurationMs
    ? appearanceSettings.pageTransitionDurationMs / 1000
    : 0.3;

  return (
    // The RouteGuard wrapper is removed from here.
    <div className="relative min-h-screen w-full">
      <Sidebar />
      <div className="main-content-wrapper flex flex-col">
        <Header />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={selectedTransition}
            transition={{ duration: transitionDuration, ease: "easeInOut" }}
            className={cn("flex-1 overflow-y-auto", "pb-16 md:pb-0")}
          >
            <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1">
              {children}
            </div>
          </motion.main>
        </AnimatePresence>
      </div>
      <BottomNavigationBar />
    </div>
  );
}
