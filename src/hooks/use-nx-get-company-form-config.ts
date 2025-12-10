// src/hooks/use-nx-get-company-form-config.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { getDocs, query, orderBy, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';
import type { FieldConfig } from '@/lib/types/company-form';

export function useNxGetCompanyFormConfig(instanceId?: string | null, subInstanceId?: string | null) {
  const t = useTranslations('companyManagement.form');
  const { actingAsInstanceId, subInstanceId: contextSubInstanceId } = useInstanceActingContext();

  const finalInstanceId = instanceId ?? actingAsInstanceId;
  const finalSubInstanceId = subInstanceId ?? contextSubInstanceId;

  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PREDEFINED_COMPANY_FIELDS = useMemo(() => [
    { id: 'companyName', fieldKey: 'companyName', label: t('fields.companyName'), fieldType: 'text' as const, isRequired: true, isUnique: false, order: 10, isVisible: true },
    { id: 'fantasyName', fieldKey: 'fantasyName', label: t('fields.fantasyName'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 20, isVisible: true },
    { id: 'cnpj', fieldKey: 'cnpj', label: t('fields.cnpj'), fieldType: 'cnpj' as const, isRequired: true, isUnique: true, order: 30, isVisible: true },
    { id: 'email', fieldKey: 'email', label: t('fields.email'), fieldType: 'email' as const, isRequired: true, isUnique: false, order: 40, isVisible: true },
    { id: 'phone', fieldKey: 'phone', label: t('fields.phone'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 50, isVisible: true },
    { id: 'website', fieldKey: 'website', label: t('fields.website'), fieldType: 'url' as const, isRequired: false, isUnique: false, order: 60, isVisible: true },
    { id: 'status', fieldKey: 'status', label: t('fields.status'), fieldType: 'switch' as const, isRequired: true, isUnique: false, order: 70, isVisible: true },
    { id: 'companyAddress', fieldKey: 'companyAddress', label: t('fields.addressGroup'), fieldType: 'address_group' as const, isRequired: false, isUnique: false, order: 80, isVisible: true },
    { id: 'addressStreet', fieldKey: 'addressStreet', label: t('fields.addressStreet'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 81, isVisible: true, isPredefinedField: true },
    { id: 'addressNumber', fieldKey: 'addressNumber', label: t('fields.addressNumber'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 82, isVisible: true, isPredefinedField: true },
    { id: 'addressComplement', fieldKey: 'addressComplement', label: t('fields.addressComplement'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 83, isVisible: true, isPredefinedField: true },
    { id: 'addressNeighborhood', fieldKey: 'addressNeighborhood', label: t('fields.addressNeighborhood'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 84, isVisible: true, isPredefinedField: true },
    { id: 'addressCity', fieldKey: 'addressCity', label: t('fields.addressCity'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 85, isVisible: true, isPredefinedField: true },
    { id: 'addressState', fieldKey: 'addressState', label: t('fields.addressState'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 86, isVisible: true, isPredefinedField: true },
    { id: 'addressZipCode', fieldKey: 'addressZipCode', label: t('fields.addressZipCode'), fieldType: 'text' as const, isRequired: false, isUnique: false, order: 87, isVisible: true, isPredefinedField: true },
  ], [t]);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const paths = {
            master: refs.master.companyRegistrationFields(),
            instance: finalInstanceId ? refs.instance.companyRegistrationFields(finalInstanceId) : null,
            subinstance: finalInstanceId && finalSubInstanceId ? refs.subinstance.companyRegistrationFields(finalInstanceId, finalSubInstanceId) : null,
        };

        const [masterSnapshot, instanceSnapshot, subInstanceSnapshot] = await Promise.all([
            getDocs(query(paths.master, orderBy("order", "asc"))),
            paths.instance ? getDocs(query(paths.instance, orderBy("order", "asc"))) : null,
            paths.subinstance ? getDocs(query(paths.subinstance, orderBy("order", "asc"))) : null,
        ]);

        const masterFields = new Map(masterSnapshot.docs.map(d => [d.data().fieldKey || d.id, { ...d.data(), id: d.id } as FieldConfig]));
        const instanceFields = instanceSnapshot ? new Map(instanceSnapshot.docs.map(d => [d.data().fieldKey || d.id, { ...d.data(), id: d.id } as FieldConfig])) : new Map();
        const subInstanceFields = subInstanceSnapshot ? new Map(subInstanceSnapshot.docs.map(d => [d.data().fieldKey || d.id, { ...d.data(), id: d.id } as FieldConfig])) : new Map();

        let activeDbFields: Map<string, FieldConfig>;
        const contextType = finalInstanceId ? (finalSubInstanceId ? 'subinstance' : 'instance') : 'master';

        if (contextType === 'subinstance' && subInstanceFields.size > 0) {
            activeDbFields = subInstanceFields;
        } else if (contextType === 'instance' && instanceFields.size > 0) {
            activeDbFields = instanceFields;
        } else {
            activeDbFields = masterFields;
        }

        const combined: FieldConfig[] = PREDEFINED_COMPANY_FIELDS.map((predefined) => {
            const fromDb = activeDbFields.get(predefined.fieldKey);
            const fromMaster = masterFields.get(predefined.fieldKey);

            const mergedField: FieldConfig = {
                ...predefined,
                ...(fromMaster || {}),
                ...(fromDb || {}),
                id: fromDb?.id || fromMaster?.id || predefined.id,
            };
            return mergedField;
        });

        activeDbFields.forEach((customField, key) => {
            if (!PREDEFINED_COMPANY_FIELDS.some(p => p.fieldKey === key)) {
                combined.push(customField);
            }
        });
        
        const finalFields = combined.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setFields(finalFields);

    } catch (e: any) {
      console.error("Erro ao carregar configuração de formulário de empresa:", e);
      setError("Falha ao carregar a configuração.");
    } finally {
      setIsLoading(false);
    }
  }, [finalInstanceId, finalSubInstanceId, PREDEFINED_COMPANY_FIELDS]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { fields, isLoading, error, reload: loadConfig };
}
