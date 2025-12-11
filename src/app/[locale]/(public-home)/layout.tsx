// src/app/[locale]/(public-home)/layout.tsx
"use client";

import React from 'react';
import { Navbar } from "@/components/nav/navbar";

/**
 * A new dedicated layout for the main public homepage.
 * It includes the main public navbar for navigation but excludes the authenticated-app sidebar.
 */
export default function PublicHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full">
      <div className="flex flex-col">
        <Navbar />
        <main className="flex-1">
            {children}
        </main>
      </div>
    </div>
  );
}
