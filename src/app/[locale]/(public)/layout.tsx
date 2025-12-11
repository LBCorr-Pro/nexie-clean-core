// src/app/[locale]/(public)/layout.tsx
import React from 'react';
import { PublicRedirect } from '@/components/auth/public-redirect';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
      <PublicRedirect>
        <main className="flex min-h-screen items-center justify-center p-4">
            {children}
        </main>
      </PublicRedirect>
  );
}
