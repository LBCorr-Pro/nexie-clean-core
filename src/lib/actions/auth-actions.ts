// src/lib/actions/auth-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { getUserStatus } from './get-user';

interface AuthActionState {
  success: boolean;
  message: string;
}

export async function createSessionCookieAction(
  idToken: string,
  tenantId: string | null,
  rememberMe: boolean
): Promise<{ success: true } | { success: false; error: string; errorCode?: string }> {
  
  if (!adminAuth) {
    const errorMessage = "Firebase Admin SDK is not initialized on the server. Session creation failed.";
    console.error(`[AuthAction] Error: ${errorMessage}`);
    return { success: false, error: errorMessage, errorCode: 'auth/admin-sdk-not-initialized' };
  }
  
  try {
    const expiresIn = rememberMe 
      ? 60 * 60 * 24 * 14 * 1000 // 14 days
      : 60 * 60 * 24 * 1 * 1000; // 1 day

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // CORREÇÃO: O nome do cookie foi alterado para '__session' para corresponder ao que o `getCurrentUserUid` espera.
    (await cookies()).set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
      sameSite: 'lax',
    });

    return { success: true };

  } catch (error: any) {
    console.error('[createSessionCookieAction] Error creating session cookie:', error);
    return { success: false, error: error.message || 'Failed to create session.', errorCode: error.code };
  }
}

export async function signOutAction(): Promise<{ success: boolean, error?: string }> {
    try {
        (await cookies()).delete('__session');
        return { success: true };
    } catch(error: any) {
        console.error('[AuthActions] Error signing out:', error);
        return { success: false, error: error.message };
    }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantId: z.string().min(1),
});

export async function registerUserAction(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    if (!adminAuth || !adminDb) {
      return { success: false, message: "Firebase Admin SDK is not configured on the server." };
    }
    const parsed = registerSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { success: false, message: "Dados de registro inválidos." };
    }

    const { email, password, tenantId } = parsed.data;

    try {
        const batch = adminDb.batch();
        const userRecord = await adminAuth.createUser({ email, password, disabled: false });

        const userDocRef = adminDb.doc(`users/${userRecord.uid}`);
        batch.set(userDocRef, { email, fullName: email, firebaseUID: userRecord.uid, createdAt: Timestamp.now() });

        const tenantUserDocRef = adminDb.doc(`Global/${tenantId}/users/${userRecord.uid}`);
        batch.set(tenantUserDocRef, { status: 'active', role: 'user' });

        await batch.commit();

        return { success: true, message: "Registro bem-sucedido! Um e-mail de verificação será enviado em breve." };

    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: "Este e-mail já está em uso." };
        }
        console.error('Error in registerUserAction:', error);
        return { success: false, message: "Ocorreu um erro durante o registro." };
    }
}
