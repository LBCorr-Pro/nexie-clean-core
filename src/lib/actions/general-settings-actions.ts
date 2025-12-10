// src/lib/actions/general-settings-actions.ts
'use server';

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin-helpers"; 
import { refs } from '@/lib/firestore-refs';
import type { GeneralSettings } from '@/hooks/use-nx-dynamic-menu';

/**
 * Server Action segura para salvar configurações gerais.
 */
export async function saveGeneralSettingsAction(
  data: Partial<GeneralSettings>,
  context: { 
    actingAsInstanceId: string | null; 
    subInstanceId: string | null; 
  }
): Promise<{ success: boolean; error?: string }> {
    
    const db = getAdminDb();
    
    try {
        let settingsRefPath: string;
        if (context.actingAsInstanceId && context.subInstanceId) {
            settingsRefPath = refs.subinstance.generalSettingsDoc(context.actingAsInstanceId, context.subInstanceId).path;
        } else if (context.actingAsInstanceId) {
            settingsRefPath = refs.instance.generalSettingsDoc(context.actingAsInstanceId).path;
        } else {
            settingsRefPath = refs.master.generalSettingsDoc().path;
        }
        
        const docRef = db.doc(settingsRefPath);
        
        const dataForFirestore: Record<string, any> = {
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (context.actingAsInstanceId) {
            dataForFirestore.customized = true;
        } else if (dataForFirestore.hasOwnProperty('customized') && !context.actingAsInstanceId) {
            if (dataForFirestore.customized !== false) {
              delete (dataForFirestore as any).customized;
            }
        }
        
        await docRef.set(dataForFirestore, { merge: true });
        
        return { success: true };

    } catch (error: any) {
        console.error(`[saveGeneralSettingsAction] Erro ao salvar dados:`, error);
        return { success: false, error: error.message };
    }
}
