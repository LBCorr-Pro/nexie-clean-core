// src/modules/invite/components/SettingsTab.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from 'next-intl';
import { db, } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp, doc, updateDoc, where, onSnapshot, CollectionReference, getDoc, setDoc } from "firebase/firestore";
import { useToast } from '@/hooks/nx-use-toast';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useSearchParams } from 'next/navigation';
import { useFormatters } from '@/hooks/use-formatters';
import { refs } from '@/lib/firestore-refs';
import { getAuth } from 'firebase/auth';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Settings, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuData } from '@/hooks/use-menu-data';
import { Separator } from "@/components/ui/separator";
import { Switch } from '@/components/ui/switch';
import { SmartRichTextEditor } from '@/components/shared/form/SmartRichTextEditor';
import { useAuthContext } from '@/context/AuthContext';
import { PlaceholderSelector } from '@/components/shared/form/PlaceholderSelector';
import { useNxAppearance } from '@/hooks/use-nx-appearance'; // Import the correct hook

// Zod schema is now a function to access translations
const getSettingsFormSchema = (t: (key: string) => string) => z.object({
  does_not_expire: z.boolean().default(false),
  validity_value: z.coerce.number().min(1, t('zod.validityValueMin')).optional(),
  validity_type: z.enum(['hours', 'days', 'months']).default('days'),
  prefix: z.string().max(10, t('zod.prefixMax')).optional(),
  code_length: z.coerce.number().min(4, t('zod.codeLengthMin')).max(12, t('zod.codeLengthMax')).default(6),
  whatsapp_template: z.string().optional(),
  email_template: z.string().optional(),
}).refine(data => data.does_not_expire || (data.validity_value && data.validity_value > 0), {
    message: t('zod.validityValueRequired'),
    path: ["validity_value"],
});

type SettingsFormData = z.infer<ReturnType<typeof getSettingsFormSchema>>;

export const SettingsTab = () => {
  const { toast } = useToast();
  const t = useTranslations('invite.settingsTab');
  const { actingAsInstanceId, isActingAsMaster, actingAsInstanceName } = useInstanceActingContext();
  const { hasPermission } = useUserPermissions();
  const { defaultEditorModuleId, isLoading: isLoadingDynamicMenu } = useMenuData(); // Remove generalSettings
  const { appearanceSettings } = useNxAppearance(); // Use the correct hook
  const { user } = useAuthContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Generate schema with translations
  const SettingsFormSchema = getSettingsFormSchema(t);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      does_not_expire: false,
      validity_value: 7,
      validity_type: 'days',
      prefix: 'NEXIE-',
      code_length: 6,
      whatsapp_template: t('defaultTemplates.whatsapp'),
      email_template: t('defaultTemplates.email'),
    },
  });

  const canConfigure = hasPermission('module.invite.configure');

  const getConfigRef = useCallback(() => {
    if (actingAsInstanceId) {
        return doc(refs.instance.inviteModuleCollection(actingAsInstanceId), 'settings');
    }
    return doc(refs.master.inviteModuleCollection(), 'settings');
  }, [actingAsInstanceId]);

  useEffect(() => {
    if (!canConfigure) {
      setIsLoading(false);
      return;
    }
    
    const fetchSettings = async () => {
        const configRef = getConfigRef();
        let finalConfigData = null;
        try {
            const configSnap = await getDoc(configRef);

            if (configSnap.exists() && configSnap.data().customized) {
                finalConfigData = configSnap.data();
            } else {
                const masterConfigRef = doc(refs.master.inviteModuleCollection(), 'settings');
                const masterConfigSnap = await getDoc(masterConfigRef);
                if (masterConfigSnap.exists()) {
                    finalConfigData = masterConfigSnap.data();
                }
            }
            
            if (finalConfigData) {
                form.reset(finalConfigData);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchSettings();

  }, [canConfigure, getConfigRef, form]);

  const onSubmit = async (data: SettingsFormData) => {
    const configRef = getConfigRef();
    if (!canConfigure) {
      toast({ title: t('toasts.permissionDenied'), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(configRef, { ...data, updatedAt: serverTimestamp(), customized: !isActingAsMaster }, { merge: true });
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDescription') });
    } catch (error: any) {
      toast({ title: t('toasts.saveErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const watchedDoesNotExpire = form.watch("does_not_expire");

  const placeholdersData = useMemo(() => ({
    invite: [
        { value: '{{invite_code}}', label: t('placeholders.inviteCode'), description: t('placeholders.inviteCodeDesc') },
        { value: '{{invite_link}}', label: t('placeholders.inviteLink'), description: t('placeholders.inviteLinkDesc') },
    ],
    sender: [
        { value: '{{sender_name}}', label: t('placeholders.senderName'), description: t('placeholders.senderNameDesc', { name: user?.displayName || '...' }) },
        { value: '{{sender_email}}', label: t('placeholders.senderEmail'), description: t('placeholders.senderEmailDesc', { email: user?.email || '...' }) },
    ],
    context: [
        { value: '{{system_name}}', label: t('placeholders.systemName'), description: t('placeholders.systemNameDesc', { name: appearanceSettings?.identity.systemName || '...' }) }, // Corrected data source
        { value: '{{instance_name}}', label: t('placeholders.instanceName'), description: t('placeholders.instanceNameDesc', { name: actingAsInstanceName || '...' }) },
    ],
    branding: [
        { value: '{{system_logo_url}}', label: t('placeholders.systemLogo'), description: t('placeholders.systemLogoDesc') },
    ]
  }), [t, user, appearanceSettings, actingAsInstanceName]); // Updated dependency array
  
  if (isLoading || isLoadingDynamicMenu) {
      return <div className="space-y-4 pt-6"><Skeleton className="h-10 w-1/4" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-32" /></div>
  }

  if (!canConfigure) {
      return (
        <Card>
            <CardContent className="pt-6 flex items-center text-muted-foreground"><AlertTriangle className="mr-2 text-yellow-500"/> {t('accessDeniedMessage', { permission: 'module.invite.configure' })}</CardContent>
        </Card>
      );
  }

  return (
    <FormProvider {...form}>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <fieldset disabled={isSaving}>
            <CardHeader>
                <CardTitle className="section-title !border-none !pb-0"><Settings className="section-title-icon" />{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="prefix" render={({ field }) => ( <FormItem><FormLabel>{t('prefixLabel')}</FormLabel><Input {...field} placeholder={t('prefixPlaceholder')}/> <FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="code_length" render={({ field }) => ( <FormItem><FormLabel>{t('codeLengthLabel')}</FormLabel><Input type="number" min={4} max={12} {...field} /><FormMessage /></FormItem> )}/>
                </div>
                <FormField control={form.control} name="does_not_expire" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>{t('noExpirationLabel')}</FormLabel><ShadFormDescription>{t('noExpirationDescription')}</ShadFormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                 {!watchedDoesNotExpire && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 ml-1">
                        <FormField control={form.control} name="validity_value" render={({ field }) => (
                            <FormItem><FormLabel>{t('validityLabel')}</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input type="number" className="w-24" {...field} />
                                    <FormField control={form.control} name="validity_type" render={({ field: unitField }) => (
                                        <Select onValueChange={unitField.onChange} value={unitField.value}>
                                            <FormControl><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="hours">{t('validityTypes.hours')}</SelectItem>
                                                <SelectItem value="days">{t('validityTypes.days')}</SelectItem>
                                                <SelectItem value="months">{t('validityTypes.months')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}/>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                )}
                <Separator />
                <div>
                    <h3 className="text-lg font-medium mb-2">{t('templatesTitle')}</h3>
                    <div className="space-y-4">
                         <FormField control={form.control} name="email_template" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('emailTemplateLabel')}</FormLabel>
                                <FormControl>
                                    <SmartRichTextEditor instanceId={actingAsInstanceId || ''} content={field.value || ''} onChange={field.onChange} defaultEditorModuleId={defaultEditorModuleId} />
                                </FormControl>
                                <div className="pt-2">
                                  <PlaceholderSelector title={t('placeholders.titleEmail')} placeholders={[...placeholdersData.invite, ...placeholdersData.sender, ...placeholdersData.context, ...placeholdersData.branding]}/>
                                </div>
                                <FormMessage />
                            </FormItem>
                         )}/>
                         <FormField control={form.control} name="whatsapp_template" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('whatsappTemplateLabel')}</FormLabel>
                                <FormControl>
                                    <SmartRichTextEditor instanceId={actingAsInstanceId || ''} content={field.value || ''} onChange={field.onChange} defaultEditorModuleId={defaultEditorModuleId} />
                                </FormControl>
                                <div className="pt-2">
                                  <PlaceholderSelector title={t('placeholders.titleMessage')} placeholders={[...placeholdersData.invite, ...placeholdersData.sender, ...placeholdersData.context]}/>
                                </div>
                                <FormMessage />
                            </FormItem>
                         )}/>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4"/> {t('saveButton')}
                </Button>
            </CardFooter>
          </fieldset>
        </form>
      </Card>
    </FormProvider>
  );
};
