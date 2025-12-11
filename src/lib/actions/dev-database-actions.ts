'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// =================================================================================================
//  SERIALIZAÇÃO E DESSERIALIZAÇÃO (ESSENCIAL PARA PASSAR TIMESTAMPS)
// =================================================================================================
function serializeData(data: any): any {
    if (data === null || data === undefined) return data;
    if (data instanceof Timestamp) return { _type: 'timestamp', value: data.toDate().toISOString() };
    if (data instanceof Date) return { _type: 'timestamp', value: data.toISOString() };
    if (Array.isArray(data)) return data.map(item => serializeData(item));
    if (typeof data === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = serializeData(data[key]);
            }
        }
        return newObj;
    }
    return data;
}

function deserializeData(data: any): any {
    if (data === null || data === undefined) return data;
    if (Array.isArray(data)) return data.map(item => deserializeData(item));
    if (typeof data === 'object') {
        if (data._type === 'timestamp' && typeof data.value === 'string') {
            return Timestamp.fromDate(new Date(data.value));
        }
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = deserializeData(data[key]);
            }
        }
        return newObj;
    }
    return data;
}

// =================================================================================================
//  AÇÕES DE EXPORTAÇÃO (GRANULAR)
// =================================================================================================
async function exportTreeRecursive(docRef: FirebaseFirestore.DocumentReference): Promise<DocumentData> {
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) return {};
    const data: DocumentData = docSnapshot.data() || {};
    const subcollections = await docRef.listCollections();
    if (subcollections.length > 0) {
        data._subcollections = {};
        await Promise.all(subcollections.map(async (subcollectionRef) => {
            const subcollectionData: CollectionData = {};
            const subcollectionSnapshot = await subcollectionRef.get();
            await Promise.all(subcollectionSnapshot.docs.map(async (subDoc) => {
                subcollectionData[subDoc.id] = await exportTreeRecursive(subDoc.ref);
            }));
            if (Object.keys(subcollectionData).length > 0) {
                data._subcollections![subcollectionRef.id] = subcollectionData;
            }
        }));
        if (Object.keys(data._subcollections).length === 0) delete data._subcollections;
    }
    return data;
}

export async function exportDocumentTree(collectionId: string, docId: string): Promise<{ success: boolean; data?: DocumentData; error?: string }> {
    try {
        const db = getAdminDb();
        const docRef = db.collection(collectionId).doc(docId);
        const documentData = await exportTreeRecursive(docRef);
        return { success: true, data: serializeData(documentData) };
    } catch (error: any) {
        return { success: false, error: `Falha ao exportar ${collectionId}/${docId}: ${error.message}` };
    }
}

export async function getTopLevelDocs(collectionId: string): Promise<{ success: boolean; ids?: string[]; error?: string }> {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection(collectionId).select().get();
        const ids = snapshot.docs.map(doc => doc.id);
        return { success: true, ids };
    } catch (error: any) {
        return { success: false, error: `Falha ao listar documentos para ${collectionId}: ${error.message}` };
    }
}

export async function exportSingleCollection(collectionId: string): Promise<{ success: boolean; data?: CollectionData; error?: string }> {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection(collectionId).get();
        const data: CollectionData = {};
        snapshot.forEach(doc => { data[doc.id] = doc.data(); });
        return { success: true, data: serializeData(data) };
    } catch (error: any) {
        return { success: false, error: `Falha ao exportar a coleção ${collectionId}: ${error.message}` };
    }
}

export async function getRootCollectionIds() {
    try {
        const db = getAdminDb();
        const ids = (await db.listCollections()).map(col => col.id);
        return { success: true, ids };
    } catch (error: any) {
        return { success: false, error: `Falha ao listar coleções: ${error.message}` };
    }
}

// =================================================================================================
//  AÇÕES DE IMPORTAÇÃO (REFINADAS)
// =================================================================================================

// Função recursiva para apagar todos os documentos e sub-coleções.
async function deleteCollectionRecursive(collectionRef: FirebaseFirestore.CollectionReference) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.size === 0) return;
    
    const batch = collectionRef.firestore.batch();
    for (const doc of snapshot.docs) {
        // Recursivamente apagar sub-coleções ANTES de apagar o documento pai
        const subcollections = await doc.ref.listCollections();
        for (const sub of subcollections) {
            await deleteCollectionRecursive(sub);
        }
        batch.delete(doc.ref);
    }
    await batch.commit();

    // Chamar novamente caso a coleção tenha mais de 500 documentos
    await deleteCollectionRecursive(collectionRef);
}

// Função recursiva para importar dados com suporte a sub-coleções.
async function importCollectionRecursive(collectionRef: FirebaseFirestore.CollectionReference, collectionData: CollectionData, mode: 'merge' | 'overwrite') {
    for (const docId in collectionData) {
        const docData = { ...collectionData[docId] };
        const subcollections = docData._subcollections;
        delete docData._subcollections;

        const docRef = collectionRef.doc(docId);
        await docRef.set(docData, { merge: mode === 'merge' });

        if (subcollections) {
            for (const subId in subcollections) {
                await importCollectionRecursive(docRef.collection(subId), subcollections[subId], mode);
            }
        }
    }
}

export async function importDatabaseFromJsonDev(jsonData: any, mode: 'merge' | 'overwrite') {
    try {
        console.log(`[Server Action] Iniciando importação no modo: ${mode.toUpperCase()}`);
        const db = getAdminDb();
        const dataToImport = deserializeData(jsonData);

        if (mode === 'overwrite') {
            console.warn('\n🚨 MODO OVERWRITE ATIVADO. APAGANDO TODAS AS COLEÇÕES... 🚨\n');
            const collections = await db.listCollections();
            for (const collectionRef of collections) {
                console.log(` -> Apagando coleção ${collectionRef.id}...`);
                await deleteCollectionRecursive(collectionRef);
            }
            console.log('\n✅ Todas as coleções existentes foram apagadas.\n');
        }

        console.log('Iniciando escrita dos novos dados...');
        for (const collectionId in dataToImport) {
            console.log(` -> Importando coleção ${collectionId}...`);
            await importCollectionRecursive(db.collection(collectionId), dataToImport[collectionId], mode);
        }

        const message = `Banco de dados importado com sucesso no modo ${mode.toUpperCase()}.`;
        console.log(`\n✅ ${message}\n`);
        return { success: true, message };

    } catch (error: any) {
        console.error('\n🚨 FALHA CRÍTICA NA IMPORTAÇÃO DO BANCO DE DADOS 🚨\n', error);
        return { success: false, error: `Falha no servidor ao importar: ${error.message}.` };
    }
}

// Ação de teste permanece a mesma
export async function testServerConnection() {
    try {
      const db = getAdminDb();
      const testDocRef = db.collection('dev_test_server').doc('test-doc');
      await testDocRef.set({ status: 'ok', timestamp: new Date() });
      await testDocRef.delete();
      return { success: true, message: 'Teste de conexão do servidor com o Firestore concluído com sucesso!' };
    } catch (error: any) {
      return { success: false, error: `Falha no teste de conexão do servidor: ${error.message}` };
    }
}
