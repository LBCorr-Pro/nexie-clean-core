// src/app/[locale]/(app)/settings/modules/components/ModuleFormDialog.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import * as LucideIcons from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2, SmilePlus, CaseSensitive } from 'lucide-react';
import { suggestStyle } from "@/ai/flows/suggest-style-flow";
import { cn } from "@/lib/utils";
import { Icon } from '@/components/ui/icon';
import { refs } from '@/lib/firestore-refs';
import { Checkbox } from '@/components/ui/checkbox';
import type { ManagedModule } from '@/hooks/use-menu-data';
import { Separator } from '@/components/ui/separator';
import { IconPickerInput } from '@/components/shared/form/IconPickerInput';
import { ScrollArea } from '@/components/ui/scroll-area';

const HEX_COLOR_REGEX_VALIDATOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i;
const DEFAULT_UNIFIED_COLOR = "#626D84";

const kebabToPascalCase = (kebab?: string): string => {
  if (typeof kebab !== 'string' || kebab.trim() === "") return 'Blocks';
  if (!kebab.includes('-') && kebab.charAt(0) === kebab.charAt(0).toUpperCase()) return kebab;
  return kebab.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};

const CreateModuleDefinitionSchema = z.object({
  name: z.string().min(3, "Nome do módulo é obrigatório (mín. 3 caracteres)."),
  id: z.string().min(3, "ID (slug) é obrigatório e não pode ser alterado.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens."),
  description: z.string().max(500, "Descrição não pode exceder 500 caracteres.").optional().or(z.literal('')),
  icon: z.string().min(1, "Ícone é obrigatório (nome Lucide).").default("Blocks"),
  status: z.boolean().default(true),
  isRichTextEditor: z.boolean().default(false),
  canBeInitialPage: z.boolean().default(false),
  canBeBottomBarItem: z.boolean().default(false),
});

type CreateModuleDefinitionFormData = z.infer<typeof CreateModuleDefinitionSchema>;

interface ModuleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  moduleData: ManagedModule | null;
  onSuccess: () => void;
}

export function ModuleFormDialog({ isOpen, onClose, moduleData, onSuccess }: ModuleFormDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuggestingStyle, setIsSuggestingStyle] = useState(false);

  const form = useForm<CreateModuleDefinitionFormData>({
    resolver: zodResolver(CreateModuleDefinitionSchema),
  });

  const { watch, setValue, formState, trigger } = form;

  useEffect(() => {
    if (moduleData) {
      form.reset({
        name: moduleData.name || '',
        id: moduleData.id || '',
        description: moduleData.description || '',
        icon: moduleData.icon || 'Blocks',
        status: moduleData.status === true,
        isRichTextEditor: moduleData.isRichTextEditor === true,
        canBeInitialPage: moduleData.canBeInitialPage === true,
        canBeBottomBarItem: moduleData.canBeBottomBarItem === true,
      });
    } else {
      form.reset({
        name: "", id: "", description: "", icon: "Blocks", status: true, isRichTextEditor: false, canBeInitialPage: false, canBeBottomBarItem: false
      });
    }
  }, [moduleData, form]);

  const watchedName = watch("name");
  const watchedIcon = watch("icon");

  const handleSuggestion = useCallback(async () => {
    const name = form.getValues("name");
    if (!name || name.trim().length < 3) {
      form.setError("name", { type: "manual", message: "Insira um nome com pelo menos 3 caracteres." });
      return;
    }
    setIsSuggestingStyle(true);
    try {
      const response = await suggestStyle({ itemName: name, itemType: 'menuItem' });
      if (response.suggestedIcon) setValue("icon", response.suggestedIcon, { shouldDirty: true });
    } catch (error: any) {
      toast({ title: "Erro na Sugestão", description: error.message, variant: "destructive" });
    } finally {
      setIsSuggestingStyle(false);
    }
  }, [form, setValue, toast]);

  const onSubmit = async (data: CreateModuleDefinitionFormData) => {
    setIsProcessing(true);
    const docRef = doc(refs.master.moduleDefinitions(), data.id);
    if (!moduleData?.isRegistered) { // Only check for slug existence on creation
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            form.setError("id", { type: "manual", message: "Este ID (slug) já está em uso." });
            setIsProcessing(false); return;
        }
    }
    try {
      const dataToSave = { ...data, updatedAt: serverTimestamp() };
      if (!moduleData?.isRegistered) {
        (dataToSave as any).createdAt = serverTimestamp();
      }
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: moduleData?.isRegistered ? "Módulo Atualizado!" : "Módulo Registrado!", description: `O módulo "${data.name}" foi salvo.` });
      onSuccess();
    } catch (error) { setIsProcessing(false); }
  };

  const IconPreview = (LucideIcons as any)[kebabToPascalCase(watchedIcon)] || LucideIcons.Blocks;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 shrink-0">
              <DialogTitle>{moduleData?.isRegistered ? 'Editar Definição' : 'Registrar Novo Módulo'}</DialogTitle>
              <DialogDescription>
                Defina os detalhes e o comportamento deste módulo no sistema.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6">
              <div className="py-4 space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Módulo</FormLabel><FormControl><Input placeholder="Ex: Meu Novo Módulo" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="id" render={({ field }) => ( <FormItem><FormLabel>ID (Slug)</FormLabel><div className="relative"><FormControl><Input variant="slug" placeholder="Ex: meu-novo-modulo" {...field} disabled={!!moduleData?.isRegistered} /></FormControl></div><FormDescription>Identificador único. Não pode ser alterado após a criação.</FormDescription><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Para que serve este módulo..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                <IconPickerInput name="icon" label="Ícone" />
                <Button type="button" onClick={handleSuggestion} disabled={isSuggestingStyle} className="w-full" variant="outline"><Wand2 className="mr-2 h-4 w-4" />{isSuggestingStyle ? <Loader2 className="h-4 w-4 animate-spin"/> : "Sugerir Ícone com IA"}</Button>
                <Separator />
                <div className="space-y-3">
                  <FormField control={form.control} name="status" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Ativo Globalmente?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                  <FormField control={form.control} name="isRichTextEditor" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>É um Editor de Texto Rico?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                  <FormField control={form.control} name="canBeInitialPage" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Pode ser Página Inicial?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                  <FormField control={form.control} name="canBeBottomBarItem" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Pode ir para Barra Inferior?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t shrink-0">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {moduleData?.isRegistered ? "Salvar Alterações" : "Registrar Módulo"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
