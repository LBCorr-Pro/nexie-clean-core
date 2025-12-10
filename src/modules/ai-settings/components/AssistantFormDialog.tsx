// src/modules/ai-settings/components/AssistantFormDialog.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AIAssistant, AIProviderConfig } from '../types';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { PlaceholderSelector } from '@/components/shared/form/PlaceholderSelector';

const getAssistantFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, t('zod.nameRequired')),
  assistantType: z.enum(['text', 'image', 'video', 'speech'], { required_error: t('zod.typeRequired') }),
  nickname: z.string().optional(),
  avatarUrl: z.string().optional(),
  systemPrompt: z.string().optional(),
  configurationId: z.string({ required_error: t('zod.configRequired') }),
  contextFileUrls: z.array(z.string().url()).optional(),
  useDefaultApiKey: z.boolean().optional(), // Adicionado para corrigir o erro
}).refine(data => {
    if (data.assistantType === 'text') {
        return data.systemPrompt && data.systemPrompt.length >= 10;
    }
    return true;
}, {
    message: t('zod.systemPromptRequired'),
    path: ["systemPrompt"],
});

type AssistantFormData = z.infer<ReturnType<typeof getAssistantFormSchema>>;

interface AssistantFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingAssistant: Omit<AIAssistant, 'id'> | AIAssistant | null;
  configurations: AIProviderConfig[];
}

export function AssistantFormDialog({ isOpen, onClose, editingAssistant, configurations }: AssistantFormDialogProps) {
  const t = useTranslations('aiSettings.assistantsTab.formDialog');
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();
  const [isSaving, setIsSaving] = useState(false);
  const canManage = hasPermission('master.ia_integrations.manage');
  
  const AssistantFormSchema = getAssistantFormSchema(t);

  const form = useForm<AssistantFormData>({
    resolver: zodResolver(AssistantFormSchema),
  });

  const watchedAssistantType = form.watch('assistantType');

  useEffect(() => {
    if (editingAssistant) {
      form.reset({
        ...editingAssistant,
        assistantType: editingAssistant.assistantType || 'text',
      });
    } else {
      form.reset({ name: "", assistantType: 'text', nickname: "", avatarUrl: "", systemPrompt: "", configurationId: "", contextFileUrls: [], useDefaultApiKey: true });
    }
  }, [editingAssistant, form]);

  const onSubmit = async (data: AssistantFormData) => {
    if (!canManage) return;

    setIsSaving(true);

    const isEditingMode = editingAssistant && 'id' in editingAssistant;
    const docRef = isEditingMode
      ? doc(refs.master.aiAssistants(), editingAssistant.id)
      : doc(refs.master.aiAssistants());

    try {
      const dataToSave: any = { ...data, updatedAt: serverTimestamp() };
      if (!isEditingMode) {
        dataToSave.createdAt = serverTimestamp();
      }
      if (data.useDefaultApiKey) {
        dataToSave.apiKey = null;
      }
      
      await setDoc(docRef, dataToSave, { merge: true });
      toast({
        title: t('toasts.saveSuccessTitle'),
        description: t('toasts.saveSuccessDescription'),
      });
      onClose();
    } catch (error: any) {
      toast({
        title: t('toasts.saveErrorTitle'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl p-0">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="assistant-form" className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 shrink-0">
              <DialogTitle>{editingAssistant ? t('titleEdit') : t('titleCreate')}</DialogTitle>
              <DialogDescription>{t('description')}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6">
              <div className="py-4 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('nameLabel')}</FormLabel><FormControl><Input placeholder={t('namePlaceholder')} {...field}/></FormControl><FormMessage/></FormItem> )}/>
                     <FormField control={form.control} name="nickname" render={({ field }) => ( <FormItem><FormLabel>{t('nicknameLabel')}</FormLabel><FormControl><Input placeholder={t('nicknamePlaceholder')} {...field}/></FormControl><FormMessage/></FormItem> )}/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="assistantType" render={({ field }) => ( 
                        <FormItem><FormLabel>{t('typeLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!editingAssistant}>
                            <FormControl><SelectTrigger><SelectValue placeholder={t('typePlaceholder')}/></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="text">{t('typeOptions.text')}</SelectItem>
                              <SelectItem value="image">{t('typeOptions.image')}</SelectItem>
                              <SelectItem value="video">{t('typeOptions.video')}</SelectItem>
                              <SelectItem value="speech">{t('typeOptions.speech')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">{t('typeDescription')}</FormDescription>
                          <FormMessage/>
                        </FormItem> 
                     )}/>
                     <FormField control={form.control} name="configurationId" render={({ field }) => ( 
                        <FormItem><FormLabel>{t('configLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('configPlaceholder')}/></SelectTrigger></FormControl>
                                <SelectContent>{configurations.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.modelId})</SelectItem>)}</SelectContent>
                            </Select>
                            <FormDescription className="text-xs">{t('configDescription')}</FormDescription>
                            <FormMessage/>
                        </FormItem> 
                     )}/>
                </div>
                 <FormField control={form.control} name="avatarUrl" render={({ field }) => ( <FormItem><FormLabel>{t('avatarLabel')}</FormLabel><FormControl><ImageUploadField value={field.value} onChange={field.onChange} aihint="ai assistant avatar" contextPath="ai_assets/avatars"/></FormControl><FormMessage/></FormItem> )}/>
                 
                 <FormField 
                    control={form.control} 
                    name="systemPrompt" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel>
                          {t('systemPromptLabel')}
                          {watchedAssistantType === 'text' && <span className="text-destructive">{t('systemPromptRequired')}</span>}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={watchedAssistantType === 'text' ? t('systemPromptPlaceholderText') : t('systemPromptPlaceholderOther')} 
                            rows={watchedAssistantType === 'text' ? 8 : 4} 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage/>
                      </FormItem> 
                    )}
                  />
                
                <div className="-mt-4">
                    <PlaceholderSelector title="Personalize o prompt com variáveis" />
                </div>

                <FormItem>
                    <FormLabel>{t('contextFilesLabel')}</FormLabel>
                    <div className="p-4 border-2 border-dashed rounded-md text-center text-muted-foreground text-sm">
                        {t('contextFilesPlaceholder')}
                    </div>
                </FormItem>
              </div>
            </ScrollArea>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 p-6 pt-4 border-t shrink-0">
              <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto" disabled={isSaving}>{t('cancelButton')}</Button></DialogClose>
              <Button type="submit" form="assistant-form" disabled={isSaving || !canManage} className="w-full sm:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{isSaving ? t('savingButton') : t('saveButton')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
