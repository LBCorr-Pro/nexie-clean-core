// src/app/[locale]/(app)/users/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { Users, PlusCircle, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { onSnapshot, query, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';

import { refs } from '@/lib/firestore-refs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserListTable, SortConfig, SortKey } from './components/user-list-table';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { deleteUserAction } from '@/lib/actions/user-actions';
import { GlobalUser } from '@/types/user-types';
import { useToast } from '@/hooks/nx-use-toast';
import { BackButton } from '@/components/ui/back-button';
import { useInstanceActingContext } from '@/contexts/instance-acting-context'; // Import the context hook

const initialState = { success: false, error: null };

export default function UsersMasterPage() {
  const params = useParams();
  const { locale } = params as { locale: string };
  const router = useRouter();
  const t = useTranslations('userManagement');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const { actingAsInstanceId } = useInstanceActingContext();

  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const permissions = {
    canView: hasPermission(actingAsInstanceId ? 'instance.users.view_list' : 'master.users.view_global'),
    canCreate: hasPermission(actingAsInstanceId ? 'instance.users.manage' : 'master.users.create_global'),
    canEdit: hasPermission(actingAsInstanceId ? 'instance.users.edit_details' : 'master.users.update_global'),
    canDelete: hasPermission(actingAsInstanceId ? 'instance.users.delete' : 'master.users.update_global'),
  };

  const [allUsers, setAllUsers] = useState<GlobalUser[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'fullName', direction: 'ascending' });
  const [userToDelete, setUserToDelete] = useState<GlobalUser | null>(null);

  const [deleteState, deleteFormAction, isPending] = useActionState(deleteUserAction, initialState);

  useEffect(() => {
    if (!deleteState.success && !deleteState.error) return;

    const handleToastAndReset = () => {
      if (deleteState.success) {
        toast({ title: t('dialog.deleteSuccess') });
      } else if (deleteState.error) {
        toast({ variant: 'destructive', title: t('dialog.deleteError'), description: deleteState.error });
      }
      setUserToDelete(null);
    };

    handleToastAndReset();
  }, [deleteState, t, toast]);

  useEffect(() => {
    if (isLoadingPermissions || !permissions.canView) {
      return;
    }
    
    // **CORRECTION:** When in master context (`actingAsInstanceId` is null), query the root `users` collection.
    // When in an instance context, query the nested users collection for that instance.
    const usersCollectionRef = actingAsInstanceId 
        ? refs.instance.users(actingAsInstanceId)
        : refs.users(); // Correctly points to the root /users collection for master.

    const q = query(usersCollectionRef, orderBy('fullName'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const usersDataPromises = snapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        
        // CORRECTION: The status document to check depends on the context as well.
        const userStatusDocRef = actingAsInstanceId 
            ? doc(refs.instance.users(actingAsInstanceId), userDoc.id)
            : doc(refs.master.users(), userDoc.id);

        const statusSnap = await getDoc(userStatusDocRef);
        // The status is in the 'status' field of the tenant association document.
        const status = statusSnap.exists() ? statusSnap.data().status : 'inactive';

        return {
          ...data,
          id: userDoc.id,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          status: status || 'inactive'
        } as unknown as GlobalUser;
      });

      const combinedUsersData = await Promise.all(usersDataPromises);
      setAllUsers(combinedUsersData);

    }, (error) => {
      console.error("Error fetching users: ", error);
      toast({ variant: "destructive", title: tCommon('error.genericTitle'), description: error.message });
      setAllUsers([]);
    });

    return () => unsubscribe();
  }, [actingAsInstanceId, permissions.canView, isLoadingPermissions, tCommon, toast]);

   const filteredAndSortedUsers = useMemo(() => {
    let users = allUsers ? [...allUsers] : [];
    if (searchTerm) {
      users = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortConfig) {
        users.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue instanceof Date && bValue instanceof Date) {
                return sortConfig.direction === 'ascending' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
            }

            const strA = String(aValue ?? '').toLowerCase();
            const strB = String(bValue ?? '').toLowerCase();

            if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return users;
  }, [allUsers, searchTerm, sortConfig]);

  const isLoading = isLoadingPermissions || (permissions.canView && allUsers === null);

  const handleSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (user: GlobalUser) => {
    const editPath = actingAsInstanceId ? `/users/${actingAsInstanceId}/user/${user.id}/edit` : `/users/user/${user.id}/edit`;
    router.push(`/${locale}${editPath}`);
  };
  
  const createHref = actingAsInstanceId ? `/${locale}/users/${actingAsInstanceId}/create` : `/${locale}/users/create`;

  if (!isLoading && !permissions.canView) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />{actingAsInstanceId ? t('instanceTitle') : t('globalTitle')}</CardTitle>
                <CardDescription>{actingAsInstanceId ? t('instanceDescription') : t('globalDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive" className="mt-3 text-sm"><ShieldCheck className="h-4 w-4" /><AlertTitle className="font-semibold">{t('permissionNeeded')}</AlertTitle><AlertBoxDescription>{t('viewPermissionError')}</AlertBoxDescription></Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="relative">
          {actingAsInstanceId && (
            <BackButton href={`/${locale}/access/instances`} className="absolute right-6 top-3"/>
          )}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2">
            <div>
              <CardTitle className="section-title !border-none !pb-0 flex items-center"><Users className="section-title-icon" />{actingAsInstanceId ? t('instanceTitle') : t('globalTitle')}</CardTitle>
              <CardDescription>{actingAsInstanceId ? t('instanceDescription') : t('globalDescription')}</CardDescription>
            </div>
            {permissions.canCreate && (<Button asChild><Link href={createHref}><PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')}</Link></Button>)}
          </div>
        </CardHeader>
        <CardContent>
            <>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:w-1/2 lg:w-1/3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
              </div>
              <UserListTable
                users={filteredAndSortedUsers}
                isLoading={isLoading}
                sortConfig={sortConfig!}
                handleSort={handleSort}
                onEdit={handleEdit}
                onDelete={(user: GlobalUser) => setUserToDelete(user)}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
              />
            </>
        </CardContent>
        {filteredAndSortedUsers.length > 0 && (
          <CardFooter><p className="text-xs text-muted-foreground">{t('totalUsers', { count: filteredAndSortedUsers.length })}</p></CardFooter>
        )}
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
           <form action={deleteFormAction}>
            <input type="hidden" name="userId" value={userToDelete?.id} />
            {actingAsInstanceId && <input type="hidden" name="instanceId" value={actingAsInstanceId} />}

            <AlertDialogHeader>
                <AlertDialogTitle>{t('dialog.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('dialog.deleteConfirmDescription', { userName: userToDelete?.fullName || userToDelete?.email || '' })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90">{isPending ? tCommon('deleting') : t('dialog.deleteConfirmAction')}</AlertDialogAction>
            </AlertDialogFooter>
           </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
