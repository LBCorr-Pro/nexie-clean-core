// src/hooks/use-nx-appearance.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useLog } from '@/contexts/LogContext';
import { saveAppearanceSettingsAction, revertAppearanceSettingsAction } from '@/lib/actions/appearance-actions';
import { refs } from '@/lib/firestore-refs';
import { doc, getDoc, DocumentReference, DocumentData, setDoc, getDocs, query, where } from "firebase/firestore";
import { dequal } from 'dequal';
import { useTheme } from 'next-themes';
import { defaultAppearance } from '@/lib/default-appearance';

export interface AppearanceSettings {
    themePreference?: 'light' | 'dark' | 'system';
    language?: string;
    [key: string]: any;
}

const isObject = (item: any): item is object => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

// **CORRECTED DEEP MERGE LOGIC**
const mergeDeep = (target: { [key: string]: any }, ...sources: { [key: string]: any }[]): any => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (key === 'bottomBarConfig' && isObject(source[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                const sourceConfig = source[key] as any;
                const targetConfig = target[key] as any;
                target[key] = { ...targetConfig, ...sourceConfig };
                if (sourceConfig.tabs) {
                    target[key].tabs = sourceConfig.tabs;
                }
            } else if (isObject(source[key]) && source[key] !== null) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {};
                }
                mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return mergeDeep(target, ...sources);
};


const getSettingsDoc = async (docRef: DocumentReference | null): Promise<Partial<AppearanceSettings> | null> => {
    if (!docRef) return null;
    try {
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as AppearanceSettings : null;
    } catch (e) {
        console.error(`Error fetching settings from ${docRef.path}:`, e);
        return null;
    }
};

const findMasterInstanceRef = async (type: 'master' | 'dev', planId?: string | null): Promise<DocumentReference | null> => {
    let q = query(refs.instances(), where('instanceType', '==', type));
    if (planId) {
        q = query(q, where('planId', '==', planId));
    } else {
        q = query(q, where('planId', 'in', [null, '']));
    }
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs[0].ref;
    }
    return null;
};

export function useNxAppearance() {
    const { user: currentUser, loading: isAuthLoading } = useAuthContext();
    const { actingAsInstanceId, subInstanceId } = useInstanceActingContext();
    const { logEvent } = useLog();
    const { setTheme } = useTheme();
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            let finalSettings: AppearanceSettings = JSON.parse(JSON.stringify(defaultAppearance));
            (finalSettings as any).__is_overwritten__ = false;
            
            const masterSettings = await getSettingsDoc(refs.master.appearanceSettingsDoc());
            if (masterSettings) finalSettings = mergeDeep({}, finalSettings, masterSettings);

            const parentInstanceSnap = actingAsInstanceId ? await getDoc(refs.instanceDoc(actingAsInstanceId)) : null;
            const parentInstancePlanId = parentInstanceSnap?.exists() ? parentInstanceSnap.data().planId : null;

            const generalMasterInstanceRef = await findMasterInstanceRef('master');
            if (generalMasterInstanceRef) {
                const generalMasterSettings = await getSettingsDoc(refs.instance.appearanceSettingsDoc(generalMasterInstanceRef.id));
                if (generalMasterSettings) finalSettings = mergeDeep({}, finalSettings, generalMasterSettings);
            }
            
            if (parentInstancePlanId) {
                const planMasterInstanceRef = await findMasterInstanceRef('master', parentInstancePlanId);
                if (planMasterInstanceRef) {
                    const planMasterSettings = await getSettingsDoc(refs.instance.appearanceSettingsDoc(planMasterInstanceRef.id));
                    if (planMasterSettings) finalSettings = mergeDeep({}, finalSettings, planMasterSettings);
                }
            }

            if (actingAsInstanceId) {
                const instanceSettings = await getSettingsDoc(refs.instance.appearanceSettingsDoc(actingAsInstanceId));
                if (instanceSettings?.customized) {
                    finalSettings = mergeDeep({}, finalSettings, instanceSettings);
                    (finalSettings as any).__is_overwritten__ = true;
                }

                if (subInstanceId) {
                    const subInstanceSettings = await getSettingsDoc(refs.subinstance.appearanceSettingsDoc(actingAsInstanceId, subInstanceId));
                    if (subInstanceSettings?.customized) {
                        finalSettings = mergeDeep({}, finalSettings, subInstanceSettings);
                         (finalSettings as any).__is_overwritten__ = true;
                    }
                }
            }

            if (currentUser) {
                const userRef = doc(refs.users(), currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().settings) {
                    finalSettings = mergeDeep({}, finalSettings, userSnap.data().settings);
                }
            }
            
            setAppearanceSettings(prev => dequal(prev, finalSettings) ? prev : finalSettings);

        } catch (error) {
            logEvent('error', '[useNxAppearance] Error fetching settings cascade', { message: (error as Error).message });
            setAppearanceSettings(defaultAppearance);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, actingAsInstanceId, subInstanceId, logEvent]);

    useEffect(() => {
        if (!isAuthLoading) fetchSettings();
    }, [isAuthLoading, fetchSettings]);

    useEffect(() => {
        if (appearanceSettings?.themePreference) setTheme(appearanceSettings.themePreference);
    }, [appearanceSettings?.themePreference, setTheme]);

    const saveAppearanceSettings = useCallback(async (data: Partial<AppearanceSettings>) => {
        if (currentUser && (data.language || data.themePreference)) {
            const userPrefs: Partial<Pick<AppearanceSettings, 'language' | 'themePreference'>> = {};
            if (data.language) userPrefs.language = data.language;
            if (data.themePreference) userPrefs.themePreference = data.themePreference;
            const userRef = doc(refs.users(), currentUser.uid);
            try {
                await setDoc(userRef, { settings: userPrefs }, { merge: true });
            } catch (error) {
                logEvent('error', `[useNxAppearance] Failed to save user-specific preferences`, { message: (error as Error).message });
            }
        }
        
        const settingsToSave = Object.fromEntries(
          Object.entries(data).filter(([key]) => key !== 'language' && key !== 'themePreference')
        );

        if (Object.keys(settingsToSave).length === 0) {
            return { success: true, message: 'User preferences saved.' };
        }

        setIsSaving(true);
        const result = await saveAppearanceSettingsAction(settingsToSave, { actingAsInstanceId, subInstanceId });
        if (result.success) {
            await fetchSettings();
        }
        setIsSaving(false);
        return result;

    }, [currentUser, actingAsInstanceId, subInstanceId, logEvent, fetchSettings]);

    const revertToInheritedSettings = useCallback(async () => {
        setIsSaving(true);
        const result = await revertAppearanceSettingsAction({ actingAsInstanceId, subInstanceId });
        if (result.success) {
            await fetchSettings();
        }
        setIsSaving(false);
        return result;
    }, [actingAsInstanceId, subInstanceId, fetchSettings]);


    return {
        appearanceSettings,
        isLoading: isLoading || isAuthLoading,
        isSaving,
        saveAppearanceSettings,
        revertToInheritedSettings,
    };
}
