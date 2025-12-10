import { Timestamp } from 'firebase/firestore';

export interface GlobalUser {
  id: string;
  fullName?: string;
  email?: string;
  // CORREÇÃO: Componentes de UI devem receber `Date`, não `Timestamp`.
  // A conversão é feita na camada de busca de dados.
  createdAt?: Date;
  status?: 'active' | 'inactive';
}
