
// src/app/[locale]/(app)/stats/general/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icon } from '@/components/ui/icon';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useNxStats } from '@/hooks/use-nx-stats';
import { Skeleton } from '@/components/ui/skeleton'; // CORREÇÃO: Caminho e nome do componente corrigidos
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackButton } from "@/components/ui/back-button";

const PageSkeleton = () => ( // Componente de skeleton para a página inteira
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-24" />
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-4/5 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <Skeleton className="h-80 w-full" />
            </CardContent>
        </Card>
    </div>
);

export default function GeneralStatsPage() {
  const t = useTranslations('stats');
  const tCommon = useTranslations('common');

  const {
    isLoading,
    canViewStats,
    recentActivity,
    statsCards,
    chartConfig,
  } = useNxStats();

  // Translating chart config labels and data keys
  const translatedChartConfig = {
    logins: { ...chartConfig.logins, label: t('logins') },
    newUsers: { ...chartConfig.newUsers, label: t('newUsers') },
    actions: { ...chartConfig.actions, label: t('totalActions') },
  };

  const translatedRecentActivity = recentActivity.map(item => ({
      ...item,
      date: t(`days.${item.date.toLowerCase()}`)
  }));

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!canViewStats) {
    return (
        <div className="p-4">
            <Alert variant="destructive">
                <Icon name="AlertTriangle" className="h-4 w-4" />
                <AlertTitle>{tCommon('accessDenied.title')}</AlertTitle>
                <AlertDescription>{t('permissionDenied')}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <CardTitle className="flex items-center pt-2">
                <Icon name="BarChart" className="mr-2 h-6 w-6 text-primary" />
                {t('pageTitle')}
            </CardTitle>
          <CardDescription>
            {t('pageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {statsCards && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('activeUsers')}</CardTitle>
                      <Icon name="Users" className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{statsCards.activeUsers.value}</div>
                      <p className="text-xs text-muted-foreground">{statsCards.activeUsers.label}</p>
                      <p className="text-xs mt-1 text-green-600">{statsCards.activeUsers.percentage}</p>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('createdInstances')}</CardTitle>
                      <Icon name="Layers" className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{statsCards.createdInstances.value}</div>
                      <p className="text-xs text-muted-foreground">{statsCards.createdInstances.label}</p>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('activeModules')}</CardTitle>
                      <Icon name="Package" className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{statsCards.activeModules.value}</div>
                      <p className="text-xs text-muted-foreground">{statsCards.activeModules.label}</p>
                  </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="TrendingUp" className="mr-2 h-5 w-5" />
                {t('recentActivity')}
              </CardTitle>
              <CardDescription>
                {t('recentActivityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={translatedChartConfig} className="min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={translatedRecentActivity} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Legend wrapperStyle={{fontSize: '0.8rem'}} />
                      <Bar dataKey="logins" fill="var(--color-logins)" radius={[4, 4, 0, 0]} name={t('logins')} />
                      <Bar dataKey="newUsers" fill="var(--color-newUsers)" radius={[4, 4, 0, 0]} name={t('newUsers')} />
                      <Bar dataKey="actions" fill="var(--color-actions)" radius={[4, 4, 0, 0]} name={t('totalActions')} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
          </Card>
          
          <p className="text-sm text-muted-foreground text-center italic pt-4">
            {t('moreChartsComingSoon')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
