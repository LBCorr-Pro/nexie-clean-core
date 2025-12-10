// src/modules/calc-genius/components/FieldsTab.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCalcGenius } from './CalcGeniusContext';
import { Field, Group } from '../types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, MoreVertical, Edit, Trash2, Search, XCircle, Wrench, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const NO_GROUP_VALUE = "_NONE_";
type SortOption = 'order-asc' | 'label-asc' | 'label-desc' | 'id-asc';

export const FieldsTab: React.FC = () => {
    const t = useTranslations('calcGenius.fieldsTab');
    const commonT = useTranslations('common');
    const {
        fields: allFields,
        groups,
        isLoading,
        isSaving,
        canManageFields,
        openFieldDialog,
        deleteFields
    } = useCalcGenius();

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const activeGroup = useMemo(() => searchParams.get('group') || 'all', [searchParams]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('order-asc');

    const filteredAndSortedFields = useMemo(() => {
        let items = [...allFields];
        if (activeGroup !== 'all') {
            if (activeGroup === NO_GROUP_VALUE) {
                items = items.filter(f => !f.mainGroupId && (!f.groupIds || f.groupIds.length === 0));
            } else {
                items = items.filter(f => f.mainGroupId === activeGroup || f.groupIds?.includes(activeGroup));
            }
        }
        if (searchTerm) {
            items = items.filter(f => f.label.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return items.sort((a, b) => {
            switch (sortOption) {
                case 'label-asc': return a.label.localeCompare(b.label);
                case 'label-desc': return b.label.localeCompare(a.label);
                case 'id-asc': return a.id.localeCompare(b.id);
                case 'order-asc':
                default:
                    return (a.order ?? 999) - (b.order ?? 999);
            }
        });
    }, [allFields, activeGroup, searchTerm, sortOption]);

    const handleGroupFilterChange = (groupId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (groupId === 'all') params.delete('group');
        else params.set('group', groupId);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? filteredAndSortedFields.map(f => f.id) : []);
    };

    const handleRowSelect = (id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(pId => pId !== id));
    };

    const confirmDelete = () => {
        const idsToDelete = itemToDelete === 'bulk' ? selectedIds : (itemToDelete ? [itemToDelete] : []);
        if (idsToDelete.length > 0) {
            deleteFields(idsToDelete);
        }
        setSelectedIds([]);
        setItemToDelete(null);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                <CardContent><Skeleton className="h-60 w-full" /></CardContent>
            </Card>
        );
    }

    const isAllSelected = selectedIds.length > 0 && selectedIds.length === filteredAndSortedFields.length;
    const isAnySelected = selectedIds.length > 0;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <CardTitle className="section-title !border-none !pb-0">
                                <Wrench className="section-title-icon" />
                                {t('title')}
                            </CardTitle>
                            <CardDescription>{t('description')}</CardDescription>
                        </div>
                        <Button onClick={() => openFieldDialog(null)} disabled={isSaving || !canManageFields} className="shrink-0 w-full md:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                         <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={t('toolbar.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full" />
                            {searchTerm && <XCircle onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" />}
                        </div>
                        <Select value={activeGroup} onValueChange={handleGroupFilterChange}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('toolbar.allGroups')}</SelectItem>
                                <SelectItem value={NO_GROUP_VALUE}>{t('toolbar.noGroup')}</SelectItem>
                                {groups.map(g => <SelectItem key={g.docId} value={g.docId}>{g.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {isAnySelected && (
                            <Button variant="destructive" onClick={() => setItemToDelete('bulk')} disabled={isSaving || !canManageFields}>
                                <Trash2 className="mr-2 h-4 w-4"/> {t('toolbar.deleteSelected', { count: selectedIds.length })}
                            </Button>
                        )}
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} aria-label="Select all"/>
                                    </TableHead>
                                    <TableHead>{t('table.headers.label')}</TableHead>
                                    <TableHead>{t('table.headers.id')}</TableHead>
                                    <TableHead>{t('table.headers.type')}</TableHead>
                                    <TableHead className="text-right w-20">{t('table.headers.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedFields.length > 0 ? (
                                    filteredAndSortedFields.map(field => (
                                        <TableRow key={field.id} data-state={selectedIds.includes(field.id) && "selected"}>
                                            <TableCell><Checkbox checked={selectedIds.includes(field.id)} onCheckedChange={(c) => handleRowSelect(field.id, !!c)} /></TableCell>
                                            <TableCell className="font-medium">{field.label}</TableCell>
                                            <TableCell className="font-mono text-xs">{field.id}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{t(`dataType.${field.data_type}`)}</Badge>
                                                <Badge variant="secondary" className="ml-2">{t(`originType.${field.origin_type}`)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSaving}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openFieldDialog(field)} disabled={!canManageFields}><Edit className="mr-2 h-4 w-4"/>{commonT('edit')}</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setItemToDelete(field.id)} disabled={!canManageFields} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>{commonT('delete')}</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('emptyState')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('deleteDialog.description', { count: itemToDelete === 'bulk' ? selectedIds.length : 1 })}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving} onClick={() => setItemToDelete(null)}>{commonT('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isSaving || !canManageFields} className="bg-destructive hover:bg-destructive/90">
                             {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                             {t('deleteDialog.confirmButton')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
