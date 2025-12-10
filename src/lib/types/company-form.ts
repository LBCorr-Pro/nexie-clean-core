// src/lib/types/company-form.ts
import { z } from 'zod';
import { Timestamp } from "firebase/firestore";

// Este enum define os tipos de campos que podem ser utilizados no formulário de registo de empresa.
export const fieldTypeEnum = z.enum([
    "text", 
    "number", 
    "email", 
    "date", 
    "url", 
    "dropdown", 
    "checkbox", 
    "switch", 
    "file", 
    "cnpj", 
    "address_group", 
    "textarea", 
    "social"
]);

// Este schema define a configuração de validação para um campo.
export const ValidationConfigSchema = z.object({
  active: z.boolean().default(true),
  type: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  regex: z.string().optional(),
  script: z.string().optional(),
});

// Este é o schema principal que define a estrutura de um único campo de configuração.
export const FieldConfigSchema = z.object({
  fieldKey: z.string().min(1, "A chave do campo é obrigatória."),
  label: z.string().min(1, "O rótulo é obrigatório."),
  fieldType: fieldTypeEnum,
  isVisible: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  order: z.number().int().default(0),
  isPredefinedField: z.boolean().default(false).optional(),
  description: z.string().optional().or(z.literal('')),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  validationConfig: ValidationConfigSchema.optional(),
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
  id: z.string(), // O ID do documento no dnd
  customized: z.boolean().optional(),
});

// Tipo inferido a partir do schema Zod para um único campo.
export type FieldConfig = z.infer<typeof FieldConfigSchema>;

// Schema para o formulário completo, que contém um array de configurações de campo.
export const CompanyRegistrationFormSchema = z.object({
  fields: z.array(FieldConfigSchema),
});

// Tipo inferido para os dados do formulário completo.
export type CompanyRegistrationFormSchemaType = z.infer<typeof CompanyRegistrationFormSchema>;
