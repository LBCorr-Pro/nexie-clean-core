
// src/app/[locale]/(app)/performance/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Zap, Trash2, Info, Loader2, AlertTriangle, History, Smartphone, Globe, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNxPerformance } from '@/hooks/use-nx-performance';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';

export default function PerformancePage() {
  const t = useTranslations('performance');
  const commonT = useTranslations('common');
  const {
    isProcessing,
    isLoading,
    canManagePerformance,
    isDialogOpen,
    setIsDialogOpen,
    dialogContent,
    APP_CACHE_KEY,
    actions,
  } = useNxPerformance();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManagePerformance) {
    return (
      <Alert variant="destructive">
        <Icon name="AlertTriangle" className="h-4 w-4" />
        <AlertTitle>{commonT('accessDenied.title')}</AlertTitle>
        <AlertDescription>{t('permissionDenied')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Zap className="mr-3 h-7 w-7 text-primary" />
            {t('pageTitle')}
          </CardTitle>
          <CardDescription>{t('pageDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Dexie Cache Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Database className="mr-2 h-5 w-5 text-blue-600" />{t('dexieCard.title')}</CardTitle>
              <CardDescription>{t('dexieCard.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-destructive/50 rounded-md space-y-3 bg-destructive/5">
                <h3 className="font-semibold flex items-center text-destructive"><AlertTriangle className="mr-2 h-4 w-4"/>{t('dexieCard.buttonText')}</h3>
                <Alert variant="destructive" className="text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('dexieCard.alertTitle')}</AlertTitle>
                  <AlertDescription>{t('dexieCard.alertDescription')}</AlertDescription>
                </Alert>
                <Button onClick={actions.confirmDexieClear} disabled={isProcessing} variant="destructive" size="sm" className="w-full sm:w-auto">
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  {t('dexieCard.buttonText')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Browser Cache Card */}
          <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Smartphone className="mr-2 h-5 w-5 text-blue-600" />{t('browserCacheCard.title')}</CardTitle>
                <CardDescription>{t('browserCacheCard.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border rounded-md space-y-3">
                    <h3 className="font-semibold flex items-center"><Trash2 className="mr-2 h-4 w-4 text-muted-foreground"/>{t('browserCacheCard.appCacheTitle')}</h3>
                    <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('browserCacheCard.appCacheDescription', { cacheKey: APP_CACHE_KEY }) }} />
                    <Button onClick={actions.clearAppCache} disabled={isProcessing} variant="outline" size="sm">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        {t('browserCacheCard.appCacheButton')}
                    </Button>
                </div>
                <div className="p-4 border rounded-md space-y-3 border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/50">
                    <h3 className="font-semibold flex items-center text-amber-700 dark:text-amber-300"><AlertTriangle className="mr-2 h-4 w-4"/>{t('browserCacheCard.localStorageTitle')}</h3>
                    <Alert variant="destructive" className="text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('browserCacheCard.localStorageAlertTitle')}</AlertTitle>
                        <AlertDescription>{t('browserCacheCard.localStorageAlertDescription')}</AlertDescription>
                    </Alert>
                    <Button onClick={actions.confirmLocalStorageClear} disabled={isProcessing} variant="destructive" size="sm" className="w-full sm:w-auto">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                        {t('browserCacheCard.localStorageButton')}
                    </Button>
                </div>
                <div className="p-4 border rounded-md space-y-3 border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/50">
                    <h3 className="font-semibold flex items-center text-amber-700 dark:text-amber-300"><AlertTriangle className="mr-2 h-4 w-4"/>{t('browserCacheCard.sessionStorageTitle')}</h3>
                    <Alert variant="destructive" className="text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('browserCacheCard.sessionStorageAlertTitle')}</AlertTitle>
                        <AlertDescription>{t('browserCacheCard.sessionStorageAlertDescription')}</AlertDescription>
                    </Alert>
                    <Button onClick={actions.confirmSessionStorageClear} disabled={isProcessing} variant="destructive" size="sm" className="w-full sm:w-auto">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                        {t('browserCacheCard.sessionStorageButton')}
                    </Button>
                </div>
            </CardContent>
          </Card>
          
          {/* Files Cache Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-blue-600" />{t('filesCacheCard.title')}</CardTitle>
              <CardDescription>{t('filesCacheCard.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t('filesCacheCard.p1')}</p>
                <p>{t('filesCacheCard.p2')}</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>{t('filesCacheCard.windowsLinux', { keys: "<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>" })}</li>
                    <li>{t('filesCacheCard.mac', { keys: "<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>" })}</li>
                </ul>
                <p>{t('filesCacheCard.p3')}</p>
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>{commonT('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={dialogContent.onConfirm} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogContent.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
