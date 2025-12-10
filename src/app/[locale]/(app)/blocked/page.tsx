// src/app/[locale]/(app)/blocked/page.tsx
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { signOutAction } from '@/lib/actions/auth-actions';

interface MessageContent {
    title: string;
    description: string;
}

export default function BlockedPage() {
    const searchParams = useSearchParams();
    const t = useTranslations('BlockedPage'); // Using next-intl for translations

    const reason = searchParams.get('reason');
    const instanceName = searchParams.get('instanceName');
    const contactEmail = searchParams.get('contact');

    const messages: Record<string, MessageContent> = {
        INSTANCE_INACTIVE: {
            title: t('instanceInactive.title'),
            description: t('instanceInactive.description', { instanceName, contactEmail })
        },
        USER_INACTIVE: {
            title: t('userInactive.title'),
            description: t('userInactive.description', { instanceName, contactEmail })
        },
        NO_PROFILE: {
            title: t('noProfile.title'),
            description: t('noProfile.description')
        },
        UNKNOWN: {
            title: t('unknown.title'),
            description: t('unknown.description')
        },
    };

    const { title, description } = messages[reason || 'UNKNOWN'] || messages.UNKNOWN;

    const handleLogout = async () => {
        await signOutAction();
        window.location.href = '/'; // Redirect to home after logout
    };

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background text-center p-4">
            <div className="max-w-md w-full">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <ShieldOff className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
                <p className="text-muted-foreground mb-8 whitespace-pre-wrap">{description}</p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        {t('tryAgainButton')}
                    </Button>
                    <Button variant="destructive" onClick={handleLogout}>
                        {t('logoutButton')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
