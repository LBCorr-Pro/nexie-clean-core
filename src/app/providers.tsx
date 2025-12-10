// src/app/providers.tsx
"use client";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { InstanceActingProvider } from '@/contexts/instance-acting-context';
import { LogProvider } from '@/contexts/LogContext';
import { DebugMenuProvider } from '@/contexts/DebugMenuContext';

/**
 * Este componente centraliza todos os provedores de contexto da aplicação.
 * A ordem dos provedores é importante, pois alguns podem depender de outros.
 * O LogProvider é o mais externo para capturar logs de todos os contextos.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LogProvider>
      <DebugMenuProvider>
        <AuthProvider>
          <InstanceActingProvider>
            <SidebarProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                storageKey="theme"
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </SidebarProvider>
          </InstanceActingProvider>
        </AuthProvider>
      </DebugMenuProvider>
    </LogProvider>
  );
}
