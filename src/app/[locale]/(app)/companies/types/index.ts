// src/app/[locale]/(app)/companies/types/index.ts

// Represents the raw data structure fetched from Firestore for a company.
export interface CompanyDataFromFirestore {
    id: string;
    [key: string]: any;
}

// Represents the structured data expected by the CompanyForm component.
// Note: This can be the same as Firestore or a transformed version.
export interface CompanyFormData {
    id?: string;
    companyName?: string;
    legalName?: string;
    status?: boolean;
    // include other fields that the form directly uses.
    [key: string]: any;
}

// Represents the raw field configuration from Firestore.
export interface FieldConfigFromServer {
    id: string;
    [key: string]: any;
}

// Represents the structured field configuration the CompanyForm component needs.
export interface FormFieldConfig {
    key: string;
    label: string;
    labelKey?: string;
    fieldType: string;
    isVisible: boolean;
    isRequired: boolean;
    description?: string;
}
