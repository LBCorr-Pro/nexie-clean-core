// src/app/[locale]/(app)/users/user/[userId]/edit/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { UserForm } from '../../../components/UserForm'; // Ajustado para o caminho correto do componente de formulário
import { BackButton } from '@/components/ui/back-button';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Esta página agora é um Client Component simples.
// Sua única responsabilidade é renderizar o UserForm em modo de edição.
export default function EditUserClientPage() {
    const t = useTranslations('userManagement');
    const params = useParams();
    const userId = params.userId as string;
    const locale = params.locale as string;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="relative">
                     <BackButton href={`/${locale}/users`} className="absolute right-6 top-3"/>
                     <div className="pt-2">
                        <CardTitle className="section-title !border-none !pb-0">
                            <UserCog className="section-title-icon" />
                            {t('editTitle')}
                        </CardTitle>
                        <CardDescription>{t('editDescription')}</CardDescription>
                     </div>
                </CardHeader>
                <CardContent>
                    {/* O UserForm agora tem toda a lógica interna para buscar o usuário pelo ID */}
                    <UserForm isEditMode={true} userId={userId} />
                </CardContent>
            </Card>
        </div>
    );
}
