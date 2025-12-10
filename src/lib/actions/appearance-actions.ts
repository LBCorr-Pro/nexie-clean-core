// src/lib/actions/appearance-actions.ts
'use server';

import { getAdminDb } from "@/lib/firebase-admin-helpers"; 
import { refs } from '@/lib/firestore-refs';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { FieldValue } from "firebase-admin/firestore";

type ActionContext = {
    actingAsInstanceId: string | null;
    subInstanceId: string | null;
};

/**
 * Server Action para salvar configurações de aparência de forma segura.
 */
export async function saveAppearanceSettingsAction(
  data: Partial<AppearanceSettings>,
  context: ActionContext
): Promise<{ success: boolean; error?: string }> {
    
    const db = getAdminDb();
    if (!db) return { success: false, error: "Database not initialized on the server." };
    
    try {
        let settingsRef;
        if (context.actingAsInstanceId && context.subInstanceId) {
            settingsRef = refs.subinstance.appearanceSettingsDoc(context.actingAsInstanceId, context.subInstanceId);
        } else if (context.actingAsInstanceId) {
            settingsRef = refs.instance.appearanceSettingsDoc(context.actingAsInstanceId);
        } else {
            settingsRef = refs.master.appearanceSettingsDoc();
        }
        
        const docRef = db.doc(settingsRef.path);
        
        const dataForFirestore: Record<string, any> = {
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (context.actingAsInstanceId) {
            dataForFirestore.customized = true;
        } else if (dataForFirestore.hasOwnProperty('customized')) {
            delete dataForFirestore.customized;
        }
        
        await docRef.set(dataForFirestore, { merge: true });
        return { success: true };

    } catch (error: any) {
        console.error(`[saveAppearanceSettingsAction] Erro ao salvar configurações:`, error);
        return { success: false, error: error.message || "An unknown server error occurred." };
    }
}

/**
 * Server Action para reverter as configurações de aparência para o padrão herdado.
 */
export async function revertAppearanceSettingsAction(context: ActionContext): Promise<{ success: boolean; error?: string }> {
    const db = getAdminDb();
    if (!db) return { success: false, error: "Database not initialized on the server." };

    try {
        let settingsRef;
        if (context.actingAsInstanceId && context.subInstanceId) {
            settingsRef = refs.subinstance.appearanceSettingsDoc(context.actingAsInstanceId, context.subInstanceId);
        } else if (context.actingAsInstanceId) {
            settingsRef = refs.instance.appearanceSettingsDoc(context.actingAsInstanceId);
        } else {
            return { success: false, error: "Cannot revert settings in master context." };
        }
        
        const docRef = db.doc(settingsRef.path);
        await docRef.set({ customized: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error(`[revertAppearanceSettingsAction] Erro ao reverter configurações:`, error);
        return { success: false, error: error.message || "An unknown server error occurred." };
    }
}
