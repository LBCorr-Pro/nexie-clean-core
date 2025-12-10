// src/components/shared/form/TextEffectsControl.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPickerInput } from './ColorPickerInput';
import { Slider } from '@/components/ui/slider';
import { WandSparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TextEffectsControlProps {
  prefix: string;
  t: ReturnType<typeof useTranslations<any>>;
}

const textEffects = [
  { value: 'none', labelKey: 'none' },
  { value: 'gradient', labelKey: 'gradient' },
  { value: 'shadow', labelKey: 'shadow' },
  { value: 'neon', labelKey: 'neon' },
  { value: 'emboss', labelKey: 'emboss' },
  { value: 'deboss', labelKey: 'deboss' },
];

export const TextEffectsControl: React.FC<TextEffectsControlProps> = ({ prefix, t }) => {
  const { control } = useFormContext();
  const effect = useWatch({ control, name: `${prefix}Effect` });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={control}
        name={`${prefix}Effect`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><WandSparkles className="mr-2 h-4 w-4 text-primary/80" />{t('effects.label')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'none'}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {textEffects.map(e => <SelectItem key={e.value} value={e.value}>{t(`effects.options.${e.labelKey}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              {t('effects.description')}
            </FormDescription>
          </FormItem>
        )}
      />

      {effect === 'gradient' && (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">{t('gradient.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller name={`${prefix}TextColor1`} control={control} render={({ field }) => <ColorPickerInput label={t('gradient.color1')} value={field.value} onValueChange={field.onChange} />} />
                <Controller name={`${prefix}TextColor2`} control={control} render={({ field }) => <ColorPickerInput label={t('gradient.color2')} value={field.value} onValueChange={field.onChange} />} />
            </div>
        </div>
      )}

      {effect === 'shadow' && (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">{t('shadow.title')}</h4>
            <Controller name={`${prefix}ShadowColor`} control={control} render={({ field }) => <ColorPickerInput label={t('shadow.color')} value={field.value} onValueChange={field.onChange} />} />
        </div>
      )}

      {effect === 'neon' && (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">{t('neon.title')}</h4>
            <Controller name={`${prefix}GlowColor`} control={control} render={({ field }) => <ColorPickerInput label={t('neon.glowColor')} value={field.value} onValueChange={field.onChange} />} />
             <FormField
                control={control}
                name={`${prefix}GlowStrength`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('neon.glowStrength')}</FormLabel>
                        <div className="flex items-center gap-4">
                            <FormControl>
                                <Slider
                                    value={[field.value ?? 4]}
                                    onValueChange={(val) => field.onChange(val[0])}
                                    min={1} max={16} step={1}
                                />
                            </FormControl>
                            <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{field.value ?? 4}px</span>
                        </div>
                    </FormItem>
                )}
            />
        </div>
      )}
    </div>
  );
};
