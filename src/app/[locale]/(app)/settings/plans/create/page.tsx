
// src/app/[locale]/(app)/settings/plans/create/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusSquare, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { useNxPlanForm } from '@/hooks/use-nx-plan-form';
import { useTranslations } from 'next-intl';

export default function NxCreatePlanPage() {
  const t = useTranslations('plans');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  
  const { hasPermission } = useUserPermissions();
  const { form, onSubmit, isSaving } = useNxPlanForm();

  const canManage = hasPermission('master.access_levels.edit');

  if (!canManage) return <AccessDenied />;

  return (
    <Card>
      <CardHeader className="relative">
        <BackButton href={`/${locale}/settings/plans`} className="absolute right-6 top-3"/>
        <div className="pt-2">
            <CardTitle className="section-title !border-none !pb-0">
                <PlusSquare className="section-title-icon"/>
                {t('create.pageTitle')}
            </CardTitle>
            <CardDescription>{t('create.pageDescription')}</CardDescription>
        </div>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
          <CardFooter className="flex flex-col sm:flex-row sm:justify-end border-t pt-6">
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              <Save className="mr-2 h-4 w-4"/> {t('create.saveAndContinue')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
