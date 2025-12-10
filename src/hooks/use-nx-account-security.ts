// src/hooks/use-nx-account-security.ts
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/nx-use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { nxChangePassword, nxChangeEmail } from '@/lib/actions/nx-firebase-actions';

export function useNxAccountSecurity() {
  const t = useTranslations('accountSecurityPage');
  const { toast } = useToast();
  const { user } = useAuthContext();

  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isEmailSaving, setIsEmailSaving] = useState(false);

  const passwordSchema = useMemo(() => z.object({
    currentPassword: z.string().min(1, t('validation.currentPasswordRequired')),
    newPassword: z.string().min(6, t('validation.newPasswordLength')),
    confirmPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: t('validation.passwordsMismatch'),
    path: ["confirmPassword"],
  }), [t]);

  const emailSchema = useMemo(() => z.object({
    newEmail: z.string().email(t('validation.invalidEmailFormat')),
    currentPasswordForEmail: z.string().min(1, t('validation.passwordForEmailRequired')),
  }), [t]);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: user?.email || "", currentPasswordForEmail: "" },
  });

  const handlePasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsPasswordSaving(true);
    try {
      await nxChangePassword(values.currentPassword, values.newPassword);
      toast({ title: t('toast.passwordSuccessTitle'), description: t('toast.passwordSuccessDesc') });
      passwordForm.reset();
    } catch (error: any) {
      const message = handleFirebaseError(error, t, passwordForm, 'currentPassword');
      toast({ title: t('toast.passwordErrorTitle'), description: message, variant: "destructive" });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (user?.email === values.newEmail) {
      toast({ title: t('toast.emailWarningTitle'), description: t('toast.emailIsSame') });
      return;
    }

    setIsEmailSaving(true);
    try {
      await nxChangeEmail(values.currentPasswordForEmail, values.newEmail);
      toast({
        title: t('toast.emailVerificationTitle'),
        description: t('toast.emailVerificationDesc', { newEmail: values.newEmail }),
        duration: 8000,
      });
      emailForm.reset({ newEmail: values.newEmail, currentPasswordForEmail: '' });
    } catch (error: any) {
      const message = handleFirebaseError(error, t, emailForm, 'currentPasswordForEmail');
      toast({ title: t('toast.emailErrorTitle'), description: message, variant: "destructive" });
    } finally {
      setIsEmailSaving(false);
    }
  };

  return {
    user,
    passwordForm,
    emailForm,
    isPasswordSaving,
    isEmailSaving,
    onPasswordSubmit: handlePasswordSubmit,
    onEmailSubmit: handleEmailSubmit,
  };
}

// Helper para centralizar o tratamento de erros do Firebase
function handleFirebaseError(error: any, t: any, form: any, passwordField: string) {
  switch (error.code) {
    case 'auth/wrong-password':
      const wrongPassMsg = t('toast.passwordErrorWrong');
      form.setError(passwordField, { type: 'manual', message: wrongPassMsg });
      return wrongPassMsg;
    case 'auth/too-many-requests':
      return t('toast.tooManyRequests');
    case 'auth/email-already-in-use':
      const emailInUseMsg = t('toast.emailInUse');
      form.setError('newEmail', { type: 'manual', message: emailInUseMsg });
      return emailInUseMsg;
    default:
      return t('toast.genericError');
  }
}
