// src/components/ui/access-denied.tsx
"use client";

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from 'lucide-react';

export function AccessDenied({ message }: { message?: string }) {
  const t = useTranslations('common');

  return (
    <Card className="m-auto mt-10 max-w-md text-center">
      <CardHeader>
        <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <Lock className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <CardTitle className="mt-4">{t('accessDenied.title')}</CardTitle>
        <CardDescription>
          {message || t('accessDenied.description')}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
