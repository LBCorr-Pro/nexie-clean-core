// src/components/auth/login-form.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LogIn, Mail, Lock, AlertTriangle } from "lucide-react";
import { AccessMethods } from '@/hooks/use-nx-login-page-loader';
import { useNxLoginHandler } from '@/hooks/use-nx-login-handler';
import { Icon } from '@/components/ui/icon';

interface LoginFormProps {
  callbackUrl?: string;
  accessMethods?: AccessMethods;
}

export function LoginForm({
  callbackUrl,
  accessMethods,
}: LoginFormProps) {

  const t = useTranslations('loginPage');
  
  const { form, handleEmailLogin, handleGoogleLogin, isSubmitting, authError } = useNxLoginHandler({ callbackUrl });

  return (
    <Form {...form}>
      {/* O formulário agora usa form.handleSubmit, que previne o envio padrão do navegador (GET) e usa a lógica de POST definida no hook. */}
      <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-4">
        {authError && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('errors.loginFailed')}</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
            </Alert>
        )}

        <fieldset disabled={isSubmitting} className="space-y-4">
          {(accessMethods?.allowEmail ?? true) && (
            <>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email" className="flex items-center">
                      <Mail className="h-4 w-4 mr-2"/>{t('emailLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...field} autoComplete="email" />
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
                    <FormLabel htmlFor="password" className="flex items-center">
                      <Lock className="h-4 w-4 mr-2"/>{t('passwordLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input id="password" type="password" placeholder={t('passwordPlaceholder')} {...field} autoComplete="current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox id="rememberMe" checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    {t('rememberMeLabel')}
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link href="/forgot-password" className="text-sm underline">{t('forgotPasswordLink')}</Link>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            {(accessMethods?.allowEmail ?? true) && (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {t('loginButton')}
              </Button>
            )}
            {(accessMethods?.allowGoogle) && (
              <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon name="google" className="mr-2 h-4 w-4"/>}
                {t('loginWithGoogleButton')}
              </Button>
            )}
          </div>

        </fieldset>
      </form>
    </Form>
  );
}
