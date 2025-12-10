// src/app/[locale]/(app)/access/levels/components/access-levels-template-client.tsx
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKey } from '../page';
import { AccessLevelTemplate } from '../types';
import { DataTable } from './data-table';

export function AccessLevelsTemplateClient() {

  const { data: templates, isLoading } = useQuery<AccessLevelTemplate[]>({
    queryKey: queryKey,
  });

  if (isLoading || !templates) {
    // You can return a loading spinner or some placeholder here
    return <div>Loading...</div>;
  }

  return (
    <DataTable
        data={templates}
    />
  );
}
