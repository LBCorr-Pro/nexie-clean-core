import { Timestamp } from 'firebase/firestore';

export interface Company {
  id: string;
  companyName?: string;
  legalName?: string;
  cnpj?: string;
  status?: boolean;
  createdAt?: Date;
  [key: string]: any;
}

export interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'switch' | 'cnpj' | 'phone';
    required?: boolean;
    placeholder?: string;
    description?: string;
    colSpan?: number;
    isVisible?: boolean;
}
