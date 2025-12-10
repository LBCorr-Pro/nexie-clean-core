// src/hooks/use-nx-manage-modules.ts
"use client";

import React, { useState } from 'react';
import { useToast } from "@/hooks/nx-use-toast";
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useMenuData, type ManagedModule } from '@/hooks/use-menu-data'; // Atualizado
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { syncModuleFoldersAction } from '@/lib/actions/dev-actions';
import { useTranslations } from 'next-intl';

export const useNxManageModules = () => {
  const t = useTranslations('modules');
  const { toast } = useToast();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  // Atualizado para usar useMenuData
  const { allManagedModules, isLoading: isLoadingModuleConfigs, refetchMenuData } = useMenuData();
  const { isActingAsMaster, actingAsInstanceId, instanceModuleDefinitions } = useInstanceActingContext();

  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingModule, setEditingModule] = useState<ManagedModule | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<ManagedModule | null>(null);

  const permissions = {
    canManage: hasPermission(isActingAsMaster && !actingAsInstanceId ? 'master.modules.edit' : 'instance.modules.manage_status'),
    canCreate: hasPermission('master.modules.create'),
    canDelete: hasPermission('master.modules.delete'),
    canImport: hasPermission('master.modules.import'),
    canView: hasPermission('master.modules.view_definitions'),
  };

  const handleStatusChange = async (moduleId: string, newStatus: boolean) => {
    setIsProcessing(prev => ({ ...prev, [moduleId]: true }));
    
    const docRef = actingAsInstanceId
      ? refs.instance.instanceModuleDefDoc(actingAsInstanceId, moduleId)
      : refs.master.moduleDefinitionDoc(moduleId);

    try {
      const isCustomizing = actingAsInstanceId && !instanceModuleDefinitions.has(moduleId);
      const data = isCustomizing 
        ? { moduleId, status: newStatus, customizedSettings: false, globalModuleDocId: moduleId } 
        : { status: newStatus };

      await (isCustomizing ? setDoc(docRef, data) : updateDoc(docRef, data));

      toast({ title: t('toasts.statusUpdateSuccess') });
      await refetchMenuData();
    } catch (error: any) {
      toast({ title: t('toasts.updateError'), description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  const handleSyncModules = async () => {
    if (!permissions.canImport) {
      toast({ title: t('common.accessDenied.title'), description: t('toasts.syncPermissionError'), variant: "destructive" });
      return;
    }
    setIsSyncing(true);
    const result = await syncModuleFoldersAction();
    if (result.success) {
      toast({ title: t('toasts.syncSuccessTitle'), description: result.message });
      await refetchMenuData();
    } else {
      toast({ title: t('toasts.syncErrorTitle'), description: result.message, variant: "destructive" });
    }
    setIsSyncing(false);
  };

  const openEditForm = (module: ManagedModule) => {
    setEditingModule(module);
    setShowFormDialog(true);
  };

  const handleDelete = async () => {
    if (!moduleToDelete || !permissions.canDelete) return;
    setIsProcessing(prev => ({ ...prev, [moduleToDelete.id]: true }));
    try {
      await deleteDoc(refs.master.moduleDefinitionDoc(moduleToDelete.id));
      toast({ title: t('toasts.deleteSuccess') });
      await refetchMenuData();
    } catch (error: any) {
      toast({ title: t('toasts.deleteError'), description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(prev => ({ ...prev, [moduleToDelete.id]: false }));
      setModuleToDelete(null);
    }
  };

  return {
    isLoading: isLoadingPermissions || isLoadingModuleConfigs,
    isProcessing,
    isSyncing,
    allManagedModules,
    isActingAsMaster: isActingAsMaster && !actingAsInstanceId,
    permissions,
    // Dialog states and handlers
    showFormDialog,
    editingModule,
    moduleToDelete,
    actions: {
      handleStatusChange,
      handleSyncModules,
      handleDelete,
      openEditForm,
      closeEditForm: () => {
        setShowFormDialog(false);
        setEditingModule(null);
      },
      openDeleteDialog: (module: ManagedModule) => setModuleToDelete(module),
      closeDeleteDialog: () => setModuleToDelete(null),
      refetch: refetchMenuData,
    }
  };
};
