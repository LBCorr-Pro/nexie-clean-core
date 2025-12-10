// src/modules/calc-genius/components/FormulasTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useCalcGenius } from './CalcGeniusContext';
import { Formula, Group } from '../types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, MoreVertical, Edit, Trash2, Search, XCircle, FunctionSquare, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const NO_GROUP_VALUE = "_NONE_";
type SortOption = 'name-asc' | 'name-desc' | 'createdAt-desc' | 'createdAt-asc';

export const FormulasTab: React.FC = () => {
    const t = useTranslations('calcGenius.formulasTab');
    const commonT = useTranslations('common');
    const {
        formulas,
        groups,
        isLoading,
        isSaving,
        canManageFormulas,
        openFormulaDialog,
        deleteFormulas,
    } = useCalcGenius();

    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');
    const [resultTypeFilter, setResultTypeFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    
    const groupMap = useMemo(() => new Map(groups.map(g => [g.docId, g.label])), [groups]);

    const filteredAndSortedFormulas = useMemo(() => {
        let items = [...formulas];

        if (searchTerm) {
            items = items.filter(f => f.label.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (groupFilter !== 'all') {
            if (groupFilter === NO_GROUP_VALUE) {
                items = items.filter(f => !f.groupIds || f.groupIds.length === 0);
            } else {
                items = items.filter(f => f.groupIds?.includes(groupFilter));
            }
        }
        if (resultTypeFilter !== 'all') {
            items = items.filter(f => f.result_type === resultTypeFilter);
        }
        
        return items.sort((a, b) => {
            switch (sortOption) {
                case 'name-desc': return b.label.localeCompare(a.label);
                case 'name-asc':
                default:
                    return a.label.localeCompare(b.label);
            }
        });
    }, [formulas, searchTerm, groupFilter, resultTypeFilter, sortOption]);

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? filteredAndSortedFormulas.map(f => f.id) : []);
    };
    
    const handleRowSelect = (id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(pId => pId !== id));
    };

    const confirmDelete = () => {
        const idsToDelete = itemToDelete === 'bulk' ? selectedIds : (itemToDelete ? [itemToDelete] : []);
        if (idsToDelete.length > 0) {
            deleteFormulas(idsToDelete);
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

    const isAllSelected = selectedIds.length > 0 && selectedIds.length === filteredAndSortedFormulas.length;
    const isAnySelected = selectedIds.length > 0;
    
    const getDeletionDescription = () => {
        if (itemToDelete === 'bulk') {
            return t('deleteDialog.description', { count: selectedIds.length });
        }
        if (itemToDelete) {
            const formula = formulas.find(f => f.id === itemToDelete);
            return t('deleteDialog.description_single', { formulaName: formula?.label || '' });
        }
        return '';
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <CardTitle className="section-title !border-none !pb-0">
                                <FunctionSquare className="section-title-icon" />
                                {t('title')}
                            </CardTitle>
                            <CardDescription>{t('description')}</CardDescription>
                        </div>
                        <Button onClick={() => openFormulaDialog()} disabled={isSaving || !canManageFormulas} className="shrink-0 w-full md:w-auto">
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
                        <Select value={groupFilter} onValueChange={setGroupFilter}>
                            <SelectTrigger><SelectValue placeholder={t('toolbar.groupFilterPlaceholder')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('toolbar.allGroups')}</SelectItem>
                                <SelectItem value={NO_GROUP_VALUE}>{t('toolbar.noGroup')}</SelectItem>
                                {groups.map(g => <SelectItem key={g.docId} value={g.docId}>{g.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={resultTypeFilter} onValueChange={setResultTypeFilter}>
                            <SelectTrigger><SelectValue placeholder={t('toolbar.resultTypeFilterPlaceholder')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('toolbar.allResultTypes')}</SelectItem>
                                <SelectItem value="number">{t('dataTypes.number')}</SelectItem>
                                <SelectItem value="string">{t('dataTypes.string')}</SelectItem>
                                <SelectItem value="boolean">{t('dataTypes.boolean')}</SelectItem>
                                <SelectItem value="date">{t('dataTypes.date')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {isAnySelected && (
                            <Button variant="destructive" onClick={() => setItemToDelete('bulk')} disabled={isSaving || !canManageFormulas}>
                                <Trash2 className="mr-2 h-4 w-4"/> {commonT('delete')} ({selectedIds.length})
                            </Button>
                        )}
                    </div>
                    
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"><Checkbox checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} aria-label="Select all rows" /></TableHead>
                                    <TableHead>{t('table.headers.label')}</TableHead>
                                    <TableHead>{t('table.headers.id')}</TableHead>
                                    <TableHead>{t('table.headers.resultType')}</TableHead>
                                    <TableHead>{t('table.headers.formulaType')}</TableHead>
                                    <TableHead>{t('table.headers.groups')}</TableHead>
                                    <TableHead className="text-right w-20">{t('table.headers.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedFormulas.length > 0 ? (
                                    filteredAndSortedFormulas.map(formula => (
                                        <TableRow key={formula.id} data-state={selectedIds.includes(formula.id) && "selected"}>
                                            <TableCell><Checkbox checked={selectedIds.includes(formula.id)} onCheckedChange={(c) => handleRowSelect(formula.id, !!c)} /></TableCell>
                                            <TableCell className="font-medium">{formula.label}</TableCell>
                                            <TableCell className="font-mono text-xs">{formula.id}</TableCell>
                                            <TableCell><Badge variant="outline">{t(`dataTypes.${formula.result_type}` as any)}</Badge></TableCell>
                                            <TableCell><Badge variant="outline">{formula.formula_type}</Badge></TableCell>
                                            <TableCell className="space-x-1">
                                                {formula.groupIds?.map(gid => <Badge key={gid} variant="secondary">{groupMap.get(gid) || gid}</Badge>)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSaving}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openFormulaDialog(formula)} disabled={!canManageFormulas}><Edit className="mr-2 h-4 w-4"/>{commonT('edit')}</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setItemToDelete(formula.id)} disabled={!canManageFormulas} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>{commonT('delete')}</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">{t('table.emptyState')}</TableCell></TableRow>
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
                        <AlertDialogDescription>
                            {getDeletionDescription()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving} onClick={() => setItemToDelete(null)}>{commonT('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isSaving || !canManageFormulas} className="bg-destructive hover:bg-destructive/90">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {commonT('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
