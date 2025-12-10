
// src/app/[locale]/(app)/admin/calc-genius/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { CalcGeniusProvider } from '@/modules/calc-genius/components/CalcGeniusContext';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';

// Import the new, refactored components
import { GroupsTab } from '@/modules/calc-genius/components/GroupsTab';
import { FieldsTab } from '@/modules/calc-genius/components/FieldsTab';
import { FormulasTab } from '@/modules/calc-genius/components/FormulasTab';
import { FieldFormDialog } from '@/modules/calc-genius/components/FieldFormDialog';
import { FormulaFormDialog } from '@/modules/calc-genius/components/FormulaFormDialog';

// Import shared UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ban } from 'lucide-react';

const CalcGeniusClientPage: React.FC = () => {
  const t = useTranslations('calcGenius');
  const { isActingAsMaster } = useInstanceActingContext();

  if (!isActingAsMaster) {
    return (
        <div className="container mx-auto py-8">
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <Ban className="h-4 w-4" />
                <AlertDescription>{t('errors.masterOnlyDescription')}</AlertDescription>
            </Alert>
        </div>
    );
  }

  // Simplified main page component. It only sets up the provider and layout.
  return (
    <CalcGeniusProvider>
        <div className="container mx-auto py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </header>

            <Tabs defaultValue="groups">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="groups">{t('tabs.groups')}</TabsTrigger>
                    <TabsTrigger value="fields">{t('tabs.fields')}</TabsTrigger>
                    <TabsTrigger value="formulas">{t('tabs.formulas')}</TabsTrigger>
                    <TabsTrigger value="analyzer">{t('tabs.analyzer')}</TabsTrigger>
                    <TabsTrigger value="tests">{t('tabs.tests')}</TabsTrigger>
                </TabsList>

                <TabsContent value="groups">
                    <GroupsTab />
                </TabsContent>
                <TabsContent value="fields">
                    <FieldsTab />
                </TabsContent>
                <TabsContent value="formulas">
                    <FormulasTab />
                </TabsContent>
                {/* Other tabs can be added here */}
            </Tabs>
        </div>

        {/* Dialogs are now self-contained and will appear when their state is triggered from the context */}
        <FieldFormDialog />
        <FormulaFormDialog />

    </CalcGeniusProvider>
  );
};

export default CalcGeniusClientPage;
