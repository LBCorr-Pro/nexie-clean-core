'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useParams } from 'next/navigation';

// Defines the shape of the context data
interface TenantContextType {
  tenantId: string;
  isMaster: boolean;
}

// Create the context with a default undefined value
const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * This provider is responsible for identifying the current tenant (master, instance, or sub-instance)
 * based on the URL parameters. It makes the tenant ID available to its children components.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const params = useParams();

  // The logic to determine the tenantId is centralized here.
  const tenantId = useMemo(() => {
    // useParams returns an object with the dynamic segments from the URL
    const { instanceId, subInstanceId } = params as { instanceId?: string; subInstanceId?: string };

    // The most specific ID takes precedence. If a subInstanceId exists, it's the tenant.
    if (subInstanceId) {
      return subInstanceId;
    }
    // If no subInstanceId, but an instanceId exists, it's the tenant.
    if (instanceId) {
      return instanceId;
    }
    // If neither is present, we are in the master context.
    return 'master';
  }, [params]);

  const value = useMemo(() => ({
    tenantId,
    isMaster: tenantId === 'master',
  }), [tenantId]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Custom hook to easily access the tenant context.
 * Throws an error if used outside of a TenantProvider to prevent mis-use.
 */
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
