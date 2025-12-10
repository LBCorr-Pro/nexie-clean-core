// src/app/[locale]/(app)/access/levels/types.ts
import { PermissionId } from '@/lib/permissions';

export interface AccessLevelTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean; // To mark a template as the default for new users
  permissions: Partial<Record<PermissionId, boolean>>;
}
