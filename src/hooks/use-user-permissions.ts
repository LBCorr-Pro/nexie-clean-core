// src/hooks/use-user-permissions.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { getDoc, DocumentData } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useToast } from '@/hooks/nx-use-toast';
import { PermissionId, ALL_PERMISSIONS_TRUE, availablePermissions } from '@/lib/permissions';
import { dequal } from 'dequal';

export type { PermissionId };
export { availablePermissions };

// Types for Plan & Subscription data
interface SubscriptionData {
  status: 'active' | 'past_due' | 'canceled' | 'inactive';
  planId: string;
  // ... outros campos de gateway de pagamento
}

interface InstanceData extends DocumentData {
    name: string;
    billingModel: 'instance' | 'user';
    contact?: { email?: string, name?: string };
}

// Types for the hook's output
type AccessState = 'checking' | 'granted' | 'denied' | 'master';
interface DenialInfo {
    reason: 'INSTANCE_INACTIVE' | 'USER_INACTIVE' | 'NO_PROFILE' | 'UNKNOWN';
    contactEmail?: string;
    instanceName?: string;
}

type PermissionsMap = Partial<Record<PermissionId, boolean>>;
interface UserProfileData {
  activeModuleStatuses?: Record<string, boolean>;
  userAccessLevelId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'inactive'; // For user-based billing
}

export function useUserPermissions() {
  const { user: currentUser, loading: isAuthLoading } = useAuthContext();
  const { actingAsInstanceId, isActingAsMaster, isContextLoading: isInstanceCtxLoading } = useInstanceActingContext();
  const { toast } = useToast();

  const authStatus = useMemo(() => {
    if (isAuthLoading) return 'loading';
    return currentUser ? 'authenticated' : 'unauthenticated';
  }, [isAuthLoading, currentUser]);

  // --- NEW STATE MANAGEMENT ---
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [denialInfo, setDenialInfo] = useState<DenialInfo | null>(null);
  
  const [fetchedPermissions, setFetchedPermissions] = useState<PermissionsMap | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  // --- MASTER ADMIN OVERRIDE ---
  const isMasterAdminByUID = useMemo(() => currentUser?.uid === process.env.NEXT_PUBLIC_MASTER_UID, [currentUser]);
  const isConfirmedMasterAdmin = useMemo(() => isMasterAdminByUID && userProfile !== null, [isMasterAdminByUID, userProfile]);
  
  const hasOverride = useMemo(() => {
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
      return isDevMode || isConfirmedMasterAdmin;
  }, [isConfirmedMasterAdmin]);

  const isLoading = isAuthLoading || isInstanceCtxLoading || isFetching;

  useEffect(() => {
    if (authStatus !== 'authenticated' || !currentUser) {
      setIsFetching(false);
      setAccessState('checking');
      setUserProfile(null);
      setFetchedPermissions(null);
      return;
    }

    const fetchData = async () => {
      setIsFetching(true);
      setAccessState('checking');
      setDenialInfo(null);

      try {
        const profileSnap = await getDoc(refs.user.doc(currentUser.uid));
        if (!profileSnap.exists()) {
          console.warn(`[Permissions] User UID ${currentUser.uid} not in Firestore. Access denied.`);
          setUserProfile(null);
          setFetchedPermissions({});
          setAccessState('denied');
          setDenialInfo({ reason: 'NO_PROFILE' });
          setIsFetching(false); // Make sure to stop loading
          return;
        }
        
        const profileData = profileSnap.data() as UserProfileData;
        setUserProfile(prev => dequal(prev, profileData) ? prev : profileData);

        if (currentUser.uid === process.env.NEXT_PUBLIC_MASTER_UID) {
            setAccessState('master');
            const permissionsSnap = await getDoc(refs.user.masterPermissions(currentUser.uid));
            const permissionsData = permissionsSnap?.exists() ? (permissionsSnap.data() as PermissionsMap) : {};
            setFetchedPermissions(prev => dequal(prev, permissionsData) ? prev : permissionsData);
            setIsFetching(false);
            return;
        }
        
        if (!actingAsInstanceId) {
           setAccessState('granted');
           setFetchedPermissions({});
           setIsFetching(false);
           return;
        }

        const instanceSnap = await getDoc(refs.instanceDoc(actingAsInstanceId));
        if (!instanceSnap.exists()) {
            throw new Error(`Instance ${actingAsInstanceId} not found.`);
        }
        const instanceData = instanceSnap.data() as InstanceData;
        
        if (instanceData.billingModel === 'instance') {
            const subscriptionSnap = await getDoc(refs.instance.subscriptionDoc(actingAsInstanceId));
            const subscriptionData = subscriptionSnap.data() as SubscriptionData | undefined;

            if (subscriptionData?.status !== 'active') {
                setAccessState('denied');
                setDenialInfo({ 
                    reason: 'INSTANCE_INACTIVE', 
                    contactEmail: instanceData.contact?.email, 
                    instanceName: instanceData.name 
                });
                setFetchedPermissions({});
                setIsFetching(false);
                return;
            }
        } else if (instanceData.billingModel === 'user') {
            if (profileData.subscriptionStatus !== 'active') {
                setAccessState('denied');
                setDenialInfo({ 
                    reason: 'USER_INACTIVE', 
                    contactEmail: instanceData.contact?.email, 
                    instanceName: instanceData.name 
                });
                setFetchedPermissions({});
                setIsFetching(false);
                return;
            }
        }

        setAccessState('granted');
        const permissionsSnap = await getDoc(refs.user.instancePermissions(currentUser.uid, actingAsInstanceId));
        const permissionsData = permissionsSnap?.exists() ? (permissionsSnap.data() as PermissionsMap) : {};
        setFetchedPermissions(prev => dequal(prev, permissionsData) ? prev : permissionsData);

      } catch (error) {
        console.error("Error in permission hook:", error);
        toast({ title: "Erro crítico ao verificar acesso", variant: "destructive" });
        setAccessState('denied');
        setDenialInfo({ reason: 'UNKNOWN' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [currentUser, authStatus, actingAsInstanceId, toast]);

  const hasPermission = useCallback((permissionId: PermissionId): boolean => {
    if (isLoading || (accessState !== 'granted' && accessState !== 'master')) return false;
    if (hasOverride) return true;
    return fetchedPermissions?.[permissionId] === true;
  }, [hasOverride, isLoading, accessState, fetchedPermissions]);

  const activeModuleStatusesMap = useMemo(() => {
    const statuses = userProfile?.activeModuleStatuses;
    return statuses ? new Map(Object.entries(statuses)) : new Map();
  }, [userProfile]);

  return {
    currentUser,
    permissions: hasOverride ? ALL_PERMISSIONS_TRUE : (fetchedPermissions || {}),
    isLoadingPermissions: isLoading,
    hasPermission,
    permissionsLoaded: !isLoading,
    accessState,
    denialInfo,
    userAccessLevelId: userProfile?.userAccessLevelId || '',
    activeModuleStatuses: activeModuleStatusesMap,
  };
}
