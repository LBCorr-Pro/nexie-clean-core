
"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNxVerifyEmailHandler } from '@/hooks/use-nx-verify-email-handler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VerifyEmailPage() {
  const t = useTranslations('verifyEmailPage');
  
  // CORREÇÃO: O hook retorna `status` e `error`, não `verificationStatus` e `errorMessage`.
  // A função `resendVerificationEmail` também foi removida do hook simplificado.
  const { status, error, handleVerifyEmail } = useNxVerifyEmailHandler();
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'verifying' && <Icon name="loader" className="mx-auto h-16 w-16 animate-spin" />}
          {status === 'success' && <Icon name="checkCircle" className="mx-auto h-16 w-16 text-green-500" />}
          {status === 'error' && <Icon name="alertCircle" className="mx-auto h-16 w-16 text-destructive" />}

          <CardTitle className="mt-4">
            {status === 'verifying' && t('verifying.title')}
            {status === 'success' && t('verified.title')}
            {status === 'error' && t('error.title')}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && t('verifying.description')}
            {status === 'success' && t('verified.description')}
            {/* Usa a variável `error` do hook */}
            {status === 'error' && (error || t('error.description'))}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* A funcionalidade de reenvio foi removida para corrigir o erro de build */}
          {status === 'error' && (
            <div className="mt-4 flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground">{t('tryAgainPrompt')}</p>
                <Button onClick={() => handleVerifyEmail()} >
                  {t('tryAgainButton')}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
