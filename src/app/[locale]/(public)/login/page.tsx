// src/app/[locale]/(public)/login/page.tsx
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useNxLoginPageLoader } from '@/hooks/use-nx-login-page-loader';
import { LoginForm } from '@/components/auth/login-form';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PublicLogo } from "@/components/layout/public-logo";
import { AlertTriangle } from 'lucide-react';

function LoginPageContent() {
    const t = useTranslations('loginPage');
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const { settings, isLoading: isLoadingSettings, error: settingsError } = useNxLoginPageLoader();
    
    if (isLoadingSettings) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (settingsError) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('errors.loading.title')}</AlertTitle>
                <AlertDescription>{t('errors.loading.description')}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Card className="w-full max-w-md p-6 backdrop-blur-sm bg-background/80">
            <CardHeader className="text-center">
                 <div className="flex justify-center items-center mb-6">
                   <PublicLogo />
                 </div>
                 <h1 className="text-3xl font-bold tracking-tight">{settings?.design.title || t('defaultTitle')}</h1>
                 <p className="text-muted-foreground">{settings?.design.subtitle || t('defaultSubtitle')}</p>
            </CardHeader>
            <CardContent>
                <LoginForm 
                    callbackUrl={callbackUrl}
                    accessMethods={settings?.accessMethods}
                />
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
       <Suspense fallback={<Skeleton className="h-[400px] w-full max-w-md" />}>
          <LoginPageContent />
       </Suspense>
    </div>
  );
}
