// src/components/shared/form/TimezoneSelect.tsx
"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timezones } from '@/lib/data/timezones';
import { useTranslations } from 'next-intl';

interface TimezoneSelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange, disabled }) => {
  const t = useTranslations('generalSettings');
  return (
    <Select
      onValueChange={onChange}
      value={value || ''}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('regionalizationSection.timezonePlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {timezones.map(tz => (
          <SelectItem key={tz.value} value={tz.value}>
            {tz.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
