// src/app/[locale]/(app)/profile/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { BackButton } from '@/components/ui/back-button';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { UserForm } from '@/app/[locale]/(app)/users/components/UserForm';

export default function ProfilePage() {
    const t = useTranslations('profilePage');
    const { user, loading } = useAuthContext();
    const params = useParams();
    const locale = params.locale as string;

    return (
        <div className="space-y-6">
            <Card className="shadow-xl">
                <CardHeader className="relative">
                    <BackButton href={`/${locale}/dashboard`} className="absolute right-6 top-3"/>
                    <div className="pt-2"> 
                        <CardTitle className="section-title !border-none !pb-0">
                            <UserCog className="section-title-icon"/>
                            {t('editTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('editDescription')}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : user ? (
                        // O UserForm em modo de edição, para o usuário logado.
                        <UserForm isEditMode={true} userId={user.uid} />
                    ) : (
                        <p>{t('errorLoadingUser')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
