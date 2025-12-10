
// src/app/[locale]/(app)/settings/appearance/components/TypographyTab.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GoogleFontSelect } from '@/components/shared/form/GoogleFontSelect';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Icon } from '@/components/ui/icon';
import { Pilcrow } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

const fontWeights = [
    { value: '300', label: 'Leve (300)' },
    { value: '400', label: 'Normal (400)' },
    { value: '500', label: 'Médio (500)' },
    { value: '600', label: 'Semi-Negrito (600)' },
    { value: '700', label: 'Negrito (700)' },
];

const TypographySlider = ({ name, label, min, max, step, unit, iconName, defaultValue }: { name: string, label: string, min: number, max: number, step: number, unit: string, iconName: string, defaultValue: number }) => {
    const { control, watch } = useFormContext();
    const displayValue = watch(name, defaultValue);

    return (
        <FormField
            control={control}
            name={name}
            defaultValue={defaultValue}
            render={({ field: { value, onChange } }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Icon name={iconName} className="mr-2 h-4 w-4" />{label}</FormLabel>
                    <div className="flex items-center gap-4">
                        <FormControl>
                            <Slider
                                value={[value ?? defaultValue]}
                                min={min} max={max} step={step}
                                onValueChange={(val) => onChange(val[0])}
                                className="w-full"
                            />
                        </FormControl>
                        <span className="text-sm font-mono w-24 text-center border rounded-md py-1">
                            {Number(displayValue).toFixed(unit === 'em' ? 2 : 0)}{unit}
                        </span>
                    </div>
                </FormItem>
            )}
        />
    );
};

export const TypographyTab = () => {
    const t = useTranslations('appearance.typography');
    const { control } = useFormContext();

    return (
        <div className="pt-6 space-y-8">
            <div>
                <h3 className="section-title">{t('pageTitle.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                    <GoogleFontSelect name="fontFamilyPageTitle" label={t('fontFamily')} />
                    <TypographySlider name="fontSizePageTitle" label={t('fontSize')} min={20} max={72} step={1} unit="px" iconName="Heading1" defaultValue={30}/>
                    <FormField control={control} name="fontWeightPageTitle" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center"><Pilcrow className="mr-2 h-4 w-4" />{t('fontWeight')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? '600'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <TypographySlider name="letterSpacingPageTitle" label={t('letterSpacing')} min={-0.1} max={0.1} step={0.005} unit="em" iconName="LetterSpacing" defaultValue={-0.025}/>
                    <TypographySlider name="lineHeightPageTitle" label={t('lineHeight')} min={1} max={1.5} step={0.1} unit="" iconName="Baseline" defaultValue={1.1}/>
                </div>
            </div>
            
             <Separator />
             
             <div>
                <h3 className="section-title">{t('pageSubtitle.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                    <GoogleFontSelect name="fontFamilyPageSubtitle" label={t('fontFamily')} />
                    <TypographySlider name="fontSizePageSubtitle" label={t('fontSize')} min={12} max={24} step={1} unit="px" iconName="Heading2" defaultValue={14}/>
                    <FormField control={control} name="fontWeightPageSubtitle" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center"><Pilcrow className="mr-2 h-4 w-4" />{t('fontWeight')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? '400'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <TypographySlider name="letterSpacingPageSubtitle" label={t('letterSpacing')} min={-0.1} max={0.1} step={0.005} unit="em" iconName="LetterSpacing" defaultValue={0}/>
                    <TypographySlider name="lineHeightPageSubtitle" label={t('lineHeight')} min={1} max={2} step={0.05} unit="" iconName="Baseline" defaultValue={1.5}/>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="section-title">{t('sectionTitle.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                    <GoogleFontSelect name="fontFamilySectionTitle" label={t('fontFamily')} />
                    <TypographySlider name="fontSizeSectionTitle" label={t('fontSize')} min={14} max={36} step={1} unit="px" iconName="Heading3" defaultValue={18}/>
                     <FormField control={control} name="fontWeightSectionTitle" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center"><Pilcrow className="mr-2 h-4 w-4" />{t('fontWeight')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? '500'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <TypographySlider name="letterSpacingSectionTitle" label={t('letterSpacing')} min={-0.1} max={0.1} step={0.005} unit="em" iconName="LetterSpacing" defaultValue={0}/>
                    <TypographySlider name="lineHeightSectionTitle" label={t('lineHeight')} min={1} max={2} step={0.05} unit="" iconName="Baseline" defaultValue={1.4}/>
                </div>
            </div>
            
            <Separator />

            <div>
                <h3 className="section-title">{t('bodyText.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                    <GoogleFontSelect name="fontFamilyBody" label={t('fontFamily')} />
                    <TypographySlider name="fontSizeBody" label={t('fontSize')} min={12} max={20} step={1} unit="px" iconName="Type" defaultValue={14}/>
                    <FormField control={control} name="fontWeightBody" render={({ field }) => (
                         <FormItem><FormLabel className="flex items-center"><Pilcrow className="mr-2 h-4 w-4"/>{t('fontWeightBody')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? '400'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <TypographySlider name="letterSpacingBody" label={t('letterSpacing')} min={-0.1} max={0.1} step={0.005} unit="em" iconName="LetterSpacing" defaultValue={0}/>
                    <TypographySlider name="lineHeightBody" label={t('lineHeightBody')} min={1} max={2} step={0.05} unit="" iconName="Baseline" defaultValue={1.6}/>
                </div>
            </div>
        </div>
    );
};
