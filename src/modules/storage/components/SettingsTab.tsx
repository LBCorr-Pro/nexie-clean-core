// src/modules/storage/components/SettingsTab.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/nx-use-toast";
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { refs } from '@/lib/firestore-refs';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const MASTER_MODULE_ID = 'storage';

const StorageSettingsSchema = z.object({
  enableStorageModule: z.boolean().default(false),
  customized: z.boolean().optional(),
});

type StorageSettingsFormData = z.infer<typeof StorageSettingsSchema>;

export function SettingsTab() {
  const t = useTranslations('storageModule.settings');
  const { toast } = useToast();
  const { isActingAsMaster } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<StorageSettingsFormData>({
    resolver: zodResolver(StorageSettingsSchema),
    defaultValues: { enableStorageModule: false, customized: false },
  });

  const canConfigure = hasPermission('module.storage.configure');
  const pageEffectivelyDisabled = isLoadingPage || isSaving || isLoadingPermissions || !canConfigure || !isActingAsMaster;

  const loadSettings = React.useCallback(async () => {
    setIsLoadingPage(true);
    let settingsToLoad: Partial<StorageSettingsFormData> = {};
    try {
      const configRef = doc(refs.master.modulesDoc(), MASTER_MODULE_ID, 'settings');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        settingsToLoad = configSnap.data();
      }
      form.reset({ ...form.formState.defaultValues, ...settingsToLoad });
    } catch (error) {
      console.error("Error fetching storage settings:", error);
      toast({ title: t('toasts.loadError'), variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [form, toast, t]);

  React.useEffect(() => { loadSettings(); }, [loadSettings]);

  const onSubmit = async (data: StorageSettingsFormData) => {
    if (pageEffectivelyDisabled) {
      toast({ title: t('toasts.actionNotAllowed'), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const configRef = doc(refs.master.modulesDoc(), MASTER_MODULE_ID, 'settings');
      await setDoc(configRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDescription') });
    } catch (error: any) {
      toast({ title: t('toasts.saveError'), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoadingPermissions || isLoadingPage) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={pageEffectivelyDisabled}>
          <div className="space-y-6">
            {!isActingAsMaster ? (
              <Alert variant="info">
                  <AlertTriangle className="h-4 w-4"/>
                  <AlertTitle>{t('alerts.globalConfigTitle')}</AlertTitle>
                  <AlertDescription>{t('alerts.globalConfigDescription')}</AlertDescription>
              </Alert>
            ) : !canConfigure ? (
               <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4"/>
                  <AlertTitle>{t('alerts.permissionDeniedTitle')}</AlertTitle>
                  <AlertDescription>{t('alerts.permissionDeniedDescription')}</AlertDescription>
              </Alert>
            ) : (
              <FormField
                control={form.control}
                name="enableStorageModule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('form.enableStorageLabel')}</FormLabel>
                      <FormDescription>
                        {t('form.enableStorageDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            {isActingAsMaster && canConfigure && (
                <div className="flex w-full justify-end">
                  <Button type="submit" disabled={pageEffectivelyDisabled || !form.formState.isDirty}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />{t('saveButton')}
                  </Button>
                </div>
            )}
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}