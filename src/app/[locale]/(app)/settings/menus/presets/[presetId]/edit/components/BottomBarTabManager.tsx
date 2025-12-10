// src/app/[locale]/(app)/settings/menus/presets/[presetId]/edit/components/BottomBarTabManager.tsx
"use client";

import React, { useState } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IconPickerInput } from '@/components/shared/form/IconPickerInput';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/nx-use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Input as NumberInput } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabItemManager } from './TabItemManager';
import { Icon } from '@/components/ui/icon';

const EditTabSchema = z.object({
  name: z.string().min(2, "O nome da aba é obrigatório."),
  icon: z.string().min(1, "O ícone é obrigatório."),
  enableScroll: z.boolean().default(false),
  maxItems: z.coerce.number().min(1, "O mínimo é 1 item.").default(5),
});
type EditTabFormData = z.infer<typeof EditTabSchema>;


const EditTabDialogContent = ({ onSave, tabData }: { onSave: (data: EditTabFormData) => void, tabData?: EditTabFormData }) => {
    const { control, formState: { isValid } } = useFormContext<EditTabFormData>();
    const enableScroll = useWatch({ control, name: "enableScroll" });

    return (
        <>
            <DialogHeader className="px-6 pt-6 shrink-0">
                <DialogTitle>{tabData ? "Editar Aba" : "Criar Nova Aba"}</DialogTitle>
                <DialogDescription>Defina as propriedades para esta aba de navegação.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6 py-4">
                <div className="space-y-4">
                    <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Aba<span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ex: Sistema, Módulos" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <IconPickerInput name="icon" label="Ícone da Aba" />
                    <FormField control={control} name="enableScroll" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Habilitar Rolagem</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )}/>
                    {!enableScroll && (
                        <FormField control={control} name="maxItems" render={({ field }) => (
                            <FormItem><FormLabel>Máximo de Itens Visíveis</FormLabel><FormControl><NumberInput type="number" {...field} /></FormControl><FormDescription className="text-xs">Itens excedentes não serão exibidos.</FormDescription><FormMessage /></FormItem>
                        )}/>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={!isValid}>Salvar</Button>
            </DialogFooter>
        </>
    );
}
const EditTabDialog = ({ isOpen, onClose, onSave, tabData }: { isOpen: boolean, onClose: () => void, onSave: (data: EditTabFormData) => void, tabData?: EditTabFormData }) => {
    const form = useForm<EditTabFormData>({
        resolver: zodResolver(EditTabSchema),
        defaultValues: tabData || { name: "", icon: "LayoutGrid", enableScroll: false, maxItems: 5 },
        mode: 'onChange',
    });

    React.useEffect(() => {
        if (isOpen) {
            if (tabData) {
                form.reset(tabData);
            } else {
                form.reset({ name: "", icon: "LayoutGrid", enableScroll: false, maxItems: 5 });
            }
        }
    }, [isOpen, tabData, form]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl p-0">
                <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col h-full max-h-[90vh]">
                    <EditTabDialogContent onSave={onSave} tabData={tabData} />
                </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
};

export const MenuPresetBottomBarTabManager = () => {
  const { control } = useFormContext();
  const [editingTab, setEditingTab] = useState<{ index: number; data: EditTabFormData } | null>(null);
  const { toast } = useToast();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'bottomBarConfig.tabs',
  });
  
  const handleSaveTab = (data: EditTabFormData) => {
    if (editingTab !== null) {
      if (editingTab.index > -1) {
        const currentTabData = fields[editingTab.index] as any;
        const updatedTab = { ...currentTabData, ...data };
        update(editingTab.index, updatedTab);
        toast({ title: "Aba Atualizada!", description: `A aba "${data.name}" foi modificada.` });
      } else {
        const newTab = {
          id: `tab_${Date.now()}`,
          name: data.name,
          icon: data.icon,
          order: fields.length,
          items: [],
          enableScroll: data.enableScroll,
          maxItems: data.maxItems,
        };
        append(newTab);
        toast({ title: "Aba Criada!", description: `A aba "${data.name}" foi adicionada.` });
      }
    }
    setEditingTab(null);
  };

  const handleOpenEditModal = (index: number) => {
    const tabToEdit = fields[index] as any;
    const formData: EditTabFormData = {
      name: tabToEdit.name,
      icon: tabToEdit.icon,
      enableScroll: tabToEdit.enableScroll,
      maxItems: tabToEdit.maxItems,
    };
    setEditingTab({ index, data: formData });
  };
  
  const handleRemoveTab = (index: number) => {
    const tabName = (fields[index] as any)?.name;
    remove(index);
    toast({ title: "Aba Removida", description: `A aba "${tabName}" foi removida.` });
  };

  return (
    <div className="space-y-4">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Abas da Barra Inferior</h3>
          <p className="text-sm text-muted-foreground">Crie e gerencie as abas de navegação. A primeira aba será a principal.</p>
        </div>
        <Button type="button" onClick={() => setEditingTab({ index: -1, data: { name: "", icon: "LayoutGrid", enableScroll: false, maxItems: 5 } })} className="w-full md:w-auto shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Nova Aba
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">Nenhuma aba criada ainda.</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {fields.map((field, index) => (
              <AccordionItem key={field.id} value={field.id}>
                <div className="flex items-center group">
                    <AccordionTrigger className="flex-1 hover:no-underline px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Icon name={(field as any).icon || 'LayoutGrid'} className="h-5 w-5 text-muted-foreground" />
                        {(field as any).name}
                      </div>
                    </AccordionTrigger>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2 h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(index)}><Edit className="mr-2 h-4 w-4"/>Editar Aba</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveTab(index)}><Trash2 className="mr-2 h-4 w-4"/>Excluir Aba</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <AccordionContent className="p-4 border-t">
                  <TabItemManager tabIndex={index} namePrefix={`bottomBarConfig.tabs.${index}.items`} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {editingTab && (
         <EditTabDialog
            isOpen={!!editingTab}
            onClose={() => setEditingTab(null)}
            onSave={handleSaveTab}
            tabData={editingTab.index !== -1 ? editingTab.data : undefined}
         />
      )}
    </div>
  );
};
