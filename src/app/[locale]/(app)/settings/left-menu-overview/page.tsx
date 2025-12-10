// src/app/[locale]/(app)/settings/left-menu-overview/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This component acts as a temporary redirect. The route /settings/left-menu-overview
 * is being deprecated in favor of the new centralized /settings/menus page.
 * This component ensures that any old links pointing here are correctly
 * forwarded to the new overview page.
 */
export default function LeftMenuOverviewRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // A rota correta agora é /settings/menus
    const destination = `/${locale}/settings/menus`;
    router.replace(destination);
  }, [router, locale]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Redirecionando para a nova página de menus...</p>
    </div>
  );
}
