
// src/app/[locale]/(app)/access/instances/components/NxManageInstancesClient.tsx
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useNxManageInstances } from '@/hooks/use-nx-manage-instances';
import { useFormatters } from '@/hooks/use-formatters';
import { cn } from '@/lib/utils';
import type { Instance } from '../types';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Search, Eye, MoreVertical, Edit, Trash2, Users, CreditCard, Server, Code, Star, ArrowUp, ArrowDown } from 'lucide-react';

export function NxManageInstancesClient() {
  const t = useTranslations('instanceManagement');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { shortDateTime } = useFormatters();

  const { setActingAs } = useInstanceActingContext();
  
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
      instances, 
      plansMap, 
      isLoading, 
      searchTerm, 
      setSearchTerm, 
      sortConfig, 
      handleSort, 
      permissions
  } = useNxManageInstances();

  // CORREÇÃO: A lógica de deleção será movida para uma Server Action no futuro.
  const handleDelete = async () => {
    if (!instanceToDelete || !permissions.canDelete) return;
    setIsDeleting(true);
    // ... (Lógica de deleção futura)
    // Simulação de sucesso por enquanto
    toast({ title: "Instance deleted (simulation)" });
    setIsDeleting(false);
    setInstanceToDelete(null);
  };
  
  const handleSetActingAs = (id: string, name: string) => {
    setActingAs(id, name);
    // Redireciona para a dashboard da instância para estabelecer o novo contexto de URL
    router.push(`/${locale}/dashboard`); 
  };
  
  // CORREÇÃO: Garante a navegação completa para a URL de edição
  const handleEditClick = (instanceId: string) => {
    router.push(`/${locale}/access/instances/${instanceId}/edit`);
  };


  const getInstanceTypeProps = (type?: string) => {
    switch (type) {
        case 'dev': return { label: t('typeDev'), Icon: Code, className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' };
        case 'master': return { label: t('typeMaster'), Icon: Star, className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' };
        default: return { label: t('typeDefault'), Icon: Server, className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700' };
    }
  }

  const { hasPermission } = useUserPermissions();
  const canManageUsers = hasPermission('instance.users.manage');

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : instances.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t('noInstancesFound')}</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Button variant="ghost" onClick={() => handleSort('instanceName')}>{t('tableHeaders.instanceName')} {sortConfig.key === 'instanceName' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => handleSort('instanceType')}>{t('tableHeaders.type')} {sortConfig.key === 'instanceType' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => handleSort('planId')}>{t('tableHeaders.plan')} {sortConfig.key === 'planId' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead><Button variant="ghost" onClick={() => handleSort('createdAt')}>{t('tableHeaders.createdAt')} {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance: Instance) => {
                const typeProps = getInstanceTypeProps(instance.instanceType);
                const canEdit = permissions.canEdit;
                const canDelete = permissions.canDelete;

                return (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.instanceName}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("flex items-center gap-1.5 w-fit", typeProps.className)}><typeProps.Icon className="h-3 w-3" />{typeProps.label}</Badge></TableCell>
                    <TableCell>{instance.planId ? <Badge variant="outline" className="flex items-center gap-1.5 w-fit"><CreditCard className="h-3.5 w-3.5"/>{plansMap.get(instance.planId) || instance.planId}</Badge> : <span className="text-xs text-muted-foreground">{t('noPlan')}</span>}</TableCell>
                    <TableCell><Badge variant={instance.status ? "success" : "secondary"}>{instance.status ? t('active') : t('inactive')}</Badge></TableCell>
                    <TableCell>{instance.createdAt ? shortDateTime(instance.createdAt) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleSetActingAs(instance.id, instance.instanceName)}><Eye className="h-4 w-4"/><span className="sr-only">{t('actions.actAs', { instanceName: instance.instanceName })}</span></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={!canManageUsers} asChild><Link href={`/${locale}/users/${instance.id}`} className="flex items-center w-full"><Users className="mr-2 h-4 w-4"/>{t('actions.manageUsers')}</Link></DropdownMenuItem>
                          {/* CORREÇÃO: Usa o handler para forçar a navegação */}
                          <DropdownMenuItem disabled={!canEdit} onSelect={() => handleEditClick(instance.id)}>
                            <Edit className="mr-2 h-4 w-4"/>{t('actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setInstanceToDelete(instance)} disabled={!canDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>{t('actions.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
       <AlertDialog open={!!instanceToDelete} onOpenChange={(open) => !open && setInstanceToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('dialog.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('dialog.deleteConfirmDescription', { instanceName: instanceToDelete?.instanceName })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t('dialog.deleteConfirmAction')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
