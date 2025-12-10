// src/app/[locale]/(app)/access/instances/page.tsx
// MASTER PAGE: Gerenciamento de Instâncias e Sub-instâncias
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Building, Loader2, PlusCircle } from 'lucide-react';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { NxManageInstancesClient } from './components/NxManageInstancesClient';
import { NxManageSubInstancesClient } from './components/NxManageSubInstancesClient';
import { AccessDenied } from '@/components/ui/access-denied';
import { useParams } from 'next/navigation';

export default function ManageInstancesMasterPage() {
  const t = useTranslations('instanceManagement');
  const params = useParams();
  const locale = params.locale as string;
  const { isActingAsMaster, actingAsInstanceId, actingAsInstanceName } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const canViewGlobalInstances = hasPermission('master.instance.view_all');
  const canCreateInstance = hasPermission('master.instance.create');
  const canManageSubInstances = hasPermission('instance.subinstances.manage');

  if (isLoadingPermissions) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Se o usuário está no contexto de uma instância, ele gerencia sub-instâncias.
  if (actingAsInstanceId) {
    if (!canManageSubInstances) {
      return <AccessDenied />;
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('subInstances.title', { instanceName: actingAsInstanceName })}</CardTitle>
                <CardDescription>{t('subInstances.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <NxManageSubInstancesClient />
            </CardContent>
        </Card>
    );
  }

  // Se o usuário é Master Global, ele gerencia as instâncias principais.
  if (isActingAsMaster) {
    if (!canViewGlobalInstances) {
      return (
        <Card>
            <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>{t('permissionNeeded')}</AlertTitle>
                    <AlertBoxDescription>{t('viewPermissionError')}</AlertBoxDescription>
                </Alert>
            </CardContent>
        </Card>
      );
    }
    return (
        <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6"/>{t('title')}</CardTitle>
                  <CardDescription>{t('description')}</CardDescription>
                </div>
                {canCreateInstance && (
                  <Button asChild className="shrink-0 w-full md:w-auto">
                    <Link href={`/${locale}/access/instances/create`}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t('createButton')}
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
                <NxManageInstancesClient />
            </CardContent>
        </Card>
    );
  }

  // Fallback se nenhum contexto for identificado.
  return <AccessDenied />;
}
