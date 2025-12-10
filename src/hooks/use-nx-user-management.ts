// src/hooks/use-nx-user-management.ts
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';

import { setInstanceUserRole } from '@/lib/actions/user-actions';
import { useUserPermissions } from './use-user-permissions';

interface UseNxUserManagementProps {
  instanceId: string;
  userId?: string; // CORREÇÃO: userId agora é opcional
}

export function useNxUserManagement({ instanceId, userId }: UseNxUserManagementProps) {
  const { toast } = useToast();
  const t = useTranslations('userManagement');
  const [isLoading, setIsLoading] = useState(false);
  
  const { hasPermission } = useUserPermissions();

  // A permissão para gerenciar usuários é baseada na instância, não em um usuário específico.
  const canManageUsers = hasPermission('instance.users.manage');

  const handleRoleChange = async (newRole: string) => {
    // Ação só é permitida se houver um userId
    if (!userId) {
      console.error("handleRoleChange called without a userId.");
      return;
    }

    if (!canManageUsers) {
      toast({ variant: 'destructive', title: t('errors.permissionDenied') });
      return;
    }

    setIsLoading(true);
    const result = await setInstanceUserRole(instanceId, userId, newRole);
    setIsLoading(false);

    if (result.success) {
      toast({ title: t('toast.roleUpdateSuccess') });
    } else {
      toast({ variant: 'destructive', title: t('toast.roleUpdateError'), description: result.error });
    }
  };

  return {
    isLoading,
    canManageUsers,
    handleRoleChange,
  };
}
