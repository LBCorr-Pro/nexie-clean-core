// src/hooks/use-nx-login-handler.ts
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
  const { handleRedirect, tenantId } = useNxLoginPageLoader();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loginSchema = getLoginSchema(tAuth);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

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

      const result = await createSessionCookieAction(idToken, tenantId, data.rememberMe || false);

      if (result.success) {
        toast({
          title: tLogin('loginSuccessTitle'),
          description: tLogin('loginSuccessDescription'),
        });
        
        // CORREÇÃO: Força a atualização do estado do servidor no cliente.
        // Isso resolve o problema de "loading infinito" na dashboard.
        router.refresh();

        // O redirecionamento pode ocorrer logo em seguida.
        handleRedirect(locale, callbackUrl);

      } else {
        throw new Error(result.error || tAuth('errors.default'));
      }

    } catch (error: any) {
        const errorMessage = error.code === 'auth/invalid-credential' 
            ? tAuth('errors.invalidCredentials')
            : (error.message || tAuth('errors.default'));

        setAuthError(errorMessage);
        toast({
            variant: 'destructive',
            title: tAuth('loginPage.loginFailed'),
            description: errorMessage,
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginDisabled = isSubmitting || tenantId === undefined;

  return {
    form,
    handleEmailLogin,
    isSubmitting: isLoginDisabled,
    authError,
  };
}
