// src/contexts/appearance-context.tsx
"use client";

import React from 'react';
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { DynamicThemeApplicator } from '@/components/dynamic-theme-applicator';

// This provider now acts as a simple bridge to call the DynamicThemeApplicator.
// The actual logic is fully contained within useNxAppearance and DynamicThemeApplicator.
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  // We don't need to call useNxAppearance here anymore, as DynamicThemeApplicator
  // will do it internally.
  return (
    <>
      <DynamicThemeApplicator />
      {children}
    </>
  );
}
