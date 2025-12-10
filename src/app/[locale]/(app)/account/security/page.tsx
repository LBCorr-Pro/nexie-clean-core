// src/app/[locale]/(app)/account/security/page.tsx
"use client";

import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Mail, Lock, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { BackButton } from '@/components/ui/back-button';
import { useNxAccountSecurity } from '@/hooks/use-nx-account-security';
import { FormProvider } from 'react-hook-form'; // Import FormProvider

// Componente para o formulário de alteração de senha
const PasswordForm = ({ t, form, onSubmit, isSaving }: any) => (
  <Card>
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="flex items-center"><Lock className="mr-2 h-5 w-5" />{t('passwordCard.title')}</CardTitle>
          <CardDescription>{t('passwordCard.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField control={form.control} name="currentPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('passwordCard.currentPasswordLabel')}</FormLabel>
              <FormControl><Input type="password" placeholder={t('passwordCard.currentPasswordPlaceholder')} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="newPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('passwordCard.newPasswordLabel')}</FormLabel>
              <FormControl><Input type="password" placeholder={t('passwordCard.newPasswordPlaceholder')} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('passwordCard.confirmPasswordLabel')}</FormLabel>
              <FormControl><Input type="password" placeholder={t('passwordCard.confirmPasswordPlaceholder')} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" />
            {t('passwordCard.saveButton')}
          </Button>
        </CardFooter>
      </form>
    </FormProvider>
  </Card>
);

// Componente para o formulário de alteração de e-mail
const EmailForm = ({ t, form, onSubmit, isSaving, user }: any) => (
  <Card>
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5" />{t('emailCard.title')}</CardTitle>
          <CardDescription>
            {t.rich('emailCard.description', {
              email: user?.email || t('emailCard.loadingEmail'),
              strong: (chunks: ReactNode) => <strong>{chunks}</strong>
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField control={form.control} name="newEmail" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailCard.newEmailLabel')}</FormLabel>
              <FormControl><Input type="email" placeholder={t('emailCard.newEmailPlaceholder')} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="currentPasswordForEmail" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailCard.currentPasswordLabel')}</FormLabel>
              <FormControl><Input type="password" placeholder={t('emailCard.currentPasswordPlaceholder')} {...field} /></FormControl>
              <FormDescription>{t('emailCard.passwordDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" />
            {t('emailCard.saveButton')}
          </Button>
        </CardFooter>
      </form>
    </FormProvider>
  </Card>
);

export default function AccountSecurityPage() {
  const t = useTranslations("accountSecurityPage");
  const {
    user,
    passwordForm,
    emailForm,
    isPasswordSaving,
    isEmailSaving,
    onPasswordSubmit,
    onEmailSubmit,
  } = useNxAccountSecurity();

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-semibold">{t('pageTitle')}</h1>
      </div>
      <p className="text-muted-foreground -mt-4 ml-14">{t('pageDescription')}</p>

      <PasswordForm 
        t={t}
        form={passwordForm}
        onSubmit={onPasswordSubmit}
        isSaving={isPasswordSaving}
      />

      <EmailForm 
        t={t}
        form={emailForm}
        onSubmit={onEmailSubmit}
        isSaving={isEmailSaving}
        user={user}
      />
    </div>
  );
}
