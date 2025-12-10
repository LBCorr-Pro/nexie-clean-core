// src/modules/calc-genius/components/GroupsTab.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/nx-use-toast";
import * as LucideIcons from 'lucide-react';
import { suggestStyle } from "@/ai/flows/suggest-style-flow";
import { useCalcGenius } from './CalcGeniusContext';
import { Group, GroupFormData, getGroupFormSchema } from '../types';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogBoxDesc, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogAlertTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, PlusCircle, Edit, Trash2, Wand2, List, GripVertical, MoreVertical, Save } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SortableList } from '@/components/shared/dnd/SortableList';
import { arrayMove } from '@dnd-kit/sortable';
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { IconPickerInput } from '@/components/shared/form/IconPickerInput';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from '@/components/ui/icon';
import { OrderControls } from '@/components/shared/form/OrderControls';

const kebabToPascalCase = (kebab?: string): string => { if (!kebab) return 'LayoutGrid'; return kebab.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(''); };
const getIconComponent = (iconName?: string): React.ElementType => (LucideIcons as any)[kebabToPascalCase(iconName)] || LucideIcons.LayoutGrid;
const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export const GroupsTab: React.FC = () => {
    const t = useTranslations('calcGenius.groupsTab');
    const commonT = useTranslations('common');
    const zodT = useTranslations('calcGenius.zod');
    const router = useRouter();
    const pathname = usePathname();

    const {
        groups,
        isLoading,
        isSaving,
        canManageGroups,
        saveGroupOrder,
        saveGroup,
        deleteGroup
    } = useCalcGenius();

    const [orderedGroups, setOrderedGroups] = useState<Group[]>(groups);
    const [showDialog, setShowDialog] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
    const [isSuggestingStyle, setIsSuggestingStyle] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    useEffect(() => { setOrderedGroups(groups) }, [groups]);

    const GroupFormSchema = useMemo(() => getGroupFormSchema(zodT), [zodT]);
    const form = useForm<GroupFormData>({ resolver: zodResolver(GroupFormSchema) });
    const watchedName = form.watch('name');

    useEffect(() => {
        if (!editingGroup && watchedName) {
            form.setValue('slug', generateSlug(watchedName), { shouldValidate: true });
        }
    }, [watchedName, editingGroup, form]);

    const handleOpenDialog = useCallback((group?: Group) => {
        setEditingGroup(group || null);
        const defaultValues: GroupFormData = {
            name: "", slug: "", icon: "LayoutGrid", colorApplyTo: 'none', isColorUnified: true, unifiedColor: "#6B7280", iconColor: '#FFFFFF', textColor: '#FFFFFF'
        };
        form.reset(group ? {
            name: group.label,
            slug: group.id,
            icon: group.icon,
            colorApplyTo: group.colorApplyTo || 'none',
            isColorUnified: group.useSameColor ?? true,
            unifiedColor: group.unifiedColor, iconColor: group.iconColor, textColor: group.textColor,
        } : defaultValues);
        setShowDialog(true);
    }, [form]);

    const handleViewGroup = useCallback((groupId: string) => router.push(`${pathname}?tab=fields&group=${groupId}`), [router, pathname]);

    const onGroupSubmit = async (data: GroupFormData) => {
        const result = await saveGroup(data, editingGroup);
        if (result.success) {
            setShowDialog(false);
        } else if(result.error) {
            form.setError("slug", { type: "manual", message: result.error });
        }
    };

    const handleDelete = async () => {
        if (groupToDelete) {
            await deleteGroup(groupToDelete.docId);
            setGroupToDelete(null);
        }
    };

    const onOrderSubmit = async () => {
        if (!orderedGroups) return;
        await saveGroupOrder(orderedGroups);
        setHasUnsavedOrder(false);
    };

    const handleSortEnd = (sortedItems: Group[]) => {
        setOrderedGroups(sortedItems);
        setHasUnsavedOrder(true);
    };
    
    const handleSuggestion = useCallback(async () => {
        const groupName = form.getValues('name');
        if (!groupName) {
            form.setError('name', { type: 'manual', message: t('styleSuggestion.nameRequired') });
            return;
        }
        setIsSuggestingStyle(true);
        setSuggestionError(null);
        try {
            const result = await suggestStyle({ itemName: groupName, itemType: 'menuGroup' });
            if (result.suggestedColor) {
                form.setValue('unifiedColor', result.suggestedColor, { shouldDirty: true });
            }
            if (result.suggestedIcon) {
                form.setValue('icon', result.suggestedIcon, { shouldDirty: true });
            }
        } catch (error) {
            setSuggestionError(t('styleSuggestion.apiError'));
        } finally {
            setIsSuggestingStyle(false);
        }
    }, [form, t]);

    const renderGroupItem = useCallback((group: Group, { attributes, listeners, isDragging }: any) => {
        const GroupIcon = getIconComponent(group.icon);
        return (
            <div className={cn(
                "flex items-center justify-between p-3 pl-1 border rounded-md bg-background",
                isDragging && "shadow-lg scale-105 z-10"
            )}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab" disabled={isSaving || !canManageGroups}><GripVertical className="h-5 w-5"/></Button>
                    <GroupIcon style={{ color: group.iconColor }} className="h-5 w-5 shrink-0"/>
                    <span style={{ color: group.textColor }} className="font-medium truncate">{group.label}</span>
                    <Badge variant="outline" className="hidden sm:inline-block">{group.fieldsCount || 0} {t('fieldsCount')}</Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewGroup(group.id)}>{t('actions.viewFields')}</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSaving || !canManageGroups}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(group)} disabled={!canManageGroups}><Edit className="mr-2 h-4 w-4"/>{t('actions.edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setGroupToDelete(group)} disabled={group.id === 'default' || !canManageGroups} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>{t('actions.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    }, [isSaving, canManageGroups, t, handleViewGroup, handleOpenDialog, setGroupToDelete]);


    return (
    <>
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <CardTitle className="section-title !border-none !pb-0">
                        <List className="section-title-icon" />
                        {t('title')}
                    </CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </div>
                <Button type="button" onClick={() => handleOpenDialog()} disabled={isLoading || isSaving || !canManageGroups} className="shrink-0 w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div>
          ) : orderedGroups.length > 0 ? (
            <SortableList items={orderedGroups.map(g => ({...g, id: g.docId}))} onSortEnd={handleSortEnd} renderItem={renderGroupItem} listContainerClassName="space-y-2" />
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('emptyState')}</p>
          )}
        </CardContent>
        {orderedGroups.length > 0 && (
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end border-t pt-6">
                <Button onClick={onOrderSubmit} disabled={!hasUnsavedOrder || isSaving || !canManageGroups} className="w-full sm:w-auto">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('saveOrderButton')}
                </Button>
            </CardFooter>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl p-0">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onGroupSubmit)} id="group-form" className="flex flex-col h-full max-h-[90vh]">
                <DialogHeader className="p-6 pb-4 shrink-0">
                    <DialogTitle>{editingGroup ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
                    <DialogDescription>{t('dialog.description')}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow px-6">
                    <div className="space-y-4 pr-3 py-4">
                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{t('dialog.name.label')}</FormLabel><FormControl><Input {...field} placeholder={t('dialog.name.placeholder')} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField name="slug" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{t('dialog.slug.label')}</FormLabel><FormControl><Input {...field} variant="slug" placeholder={t('dialog.slug.placeholder')} disabled={!!editingGroup} /></FormControl><FormDescription>{t('dialog.slug.description')}</FormDescription><FormMessage /></FormItem> )}/>
                        <Separator />
                        <div className="flex items-center justify-between"><h3 className="text-lg font-medium">{t('dialog.style.title')}</h3><Button type="button" size="sm" variant="outline" onClick={handleSuggestion} disabled={isSuggestingStyle}>{isSuggestingStyle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} {t('styleSuggestion.button')}</Button></div>
                        {suggestionError && <p className="text-sm text-destructive">{suggestionError}</p>}
                        <IconPickerInput name="icon" label={t('dialog.icon.label')} />
                        <FormField name="isColorUnified" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>{t('dialog.unifiedColor.label')}</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                        {form.watch('isColorUnified') ? (
                            <FormField name="unifiedColor" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{t('dialog.unifiedColor.colorLabel')}</FormLabel><FormControl><ColorPickerInput label={t('dialog.unifiedColor.colorLabel')} value={field.value || ''} onValueChange={field.onChange} /></FormControl></FormItem> )}/>
                        ) : (
                            <div className="grid grid-cols-2 gap-4"> <FormField name="iconColor" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{t('dialog.iconColor.label')}</FormLabel><FormControl><ColorPickerInput label={t('dialog.iconColor.label')} value={field.value || ''} onValueChange={field.onChange} /></FormControl></FormItem> )}/> <FormField name="textColor" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{t('dialog.textColor.label')}</FormLabel><FormControl><ColorPickerInput label={t('dialog.textColor.label')} value={field.value || ''} onValueChange={field.onChange} /></FormControl></FormItem> )}/> </div>
                        )}
                        <FormField name="colorApplyTo" control={form.control} render={({ field }) => (
                            <FormItem className="pt-2"><FormLabel>{t('dialog.applyColorTo.label')}</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><FormControl><RadioGroupItem value="none" className="sr-only"/></FormControl>{t('dialog.applyColorTo.options.none')}</Label>
                                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><FormControl><RadioGroupItem value="group_only" className="sr-only"/></FormControl>{t('dialog.applyColorTo.options.groupOnly')}</Label>
                                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary col-span-2"><FormControl><RadioGroupItem value="group_and_items" className="sr-only"/></FormControl>{t('dialog.applyColorTo.options.groupAndItems')}</Label>
                                </RadioGroup>
                                <FormDescription className="text-xs">{t('dialog.applyColorTo.description')}</FormDescription>
                            </FormItem>
                        )}/>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t">
                    <DialogClose asChild><Button type="button" variant="outline">{commonT('cancel')}</Button></DialogClose>
                    <Button type="submit" form="group-form" disabled={isSaving || !canManageGroups || !form.formState.isDirty}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {commonT('save')}</Button>
                </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

       <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogAlertTitle>{t('deleteDialog.title')}</AlertDialogAlertTitle><AlertDialogBoxDesc>{t('deleteDialog.description', { groupName: groupToDelete?.label })}</AlertDialogBoxDesc></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>{commonT('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSaving || !canManageGroups} className="bg-destructive hover:bg-destructive/90">
                   {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('deleteDialog.confirmButton')}
                </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
