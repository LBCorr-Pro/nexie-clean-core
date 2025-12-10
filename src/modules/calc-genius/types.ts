// src/modules/calc-genius/types.ts
import { z } from "zod";
import { Timestamp } from 'firebase/firestore';

// --- Reusable Zod Schemas with Translation Function ---

export const getFieldFormSchema = (t: (key: string) => string) => z.object({
  id: z.string().min(3, t('zod.idMin')).regex(/^[a-z0-9_]+$/, t('zod.idRegex')),
  label: z.string().min(2, t('zod.labelRequired')),
  description: z.string().optional(),
  data_type: z.enum(['number', 'string', 'boolean', 'date', 'datetime', 'time']),
  origin_type: z.enum(['manual', 'spreadsheet', 'json', 'xml', 'api', 'fixed', 'formula', 'linked']),
  groupIds: z.array(z.string()).optional(),
  mainGroupId: z.string().optional(),
  editable_by_user: z.boolean().default(false),
  origin_config: z.object({
    use_fixed_source: z.boolean().optional(),
    source_url: z.string().optional(),
    data_path: z.string().optional(),
    api_method: z.string().optional(),
    api_headers: z.string().optional(),
    api_body: z.string().optional(),
    column_name: z.string().optional(),
    specific_cell: z.string().optional(),
    sheet_type: z.string().optional(),
    default_value: z.any().optional(),
  }).optional(),
  order: z.number().optional(),
});

export const getGroupFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, t('validation.nameMin')),
  slug: z.string().min(3, t('validation.slugMin')).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugRegex')),
  icon: z.string().min(1, t('validation.iconRequired')),
  colorApplyTo: z.enum(['none', 'group_only', 'group_and_items']).default('none'),
  isColorUnified: z.boolean().default(true),
  unifiedColor: z.string().refine(val => val.trim() === "" || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(val), { message: t('validation.invalidColor') }).optional().or(z.literal('')),
  iconColor: z.string().refine(val => val.trim() === "" || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(val), { message: t('validation.invalidColor') }).optional().or(z.literal('')),
  textColor: z.string().refine(val => val.trim() === "" || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(val), { message: t('validation.invalidColor') }).optional().or(z.literal('')),
});

export const getFormulaFormSchema = (t: (key: string) => string) => z.object({
  id: z.string().min(3, t('zod.idMin')).regex(/^[a-z0-9_]+$/, t('zod.idRegex')),
  label: z.string().min(2, t('zod.labelRequired')),
  description: z.string().optional(),
  expression: z.string().min(1, t('zod.expressionRequired')),
  result_type: z.enum(['number', 'string', 'boolean', 'date', 'datetime', 'time']),
  formula_type: z.enum(['aggregation', 'row_level', 'fixed_value']).default('aggregation'),
  groupIds: z.array(z.string()).optional(),
  createdAt: z.any().optional(),
});


// --- TYPE DEFINITIONS ---

// Field
export type FieldFormData = z.infer<ReturnType<typeof getFieldFormSchema>>;
export interface Field extends FieldFormData {
  docId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Group
export type GroupFormData = z.infer<ReturnType<typeof getGroupFormSchema>>;
export interface Group {
  docId: string;
  id: string;
  label: string;
  icon: string;
  order: number;
  useSameColor: boolean;
  colorApplyTo: 'none' | 'group_only' | 'group_and_items';
  unifiedColor?: string;
  iconColor?: string;
  textColor?: string;
  fieldsCount?: number;
}

// Formula
export type FormulaFormData = z.infer<ReturnType<typeof getFormulaFormSchema>>;
export interface Formula extends FormulaFormData {
  docId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
