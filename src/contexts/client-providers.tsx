
// src/contexts/client-providers.tsx
"use client";

import React from 'react';
// A correção final: Apontar para o AuthProvider que decidimos manter.
import { AuthProvider } from '@/context/AuthContext'; 
import { AppearanceProvider } from '@/contexts/appearance-context';
import { DynamicMenuProvider } from '@/contexts/dynamic-menu-context';
import { TenantProvider } from '@/contexts/tenant-context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <AuthProvider>
        <AppearanceProvider>
          <DynamicMenuProvider>
            {children}
          </DynamicMenuProvider>
        </AppearanceProvider>
      </AuthProvider>
    </TenantProvider>
  );
}
