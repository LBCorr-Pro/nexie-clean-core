// src/app/[locale]/(app)/access/instances/create/page.tsx
// MASTER PAGE: Criação de Instâncias e Sub-instâncias
"use client";

import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Loader2, Save, Building } from 'lucide-react';

import { useNxInstanceForm } from '@/hooks/use-nx-instance-form';
import { NO_PLAN_VALUE } from '@/hooks/use-nx-instance-form';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { AccessDenied } from '@/components/ui/access-denied';

export default function CreateInstanceMasterPage() {
  const t = useTranslations('instanceManagement');
  const {
    form,
    onSubmit,
    isLoading,
    isSaving,
    isCheckingSlug,
    isGeneratingSlug,
    canCreate,
    isSubInstanceMode,
    parentInstanceName,
    availablePlans,
    locale
  } = useNxInstanceForm();

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!canCreate) {
    return <AccessDenied />;
  }
  
  const backHref = isSubInstanceMode 
    ? `/${locale}/access/instances/edit/${form.getValues('parentId')}` 
    : `/${locale}/access/instances`;
    
  const title = isSubInstanceMode ? t('createSubInstance.title') : t('create.title');
  const description = isSubInstanceMode ? t('createSubInstance.description', { parentName: parentInstanceName }) : t('create.description');


  return (
    <FormProvider {...form}> 
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader className="relative">
              <BackButton href={backHref} className="absolute right-6 top-3" />
              <div className="pt-2"> 
                <CardTitle className="section-title !border-none !pb-0">
                  <Building className="section-title-icon" />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="instanceName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isSubInstanceMode ? t('createSubInstance.nameLabel') : t('instanceName')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('slug')}</FormLabel>
                  <div className="relative">
                    <FormControl><Input variant="slug" {...field} /></FormControl>
                    {(isCheckingSlug || isGeneratingSlug) && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                  </div>
                  <FormDescription>{t('slugDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              
              {!isSubInstanceMode && (
                <>
                  <FormField control={form.control} name="instanceType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('instanceType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('selectType')} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="default">{t('typeDefault')}</SelectItem>
                          <SelectItem value="dev">{t('typeDev')}</SelectItem>
                          <SelectItem value="master">{t('typeMaster')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="planId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('planLabel')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || NO_PLAN_VALUE}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('selectPlan')} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={NO_PLAN_VALUE}>{t('noPlan')}</SelectItem>
                          {availablePlans.map(plan => (<SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('status')}</FormLabel>
                    <FormDescription>{isSubInstanceMode ? t('statusDescriptionSubInstance') : t('statusDescriptionInstance')}</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end border-t pt-6">
              <Button type="submit" disabled={isSaving || isCheckingSlug} className="w-full sm:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t('saveInstance')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}
