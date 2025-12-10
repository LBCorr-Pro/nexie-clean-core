// src/hooks/use-nx-general-settings-form.ts
"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/nx-use-toast";
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useTranslations } from 'next-intl';
import { SocialLinkSchema } from '@/components/shared/form/SocialLinksInput';
import { useNxGeneralSettings } from "./use-nx-general-settings"; 

const urlOrRelativePath = z.string().refine((val) => {
    if (!val || val.trim() === '') return true;
    try { new URL(val); return true; } catch (e) { return val.startsWith('/'); }
}, {
    message: "Deve ser uma URL válida ou um caminho relativo."
}).optional().or(z.literal(''));

const createGeneralSettingsSchema = (t: (key: string) => string) => z.object({
  systemName: z.string().min(1, t('zod.systemNameRequired')),
  nickname: z.string().optional(),
  systemDescription: z.string().optional(),
  logoUrl: urlOrRelativePath,
  logoCollapsedUrl: urlOrRelativePath,
  faviconUrl: urlOrRelativePath,
  defaultContactEmail: z.string().email({ message: t('zod.invalidEmail') }).optional().or(z.literal('')),
  defaultWhatsapp: z.string().optional(),
  institutionalSite: z.string().url({ message: t('zod.invalidUrl') }).optional().or(z.literal('')),
  socialLinks: z.array(SocialLinkSchema).optional(),
  multilingual_system_enabled: z.boolean().default(true),
  single_language_code: z.string().optional(),
  defaultLanguage: z.string({ required_error: t('zod.defaultLanguageRequired') }).min(1, t('zod.defaultLanguageRequired')),
  defaultTimezone: z.string({ required_error: t('zod.defaultTimezoneRequired') }).min(1, t('zod.defaultTimezoneRequired')),
  defaultCurrency: z.string({ required_error: t('zod.defaultCurrencyRequired') }).min(1, t('zod.defaultCurrencyRequired')),
  addressCep: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressDistrict: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
  customized: z.boolean().optional(),
  createdAt: z.any().optional(),
});

type GeneralSettingsFormData = z.infer<ReturnType<typeof createGeneralSettingsSchema>>;

export const useNxGeneralSettingsForm = () => {
  const t = useTranslations('generalSettings');
  const { toast } = useToast();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  
  const { generalSettings, isLoading: isLoadingSettings, isSaving, saveGeneralSettings } = useNxGeneralSettings();

  const canEdit = hasPermission('master.settings.general.edit');
  const GeneralSettingsSchema = createGeneralSettingsSchema(t);

  const formMethods = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(GeneralSettingsSchema),
  });

  const isMultiLingual = useWatch({
    control: formMethods.control,
    name: "multilingual_system_enabled",
  });

  React.useEffect(() => {
    if (generalSettings) {
      const defaults = {
        nickname: "", systemDescription: "", defaultWhatsapp: "", institutionalSite: "",
        socialLinks: [], addressCep: "", addressStreet: "", 
        addressNumber: "", addressComplement: "", addressDistrict: "", addressCity: "", addressState: "", addressCountry: "",
        multilingual_system_enabled: true, single_language_code: 'pt-BR',
        logoUrl: "", logoCollapsedUrl: "", faviconUrl: "", defaultContactEmail: "",
      };
      const settingsWithDefaults: any = { ...defaults, ...generalSettings };
      if (!settingsWithDefaults.defaultLanguage) settingsWithDefaults.defaultLanguage = "pt-BR";
      if (!settingsWithDefaults.defaultTimezone) settingsWithDefaults.defaultTimezone = "America/Sao_Paulo";
      if (!settingsWithDefaults.defaultCurrency) settingsWithDefaults.defaultCurrency = "BRL";
      
      formMethods.reset({
        ...settingsWithDefaults,
        socialLinks: settingsWithDefaults.socialLinks?.filter(Boolean) || [],
      });
    }
  }, [generalSettings, formMethods]);

  const onInvalid = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
        const element = document.getElementsByName(firstErrorKey)[0];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => element.focus(), 500);
        }
    }
    toast({
        title: t('toasts.validationErrorTitle'),
        description: t('toasts.validationErrorDesc'),
        variant: "destructive",
    });
  };

  const onSubmit = async (data: GeneralSettingsFormData) => {
    if (!canEdit) {
      toast({ title: t('toasts.permissionDeniedTitle'), description: t('toasts.permissionDeniedDesc'), variant: 'destructive' });
      return;
    }
    const result = await saveGeneralSettings(data);
    if(result.success) {
      toast({ title: t('toasts.saveSuccessTitle') });
      formMethods.reset(data, { keepValues: true, keepDirty: false });
    } else {
      const errorMessage = result.error || t('toasts.saveErrorDesc');
      toast({ title: t('toasts.saveErrorTitle'), description: errorMessage, variant: "destructive" });
    }
  };

  const isLoading = isLoadingPermissions || isLoadingSettings;
  const isFormEffectivelyDisabled = isLoading || isSaving || !canEdit;

  return {
    formMethods,
    isMultiLingual,
    handleSubmit: formMethods.handleSubmit(onSubmit, onInvalid),
    isLoading,
    canEdit,
    isSaving,
    isFormEffectivelyDisabled,
    isDirty: formMethods.formState.isDirty,
  };
};