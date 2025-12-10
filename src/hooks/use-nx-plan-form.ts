
"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';

export function useNxPlanForm() {
  const t = useTranslations('plans');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const PlanFormSchema = z.object({
    name: z.string().min(3, t('create.form.errors.nameRequired')),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive', 'legacy']).default('active'),
    order: z.coerce.number().default(0),
  });

  type PlanFormData = z.infer<typeof PlanFormSchema>;

  const form = useForm<PlanFormData>({
    resolver: zodResolver(PlanFormSchema),
    defaultValues: { name: "", description: "", status: 'active', order: 0 },
  });

  const onSubmit = async (data: PlanFormData) => {
    setIsSaving(true);
    try {
      const newPlanRef = await addDoc(refs.master.plans(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: t('toasts.createSuccessTitle'),
        description: t('toasts.createSuccessDescription', { planName: data.name })
      });
      router.push(`/${locale}/settings/plans/plan/${newPlanRef.id}/edit`);
    } catch (error: any) {
      toast({
        title: t('toasts.createErrorTitle'),
        description: error.message,
        variant: "destructive"
      });
      setIsSaving(false);
    }
  };

  return { form, onSubmit, isSaving };
}
