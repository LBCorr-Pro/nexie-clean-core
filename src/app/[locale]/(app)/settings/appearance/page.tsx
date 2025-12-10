// src/app/[locale]/(app)/settings/appearance/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/nx-use-toast";
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Palette, Save, Undo2, Component, Type, Shapes, Layers, ImageIcon, PictureInPicture, PanelLeft, PanelTop, PanelBottom } from "lucide-react";
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainColorsTab } from './components/MainColorsTab';
import { LayoutEffectsTab } from './components/LayoutEffectsTab';
import { BackgroundTab } from './components/BackgroundTab';
import { ComponentsTab } from './components/ComponentsTab';
import { TypographyTab } from './components/TypographyTab';
import { IdentityTab } from './components/IdentityTab';
import { TopBarTab } from './components/TopBarTab';
import { BottomBarTab } from './components/BottomBarTab';
import { LeftSidebarTab } from './components/LeftSidebarTab';
import { ShapeAndStyleTab } from './components/ShapeAndStyleTab';
import { AppearancePreviewManager } from './components/AppearancePreviewManager';
import { BackButton } from "@/components/ui/back-button";
import { ThemePresetSelector } from "@/components/shared/form/ThemePresetSelector";
import { ColorPresetSelector } from "@/components/shared/form/ColorPresetSelector";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs';
import { Icon } from '@/components/ui/icon';
import { defaultAppearance } from '@/lib/default-appearance';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useAuthContext } from '@/context/AuthContext';
import { AccessDenied } from '@/components/ui/access-denied';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const appearanceSettingsSchema = z.object({}).passthrough();
type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;

const tabConfig = [
    { value: "identity", labelKey: "identity", icon: "ImageIcon" },
    { value: "main-colors", labelKey: "mainColors", icon: "Palette" },
    { value: "background", labelKey: "background", icon: "PictureInPicture" },
    { value: "typography", labelKey: "typography", icon: "Type" },
    { value: "components", labelKey: "components", icon: "Component" },
    { value: "shape-style", labelKey: "shapesAndStyles", icon: "Shapes" },
    { value: "layout-effects", labelKey: "layoutAndEffects", icon: "Layers" },
    { value: "left-sidebar", labelKey: "leftSidebar", icon: "PanelLeft" },
    { value: "top-bar", labelKey: "topBar", icon: "PanelTop" },
    { value: "bottom-bar", labelKey: "bottomBar", icon: "PanelBottom" },
];

export default function AppearanceSettingsPage() {
  const t = useTranslations('appearance');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { user } = useAuthContext();

  const canManage = hasPermission('master.settings.appearance.edit');
  
  const {
    appearanceSettings: savedAppearanceSettings,
    isLoading,
    isSaving,
    saveAppearanceSettings,
    revertToInheritedSettings,
  } = useNxAppearance();

  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [presetDialogConfig, setPresetDialogConfig] = useState({ type: 'theme', name: '' });

  const activeTab = searchParams.get('tab') || "identity";
  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const formMethods = useForm<AppearanceSettingsFormData>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: savedAppearanceSettings || defaultAppearance,
  });

  useEffect(() => {
    if (savedAppearanceSettings) {
      formMethods.reset(savedAppearanceSettings);
    }
  }, [savedAppearanceSettings, formMethods]);

  const handlePresetSelect = (preset: Partial<AppearanceSettings>) => {
    if (!canManage) return;
    formMethods.reset({ ...formMethods.getValues(), ...preset });
    toast({ title: t('toasts.presetLoadedTitle'), description: t('toasts.presetLoadedDesc') });
  };
  
  const openSavePresetDialog = (type: 'theme' | 'color') => {
    if (!canManage) return;
    setPresetDialogConfig({ type, name: '' });
    setShowSavePresetDialog(true);
  };
  
  const handleConfirmSavePreset = async () => {
    const { type, name } = presetDialogConfig;
    if (!name) {
      toast({ title: t('dialogs.validationError'), variant: "destructive" });
      return;
    }
    
    console.log(`Simulating save preset: Type - ${type}, Name - ${name}`);
    toast({ title: t('toasts.presetSavedTitle'), description: t('toasts.presetSavedDesc', { presetName: name }) });
    setShowSavePresetDialog(false);
  };
  
  const onInvalid = (errors: any) => {
      console.error(errors);
      toast({ title: t('toasts.validationErrorTitle'), description: t('toasts.validationErrorDesc'), variant: "destructive" });
  };

  const saveUserPreferences = useCallback(async (prefs: Partial<Pick<AppearanceSettings, 'language' | 'themePreference'>>) => {
      if (!user) return;
      if (Object.keys(prefs).length === 0) return;

      const userRef = doc(db, 'users', user.uid);
      try {
          await setDoc(userRef, { settings: prefs }, { merge: true });
      } catch (error) {
          console.error("Failed to save user preferences:", error);
          toast({ title: "Erro", description: "Falha ao salvar preferências de usuário.", variant: "destructive" });
      }
  }, [user, toast]);

  const onSubmit = async (data: AppearanceSettingsFormData) => {
    if (!canManage) return;

    const { language, themePreference, ...dirtyFields } = formMethods.formState.dirtyFields;
    
    if (language || themePreference) {
        const userPrefs: Partial<AppearanceSettings> = {};
        if (language && typeof data.language === 'string') userPrefs.language = data.language;
        const themeValue = data.themePreference;
        if (themePreference && typeof themeValue === 'string' && ['system', 'light', 'dark'].includes(themeValue)) {
            userPrefs.themePreference = themeValue as 'system' | 'light' | 'dark';
        }
        await saveUserPreferences(userPrefs);
    }
    
    const appearanceDataToSave = Object.keys(dirtyFields).reduce((acc, key) => {
        if (key !== 'language' && key !== 'themePreference') {
            (acc as any)[key as keyof AppearanceSettings] = data[key as keyof AppearanceSettings];
        }
        return acc;
    }, {} as Partial<AppearanceSettings>);
    
    if (Object.keys(appearanceDataToSave).length === 0) {
        toast({ title: "Nenhuma alteração de aparência para salvar." });
        return;
    }

    const result = await saveAppearanceSettings(appearanceDataToSave);
    
    if (result.success) {
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDesc') });
      formMethods.reset(data, { keepDirty: false, keepValues: true });
    } else {
      const errorMessage = 'error' in result && result.error ? result.error : t('toasts.saveErrorTitle');
      toast({ title: t('toasts.saveErrorTitle'), description: errorMessage, variant: "destructive" });
    }
  };
  
  const isFormEffectivelyDisabled = isLoading || isLoadingPermissions || isSaving || !canManage;
  const isInherited = !(savedAppearanceSettings as any)?.__is_overwritten__;
  const canRevert = !isInherited && !isLoading && !isSaving && canManage;

  if (isLoadingPermissions || isLoading) {
    return <div className="flex h-96 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!canManage) {
      return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <FormProvider {...formMethods}>
        <AppearancePreviewManager />
        <form id="appearance-form" onSubmit={formMethods.handleSubmit(onSubmit, onInvalid)}>
          <Card>
            <CardHeader className="relative">
                <BackButton className="absolute right-6 top-3"/>
                 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2">
                    <div>
                        <CardTitle className="section-title !border-none !pb-0">
                            <Palette className="section-title-icon" />
                            {t('pageTitle')}
                        </CardTitle>
                        <CardDescription>{t('pageDescription')}</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start md:self-center">
                       <ThemePresetSelector onPresetSelect={handlePresetSelect} />
                       <ColorPresetSelector onPresetSelect={handlePresetSelect} />
                    </div>
                </div>
            </CardHeader>
            <fieldset disabled={isFormEffectivelyDisabled}>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="h-auto shrink-0 flex-wrap justify-start">
                      {tabConfig.map((tab) => (
                          <TabsTrigger key={tab.value} value={tab.value}>
                              <Icon name={tab.icon as any} className="w-4 h-4 mr-2" />
                              {t(`tabs.${tab.labelKey}`)}
                          </TabsTrigger>
                      ))}
                  </TabsList>
                  <TabsContent value="identity"><IdentityTab /></TabsContent>
                  <TabsContent value="main-colors"><MainColorsTab /></TabsContent>
                  <TabsContent value="background"><BackgroundTab /></TabsContent>
                  <TabsContent value="typography"><TypographyTab /></TabsContent>
                  <TabsContent value="components"><ComponentsTab /></TabsContent>
                  <TabsContent value="shape-style"><ShapeAndStyleTab /></TabsContent>
                  <TabsContent value="layout-effects"><LayoutEffectsTab /></TabsContent>
                  <TabsContent value="left-sidebar"><LeftSidebarTab /></TabsContent>
                  <TabsContent value="top-bar"><TopBarTab /></TabsContent>
                  <TabsContent value="bottom-bar"><BottomBarTab /></TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 border-t pt-6">
                <Button onClick={revertToInheritedSettings} variant="outline" type="button" disabled={!canRevert}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Undo2 className="mr-2 h-4 w-4" />}
                    {t('buttons.revert')}
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-col-reverse sm:flex-row">
                    <Button onClick={() => openSavePresetDialog('color')} variant="outline" type="button" disabled={isFormEffectivelyDisabled} className="w-full sm:w-auto">{t('buttons.saveAsColorPreset')}</Button>
                    <Button onClick={() => openSavePresetDialog('theme')} variant="outline" type="button" disabled={isFormEffectivelyDisabled} className="w-full sm:w-auto">{t('buttons.saveAsThemePreset')}</Button>
                    <Button type="submit" disabled={isFormEffectivelyDisabled || !formMethods.formState.isDirty} className="w-full sm:w-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {tCommon('save')}
                    </Button>
                </div>
              </CardFooter>
            </fieldset>
          </Card>
        </form>
      </FormProvider>

      <AlertDialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.presetNamePrompt', { type: presetDialogConfig.type === 'theme' ? t('dialogs.themePreset') : t('dialogs.colorPreset') })}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="preset-name" className="sr-only">{t('dialogs.presetNameLabel')}</Label>
            <Input id="preset-name" value={presetDialogConfig.name} onChange={(e) => setPresetDialogConfig(prev => ({ ...prev, name: e.target.value }))} placeholder={t('dialogs.presetNamePlaceholder')} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSavePresetDialog(false)}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSavePreset} disabled={!presetDialogConfig.name}>{tCommon('save')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
