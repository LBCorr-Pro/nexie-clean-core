// src/lib/actions/user-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin-helpers';
import { refs } from '../firestore-refs';
import { UserNotFoundError } from '@/lib/exceptions';
import { sendCustomVerificationEmail } from '../email-service';

interface FormState {
  success: boolean;
  message?: string | null;
  errors?: Record<string, string[] | undefined>;
}

const userFormSchema = z.object({
    fullName: z.string().min(1, "O nome completo é obrigatório."),
    email: z.string().email("Formato de e-mail inválido."),
    status: z.enum(['active', 'inactive', 'suspended'], { message: "Status inválido." }),
    // The tenantId is now a required part of the schema
    tenantId: z.string().min(1, "Tenant ID é obrigatório."),
});

const createUserSchema = userFormSchema.extend({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

const updateUserSchema = userFormSchema.extend({
    password: z.string().min(6).optional().or(z.literal('')),
});

export async function createUserAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const parsed = createUserSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { success: false, message: "Dados inválidos.", errors: parsed.error.flatten().fieldErrors };
    }

    const { email, password, fullName, status, tenantId } = parsed.data;

    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        const batch = adminDb.batch();

        const isDisabled = status !== 'active';
        const userRecord = await adminAuth.createUser({ email, password, displayName: fullName, disabled: isDisabled });

        const userDocRef = adminDb.doc(`${refs.users().path}/${userRecord.uid}`);
        batch.set(userDocRef, { fullName, email, firebaseUID: userRecord.uid, createdAt: Timestamp.now() });

        // DYNAMIC TENANT: The user is now associated with the correct tenant (master or instance).
        const tenantUserDocRef = adminDb.doc(`Global/${tenantId}/users/${userRecord.uid}`);
        batch.set(tenantUserDocRef, { status, role: 'user' });

        await batch.commit();

        revalidatePath('/[locale]/users', 'page');
        revalidatePath(`/[locale]/users/${tenantId}`, 'page');
        return { success: true, message: `Usuário ${email} criado com sucesso.` };

    } catch (error: any) {
        return { success: false, message: error.code === 'auth/email-already-exists' ? "Este e-mail já está em uso." : error.message };
    }
}

export async function updateUserAction(userId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const parsed = updateUserSchema.omit({ email: true }).safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { success: false, message: "Dados inválidos.", errors: parsed.error.flatten().fieldErrors };
    }

    const { password, status, fullName, tenantId } = parsed.data;

    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        const batch = adminDb.batch();

        const userDocRef = adminDb.doc(`${refs.users().path}/${userId}`);
        batch.update(userDocRef, { fullName, updatedAt: Timestamp.now() });

        // DYNAMIC TENANT: The status is updated in the correct tenant document.
        const tenantUserDocRef = adminDb.doc(`Global/${tenantId}/users/${userId}`);
        batch.update(tenantUserDocRef, { status });

        const isDisabled = status !== 'active';
        await adminAuth.updateUser(userId, { disabled: isDisabled, displayName: fullName });

        if (password) {
            await adminAuth.updateUser(userId, { password });
        }

        await batch.commit();

        revalidatePath('/[locale]/users', 'page');
        revalidatePath(`/[locale]/users/${tenantId}`, 'page');
        revalidatePath(`/[locale]/users/user/${userId}/edit`, 'page');
        return { success: true, message: "Usuário atualizado com sucesso." };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}


export async function resendVerificationEmailAction(userId: string): Promise<{ success: boolean; message: string; }> {
    try {
        const adminAuth = getAdminAuth();
        const userRecord = await adminAuth.getUser(userId);
        if (!userRecord) throw new UserNotFoundError();
        if (userRecord.emailVerified) return { success: false, message: "O e-mail deste usuário já foi verificado." };
        if (!userRecord.email) return { success: false, message: "Usuário não possui um e-mail para verificação." };

        const verificationLink = await adminAuth.generateEmailVerificationLink(userRecord.email);
        await sendCustomVerificationEmail(userRecord.email, userRecord.displayName || 'Usuário', verificationLink);

        return { success: true, message: "E-mail de verificação reenviado com sucesso." };

    } catch (error: any) {
        if (error instanceof UserNotFoundError) {
            return { success: false, message: "Usuário não encontrado." };
        }
        return { success: false, message: error.message || "Ocorreu um erro desconhecido." };
    }
}

const deleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  instanceId: z.string().optional(),
});

interface DeleteFormState {
  success: boolean;
  error?: string | null;
}

export async function deleteUserAction(prevState: DeleteFormState, formData: FormData): Promise<DeleteFormState> {
    const parsed = deleteUserSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }
    const { userId, instanceId } = parsed.data;

    try {
      const adminAuth = getAdminAuth();
      const adminDb = getAdminDb();

      await adminAuth.deleteUser(userId);
      const batch = adminDb.batch();
      const userDocRef = adminDb.doc(`${refs.users().path}/${userId}`);
      batch.delete(userDocRef);
      if (instanceId) {
        const instanceUserLinkRef = adminDb.doc(`${refs.instance.users(instanceId).path}/${userId}`);
        batch.delete(instanceUserLinkRef);
      }
      const masterUserAssocRef = adminDb.doc(`${refs.master.users().path}/${userId}`);
      batch.delete(masterUserAssocRef);
      await batch.commit();
      revalidatePath('/[locale]/users', 'page');
      if (instanceId) {
        revalidatePath(`/[locale]/users/${instanceId}`, 'page');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An unknown error occurred." };
    }
}

export async function setInstanceUserRole(instanceId: string, userId: string, newRole: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const userInstanceRef = adminDb.doc(`${refs.instance.users(instanceId).path}/${userId}`);
    await userInstanceRef.update({ role: newRole });
    revalidatePath(`/[locale]/users/${instanceId}`, 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unknown error occurred." };
  }
}
