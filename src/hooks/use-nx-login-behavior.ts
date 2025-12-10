
// src/hooks/use-nx-login-behavior.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serverTimestamp, getDoc, setDoc, getDocs, query, limit, CollectionReference, DocumentReference } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from "next/navigation";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';

const LoginBehaviorSchema = z.object({
  loginPageActive: z.boolean().default(true),
  fallbackPageUrl: z.string().optional().default("/dashboard"),
  customized: z.boolean().optional(),
});

type LoginBehaviorFormData = z.infer<typeof LoginBehaviorSchema>;
interface MenuItemForSelect { menuKey: string; displayName: string; originalHref: string; }

export function useNxLoginBehavior() {
  const t = useTranslations('loginBehavior');
  const { toast } = useToast();
  const { actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const subInstanceId = useSearchParams().get('subInstanceId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePages, setAvailablePages] = useState<MenuItemForSelect[]>([]);
  const [contextAlert, setContextAlert] = useState({ title: '', description: '' });
  const [isCustom, setIsCustom] = useState(false);

  const contextType = useMemo(() => {
    if (subInstanceId && actingAsInstanceId) return 'subinstance';
    if (actingAsInstanceId) return 'instance';
    return 'master';
  }, [subInstanceId, actingAsInstanceId]);
  
  const editPerm: PermissionId = useMemo(() => contextType === 'master' ? 'master.settings.access_methods.edit' : 'instance.settings.access_methods.edit', [contextType]);
  const canEdit = hasPermission(editPerm);

  const form = useForm<LoginBehaviorFormData>({
    resolver: zodResolver(LoginBehaviorSchema),
    defaultValues: { loginPageActive: true, fallbackPageUrl: "/dashboard" },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        let settingsRef: DocumentReference;
        let parentSettingsRef: DocumentReference | null = null;

        if (contextType === 'subinstance' && actingAsInstanceId && subInstanceId) {
            settingsRef = refs.subinstance.loginPageBehaviorSettingsDoc(actingAsInstanceId, subInstanceId);
            parentSettingsRef = refs.instance.loginPageBehaviorSettingsDoc(actingAsInstanceId);
        } else if (contextType === 'instance' && actingAsInstanceId) {
            settingsRef = refs.instance.loginPageBehaviorSettingsDoc(actingAsInstanceId);
            parentSettingsRef = refs.master.loginPageBehaviorSettingsDoc();
        } else {
            settingsRef = refs.master.loginPageBehaviorSettingsDoc();
        }

        const docSnap = await getDoc(settingsRef);
        let data = docSnap.exists() && docSnap.data().customized ? docSnap.data() : null;
        setIsCustom(!!data);

        if (!data) {
            let finalData = null;
            if (parentSettingsRef) {
                const parentDocSnap = await getDoc(parentSettingsRef);
                if (parentDocSnap.exists() && parentDocSnap.data().customized) finalData = parentDocSnap.data();
            }
            if (!finalData) {
                const masterDocSnap = await getDoc(refs.master.loginPageBehaviorSettingsDoc());
                if (masterDocSnap.exists()) finalData = masterDocSnap.data();
            }
            form.reset(finalData || { loginPageActive: true, fallbackPageUrl: "/dashboard" });
        } else {
             form.reset(data);
        }
        
        // Set context alert
        if(isCustom) {
            setContextAlert({ title: t(`contextAlert.${contextType}Title`), description: t(`contextAlert.${contextType}Description`) });
        } else {
            const inheritedFrom = contextType === 'subinstance' ? 'Instance' : 'Master';
            setContextAlert({ title: t(`contextAlert.inheritingFrom${inheritedFrom}Title`), description: t('contextAlert.saveToCustomizeDescription') });
        }

        // Fetch menu items
        const itemsRef = refs.master.menuItems();
        const snapshot = await getDocs(itemsRef);
        const items: MenuItemForSelect[] = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d.canBeInitialPage && !d.isHidden && d.originalHref) {
                items.push({ menuKey: doc.id, displayName: d.displayName, originalHref: d.originalHref });
            }
        });
        setAvailablePages(items.sort((a,b) => a.displayName.localeCompare(b.displayName)));

    } catch (e) {
        console.error(e);
        toast({ title: t('toasts.loadError'), variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [contextType, actingAsInstanceId, subInstanceId, form, toast, t, isCustom]);

  useEffect(() => {
    if(!isLoadingPermissions) loadData();
  }, [isLoadingPermissions, loadData]);

  const onSubmit = async (data: LoginBehaviorFormData) => {
    setIsSaving(true);
    const isCustomPayload = contextType !== 'master';
    const dataToSave = { ...data, customized: isCustomPayload, updatedAt: serverTimestamp() };
    
    let settingsRef: DocumentReference;
    if (contextType === 'subinstance' && actingAsInstanceId && subInstanceId) {
        settingsRef = refs.subinstance.loginPageBehaviorSettingsDoc(actingAsInstanceId, subInstanceId);
    } else if (contextType === 'instance' && actingAsInstanceId) {
        settingsRef = refs.instance.loginPageBehaviorSettingsDoc(actingAsInstanceId);
    } else {
        settingsRef = refs.master.loginPageBehaviorSettingsDoc();
    }

    try {
      await setDoc(settingsRef, dataToSave, { merge: true });
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDescription') });
      form.reset(dataToSave, { keepValues: true });
      setIsCustom(isCustomPayload);
      // Manually trigger reload of context alert info
      if(isCustomPayload) {
        setContextAlert({ title: t(`contextAlert.${contextType}Title`), description: t(`contextAlert.${contextType}Description`) });
      }
    } catch (error) {
      toast({ title: t('toasts.saveError'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isLoading,
    isSaving,
    isLoadingPermissions,
    canEdit,
    availablePages,
    contextAlert,
    onSubmit,
  };
}
