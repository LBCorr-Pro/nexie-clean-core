// src/components/shared/form/ComponentStyleControls.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { GradientDirectionInput } from './GradientDirectionInput';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';

interface ComponentStyleControlsProps {
  prefix: 'sidebar' | 'topBar' | 'bottomBar';
  t: ReturnType<typeof useTranslations<any>>;
}

export const ComponentStyleControls: React.FC<ComponentStyleControlsProps> = ({ prefix, t }) => {
  const { control } = useFormContext();

  const styleFieldName = `${prefix}Style`;
  const borderWidthFieldName = `${prefix}BorderWidth`;
  const glassOpacityFieldName = `${prefix}LayoutOpacity`;
  const useBackgroundAsGlassBaseFieldName = `${prefix}UseBackgroundAsGlassBase`;
  const borderColor1FieldName = `${prefix}BorderColor1`;
  const borderColor2FieldName = `${prefix}BorderColor2`;
  const borderGradientDirectionFieldName = `${prefix}BorderGradientDirection`;

  const style = useWatch({ control, name: styleFieldName });
  const borderWidth = useWatch({ control, name: borderWidthFieldName });
  const glassOpacity = useWatch({ control, name: glassOpacityFieldName });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={control}
        name={styleFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('style.label')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="flat">{t('style.options.flat')}</SelectItem>
                <SelectItem value="glass">{t('style.options.glass')}</SelectItem>
                <SelectItem value="bordered">{t('style.options.bordered')}</SelectItem>
                <SelectItem value="inner-shadow">{t('style.options.innerShadow')}</SelectItem>
                <SelectItem value="outer-shadow">{t('style.options.outerShadow')}</SelectItem>
                <SelectItem value="border-gradient">{t('style.options.borderGradient')}</SelectItem>
                <SelectItem value="border-accent">{t('style.options.borderAccent')}</SelectItem>
              </SelectContent>
            </Select>
             <FormDescription className="text-xs">
              {t('style.description')}
            </FormDescription>
          </FormItem>
        )}
      />

      {style === 'glass' && (
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={control}
            name={glassOpacityFieldName}
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>{t('glass.opacityLabel')}</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Slider
                      value={[value !== undefined ? value * 100 : 80]}
                      max={100} step={1}
                      onValueChange={(val) => onChange(val[0] / 100)}
                      className="w-full"
                    />
                  </FormControl>
                  <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{Math.round((glassOpacity ?? 0.8) * 100)}%</span>
                </div>
              </FormItem>
            )}
          />
           <FormField
            control={control}
            name={useBackgroundAsGlassBaseFieldName}
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>{t('glass.useBackgroundLabel')}</FormLabel>
                        <FormDescription className="text-xs">
                           {t('glass.useBackgroundDescription')}
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                </FormItem>
            )}
          />
        </div>
      )}

      {(style === 'glass' || style === 'bordered' || style === 'border-gradient' || style === 'border-accent') && (
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={control}
            name={borderWidthFieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('border.widthLabel')}</FormLabel>
                 <div className="flex items-center gap-4">
                    <FormControl>
                        <Slider
                            value={[field.value ?? 1]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={0} max={8} step={1}
                        />
                    </FormControl>
                    <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{borderWidth ?? 1}px</span>
                 </div>
              </FormItem>
            )}
          />
          
          {style === 'border-gradient' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                    name={borderColor1FieldName}
                    control={control}
                    render={({ field }) => <ColorPickerInput label={t('border.gradientColor1')} value={field.value} onValueChange={field.onChange} />}
                />
                <Controller
                    name={borderColor2FieldName}
                    control={control}
                    render={({ field }) => <ColorPickerInput label={t('border.gradientColor2')} value={field.value} onValueChange={field.onChange} />}
                />
              </div>
              <GradientDirectionInput name={borderGradientDirectionFieldName} label={t('border.gradientDirection')} />
            </>
          ) : (style === 'glass' || style === 'bordered' || style === 'border-accent') ? (
             <Controller
                name={borderColor1FieldName}
                control={control}
                render={({ field }) => <ColorPickerInput label={t('border.colorLabel')} value={field.value} onValueChange={field.onChange} />}
             />
          ) : null}
        </div>
      )}
    </div>
  );
};
