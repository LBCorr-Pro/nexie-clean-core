// src/hooks/use-nx-login-handler.ts
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { createSessionCookieAction } from '@/lib/actions/auth-actions';
import { useNxLoginPageLoader } from './use-nx-login-page-loader';
import { useFirebase } from '@/lib/firebase';

// --- FORM SCHEMA ---
const getLoginSchema = (t: (key: string) => string) => {
    return z.object({
      email: z.string().email(t('validation.invalidEmail')),
      password: z.string().min(1, t('validation.passwordRequired')),
      rememberMe: z.boolean().optional(),
    });
};

export type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;

interface UseNxLoginHandlerProps {
  callbackUrl?: string;
}

export function useNxLoginHandler({ callbackUrl }: UseNxLoginHandlerProps) {
  const tAuth = useTranslations('auth');
  const tLogin = useTranslations('loginPage');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const { app } = useFirebase();
  // `tenantId` is now `undefined` until the check is complete.
  const { handleRedirect, tenantId } = useNxLoginPageLoader();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loginSchema = getLoginSchema(tAuth);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const handleSuccessfulLogin = async (idToken: string, rememberMe: boolean) => {
    const result = await createSessionCookieAction(idToken, tenantId, rememberMe);

    if (result.success) {
      toast({
        title: tLogin('loginSuccessTitle'),
        description: tLogin('loginSuccessDescription'),
      });
      router.refresh(); // Crucial to update server-side session state
      handleRedirect(locale, callbackUrl);
    } else {
      throw new Error(result.error || tAuth('errors.default'));
    }
  };

  const handleError = (error: any) => {
    const errorMessage = error.code === 'auth/invalid-credential' 
      ? tAuth('errors.invalidCredentials')
      : (error.message || tAuth('errors.default'));

    setAuthError(errorMessage);
    toast({
        variant: 'destructive',
        title: tAuth('loginPage.loginFailed'),
        description: errorMessage,
    });
  };

  const handleEmailLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setAuthError(null);

    if (tenantId === undefined) {
        const errorMessage = "Verificando informações... Por favor, tente novamente em alguns segundos.";
        setAuthError(errorMessage);
        toast({ variant: 'destructive', title: "Aguarde", description: errorMessage });
        setIsSubmitting(false);
        return;
    }

    try {
      const localAuth = getAuth(app);
      localAuth.tenantId = tenantId;
      
      const userCredential = await signInWithEmailAndPassword(localAuth, data.email, data.password);
      const idToken = await userCredential.user.getIdToken();
      await handleSuccessfulLogin(idToken, data.rememberMe || false);

    } catch (error: any) {
        handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setAuthError(null);

    if (tenantId === undefined) {
        const errorMessage = "Verificando informações... Por favor, tente novamente em alguns segundos.";
        setAuthError(errorMessage);
        toast({ variant: 'destructive', title: "Aguarde", description: errorMessage });
        setIsSubmitting(false);
        return;
    }

    try {
      const localAuth = getAuth(app);
      localAuth.tenantId = tenantId;
      const provider = new GoogleAuthProvider();
      
      const userCredential = await signInWithPopup(localAuth, provider);
      const idToken = await userCredential.user.getIdToken();
      await handleSuccessfulLogin(idToken, form.getValues('rememberMe') || false);

    } catch (error: any) {
        handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginDisabled = isSubmitting || tenantId === undefined;

  return {
    form,
    handleEmailLogin,
    handleGoogleLogin,
    isSubmitting: isLoginDisabled,
    authError,
  };
}
