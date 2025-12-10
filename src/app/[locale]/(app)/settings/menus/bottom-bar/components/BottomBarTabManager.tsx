// src/app/[locale]/(app)/settings/menus/bottom-bar/components/BottomBarTabManager.tsx
"use client";

import React, { useState } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, GripVertical } from 'lucide-react';
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
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/shared/dnd/SortableItem';
import { OrderControls } from '@/components/shared/form/OrderControls';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const EditTabSchema = z.object({
  name: z.string().min(2, "O nome da aba é obrigatório."),
  icon: z.string().min(1, "O ícone é obrigatório."),
  enableScroll: z.boolean().default(false),
  maxItems: z.coerce.number().min(1, "O mínimo é 1 item.").default(5),
});
type EditTabFormData = z.infer<typeof EditTabSchema>;

type TabField = {
  id: string;
  name: string;
  icon: string;
  order: number;
  items: any[];
  enableScroll: boolean;
  maxItems: number;
};

const EditTabDialogContent = ({ onSave, tabData }: { onSave: (data: EditTabFormData) => void, tabData?: EditTabFormData }) => {
    const t = useTranslations('menus.bottomBar.dialog');
    const { control, formState: { isValid } } = useFormContext<EditTabFormData>();
    const enableScroll = useWatch({ control, name: "enableScroll" });

    return (
        <>
            <DialogHeader className="px-6 pt-6 shrink-0">
                <DialogTitle>{tabData ? t('editTitle') : t('createTitle')}</DialogTitle>
                <DialogDescription>{t('description')}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6 py-4">
                <div className="space-y-4">
                    <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('nameLabel')}<span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder={t('namePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <IconPickerInput name="icon" label={t('iconLabel')} />
                    <FormField control={control} name="enableScroll" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>{t('enableScrollLabel')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )}/>
                    {!enableScroll && (
                        <FormField control={control} name="maxItems" render={({ field }) => (
                            <FormItem><FormLabel>{t('maxItemsLabel')}</FormLabel><FormControl><NumberInput type="number" {...field} /></FormControl><FormDescription className="text-xs">{t('maxItemsDesc')}</FormDescription><FormMessage /></FormItem>
                        )}/>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0">
                <DialogClose asChild><Button type="button" variant="outline">{t('cancelButton')}</Button></DialogClose>
                <Button type="submit" disabled={!isValid}>{t('saveButton')}</Button>
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


export const BottomBarTabManager = ({ namePrefix }: { namePrefix: string }) => {
  const t = useTranslations('menus.bottomBar');
  const { control, getValues, setValue } = useFormContext();
  const [editingTab, setEditingTab] = useState<{ index: number; data: EditTabFormData } | null>(null);
  const { toast } = useToast();

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: namePrefix,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleReorder = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    const currentItems: TabField[] = getValues(namePrefix);
    const reorderedItems = arrayMove(currentItems, oldIndex, newIndex);
    const finalItems = reorderedItems.map((item: TabField, index: number) => ({ ...item, order: index }));
    setValue(namePrefix, finalItems, { shouldDirty: true, shouldTouch: true });
  };
  
  const handleSaveTab = (data: EditTabFormData) => {
    if (editingTab !== null) {
      if (editingTab.index > -1) {
        const currentTabData = fields[editingTab.index] as any;
        const updatedTab = { ...currentTabData, ...data };
        update(editingTab.index, updatedTab);
        toast({ title: t('toasts.updateSuccess'), description: t('toasts.updateSuccessDesc', { tabName: data.name }) });
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
        toast({ title: t('toasts.createSuccess'), description: t('toasts.createSuccessDesc', { tabName: data.name }) });
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
    const currentItems: TabField[] = getValues(namePrefix) || [];
    const finalItems = currentItems.map((item: TabField, idx: number) => ({ ...item, order: idx }));
    setValue(namePrefix, finalItems, { shouldDirty: true });
    toast({ title: t('toasts.deleteSuccess'), description: t('toasts.deleteSuccessDesc', { tabName }) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        handleReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="space-y-4">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{t('tabsTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('tabsDescription')}</p>
        </div>
        <Button type="button" onClick={() => setEditingTab({ index: -1, data: { name: "", icon: "LayoutGrid", enableScroll: false, maxItems: 5 } })} className="w-full md:w-auto shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('createTabButton')}
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">{t('noTabs')}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields} strategy={verticalListSortingStrategy}>
              <Accordion type="multiple" className="w-full rounded-md border">
                {fields.map((field, index) => (
                  <SortableItem key={field.id} id={field.id} className={cn("border-b last:border-b-0", "group/item")}>
                    {({ attributes, listeners, setNodeRef, isDragging }) => (
                      <AccordionItem ref={setNodeRef} value={field.id} className="border-b-0" style={{ opacity: isDragging ? 0.5 : 1 }}>
                        <div className={cn("flex items-center w-full", isDragging && 'bg-muted/50')}>
                          <div {...listeners} {...attributes} className="p-2 cursor-grab touch-none" onClick={(e) => e.preventDefault()}>
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <AccordionTrigger className="flex-1 hover:no-underline px-2 py-2">
                            <div className="flex items-center gap-2">
                              <Icon name={(field as any).icon || 'LayoutGrid'} className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{(field as any).name}</span>
                            </div>
                          </AccordionTrigger>
                          <div className="flex items-center gap-1 pr-2">
                            <OrderControls
                              onMoveUp={() => handleReorder(index, index - 1)}
                              onMoveDown={() => handleReorder(index, index + 1)}
                              isFirst={index === 0}
                              isLast={index === fields.length - 1}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleOpenEditModal(index)}><Edit className="mr-2 h-4 w-4" />{t('editTab')}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveTab(index)}><Trash2 className="mr-2 h-4 w-4" />{t('deleteTab')}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <AccordionContent className="p-4 border-t bg-muted/20">
                          <TabItemManager tabIndex={index} namePrefix={`${namePrefix}.${index}.items`} />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </SortableItem>
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
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
