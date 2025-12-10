// src/app/[locale]/(app)/settings/menus/presets/[presetId]/edit/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Save, ListTree } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useMenuData, type ConfiguredMenuItem, type MenuGroupFromFirestore } from '@/hooks/use-menu-data';
import { refs } from '@/lib/firestore-refs';
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MenuPresetBottomBarTabManager } from './components/BottomBarTabManager';
import { MenuPresetSchema, type MenuPreset } from '@/lib/types/menus';

type PlanFormData = z.infer<typeof MenuPresetSchema>;

const PageSkeleton = () => (
    <div className="space-y-6">
        <BackButton disabled />
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2"/></CardHeader>
            <CardContent className="space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-24 w-full"/><Skeleton className="h-40 w-full" /></CardContent>
            <CardFooter className="border-t pt-6"><div className="flex w-full justify-end"><Skeleton className="h-10 w-40"/></div></CardFooter>
        </Card>
    </div>
);

export default function EditMenuPresetPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const presetId = params.presetId as string;
  const { toast } = useToast();

  const { finalGroups, ungroupedTopLevelItems, isLoading: isLoadingMenuStructure } = useMenuData();

  const [isLoadingPreset, setIsLoadingPreset] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<PlanFormData>({
    resolver: zodResolver(MenuPresetSchema),
    defaultValues: {
      presetName: "",
      description: "",
      leftSidebarConfig: { visibleGroups: [], visibleItems: [] },
      bottomBarConfig: { enabledOnDesktop: false, desktopPosition: 'bottom', enableTabs: false, showTitleOnSingleTab: false, tabsAlignment: 'start', tabsDisplayMode: 'icon_and_text', tabs: [] },
    },
  });

  const selectedGroups = form.watch('leftSidebarConfig.visibleGroups') || [];
  const selectedItems = form.watch('leftSidebarConfig.visibleItems') || [];
  
  useEffect(() => {
    if (!presetId) {
        setIsLoadingPreset(false);
        toast({title: "Erro", description: "ID do modelo não encontrado.", variant: "destructive"});
        return;
    };
    const docRef = doc(refs.master.menuPresets(), presetId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as MenuPreset;
            const currentData = {
                presetName: data.presetName,
                description: data.description || "",
                leftSidebarConfig: data.leftSidebarConfig || { visibleGroups: [], visibleItems: [] },
                bottomBarConfig: data.bottomBarConfig || { enabledOnDesktop: false, desktopPosition: 'bottom', enableTabs: false, showTitleOnSingleTab: false, tabsAlignment: 'start', tabsDisplayMode: 'icon_and_text', tabs: [] },
            };
             form.reset(currentData);
        } else {
            toast({ title: "Erro", description: "Modelo não encontrado.", variant: "destructive"});
            router.push(`/${locale}/settings/menus/presets`);
        }
        setIsLoadingPreset(false);
    }, (err) => {
        console.error("Error fetching preset:", err);
        toast({ title: "Erro ao carregar modelo.", variant: "destructive" });
        setIsLoadingPreset(false);
    });

    return () => unsubscribe();

  }, [presetId, router, locale, toast, form]);

  const onSubmit = async (data: PlanFormData) => {
    setIsSaving(true);
    try {
      const docRef = doc(refs.master.menuPresets(), presetId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Modelo Salvo!", description: `O modelo "${data.presetName}" foi atualizado.` });
      form.reset(data);
    } catch (error) {
      console.error("Error updating menu preset:", error);
      toast({ title: "Erro ao Salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGroupSelection = (groupId: string, checked: boolean) => {
    const currentSelectedGroups = form.getValues('leftSidebarConfig.visibleGroups') || [];
    const newSelectedGroups = checked 
      ? [...currentSelectedGroups, groupId] 
      : currentSelectedGroups.filter(id => id !== groupId);
    form.setValue('leftSidebarConfig.visibleGroups', newSelectedGroups, { shouldDirty: true });
  };
  
  const handleItemSelection = (itemId: string, checked: boolean) => {
    const currentSelectedItems = form.getValues('leftSidebarConfig.visibleItems') || [];
    const newSelectedItems = checked
      ? [...currentSelectedItems, itemId]
      : currentSelectedItems.filter(id => id !== itemId);
    form.setValue('leftSidebarConfig.visibleItems', newSelectedItems, { shouldDirty: true });
  };
  
  const handleSelectAllGroupItems = (group: MenuGroupFromFirestore, select: boolean) => {
    let allItemIds: string[] = [];
    const collectIds = (items: ConfiguredMenuItem[]) => {
      for (const item of items) {
        allItemIds.push(item.menuKey);
        if (item.subItems && item.subItems.length > 0) {
          collectIds(item.subItems);
        }
      }
    };
    collectIds(group.items);

    const currentSelected = new Set(form.getValues('leftSidebarConfig.visibleItems') || []);
    if (select) {
      allItemIds.forEach(id => currentSelected.add(id));
    } else {
      allItemIds.forEach(id => currentSelected.delete(id));
    }
    form.setValue('leftSidebarConfig.visibleItems', Array.from(currentSelected), { shouldDirty: true });
  };

  const renderMenuItemWithChildren = (item: ConfiguredMenuItem, level = 0) => {
    const isSelected = selectedItems.includes(item.menuKey);
    
    return (
        <div key={item.menuKey} className={cn("space-y-2", level > 0 && "ml-4 pl-4 border-l")}>
          <div className="flex items-center space-x-2 py-1">
             <Checkbox
                id={`item-${item.menuKey}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleItemSelection(item.menuKey, !!checked)}
              />
            <Icon name={item.originalIcon || 'CircleHelp'} className="h-4 w-4 text-muted-foreground" />
            <label htmlFor={`item-${item.menuKey}`} className="text-sm font-medium leading-none cursor-pointer">
              {item.displayName}
            </label>
             <span className="text-xs px-1.5 py-0.5 rounded-full border bg-muted">{item.menuKey}</span>
          </div>
          {item.subItems && item.subItems.length > 0 && (
            <div className="ml-4 pl-4 border-l space-y-2">
              {item.subItems.map((subItem: ConfiguredMenuItem) => renderMenuItemWithChildren(subItem, level + 1))}
            </div>
          )}
        </div>
    );
  };

  const isLoading = isLoadingPreset || isLoadingMenuStructure;

  if (isLoading) {
    return <PageSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="relative">
                <BackButton href={`/${locale}/settings/menus/presets`} className="absolute right-6 top-3"/>
                <div className="pt-2"> 
                    <CardTitle className="section-title !border-none !pb-0">
                        <Edit className="section-title-icon"/>
                        Editar Modelo: {form.getValues('presetName')}
                    </CardTitle>
                    <CardDescription>Ajuste os detalhes e a estrutura de navegação associada a este modelo.</CardDescription>
                </div>
            </CardHeader>
            <fieldset disabled={isSaving || isLoading}>
              <CardContent>
                 <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="details">Detalhes</TabsTrigger>
                        <TabsTrigger value="left-sidebar">Menu Esquerdo</TabsTrigger>
                        <TabsTrigger value="top-bar">Barra Superior</TabsTrigger>
                        <TabsTrigger value="bottom-bar">Barra Inferior</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4">
                        <TabsContent value="details" className="space-y-6">
                            <FormField control={form.control} name="presetName" render={({ field }) => ( <FormItem><FormLabel>Nome do Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                        </TabsContent>
                        
                        <TabsContent value="left-sidebar">
                           <ScrollArea className="h-[calc(100vh-26rem)] p-1 pr-4">
                                <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center"><ListTree className="mr-2 h-5 w-5"/>Visibilidade de Grupos e Itens</h3>
                                <p className="text-sm text-muted-foreground">Selecione quais grupos e itens devem ser visíveis quando este modelo de menu for aplicado.</p>
                                <div className="p-4 border rounded-md space-y-4">
                                    {finalGroups.map((group: MenuGroupFromFirestore) => {
                                    const isGroupSelected = selectedGroups.includes(group.docId);
                                    return (
                                        <div key={group.docId} className="p-3 border rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`group-${group.docId}`}
                                                    checked={isGroupSelected}
                                                    onCheckedChange={(checked) => handleGroupSelection(group.docId, !!checked)}
                                                />
                                                <label htmlFor={`group-${group.docId}`} className="text-base font-semibold leading-none cursor-pointer">
                                                {group.name}
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`select-all-${group.docId}`}
                                                    onCheckedChange={(checked) => handleSelectAllGroupItems(group, !!checked)}
                                                />
                                                <label htmlFor={`select-all-${group.docId}`} className="text-xs">Todos</label>
                                            </div>
                                        </div>
                                        <div className="mt-3 pl-6 space-y-2">
                                            {group.items.map((item: ConfiguredMenuItem) => renderMenuItemWithChildren(item))}
                                        </div>
                                        </div>
                                    )
                                    })}
                                    {ungroupedTopLevelItems.length > 0 && (
                                        <div className="p-3 border rounded-md">
                                        <h4 className="font-semibold text-muted-foreground">Itens Não Agrupados</h4>
                                        <div className="mt-3 pl-6 space-y-2">
                                            {ungroupedTopLevelItems.map((item: ConfiguredMenuItem) => renderMenuItemWithChildren(item))}
                                        </div>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="top-bar">
                           <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md bg-muted/50">
                                <p className="text-muted-foreground">Configurações da Barra Superior virão aqui.</p>
                           </div>
                        </TabsContent>
                        
                        <TabsContent value="bottom-bar">
                          <MenuPresetBottomBarTabManager />
                        </TabsContent>
                    </div>
                 </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end border-t pt-6">
                <Button type="submit" disabled={isSaving || isLoading || !form.formState.isDirty}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4"/>
                    Salvar Alterações
                </Button>
              </CardFooter>
            </fieldset>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}
