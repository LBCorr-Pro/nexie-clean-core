// src/app/[locale]/(app)/access/instances/edit/components/EditInstanceDetailsTab.tsx
"use client";

import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useNxEditInstanceForm, NO_PLAN_VALUE } from '@/hooks/use-nx-edit-instance-form';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EditInstanceDetailsTab() {
  const { 
    form, 
    onSubmit,
    canEdit,
    isSubInstance,
    availablePlans,
    t,
  } = useNxEditInstanceForm();

  const { formState: { isSubmitting, isDirty } } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={!canEdit || isSubmitting}>
          <Card>
            <CardHeader>
              <CardTitle>{isSubInstance ? t('edit.subInstanceDetailsTitle') : t('edit.instanceDetailsTitle')}</CardTitle>
              <CardDescription>{isSubInstance ? t('edit.subInstanceDetailsDesc') : t('edit.instanceDetailsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="instanceName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isSubInstance ? t('createSubInstance.nameLabel') : t('instanceName')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('slug')}</FormLabel>
                    <FormControl><Input {...field} disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {!isSubInstance && (
                  <>
                    <FormField control={form.control} name="instanceType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('instanceType')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                            {(availablePlans || []).map(plan => (<SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>))}
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
                      <FormLabel>{t('status')}</FormLabel>
                      <FormDescription>{isSubInstance ? t('statusDescriptionSubInstance') : t('statusDescriptionInstance')}</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
            </CardContent>
             <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end border-t pt-6">
                <Button type="submit" disabled={!isDirty || isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {t('edit.saveChanges')}
                </Button>
            </CardFooter>
          </Card>
        </fieldset>
      </form>
    </FormProvider>
  );
}
