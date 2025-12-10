// src/lib/firebase-admin.ts
// This file is now deprecated and its logic has been moved to src/lib/firebase-admin-helpers.ts
// It is kept for now to avoid breaking imports but should be removed in a future refactor.
import { getAdminApp, getAdminDb, getAdminAuth } from './firebase-admin-helpers';

const adminApp = getAdminApp();
const adminDb = getAdminDb();
const adminAuth = getAdminAuth();
const db = adminDb; // For legacy imports that expect 'db'

export { adminApp, adminDb, adminAuth, db };
