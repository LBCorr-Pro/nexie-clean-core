// src/modules/storage/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardDrive, Settings, FolderKanban, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { SettingsTab } from './components/SettingsTab';
import { FileManagerTab } from './components/FileManagerTab';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AccessDenied } from '@/components/ui/access-denied';

export default function StorageModulePage() {
  const t = useTranslations('storageModule');
  const commonT = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Security and Context Hooks
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const viewPermissionId: PermissionId = 'module.storage.view'; // Permission to view the module
  const canViewModule = hasPermission(viewPermissionId);

  // Tab management
  const activeTab = searchParams.get('tab') || 'file_manager';

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoadingPermissions) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!canViewModule) {
      return <AccessDenied message={commonT('errors.accessDenied')} />;
  }

  return (
    <Card>
        <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <div className="pt-2"> 
                <CardTitle className="section-title !border-none !pb-0">
                    <HardDrive className="section-title-icon"/>
                    {t('title')}
                </CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file_manager"><FolderKanban className="mr-2 h-4 w-4" />{t('fileManagerTab')}</TabsTrigger>
                    <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />{t('settingsTab')}</TabsTrigger>
                </TabsList>
                <TabsContent value="file_manager" className="pt-6">
                    {/* The component now fetches its own context internally */}
                    <FileManagerTab />
                </TabsContent>
                <TabsContent value="settings" className="pt-6">
                    <SettingsTab />
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
