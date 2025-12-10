// src/app/[locale]/(app)/settings/appearance/components/BottomBarTab.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { GradientDirectionInput } from '@/components/shared/form/GradientDirectionInput';
import { FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComponentStyleControls } from '@/components/shared/form/ComponentStyleControls';
import { GoogleFontSelect } from '@/components/shared/form/GoogleFontSelect';
import { useTranslations } from 'next-intl';

export const BottomBarTab = () => {
    const t = useTranslations('appearance.bottomBar');
    const { control } = useFormContext();
    const backgroundType = useWatch({ control, name: "bottomBarBackgroundType" });
    const itemsAlignment = useWatch({ control, name: "bottomBarItemsAlignment" });

    return (
        <div className="pt-6 space-y-6">
            
            <ComponentStyleControls prefix="bottomBar" t={useTranslations('appearance.shared')} />

            <div className="space-y-6 rounded-lg border p-4">
                <div>
                    <h3 className="text-base font-medium">{t('background.title')}</h3>
                    <p className="text-xs text-muted-foreground">{t('background.description')}</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={control}
                        name="bottomBarBackgroundType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <Label>{t('background.typeLabel')}</Label>
                                <RadioGroup 
                                    value={field.value} 
                                    onValueChange={field.onChange} 
                                    className="flex items-center gap-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="solid" id="bottombar-bg-solid" /></FormControl>
                                        <Label htmlFor="bottombar-bg-solid" className="font-normal cursor-pointer">{t('background.solid')}</Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="gradient" id="bottombar-bg-gradient" /></FormControl>
                                        <Label htmlFor="bottombar-bg-gradient" className="font-normal cursor-pointer">{t('background.gradient')}</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        name="bottomBarBackgroundColor1"
                        control={control}
                        render={({ field }) => (
                            <ColorPickerInput 
                                label={backgroundType === 'gradient' ? t('background.gradientColor1') : t('background.colorLabel')} 
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                    {backgroundType === 'gradient' && (
                        <Controller
                            name="bottomBarBackgroundColor2"
                            control={control}
                            render={({ field }) => (
                                <ColorPickerInput 
                                    label={t('background.gradientColor2')} 
                                    value={field.value}
                                    onValueChange={field.onChange}
                                />
                            )}
                        />
                    )}
                </div>

                 {backgroundType === 'gradient' && (
                    <div className="pt-2">
                        <GradientDirectionInput name="bottomBarGradientDirection" label={t('background.gradientDirection')} />
                    </div>
                 )}
            </div>

            <Separator />

            <div className="space-y-4 rounded-lg border p-4">
                 <h3 className="text-base font-medium">{t('colors.title')}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller name="bottomBarIconColorActive" control={control} render={({ field }) => <ColorPickerInput label={t('colors.iconActive')} value={field.value} onValueChange={field.onChange} />} />
                    <Controller name="bottomBarIconColorInactive" control={control} render={({ field }) => <ColorPickerInput label={t('colors.iconInactive')} value={field.value} onValueChange={field.onChange} />} />
                    <Controller name="bottomBarTextColorActive" control={control} render={({ field }) => <ColorPickerInput label={t('colors.textActive')} value={field.value} onValueChange={field.onChange} />} />
                    <Controller name="bottomBarTextColorInactive" control={control} render={({ field }) => <ColorPickerInput label={t('colors.textInactive')} value={field.value} onValueChange={field.onChange} />} />
                 </div>
            </div>

            <Separator />
            
            <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-base font-medium">{t('layout.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={control}
                        name="bottomBarItemsAlignment"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('layout.horizontalAlign')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="space-around">{t('layout.spaceAround')}</SelectItem>
                                        <SelectItem value="space-between">{t('layout.spaceBetween')}</SelectItem>
                                        <SelectItem value="space-evenly">{t('layout.spaceEvenly')}</SelectItem>
                                        <SelectItem value="center">{t('layout.center')}</SelectItem>
                                        <SelectItem value="flex-start">{t('layout.start')}</SelectItem>
                                        <SelectItem value="flex-end">{t('layout.end')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="bottomBarItemVerticalAlign"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('layout.verticalAlign')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="center">{t('layout.alignCenter')}</SelectItem>
                                        <SelectItem value="flex-start">{t('layout.alignStart')}</SelectItem>
                                        <SelectItem value="flex-end">{t('layout.alignEnd')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name="bottomBarItemsGap"
                        render={({ field: { value, onChange } }) => (
                            <FormItem>
                                <FormLabel>{t('layout.itemsGap')}</FormLabel>
                                <div className="flex items-center gap-4">
                                    <FormControl><Slider value={[value]} onValueChange={(val) => onChange(val[0])} min={0} max={32} step={1} disabled={itemsAlignment !== 'center' && itemsAlignment !== 'flex-start' && itemsAlignment !== 'flex-end'} /></FormControl>
                                    <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{value ?? 0}px</span>
                                </div>
                                <FormDescription className="text-xs">{t('layout.itemsGapDescription')}</FormDescription>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name="bottomBarPaddingVertical"
                        render={({ field: { value, onChange } }) => (
                            <FormItem>
                                <FormLabel>{t('layout.verticalPadding')}</FormLabel>
                                <div className="flex items-center gap-4">
                                    <FormControl><Slider value={[value]} onValueChange={(val) => onChange(val[0])} min={-16} max={16} step={1} /></FormControl>
                                    <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{value ?? 0}px</span>
                                </div>
                                <FormDescription className="text-xs">{t('layout.verticalPaddingDescription')}</FormDescription>
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={control}
                        name="bottomBarIconSize"
                        render={({ field: { value, onChange } }) => (
                            <FormItem>
                                <FormLabel>{t('layout.iconSize')}</FormLabel>
                                <div className="flex items-center gap-4">
                                    <FormControl><Slider value={[value]} onValueChange={(val) => onChange(val[0])} min={16} max={32} step={1} /></FormControl>
                                    <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{value ?? 20}px</span>
                                </div>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name="bottomBarFontSize"
                        render={({ field: { value, onChange } }) => (
                            <FormItem>
                                <FormLabel>{t('layout.fontSize')}</FormLabel>
                                <div className="flex items-center gap-4">
                                    <FormControl><Slider value={[value]} onValueChange={(val) => onChange(val[0])} min={8} max={16} step={1} /></FormControl>
                                    <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{value ?? 10}px</span>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={control}
                    name="bottomBarIconLabelSpacing"
                    render={({ field: { value, onChange } }) => (
                        <FormItem>
                            <FormLabel>{t('layout.iconLabelSpacing')}</FormLabel>
                            <div className="flex items-center gap-4">
                                <FormControl><Slider value={[value]} onValueChange={(val) => onChange(val[0])} min={0} max={8} step={1} /></FormControl>
                                <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{value ?? 2}px</span>
                            </div>
                        </FormItem>
                    )}
                />
                 <GoogleFontSelect name="bottomBarFontFamily" label={t('layout.fontFamily')} />
            </div>

        </div>
    );
};
