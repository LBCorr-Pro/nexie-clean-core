// src/hooks/use-nx-company-form.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/nx-use-toast';
import { getDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { useUserPermissions } from './use-user-permissions';
import { useNxGetCompanyFormConfig } from './use-nx-get-company-form-config';
import { refs } from '@/lib/firestore-refs';
import type { Company } from '@/app/[locale]/(app)/companies/types';
import { isValidCnpj } from '@/lib/utils';
import { db } from '@/lib/firebase';
import type { FieldConfig } from '@/lib/types/company-form';


// Generate Zod schema dynamically from field configurations
const generateSchema = (fieldConfigs: FieldConfig[], t: Function) => {
    const shape: { [key: string]: z.ZodTypeAny } = {};

    const visibleFields = fieldConfigs.filter(f => f.isVisible && f.fieldKey);
    const addressSubFields = visibleFields.filter(f => f.isPredefinedField && f.fieldKey && f.fieldKey.startsWith('address'));
    const addressGroupField = visibleFields.find(f => f.fieldKey === 'companyAddress');
    
    visibleFields.forEach(field => {
        if (!field.fieldKey) return; // Defensive check

        if (!field.isPredefinedField || !field.fieldKey.startsWith('address')) {
            let fieldSchema: z.ZodTypeAny;

            switch (field.fieldType) {
                case 'text':
                case 'textarea':
                case 'file':
                case 'social':
                    fieldSchema = z.string();
                    break;
                case 'cnpj':
                    let cnpjSchema = z.string();
                    if (field.validationConfig?.active) {
                        cnpjSchema = cnpjSchema.refine(val => val === '' || val === null || val === undefined || isValidCnpj(val), { message: 'CNPJ inválido.' }) as any;
                    }
                    fieldSchema = cnpjSchema;
                    break;
                case 'url':
                    fieldSchema = z.string().url({ message: 'URL inválida.' });
                    break;
                case 'number':
                    fieldSchema = z.coerce.number();
                    break;
                case 'email':
                    fieldSchema = z.string().email({ message: 'E-mail inválido.' });
                    break;
                case 'switch':
                    fieldSchema = z.boolean();
                    break;
                case 'dropdown':
                    if (field.options && field.options.length > 0) {
                        const enumValues = field.options.map(opt => opt.value);
                        if (enumValues.length > 0) {
                            fieldSchema = z.enum(enumValues as [string, ...string[]]);
                        } else {
                            fieldSchema = z.string();
                        }
                    } else {
                        fieldSchema = z.string();
                    }
                    break;
                default:
                    fieldSchema = z.any();
            }

            if (field.isRequired) {
                if (fieldSchema instanceof z.ZodString) {
                    fieldSchema = fieldSchema.min(1, t('errors.required'));
                }
            } else {
                fieldSchema = fieldSchema.optional().or(z.literal(''));
            }
            shape[field.fieldKey] = fieldSchema;
        }
    });

    if (addressGroupField && addressSubFields.length > 0) {
        const addressShape: { [key: string]: z.ZodTypeAny } = {};
        addressSubFields.forEach(field => {
            if (field.fieldKey) {
                const subKey = field.fieldKey.replace('address', '').charAt(0).toLowerCase() + field.fieldKey.replace('address', '').slice(1);
                let schema: z.ZodString = z.string();
                if (field.isRequired) {
                    schema = schema.min(1, t('errors.required'));
                } else {
                     schema = schema.optional().or(z.literal('')) as any;
                }
                addressShape[subKey] = schema;
            }
        });

        shape.address = z.object(addressShape).optional().nullable();
    }

    return z.object(shape);
};

export function useNxCompanyForm(isEditMode: boolean) {
  const t = useTranslations('companyManagement');
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const companyId = isEditMode ? params.companyId as string : undefined;

  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { fields: fieldConfigs, isLoading: configsLoading, error: configError } = useNxGetCompanyFormConfig();

  const canCreate = hasPermission('master.companies.create');
  const canEdit = hasPermission('master.companies.edit');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(configError);

  const formSchema = useMemo(() => generateSchema(fieldConfigs, t), [fieldConfigs, t]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (isLoadingPermissions || configsLoading) return;

    if ((isEditMode && !canEdit) || (!isEditMode && !canCreate)) {
      setError(t('errors.accessDenied'));
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
        setIsLoading(true);
        if (isEditMode && companyId) {
            const companyRef = doc(refs.companies(), companyId);
            const docSnap = await getDoc(companyRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Company;
                form.reset(data as any);
            } else {
                setError("Empresa não encontrada.");
                toast({ title: "Erro", description: "Empresa não encontrada.", variant: "destructive" });
            }
        } else {
            const defaultVals: Record<string, any> = {};
            fieldConfigs.forEach(fc => {
                if (fc.fieldKey) {
                    if (fc.fieldType === 'switch') {
                        defaultVals[fc.fieldKey] = false;
                    } else if (fc.fieldType !== 'address_group') {
                        defaultVals[fc.fieldKey] = '';
                    }
                }
            });
            defaultVals.status = true; 
            form.reset(defaultVals);
        }
        setIsLoading(false);
    }
    
    loadData();

  }, [isEditMode, companyId, isLoadingPermissions, configsLoading, canEdit, canCreate, form, t, fieldConfigs, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
        if(isEditMode && companyId) {
            const companyRef = doc(refs.companies(), companyId);
            await updateDoc(companyRef, { ...values, updatedAt: serverTimestamp() });
            toast({ title: t('saveSuccess'), description: t('editTitle') });
        } else {
            const companiesRef = refs.companies();
            await addDoc(companiesRef, { ...values, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            toast({ title: t('createSuccess') });
        }
        router.push(`/${locale}/companies`);
    } catch (e: any) {
        console.error("Error saving company:", e);
        toast({ title: t('errors.saveError'), description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const visibleFields = useMemo(() => {
      // CRITICAL FIX: Ensure every field to be rendered has a fieldKey.
      return fieldConfigs.filter(fc => 
          fc.isVisible && 
          fc.fieldKey && 
          fc.fieldType !== 'address_group' && 
          !(fc.isPredefinedField && fc.fieldKey.startsWith('address'))
      );
  }, [fieldConfigs]);

  const addressGroupConfig = useMemo(() => {
      return fieldConfigs.find(fc => fc.isVisible && fc.fieldType === 'address_group');
  }, [fieldConfigs]);

  const visibleAddressSubFields = useMemo(() => {
      // Ensure sub-fields also have a fieldKey.
      return fieldConfigs.filter(fc => 
          fc.isVisible && 
          fc.isPredefinedField && 
          fc.fieldKey && 
          fc.fieldKey.startsWith('address')
      );
  }, [fieldConfigs]);

  return {
    form,
    onSubmit,
    isLoading: isLoading || isLoadingPermissions || configsLoading,
    isSaving,
    error,
    isEditMode,
    visibleFields,
    addressGroupConfig,
    visibleAddressSubFields,
    hasRequiredPermissions: isEditMode ? canEdit : canCreate,
  };
}
