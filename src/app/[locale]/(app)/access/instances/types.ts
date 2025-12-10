import type { Timestamp } from 'firebase/firestore';

export interface Instance {
  id: string;
  instanceName: string;
  slug: string;
  status: boolean;
  instanceType: 'default' | 'dev' | 'master';
  customDomain?: string;
  planId?: string | null;
  canCreateSubInstances?: boolean;
  isMasterTemplate?: boolean;
  isDevelopment?: boolean;
  createdAt: Date;
  updatedAt: Date;
  customized?: boolean; // Adicionado para refletir a configuração do Firestore
}

export interface SubInstance {
  id: string;
  subInstanceName: string;
  slug: string;
  status: boolean;
  subInstanceType: 'default' | 'dev';
  parentInstanceId: string;
  createdAt: Date;
  updatedAt: Date;
}
