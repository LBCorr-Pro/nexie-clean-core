// src/components/language-switcher.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/nx-use-toast';
import { useTranslations } from 'next-intl';
import { useAuthContext } from "@/context/AuthContext";
import { useNxAppearance } from "@/hooks/use-nx-appearance";

export function LanguageSwitcher({ color }: { color?: string }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = params.locale as string;
  const t = useTranslations('accountPreferencesPage');

  const { isSaving, saveAppearanceSettings, isLoading: isAppearanceLoading } = useNxAppearance();
  const { user: currentUser, loading: isAuthLoading } = useAuthContext();
  const { toast } = useToast();
  
  // A função agora apenas salva a preferência, a navegação é feita pelo Link.
  const handleSavePreference = async (newLocale: string) => {
    if (newLocale === currentLocale || isSaving) return;

    if (currentUser) {
      const result = await saveAppearanceSettings({ language: newLocale });
      if (result.success) {
        toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDesc') });
      } else {
        const errorDescription = 'error' in result && result.error ? result.error : 'Unknown error';
        toast({ title: t('toasts.saveErrorTitle'), description: errorDescription, variant: 'destructive' });
      }
    }
  };
  
  const languages = [
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  const isLoadingEffective = isAppearanceLoading || isAuthLoading || isSaving;

  // Extrai o caminho da URL sem o locale atual.
  const currentPathWithoutLocale = pathname.startsWith(`/${currentLocale}`)
    ? pathname.substring(`/${currentLocale}`.length)
    : pathname;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="language-switcher-button" style={{ color: color }}>
          {isLoadingEffective ? <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" /> : <Globe className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Trocar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(lang => {
          // Constrói a nova URL para cada idioma.
          const newPath = `/${lang.code}${currentPathWithoutLocale || '/'}`;
          return (
            <DropdownMenuItem 
              key={lang.code} 
              asChild // Permite que o Link dentro dele controle a navegação.
              disabled={isLoadingEffective}
              className="flex justify-between items-center"
              onClick={() => handleSavePreference(lang.code)} // Salva a preferência ao clicar
            >
              <Link href={newPath}>
                  <span>{lang.label}</span>
                  {currentLocale === lang.code && <Check className="h-4 w-4" />}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
