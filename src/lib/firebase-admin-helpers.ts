// src/lib/firebase-admin-helpers.ts
import 'server-only';
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: admin.app.App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[Firebase Admin] Credentials not set. Admin features disabled.');
      return;
    }

    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] SDK initialized successfully.');
    } catch (error: any) {
      console.error('[Firebase Admin] CRITICAL: Error initializing SDK:', error);
      app = null; // Ensure app is null on failure
    }
  }

  // Initialize db and auth only if app is valid
  if (app) {
    db = getFirestore(app);
    auth = getAuth(app);
  }
}

// Initialize on first import on the server.
initializeFirebaseAdmin();

export function getAdminApp(): admin.app.App | null {
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) {
    // This might re-run initialization, but it's better to have a clear error
    // if it still fails.
    initializeFirebaseAdmin(); 
    if (!db) {
      throw new Error("Firestore could not be initialized. Check admin credentials.");
    }
  }
  return db;
}

export function getAdminAuth(): Auth {
  if (!auth) {
    initializeFirebaseAdmin();
    if (!auth) {
        throw new Error("Firebase Auth could not be initialized. Check admin credentials.");
    }
  }
  return auth;
}
