// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { useMemo } from "react";

// The configuration is read directly from environment variables.
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Interface for the services object
interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

// Global variable to hold the initialized services
let firebaseServices: FirebaseServices | null = null;

/**
 * Initializes the Firebase app and its services in a singleton pattern.
 * This ensures that Firebase is initialized only once.
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is not configured. Check your .env.local file.");
  }
  
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  firebaseServices = { app, auth, db };
  return firebaseServices;
}

/**
 * A React hook that provides memoized Firebase services.
 * This is the recommended way to access Firebase within components.
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export const useFirebase = (): FirebaseServices => {
  const services = useMemo(() => initializeFirebase(), []);
  return services;
};

/**
 * A standalone getter for the initialized Firestore instance.
 * To be used in modules outside of React components (like `firestore-refs.ts`).
 * It relies on the singleton pattern of initializeFirebase.
 * @returns The initialized Firestore instance.
 */
export const getDb = (): Firestore => {
  if (!firebaseServices) {
    initializeFirebase();
  }
  return firebaseServices!.db;
};

/**
 * A standalone getter for the initialized Auth instance.
 * @returns The initialized Auth instance.
 */
export const getFirebaseAuth = (): Auth => {
    if (!firebaseServices) {
        initializeFirebase();
    }
    return firebaseServices!.auth;
}

// Export the db directly for backward compatibility in some files.
export const db = getDb();
