// src/app/[locale]/(app)/account/preferences/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/nx-use-toast';
import { useNxAppearance } from '@/hooks/use-nx-appearance';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Settings, Languages, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/ui/back-button';

const PreferencesSchema = z.object({
  language: z.string().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
});

type PreferencesFormData = z.infer<typeof PreferencesSchema>;

export default function UserPreferencesPage() {
  const t = useTranslations('accountPreferencesPage');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const { appearanceSettings, isLoading, isSaving, saveAppearanceSettings } = useNxAppearance();

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(PreferencesSchema),
  });

  useEffect(() => {
    if (appearanceSettings) {
      form.reset({
        language: appearanceSettings.language,
        themePreference: appearanceSettings.themePreference,
      });
    }
  }, [appearanceSettings, form]);

  const onSubmit = async (data: PreferencesFormData) => {
    const result = await saveAppearanceSettings(data);
    if (result.success) {
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDesc') });
      form.reset(data, { keepDirty: false });
    } else {
      toast({ title: t('toasts.saveErrorTitle'), variant: 'destructive' });
    }
  };

  const isFormDisabled = isLoading || isSaving;

  return (
    <div className="space-y-6">
      <Card>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={isFormDisabled}>
              <CardHeader className="relative">
                <BackButton className="absolute right-6 top-3"/>
                <div className="pt-2"> 
                  <CardTitle className="section-title !border-none !pb-0">
                    <Settings className="section-title-icon"/>
                    {t('pageTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('pageDescription')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {isLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Languages />{t('languageLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="themePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Palette />{t('themeLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="light">Claro</SelectItem>
                              <SelectItem value="dark">Escuro</SelectItem>
                              <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <div className="flex w-full justify-end">
                  <Button type="submit" disabled={isFormDisabled || !form.formState.isDirty}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {tCommon('save')}
                  </Button>
                </div>
              </CardFooter>
            </fieldset>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
