// src/app/[locale]/(app)/access/methods/page.tsx
"use client";

import React from 'react';
import { useNxAccessMethods } from '@/hooks/use-nx-access-methods';
import { useTranslations } from 'next-intl';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from "@/components/ui/skeleton";
import { AccessDenied } from '@/components/ui/access-denied';
import { Loader2, Save, Info, RefreshCw, Mail, UserPlus, Smartphone, CheckCircle, LogIn, UserPlus2, FilePenLine, UserX2 } from "lucide-react";
import { Label } from '@/components/ui/label';

const accessMethodFields: Array<{ name: any; icon: React.ElementType; }> = [
  { name: 'allowInvitation', icon: Mail },
  { name: 'allowEmailLogin', icon: LogIn },
  { name: 'allowPhoneLogin', icon: Smartphone },
  { name: 'allowGoogleLogin', icon: CheckCircle },
  { name: 'allowAppleLogin', icon: CheckCircle },
  { name: 'allowFacebookLogin', icon: CheckCircle },
];

function AccessMethodsSkeleton() {
    return (
        <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-4 pt-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AccessMethodsPage() {
  const t = useTranslations('accessMethods');
  const commonT = useTranslations('common');
  const {
    form,
    isLoading,
    isSaving,
    isReverting,
    isCustom,
    canEdit,
    isLoadingPermissions,
    pageContextName,
    sourceName,
    onSave,
    onRevert,
  } = useNxAccessMethods();

  const [showRevertDialog, setShowRevertDialog] = React.useState(false);

  const isEffectivelyDisabled = isLoading || isSaving || isReverting || isLoadingPermissions || !canEdit;
  const canRevert = !isEffectivelyDisabled && isCustom;

  if (isLoading || isLoadingPermissions) {
    return <Card><AccessMethodsSkeleton /></Card>;
  }

  if (!canEdit) {
    return <AccessDenied />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pageTitle')} - {t('context', { contextName: pageContextName })}</CardTitle>
        <CardDescription>{t('pageDescription')}</CardDescription>
        <Alert variant={isCustom ? "default" : "info"} className="mt-2">
            <Info className="h-4 w-4" />
            <AlertTitle>
                {isCustom ? 
                    t('customizedAlertTitle', { contextName: pageContextName }) : 
                    t('inheritanceAlertTitle', { sourceName })}
            </AlertTitle>
        </Alert>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)}>
          <fieldset disabled={isEffectivelyDisabled}>
            <CardContent className="space-y-6">
              
              <FormField
                  control={form.control}
                  name="publicRegistrationBehavior"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4">
                      <FormLabel className="text-base font-semibold">{t('fields.publicRegistration.label')}</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <FormItem className="flex-1">
                            <FormControl><RadioGroupItem value="block" id="reg-block" className="peer sr-only" /></FormControl>
                            <Label htmlFor="reg-block" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <UserX2 className="mb-2 h-6 w-6"/>
                              <span className="font-semibold text-center">{t('fields.publicRegistration.block')}</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">{t('fields.publicRegistration.blockDesc')}</span>
                            </Label>
                          </FormItem>
                          <FormItem className="flex-1">
                            <FormControl><RadioGroupItem value="redirect" id="reg-redirect" className="peer sr-only" /></FormControl>
                            <Label htmlFor="reg-redirect" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <FilePenLine className="mb-2 h-6 w-6"/>
                              <span className="font-semibold text-center">{t('fields.publicRegistration.redirect')}</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">{t('fields.publicRegistration.redirectDesc')}</span>
                            </Label>
                          </FormItem>
                          <FormItem className="flex-1">
                            <FormControl><RadioGroupItem value="auto_create" id="reg-autocreate" className="peer sr-only" /></FormControl>
                            <Label htmlFor="reg-autocreate" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <UserPlus2 className="mb-2 h-6 w-6"/>
                              <span className="font-semibold text-center">{t('fields.publicRegistration.autoCreate')}</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">{t('fields.publicRegistration.autoCreateDesc')}</span>
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
              />

              {accessMethodFields.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center"><item.icon className="mr-2 h-4 w-4"/>{t(`fields.${item.name}.label`)}</FormLabel>
                        <FormDescription className="text-xs pl-6">{t(`fields.${item.name}.description`)}</FormDescription>
                      </div>
                      <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="submit" disabled={isEffectivelyDisabled || !form.formState.isDirty}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                {commonT('save')}
              </Button>
              {canRevert && <Button type="button" variant="outline" onClick={() => setShowRevertDialog(true)} disabled={isReverting}>
                {isReverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                {t('revertButton')}</Button>}
            </CardFooter>
          </fieldset>
        </form>
      </Form>
       <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('revertDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('revertDialog.description', { contextName: pageContextName })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('revertDialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onRevert}>{t('revertDialog.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
