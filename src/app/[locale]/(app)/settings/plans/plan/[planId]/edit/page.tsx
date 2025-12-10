
// src/app/[locale]/(app)/settings/plans/plan/[planId]/edit/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Save, Eye } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { useNxPlanEditor } from '@/hooks/use-nx-plan-editor';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function PlanDetailsForm() {
  const t = useTranslations('plans');
  const { form, isSaving, onUpdate } = useNxPlanEditor();

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onUpdate)}>
        <Card>
          <CardHeader>
              <CardTitle>{t('edit.detailsForm.title')}</CardTitle>
              <CardDescription>{t('edit.detailsForm.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('create.form.nameLabel')}</FormLabel>
                <FormControl><Input placeholder={t('create.form.namePlaceholder')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('create.form.descriptionLabel')}</FormLabel>
                <FormControl><Textarea placeholder={t('create.form.descriptionPlaceholder')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.form.statusLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t('statusBadge.active')}</SelectItem>
                      <SelectItem value="inactive">{t('statusBadge.inactive')}</SelectItem>
                      <SelectItem value="legacy">{t('statusBadge.legacy')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage/>
                </FormItem>
              )}/>
              <FormField control={form.control} name="order" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.form.orderLabel')}</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              <Save className="mr-2 h-4 w-4"/> {t('common.save')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}

export default function NxEditPlanPage() {
  const t = useTranslations('plans.edit');
  const params = useParams();
  const locale = params.locale as string;

  const { hasPermission } = useUserPermissions();
  const { plan, isLoading } = useNxPlanEditor();

  const canManage = hasPermission('master.access_levels.edit');

  if (!canManage) return <AccessDenied />;

  if (isLoading) {
    return <div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Eye className="h-6 w-6"/> {t('pageTitle')} - <span className="text-muted-foreground">{plan?.name}</span>
                </h1>
                <p className="text-muted-foreground">{t('pageDescription')}</p>
            </div>
            <BackButton href={`/${locale}/settings/plans`} />
        </div>

        <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
                <TabsTrigger value="features" disabled>{t('tabs.features')}</TabsTrigger>
                <TabsTrigger value="permissions" disabled>{t('tabs.permissions')}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
                <PlanDetailsForm />
            </TabsContent>
            <TabsContent value="features">
                {/* Feature management will be here */}
            </TabsContent>
            <TabsContent value="permissions">
                {/* Permission management will be here */}
            </TabsContent>
        </Tabs>
    </div>
  );
}
