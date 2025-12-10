// src/components/shared/form/CurrencySelect.tsx
"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencies } from '@/lib/data/currencies';
import { useTranslations } from 'next-intl';

interface CurrencySelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({ value, onChange, disabled }) => {
  const t = useTranslations('generalSettings');
  return (
    <Select
      onValueChange={onChange}
      value={value || ''}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('regionalizationSection.currencyPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {currencies.map(curr => (
          <SelectItem key={curr.value} value={curr.value}>
            {curr.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
