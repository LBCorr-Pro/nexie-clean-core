// src/app/[locale]/(app)/companies/components/CompanyListClient.tsx
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building, Loader2, PlusCircle, Search, MoreVertical, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useFormatters } from '@/hooks/use-formatters';
import { useNxCompanyManagement } from '@/hooks/use-nx-company-management';
import { Company } from '@/app/[locale]/(app)/companies/types';
import { AccessDenied } from '@/components/ui/access-denied';
import { Skeleton } from '@/components/ui/skeleton';

type SortKey = 'companyName' | 'legalName' | 'createdAt';

export function CompanyListClient() {
  const t = useTranslations('companyManagement');
  const tCommon = useTranslations('common');
  const { shortDateTime } = useFormatters();
  
  const { 
    companies, 
    isLoading, 
    error, 
    permissions,
    handleDeleteCompany,
    locale,
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort
  } = useNxCompanyManagement();

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const confirmDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    const success = await handleDeleteCompany(companyToDelete.id);
    if (success) {
      setCompanyToDelete(null);
    }
    setIsDeleting(false);
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  // CORREÇÃO: Usa a variável `error` do hook, que já inclui a mensagem de permissão.
  if (error) {
    return <AccessDenied message={error} />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="section-title !border-none !pb-0">
                <Building className="section-title-icon" />
                {t('title')}
              </CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            <Button asChild className="shrink-0 w-full md:w-auto" disabled={!permissions.canCreate}>
              <Link href={`/${locale}/companies/create`}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:w-1/2 lg:w-1/3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><Button variant="ghost" onClick={() => handleSort('companyName')}>{t('tableHeaders.tradeName')}{sortConfig.key === 'companyName' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => handleSort('legalName')}>{t('tableHeaders.legalName')}{sortConfig.key === 'legalName' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                        <TableHead>{t('tableHeaders.cnpj')}</TableHead>
                        <TableHead>{t('tableHeaders.status')}</TableHead>
                        <TableHead><Button variant="ghost" onClick={() => handleSort('createdAt')}>{t('tableHeaders.createdAt')}{sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}</Button></TableHead>
                        <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{searchTerm ? t('noCompaniesFound') : t('noCompaniesCreated')}</TableCell></TableRow>
                      ) : (
                        companies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.companyName || "N/A"}</TableCell>
                            <TableCell>{company.legalName || "N/A"}</TableCell>
                            <TableCell>{company.cnpj || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={company.status === false ? "secondary" : "success"}>
                                {company.status === false ? t('inactive') : t('active')}
                              </Badge>
                            </TableCell>
                            <TableCell>{company.createdAt ? shortDateTime(company.createdAt) : 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">{t('actions.openMenu')}</span><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild disabled={!permissions.canEdit}>
                                    <Link href={`/${locale}/companies/company/${company.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" /><span>{t('actions.edit')}</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setCompanyToDelete(company)} disabled={!permissions.canDelete} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /><span>{t('actions.delete')}</span>
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
        </CardContent>
        {companies.length > 0 && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">{t('totalCompanies', { count: companies.length })}</p>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialog.deleteConfirmDescription', { companyName: companyToDelete?.companyName || companyToDelete?.legalName || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
             {isDeleting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null} {isDeleting ? tCommon('deleting') : t('dialog.deleteConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
