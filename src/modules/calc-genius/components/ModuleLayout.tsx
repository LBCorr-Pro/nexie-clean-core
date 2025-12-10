// src/modules/calc-genius/components/ModuleLayout.tsx
"use client";

import React from 'react';

interface ModuleLayoutProps {
  children: React.ReactNode;
}

export function ModuleLayout({ children }: ModuleLayoutProps) {
  return (
    <div className="w-full space-y-4">
      <main>{children}</main>
    </div>
  );
}
