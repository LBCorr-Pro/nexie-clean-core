// src/hooks/use-nx-register-handler.ts
"use client";

import { useEffect, useMemo, useActionState } from 'react'; // Changed import
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// No longer need useFormState from react-dom
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { registerUserAction } from '@/lib/actions/auth-actions';

// --- FORM SCHEMA ---
const getRegisterSchema = (t: (key: string) => string) => {
  return z.object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(8, t('validation.passwordLength')),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('validation.passwordsMustMatch'),
    path: ["confirmPassword"],
  });
};

export type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;

// --- HOOK ---
export function useNxRegisterHandler() {
  const t = useTranslations('auth.register');
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const tenantId = useMemo(() => {
    const { instanceId, subInstanceId } = params as { instanceId?: string; subInstanceId?: string };
    return subInstanceId || instanceId || 'master';
  }, [params]);

  // Changed to useActionState
  const [state, action] = useActionState(registerUserAction, { success: false, message: '' });

  const registerSchema = getRegisterSchema(t);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleRegister = (data: RegisterFormValues) => {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('tenantId', tenantId);
    action(formData);
  };

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: t('messages.successTitle'), description: state.message });
        form.reset();
        const loginUrl = tenantId === 'master' ? `/${locale}/login` : `/${locale}/login/${tenantId}`;
        router.push(loginUrl);
      } else {
        toast({ variant: 'destructive', title: t('errors.title'), description: state.message });
      }
    }
  }, [state, toast, t, form, router, locale, tenantId]);

  const isLoading = form.formState.isSubmitting;
  const isVerificationEmailSent = state.success;

  return { form, handleRegister, isLoading, isVerificationEmailSent, t };
}
