// src/app/[locale]/(app)/dashboard/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from 'next/image';
import logoUrl from '@/../public/system-assets/logos/logo-texto-512x512.svg';
import { Icon } from '@/components/ui/icon';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { Separator } from '@/components/ui/separator';
import { useNxDynamicMenu } from '@/hooks/use-nx-dynamic-menu'; 
import { useNxAppearance } from '@/hooks/use-nx-appearance'; 

// A função para ler cookies, para ser usada apenas no lado do cliente.
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

// Componente para a caixa de debug
const DebugInfoCard = () => {
  const t = useTranslations('dashboard.debug');
  const { user: currentUser } = useAuthContext();
  const { permissions = [], isLoadingPermissions } = useUserPermissions();
  
  const { isLoading: isLoadingSettings, generalSettingsDebugInfo } = useNxDynamicMenu();
  const { appearanceSettings } = useNxAppearance();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm font-mono">
        <div>
            <h4 className="font-semibold text-muted-foreground">{t('userSection')}</h4>
            <p><strong>{t('uid')}</strong> {currentUser?.uid || t('notApplicable')}</p>
        </div>
        <Separator />
        <div>
            <h4 className="font-semibold text-muted-foreground">{t('dbPreferences.title')}</h4>
            {isLoadingSettings ? <p>{t('loadingSettings')}</p> :
              <>
                <p><strong>{t('dbPreferences.language')}</strong> {appearanceSettings?.language || t('notApplicable')}</p>
                <p><strong>{t('dbPreferences.theme')}</strong> {appearanceSettings?.themePreference || t('notApplicable')}</p>
              </>
            }
        </div>
        <Separator />
        <div>
            <h4 className="font-semibold text-muted-foreground">{t('contextSection')}</h4>
             {isLoadingSettings || !generalSettingsDebugInfo ? <p>{t('loadingSettings')}</p> :
                <>
                  <p><strong>{t('isMaster')}</strong> {generalSettingsDebugInfo?.isActingAsMaster ? t('yes') : t('no')}</p>
                </>
             }
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold text-muted-foreground">{t('generalSettingsDebug.title')}</h4>
           {isLoadingSettings || !generalSettingsDebugInfo ? <p>{t('loadingSettings')}</p> :
            <>
              <p><strong>{t('generalSettingsDebug.hasName')}</strong> {generalSettingsDebugInfo.hasName ? t('yes') : t('no')}</p>
              <p><strong>{t('generalSettingsDebug.loadedFrom')}:</strong> <code className="text-xs bg-muted p-1 rounded-sm">{generalSettingsDebugInfo.loadedFrom || t('notApplicable')}</code></p>
              <Separator className="my-2" />
              <p><strong>{t('generalSettingsDebug.masterInstanceExists')}</strong> {generalSettingsDebugInfo.masterInstanceExists ? t('yes') : t('no')}</p>
              <p><strong>{t('generalSettingsDebug.masterInstanceHasName')}</strong> {generalSettingsDebugInfo.masterInstanceHasName ? t('yes') : t('no')}</p>
              <p><strong>{t('generalSettingsDebug.masterInstancePath')}:</strong> <code className="text-xs bg-muted p-1 rounded-sm">{generalSettingsDebugInfo.masterInstancePath || t('notApplicable')}</code></p>
              <p><strong>{t('generalSettingsDebug.masterInstanceNameInDB')}:</strong> <span className="font-bold">{generalSettingsDebugInfo.masterInstanceName || t('notApplicable')}</span></p>
              <p><strong>{t('generalSettingsDebug.globalMasterNameInDB')}:</strong> <span className="font-bold">{generalSettingsDebugInfo.globalMasterName || t('notApplicable')}</span></p>
              <Separator className="my-2" />
              <p><strong>{t('generalSettingsDebug.resolvedTopBarName')}:</strong> <span className="font-bold text-blue-500">{generalSettingsDebugInfo.resolvedTopBarName || 'N/A'}</span></p>
              <p><strong>{t('generalSettingsDebug.resolvedMenuName')}:</strong> <span className="font-bold text-green-500">{generalSettingsDebugInfo.resolvedMenuName || 'N/A'}</span></p>
            </>
          }
        </div>
        <Separator />
         <div>
            <h4 className="font-semibold text-muted-foreground">{t('permissionsSection', { count: isLoadingPermissions ? '...' : (Array.isArray(permissions) ? permissions.length : Object.keys(permissions || {}).length) })}</h4>
             {isLoadingPermissions ? <p className='text-muted-foreground italic'>{t('loadingPermissions')}</p> : (
                 <ScrollArea className="h-48 mt-2 rounded-md border p-2 bg-muted/50">
                     <div className="flex flex-wrap gap-2">
                        {Array.isArray(permissions) ? permissions.map(p => <Badge key={p} variant="secondary" className="font-normal">{p}</Badge>) :
                         Object.entries(permissions || {}).filter(([, val]) => val === true).map(([key]) => (
                            <Badge key={key} variant="secondary" className="font-normal">{key}</Badge>
                         ))
                        }
                     </div>
                 </ScrollArea>
             )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="LayoutDashboard" className="mr-2 h-6 w-6 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('welcome')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center w-full min-h-[50vh]">
             <div className="select-none animate-zoom-in-n light-wipe-diagonal-effect-n flex items-center justify-center">
                <Image 
                  src={logoUrl}
                  alt={t('logoAlt')}
                  width={512} 
                  height={512} 
                  className="max-w-[70vw] max-h-[45vh] w-auto h-auto block"
                  priority
                />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {process.env.NODE_ENV === 'development' && <DebugInfoCard />}
    </div>
  );
}
