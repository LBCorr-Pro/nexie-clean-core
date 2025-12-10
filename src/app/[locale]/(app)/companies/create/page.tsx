// src/app/[locale]/(app)/companies/create/page.tsx
"use client";

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { BackButton } from '@/components/ui/back-button';
import { CompanyForm } from '../components/CompanyForm';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreateCompanyPage() {
    const t = useTranslations('companyManagement');
    const params = useParams();
    const locale = params.locale as string;
    const { hasPermission, isLoadingPermissions } = useUserPermissions();

    if (isLoadingPermissions) {
        return <Skeleton className="w-full h-64" />;
    }

    if (!hasPermission('master.companies.create')) {
        return <AccessDenied />;
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-xl">
                <CardHeader className="relative">
                    <BackButton href={`/${locale}/companies`} className="absolute right-6 top-3"/>
                    <div className="pt-2"> 
                        <CardTitle className="section-title !border-none !pb-0">
                            <Briefcase className="section-title-icon" />
                            {t('createTitle')}
                        </CardTitle>
                        <CardDescription>{t('createDescription')}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <CompanyForm isEditMode={false} />
                </CardContent>
            </Card>
        </div>
    );
}
