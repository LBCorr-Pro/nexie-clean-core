// src/modules/calc-genius/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// NX Architecture
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { CalcGeniusProvider } from './components/CalcGeniusContext';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/ui/back-button";
import { AccessDenied } from '@/components/ui/access-denied';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wrench, List, FunctionSquare, FileJson, FlaskConical, Calculator, AlertTriangle } from 'lucide-react';

// Module Components
import { ModuleLayout } from './components/ModuleLayout';
import { GroupsTab, FormulasTab, FieldsTab, FileAnalyzerTab, TestsTab } from './components';

// This is the wrapper for the entire module, handling permissions and context.
const CalcGeniusModule: React.FC = () => {
  const t = useTranslations('calcGenius');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') || 'groups';

  const handleTabChange = (newTab: string) => {
    router.push(`${pathname}?tab=${newTab}`);
  };

  return (
    <ModuleLayout>
      <Card>
        <CardHeader className="relative">
          <BackButton className="absolute right-6 top-3" />
          <div className="pt-2">
            <CardTitle className="section-title !border-none !pb-0">
              <Calculator className="section-title-icon" />
              {t('title')}
            </CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="groups"><List className="mr-2 h-4 w-4" />{t('tabs.groups')}</TabsTrigger>
              <TabsTrigger value="fields"><Wrench className="mr-2 h-4 w-4" />{t('tabs.fields')}</TabsTrigger>
              <TabsTrigger value="formulas"><FunctionSquare className="mr-2 h-4 w-4" />{t('tabs.formulas')}</TabsTrigger>
              <TabsTrigger value="analyzer"><FileJson className="mr-2 h-4 w-4" />{t('tabs.analyzer')}</TabsTrigger>
              <TabsTrigger value="tests"><FlaskConical className="mr-2 h-4 w-4" />{t('tabs.tests')}</TabsTrigger>
            </TabsList>
            <TabsContent value="groups"><GroupsTab /></TabsContent>
            <TabsContent value="fields"><FieldsTab /></TabsContent>
            <TabsContent value="formulas"><FormulasTab /></TabsContent>
            <TabsContent value="analyzer"><FileAnalyzerTab /></TabsContent>
            <TabsContent value="tests"><TestsTab /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ModuleLayout>
  );
}

// This is the main page component that enforces security and context.
export default function CalcGeniusModulePage() {
  const t = useTranslations('calcGenius');
  const commonT = useTranslations('common');
  const { isActingAsMaster } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const viewPermissionId: PermissionId = 'module.calc-genius.view';
  const canViewModule = hasPermission(viewPermissionId);

  if (isLoadingPermissions) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!canViewModule) {
    return <AccessDenied message={commonT('errors.accessDenied')} />;
  }

  if (!isActingAsMaster) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errors.masterOnlyTitle')}</AlertTitle>
          <AlertDescription>{t('errors.masterOnlyDescription')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // If permissions and context are valid, render the module inside its provider.
  return (
    <CalcGeniusProvider>
      <CalcGeniusModule />
    </CalcGeniusProvider>
  );
}
