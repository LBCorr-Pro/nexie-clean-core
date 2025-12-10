// src/modules/ai-settings/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Bot, SlidersHorizontal, History, Blocks, TestTube2, Bug } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { useRouter, useSearchParams } from 'next/navigation';
import { SettingsTab } from './components/SettingsTab';
import { AssistantsTab } from './components/AssistantsTab';
import { ContextsTab } from './components/ContextsTab';
import { MonitoringTab } from './components/MonitoringTab';
import { TestTab } from './components/TestTab';
import { DebugTab } from './components/DebugTab';

export default function AiSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') || 'settings';

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className="relative">
        <BackButton className="absolute right-6 top-3" />
        <div className="pt-2"> 
            <CardTitle className="section-title !border-none !pb-0">
                <BrainCircuit className="section-title-icon"/>
                Inteligência Artificial
            </CardTitle>
            <CardDescription>
                Gerencie provedores, modelos, assistentes e contextos de IA para a aplicação.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
                <TabsTrigger value="settings"><SlidersHorizontal className="mr-2 h-4 w-4" />Configurações</TabsTrigger>
                <TabsTrigger value="assistants"><Bot className="mr-2 h-4 w-4" />Assistentes</TabsTrigger>
                <TabsTrigger value="contexts"><Blocks className="mr-2 h-4 w-4" />Contextos</TabsTrigger>
                <TabsTrigger value="monitoring"><History className="mr-2 h-4 w-4" />Monitoramento</TabsTrigger>
                <TabsTrigger value="test"><TestTube2 className="mr-2 h-4 w-4" />Testar</TabsTrigger>
                <TabsTrigger value="debug"><Bug className="mr-2 h-4 w-4" />Debug</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="pt-6">
                <SettingsTab />
            </TabsContent>
            <TabsContent value="assistants" className="pt-6">
                <AssistantsTab />
            </TabsContent>
             <TabsContent value="contexts" className="pt-6">
                <ContextsTab />
            </TabsContent>
            <TabsContent value="monitoring" className="pt-6">
                <MonitoringTab />
            </TabsContent>
            <TabsContent value="test" className="pt-6">
              <TestTab />
            </TabsContent>
            <TabsContent value="debug" className="pt-6">
              <DebugTab />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
