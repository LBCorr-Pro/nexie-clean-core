// src/app/[locale]/(app)/settings/menus/bottom-bar/page.tsx
"use client";

import React, { useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/nx-use-toast";
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Loader2, Save, PanelBottom } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { BottomBarTabManager } from './components/BottomBarTabManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { dequal } from 'dequal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomBarConfigSchema, type BottomBarTab } from '@/lib/types/menus';
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';

const BottomBarSettingsSchema = z.object({
  bottomBarConfig: BottomBarConfigSchema,
});

type BottomBarSettingsFormData = z.infer<typeof BottomBarSettingsSchema>;

const PreviewSync = () => {
    const { control } = useFormContext<BottomBarSettingsFormData>();
    const watchedConfig = useWatch({ control });
    // This part would ideally be connected to a global preview context.
    // For now, we assume it exists and is handled elsewhere.
    // const { setBottomBarPreviewConfig } = useDebugMenu();
    // useEffect(() => { setBottomBarPreviewConfig(watchedConfig.bottomBarConfig); }, [watchedConfig, setBottomBarPreviewConfig]);
    return null;
};

const BottomBarForm = () => {
    const t = useTranslations('menus.bottomBar');
    const tCommon = useTranslations('common');
    const { hasPermission } = useUserPermissions();
    const canEdit = hasPermission('master.settings.menu.edit');
    const { appearanceSettings, isLoading, isSaving, saveAppearanceSettings } = useNxAppearance();
    const { control, handleSubmit, formState, getValues, reset } = useFormContext<BottomBarSettingsFormData>();
    const { toast } = useToast();

    const showDesktopPosition = useWatch({ control, name: 'bottomBarConfig.enabledOnDesktop' });
    const enableTabsSystem = useWatch({ control, name: 'bottomBarConfig.enableTabs' });

    const onSubmit = useCallback(async (data: BottomBarSettingsFormData) => {
        const result = await saveAppearanceSettings({ 
          bottomBarConfig: data.bottomBarConfig 
        });
        
        if(result.success) {
          toast({ title: t('toasts.saveSuccess'), description: t('toasts.saveSuccessDesc') });
          reset(data, { keepDirty: false });
        } else {
          const errorMessage = 'error' in result ? result.error : ('message' in result ? result.message : t('toasts.saveError'));
          toast({ title: t('toasts.saveError'), description: errorMessage, variant: "destructive" });
        }
    }, [saveAppearanceSettings, t, toast, reset]);

    if (isLoading) {
        return <div className="flex h-96 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
      
    if (!canEdit) return <AccessDenied />;
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                 <CardHeader className="relative">
                    <BackButton href="/settings/menus" className="absolute right-6 top-3" />
                    <div className="pt-2"> 
                        <CardTitle className="section-title !border-none !pb-0"><PanelBottom className="section-title-icon"/>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </CardHeader>
                 <fieldset disabled={isLoading || isSaving || !canEdit}>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4 pt-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        ) : (
                           <div className="space-y-6">
                                <div className="space-y-4 rounded-lg border p-4">
                                    <h3 className="text-lg font-semibold flex items-center">{t('generalConfig.title')}</h3>
                                     <FormField
                                        control={control}
                                        name="bottomBarConfig.enabledOnDesktop"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                <FormLabel>{t('generalConfig.enableOnDesktop')}</FormLabel>
                                                <FormDescription>{t('generalConfig.enableOnDesktopDesc')}</FormDescription>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    {showDesktopPosition && (
                                        <FormField control={control} name="bottomBarConfig.desktopPosition" render={({ field }) => (
                                            <FormItem><FormLabel>{t('generalConfig.desktopPosition')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bottom">{t('generalConfig.positionBottom')}</SelectItem><SelectItem value="right">{t('generalConfig.positionRight')}</SelectItem></SelectContent></Select></FormItem>
                                        )}/>
                                    )}
                                </div>
                                
                                <Separator />

                                 <div className="space-y-4 rounded-lg border p-4">
                                    <FormField control={control} name="bottomBarConfig.enableTabs" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between"><div className="space-y-0.5"><FormLabel className="text-base">{t('tabsConfig.enableTabs')}</FormLabel><FormDescription>{t('tabsConfig.enableTabsDesc')}</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                    )}/>
                                     {enableTabsSystem && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={control}
                                                    name="bottomBarConfig.tabsAlignment"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-3"><FormLabel>{t('tabsConfig.tabsAlignment')}</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2 sm:gap-4">
                                                                <FormItem><Label htmlFor="align-start" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 sm:p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><FormControl><RadioGroupItem value="start" id="align-start" className="sr-only peer" /></FormControl>{t('tabsConfig.alignStart')}</Label></FormItem>
                                                                <FormItem><Label htmlFor="align-center" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 sm:p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><FormControl><RadioGroupItem value="center" id="align-center" className="sr-only peer" /></FormControl>{t('tabsConfig.alignCenter')}</Label></FormItem>
                                                                <FormItem><Label htmlFor="align-end" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 sm:p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><FormControl><RadioGroupItem value="end" id="align-end" className="sr-only peer" /></FormControl>{t('tabsConfig.alignEnd')}</Label></FormItem>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                     )}
                                 </div>
                                
                                <Separator/>
                                <BottomBarTabManager namePrefix="bottomBarConfig.tabs" />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <div className="flex w-full justify-end">
                            <Button type="submit" disabled={isLoading || isSaving || !canEdit || !formState.isDirty}>
                                {(isSaving || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                {tCommon('save')}
                            </Button>
                        </div>
                    </CardFooter>
                 </fieldset>
            </Card>
        </form>
    )
}

export default function BottomBarSettingsPage() {
  const { appearanceSettings, isLoading } = useNxAppearance();

  const defaultValues = useMemo((): BottomBarSettingsFormData => ({
    bottomBarConfig: {
      enabledOnDesktop: false,
      desktopPosition: 'bottom',
      enableTabs: false,
      showTitleOnSingleTab: false,
      tabsAlignment: 'start',
      tabsDisplayMode: 'icon_and_text',
      tabs: [],
    }
  }), []);

  const formMethods = useForm<BottomBarSettingsFormData>({
    resolver: zodResolver(BottomBarSettingsSchema),
    defaultValues,
  });
  
  const { reset, getValues } = formMethods;

  useEffect(() => {
    if (isLoading || !appearanceSettings) return;

    const baseConfig = defaultValues.bottomBarConfig;
    const savedConfig = appearanceSettings.bottomBarConfig;
    
    const mergedConfig = {
      ...baseConfig,
      ...savedConfig,
      tabs: (savedConfig?.tabs || []).map((tab: Partial<BottomBarTab>) => ({
        ...tab,
        items: tab.items || [],
      })),
    };
    
    if (!dequal(getValues().bottomBarConfig, mergedConfig)) {
        reset({ bottomBarConfig: mergedConfig as any });
    }

  }, [appearanceSettings, isLoading, reset, defaultValues, getValues]);
  
  return (
     <FormProvider {...formMethods}>
        <PreviewSync />
        <BottomBarForm />
     </FormProvider>
  );
}
