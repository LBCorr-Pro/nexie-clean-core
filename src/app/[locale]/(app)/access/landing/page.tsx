
// src/app/[locale]/(app)/access/landing/page.tsx
"use client";

import * as React from "react";
import { FormProvider } from "react-hook-form";
import { useTranslations } from 'next-intl';
import { useNxLoginBehavior } from '@/hooks/use-nx-login-behavior';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, LogIn, Info, ShieldCheck } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessDenied } from "@/components/ui/access-denied";

const ContextAlert: React.FC<{ title: string; description: string; }> = ({ title, description }) => {
    if (!title) return null;
    return (
        <Alert variant='info' className="mt-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertBoxDescription>{description}</AlertBoxDescription>
        </Alert>
    );
};

export default function LoginPageBehaviorSettingsPage() {
  const t = useTranslations('loginBehavior');
  const {
    form,
    isLoading,
    isSaving,
    isLoadingPermissions,
    canEdit,
    availablePages,
    contextAlert,
    onSubmit,
  } = useNxLoginBehavior();

  const isFormEffectivelyDisabled = isLoading || isSaving || !canEdit;

  if (isLoading || isLoadingPermissions) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!canEdit) {
      return <AccessDenied />
  }

  return (
    <div className="space-y-6">
        <BackButton />
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <LogIn className="mr-2 h-6 w-6 text-primary" /> 
                            {t('pageTitle')}
                        </CardTitle>
                        <CardDescription>{t('pageDescription')}</CardDescription>
                        <ContextAlert title={contextAlert.title} description={contextAlert.description} />
                    </CardHeader>
                    <fieldset disabled={isFormEffectivelyDisabled}>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="loginPageActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('form.loginPageActive.label')}</FormLabel>
                                            <FormDescription>{t('form.loginPageActive.description')}</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fallbackPageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.fallbackPageUrl.label')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={form.watch("loginPageActive")}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoading ? t('form.fallbackPageUrl.loading') : t('form.fallbackPageUrl.placeholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availablePages.length > 0 ? (
                                                    availablePages.map(page => (
                                                        <SelectItem key={page.menuKey} value={page.originalHref}>{page.displayName} ({page.originalHref})</SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="/dashboard" disabled>{t('form.fallbackPageUrl.noPages')}</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>{t('form.fallbackPageUrl.description')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md text-sm text-blue-800 dark:text-blue-200">
                                <Info className="h-5 w-5 mr-2 inline-block align-text-bottom" />
                                {t('infoBox')}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <div className="flex w-full justify-end">
                                <Button type="submit" disabled={isFormEffectivelyDisabled || !form.formState.isDirty}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('common.save')}
                                </Button>
                            </div>
                        </CardFooter>
                    </fieldset>
                </Card>
            </form>
        </FormProvider>
    </div>
  );
}
