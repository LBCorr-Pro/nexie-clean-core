// src/lib/firebase-admin-helpers.ts
import 'server-only';
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Variáveis para armazenar as instâncias, garantindo que a inicialização ocorra apenas uma vez.
let app: admin.app.App | null = null;

function initializeFirebaseAdmin() {
  // Evita re-inicialização se já estiver conectado.
  if (app) return;

  // Verifica se já existe uma app padrão inicializada (padrão comum em alguns ambientes Vercel/Next.js)
  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
    return;
  }

  // Obtém as credenciais do ambiente.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // A chave privada precisa de um tratamento para substituir os literais '\n' pela quebra de linha real.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Se as credenciais essenciais não estiverem definidas, a inicialização não pode ocorrer.
  if (!projectId || !clientEmail || !privateKey) {
    // Lança um erro claro em vez de um aviso silencioso. Isso garante que o problema seja visível.
    throw new Error('[Firebase Admin] Credenciais do servidor (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não foram encontradas no ambiente. A inicialização do Admin SDK falhou.');
  }

  try {
    // Inicializa o app do Firebase Admin com as credenciais fornecidas.
    app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] SDK inicializado com sucesso.');
  } catch (error: any) {
    // Se a inicialização falhar por qualquer outro motivo, lança um erro detalhado.
    console.error('[Firebase Admin] CRITICAL: Erro ao inicializar o SDK:', error);
    throw new Error(`[Firebase Admin] Falha crítica ao inicializar o SDK: ${error.message}`);
  }
}

// Removida a chamada de inicialização automática daqui.

// As funções 'get' agora são responsáveis por garantir a inicialização.

export function getAdminApp(): admin.app.App {
  if (!app) {
    initializeFirebaseAdmin();
  }
  // Neste ponto, o app deve ter sido inicializado ou um erro foi lançado.
  return app!;
}

export function getAdminDb(): Firestore {
  const currentApp = getAdminApp(); // Garante que a inicialização ocorreu.
  return getFirestore(currentApp);
}

export function getAdminAuth(): Auth {
  const currentApp = getAdminApp(); // Garante que a inicialização ocorreu.
  return getAuth(currentApp);
}
