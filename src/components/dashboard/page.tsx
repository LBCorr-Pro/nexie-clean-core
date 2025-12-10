// src/app/[locale]/(app)/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Logo from '@/../public/system-assets/logos/logo-texto-512x512.svg';
import { Icon } from '@/components/ui/icon';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/context/AuthContext';
import { useNxAppearance } from '@/hooks/use-nx-appearance'; // CORREÇÃO: Usa o novo hook

// A função para ler cookies, para ser usada apenas no lado do cliente.
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

// Componente para a caixa de debug
const DebugInfo = () => {
  const { user } = useAuthContext();
  const { appearanceSettings } = useNxAppearance(); // CORREÇÃO: Usa o novo hook
  
  // Os valores dos cookies são lidos no momento da renderização no cliente.
  const cookieTheme = getCookie('theme') || 'Não definido';
  const cookieLang = getCookie('NEXT_LOCALE') || 'Não definido';

  return (
    <div className="absolute bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-xs font-mono max-w-sm opacity-80">
      <h4 className="font-bold text-sm mb-2 border-b border-gray-600 pb-1">Debug Info</h4>
      <div className="space-y-1">
        <p><strong>User ID:</strong> {user?.uid || 'N/A'}</p>
        <p><strong>DB Theme:</strong> {appearanceSettings?.themePreference || 'N/A'}</p>
        <p><strong>DB Language:</strong> {appearanceSettings?.language || 'N/A'}</p>
        <Separator className="bg-gray-600 my-2" />
        <p><strong>Cookie Theme:</strong> {cookieTheme}</p>
        <p><strong>Cookie Language:</strong> {cookieLang}</p>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const t = useTranslations('dashboard'); // Carrega as traduções para o namespace "dashboard"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="LayoutDashboard" className="mr-2 h-6 w-6 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('welcome')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-center justify-center w-full min-h-[50vh]">
             <div className="select-none animate-zoom-in-n light-wipe-diagonal-effect-n flex items-center justify-center">
                <Logo 
                  width={512} 
                  height={512} 
                  className="max-w-[70vw] max-h-[45vh] w-auto h-auto block"
                />
            </div>
            {/* Adiciona a caixa de debug aqui, visível apenas em modo de desenvolvimento */}
            {process.env.NODE_ENV === 'development' && <DebugInfo />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Pequeno componente separador para a caixa de debug
const Separator = ({ className }: { className?: string }) => (
  <hr className={`border-t ${className}`} />
);
