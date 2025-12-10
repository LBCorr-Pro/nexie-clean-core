// src/hooks/use-nx-edit-instance-form.ts
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';

import { useToast } from '@/hooks/nx-use-toast';
import { useInstanceData } from '@/hooks/use-instance-data';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { updateInstanceAction } from '@/lib/actions/nx-instance-actions';
import { refs } from '@/lib/firestore-refs';

import type { Plan } from '../app/[locale]/(app)/settings/plans/types';

// O schema de validação do formulário Zod.
const getEditInstanceFormSchema = (t: (key: string) => string) => z.object({
  instanceName: z.string().min(1, t('validation.nameRequired')),
  slug: z.string(), // O slug é somente leitura no formulário
  instanceType: z.enum(["default", "dev", "master"]).optional(),
  planId: z.string().nullable().optional(),
  status: z.boolean(),
});

export type EditInstanceFormValues = z.infer<ReturnType<typeof getEditInstanceFormSchema>>;
export const NO_PLAN_VALUE = '_NONE_';

export function useNxEditInstanceForm() {
  const params = useParams();
  const t = useTranslations('instanceManagement');
  const { toast } = useToast();
  
  // CORREÇÃO: actingAsInstanceId foi removido do hook de contexto para usar o da URL diretamente
  const { subInstanceId } = useInstanceActingContext();
  const instanceIdFromUrl = params.instanceId as string | undefined;

  const { permissions, hasPermission } = useUserPermissions();

  const isSubInstance = !!subInstanceId;
  const currentId = subInstanceId || instanceIdFromUrl;
  const parentId = isSubInstance ? instanceIdFromUrl : null;

  const { instance, loading: isLoadingInstance, error } = useInstanceData(instanceIdFromUrl, subInstanceId);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);

  const formSchema = getEditInstanceFormSchema(t);
  const form = useForm<EditInstanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instanceName: '',
      slug: '',
      status: true,
      planId: NO_PLAN_VALUE,
    },
  });
  
  const { formState: { isSubmitting, dirtyFields } } = form;

  // Busca os planos disponíveis.
  useEffect(() => {
    if (isSubInstance) return;
    const plansQuery = query(refs.master.plans(), where("status", "==", "active"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setAvailablePlans(plansData);
    });
    return () => unsubscribe();
  }, [isSubInstance]);

  // **CORREÇÃO DEFINITIVA:**
  // Usa um useEffect para popular o formulário APENAS quando os dados da instância (instance)
  // forem carregados. Isso resolve a condição de corrida.
  useEffect(() => {
    if (instance) {
      form.reset({
        instanceName: instance.instanceName || '',
        slug: instance.slug || '',
        instanceType: instance.instanceType || 'default',
        planId: instance.planId || NO_PLAN_VALUE,
        status: instance.status !== undefined ? instance.status : true,
      });
    }
  }, [instance, form]);

  const onSubmit = async (data: EditInstanceFormValues) => {
    if (!currentId) return;

    const changedData = Object.keys(dirtyFields).reduce((acc, key) => {
      const typedKey = key as keyof EditInstanceFormValues;
      (acc as any)[typedKey] = data[typedKey];
      return acc;
    }, {} as Partial<EditInstanceFormValues>);

    if (Object.keys(changedData).length === 0) return;

    if ('planId' in changedData) {
      changedData.planId = data.planId === NO_PLAN_VALUE ? null : data.planId;
    }
    
    const result = await updateInstanceAction(
        currentId,
        changedData,
        { isSubInstance, parentId: parentId || undefined }
      );

      if (result.success) {
        toast({ title: t('edit.successTitle') });
        form.reset(form.getValues(), { keepDirty: false });
      } else {
        toast({ variant: 'destructive', title: t('edit.errorTitle'), description: result.error || t('edit.errorDescription') });
      }
  };

  const canEdit = useMemo(() => {
    if (!permissions) return false;
    const requiredPermission = isSubInstance ? 'instance.subinstances.manage' : 'master.instance.edit_details';
    return hasPermission(requiredPermission);
  }, [permissions, isSubInstance, hasPermission]);

  return {
    form,
    onSubmit,
    instance,
    isLoading: isLoadingInstance || isSubmitting,
    canEdit,
    error,
    t,
    isSubInstance,
    availablePlans
  };
}
