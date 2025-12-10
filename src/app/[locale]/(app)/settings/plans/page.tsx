
// src/app/[locale]/(app)/settings/plans/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AccessDenied } from '@/components/ui/access-denied';
import { useNxPlans } from '@/hooks/use-nx-plans';
import type { Plan } from './types';
import { useTranslations } from 'next-intl';

export default function NxManagePlansPage() {
  const t = useTranslations('plans');
  const tCommon = useTranslations('common');

  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const params = useParams();
  const locale = params.locale as string;
  
  const { hasPermission } = useUserPermissions();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { plans, isLoading, isDeleting, deletePlan } = useNxPlans();

  // Permissão corrigida. A mais próxima para gerenciar templates globais.
  const canManagePlans = hasPermission('master.access_levels.edit');

  const handleDelete = async () => {
    if (!planToDelete) return;
    const success = await deletePlan(planToDelete.id);
    if (success) {
      setPlanToDelete(null);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(plan =>
      (plan.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (plan.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  // Verifica se o contexto é Master Global
  if (!isActingAsMaster || actingAsInstanceId) {
    return (
        <Card>
            <CardHeader><CardTitle>{t('accessDenied.title')}</CardTitle></CardHeader>
            <CardContent><p>{t('accessDenied.message')}</p></CardContent>
        </Card>
    );
  }
  
  // Verifica se o usuário tem a permissão necessária
  if (!canManagePlans) {
    return <AccessDenied />;
  }

  const getStatusBadgeVariant = (status: 'active' | 'inactive' | 'legacy') => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'legacy': return 'outline';
      default: return 'default';
    }
  };

  const getStatusTranslation = (status: 'active' | 'inactive' | 'legacy') => {
    return t(`statusBadge.${status}`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="section-title !border-none !pb-0">
                <CreditCard className="section-title-icon" />
                {t('pageTitle')}
              </CardTitle>
              <CardDescription>{t('pageDescription')}</CardDescription>
            </div>
            <Button asChild className="shrink-0 w-full md:w-auto">
              <Link href={`/${locale}/settings/plans/create`}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('createNew')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="border rounded-md">
            {isLoading ? (
              <div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : filteredPlans.length === 0 ? (
               <p className="p-6 text-center text-sm text-muted-foreground">{tCommon('noResults')}</p>
            ) : (
                 <Table>
                    <TableHeader><TableRow>
                        <TableHead>{t('table.name')}</TableHead>
                        <TableHead>{t('table.status')}</TableHead>
                        <TableHead>{t('table.order')}</TableHead>
                        <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                        {filteredPlans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell><Badge variant={getStatusBadgeVariant(plan.status)}>{getStatusTranslation(plan.status)}</Badge></TableCell>
                                <TableCell>{plan.order}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button asChild variant="outline" size="sm"><Link href={`/${locale}/settings/plans/plan/${plan.id}/edit`}><Edit className="mr-1 h-3 w-3"/>{tCommon('edit')}</Link></Button>
                                    <Button variant="destructive" size="sm" onClick={() => setPlanToDelete(plan)}><Trash2 className="mr-1 h-3 w-3"/>{tCommon('delete')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description', { planName: planToDelete?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
