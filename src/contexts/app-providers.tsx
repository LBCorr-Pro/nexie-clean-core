// src/contexts/app-providers.tsx
"use client";

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { LogProvider } from '@/contexts/LogContext';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { DebugMenuProvider } from '@/contexts/DebugMenuContext';
import { InstanceActingProvider } from '@/contexts/instance-acting-context';
import { DynamicMenuProvider } from '@/contexts/dynamic-menu-context';
import { Toaster } from '@/components/ui/toaster';
import { RootOrchestrator } from '@/components/auth/RootOrchestrator';

// The ThemeProvider and AppearanceProvider have been moved to the root layout
// to ensure they apply to all routes (public and private).
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LogProvider>
      <DebugMenuProvider>
        <AuthProvider>
          <InstanceActingProvider>
              <DynamicMenuProvider>
                <SidebarProvider>
                  <RootOrchestrator>{children}</RootOrchestrator>
                  <Toaster />
                </SidebarProvider>
              </DynamicMenuProvider>
          </InstanceActingProvider>
        </AuthProvider>
      </DebugMenuProvider>
    </LogProvider>
  );
}
