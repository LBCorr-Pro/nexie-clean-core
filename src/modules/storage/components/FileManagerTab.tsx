// src/modules/storage/components/FileManagerTab.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { listFilesAndFolders, type StorageItem } from '@/modules/storage/actions';
import { useToast } from '@/hooks/nx-use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Folder, MoreVertical, Edit, Trash2, Download, ExternalLink, ChevronRight, Home, Upload, Copy } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatBytes, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// A mapping from next-intl locale identifiers to date-fns locale objects.
const dateLocales: { [key: string]: any } = {
  'en': enUS,
  'pt-BR': ptBR,
};

export function FileManagerTab() {
    const t = useTranslations('storageModule.fileManager');
    const locale = useLocale();
    const { toast } = useToast();
    const [items, setItems] = useState<StorageItem[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [isLoading, startLoading] = useTransition();
    const [itemToDelete, setItemToDelete] = useState<StorageItem | null>(null);

    // NX Architecture Hooks
    const { actingAsInstanceId } = useInstanceActingContext();
    const { hasPermission } = useUserPermissions();

    // Permissions
    const canUpload = hasPermission('module.storage.upload');
    const canRename = hasPermission('module.storage.rename');
    const canDelete = hasPermission('module.storage.delete');

    const loadItems = useCallback((path: string) => {
        startLoading(async () => {
            try {
                // Context is now fetched from the hook, not props
                const result = await listFilesAndFolders(path, actingAsInstanceId, null);
                if (result.success && result.items) {
                    setItems(result.items);
                } else {
                    throw new Error(result.error || t('toasts.defaultLoadError'));
                }
            } catch (error: any) {
                toast({ title: t('toasts.loadErrorTitle'), description: error.message, variant: "destructive" });
                setItems([]);
            }
        });
    }, [actingAsInstanceId, t, toast]);

    useEffect(() => {
        loadItems(currentPath);
    }, [currentPath, loadItems]);

    const handleDelete = async () => {
        if (!canDelete || !itemToDelete) {
            toast({ title: t('toasts.permissionDenied'), variant: 'destructive' });
            return;
        }
        // Add deletion logic here
        toast({ title: t('toasts.deleteSuccess')});
        setItemToDelete(null);
    }
    
    const handleNavigate = (item: StorageItem) => {
        if (item.type === 'folder') setCurrentPath(item.fullPath);
    };

    const handleBreadcrumbClick = (index: number) => {
        const breadcrumbPath = breadcrumbs.slice(0, index + 1).join('/');
        setCurrentPath(breadcrumbPath);
    };

    const breadcrumbs = currentPath.split('/').filter(Boolean);
    const getDateLocale = () => dateLocales[locale] || enUS;

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={!canUpload}>
                        <Upload className="mr-2 h-4 w-4"/> {t('uploadButton')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Home className="h-4 w-4 cursor-pointer" onClick={() => setCurrentPath('')}/>
                    {breadcrumbs.length > 0 && <ChevronRight className="h-4 w-4"/>}
                    {breadcrumbs.map((segment, index) => (
                        <React.Fragment key={index}>
                            <span className="cursor-pointer hover:text-primary" onClick={() => handleBreadcrumbClick(index)}>{segment}</span>
                            {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4"/>}
                        </React.Fragment>
                    ))}
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>{t('tableHeaders.name')}</TableHead>
                                <TableHead>{t('tableHeaders.size')}</TableHead>
                                <TableHead>{t('tableHeaders.modified')}</TableHead>
                                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : items.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center">{t('emptyState')}</TableCell></TableRow>
                            ) : (
                                items.map(item => (
                                    <TableRow key={item.fullPath}>
                                        <TableCell>
                                            {item.type === 'folder' ? <Folder className="h-6 w-6 text-yellow-500"/> : <FileText className="h-6 w-6 text-gray-500"/>}
                                        </TableCell>
                                        <TableCell className={cn("font-medium", { "cursor-pointer hover:underline": item.type === 'folder'})} onClick={() => handleNavigate(item)}>{item.name}</TableCell>
                                        <TableCell>{item.size ? formatBytes(item.size) : '--'}</TableCell>
                                        <TableCell>{item.updated ? format(parseISO(item.updated), 'dd/MM/yyyy HH:mm', { locale: getDateLocale() }) : '--'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {item.type === 'file' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}><ExternalLink className="mr-2 h-4 w-4"/>{t('actions.open')}</DropdownMenuItem>
                                                            <DropdownMenuItem><Download className="mr-2 h-4 w-4"/>{t('actions.download')}</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.url || '')}><Copy className="mr-2 h-4 w-4"/>{t('actions.copyUrl')}</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    <DropdownMenuItem disabled={!canRename}><Edit className="mr-2 h-4 w-4"/>{t('actions.rename')}</DropdownMenuItem>
                                                    <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                                                        <AlertDialogTrigger asChild>
                                                          <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} disabled={!canDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>{t('actions.delete')}</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                          <AlertDialogHeader><AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle><AlertDialogDescription>{t('deleteDialog.description', { itemName: item.name })}</AlertDialogDescription></AlertDialogHeader>
                                                          <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('deleteDialog.confirmButton')}</AlertDialogAction>
                                                          </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                 {/* Dialog for renaming would go here */}
            </CardContent>
        </Card>
    );
}
