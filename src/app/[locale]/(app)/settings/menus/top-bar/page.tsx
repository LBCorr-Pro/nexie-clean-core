// src/app/[locale]/(app)/settings/menus/top-bar/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PanelTop, Info } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from '@/components/ui/alert';
import { BackButton } from "@/components/ui/back-button";

export default function TopBarSettingsPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Card>
      <CardHeader className="relative">
        <BackButton href={`/${locale}/settings/menus`} className="absolute right-6 top-3"/>
        <div className="pt-2">
            <CardTitle className="section-title !border-none !pb-0">
                <PanelTop className="section-title-icon" />
                Configurações da Barra Superior
            </CardTitle>
            <CardDescription>Gerencie a estrutura e visibilidade da barra de navegação superior.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
          <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertTitle>Configurações de Aparência Movidas</AlertTitle>
              <AlertBoxDescription>
                  As configurações visuais (cores, fontes, etc.) da barra superior agora são gerenciadas na página de <Link href={`/${locale}/settings/appearance?tab=top-bar`} className="font-semibold underline hover:text-primary">Aparência</Link>, na aba &quot;Barra Superior&quot;.
                  Use esta página para definir a visibilidade e o conteúdo.
              </AlertBoxDescription>
          </Alert>
          <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-md mt-6 bg-muted/50">
              <p className="text-muted-foreground">Em construção...</p>
          </div>
      </CardContent>
    </Card>
  );
}
