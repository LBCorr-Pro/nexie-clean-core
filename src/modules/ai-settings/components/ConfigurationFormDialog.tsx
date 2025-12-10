// src/modules/ai-settings/components/ConfigurationFormDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { refs } from '@/lib/firestore-refs';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useToast } from "@/hooks/nx-use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AIProviderConfig } from '../types'; // Corrigido para o caminho relativo

const getConfigFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, t('zod.nameRequired')),
  provider: z.enum(['google-ai', 'openai'], { required_error: t('zod.providerRequired') }),
  modelId: z.string().min(3, t('zod.modelIdRequired')),
  apiKey: z.string().optional(),
  isActive: z.boolean().default(true),
  useDefaultApiKey: z.boolean().default(true),
}).refine(data => {
    if (!data.useDefaultApiKey) {
        return data.apiKey && data.apiKey.length >= 10;
    }
    return true;
}, {
    message: t('zod.apiKeyRequired'),
    path: ["apiKey"],
});

interface ConfigurationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingConfig: Omit<AIProviderConfig, 'id'> | AIProviderConfig | null;
}

export function ConfigurationFormDialog({ isOpen, onClose, editingConfig }: ConfigurationFormDialogProps) {
  const t = useTranslations('aiSettings.settingsTab.formDialog');
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();
  const [isSaving, setIsSaving] = useState(false);
  
  const canManage = hasPermission('master.ia_integrations.manage');
  const ConfigFormSchema = getConfigFormSchema(t);
  type ConfigFormData = z.infer<typeof ConfigFormSchema>;

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(ConfigFormSchema),
  });

  const useDefaultApiKey = form.watch('useDefaultApiKey');

  useEffect(() => {
    if (editingConfig) {
      form.reset({
          name: editingConfig.name || "",
          provider: editingConfig.provider || "google-ai",
          modelId: editingConfig.modelId || "",
          apiKey: editingConfig.apiKey || "",
          isActive: editingConfig.isActive === true,
          useDefaultApiKey: (editingConfig as any).useDefaultApiKey ?? true,
      });
    } else {
      form.reset({
        name: "", 
        provider: "google-ai", 
        modelId: "", 
        apiKey: "", 
        isActive: true, 
        useDefaultApiKey: true,
      });
    }
  }, [editingConfig, form]);

  const onSubmit = async (data: ConfigFormData) => {
    if (!canManage) return;
    setIsSaving(true);
    
    const isEditingMode = editingConfig && 'id' in editingConfig;
    const docRef = isEditingMode
      ? doc(refs.master.aiProviderConfigurations(), editingConfig.id)
      : doc(refs.master.aiProviderConfigurations());

    try {
      const dataToSave: any = { ...data, updatedAt: serverTimestamp() };
      if (!isEditingMode) {
        dataToSave.createdAt = serverTimestamp();
      }
      if (data.useDefaultApiKey) {
        dataToSave.apiKey = null;
      }
      
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDescription') });
      onClose();
    } catch (error: any) {
      toast({ title: t('toasts.saveErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 shrink-0">
              <DialogTitle>{editingConfig ? t('titleEdit') : t('titleCreate')}</DialogTitle>
              <DialogDescription>{t('description')}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6">
              <div className="py-4 space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('nameLabel')}</FormLabel><FormControl><Input placeholder={t('namePlaceholder')} {...field}/></FormControl><FormDescription>{t('nameDescription')}</FormDescription><FormMessage/></FormItem> )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="provider" render={({ field }) => (<FormItem><FormLabel>{t('providerLabel')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('providerPlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="google-ai">{t('providerOptions.google')}</SelectItem><SelectItem value="openai">{t('providerOptions.openai')}</SelectItem></SelectContent></Select><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="modelId" render={({ field }) => (<FormItem><FormLabel>{t('modelIdLabel')}</FormLabel><FormControl><Input placeholder={t('modelIdPlaceholder')} {...field}/></FormControl><FormDescription>{t('modelIdDescription')}</FormDescription><FormMessage/></FormItem>)}/>
                </div>
                
                <FormField
                    control={form.control}
                    name="useDefaultApiKey"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                            <div className="space-y-0.5">
                                <FormLabel>{t('useDefaultApiKeyLabel')}</FormLabel>
                                <FormDescription>{t('useDefaultApiKeyDescription')}</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />

                {!useDefaultApiKey && (
                    <FormField 
                        control={form.control} 
                        name="apiKey" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('apiKeyLabel')}</FormLabel>
                                <FormControl><Input type="password" placeholder={t('apiKeyPlaceholder')} {...field} value={field.value || ''} /></FormControl>
                                <FormDescription>{t('apiKeyDescription')}</FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                )}
                 <div className="flex items-center gap-6 pt-2">
                    <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal cursor-pointer">{t('statusLabel')}</FormLabel></FormItem> )}/>
                 </div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 p-6 pt-4 border-t shrink-0">
                <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto" disabled={isSaving}>{t('../deleteDialog.cancel')}</Button></DialogClose>
                <Button type="submit" disabled={isSaving || !canManage} className="w-full sm:w-auto">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{isSaving ? t('savingButton') : t('saveButton')}
                </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
