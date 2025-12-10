
// src/app/[locale]/(app)/settings/modules/manage/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Importado para obter o locale
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Loader2, MoreVertical } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from '@/components/ui/switch';
import { BackButton } from '@/components/ui/back-button';
import { ModuleFormDialog } from '../components/ModuleFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNxManageModules } from '@/hooks/use-nx-manage-modules';
import { Skeleton } from '@/components/ui/skeleton';

const PageSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4 mt-2" />
    </CardHeader>
    <CardContent>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

export default function ManageModulesPage() {
  const t = useTranslations('modules');
  const commonT = useTranslations('common');
  const params = useParams(); // Obtém os parâmetros da URL
  const locale = params.locale as string; // Extrai o locale

  const {
    isLoading,
    isProcessing,
    isSyncing,
    allManagedModules,
    isActingAsMaster,
    permissions,
    showFormDialog,
    editingModule,
    moduleToDelete,
    actions,
  } = useNxManageModules();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isActingAsMaster && !permissions.canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Icon name="ShieldCheck" className="mr-2 h-6 w-6" />
            {commonT('accessDenied.title')}
          </CardTitle>
        </CardHeader>
        <CardContent><p>{t('permissionDenied')}</p></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="relative">
          <BackButton className="absolute right-6 top-3" />
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2">
            <div>
              <CardTitle className="section-title !border-none !pb-0">
                <Icon name="Package" className="section-title-icon" />
                {t('pageTitle')}
              </CardTitle>
              <CardDescription>{t('pageDescription')}</CardDescription>
            </div>
            {isActingAsMaster && (
              <Button onClick={actions.handleSyncModules} variant="outline" disabled={isSyncing || !permissions.canImport}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon name="GitBranch" className="mr-2 h-4 w-4" />}
                {t('syncButton')}
              </Button>
            )}
          </div>
          {isActingAsMaster && (
            <Alert variant="info" className="mt-4">
              <Icon name="Globe" className="h-4 w-4" />
              <AlertTitle>{t('masterContextAlertTitle')}</AlertTitle>
              <AlertDescription>{t('masterContextAlertDescription')}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.header.module')}</TableHead>
                  <TableHead>{t('table.header.registration')}</TableHead>
                  <TableHead>{t('table.header.globalStatus')}</TableHead>
                  <TableHead>{t('table.header.instanceStatus')}</TableHead>
                  <TableHead className="text-right">{t('table.header.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allManagedModules.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('table.body.noModules')}</TableCell></TableRow>
                ) : (
                  allManagedModules.map(module => {
                    const isProcessingThis = isProcessing[module.id];
                    return (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Icon name={module.icon as any} className="h-6 w-6 text-muted-foreground" />
                            <div>
                              <div>{module.name}</div>
                              <p className="text-xs text-muted-foreground">{module.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={module.isRegistered ? 'success' : 'outline'}>
                            {module.isRegistered ? t('table.body.registered') : t('table.body.notRegistered')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={module.status ? 'default' : 'secondary'}>
                            {module.status ? t('table.body.active') : t('table.body.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isActingAsMaster ? (
                            <Badge variant="outline">{t('table.body.notApplicable')}</Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={module.instanceStatus ?? module.status}
                                onCheckedChange={(checked) => actions.handleStatusChange(module.id, checked)}
                                disabled={!permissions.canManage || isProcessingThis || !module.isRegistered}
                                aria-label={`Status do módulo ${module.name}`}
                              />
                              {isProcessingThis && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('table.body.openMenu')}</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!module.isRegistered ? (
                                <DropdownMenuItem onClick={() => actions.openEditForm(module)} disabled={!permissions.canCreate}>
                                  <Icon name="Link" className="mr-2 h-4 w-4" /> {t('actions.register')}
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => actions.openEditForm(module)} disabled={!permissions.canManage || !isActingAsMaster}>
                                    <Icon name="Edit" className="mr-2 h-4 w-4" /> {t('actions.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/${locale}/settings/modules/${module.id}`}>
                                      <Icon name="Settings" className="mr-2 h-4 w-4" /> {t('actions.configure')}
                                    </Link>
                                  </DropdownMenuItem>
                                  {isActingAsMaster && <DropdownMenuSeparator />}
                                  {isActingAsMaster && (
                                      <DropdownMenuItem className="text-destructive" onClick={() => actions.openDeleteDialog(module)} disabled={!permissions.canDelete}>
                                          <Icon name="Trash2" className="mr-2 h-4 w-4" /> {t('actions.delete')}
                                      </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showFormDialog && (
        <ModuleFormDialog
          isOpen={showFormDialog}
          onClose={actions.closeEditForm}
          moduleData={editingModule}
          onSuccess={() => {
            actions.closeEditForm();
            actions.refetch();
          }}
        />
      )}

      <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && actions.closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description', { moduleName: moduleToDelete?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={actions.closeDeleteDialog} disabled={isProcessing[moduleToDelete?.id || '']}>
              {commonT('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={actions.handleDelete} disabled={isProcessing[moduleToDelete?.id || '']} className="bg-destructive hover:bg-destructive/90">
              {isProcessing[moduleToDelete?.id || ''] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
