// src/components/theme-switcher.tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop, Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/nx-use-toast';
import { useAuthContext } from "@/context/AuthContext";
import { useNxAppearance } from "@/hooks/use-nx-appearance";

export function ThemeSwitcher({ color }: { color?: string }) {
  const { setTheme } = useTheme();
  const { user: currentUser, loading: isAuthLoading } = useAuthContext();
  const t = useTranslations('theme');
  const tPrefs = useTranslations('accountPreferencesPage');
  const { toast } = useToast(); 

  const { isSaving, saveAppearanceSettings } = useNxAppearance();

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (currentUser) {
        const result = await saveAppearanceSettings({ themePreference: newTheme });
        if (result.success) {
            toast({ title: tPrefs('toasts.saveSuccessTitle'), description: tPrefs('toasts.saveSuccessDesc') });
        } else {
            const errorDescription = 'error' in result && result.error ? result.error : 'Unknown error';
            toast({ title: tPrefs('toasts.saveErrorTitle'), description: errorDescription, variant: 'destructive' });
        }
    }
  };

  const isLoading = isAuthLoading || isSaving;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="theme-switcher-button" style={{ color: color }}>
          {isLoading ? <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" /> : (
            <>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")} disabled={isLoading}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")} disabled={isLoading}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")} disabled={isLoading}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>{t('system')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
