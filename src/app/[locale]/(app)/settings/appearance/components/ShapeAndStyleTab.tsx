// src/app/locale/(app)/settings/appearance/components/ShapeAndStyleTab.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shapes, MousePointerClick, Columns } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

const borderRadiusPresets = [
    { value: 'sharp', labelKey: 'sharp' },
    { value: 'subtle', labelKey: 'subtle' },
    { value: 'smooth', labelKey: 'smooth' },
    { value: 'rounded', labelKey: 'rounded' },
    { value: 'pill', labelKey: 'pill' },
];

const buttonHoverEffects = [
    { value: 'none', labelKey: 'none' },
    { value: 'scale', labelKey: 'scale' },
    { value: 'lift', labelKey: 'lift' },
    { value: 'glow', labelKey: 'glow' },
];

const tabsContainerStyles = [
    { value: 'default', labelKey: 'default' },
    { value: 'soft-shadow', labelKey: 'softShadow' },
    { value: 'connected-border', labelKey: 'connectedBorder' },
    { value: 'simple-border', labelKey: 'simpleBorder' },
];

export const ShapeAndStyleTab = () => {
    const t = useTranslations('appearance.shapeAndStyle');
    const { control } = useFormContext();
    const watchedSkeletonSpeed = useWatch({ control, name: "skeletonAnimationSpeed" });
    const skeletonBaseColor = useWatch({ control, name: "skeletonBaseColor" });
    const skeletonHighlightColor = useWatch({ control, name: "skeletonHighlightColor" });

    const skeletonStyle = {
        '--skeleton-base-color': skeletonBaseColor,
        '--skeleton-highlight-color': skeletonHighlightColor,
        '--skeleton-animation-duration': `${watchedSkeletonSpeed || 1.5}s`,
    } as React.CSSProperties;

    return (
        <div className="pt-6 space-y-6">
            <h3 className="text-lg font-medium">{t('componentStyleTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={control}
                    name="borderRadiusPreset"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Shapes className="mr-2 h-4 w-4 text-primary/80"/>{t('borderStyleLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectStyle')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {borderRadiusPresets.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {t(`borderStyles.${preset.labelKey}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('borderStyleDescription')}</FormDescription>
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={control}
                    name="tabsContainerStyle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Columns className="mr-2 h-4 w-4 text-primary/80"/>{t('tabsContainerStyleLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('selectStyle')} /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {tabsContainerStyles.map(style => (
                                        <SelectItem key={style.value} value={style.value}>{t(`tabsContainerStyles.${style.labelKey}`)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <FormDescription>{t('tabsContainerStyleDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            </div>
            
            <Separator />
            
            <h3 className="text-lg font-medium">{t('microInteractionsTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={control}
                    name="buttonHoverEffect"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><MousePointerClick className="mr-2 h-4 w-4 text-primary/80"/>{t('buttonHoverEffectLabel')}</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectEffect')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {buttonHoverEffects.map(effect => (
                                        <SelectItem key={effect.value} value={effect.value}>
                                            {t(`buttonHoverEffects.${effect.labelKey}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('buttonHoverEffectDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-lg font-medium">{t('loadingEffectsTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller 
                        name="skeletonBaseColor"
                        control={control}
                        render={({ field }) => <ColorPickerInput label={t('skeletonBaseColor')} value={field.value} onValueChange={field.onChange} />}
                    />
                    <Controller 
                        name="skeletonHighlightColor"
                        control={control}
                        render={({ field }) => <ColorPickerInput label={t('skeletonHighlightColor')} value={field.value} onValueChange={field.onChange} />}
                    />
                </div>
                 <FormField
                    control={control}
                    name="skeletonAnimationSpeed"
                    render={({ field: { value, onChange } }) => (
                        <FormItem>
                            <FormLabel>{t('animationSpeed')}</FormLabel>
                            <div className="flex items-center gap-4">
                               <FormControl>
                                 <Slider defaultValue={[value ?? 1.5]} min={0.5} max={4} step={0.1} onValueChange={(val) => onChange(val[0])} className="w-full"/>
                               </FormControl>
                               <span className="text-sm font-mono w-20 text-center border rounded-md py-1">{(watchedSkeletonSpeed ?? 1.5).toFixed(1)}s</span>
                            </div>
                            <FormDescription>{t('animationSpeedDescription')}</FormDescription>
                        </FormItem>
                    )}
                 />
                 <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium">{t('skeletonPreview')}</h4>
                     <div className="space-y-2" style={skeletonStyle}>
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                 </div>
            </div>
        </div>
    );
};
