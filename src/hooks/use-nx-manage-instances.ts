// src/hooks/use-nx-manage-instances.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions'; 
import { refs } from '@/lib/firestore-refs';
import type { Instance } from '../app/[locale]/(app)/access/instances/types';
import type { Plan } from '../app/[locale]/(app)/settings/plans/types';
import { useToast } from '@/hooks/nx-use-toast';

type SortKey = 'instanceName' | 'instanceType' | 'planId' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const convertInstanceTimestamps = (instance: any): Instance => ({
  ...instance,
  createdAt: instance.createdAt instanceof Timestamp ? instance.createdAt.toDate() : instance.createdAt,
  updatedAt: instance.updatedAt instanceof Timestamp ? instance.updatedAt.toDate() : instance.updatedAt,
});

export function useNxManageInstances() {
  const t = useTranslations('instanceManagement');
  const { toast } = useToast();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const [instances, setInstances] = useState<Instance[] | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

  const permissions = useMemo(() => ({
    canView: hasPermission('master.instance.view_all'),
    canCreate: hasPermission('master.instance.create'),
    canEdit: hasPermission('master.instance.edit_details'),
    canDelete: hasPermission('master.instance.delete'),
  }), [hasPermission]);

  useEffect(() => {
    if (!permissions.canView) {
      return;
    }

    const instancesQuery = query(refs.instances(), orderBy(sortConfig.key, sortConfig.direction));
    
    const unsubInstances = onSnapshot(instancesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => convertInstanceTimestamps({ id: doc.id, ...doc.data() }));
      setInstances(data);
      setError(null);
    }, (err) => {
      console.error("Error fetching instances:", err);
      const errorMessage = t('toasts.loadInstancesError');
      setError(errorMessage);
      setInstances([]);
      toast({ title: t('toasts.loadInstancesError'), variant: 'destructive' });
    });

    return () => unsubInstances();
  }, [permissions.canView, sortConfig, t, toast]);

  useEffect(() => {
    if (!permissions.canView) {
      return;
    }

    const plansQuery = query(refs.master.plans(), orderBy('order', 'asc'));

    const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Plan));
      setPlans(plansData);
    }, (err) => {
      console.error("Error fetching plans:", err);
      setError(t('toasts.loadPlansError'));
      setPlans([]);
      toast({ title: t('toasts.loadPlansError'), variant: 'destructive' });
    });

    return () => unsubPlans();
  }, [permissions.canView, t, toast]);

  const handleSort = useCallback((key: SortKey) => {
    setInstances(null);
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const visibleInstances = useMemo(() => {
    if (!permissions.canView) return [];
    
    const instancesToShow = instances || [];
    if (!searchTerm) return instancesToShow;

    return instancesToShow.filter(instance => 
        instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instances, searchTerm, permissions.canView]);

  const plansMap = useMemo(() => new Map((plans || []).map(p => [p.id, p.name])), [plans]);

  const isLoading = useMemo(() => isLoadingPermissions || (permissions.canView && (instances === null || plans === null)), [isLoadingPermissions, permissions.canView, instances, plans]);

  const finalError = useMemo(() => {
      if (!isLoadingPermissions && !permissions.canView) {
          return t('errors.accessDenied');
      }
      return error;
  }, [isLoadingPermissions, permissions.canView, error, t]);
  
  return {
    instances: visibleInstances,
    plansMap,
    isLoading,
    error: finalError,
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort,
    permissions
  };
}
