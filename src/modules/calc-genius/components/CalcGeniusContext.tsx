// src/modules/calc-genius/components/CalcGeniusContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { db } from '@/lib/firebase';
import { onSnapshot, query, orderBy, doc, writeBatch, getDoc, setDoc, serverTimestamp, updateDoc, deleteDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { refs } from '@/lib/firestore-refs';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { Field, Group, Formula, FieldFormData, FormulaFormData, GroupFormData } from '../types';

// --- CONTEXT DEFINITION ---

interface CalcGeniusContextType {
  // State
  fields: Field[];
  groups: Group[];
  formulas: Formula[];
  isLoading: boolean;
  isSaving: boolean;

  // UI State
  showFieldDialog: boolean;
  editingField: Field | Partial<FieldFormData> | null;
  openFieldDialog: (field?: Field | Partial<FieldFormData> | null) => void;
  closeFieldDialog: () => void;
  showFormulaDialog: boolean;
  editingFormula: Formula | null;
  openFormulaDialog: (formula?: Formula) => void;
  closeFormulaDialog: () => void;

  // Permissions
  canManageGroups: boolean;
  canManageFields: boolean;
  canManageFormulas: boolean;
  
  // Actions
  saveGroup: (data: GroupFormData, editingGroup: Group | null) => Promise<{ success: boolean; error?: string }>;
  deleteGroup: (docId: string) => Promise<void>;
  saveGroupOrder: (orderedGroups: Group[]) => Promise<void>;
  saveField: (data: FieldFormData, editingField: Field | null) => Promise<{ success: boolean; error?: string }>;
  deleteFields: (fieldIds: string[]) => Promise<void>;
  bulkUpdateFields: (fieldIds: string[], bulkData: any) => Promise<void>;
  saveFormula: (data: FormulaFormData, editingFormula: Formula | null) => Promise<{ success: boolean; error?: string }>;
  deleteFormulas: (formulaIds: string[]) => Promise<void>;
  bulkUpdateFormulas: (formulaIds: string[], bulkData: any) => Promise<void>;
}

const CalcGeniusContext = createContext<CalcGeniusContextType | undefined>(undefined);

export const useCalcGenius = () => {
  const context = useContext(CalcGeniusContext);
  if (!context) throw new Error('useCalcGenius must be used within a CalcGeniusProvider');
  return context;
};

// --- PROVIDER COMPONENT ---

export const CalcGeniusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTranslations('calcGenius');
  const commonT = useTranslations('common');
  const { toast } = useToast();
  const { isActingAsMaster } = useInstanceActingContext();
  const { hasPermission } = useUserPermissions();

  // Permissions
  const canManageGroups = hasPermission('module.calc-genius.groups.manage');
  const canManageFields = hasPermission('module.calc-genius.fields.manage');
  const canManageFormulas = hasPermission('module.calc-genius.formulas.manage');

  // State
  const [fields, setFields] = useState<Field[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [isLoadingFormulas, setIsLoadingFormulas] = useState(true);
  const isLoading = isLoadingGroups || isLoadingFields || isLoadingFormulas;
  
  const [isSaving, setIsSaving] = useState(false);

  // UI State
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<Field | Partial<FieldFormData> | null>(null);
  const [showFormulaDialog, setShowFormulaDialog] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);

  // Data Fetching
  useEffect(() => {
    if (!isActingAsMaster) {
      setIsLoadingGroups(false);
      setIsLoadingFields(false);
      setIsLoadingFormulas(false);
      setFields([]);
      setGroups([]);
      setFormulas([]);
      return;
    }

    // CORREÇÃO: As chamadas para `refs` foram movidas para dentro do `useEffect`.
    // Isso garante que a instância do Firestore (`db`) esteja inicializada no cliente
    // antes que as referências de coleção sejam criadas, resolvendo o erro 'Cannot read properties of undefined'.
    const qGroups = query(refs.master.calcGeniusGroupsCol(), orderBy("order", "asc"));
    const unsubGroups = onSnapshot(qGroups, (snap) => {
        const data = snap.docs.map(doc => ({ ...doc.data(), docId: doc.id } as Group));
        setGroups(data);
        setIsLoadingGroups(false);
    }, (error) => {
        console.error("Error fetching groups:", error);
        toast({ title: "Error", description: "Could not fetch groups.", variant: "destructive" });
        setIsLoadingGroups(false);
    });

    const qFields = query(refs.master.calcGeniusFieldsCol(), orderBy("label", "asc"));
    const unsubFields = onSnapshot(qFields, (snap) => {
        const data = snap.docs.map(doc => ({ ...doc.data(), docId: doc.id } as Field));
        setFields(data);
        setIsLoadingFields(false);
    }, (error) => {
        console.error("Error fetching fields:", error);
        toast({ title: "Error", description: "Could not fetch fields.", variant: "destructive" });
        setIsLoadingFields(false);
    });
    
    const qFormulas = query(refs.master.calcGeniusFormulasCol(), orderBy("label", "asc"));
    const unsubFormulas = onSnapshot(qFormulas, (snap) => {
        const data = snap.docs.map(doc => ({ ...doc.data(), docId: doc.id } as Formula));
        setFormulas(data);
        setIsLoadingFormulas(false);
    }, (error) => {
        console.error("Error fetching formulas:", error);
        toast({ title: "Error", description: "Could not fetch formulas.", variant: "destructive" });
        setIsLoadingFormulas(false);
    });

    return () => {
      unsubGroups();
      unsubFields();
      unsubFormulas();
    };
  }, [isActingAsMaster, toast]);

  // DIALOG CONTROLS
  const openFieldDialog = (field?: Field | Partial<FieldFormData> | null) => { setEditingField(field || null); setShowFieldDialog(true); };
  const closeFieldDialog = () => { setEditingField(null); setShowFieldDialog(false); };
  const openFormulaDialog = (formula?: Formula) => { setEditingFormula(formula || null); setShowFormulaDialog(true); };
  const closeFormulaDialog = () => { setEditingFormula(null); setShowFormulaDialog(false); };

  // --- GROUP ACTIONS ---
  const saveGroup = async (data: GroupFormData, editingGroup: Group | null): Promise<{ success: boolean; error?: string }> => {
      if (!canManageGroups) return { success: false, error: t('toasts.permissionDenied') };
      setIsSaving(true);
      try {
          const groupRef = editingGroup ? refs.master.calcGeniusGroupDoc(editingGroup.docId) : doc(refs.master.calcGeniusGroupsCol());

          if (!editingGroup) {
              const slugCheck = groups.some(g => g.id === data.slug);
              if (slugCheck) return { success: false, error: t('zod.groupIdInUse') };
          }

          const payload = {
              id: editingGroup ? editingGroup.id : data.slug,
              label: data.name,
              icon: data.icon,
              order: editingGroup?.order ?? (groups.length > 0 ? Math.max(...groups.map(g => g.order)) + 1 : 0),
              colorApplyTo: data.colorApplyTo,
              useSameColor: data.isColorUnified,
              unifiedColor: data.unifiedColor,
              iconColor: data.iconColor,
              textColor: data.textColor,
              updatedAt: serverTimestamp(),
              ...(editingGroup ? {} : { createdAt: serverTimestamp() }),
          };

          await setDoc(groupRef, payload, { merge: true });
          toast({ title: editingGroup ? t('groupsTab.toasts.saveSuccessTitle') : t('groupsTab.toasts.createSuccessTitle') });
          return { success: true };
      } catch (e: any) {
          toast({ title: commonT('errors.unexpected'), description: e.message, variant: 'destructive' });
          return { success: false, error: e.message };
      } finally {
          setIsSaving(false);
      }
  };
  
  const deleteGroup = async (docId: string) => {
      if (!canManageGroups) return;
      setIsSaving(true);
      try {
          await deleteDoc(refs.master.calcGeniusGroupDoc(docId));
          toast({ title: t('groupsTab.toasts.deleteSuccessTitle') });
      } catch (e: any) {
          toast({ title: commonT('errors.unexpected'), description: e.message, variant: 'destructive' });
      } finally {
          setIsSaving(false);
      }
  };

  const saveGroupOrder = async (orderedGroups: Group[]) => {
      if (!canManageGroups) return;
      setIsSaving(true);
      const batch = writeBatch(db);
      orderedGroups.forEach((group, index) => {
          const groupRef = refs.master.calcGeniusGroupDoc(group.docId);
          batch.update(groupRef, { order: index });
      });
      try {
          await batch.commit();
          toast({ title: t('groupsTab.toasts.orderSaveSuccess') });
      } catch (e: any) {
          toast({ title: commonT('errors.unexpected'), description: e.message, variant: 'destructive' });
      } finally {
          setIsSaving(false);
      }
  };

  // --- FIELD ACTIONS ---
  const saveField = async (data: FieldFormData, editingField: Field | null): Promise<{ success: boolean, error?: string }> => {
      if (!canManageFields) return { success: false, error: t('toasts.permissionDenied') };
      setIsSaving(true);
      try {
          const fieldRef = editingField ? refs.master.calcGeniusFieldDoc(editingField.id) : doc(refs.master.calcGeniusFieldsCol());

          if (!editingField) {
              const idCheck = fields.some(f => f.id === data.id);
              if (idCheck) return { success: false, error: t('zod.fieldIdInUse') };
          }
          
          const payload = {
            ...data,
            groupIds: Array.isArray(data.groupIds) ? data.groupIds : (data.mainGroupId ? [data.mainGroupId] : []),
            updatedAt: serverTimestamp(),
            ...(editingField ? {} : { id: data.id, createdAt: serverTimestamp(), order: fields.length }),
          };
          
          await setDoc(fieldRef, payload, { merge: true });

          toast({ title: editingField ? t('fieldsTab.toasts.updateSuccess') : t('fieldsTab.toasts.createSuccess') });
          return { success: true };
      } catch (e: any) {
          toast({ title: commonT('errors.unexpected'), description: e.message, variant: 'destructive' });
          return { success: false, error: e.message };
      } finally {
          setIsSaving(false);
      }
  };

  const deleteFields = async (fieldIds: string[]) => {
      if (!canManageFields) return;
      setIsSaving(true);
      const batch = writeBatch(db);
      fieldIds.forEach(id => batch.delete(refs.master.calcGeniusFieldDoc(id)));
      try {
          await batch.commit();
          toast({ title: t('fieldsTab.toasts.deleteSuccess', { count: fieldIds.length }) });
      } catch (e: any) {
          toast({ title: commonT('errors.unexpected'), description: e.message, variant: 'destructive' });
      } finally {
          setIsSaving(false);
      }
  };
  
  const bulkUpdateFields = async (fieldIds: string[], bulkData: any) => {
    if (!canManageFields) return;
    setIsSaving(true);
    const batch = writeBatch(db);
    try {
        const updatePayload: any = { updatedAt: serverTimestamp() };
        if (bulkData.add_to_groups && bulkData.groups_to_add) {
            updatePayload.groupIds = arrayUnion(...bulkData.groups_to_add);
        }
        if (bulkData.remove_from_groups && bulkData.groups_to_remove) {
            updatePayload.groupIds = arrayRemove(...bulkData.groups_to_remove);
        }

        fieldIds.forEach(id => {
            const fieldRef = refs.master.calcGeniusFieldDoc(id);
            batch.update(fieldRef, updatePayload);
        });
        await batch.commit();
        toast({ title: t('fieldsTab.toasts.bulkUpdateSuccess') });
    } catch (e: any) {
        toast({ title: commonT('errors.unexpected'), description: e.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  // --- FORMULA ACTIONS ---
  const saveFormula = async (data: FormulaFormData, editingFormula: Formula | null): Promise<{ success: boolean; error?: string }> => {
    if (!canManageFormulas) return { success: false, error: t('toasts.permissionDenied') };
    setIsSaving(true);
    try {
        const formulaRef = editingFormula ? refs.master.calcGeniu_sFormulaDoc(editingFormula.id) : doc(refs.master.calcGeniusFormulasCol());
        
        if (!editingFormula) {
            const idCheck = formulas.some(f => f.id === data.id);
            if (idCheck) return { success: false, error: t('zod.formulaIdInUse') };
        }

        const payload = {
            ...data,
            updatedAt: serverTimestamp(),
            ...(editingFormula ? {} : { id: data.id, createdAt: serverTimestamp() }),
        };

        await setDoc(formulaRef, payload, { merge: true });
        toast({ title: editingFormula ? t('formulasTab.toasts.updateSuccess') : t('formulasTab.toasts.createSuccess') });
        return { success: true };
    } catch (e: any) {
        toast({ title: commonT('errors.unexpected'), variant: 'destructive', description: e.message });
        return { success: false, error: e.message };
    } finally {
        setIsSaving(false);
    }
  };

  const deleteFormulas = async (formulaIds: string[]) => {
    if (!canManageFormulas) return;
    setIsSaving(true);
    const batch = writeBatch(db);
    formulaIds.forEach(id => batch.delete(refs.master.calcGeniu_sFormulaDoc(id)));
    try {
        await batch.commit();
        toast({ title: t('formulasTab.toasts.deleteSuccess', { count: formulaIds.length }) });
    } catch (e: any) {
        toast({ title: commonT('errors.unexpected'), variant: 'destructive', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };

  const bulkUpdateFormulas = async (formulaIds: string[], bulkData: any) => {
    if (!canManageFormulas) return;
    setIsSaving(true);
    const batch = writeBatch(db);
    try {
        const updatePayload: any = { updatedAt: serverTimestamp() };
        if (bulkData.add_to_groups && bulkData.groups_to_add) {
            updatePayload.groupIds = arrayUnion(...bulkData.groups_to_add);
        }
        if (bulkData.remove_from_groups && bulkData.groups_to_remove) {
            updatePayload.groupIds = arrayRemove(...bulkData.groups_to_remove);
        }
        
        formulaIds.forEach(id => {
            const formulaRef = refs.master.calcGeniu_sFormulaDoc(id);
            batch.update(formulaRef, updatePayload);
        });

        await batch.commit();
        toast({ title: t('formulasTab.toasts.bulkUpdateSuccess') });
    } catch (e: any) {
        toast({ title: commonT('errors.unexpected'), variant: 'destructive', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };

  const value = {
    fields, groups, formulas, isLoading, isSaving,
    showFieldDialog, editingField, openFieldDialog, closeFieldDialog,
    showFormulaDialog, editingFormula, openFormulaDialog, closeFormulaDialog,
    canManageGroups, canManageFields, canManageFormulas,
    saveGroup, deleteGroup, saveGroupOrder,
    saveField, deleteFields, bulkUpdateFields,
    saveFormula, deleteFormulas, bulkUpdateFormulas
  };

  return <CalcGeniusContext.Provider value={value}>{children}</CalcGeniusContext.Provider>;
};
