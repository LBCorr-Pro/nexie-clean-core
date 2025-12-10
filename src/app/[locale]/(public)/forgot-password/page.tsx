
"use client";

import { useTranslations } from "next-intl";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNxForgotPasswordHandler } from "@/hooks/use-nx-forgot-password-handler"; // Hook corrigido

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPasswordPage');
  const { form, onSubmit, isSubmitting, isSuccess } = useNxForgotPasswordHandler(); // Uso do hook corrigido

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{isSuccess ? t('success.description') : t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center">
              <Icon name="checkCircle" className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4">{t('success.message')}</p>
            </div>
          ) : (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t('form.submitting') : t('form.submit')}
                </Button>
              </form>
            </FormProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
