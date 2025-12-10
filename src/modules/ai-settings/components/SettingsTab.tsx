// src/modules/ai-settings/components/SettingsTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2, Copy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import type { AIProviderConfig } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfigurationFormDialog } from './ConfigurationFormDialog';

export function SettingsTab() {
  const t = useTranslations('aiSettings.settingsTab');
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();

  const [configurations, setConfigurations] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<AIProviderConfig> | null>(null);
  const [configToDelete, setConfigToDelete] = useState<AIProviderConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = hasPermission('master.ia_integrations.manage');

  useEffect(() => {
    const q = query(refs.master.aiProviderConfigurations(), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedConfigs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AIProviderConfig));
        setConfigurations(fetchedConfigs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching AI configurations:", error);
        toast({ title: t('toasts.loadingError'), variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, t]);

  const handleOpenDialog = (config?: AIProviderConfig) => {
    if (!canManage) return;
    setEditingConfig(config || null);
    setShowDialog(true);
  };
  
  const handleDuplicateConfig = (config: AIProviderConfig) => {
    if (!canManage) return;
    const { id, ...restOfConfig } = config;
    const duplicatedData = {
      ...restOfConfig,
      name: `${config.name} (Cópia)`,
    };
    setEditingConfig(duplicatedData); 
    setShowDialog(true);
    toast({ title: t('toasts.duplicatingTitle'), description: t('toasts.duplicatingDescription', { name: config.name }) });
  };

  const handleDelete = async () => {
    if (!configToDelete || !canManage) return;
    setIsDeleting(true);
    try {
      const docRef = doc(refs.master.aiProviderConfigurations(), configToDelete.id);
      await deleteDoc(docRef);
      toast({ title: t('toasts.deleteSuccessTitle'), description: t('toasts.deleteSuccessDescription', { name: configToDelete.name }) });
      setConfigToDelete(null);
    } catch (error: any) {
      toast({ title: t('toasts.deleteErrorTitle'), description: error.message, variant: "destructive"});
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                  <CardTitle>{t('title')}</CardTitle>
                  <CardDescription>{t('description')}</CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} className="w-full md:w-auto shrink-0" disabled={!canManage}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('addButton')}
              </Button>
          </div>
        </CardHeader>
        <CardContent>
           <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.name')}</TableHead>
                            <TableHead>{t('table.provider')}</TableHead>
                            <TableHead>{t('table.model')}</TableHead>
                            <TableHead className="text-center">{t('table.status')}</TableHead>
                            <TableHead className="text-right">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                        ) : configurations.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('table.noResults')}</TableCell></TableRow>
                        ) : (
                            configurations.map(config => (
                                <TableRow key={config.id}>
                                    <TableCell className="font-medium">{config.name}</TableCell>
                                    <TableCell>{config.provider}</TableCell>
                                    <TableCell className="font-mono text-xs">{config.modelId}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap items-center justify-center gap-1">
                                            <Badge variant={config.isActive ? 'success' : 'secondary'}>{config.isActive ? t('statusLabels.active') : t('statusLabels.inactive')}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canManage}><MoreVertical className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(config)} disabled={!canManage}><Edit className="mr-2 h-4 w-4"/>{t('actions.edit')}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicateConfig(config)} disabled={!canManage}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <span>{t('actions.duplicate')}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setConfigToDelete(config)} className="text-destructive" disabled={!canManage}><Trash2 className="mr-2 h-4 w-4"/>{t('actions.delete')}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {showDialog && (
          <ConfigurationFormDialog 
            isOpen={showDialog}
            onClose={() => { setShowDialog(false); setEditingConfig(null); }}
            editingConfig={editingConfig as AIProviderConfig | null}
          />
      )}

      <AlertDialog open={!!configToDelete} onOpenChange={() => setConfigToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('deleteDialog.description', { name: configToDelete?.name })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('deleteDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
