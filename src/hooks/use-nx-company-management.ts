// src/hooks/use-nx-company-management.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import { useUserPermissions } from './use-user-permissions';
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs';
import { Company } from '@/app/[locale]/(app)/companies/types';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';

type SortKey = 'companyName' | 'legalName' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const convertCompanyTimestamps = (company: any): Company => ({
  ...company,
  createdAt: company.createdAt instanceof Timestamp ? company.createdAt.toDate() : company.createdAt,
  updatedAt: company.updatedAt instanceof Timestamp ? company.updatedAt.toDate() : company.updatedAt,
});

export function useNxCompanyManagement() {
  const t = useTranslations('companyManagement');
  const params = useParams();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { actingAsInstanceId } = useInstanceActingContext();

  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

  const locale = params.locale as string;

  const permissions = useMemo(() => ({
    canView: hasPermission(actingAsInstanceId ? 'instance.companies.view' : 'master.companies.view'),
    canCreate: hasPermission(actingAsInstanceId ? 'instance.companies.create' : 'master.companies.create'),
    canEdit: hasPermission(actingAsInstanceId ? 'instance.companies.edit' : 'master.companies.edit'),
    canDelete: hasPermission(actingAsInstanceId ? 'instance.companies.delete' : 'master.companies.delete'),
  }), [hasPermission, actingAsInstanceId]);

  useEffect(() => {
    if (!permissions.canView) {
      return;
    }

    // Use `actingAsInstanceId` to determine the correct collection reference.
    const companiesCollectionRef = actingAsInstanceId 
        ? refs.instance.companies(actingAsInstanceId)
        : refs.master.companies();

    const companiesQuery = query(companiesCollectionRef, orderBy(sortConfig.key, sortConfig.direction));
    
    const unsubscribe = onSnapshot(companiesQuery, 
      (snapshot) => {
        const data: Company[] = snapshot.docs.map(doc => convertCompanyTimestamps({ id: doc.id, ...doc.data() }));
        setCompanies(data);
        setFetchError(null);
      },
      (err) => {
        console.error("Error fetching companies:", err);
        const errorMessage = t('errors.fetch');
        setFetchError(errorMessage);
        setCompanies([]);
        toast.error(errorMessage);
      }
    );

    return () => unsubscribe();
  }, [permissions.canView, sortConfig, actingAsInstanceId, t]);

  const handleDeleteCompany = async (companyId: string): Promise<boolean> => {
    if (!permissions.canDelete) {
      toast.error(t('errors.deletePermission'));
      return false;
    }
    const toastId = toast.loading(t('deleting'));
    try {
        const companiesCollectionRef = actingAsInstanceId 
            ? refs.instance.companies(actingAsInstanceId)
            : refs.master.companies();
        
        const companyRef = doc(companiesCollectionRef, companyId);
        await deleteDoc(companyRef);
        toast.success(t('deleteSuccess'), { id: toastId });
        return true;
    } catch (e: any) {
        console.error("Error deleting company:", e);
        toast.error(t('errors.delete', { error: e.message }), { id: toastId });
        return false;
    }
  };

  const handleSort = useCallback((key: SortKey) => {
    setCompanies(null);
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const visibleCompanies = useMemo(() => {
    if (!permissions.canView) return [];
    
    const companiesToShow = companies || [];
    if (!searchTerm) return companiesToShow;

    return companiesToShow.filter(company => 
        company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj?.includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm, permissions.canView]);

  const isLoading = useMemo(() => isLoadingPermissions || (permissions.canView && companies === null), [isLoadingPermissions, permissions.canView, companies]);

  const error = useMemo(() => {
      if (!isLoadingPermissions && !permissions.canView) {
          return t('errors.accessDenied');
      }
      return fetchError;
  }, [isLoadingPermissions, permissions.canView, fetchError, t]);
  
  return {
    companies: visibleCompanies,
    isLoading,
    error,
    permissions,
    handleDeleteCompany,
    locale,
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort,
  };
}
