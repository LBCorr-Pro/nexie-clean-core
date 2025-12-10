// src/app/[locale]/(app)/settings/plans/types.ts
import type { Timestamp } from 'firebase/firestore';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'legacy';
  order: number;
  imageUrl?: string;
  maxUsers?: number;
  maxSubInstances?: number;
  storageLimitMB?: number;
  allowCustomDomain?: boolean;
  enabledModuleIds?: string[];
  defaultPermissionsTemplate?: Record<string, boolean>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
