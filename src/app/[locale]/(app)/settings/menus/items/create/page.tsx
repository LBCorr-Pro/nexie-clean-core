// src/app/[locale]/(app)/settings/menus/items/create/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * @deprecated Esta página foi descontinuada.
 * A funcionalidade de criação foi centralizada como um modal na página de gerenciamento de itens.
 * Este componente agora apenas redireciona o usuário para a página correta.
 */
export default function DeprecatedCreateMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // A rota correta agora é /settings/menus/items
    const destination = `/${locale}/settings/menus/items`;
    router.replace(destination);
  }, [router, locale]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Redirecionando para a nova interface...</p>
    </div>
  );
}
