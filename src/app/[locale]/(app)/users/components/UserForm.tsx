// src/app/[locale]/(app)/users/components/UserForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/nx-use-toast';
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { Timestamp, getDoc, getDocs, query, orderBy, doc } from 'firebase/firestore';

import { createUserAction, updateUserAction } from '@/lib/actions/user-actions';
import { refs } from '@/lib/firestore-refs';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from "@/components/ui/skeleton";
import { CardFooter } from '@/components/ui/card';
import { Loader2, Save, MapPin, Mail, Smartphone, Building, Ticket, Lock, Tag, Camera, FileText, Link2 as LinkIconLucide, Languages, Clock, Coins, UserCog, CalendarDays, Users as GenderIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// (Keep all interface definitions: FieldConfig, DbFieldConfig, etc.)
// (Keep PREDEFINED_FIELDS_META array)

interface UserFormProps {
  isEditMode: boolean;
  userId?: string;
}

// Helper to create a FormData object from form data, including tenantId
const createFormData = (data: Record<string, any>, tenantId: string) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    // Note: This is a simplified conversion. Complex objects might need different handling.
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  formData.append('tenantId', tenantId);
  return formData;
};

export function UserForm({ isEditMode, userId }: UserFormProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const t = useTranslations('userManagement');
  const { actingAsInstanceId } = useInstanceActingContext();

  // Determine the current tenant ID. Default to 'master' if no instance is being acted upon.
  const tenantId = useMemo(() => actingAsInstanceId || 'master', [actingAsInstanceId]);

  const [fieldConfigs, setFieldConfigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Server Action state management
  const [createState, createAction] = useFormState(createUserAction, { success: false });
  const [updateState, updateAction] = useFormState(updateUserAction.bind(null, userId || ''), { success: false });
  const isSaving = (createState as any)?.isSubmitting || (updateState as any)?.isSubmitting; // A way to track loading state from action

  const dynamicSchema = useMemo(() => {
    // ... (Schema generation logic remains the same)
    return z.object({});
  }, []);

  const form = useForm({ resolver: zodResolver(dynamicSchema), mode: "onBlur" });

  useEffect(() => {
    async function fetchSetupData() {
        // ... (Data fetching logic remains the same)
    }
    fetchSetupData();
  }, [isEditMode, userId, actingAsInstanceId, form, toast, t]);
  
  // Effect to handle feedback from Server Actions
  useEffect(() => {
    const state = isEditMode ? updateState : createState;
    if (state.message) {
      if (state.success) {
        toast({ title: state.message });
        router.push(`/${locale}/users`);
      } else {
        toast({ title: "Erro", description: state.message, variant: "destructive" });
      }
    }
    if (state.errors) {
        // You can also handle field-specific errors here
        console.error("Validation Errors:", state.errors);
    }
  }, [createState, updateState, isEditMode, toast, router, locale]);
  

  const onSubmit = async (data: Record<string, any>) => {
    const formData = createFormData(data, tenantId);
    if (isEditMode) {
      updateAction(formData);
    } else {
      createAction(formData);
    }
  };

  // ... (JSX for form, fields, skeleton, etc. remains largely the same)
  // The key change is the form's onSubmit handler.

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>;

  return (
    <FormProvider {...form}>
       {/* The form now calls the simplified onSubmit function */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         {/* ... (All the FormField, Controller, Input components remain the same) ... */}
         
        <CardFooter className="px-0 pt-6">
            <div className="flex w-full justify-end">
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    {isEditMode ? t('saveChangesButton') : t('saveUserButton')}
                </Button>
            </div>
        </CardFooter>
      </form>
    </FormProvider>
  );
}
