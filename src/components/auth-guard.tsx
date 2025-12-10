// src/components/auth-guard.tsx
// This component is no longer needed as its logic is now centralized in AppProviders/AppOrchestrator.
// It can be deleted in a future cleanup.
// For now, it will just render children to avoid breaking imports.

import React from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
