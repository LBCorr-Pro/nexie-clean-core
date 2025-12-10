// src/app/[locale]/(app)/sync/states/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function SyncStatesPage() {
  return (
    <Card>
      <CardHeader className="relative">
        <BackButton className="absolute right-6 top-3"/>
        <div className="pt-2"> 
            <CardTitle className="section-title !border-none !pb-0">
                <RefreshCw className="section-title-icon"/>
                Sincronização de Estados
            </CardTitle>
            <CardDescription>
                Ferramentas para sincronizar configurações entre o Master e as instâncias.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
          <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-md bg-muted/50">
              <p className="text-muted-foreground">Página em construção...</p>
          </div>
      </CardContent>
    </Card>
  );
}
