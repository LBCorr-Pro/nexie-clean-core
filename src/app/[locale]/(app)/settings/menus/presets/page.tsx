// src/app/[locale]/(app)/settings/menus/presets/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Loader2, Edit, Trash2, MenuSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { refs } from '@/lib/firestore-refs';
import { BackButton } from "@/components/ui/back-button";
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';

interface MenuPreset {
    id: string;
    presetName: string;
    description?: string;
}

export default function MenuPresetsPage() {
  const t = useTranslations('menus.presets');
  const tCommon = useTranslations('common');
  const [presets, setPresets] = useState<MenuPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<MenuPreset | null>(null);
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as string;
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const canManage = hasPermission('master.settings.menu.edit');

  useEffect(() => {
    if (isLoadingPermissions || !canManage) {
        setIsLoading(false);
        return;
    }

    const presetsCollectionRef = refs.master.menuPresets();
    const q = query(presetsCollectionRef, orderBy("presetName", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPresets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuPreset));
      setPresets(fetchedPresets);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching menu presets:", error);
      toast({ title: t('toasts.loadErrorTitle'), description: t('toasts.loadErrorDesc'), variant: "destructive" });
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast, canManage, t, isLoadingPermissions]);
  
  const handleDeletePreset = useCallback(async () => {
    if (!presetToDelete || !canManage) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(refs.master.menuPresets(), presetToDelete.id));
      toast({ title: t('toasts.deleteSuccessTitle'), description: t('toasts.deleteSuccessDesc', { presetName: presetToDelete.presetName }) });
      setPresetToDelete(null);
    } catch (error) {
       toast({ title: t('toasts.deleteErrorTitle'), description: t('toasts.deleteErrorDesc'), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [presetToDelete, canManage, toast, t]);

  if (isLoadingPermissions) {
      return <div className="flex h-96 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!canManage) {
      return <AccessDenied />;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
          <BackButton href={`/${locale}/settings/menus`} className="absolute right-6 top-3"/>
           <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2"> 
            <div>
              <CardTitle className="section-title !border-none !pb-0">
                <MenuSquare className="section-title-icon" />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <Button asChild className="shrink-0 w-full md:w-auto" disabled={!canManage}>
              <Link href={`/${locale}/settings/menus/presets/create`}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : presets.length === 0 ? (
               <p className="p-6 text-center text-sm text-muted-foreground">{t('noPresets')}</p>
            ) : (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.name')}</TableHead>
                            <TableHead>{t('table.description')}</TableHead>
                            <TableHead className="text-right">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {presets.map((preset) => (
                            <TableRow key={preset.id}>
                                <TableCell className="font-medium">{preset.presetName}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{preset.description || t('noDescription')}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button asChild variant="outline" size="sm" disabled={!canManage}>
                                        <Link href={`/${locale}/settings/menus/presets/${preset.id}/edit`}><Edit className="mr-1 h-3 w-3"/>{t('editAction')}</Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setPresetToDelete(preset)} disabled={!canManage}>{<Trash2 className="mr-1 h-3 w-3"/>}{t('deleteAction')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </div>
        </CardContent>
        {presets.length > 0 && (
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    {t('total', { count: presets.length })}
                </p>
            </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={!!presetToDelete} onOpenChange={(open) => !open && setPresetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.deleteDescription', { presetName: presetToDelete?.presetName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('dialog.deleteAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
