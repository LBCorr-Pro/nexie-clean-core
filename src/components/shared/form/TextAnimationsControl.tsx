// src/components/shared/form/TextAnimationsControl.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Film, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TextAnimationsControlProps {
  prefix: string;
  t: ReturnType<typeof useTranslations<any>>;
}

const entryAnimations = [
  { value: 'none', labelKey: 'none' },
  { value: 'fadeIn', labelKey: 'fadeIn' },
  { value: 'zoomIn', labelKey: 'zoomIn' },
  { value: 'slideInUp', labelKey: 'slideInUp' },
  { value: 'slideInLeft', labelKey: 'slideInLeft' },
  { value: 'light-wipe-left-to-right-effect-text', labelKey: 'lightWipeLeft' },
  { value: 'light-wipe-diagonal-effect-n', labelKey: 'lightWipeDiagonal' },
];

const repeatAnimations = [
    { value: 'none', labelKey: 'none' },
    { value: 'pulse', labelKey: 'pulse' },
    { value: 'shimmer-diagonal', labelKey: 'shimmerDiagonal' },
    { value: 'aurora-text', labelKey: 'auroraText' },
];

export const TextAnimationsControl: React.FC<TextAnimationsControlProps> = ({ prefix, t }) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4 rounded-lg border p-4">
       <FormField
        control={control}
        name={`${prefix}Entry`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><Film className="mr-2 h-4 w-4 text-primary/80" />{t('animations.entryLabel')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'none'}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {entryAnimations.map(e => <SelectItem key={e.value} value={e.value}>{t(`animations.entryOptions.${e.labelKey}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              {t('animations.entryDescription')}
            </FormDescription>
          </FormItem>
        )}
      />
       <FormField
        control={control}
        name={`${prefix}Repeat`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><Repeat className="mr-2 h-4 w-4 text-primary/80" />{t('animations.repeatLabel')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'none'}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {repeatAnimations.map(e => <SelectItem key={e.value} value={e.value}>{t(`animations.repeatOptions.${e.labelKey}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              {t('animations.repeatDescription')}
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};
