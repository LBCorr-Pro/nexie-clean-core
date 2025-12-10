// src/app/[locale]/(app)/settings/menus/transitions/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Workflow } from 'lucide-react';
import { useParams } from 'next/navigation';
import { BackButton } from "@/components/ui/back-button";

export default function TransitionsSettingsPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Card>
      <CardHeader className="relative">
          <BackButton href={`/${locale}/settings/menus`} className="absolute right-6 top-3"/>
          <div className="pt-2">
            <CardTitle className="section-title !border-none !pb-0">
                <Workflow className="section-title-icon" />
                Configurações de Transições e Efeitos
            </CardTitle>
            <CardDescription>Gerencie os efeitos de transição entre páginas e os indicadores de carregamento.</CardDescription>
          </div>
      </CardHeader>
      <CardContent>
          <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-md bg-muted/50">
              <p className="text-muted-foreground">Em construção...</p>
          </div>
      </CardContent>
    </Card>
  );
}
