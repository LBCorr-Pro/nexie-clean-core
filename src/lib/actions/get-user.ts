
'use server';

import { adminDb } from '@/lib/firebase-admin';

export interface UserStatusData {
    status: 'active' | 'inactive' | 'suspended' | null;
}

/**
 * Fetches a user's status from the correct Firestore path based on the tenantId.
 * Path examples: /Global/master/users/{uid} or /Global/{instanceId}/users/{uid}.
 * This function is safe because it only returns a serializable status object.
 * @param uid The user's Firebase UID.
 * @param tenantId The ID of the tenant (e.g., 'master', an instance ID, or a sub-instance ID).
 * @returns An object containing the user's status, or null if not found.
 */
export async function getUserStatus(uid: string, tenantId: string): Promise<UserStatusData> {
    if (!uid || !tenantId) {
        return { status: null };
    }

    try {
        // The path is now dynamically constructed based on the provided tenantId.
        // This allows checking permissions for master, instances, or sub-instances.
        const userDocRef = adminDb.doc(`Global/${tenantId}/users/${uid}`);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const status = userDoc.data()?.status;
            if (status === 'active' || status === 'inactive' || status === 'suspended') {
                return { status };
            }
        }

        // If the user does not have a record for this specific tenant, deny access.
        return { status: null };

    } catch (error) {
        console.error(`Error fetching user status for tenant ${tenantId} from Firestore:`, error);
        // Deny access in case of any error.
        return { status: null };
    }
}
