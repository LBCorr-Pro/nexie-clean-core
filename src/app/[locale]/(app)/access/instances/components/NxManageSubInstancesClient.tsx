// src/app/[locale]/(app)/access/instances/components/NxManageSubInstancesClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { onSnapshot, query, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';

import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useFormatters } from '@/hooks/use-formatters';
import { refs } from '@/lib/firestore-refs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Loader2, PlusCircle, Search, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';
import Link from 'next/link';

// Usando o tipo SubInstance da página de edição
import type { SubInstance } from '../edit/types';

export function NxManageSubInstancesClient() {
  const t = useTranslations('instanceManagement');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { setActingAs } = useInstanceActingContext();
  const { shortDateTime } = useFormatters();

  const instanceId = params.instanceId as string;
  const locale = params.locale as string;

  const { hasPermission } = useUserPermissions();
  const canCreate = hasPermission('instance.subinstances.manage');
  const canEdit = hasPermission('instance.subinstances.manage');
  const canDelete = hasPermission('instance.subinstances.manage');

  const [subInstances, setSubInstances] = useState<SubInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<SubInstance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!instanceId) {
      setIsLoading(false);
      return;
    }
    const subInstancesQuery = query(refs.instance.subinstances(instanceId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(subInstancesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      } as SubInstance));
      setSubInstances(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [instanceId]);

  const filteredItems = useMemo(() => {
    return subInstances.filter(item =>
      item.subInstanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subInstances, searchTerm]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(refs.instance.subinstanceDoc(instanceId, itemToDelete.id));
      toast({ title: t('toasts.deleteSuccessTitle') });
      setItemToDelete(null);
    } catch (error) {
      toast({ title: t('toasts.deleteErrorTitle'), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild className="w-full sm:w-auto" disabled={!canCreate}>
          <Link href={`/${locale}/access/instances/${instanceId}/create`}>
            <PlusCircle className="mr-2 h-4 w-4" /> {t('createSubInstance.title')}
          </Link>
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('subInstances.table.name')}</TableHead>
              <TableHead>{t('subInstances.table.status')}</TableHead>
              <TableHead>{t('subInstances.table.createdAt')}</TableHead>
              <TableHead className="text-right">{t('actions.title')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">{t('subInstances.noSubInstances')}</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.subInstanceName}</TableCell>
                  <TableCell>
                    <Badge variant={item.status ? 'success' : 'secondary'}>
                      {item.status ? tCommon('statusActive') : tCommon('statusInactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>{shortDateTime(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={!canEdit} onSelect={() => router.push(`/${locale}/access/instances/${instanceId}/sub-instances/${item.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />{tCommon('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!canDelete} onClick={() => setItemToDelete(item)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />{tCommon('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('dialog.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('dialog.deleteSubInstanceConfirm_part1')}
                    <strong>{itemToDelete?.subInstanceName}</strong>
                    {t('dialog.deleteSubInstanceConfirm_part2')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {t('dialog.deleteConfirmAction')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
