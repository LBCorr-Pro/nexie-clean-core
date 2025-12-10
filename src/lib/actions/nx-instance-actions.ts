// src/lib/actions/nx-instance-actions.ts
'use server';

import { getAdminDb } from "../firebase-admin-helpers";
import { revalidatePath } from 'next/cache';
import { refs } from '@/lib/firestore-refs';
import { FieldValue, Firestore } from 'firebase-admin/firestore';

// --- Types ---
interface ActionResponse {
  success: boolean;
  slug?: string;
  error?: string;
}

interface InstancePayload {
  instanceName: string;
  slug: string;
  status: boolean;
  instanceType: "default" | "dev" | "master";
  planId?: string | null;
  masterInstanceId?: string | null;
  planMasterInstanceId?: string | null;
  masterSubInstanceId?: string | null;  // Para sub-instâncias
  planMasterSubInstanceId?: string | null; // Para sub-instâncias
}

interface CreateSubInstancePayload extends InstancePayload {
   parentId: string;
}

// --- Helper para Validação de Unicidade ---
const checkUniqueness = async (
  db: Firestore,
  collectionPath: string,
  instanceType: "default" | "master" | "dev",
  planId: string | null | undefined,
  excludeId?: string | null // ID a ser ignorado na verificação (para updates)
) => {
  if (instanceType === 'default') return true; // Tipos "default" não precisam de validação

  const collectionRef = db.collection(collectionPath);
  
  // Base query for the type
  let query = collectionRef.where('instanceType', '==', instanceType);

  // Filter by plan or lack thereof
  if (planId) {
    query = query.where('planId', '==', planId);
  } else {
    query = query.where('planId', 'in', [null, '']);
  }
  
  const snapshot = await query.get();
  
  if (snapshot.empty) return true; // No conflicting instance found

  // If we are updating, check if the found conflicting instance is the one we are editing
  if (excludeId && snapshot.docs[0].id === excludeId) {
      return true;
  }
  
  // If not updating or if the conflict is with another document, uniqueness fails
  if (snapshot.docs.length > 0 && (!excludeId || snapshot.docs[0].id !== excludeId)) {
    return false;
  }

  return true;
};


// --- Actions ---
export async function createInstanceAction(data: InstancePayload): Promise<ActionResponse> {
  const db = getAdminDb();
  if (!db) return { success: false, error: "Database not initialized." };
  if (!data.slug) return { success: false, error: "Slug is required." };

  try {
    // 1. Validar unicidade de slug
    const slugRef = db.doc(refs.instanceDoc(data.slug).path);
    if ((await slugRef.get()).exists) {
      return { success: false, error: "slug-in-use" };
    }

    // 2. Validar unicidade do tipo Master/Dev
    const isUnique = await checkUniqueness(db, refs.instances().path, data.instanceType, data.planId);
    if (!isUnique) {
      const typeError = data.planId ? `master-dev-plan-conflict` : `master-dev-general-conflict`;
      return { success: false, error: typeError };
    }

    // 3. Criar o documento
    await slugRef.set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/[locale]/access/instances', 'page');
    return { success: true, slug: data.slug };

  } catch (e: any) {
    console.error("Error creating instance: ", e);
    return { success: false, error: e.message || "An unknown server error occurred." };
  }
}

export async function createSubInstanceAction(data: CreateSubInstancePayload): Promise<ActionResponse> {
    const db = getAdminDb();
    if (!db) return { success: false, error: "Database not initialized." };
    if (!data.parentId) return { success: false, error: "Parent instance ID is required."};
    if (!data.slug) return { success: false, error: "Slug is required." };

    try {
        const subInstanceCollectionRef = refs.instance.subinstances(data.parentId);

        // 1. Validar unicidade de slug DENTRO da instância pai
        const slugQuery = db.collection(subInstanceCollectionRef.path).where('slug', '==', data.slug);
        if (!(await slugQuery.get()).empty) {
            return { success: false, error: "slug-in-use" };
        }

        // 2. Validar unicidade de tipo Master/Dev DENTRO da instância pai
        // A lógica de `checkUniqueness` pode ser reutilizada aqui
        const isUnique = await checkUniqueness(db, subInstanceCollectionRef.path, data.instanceType, data.planId);
         if (!isUnique) {
            const typeError = data.planId ? `master-dev-plan-conflict` : `master-dev-general-conflict`;
            return { success: false, error: typeError };
        }

        // 3. Criar o documento
        await db.collection(subInstanceCollectionRef.path).add({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        revalidatePath(`/[locale]/access/instances/${data.parentId}/edit`, 'page');
        return { success: true };
    } catch(e: any) {
        console.error("Error creating sub-instance: ", e);
        return { success: false, error: e.message || "An unknown server error occurred." };
    }
}


export async function updateInstanceAction(
    id: string,
    data: Partial<InstancePayload>,
    context: { isSubInstance: boolean; parentId?: string }
): Promise<ActionResponse> {
    const db = getAdminDb();
    if (!db) return { success: false, error: "Database not initialized." };

    try {
        let docRef;
        let collectionPath;

        if (context.isSubInstance && context.parentId) {
            collectionPath = refs.instance.subinstances(context.parentId).path;
            docRef = db.doc(`${collectionPath}/${id}`);
        } else {
            collectionPath = refs.instances().path;
            docRef = db.doc(`${collectionPath}/${id}`);
        }

        // 1. Se o tipo está sendo alterado, validar unicidade
        if (data.instanceType && data.instanceType !== 'default') {
            const currentData = (await docRef.get()).data() as InstancePayload | undefined;
            const isUnique = await checkUniqueness(db, collectionPath, data.instanceType, data.planId || currentData?.planId, id);
            if (!isUnique) {
                 const typeError = (data.planId || currentData?.planId) ? `master-dev-plan-conflict` : `master-dev-general-conflict`;
                return { success: false, error: typeError };
            }
        }

        // 2. Atualizar o documento
        await docRef.update({
            ...data,
            updatedAt: FieldValue.serverTimestamp()
        });

        // 3. Revalidar caches
        if (context.isSubInstance && context.parentId) {
            revalidatePath(`/[locale]/access/instances/${context.parentId}/edit`, 'page');
        } else {
            revalidatePath('/[locale]/access/instances', 'page');
            revalidatePath(`/[locale]/access/instances/edit/${id}`, 'page');
        }

        return { success: true };
    } catch (e: any) {
        console.error("Error updating instance: ", e);
        return { success: false, error: e.message || "An unknown server error occurred." };
    }
}
