// src/app/[locale]/(app)/access/instances/edit/types.ts
import { DocumentData, Timestamp } from 'firebase/firestore';

export interface Instance extends DocumentData {
    id: string;
    instanceName: string;
    slug: string;
    instanceType?: 'default' | 'dev' | 'master';
    status: boolean;
    planId?: string | null;
    customDomain?: string;
    createdAt: Date;
    updatedAt?: Date;
    canCreateSubInstances?: boolean;
}

export interface SubInstance extends DocumentData {
  id: string;
  subInstanceName: string;
  subInstanceType?: string;
  status: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
