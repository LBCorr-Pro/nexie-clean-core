
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import type { Plan } from '@/app/[locale]/(app)/settings/plans/types';

const PlanEditSchema = z.object({
  name: z.string().min(3, "Nome do plano é obrigatório."),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'legacy']),
  order: z.coerce.number(),
});

type PlanEditData = z.infer<typeof PlanEditSchema>;

export function useNxPlanEditor() {
  const t = useTranslations('plans.edit');
  const tToasts = useTranslations('plans.toasts');
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string | undefined;
  const locale = params.locale as string;

  const { toast } = useToast();
  const { actingAsInstanceId, subInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = useMemo(() => {
    if (subInstanceId) return hasPermission('instance.plans.manage'); // CORRIGIDO: sub-instância usa a permissão da instância
    if (actingAsInstanceId) return hasPermission('instance.plans.manage');
    return hasPermission('master.plans.manage');
  }, [hasPermission, actingAsInstanceId, subInstanceId]);

  const planRef = useMemo(() => {
    if (!planId) return null;
    if (actingAsInstanceId && subInstanceId) return refs.subinstance.planDoc(actingAsInstanceId, subInstanceId, planId);
    if (actingAsInstanceId) return refs.instance.planDoc(actingAsInstanceId, planId);
    return refs.master.planDoc(planId);
  }, [planId, actingAsInstanceId, subInstanceId]);

  const form = useForm<PlanEditData>({
    resolver: zodResolver(PlanEditSchema),
  });

  const loadPlan = useCallback(async () => {
    if (!planRef || !canManage) {
        if(!isLoadingPermissions && !canManage) {
            toast({ title: 'Acesso Negado', description: 'Você não tem permissão para editar planos.', variant: 'destructive' });
            router.push(`/${locale}/settings/plans`);
        }
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const docSnap = await getDoc(planRef);
      if (docSnap.exists()) {
        const planData = { id: docSnap.id, ...(docSnap.data() || {}) } as Plan;
        setPlan(planData);
        form.reset(planData);
      } else {
        toast({ title: tToasts('loadErrorTitle'), description: tToasts('planNotFound'), variant: 'destructive' });
        router.push(`/${locale}/settings/plans`);
      }
    } catch (error) {
      toast({ title: tToasts('loadErrorTitle'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [planRef, canManage, isLoadingPermissions, form, toast, router, locale, tToasts]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const onUpdate = async (data: PlanEditData) => {
    if (!planRef || !canManage) return;

    setIsSaving(true);
    try {
      await updateDoc(planRef, { ...data, updatedAt: serverTimestamp() });
      toast({ title: tToasts('updateSuccessTitle') });
    } catch (error) {
      toast({ title: tToasts('updateErrorTitle'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return { form, plan, isLoading: isLoading || isLoadingPermissions, isSaving, onUpdate, loadPlan, canManage };
}
