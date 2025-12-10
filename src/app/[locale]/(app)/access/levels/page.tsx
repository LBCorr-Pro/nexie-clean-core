// src/app/[locale]/(app)/access/levels/page.tsx
import React from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import getQueryClient from '@/lib/get-query-client';
import { refs } from '@/lib/firestore-refs';
import { getDocs, query } from 'firebase/firestore';
import { AccessLevelTemplate } from './types'; // We'll create this type definition file
import { AccessLevelsTemplateClient } from './components/access-levels-template-client'; // The main client component
import { PageHeader } from '@/components/layout/page-header';
import { getTranslations } from 'next-intl/server';

// The query key for react-query
export const queryKey = ['access-level-templates'];

async function getTemplates() {
  const templatesQuery = query(refs.master.accessLevelTemplates());
  const snapshot = await getDocs(templatesQuery);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AccessLevelTemplate[];
}

export default async function AccessLevelsTemplatePage() {
  const t = await getTranslations('AccessLevels');
  const queryClient = getQueryClient();

  // Pre-fetch the data on the server
  await queryClient.prefetchQuery({
    queryKey: queryKey,
    queryFn: getTemplates,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full">
        <PageHeader
          title={t('templates.pageTitle')}
          description={t('templates.pageDescription')}
        />
        <AccessLevelsTemplateClient />
      </div>
    </HydrationBoundary>
  );
}
