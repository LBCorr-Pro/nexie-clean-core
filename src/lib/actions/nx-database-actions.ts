'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// =================================================================================================
// 🚨 CUIDADO: ESTAS FUNÇÕES SÃO PODEROSAS E PODEM ALTERAR/DELETAR TODO O BANCO DE DADOS. 🚨
// Use com extrema cautela e apenas por administradores master.
// =================================================================================================

/**
 * Obtém o UID do usuário autenticado a partir do cookie da sessão no lado do servidor.
 * @returns O UID do usuário ou null se não estiver autenticado.
 */
async function getCurrentUserUid(): Promise<string | null> {
  try {
    const sessionCookie = (await cookies()).get('__session')?.value;
    if (!sessionCookie) {
      console.warn('[Auth Check]: Nenhum cookie de sessão encontrado.');
      return null;
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    console.error('[Auth Check]: Falha ao verificar o cookie da sessão:', error);
    return null;
  }
}

/**
 * Verifica se o usuário atual é o Master Admin.
 * Lança um erro se a verificação falhar.
 */
async function ensureMasterAdmin() {
  const userUid = await getCurrentUserUid();
  const masterUid = process.env.NEXT_PUBLIC_MASTER_UID;

  if (!userUid) {
    throw new Error('Acesso Negado: Usuário não autenticado.');
  }

  if (userUid !== masterUid) {
    console.warn(`[Auth Check]: Tentativa de acesso não autorizada pelo UID: ${userUid}`);
    throw new Error('Acesso Negado: Esta ação é permitida apenas para o administrador mestre.');
  }
  
  console.log(`[Auth Check]: Acesso de Master Admin verificado para o UID: ${userUid}`);
}


// --- Funções de Banco de Dados --- (As funções abaixo permanecem as mesmas, mas agora serão protegidas)

interface DocumentData {
  [key: string]: any;
  _subcollections?: {
    [collectionId: string]: CollectionData;
  };
}

interface CollectionData {
  [docId: string]: DocumentData;
}

async function exportCollection(collectionRef: FirebaseFirestore.CollectionReference): Promise<CollectionData> {
  const snapshot = await collectionRef.get();
  const data: CollectionData = {};

  for (const doc of snapshot.docs) {
    const docData: DocumentData = doc.data();
    const subcollections = await doc.ref.listCollections();
    
    if (subcollections.length > 0) {
      docData._subcollections = {};
      for (const subcollectionRef of subcollections) {
        docData._subcollections[subcollectionRef.id] = await exportCollection(subcollectionRef);
      }
    }
    data[doc.id] = docData;
  }

  return data;
}

export async function exportDatabaseToJson() {
  await ensureMasterAdmin(); // 🛡️ PROTEÇÃO APLICADA
  
  console.log('Iniciando exportação do banco de dados para JSON...');
  const db = adminDb;
  const rootCollections = await db.listCollections();
  const databaseJson: { [collectionId: string]: CollectionData } = {};

  for (const collectionRef of rootCollections) {
    console.log(`Exportando coleção: ${collectionRef.id}`);
    databaseJson[collectionRef.id] = await exportCollection(collectionRef);
  }
  
  console.log('Exportação concluída.');
  return { success: true, data: databaseJson };
}

async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference) {
  const snapshot = await collectionRef.limit(500).get();
  if (snapshot.size === 0) {
    return;
  }

  const batch = collectionRef.firestore.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  await deleteCollection(collectionRef);
}

async function importCollection(collectionRef: FirebaseFirestore.CollectionReference, collectionData: CollectionData, mode: 'merge' | 'clean') {
  for (const docId in collectionData) {
    const docData = { ...collectionData[docId] };
    const subcollections = docData._subcollections;
    delete docData._subcollections;

    const docRef = collectionRef.doc(docId);
    await docRef.set(docData, { merge: mode === 'merge' });

    if (subcollections) {
      for (const subcollectionId in subcollections) {
        const subcollectionRef = docRef.collection(subcollectionId);
        await importCollection(subcollectionRef, subcollections[subcollectionId], mode);
      }
    }
  }
}

export async function importDatabaseFromJson(jsonData: any, mode: 'merge' | 'clean') {
  await ensureMasterAdmin(); // 🛡️ PROTEÇÃO APLICADA

  console.log(`Iniciando importação do banco de dados no modo: ${mode}`);
  const db = adminDb;

  if (mode === 'clean') {
    console.warn('MODO CLEAN: Deletando todas as coleções existentes antes da importação...');
    const rootCollections = await db.listCollections();
    for (const collectionRef of rootCollections) {
      console.log(`Deletando coleção: ${collectionRef.id}`);
      await deleteCollection(collectionRef);
    }
    console.log('Todas as coleções foram limpas.');
  }

  for (const collectionId in jsonData) {
    console.log(`Importando para a coleção: ${collectionId}`);
    const collectionRef = db.collection(collectionId);
    await importCollection(collectionRef, jsonData[collectionId], mode);
  }

  console.log('Importação concluída.');
  return { success: true, message: `Banco de dados importado com sucesso no modo ${mode}.` };
}
