
"use client";

import { useState, useEffect } from 'react';
import { onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { refs } from '@/lib/firestore-refs';
import type { Plan } from '@/app/[locale]/(app)/settings/plans/types';
import { useTranslations } from 'next-intl';

export function useNxPlans() {
  const t = useTranslations('plans.toasts');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();

  useEffect(() => {
    if (!isActingAsMaster || actingAsInstanceId) {
      setIsLoading(false);
      return;
    }

    const q = query(refs.master.plans(), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setPlans(fetchedPlans);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching plans: ", error);
      toast({ title: t('loadError'), variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isActingAsMaster, actingAsInstanceId, toast, t]);

  const deletePlan = async (planId: string) => {
    setIsDeleting(true);
    try {
      // CORREÇÃO: Usa a coleção 'plans' e a função 'doc' para obter a referência do documento.
      const planDocRef = doc(refs.master.plans(), planId);
      await deleteDoc(planDocRef);
      toast({ title: t('deleteSuccess') });
      return true;
    } catch (error) {
      console.error("Error deleting plan: ", error);
      toast({ title: t('deleteError'), variant: "destructive" });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { plans, isLoading, isDeleting, deletePlan };
}
