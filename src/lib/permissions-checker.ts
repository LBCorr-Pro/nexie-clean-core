// src/lib/permissions-checker.ts
import type { PermissionId } from './permissions';

/**
 * A client-side helper function to check for a permission.
 * This is meant to be used in client components where the full `useUserPermissions` hook might be overkill
 * or when you need to check a permission outside the main render loop.
 * 
 * @param permissions - The permissions object from `useUserPermissions`.
 * @param permissionKey - The ID of the permission to check.
 * @returns `true` if the user has the permission, otherwise `false`.
 */
export const hasPermission = (
  permissions: Partial<Record<PermissionId, boolean>>,
  permissionKey: PermissionId
): boolean => {
  return !!permissions[permissionKey];
};
