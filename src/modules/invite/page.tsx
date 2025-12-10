// src/modules/invite/page.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailPlus, Settings, ListChecks } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { SettingsTab } from './components/SettingsTab';
import { ManageInvitesTab } from './components/ManageInvitesTab';

export default function InviteModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('invite');

  const activeTab = searchParams.get('tab') || 'manage_invites';

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="relative">
        <BackButton className="absolute right-6 top-3" />
        <div className="pt-2"> 
            <CardTitle className="section-title !border-none !pb-0">
                <MailPlus className="section-title-icon"/>
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
                <TabsTrigger value="manage_invites"><ListChecks className="mr-2 h-4 w-4" />{t('tabs.manage')}</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />{t('tabs.settings')}</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="pt-6">
              <SettingsTab />
            </TabsContent>
            <TabsContent value="manage_invites" className="pt-6">
              <ManageInvitesTab />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
