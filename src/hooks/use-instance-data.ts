// src/hooks/use-instance-data.ts
import { useEffect, useState } from 'react';
import { getDoc, getDocs, query, where, collection, DocumentData, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs';
import type { Instance } from '../app/[locale]/(app)/access/instances/types';
import { defaultAppearance } from '@/lib/default-appearance';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';

interface State {
  instance: Partial<AppearanceSettings> | null; // CORRECTED: Was Partial<Instance>
  loading: boolean;
  error: Error | null;
}

const getDocument = async (ref: any): Promise<DocumentData | null> => {
  if (!ref) return null;
  try {
    const docSnap = await getDoc(ref);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data()! } : null;
  } catch (e) {
    console.error(`Error fetching document from ${ref.path}:`, e);
    return null;
  }
};

const findMasterInstance = async (type: 'master' | 'dev'): Promise<DocumentData | null> => {
    try {
        const instancesRef = collection(db, refs.instances().path);
        const q = query(instancesRef, where('instanceType', '==', type));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data()! };
        }
        return null;
    } catch (error) {
        console.error(`Error finding ${type} instance:`, error);
        return null;
    }
};

const isObject = (item: any): item is object => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

// CORRECTED: More robust merge function
const mergeDeep = (target: { [key: string]: any }, ...sources: { [key: string]: any }[]): any => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key]) && source[key] !== null) {
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

export const useInstanceData = (instanceId?: string | null, subInstanceId?: string | null) => {
  const [state, setState] = useState<State>({ instance: null, loading: true, error: null });

  useEffect(() => {
    const fetchData = async () => {
      setState({ instance: null, loading: true, error: null });
      
      try {
        // Nível 8 (Base): Hardcoded
        // CORRECTED: Changed type from Partial<Instance> to Partial<AppearanceSettings>
        let finalSettings: Partial<AppearanceSettings> = { ...defaultAppearance };

        // Nível 7: Master Global
        const masterGlobalSettings = await getDocument(refs.master.generalSettingsDoc());
        if (masterGlobalSettings) {
            finalSettings = mergeDeep({}, finalSettings, masterGlobalSettings);
        }
        
        // Nível 6: Instância Master Geral
        const generalMasterInstance = await findMasterInstance('master') as Instance | null;
        if (generalMasterInstance) {
            const generalMasterSettings = await getDocument(refs.instance.generalSettingsDoc(generalMasterInstance.id));
             if (generalMasterSettings) {
                finalSettings = mergeDeep({}, finalSettings, generalMasterSettings);
            }
        }
        
        // --- CASCATA DE INSTÂNCIA ---
        if (instanceId) {
            const instanceData = await getDocument(refs.instanceDoc(instanceId)) as Instance | null;

            // NÍVEL 4: A Própria Instância Pai (se tiver config customizada)
            if (instanceData?.customized) {
                const instanceCustomSettings = await getDocument(refs.instance.generalSettingsDoc(instanceId));
                if(instanceCustomSettings) {
                    finalSettings = mergeDeep({}, finalSettings, instanceCustomSettings);
                }
            }
            
            // --- CASCATA DE SUB-INSTÂNCIA ---
            if (subInstanceId) {
              // A lógica de herança de sub-instância de 3 níveis seria adicionada aqui,
              // sobrescrevendo `finalSettings` conforme a prioridade.
            }
        }

        setState({ instance: finalSettings, loading: false, error: null });

      } catch (e) {
        console.error("Falha ao carregar e consolidar dados da hierarquia:", e);
        setState({ instance: null, loading: false, error: e as Error });
      }
    };

    fetchData();
  }, [instanceId, subInstanceId]);

  return state;
};