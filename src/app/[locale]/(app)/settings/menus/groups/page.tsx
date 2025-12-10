// src/app/[locale]/(app)/settings/menus/groups/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import {
  doc, updateDoc, serverTimestamp, getDoc, setDoc, writeBatch, deleteDoc
} from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import * as LucideIcons from 'lucide-react';
import { suggestStyle } from "@/ai/flows/suggest-style-flow";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams, useParams } from 'next/navigation';
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogBoxDesc, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogAlertTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, PlusCircle, Edit, Trash2, Palette, SmilePlus, LayoutGrid, Info, RotateCcw, ShieldCheck, GripVertical, MoreVertical, Save, Wand2, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { refs } from '@/lib/firestore-refs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { BackButton } from "@/components/ui/back-button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Icon } from '@/components/ui/icon';
import type { ConfiguredMenuItem, MenuGroupFromFirestore } from '@/hooks/use-menu-data';
import { useMenuData } from '@/hooks/use-menu-data';
import { OrderControls } from '@/components/shared/form/OrderControls';
import { SortableList } from '@/components/shared/dnd/SortableList';
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { dequal } from 'dequal';
import { arrayMove } from '@dnd-kit/sortable';
import { IconPickerInput } from '@/components/shared/form/IconPickerInput';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AccessDenied } from '@/components/ui/access-denied';


const HEX_COLOR_REGEX_VALIDATOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i;

const FallbackIcon = LucideIcons.Blocks;

const renderMenuItemTree = (items: ConfiguredMenuItem[]) => {
    if (!items) return null;
    return items.map(item => (
        <div key={item.menuKey} className={cn("pl-4", item.level > 1 && "ml-4 border-l")}>
            <div className="flex items-center gap-2 py-1.5 text-sm">
                <Icon name={item.originalIcon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.displayName}</span>
            </div>
            {item.subItems && item.subItems.length > 0 && renderMenuItemTree(item.subItems)}
        </div>
    ));
};

const GroupFormSchema = z.object({
  name: z.string().min(3, "Nome do grupo deve ter pelo menos 3 caracteres."),
  slug: z.string().min(3, "O ID (slug) é obrigatório.").regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números, hífens e sublinhados."),
  icon: z.string().min(1, "Ícone é obrigatório.").default("LayoutGrid"),
  colorApplyTo: z.enum(['none', 'group_only', 'group_and_items']).default('none'),
  isColorUnified: z.boolean().default(true),
  unifiedColor: z.string().refine(val => val.trim() === "" || HEX_COLOR_REGEX_VALIDATOR.test(val), { message: "Cor unificada inválida." }).optional().or(z.literal('')),
  iconColor: z.string().refine(val => val.trim() === "" || HEX_COLOR_REGEX_VALIDATOR.test(val), { message: "Cor do ícone inválida." }).optional().or(z.literal('')),
  textColor: z.string().refine(val => val.trim() === "" || HEX_COLOR_REGEX_VALIDATOR.test(val), { message: "Cor do texto inválida." }).optional().or(z.literal('')),
});
type GroupFormData = z.infer<typeof GroupFormSchema>;

export default function MenuGroupsPage() {
  const t = useTranslations('menus.groups');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  
  const { 
    finalGroups: initialGroups, 
    isLoading: isLoadingMenu, 
    refetchMenuData 
  } = useMenuData();
  
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const subInstanceId = searchParams.get('subInstanceId');

  const [displayGroups, setDisplayGroups] = useState<MenuGroupFromFirestore[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroupFromFirestore | null>(null);
  const [isSuggestingStyle, setIsSuggestingStyle] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<MenuGroupFromFirestore | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const contextType = useMemo(() => { if (subInstanceId && actingAsInstanceId) return 'subinstance'; if (actingAsInstanceId) return 'instance'; return 'master'; }, [subInstanceId, actingAsInstanceId]);
  const canEdit = hasPermission('master.settings.menu.edit');
  
  const pageEffectivelyDisabled = isLoadingMenu || isLoadingPermissions || isProcessing || !canEdit;

  const effectiveMenuGroupsCollectionRef = React.useMemo(() => {
    if (contextType === 'instance' && actingAsInstanceId) return refs.instance.menuGroups(actingAsInstanceId);
    if (contextType === 'subinstance' && actingAsInstanceId && subInstanceId) return refs.subinstance.menuGroups(actingAsInstanceId, subInstanceId);
    return refs.master.menuGroups();
  }, [actingAsInstanceId, subInstanceId, contextType]);
  
  useEffect(() => {
    if (!isLoadingMenu) {
        setDisplayGroups(prev => dequal(prev, initialGroups) ? prev : [...initialGroups]);
        setHasUnsavedOrder(false);
    }
  }, [initialGroups, isLoadingMenu]);
  
  const handleOpenDialog = (group?: MenuGroupFromFirestore) => {
    if (group) {
      setEditingGroup(group);
      groupFormMethods.reset({
        name: group.name,
        slug: group.docId,
        icon: group.icon,
        colorApplyTo: group.colorApplyTo || 'none',
        isColorUnified: group.isColorUnified,
        unifiedColor: group.unifiedColor,
        iconColor: group.iconColor,
        textColor: group.textColor,
      });
    } else {
      setEditingGroup(null);
      groupFormMethods.reset({
        name: "", slug: "", icon: "LayoutGrid", colorApplyTo: 'none', isColorUnified: true, unifiedColor: "#6B7280", iconColor: "", textColor: ""
      });
    }
    setShowDialog(true);
  };
  
  const handleSortEnd = (newItems: any[]) => {
      const reorderedItems = newItems.map((item, index) => ({...item, order: index * 10}));
      setDisplayGroups(reorderedItems);
      setHasUnsavedOrder(true);
  };
  
  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= displayGroups.length) return;
    const newItems = arrayMove(displayGroups, from, to);
    const reorderedItems = newItems.map((item, index) => ({...item, order: index * 10}));
    setDisplayGroups(reorderedItems);
    setHasUnsavedOrder(true);
  };

  const groupFormMethods = useForm<GroupFormData>({
    resolver: zodResolver(GroupFormSchema),
  });

  const handleSuggestion = useCallback(async () => {
    const name = groupFormMethods.getValues("name");
    if (!name || name.trim().length < 3) {
      groupFormMethods.setError("name", { type: "manual", message: t('dialog.validation.nameMin') });
      return;
    }
    setSuggestionError(null);
    setIsSuggestingStyle(true);
    try {
      const response = await suggestStyle({ itemName: name, itemType: 'menuGroup', existingIcons: [], existingColors: [] });
      if (response.suggestedIcon) groupFormMethods.setValue("icon", response.suggestedIcon, { shouldDirty: true });
      if (response.suggestedColor) {
        groupFormMethods.setValue("unifiedColor", response.suggestedColor, { shouldDirty: true });
        groupFormMethods.setValue("iconColor", response.suggestedColor, { shouldDirty: true });
      }
    } catch (error: any) { setSuggestionError(error.message || t('dialog.suggestionError'));
    } finally { setIsSuggestingStyle(false); }
  }, [groupFormMethods, t]);

  const onGroupSubmit = async (data: GroupFormData) => {
    setIsProcessing(true);
    const slug = data.slug;
    const dataToSave = { ...data, customized: !!actingAsInstanceId, updatedAt: serverTimestamp() };
    delete (dataToSave as any).slug;

    try {
        if (!editingGroup) {
            const masterDocRef = doc(refs.master.menuGroups(), slug);
            const docSnap = await getDoc(masterDocRef);
            if (docSnap.exists()) {
                groupFormMethods.setError("slug", { type: "manual", message: t('dialog.validation.slugInUse') });
                setIsProcessing(false);
                return;
            }
        }
        
        const docRef = doc(effectiveMenuGroupsCollectionRef, slug);
        await setDoc(docRef, { ...dataToSave, order: editingGroup?.order ?? displayGroups.length * 10, createdAt: editingGroup?.createdAt ?? serverTimestamp() }, { merge: true });
        
        toast({ title: editingGroup ? t('toasts.updateSuccess.title') : t('toasts.createSuccess.title') });
        await refetchMenuData(); 
        setShowDialog(false);
    } catch (e: any) { toast({ title: t('toasts.saveError.title'), description: e.message, variant: "destructive" });
    } finally { setIsProcessing(false); }
  };
  
  const onOrderSubmit = async () => {
    setIsProcessing(true);
    const batch = writeBatch(db);
    displayGroups.forEach((group) => {
        const docRef = doc(effectiveMenuGroupsCollectionRef, group.docId);
        batch.update(docRef, { order: group.order });
    });
    try {
        await batch.commit();
        toast({ title: t('toasts.orderSuccess.title') });
        setHasUnsavedOrder(false);
    } catch(e: any) { toast({ title: t('toasts.orderError.title'), description: e.message, variant: "destructive" });
    } finally { setIsProcessing(false); }
  };
  
  const handleDeleteGroup = async () => {
      if (!groupToDelete) return;
      setIsProcessing(true);
      try {
        await deleteDoc(doc(effectiveMenuGroupsCollectionRef, groupToDelete.docId));
        toast({ title: t('toasts.deleteSuccess.title') });
        await refetchMenuData();
        setGroupToDelete(null);
      } catch (e:any) { toast({ title: t('toasts.deleteError.title'), description: e.message, variant: "destructive" });
      } finally { setIsProcessing(false); }
  };
  
  const isOrderDirty = useMemo(() => {
    if (initialGroups.length !== displayGroups.length) return true;
    for (let i = 0; i < initialGroups.length; i++) {
        if (initialGroups[i].docId !== displayGroups[i].docId) {
            return true;
        }
    }
    return false;
  }, [displayGroups, initialGroups]);

  if (isLoadingPermissions) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!canEdit) return <AccessDenied />;

  const getIconComponent = (iconName: string) => (LucideIcons as any)[iconName] || FallbackIcon;
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
          <Card>
            <form onSubmit={(e) => { e.preventDefault(); }}>
              <CardHeader className="relative">
                  <BackButton href={`/${locale}/settings/menus`} className="absolute right-6 top-3"/>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2">
                      <div>
                      <CardTitle className="section-title !border-none !pb-0"><LayoutGrid className="section-title-icon" />{t('title')}</CardTitle>
                      <CardDescription>{t('description')}</CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center shrink-0">
                      <Button type="button" onClick={() => handleOpenDialog()} variant="default" disabled={pageEffectivelyDisabled}><PlusCircle className="mr-2 h-4 w-4" />{t('createButton')}</Button>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  {isLoadingMenu ? (<div className="space-y-4">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-24 w-full"/>)}</div>)
                  : displayGroups.length === 0 ? <p className="text-muted-foreground text-center py-4">{t('noGroups')}</p>
                  : (
                      <Accordion type="multiple" className="w-full">
                          <SortableList
                              items={displayGroups.map(g => ({...g, id: g.docId}))}
                              onSortEnd={handleSortEnd}
                              listContainerClassName="space-y-2"
                              renderItem={(group: any, { attributes, listeners, isDragging }) => {
                                  const IconComponent = getIconComponent(group.icon);
                                  const showInheritedLabel = group.customized === false && contextType !== 'master';
                                  const currentIndex = displayGroups.findIndex(g => g.docId === group.docId);
                                  return (
                                      <AccordionItem value={group.docId} className="border rounded-md bg-card shadow-sm group">
                                          <div className="flex items-center p-2 rounded-t-md data-[state=open]:bg-muted/30">
                                              <div {...attributes} {...listeners} className="drag-handle cursor-grab p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 touch-none sm:touch-auto" >
                                                  <GripVertical className="h-5 w-5" />
                                              </div>
                                              <AccordionTrigger className="flex-1 p-2 hover:no-underline">
                                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                                      <IconComponent className="h-5 w-5 shrink-0" style={{ color: group.finalDisplayGroupIconColor }} />
                                                      <span className="text-base font-medium truncate" style={{ color: group.finalDisplayGroupTextColor }}>{group.name}</span>
                                                      {showInheritedLabel && <span className="text-xs text-blue-500 shrink-0">({t('inheritedLabel')})</span>}
                                                  </div>
                                              </AccordionTrigger>
                                              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                                  <OrderControls onMoveUp={() => handleMove(currentIndex, currentIndex - 1)} onMoveDown={() => handleMove(currentIndex, currentIndex + 1)} isFirst={currentIndex === 0} isLast={currentIndex === displayGroups.length - 1} disabled={pageEffectivelyDisabled}/>
                                                  <DropdownMenu>
                                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={pageEffectivelyDisabled}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                          <DropdownMenuItem onClick={() => handleOpenDialog(group as any)}><Edit className="mr-2 h-4 w-4"/>{t('editAction')}</DropdownMenuItem>
                                                          <DropdownMenuSeparator />
                                                          <DropdownMenuItem className="text-destructive" onClick={() => setGroupToDelete(group as any)} disabled={(group as any).isSystemLevel}><Trash2 className="mr-2 h-4 w-4"/>{t('deleteAction')}</DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                  </DropdownMenu>
                                              </div>
                                          </div>
                                          <AccordionContent className="px-4 py-2 border-t"><div className="space-y-1">{renderMenuItemTree((group as any).items)}</div></AccordionContent>
                                      </AccordionItem>
                                  )
                              }}
                          />
                      </Accordion>
                  )}
              </CardContent>
              {displayGroups.length > 0 && (
                  <CardFooter className="border-t pt-6">
                      <div className="flex w-full justify-end">
                      <Button type="button" onClick={onOrderSubmit} disabled={isProcessing || !hasUnsavedOrder}>
                          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />{t('saveOrderButton')}
                      </Button>
                      </div>
                  </CardFooter>
              )}
            </form>
          </Card>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl p-0">
            <FormProvider {...groupFormMethods}>
                <form onSubmit={groupFormMethods.handleSubmit(onGroupSubmit)} id="group-form" className="flex flex-col h-full max-h-[90vh]">
                    <DialogHeader className="px-6 pt-6 shrink-0">
                        <DialogTitle>{editingGroup ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
                        <DialogDescription>{t('dialog.description')}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-grow px-6 py-4" style={{ overflowY: 'auto' }}>
                        <div className="space-y-4 pr-2">
                            <FormField control={groupFormMethods.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('dialog.nameLabel')}</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                            <FormField control={groupFormMethods.control} name="slug" render={({ field }) => ( <FormItem><FormLabel>{t('dialog.slugLabel')}</FormLabel><div className="relative"><FormControl><Input variant="slug" {...field} disabled={!!editingGroup} /></FormControl></div><FormDescription>{t('dialog.slugDescription')}</FormDescription><FormMessage /></FormItem>)}/>
                            <IconPickerInput name="icon" label={t('dialog.iconLabel')} />
                            <Button type="button" onClick={handleSuggestion} disabled={isSuggestingStyle} className="w-full" variant="outline"><Wand2 className="mr-2 h-4 w-4" />{isSuggestingStyle ? <Loader2 className="h-4 w-4 animate-spin"/> : t('dialog.suggestButton')}</Button>
                            {suggestionError && <p className="text-sm text-destructive text-center">{suggestionError}</p>}
                            <Separator />
                            <FormField control={groupFormMethods.control} name="colorApplyTo" render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>{t('dialog.colorApplyTo.label')}</FormLabel>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                                        <FormItem><div className="flex items-center gap-2 p-2 border rounded-md has-[[data-state=checked]]:border-primary"><FormControl><RadioGroupItem value="none" /></FormControl><Label className="font-normal cursor-pointer">{t('dialog.colorApplyTo.none')}</Label></div></FormItem>
                                        <FormItem><div className="flex items-center gap-2 p-2 border rounded-md has-[[data-state=checked]]:border-primary"><FormControl><RadioGroupItem value="group_only" /></FormControl><Label className="font-normal cursor-pointer">{t('dialog.colorApplyTo.group_only')}</Label></div></FormItem>
                                        <FormItem><div className="flex items-center gap-2 p-2 border rounded-md has-[[data-state=checked]]:border-primary"><FormControl><RadioGroupItem value="group_and_items" /></FormControl><Label className="font-normal cursor-pointer">{t('dialog.colorApplyTo.group_and_items')}</Label></div></FormItem>
                                    </RadioGroup>
                                    <FormDescription className="text-xs">{t('dialog.colorApplyTo.description')}</FormDescription>
                                </FormItem>
                            )}/>
                            {groupFormMethods.watch("colorApplyTo") !== 'none' && (
                                <>
                                 <FormField control={groupFormMethods.control} name="isColorUnified" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><FormLabel>{t('dialog.isColorUnifiedLabel')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                                 {groupFormMethods.watch("isColorUnified") ? (
                                     <FormField
                                        control={groupFormMethods.control}
                                        name="unifiedColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <ColorPickerInput label={t('dialog.unifiedColorLabel')} value={field.value || ''} onValueChange={field.onChange} />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={groupFormMethods.control}
                                            name="iconColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <ColorPickerInput label={t('dialog.iconColorLabel')} value={field.value || ''} onValueChange={field.onChange} />
                                                    <FormMessage />
                                                </FormItem>
             
                                       )}
                                        />
                                        <FormField
                                            control={groupFormMethods.control}
                                            name="textColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <ColorPickerInput label={t('dialog.textColorLabel')} value={field.value || ''} onValueChange={field.onChange} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="shrink-0 pt-4 border-t px-6 pb-6">
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isProcessing}>{tCommon('cancel')}</Button></DialogClose>
                        <Button type="submit" form="group-form" disabled={isProcessing || !groupFormMethods.formState.isDirty}>{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{tCommon('save')}</Button>
                    </DialogFooter>
                </form>
            </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogAlertTitle>{t('deleteDialog.title')}</AlertDialogAlertTitle><AlertDialogBoxDesc>{t('deleteDialog.description', { groupName: groupToDelete?.name })}</AlertDialogBoxDesc></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGroup} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t('deleteAction')}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
