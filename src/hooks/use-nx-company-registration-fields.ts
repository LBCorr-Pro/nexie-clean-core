// src/hooks/use-nx-company-registration-fields.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverTimestamp, getDocs, writeBatch, query, orderBy, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from "next/navigation";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';
// Importação centralizada
import {
  FieldConfig,
  CompanyRegistrationFormSchema,
  CompanyRegistrationFormSchemaType
} from '@/lib/types/company-form';

export function useNxCompanyRegistrationFields() {
  const t = useTranslations('companyRegistrationFields');
  const { toast } = useToast();
  const { actingAsInstanceId, actingAsInstanceName } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const subInstanceId = useSearchParams().get('subInstanceId');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string[]>([]);
  const [contextAlert, setContextAlert] = useState({ title: '', description: '' });
  const [isCustom, setIsCustom] = useState(false);
  
  // Context & Permissions
  const contextType = useMemo(() => {
    if (subInstanceId && actingAsInstanceId) return 'subinstance';
    if (actingAsInstanceId) return 'instance';
    return 'master';
  }, [subInstanceId, actingAsInstanceId]);

  const editPerm: PermissionId = useMemo(() => contextType === 'master' ? 'master.settings.company_fields.edit' : 'instance.settings.company_fields.edit', [contextType]);
  const canEdit = hasPermission(editPerm);

  // Form
  const form = useForm<CompanyRegistrationFormSchemaType>({ 
    resolver: zodResolver(CompanyRegistrationFormSchema),
    defaultValues: { fields: [] } 
  });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "fields", keyName: "dndId" });

  // Predefined Fields
  const PREDEFINED_FIELDS = useMemo(() => [
    { fieldKey: "companyName", label: t('predefinedFieldLabels.companyName'), fieldType: "text", isRequired: true, isUnique: false, isPredefinedField: true },
    { fieldKey: "legalName", label: t('predefinedFieldLabels.legalName'), fieldType: "text", isRequired: true, isUnique: false, isPredefinedField: true },
    { fieldKey: "cnpj", label: t('predefinedFieldLabels.cnpj'), fieldType: "cnpj", isRequired: true, isUnique: true, isPredefinedField: true },
    { fieldKey: "status", label: t('predefinedFieldLabels.status'), fieldType: "switch", isRequired: true, isUnique: false, isPredefinedField: true, description: t('predefinedFieldLabels.statusDescription') },
    { fieldKey: "companyLogoUrl", label: t('predefinedFieldLabels.companyLogoUrl'), fieldType: "file", isRequired: false, isUnique: false, isPredefinedField: true, description: t('predefinedFieldLabels.companyLogoUrlDescription') },
    { fieldKey: "companyEmail", label: t('predefinedFieldLabels.companyEmail'), fieldType: "email", isRequired: false, isUnique: true, isPredefinedField: true },
    { fieldKey: "socialLinks", label: t('predefinedFieldLabels.socialLinks'), fieldType: "social", isRequired: false, isUnique: false, isPredefinedField: true, description: t('predefinedFieldLabels.socialLinksDescription') },
    { fieldKey: "companyPhone", label: t('predefinedFieldLabels.companyPhone'), fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "primaryContact", label: t('predefinedFieldLabels.primaryContact'), fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "companyWebsite", label: t('predefinedFieldLabels.companyWebsite'), fieldType: "url", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "secondaryContact", label: t('predefinedFieldLabels.secondaryContact'), fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "companyAddress", label: t('predefinedFieldLabels.companyAddress'), fieldType: "address_group", isRequired: false, isUnique: false, isPredefinedField: true },
  ], [t]);

  // Data Loading
  const loadData = useCallback(async () => {
      setIsLoading(true);
      try {
          const collectionRefs = {
              master: refs.master.companyRegistrationFields(),
              instance: actingAsInstanceId ? refs.instance.companyRegistrationFields(actingAsInstanceId) : null,
              subinstance: actingAsInstanceId && subInstanceId ? refs.subinstance.companyRegistrationFields(actingAsInstanceId, subInstanceId) : null
          };

          const [masterSnapshot, instanceSnapshot, subInstanceSnapshot] = await Promise.all([
              getDocs(query(collectionRefs.master, orderBy("order", "asc"))),
              collectionRefs.instance ? getDocs(query(collectionRefs.instance, orderBy("order", "asc"))) : null,
              collectionRefs.subinstance ? getDocs(query(collectionRefs.subinstance, orderBy("order", "asc"))) : null,
          ]);

          const masterFields = new Map(masterSnapshot.docs.map(d => [d.id, { ...d.data(), id: d.id } as FieldConfig]));
          const instanceFields = instanceSnapshot ? new Map(instanceSnapshot.docs.map(d => [d.id, { ...d.data(), id: d.id } as FieldConfig])) : new Map();
          const subInstanceFields = subInstanceSnapshot ? new Map(subInstanceSnapshot.docs.map(d => [d.id, { ...d.data(), id: d.id } as FieldConfig])) : new Map();

          let finalFields: Map<string, FieldConfig>;
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
              if(contextType === 'master') {
                alertTitle = t('contextAlert.masterTitle');
                alertDesc = t('contextAlert.masterDescription');
              } else {
                alertTitle = t(contextType === 'instance' ? 'contextAlert.inheritingFromMasterTitle' : 'contextAlert.inheritingFromInstanceTitle');
                alertDesc = t('contextAlert.saveToCustomizeDescription');
              }
          }
          setContextAlert({ title: alertTitle, description: alertDesc });
          
          const combined = PREDEFINED_FIELDS.map((predefined, index) => {
              const existing = finalFields.get(predefined.fieldKey) || masterFields.get(predefined.fieldKey);
              const order = existing?.order ?? (index * 10);
              return { ...predefined, ...existing, order, id: predefined.fieldKey, isVisible: existing?.isVisible ?? true };
          });

          finalFields.forEach((customField, key) => {
              if (!PREDEFINED_FIELDS.some(p => p.fieldKey === key)) {
                  combined.push({ ...customField, isPredefinedField: false });
              }
          });
          
          form.reset({ fields: combined.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)) as any[] });

      } catch (e) {
          console.error(e);
          toast({ title: t('toasts.loadError'), variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  }, [contextType, actingAsInstanceId, subInstanceId, form, toast, t, PREDEFINED_FIELDS, actingAsInstanceName]);

  useEffect(() => { if (!isLoadingPermissions) loadData(); }, [isLoadingPermissions, loadData]);

  // Actions
  const onSubmit = async (data: CompanyRegistrationFormSchemaType) => {
    setIsSaving(true);
    try {
        const targetRef = contextType === 'subinstance' ? refs.subinstance.companyRegistrationFields(actingAsInstanceId!, subInstanceId!) :
                          contextType === 'instance' ? refs.instance.companyRegistrationFields(actingAsInstanceId!) : refs.master.companyRegistrationFields();
        
        const batch = writeBatch(db);
        const isCustomPayload = contextType !== 'master';

        data.fields.forEach((field, index) => {
            const { id, ...fieldData } = field;
            const docRef = doc(targetRef, field.fieldKey);
            batch.set(docRef, { 
                ...fieldData, 
                order: index * 10, 
                updatedAt: serverTimestamp(),
                customized: isCustomPayload,
                createdAt: field.createdAt || serverTimestamp()
            }, { merge: true });
        });

        await batch.commit();
        toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDescription') });
        form.reset(data, { keepValues: true, keepDirty: false });
        if(isCustomPayload) setIsCustom(true);
    } catch (e) {
        console.error(e);
        toast({ title: t('toasts.saveError'), variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const onRevert = async () => {
      if (contextType === 'master') return;
      setIsReverting(true);
      try {
          const targetRef = contextType === 'subinstance' ? refs.subinstance.companyRegistrationFields(actingAsInstanceId!, subInstanceId!) : refs.instance.companyRegistrationFields(actingAsInstanceId!); 
          const snapshot = await getDocs(targetRef);
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          await loadData();
          toast({ title: t('toasts.revertSuccess') });
      } catch (e) {
          console.error(e);
          toast({ title: t('toasts.revertError'), variant: "destructive" });
      } finally {
          setIsReverting(false);
      }
  };

  const onAddNewField = () => {
    const newKey = `custom_${Date.now()}`;
    append({
      id: newKey, fieldKey: newKey, label: t('newFieldDefaultLabel'), fieldType: "text",
      isVisible: true, isRequired: false, isUnique: false, order: (fields.length + 1) * 10,
      isPredefinedField: false, description: "", 
      // validationConfig e createdAt/updatedAt são opcionais e serão adicionados se necessário pelo backend ou outras lógicas
    } as any);
    setOpenAccordion(prev => [...prev, newKey]);
  };

  const onDeleteField = async (index: number) => {
    const field = form.getValues(`fields.${index}`);
    if (field.isPredefinedField) return;
    try {
        const targetRef = contextType === 'subinstance' ? refs.subinstance.companyRegistrationFields(actingAsInstanceId!, subInstanceId!) :
                          contextType === 'instance' ? refs.instance.companyRegistrationFields(actingAsInstanceId!) : refs.master.companyRegistrationFields();
        await deleteDoc(doc(targetRef, field.fieldKey));
        remove(index);
        toast({ title: t('toasts.deleteSuccess') });
    } catch (e) {
        console.error(e);
        toast({ title: t('toasts.deleteError'), variant: 'destructive' });
    }
  };
  
  const onSortEnd = (newItems: any[]) => {
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
