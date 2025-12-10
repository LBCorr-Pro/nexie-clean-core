// src/components/shared/form/LanguageSelect.tsx
"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languages } from '@/lib/data/languages';
import { useTranslations } from 'next-intl';

interface LanguageSelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ value, onChange, disabled }) => {
  const t = useTranslations('generalSettings');
  return (
    <Select
      onValueChange={onChange}
      value={value || ''}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('regionalizationSection.languagePlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {languages.map(lang => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
