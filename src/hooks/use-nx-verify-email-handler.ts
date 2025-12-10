// src/hooks/use-nx-verify-email-handler.ts
"use client";

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';
import { applyActionCode, getAuth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

const auth = getAuth();

export function useNxVerifyEmailHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useTranslations('auth.verifyEmail');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const oobCode = searchParams.get('oobCode');

  // CORREÇÃO: O useEffect foi removido. A verificação agora é uma ação explícita.
  const handleVerifyEmail = useCallback(async () => {
    if (!oobCode) {
      setStatus('error');
      setError(t('errors.noCode'));
      return;
    }

    // Impede a re-execução se já estiver verificando ou se já teve sucesso.
    if (status === 'verifying' || status === 'success') return;

    setStatus('verifying');
    setError(null);

    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
      toast({ 
        title: t('success.title'), 
        description: t('success.description'),
        duration: 5000, 
      });
      // O redirecionamento pode ser tratado aqui ou no componente que usa o hook.
      setTimeout(() => router.push('/login'), 5000);
    } catch (err: any) {
      const errorCode = err.code || 'auth/internal-error';
      const errorMessageKey = `errors.${errorCode.replace('auth/', '')}` as any;
      const errorMessage = t(errorMessageKey, { default: t('errors.default') });
      setError(errorMessage);
      setStatus('error');
      toast({ 
        variant: 'destructive', 
        title: t('errors.title'), 
        description: errorMessage 
      });
    }
  }, [oobCode, router, t, toast, status]); // Adicionado `status` para evitar re-execução

  // Mocking das funções que a UI pode esperar, mantendo a consistência
  const resendVerificationEmail = () => {};
  const isSending = false;

  // A página que usar este hook será responsável por chamar handleVerifyEmail quando apropriado,
  // por exemplo, dentro de um useEffect no nível da página.
  /*
    Exemplo na página:
    const { handleVerifyEmail, ... } = useNxVerifyEmailHandler();
    useEffect(() => {
      handleVerifyEmail();
    }, [handleVerifyEmail]);
  */

  return { 
    status, 
    error, 
    t, 
    handleVerifyEmail, 
    resendVerificationEmail, 
    isSending, 
    oobCode, // Expõe o código para que o componente possa decidir se chama a verificação
  };
}
