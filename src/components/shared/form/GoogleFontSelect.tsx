// src/components/shared/form/GoogleFontSelect.tsx
"use client";

import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { googleFonts } from '@/lib/data/google-fonts';
import { Type } from 'lucide-react';
import Head from 'next/head';

interface GoogleFontSelectProps {
  name: string;
  label: string;
  disabled?: boolean;
}

const fontUrl = `https://fonts.googleapis.com/css2?${googleFonts
  .map(font => `family=${font.family.replace(/ /g, '+')}:wght@400;700`)
  .join('&')}&display=swap`;

export const GoogleFontSelect: React.FC<GoogleFontSelectProps> = ({ name, label, disabled }) => {
  const { control } = useFormContext();

  useEffect(() => {
    // Injeta a tag de link para as fontes do Google no head do documento
    // Isso garante que as fontes estejam disponíveis para o preview no dropdown
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      // Limpa a tag quando o componente é desmontado
      document.head.removeChild(link);
    };
  }, []);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center"><Type className="mr-2 h-4 w-4 text-primary/80" />{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ''} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma fonte..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {googleFonts.map(font => (
                <SelectItem 
                  key={font.family} 
                  value={font.family}
                >
                  <span style={{ fontFamily: `'${font.family}', ${font.category}` }}>
                    {font.family}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
