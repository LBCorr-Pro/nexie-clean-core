
// src/hooks/use-nx-registration-fields.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serverTimestamp, getDocs, writeBatch, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from "next/navigation";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';
import type { Timestamp } from "firebase/firestore";

// Schemas
const fieldTypeEnum = z.enum(["text", "number", "email", "date", "dropdown", "checkbox", "switch", "file", "cpf", "cnpj", "address_group", "url", "textarea", "social"]);
const ValidationConfigSchema = z.object({ active: z.boolean().default(true), type: z.string().optional(), value: z.union([z.string(), z.number()]).optional(), regex: z.string().optional(), script: z.string().optional() });
const FileConfigSchema = z.object({ allowUpload: z.boolean().default(true), useInternalStorage: z.boolean().default(true) });

const FieldConfigSchema = z.object({
  fieldKey: z.string().min(1),
  label: z.string().min(1),
  fieldType: fieldTypeEnum,
  isVisible: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  order: z.number().int().default(0),
  isSystemDefaultField: z.boolean().default(false).optional(),
  description: z.string().optional().or(z.literal('')),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  validationConfig: ValidationConfigSchema.optional(),
  fileConfig: FileConfigSchema.optional(),
  useOAuthPhoto: z.boolean().optional(),
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
  id: z.string(),
  customized: z.boolean().optional(),
});

type FieldConfigFormData = z.infer<typeof FieldConfigSchema>;
const FormSchema = z.object({ fields: z.array(FieldConfigSchema) });
type FormSchemaType = z.infer<typeof FormSchema>;

export function useNxRegistrationFields() {
  const t = useTranslations('userRegistrationFields');
  const { toast } = useToast();
  const { actingAsInstanceId, actingAsInstanceName } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const subInstanceId = useSearchParams().get('subInstanceId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string[]>([]);
  const [contextAlert, setContextAlert] = useState({ title: '', description: '' });
  const [isCustom, setIsCustom] = useState(false);
  
  const contextType = useMemo(() => {
    if (subInstanceId && actingAsInstanceId) return 'subinstance';
    if (actingAsInstanceId) return 'instance';
    return 'master';
  }, [subInstanceId, actingAsInstanceId]);

  const editPerm: PermissionId = useMemo(() => contextType === 'master' ? 'master.settings.user_fields.edit' : 'instance.settings.user_fields.edit', [contextType]);
  const canEdit = hasPermission(editPerm);

  const form = useForm<FormSchemaType>({ resolver: zodResolver(FormSchema), defaultValues: { fields: [] } });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "fields", keyName: "dndId" });

  const PREDEFINED_FIELDS = useMemo(() => [
    { fieldKey: "fullName", label: t('predefinedFieldLabels.fullName'), fieldType: "text" as const, isRequired: true, isUnique: false, isSystemDefaultField: true, isVisible: true },
    { fieldKey: "email", label: t('predefinedFieldLabels.email'), fieldType: "email" as const, isRequired: true, isUnique: true, isSystemDefaultField: true, isVisible: true },
    { fieldKey: "password", label: t('predefinedFieldLabels.password'), fieldType: "text" as const, isRequired: true, isUnique: false, isSystemDefaultField: true, description: "", isVisible: true },
    { fieldKey: "dateOfBirth", label: t('predefinedFieldLabels.dateOfBirth'), fieldType: "date" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, isVisible: true },
    { fieldKey: "cpf", label: t('predefinedFieldLabels.cpf'), fieldType: "cpf" as const, isRequired: false, isUnique: true, isSystemDefaultField: false, isVisible: true },
    { fieldKey: "gender", label: t('predefinedFieldLabels.gender'), fieldType: "dropdown" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, options: [{ value: "male", label: t('genderOptions.male') }, { value: "female", label: t('genderOptions.female') }, {value: "other", label: t('genderOptions.other')}, { value: "prefer_not_to_say", label: t('genderOptions.prefer_not_to_say') }], isVisible: true },
    { fieldKey: "nickname", label: t('predefinedFieldLabels.nickname'), fieldType: "text" as const, isRequired: false, isUnique: true, isSystemDefaultField: false, isVisible: true },
    { fieldKey: "whatsapp", label: t('predefinedFieldLabels.whatsapp'), fieldType: "text" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, isVisible: true },
    { fieldKey: "profilePictureUrl", label: t('predefinedFieldLabels.profilePictureUrl'), fieldType: "file" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, useOAuthPhoto: true, description: t('predefinedFieldLabels.profilePictureUrlDescription'), isVisible: true },
    { fieldKey: "profileDescription", label: t('predefinedFieldLabels.profileDescription'), fieldType: "textarea" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, isVisible: true },
    { fieldKey: "language", label: t('predefinedFieldLabels.language'), fieldType: "dropdown" as const, isRequired: true, isUnique: false, isSystemDefaultField: true, options: [{value: "pt-BR", label: "Português (Brasil)"}, {value: "en-US", label: "Inglês (EUA)"}], isVisible: true },
    { fieldKey: "timezone", label: t('predefinedFieldLabels.timezone'), fieldType: "dropdown" as const, isRequired: true, isUnique: false, isSystemDefaultField: true, options: [{value: "America/Sao_Paulo", label: "America/Sao_Paulo"}, {value: "America/New_York", label:"America/New_York"}], isVisible: true },
    { fieldKey: "address", label: t('predefinedFieldLabels.address'), fieldType: "address_group" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, isVisible: true },
    { fieldKey: 'socialLinks', label: t('predefinedFieldLabels.socialLinks'), fieldType: "social" as const, isRequired: false, isUnique: false, isSystemDefaultField: false, isVisible: true },
    { fieldKey: 'currency', label: t('predefinedFieldLabels.currency'), fieldType: "dropdown" as const, isRequired: true, isUnique: false, isSystemDefaultField: true, isVisible: true },
  ], [t]);

  const loadData = useCallback(async () => {
      setIsLoading(true);
      try {
          const collectionRefs = {
              master: refs.master.userRegistrationFields(),
              instance: actingAsInstanceId ? refs.instance.userRegistrationFields(actingAsInstanceId) : null,
              subinstance: actingAsInstanceId && subInstanceId ? refs.subinstance.userRegistrationFields(actingAsInstanceId, subInstanceId) : null
          };

          const [masterSnapshot, instanceSnapshot, subInstanceSnapshot] = await Promise.all([
              getDocs(query(collectionRefs.master, orderBy("order", "asc"))),
              collectionRefs.instance ? getDocs(query(collectionRefs.instance, orderBy("order", "asc"))) : null,
              collectionRefs.subinstance ? getDocs(query(collectionRefs.subinstance, orderBy("order", "asc"))) : null,
          ]);

          const masterFields = new Map(masterSnapshot.docs.map(d => [d.id, { ...d.data(), id: d.id } as FieldConfigFormData]));
          const instanceFields = instanceSnapshot ? new Map(instanceSnapshot.docs.map(d => [d.id, { ...d.data(), id: d.id } as FieldConfigFormData])) : new Map();
          const subInstanceFields = subInstanceSnapshot ? new Map(subInstanceSnapshot.docs.map(d => [d.id, { ...d.data(), id: d.id } as FieldConfigFormData])) : new Map();

          let finalFields: Map<string, FieldConfigFormData>;
          let alertTitle = '', alertDesc = '';

          if (contextType === 'subinstance' && subInstanceFields.size > 0 && Array.from(subInstanceFields.values()).some(f => f.customized)) {
              finalFields = subInstanceFields;
              setIsCustom(true);
              alertTitle = t('contextAlert.subInstanceTitle');
              alertDesc = t('contextAlert.subInstanceDescription');
          } else if (contextType !== 'master' && instanceFields.size > 0 && Array.from(instanceFields.values()).some(f => f.customized)) {
              finalFields = instanceFields;
              setIsCustom(true);
              alertTitle = t('contextAlert.instanceTitle', { instanceName: actingAsInstanceName || '' });
              alertDesc = t('contextAlert.instanceDescription');
          } else {
              finalFields = masterFields;
              setIsCustom(false);
              alertTitle = t(contextType === 'master' ? 'contextAlert.masterTitle' : 'contextAlert.inheritingFromMasterTitle');
              alertDesc = t(contextType === 'master' ? 'contextAlert.masterDescription' : 'contextAlert.saveToCustomizeDescription');
          }
          setContextAlert({ title: alertTitle, description: alertDesc });
          
          const combined: FieldConfigFormData[] = PREDEFINED_FIELDS.map((predefined, index) => {
              const existing = finalFields.get(predefined.fieldKey) || masterFields.get(predefined.fieldKey);
              
              const mergedField: FieldConfigFormData = {
                  id: predefined.fieldKey,
                  fieldKey: predefined.fieldKey,
                  isSystemDefaultField: predefined.isSystemDefaultField,
                  
                  label: existing?.label || predefined.label,
                  fieldType: predefined.fieldType,

                  isVisible: existing?.isVisible ?? predefined.isVisible,
                  isRequired: existing?.isRequired ?? predefined.isRequired,
                  isUnique: existing?.isUnique ?? predefined.isUnique,
                  
                  order: existing?.order ?? (index * 10),

                  description: existing?.description || predefined.description || '',
                  options: existing?.options || predefined.options,
                  validationConfig: existing?.validationConfig,
                  fileConfig: existing?.fileConfig,
                  useOAuthPhoto: existing?.useOAuthPhoto ?? predefined.useOAuthPhoto,
                  createdAt: existing?.createdAt,
                  updatedAt: existing?.updatedAt,
                  customized: existing?.customized,
              };
              return mergedField;
          });

          finalFields.forEach((customField, key) => {
              if (!PREDEFINED_FIELDS.some(p => p.fieldKey === key)) {
                  combined.push({ ...customField, isSystemDefaultField: false });
              }
          });
          
          const finalCombined = combined.sort((a, b) => a.order - b.order);

          form.reset({ fields: finalCombined });

      } catch (e) {
          console.error(e);
          toast({ title: t('toasts.loadError'), variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  }, [contextType, actingAsInstanceId, subInstanceId, form, toast, t, PREDEFINED_FIELDS, actingAsInstanceName]);

  useEffect(() => { if (!isLoadingPermissions) loadData(); }, [isLoadingPermissions, loadData]);

  // Actions
  const onSubmit = async (data: FormSchemaType) => {
    // ... (resto do código)
  };
  
  const onRevert = async () => {
    // ... (resto do código)
  };

  const onAddNewField = () => {
    const newKey = `custom_${Date.now()}`;
    append({
      id: newKey, fieldKey: newKey, label: t('newFieldDefaultLabel'), fieldType: "text",
      isVisible: true, isRequired: false, isUnique: false, order: (fields.length + 1) * 10,
      isSystemDefaultField: false, description: "", options: [],
      validationConfig: { active: false }, fileConfig: { allowUpload: true, useInternalStorage: true },
      useOAuthPhoto: false,
    });
  };

  const onDeleteField = async (index: number) => {
    // ... (resto do código)
  };
  
  const onSortEnd = (newItems: FieldConfigFormData[]) => {
      const reordered = newItems.map((item, index) => ({...item, order: index * 10}));
      form.setValue('fields', reordered, { shouldDirty: true, shouldValidate: true });
  };

  return {
    form, fields, isPageEffectivelyDisabled: isLoading || isLoadingPermissions || isSaving || isReverting || !canEdit,
    isLoading, isSaving, isReverting, canEdit, isLoadingPermissions,
    contextAlert, isCustom, contextType, editPerm,
    openAccordion, setOpenAccordion,
    onAddNewField, onDeleteField, onSubmit, onRevert, onSortEnd, move
  };
}
