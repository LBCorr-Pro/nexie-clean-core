
'use client';

import Link from 'next/link';
import { useNxRegisterHandler, RegisterFormValues } from '@/hooks/use-nx-register-handler';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck, AlertTriangle } from 'lucide-react';

export default function RegisterPage() {
  // O hook agora retorna `isLoading` em vez de `isSubmitting`
  const { form, handleRegister, isLoading, isVerificationEmailSent, t } = useNxRegisterHandler();

  // Função wrapper que o react-hook-form espera
  const onSubmit = (data: RegisterFormValues) => {
    handleRegister(data);
  };
  
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomainUrl = `https://console.firebase.google.com/u/0/project/${firebaseProjectId}/authentication/settings`;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isVerificationEmailSent ? (
            <>
             {firebaseProjectId && (
                <Alert variant="warning" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('authDomainWarning.title')}</AlertTitle>
                    <AlertDescription>
                        {t.rich('authDomainWarning.description', {
                            link: (chunks) => <Link href={authDomainUrl} target="_blank" className="font-bold underline">{chunks}</Link>
                        })}
                    </AlertDescription>
                </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emailLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('submitting') : t('submitButton')}
                </Button>
              </form>
            </Form>
            </>
          ) : (
            <Alert variant="default">
              <MailCheck className="h-4 w-4"/>
              <AlertTitle>{t('messages.verificationTitle')}</AlertTitle>
              <AlertDescription>{t('messages.verificationText')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex-col items-center gap-2">
          <p className="text-sm text-center text-muted-foreground">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t('loginLink')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
