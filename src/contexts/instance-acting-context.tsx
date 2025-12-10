// src/contexts/instance-acting-context.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { query, onSnapshot } from 'firebase/firestore'; 
import { useLog } from './LogContext';
import { dequal } from 'dequal';
import { refs } from '@/lib/firestore-refs';

const ACTING_AS_INSTANCE_ID_KEY = 'nexie_actingAsInstanceId';
const ACTING_AS_INSTANCE_NAME_KEY = 'nexie_actingAsInstanceName';

export interface ModuleDefinition extends DocumentData { docId: string; id: string; name: string; status: boolean; icon: string; description: string; parentId: string; useSameColor: boolean; wasCreatedInImportMode: boolean; imported: boolean; isRichTextEditor?: boolean; color?: string; unifiedColor?: string; iconColor?: string; textColor?: string; createdAt?: Timestamp; updatedAt?: Timestamp; canBeInitialPage?: boolean; canBeBottomBarItem?: boolean; }
export interface InstanceModuleDefinition extends DocumentData { docId: string; moduleId: string; status: boolean; customizedSettings: boolean; globalModuleDocId?: string; createdAt?: Timestamp; updatedAt?: Timestamp; }
export interface ModuleBottomBarConfig { moduleName: string; moduleIcon?: string; moduleTabTitle?: string; moduleTabIcon?: string; moduleTabBackgroundColor?: string; moduleTabTextColor?: string; bottomBarBackgroundColor?: string; bottomBarItems?: any[]; bottomBarVisible?: boolean; bottomBarIconColorActive?: string; bottomBarIconColorInactive?: string; bottomBarTextColorActive?: string; bottomBarTextColorInactive?: string; }

interface InstanceActingContextType {
  actingAsInstanceId: string | null;
  actingAsInstanceName: string | null;
  subInstanceId: string | null;
  setActingAs: (instanceId: string | null, instanceName: string | null) => void;
  isActingAsMaster: boolean;
  isContextLoading: boolean; // NOVO ESTADO EXPOSTO
  globalModuleDefinitions: Map<string, ModuleDefinition>;
  instanceModuleDefinitions: Map<string, InstanceModuleDefinition>;
  effectiveModuleStatuses: Map<string, boolean>;
  isLoadingModuleConfigs: boolean;
  moduleBottomBarConfig: ModuleBottomBarConfig | null;
  setModuleBottomBarConfig: (config: ModuleBottomBarConfig | null) => void;
}

const InstanceActingContext = createContext<InstanceActingContextType | undefined>(undefined);

export const useInstanceActingContext = () => {
  const context = useContext(InstanceActingContext);
  if (!context) {
    throw new Error('useInstanceActingContext must be used within an InstanceActingProvider');
  }
  return context;
};

interface InstanceActingProviderProps { children: ReactNode; }

const InstanceActingProviderInner: React.FC<InstanceActingProviderProps & { subInstanceId: string | null }> = ({ children, subInstanceId }) => {
  const [actingAsInstanceId, setActingAsInstanceId] = useState<string | null>(null);
  const [actingAsInstanceName, setActingAsInstanceName] = useState<string | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true); // NOVO ESTADO DE CARREGAMENTO
  const { logEvent } = useLog();
  
  const [globalModuleDefinitions, setGlobalModuleDefinitions] = useState<Map<string, ModuleDefinition>>(new Map());
  const [instanceModuleDefinitions, setInstanceModuleDefinitions] = useState<Map<string, InstanceModuleDefinition>>(new Map());
  const [isLoadingModuleConfigs, setIsLoadingModuleConfigs] = useState(true);
  const [moduleBottomBarConfig, setModuleBottomBarConfig] = useState<ModuleBottomBarConfig | null>(null);

  // Efeito para ler do localStorage APENAS uma vez, na montagem do componente.
  useEffect(() => {
    try {
      const storedId = localStorage.getItem(ACTING_AS_INSTANCE_ID_KEY);
      const storedName = localStorage.getItem(ACTING_AS_INSTANCE_NAME_KEY);
      setActingAsInstanceId(storedId);
      setActingAsInstanceName(storedName);
    } catch (error) {
      logEvent('warn', '[InstanceActingContext] Could not access localStorage.', error);
    } finally {
      setIsContextLoading(false); // Finaliza o carregamento do contexto.
    }
  }, [logEvent]);

  const isActingAsMaster = useMemo(() => !actingAsInstanceId && !subInstanceId, [actingAsInstanceId, subInstanceId]);

  useEffect(() => {
    const globalDefsQuery = query(refs.master.moduleDefinitions());
    const unsubscribeGlobal = onSnapshot(globalDefsQuery, (querySnapshot) => {
        setGlobalModuleDefinitions(prev => {
            const newMap = new Map<string, ModuleDefinition>();
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data() as ModuleDefinition;
                if (data && data.id) {
                    newMap.set(data.id, { ...data, docId: docSnap.id });
                }
            });
            return dequal(prev, newMap) ? prev : newMap;
        });
    }, (error) => console.error("[Context] Error fetching global module definitions:", error));

    return () => unsubscribeGlobal();
  }, []);

  // CORREÇÃO: Adicionado 'subInstanceId' ao array de dependências e corrigido o nome da função no refs.
  useEffect(() => {
    if (!actingAsInstanceId) {
      setInstanceModuleDefinitions(new Map());
      setIsLoadingModuleConfigs(false);
      return;
    }

    const qInstance = query(refs.instance.instanceModuleDefs(actingAsInstanceId));

    const unsubscribeInstance = onSnapshot(qInstance, (snapshot) => {
      setInstanceModuleDefinitions(prev => {
        const newMap = new Map<string, InstanceModuleDefinition>();
        snapshot.docs.forEach(d => newMap.set(d.data().moduleId, { docId: d.id, ...d.data() } as InstanceModuleDefinition));
        return dequal(prev, newMap) ? prev : newMap;
      });
      setIsLoadingModuleConfigs(false);
    }, (error) => {
      console.error("[Context] Error fetching instance module definitions:", error);
      setIsLoadingModuleConfigs(false);
    });

    return () => unsubscribeInstance();
  }, [actingAsInstanceId, subInstanceId]);

  const effectiveModuleStatuses = useMemo(() => {
    const statuses = new Map<string, boolean>();
    globalModuleDefinitions.forEach((masterDef, id) => {
      const instanceDef = instanceModuleDefinitions.get(id);
      const isGloballyActive = masterDef.status === true;
      const isInstanceActive = instanceDef ? instanceDef.status === true : true;
      statuses.set(id, isGloballyActive && isInstanceActive);
    });
    return statuses;
  }, [globalModuleDefinitions, instanceModuleDefinitions]);

  const setActingAs = useCallback((instanceId: string | null, instanceName: string | null) => {
    try {
        if (instanceId && instanceName) {
            localStorage.setItem(ACTING_AS_INSTANCE_ID_KEY, instanceId);
            localStorage.setItem(ACTING_AS_INSTANCE_NAME_KEY, instanceName);
        } else {
            localStorage.removeItem(ACTING_AS_INSTANCE_ID_KEY);
            localStorage.removeItem(ACTING_AS_INSTANCE_NAME_KEY);
            const url = new URL(window.location.href);
            url.searchParams.delete('subInstanceId');
            window.history.replaceState({}, '', url);
        }
    } catch (error) {
        logEvent('warn', '[InstanceActingContext] Could not access localStorage to save state.', error);
    }
    setActingAsInstanceId(instanceId);
    setActingAsInstanceName(instanceName);
  }, [logEvent]);

  const contextValue = useMemo(() => ({
    actingAsInstanceId,
    actingAsInstanceName,
    subInstanceId,
    setActingAs,
    isActingAsMaster,
    isContextLoading, // Exporta o novo estado
    globalModuleDefinitions,
    instanceModuleDefinitions,
    effectiveModuleStatuses,
    isLoadingModuleConfigs,
    moduleBottomBarConfig,
    setModuleBottomBarConfig,
  }), [
    actingAsInstanceId, actingAsInstanceName, subInstanceId, setActingAs, isActingAsMaster,
    isContextLoading, globalModuleDefinitions, instanceModuleDefinitions,
    effectiveModuleStatuses, isLoadingModuleConfigs,
    moduleBottomBarConfig,
  ]);

  return (
    <InstanceActingContext.Provider value={contextValue}>
      {children}
    </InstanceActingContext.Provider>
  );
};

const InstanceActingProviderWithSearchParams: React.FC<InstanceActingProviderProps> = ({ children }) => {
  const searchParams = useSearchParams();
  const subInstanceId = searchParams.get('subInstanceId');
  return (
    <InstanceActingProviderInner subInstanceId={subInstanceId}>
      {children}
    </InstanceActingProviderInner>
  );
}

export const InstanceActingProvider: React.FC<InstanceActingProviderProps> = ({ children }) => {
  return (
    <Suspense>
      <InstanceActingProviderWithSearchParams>
        {children}
      </InstanceActingProviderWithSearchParams>
    </Suspense>
  );
};
