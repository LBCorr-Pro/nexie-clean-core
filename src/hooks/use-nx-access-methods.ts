// src/hooks/use-nx-access-methods.ts
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serverTimestamp, getDoc, setDoc, DocumentReference } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from "next/navigation";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';

const AccessMethodsSchema = z.object({
  allowInvitation: z.boolean().default(false),
  publicRegistrationBehavior: z.enum(['block', 'redirect', 'auto_create']).default('block'),
  allowEmailLogin: z.boolean().default(true),
  allowPhoneLogin: z.boolean().default(false).optional(),
  allowGoogleLogin: z.boolean().default(false),
  allowAppleLogin: z.boolean().default(false).optional(),
  allowFacebookLogin: z.boolean().default(false).optional(),
  customized: z.boolean().optional(),
});

type AccessMethodsFormData = z.infer<typeof AccessMethodsSchema>;

export function useNxAccessMethods() {
  const t = useTranslations('accessMethods');
  const { toast } = useToast();
  const { actingAsInstanceId, actingAsInstanceName, isActingAsMaster } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const subInstanceId = useSearchParams().get('subInstanceId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [settingsSource, setSettingsSource] = useState<'master' | 'instance' | 'subinstance' | 'default'>('default');
  const [isCustom, setIsCustom] = useState(false);
  
  const contextType = useMemo(() => {
    if (subInstanceId && actingAsInstanceId) return 'subinstance';
    if (actingAsInstanceId) return 'instance';
    return 'master';
  }, [subInstanceId, actingAsInstanceId]);

  const canEdit = hasPermission(contextType === 'master' ? 'master.settings.access_methods.edit' : 'instance.settings.access_methods.edit');

  const form = useForm<AccessMethodsFormData>({
    resolver: zodResolver(AccessMethodsSchema),
    defaultValues: { allowEmailLogin: true, publicRegistrationBehavior: 'block' },
  });

  const getDocRef = useCallback((context: 'master' | 'instance' | 'subinstance'): DocumentReference => {
    if (context === 'subinstance' && actingAsInstanceId && subInstanceId) {
      return refs.subinstance.accessMethodsSettingsDoc(actingAsInstanceId, subInstanceId);
    }
    if (context === 'instance' && actingAsInstanceId) {
      return refs.instance.accessMethodsSettingsDoc(actingAsInstanceId);
    }
    return refs.master.accessMethodsSettingsDoc();
  }, [actingAsInstanceId, subInstanceId]);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const masterDocRef = getDocRef('master');
      const masterSnap = await getDoc(masterDocRef);
      const masterData = masterSnap.exists() ? masterSnap.data() : { allowEmailLogin: true, publicRegistrationBehavior: 'block' };

      let dataToLoad: any = masterData;
      let source: typeof settingsSource = 'master';
      
      if (contextType === 'instance') {
        const instanceDocRef = getDocRef('instance');
        const instanceSnap = await getDoc(instanceDocRef);
        if (instanceSnap.exists() && instanceSnap.data().customized) {
          dataToLoad = instanceSnap.data();
          source = 'instance';
        } 
      } else if (contextType === 'subinstance') {
         const subInstanceDocRef = getDocRef('subinstance');
         const subInstanceSnap = await getDoc(subInstanceDocRef);
         if (subInstanceSnap.exists() && subInstanceSnap.data().customized) {
            dataToLoad = subInstanceSnap.data();
            source = 'subinstance';
         } else {
            const instanceDocRef = getDocRef('instance');
            const instanceSnap = await getDoc(instanceDocRef);
            if (instanceSnap.exists() && instanceSnap.data().customized) {
              dataToLoad = instanceSnap.data();
              source = 'instance';
            } 
         }
      }

      form.reset(dataToLoad);
      setSettingsSource(source);
      setIsCustom(dataToLoad?.customized || false);

    } catch (error) {
      console.error("Error loading settings:", error);
      toast({ title: t('toasts.loadError'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [contextType, getDocRef, form, toast, t]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const onSave = async (data: AccessMethodsFormData) => {
    setIsSaving(true);
    const docRef = getDocRef(contextType);
    const dataToSave = {
      ...data,
      customized: contextType !== 'master',
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: t('toasts.saveSuccess') });
      if (contextType !== 'master') {
        setIsCustom(true);
        setSettingsSource(contextType);
      }
      form.reset(dataToSave as any); // Re-sync form with saved data
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: t('toasts.saveError'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const onRevert = async () => {
    if (contextType === 'master') return;
    setIsReverting(true);

    const targetDocRef = getDocRef(contextType);
    try {
        await setDoc(targetDocRef, { customized: false, updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: t('toasts.revertSuccess') });
        await loadSettings();
    } catch (error) {
        console.error("Error reverting settings:", error);
        toast({ title: t('toasts.revertError'), variant: "destructive" });
    } finally {
        setIsReverting(false);
    }
  };

  const pageContextName = useMemo(() => {
      if (contextType === 'subinstance') return `Sub: ${subInstanceId?.substring(0, 6)}...`;
      if (contextType === 'instance') return actingAsInstanceName || 'Instância';
      return 'Master';
  }, [contextType, subInstanceId, actingAsInstanceName]);
  
  const sourceName = settingsSource === 'master' ? t('sourceNameMaster') : t('sourceNameInstance');

  return {
    form,
    isLoading,
    isSaving,
    isReverting,
    settingsSource,
    isCustom,
    canEdit,
    isLoadingPermissions,
    contextType,
    pageContextName,
    sourceName,
    onSave,
    onRevert,
  };
}
