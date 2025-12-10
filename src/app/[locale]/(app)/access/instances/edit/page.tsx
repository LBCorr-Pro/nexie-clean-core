// src/app/[locale]/(app)/access/instances/edit/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useNxEditInstanceForm } from '@/hooks/use-nx-edit-instance-form';
import { Loader2, Edit, Users, Server } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from '@/components/ui/back-button';
import { AccessDenied } from '@/components/ui/access-denied';
import { Skeleton } from '@/components/ui/skeleton';
import { EditInstanceDetailsTab } from './components/EditInstanceDetailsTab';
import { NxManageSubInstancesClient } from '../components/NxManageSubInstancesClient';
import Link from 'next/link';

export default function EditInstanceMasterPage() {
  const t = useTranslations('instanceManagement');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;

  const { instance, isLoading, canEdit, isSubInstance } = useNxEditInstanceForm();
  
  const activeTab = searchParams.get('tab') || 'details';
  const handleTabChange = (newTab: string) => {
    router.push(`?tab=${newTab}`);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!canEdit) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
          <BackButton href={`/${locale}/access/instances`} className="absolute right-6 top-3"/>
          <div className="pt-2">
            <CardTitle className="section-title !border-none !pb-0">
                <Edit className="section-title-icon"/>
                {t('edit.title')}
            </CardTitle>
            <CardDescription>{isSubInstance ? t('edit.subtitleSubInstance') : t('edit.subtitle', { instanceName: instance?.instanceName })}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
                  <TabsTrigger value="details"><Server className="mr-2 h-4 w-4"/>{t('edit.tabs.details')}</TabsTrigger>
                  {!isSubInstance && <TabsTrigger value="subinstances"><Users className="mr-2 h-4 w-4"/>{t('edit.tabs.subinstances')}</TabsTrigger>}
                  <TabsTrigger value="users" asChild>
                    <Link href={`/${locale}/users/${params.instanceId}`}><Users className="mr-2 h-4 w-4"/>{t('edit.tabs.users')}</Link>
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-6">
                  <EditInstanceDetailsTab />
              </TabsContent>
              {!isSubInstance && (
                  <TabsContent value="subinstances" className="pt-6">
                      <NxManageSubInstancesClient />
                  </TabsContent>
              )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
