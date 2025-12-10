// src/hooks/use-nx-general-settings.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useLog } from '@/contexts/LogContext';
import { saveGeneralSettingsAction } from '@/lib/actions/general-settings-actions';
import { refs } from '@/lib/firestore-refs';
import { getDoc, DocumentReference, DocumentData } from "firebase/firestore";
import { dequal } from 'dequal';
import { defaultAppearance } from '@/lib/default-appearance';

export interface GeneralSettings {
    systemName?: string;
    nickname?: string;
    customized?: boolean;
    isMasterTemplate?: boolean;
    [key: string]: any;
}

// Interface para as informações de debug detalhadas
export interface GeneralSettingsDebugInfo {
    isActingAsMaster: boolean;
    hasName: boolean;
    loadedFrom: string;
    masterInstanceExists: boolean;
    masterInstanceHasName: boolean;
    masterInstancePath: string | null;
    masterInstanceName: string | null;
    globalMasterName: string | null;
    resolvedTopBarName: string;
    resolvedMenuName: string;
}

// Helper to get settings from a document reference
const getSettingsDoc = async (docRef: DocumentReference | null): Promise<Partial<GeneralSettings> | null> => {
    if (!docRef) return null;
    try {
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as GeneralSettings : null;
    } catch (e) {
        console.error(`Error fetching document from ${docRef.path}:`, e);
        return null;
    }
};

const findMasterInstance = async (type: 'master' | 'dev'): Promise<{ id: string, name: string } | null> => {
    // CORREÇÃO: Busca pelo ID do documento 'is-master' ou 'is-dev'
    try {
        const docRef = refs.instanceDoc(type === 'master' ? 'is-master' : 'is-dev');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, name: docSnap.data().instanceName || docSnap.id };
        }
        return null;
    } catch (error) {
        console.error(`Error finding ${type} instance:`, error);
        return null;
    }
};


export function useNxGeneralSettings() {
    const { user: currentUser, loading: isAuthLoading } = useAuthContext();
    const { actingAsInstanceId, subInstanceId, isActingAsMaster: isMasterContext } = useInstanceActingContext();
    const { logEvent } = useLog();
    
    const [isSaving, setIsSaving] = useState(false);
    const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<GeneralSettingsDebugInfo | null>(null);

    const fetchGeneralSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            // Informações para o painel de debug
            const masterInstanceInfo = await findMasterInstance('master');
            const masterGlobalSettings = await getSettingsDoc(refs.master.generalSettingsDoc());
            const masterInstanceSettings = masterInstanceInfo ? await getSettingsDoc(refs.instance.generalSettingsDoc(masterInstanceInfo.id)) : null;

            let finalSettings: Partial<GeneralSettings> | null = null;
            let loadedFromPath = 'Hardcoded Default';

            if (isMasterContext) {
                // Lógica para Master Global
                finalSettings = masterGlobalSettings;
                loadedFromPath = refs.master.generalSettingsDoc().path;
            } else {
                // Lógica para Instância/Sub-instância (Cascata de Herança)
                // Nível 1: Sub-instância Atual
                if (actingAsInstanceId && subInstanceId) {
                    const subInstanceSettings = await getSettingsDoc(refs.subinstance.generalSettingsDoc(actingAsInstanceId, subInstanceId));
                    if (subInstanceSettings?.customized) {
                        finalSettings = subInstanceSettings;
                        loadedFromPath = refs.subinstance.generalSettingsDoc(actingAsInstanceId, subInstanceId).path;
                    }
                }
                // Níveis 2 & 3 (Sub-instância Master do Plano/Geral) - Placeholder
                
                // Nível 4: Instância Pai
                if (!finalSettings && actingAsInstanceId) {
                    const instanceSettings = await getSettingsDoc(refs.instance.generalSettingsDoc(actingAsInstanceId));
                    if (instanceSettings?.customized) {
                        finalSettings = instanceSettings;
                        loadedFromPath = refs.instance.generalSettingsDoc(actingAsInstanceId).path;
                    }
                }
                
                // Níveis 5 & 6 (Instância Master do Plano/Geral)
                if (!finalSettings && masterInstanceSettings) {
                    finalSettings = masterInstanceSettings;
                    loadedFromPath = refs.instance.generalSettingsDoc(masterInstanceInfo!.id).path;
                }

                // Nível 7: Master Global
                if (!finalSettings && masterGlobalSettings) {
                    finalSettings = masterGlobalSettings;
                    loadedFromPath = refs.master.generalSettingsDoc().path;
                }
            }
            
            const mergedSettings = { ...defaultAppearance, ...(finalSettings || {}) };

            setGeneralSettings(prev => dequal(prev, mergedSettings) ? prev : mergedSettings);
            
            // Montando o objeto de debug detalhado
            setDebugInfo({
                isActingAsMaster: isMasterContext,
                hasName: !!mergedSettings?.systemName,
                loadedFrom: loadedFromPath,
                masterInstanceExists: !!masterInstanceInfo,
                masterInstanceHasName: !!masterInstanceSettings?.systemName,
                masterInstancePath: masterInstanceInfo ? refs.instance.generalSettingsDoc(masterInstanceInfo.id).path : null,
                masterInstanceName: masterInstanceSettings?.systemName || null,
                globalMasterName: masterGlobalSettings?.systemName || null,
                resolvedTopBarName: mergedSettings?.topBarBrandingTextCustom || mergedSettings?.systemName || 'Nexie',
                resolvedMenuName: mergedSettings?.leftSidebarAppNameCustomText || mergedSettings?.systemName || 'Nexie',
            });

        } catch (error) {
            logEvent('error', '[useNxGeneralSettings] Error fetching settings', { message: (error as Error).message });
            setGeneralSettings(defaultAppearance);
        } finally {
            setIsLoading(false);
        }
    }, [actingAsInstanceId, subInstanceId, isMasterContext, logEvent]);

    useEffect(() => {
        if (!isAuthLoading) {
            fetchGeneralSettings();
        }
    }, [isAuthLoading, fetchGeneralSettings]);

    const saveGeneralSettings = useCallback(async (data: Partial<GeneralSettings>) => {
        const context = { actingAsInstanceId, subInstanceId };
        setIsSaving(true);
        const result = await saveGeneralSettingsAction(data, context);
        if (result.success) {
            await fetchGeneralSettings(); 
        }
        setIsSaving(false);
        return result;
    }, [actingAsInstanceId, subInstanceId, fetchGeneralSettings]);

    return {
        generalSettings,
        isLoading: isLoading,
        isSaving,
        saveGeneralSettings,
        debugInfo,
    };
}
