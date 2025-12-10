// src/app/[locale]/(app)/settings/menus/items/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useMenuData, type ConfiguredMenuItem, type MenuGroupFromFirestore } from '@/hooks/use-menu-data';
import { MenuItemConfigSchema, type MenuItemConfig } from '@/schemas/menu-item-schema';
import { doc, writeBatch, setDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@/components/ui/icon';
import { IconPickerInput } from '@/components/shared/form/IconPickerInput';
import { SortableList } from '@/components/shared/dnd/SortableList';
import { OrderControls } from '@/components/shared/form/OrderControls';
import { BackButton } from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AccessDenied } from '@/components/ui/access-denied';

import { ListChecks, PlusCircle, Loader2, GripVertical, Edit, Trash2, MoreVertical, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { arrayMove } from '@dnd-kit/sortable';
import { dequal } from 'dequal';

const EditItemDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MenuItemConfig) => void;
  itemData: Partial<MenuItemConfig> | null;
  groups: MenuGroupFromFirestore[];
  allItems: ConfiguredMenuItem[];
  isSaving: boolean;
}> = ({ isOpen, onClose, onSave, itemData, groups, allItems, isSaving }) => {
  const t = useTranslations('menus.items.dialog');
  const form = useForm<MenuItemConfig>({
    resolver: zodResolver(MenuItemConfigSchema),
    defaultValues: itemData || {},
  });

  useEffect(() => {
    form.reset(itemData || {});
  }, [itemData, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{itemData?.menuKey ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSave)} id="menu-item-form" className="space-y-4">
            <FormField control={form.control} name="displayName" render={({ field }) => ( <FormItem><FormLabel>{t('displayNameLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="menuKey" render={({ field }) => ( <FormItem><FormLabel>{t('menuKeyLabel')}</FormLabel><FormControl><Input {...field} disabled={!!itemData?.menuKey} /></FormControl><FormDescription>{t('menuKeyDesc')}</FormDescription><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="originalHref" render={({ field }) => ( <FormItem><FormLabel>{t('hrefLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>{t('hrefDesc')}</FormDescription><FormMessage /></FormItem> )}/>
            <IconPickerInput name="originalIcon" label={t('iconLabel')} />
            <FormField control={form.control} name="groupId" render={({ field }) => ( <FormItem><FormLabel>{t('groupLabel')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('groupPlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="">{t('noGroup')}</SelectItem>{groups.map(g => <SelectItem key={g.docId} value={g.docId}>{g.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="parentId" render={({ field }) => ( <FormItem><FormLabel>{t('parentLabel')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('parentPlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="">{t('noParent')}</SelectItem>{allItems.filter(i => i.level === 0).map(i => <SelectItem key={i.menuKey} value={i.menuKey}>{i.displayName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="canBeInitialPage" render={({ field }) => ( <FormItem className="flex items-center gap-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{t('canBeInitialPage')}</FormLabel></FormItem> )}/>
            <FormField control={form.control} name="canBeBottomBarItem" render={({ field }) => ( <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{t('canBeBottomBarItem')}</FormLabel></FormItem> )}/>
          </form>
        </FormProvider>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">{t('cancel')}</Button></DialogClose>
          <Button type="submit" form="menu-item-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function MenuItemsPage() {
  const t = useTranslations('menus.items');
  const { toast } = useToast();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { allCombinedItems, finalGroups, isLoading: isLoadingMenu, refetchMenuData } = useMenuData();
  
  const [displayItems, setDisplayItems] = useState<ConfiguredMenuItem[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItemConfig> | null>(null);

  const canManage = hasPermission('master.settings.menu.edit');

  useEffect(() => {
    const flattened = [...finalGroups.flatMap(g => g.items), ...allCombinedItems.filter(i => !i.groupId && !i.parentId)];
    const sorted = flattened.sort((a,b) => (a.order || 0) - (b.order || 0));
    if(!dequal(sorted, displayItems)) {
        setDisplayItems(sorted);
        setHasUnsavedOrder(false);
    }
  }, [finalGroups, allCombinedItems, displayItems]);

  const handleOpenDialog = (item?: ConfiguredMenuItem) => {
    setEditingItem(item || null);
    setShowDialog(true);
  };
  
  const onSaveItem = async (data: MenuItemConfig) => {
    setIsSaving(true);
    try {
        const docRef = doc(refs.master.menuItems(), data.menuKey);
        await setDoc(docRef, data, { merge: true });
        toast({ title: t('toasts.saveSuccess') });
        setShowDialog(false);
        await refetchMenuData();
    } catch(e: any) {
        toast({ title: t('toasts.saveError'), description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);
    displayItems.forEach((item, index) => {
        const itemRef = doc(refs.master.menuItems(), item.menuKey);
        batch.update(itemRef, { order: index * 10 });
    });
    try {
        await batch.commit();
        toast({ title: t('toasts.saveSuccess'), description: t('toasts.saveSuccessDesc') });
        setHasUnsavedOrder(false);
    } catch(e: any) {
        toast({ title: t('toasts.saveError'), description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSortEnd = (newItems: any[]) => {
      setDisplayItems(newItems);
      setHasUnsavedOrder(true);
  };

  if (isLoadingMenu || isLoadingPermissions) {
      return <div className="p-6"><Skeleton className="h-64 w-full"/></div>
  }
  if (!canManage) {
      return <AccessDenied />;
  }

  return (
    <>
      <Card>
        <CardHeader className="relative">
          <BackButton href="/settings/menus" className="absolute right-6 top-3"/>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2">
            <div>
              <CardTitle className="section-title !border-none !pb-0"><ListChecks className="section-title-icon"/>{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="w-full shrink-0 md:w-auto"><PlusCircle className="mr-2 h-4 w-4"/>{t('createButton')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayItems.length > 0 ? (
            <SortableList
                items={displayItems.map(i => ({ ...i, id: i.menuKey }))}
                onSortEnd={(items) => handleSortEnd(items as ConfiguredMenuItem[])}
                listContainerClassName="space-y-2"
                renderItem={(item, { attributes, listeners }) => (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                         <div {...attributes} {...listeners} className="cursor-grab p-1.5 text-muted-foreground hover:text-foreground touch-none sm:touch-auto"><GripVertical className="h-5 w-5"/></div>
                         <Icon name={item.originalIcon as any} className="h-5 w-5 text-muted-foreground"/>
                         <span className="font-medium text-sm flex-grow">{item.displayName}</span>
                         {item.isModule && <Badge variant="outline">Módulo</Badge>}
                         <Badge variant="secondary">{item.groupId || 'Raiz'}</Badge>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4"/></Button>
                    </div>
                )}
            />
          ) : (
             <p className="text-center text-muted-foreground py-8">{t('noItemsFound')}</p>
          )}
        </CardContent>
         <CardFooter className="border-t pt-6">
            <div className="flex w-full justify-end">
                <Button onClick={handleSaveOrder} disabled={isSaving || !hasUnsavedOrder}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Ordem
                </Button>
            </div>
        </CardFooter>
      </Card>
      
      <EditItemDialog 
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSave={onSaveItem}
        itemData={editingItem}
        groups={finalGroups}
        allItems={allCombinedItems}
        isSaving={isSaving}
      />
    </>
  );
}
