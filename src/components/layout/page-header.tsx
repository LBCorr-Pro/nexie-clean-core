// src/components/layout/page-header.tsx
import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="mb-6 space-y-1">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h1>
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}
