// src/hooks/use-nx-instance-form.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { getDocs, query, where, limit, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useTranslations } from 'next-intl';
import { refs } from '@/lib/firestore-refs';
import { useDebounce } from '@/hooks/use-debounce';
import { translateToEnglish } from '@/ai/flows/translate-to-english-flow';
import { slugify } from '@/lib/utils';
import { createInstanceAction, createSubInstanceAction } from '@/lib/actions/nx-instance-actions';
import type { Plan } from '@/app/[locale]/(app)/settings/plans/types';
import { useInstanceData } from './use-instance-data';

// --- SCHEMA & TYPES ---
const getInstanceFormSchema = (t: (key: string) => string, isSubInstance: boolean) => z.object({
  instanceName: z.string().min(3, t('validation.nameMin')),
  slug: z.string().min(3, t('validation.slugMin')).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugInvalid')),
  instanceType: z.enum(["default", "dev", "master"]).optional(),
  planId: z.string().nullable().optional(),
  status: z.boolean().default(true),
  // Campos específicos de sub-instância
  parentId: z.string().optional().nullable(),
});

export type InstanceFormData = z.infer<ReturnType<typeof getInstanceFormSchema>>;
export const NO_PLAN_VALUE = '_NONE_';

// --- HOOK ---
export function useNxInstanceForm() {
  const t = useTranslations('instanceManagement');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const parentIdFromUrl = params.instanceId as string | undefined;

  const { toast } = useToast();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  
  const { instance: parentInstance } = useInstanceData(parentIdFromUrl || null, null);

  const [isSaving, setIsSaving] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  const isSubInstanceMode = !!parentIdFromUrl;
  
  const canCreate = hasPermission(isSubInstanceMode ? 'instance.subinstances.manage' : 'master.instance.create');

  const instanceFormSchema = useMemo(() => getInstanceFormSchema(t, isSubInstanceMode), [t, isSubInstanceMode]);

  const form = useForm<InstanceFormData>({
    resolver: zodResolver(instanceFormSchema),
    defaultValues: {
      instanceName: '',
      slug: '',
      instanceType: 'default',
      planId: NO_PLAN_VALUE,
      status: true,
      parentId: parentIdFromUrl || null,
    },
    mode: 'onBlur',
  });

  const watchedSlug = useWatch({ control: form.control, name: 'slug' });
  const watchedName = useWatch({ control: form.control, name: 'instanceName' });
  const debouncedSlug = useDebounce(watchedSlug, 500);

  // Fetch available plans (only for main instances)
  useEffect(() => {
    if (isSubInstanceMode) return;
    const plansQuery = query(refs.master.plans(), where("status", "==", "active"));
    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
      setAvailablePlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan)));
    });
    return () => unsubscribe();
  }, [isSubInstanceMode]);

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (!debouncedSlug || debouncedSlug.length < 3) {
        form.clearErrors('slug');
        return;
      }
      setIsCheckingSlug(true);
      const collectionRef = isSubInstanceMode && parentIdFromUrl 
        ? refs.instance.subinstances(parentIdFromUrl) 
        : refs.instances();

      const q = query(collectionRef, where('slug', '==', debouncedSlug), limit(1));
      const slugSnapshot = await getDocs(q);
      if (!slugSnapshot.empty) {
        form.setError("slug", { type: "manual", message: t('slugInUse') });
      } else {
        form.clearErrors('slug');
      }
      setIsCheckingSlug(false);
    };
    checkSlug();
  }, [debouncedSlug, form, t, isSubInstanceMode, parentIdFromUrl]);

  // Auto-generate slug
  useEffect(() => {
    if (!watchedName || watchedName.trim().length < 3 || form.formState.dirtyFields.slug) return;
    const slugTimeout = setTimeout(async () => {
      setIsGeneratingSlug(true);
      const result = await translateToEnglish({ text: watchedName });
      if (result.translatedText) {
        form.setValue('slug', slugify(result.translatedText), { shouldDirty: true, shouldValidate: true });
      }
      setIsGeneratingSlug(false);
    }, 600);
    return () => clearTimeout(slugTimeout);
  }, [watchedName, form]);

  const onSubmit = async (data: InstanceFormData) => {
    if (!canCreate) {
      toast({ title: t('create.toastErrorTitle'), description: t('create.permissionError'), variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    
    const action = isSubInstanceMode ? createSubInstanceAction : createInstanceAction;
    
    const result = await action({
      ...data,
      planId: data.planId === NO_PLAN_VALUE ? null : data.planId,
    } as any);

    if (result.success && result.slug) {
      toast({ 
        title: isSubInstanceMode ? t('createSubInstance.toastSuccessTitle') : t('create.toastSuccessTitle'), 
        description: t(isSubInstanceMode ? 'createSubInstance.toastSuccessDesc' : 'create.toastSuccessDesc', { instanceName: data.instanceName })
      });
      const redirectUrl = isSubInstanceMode ? `/${locale}/access/instances/edit/${parentIdFromUrl}?tab=subinstances` : `/${locale}/access/instances`;
      router.push(redirectUrl);
    } else if (result.error === 'slug-in-use') {
        form.setError("slug", { type: "manual", message: t('slugInUse') });
        toast({ title: t('create.toastErrorTitle'), description: t('slugInUse'), variant: 'destructive' });
    }
    else {
      toast({ title: t('create.toastErrorTitle'), description: result.error, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  return {
    form,
    onSubmit,
    isLoading: isLoadingPermissions,
    isSaving,
    isCheckingSlug,
    isGeneratingSlug,
    canCreate,
    isSubInstanceMode,
    parentInstanceName: parentInstance?.instanceName,
    availablePlans,
    locale
  };
}
