// src/app/[locale]/(app)/users/create/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { UserForm } from '../components/UserForm';
import { BackButton } from '@/components/ui/back-button';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function CreateGlobalUserPage() {
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations('userManagement');

    return (
        <div className="space-y-6">
            <Card className="shadow-xl">
                <CardHeader className="relative">
                    <BackButton href={`/${locale}/users`} className="absolute right-6 top-3"/>
                    <div className="pt-2"> 
                        <CardTitle className="section-title !border-none !pb-0">
                            <UserPlus className="section-title-icon"/>
                            {t('createTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('createDescription')}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Renderiza o UserForm em modo de criação */}
                    <UserForm isEditMode={false} />
                </CardContent>
            </Card>
        </div>
    );
}