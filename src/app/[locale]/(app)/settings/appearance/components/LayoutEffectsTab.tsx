// src/app/[locale]/(app)/settings/appearance/components/LayoutEffectsTab.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Sparkles, Layers3, Disc, Scan, Rows, PanelBottom, PanelTop, PanelLeft, MoveHorizontal, Film } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PageTransitionSelector } from '@/components/shared/form/PageTransitionSelector';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const ringStyleOptions = [
    { value: 'default', labelKey: 'default' },
    { value: 'dashed', labelKey: 'dashed' },
    { value: 'dotted', labelKey: 'dotted' },
];

export const LayoutEffectsTab = () => {
    const t = useTranslations('appearance.layoutEffects');
    const { control } = useFormContext();
    const watchedOpacity = useWatch({ control, name: "layoutOpacity" });
    const watchedLayoutStyle = useWatch({ control, name: "layoutStyle" });
    const watchedRingWidth = useWatch({ control, name: "ringWidth" });
    const watchedEnableTransitions = useWatch({ control, name: "enablePageTransitions" });
    const watchedTransitionType = useWatch({ control, name: "pageTransitionType" });
    const watchedTransitionDuration = useWatch({ control, name: "pageTransitionDurationMs" });

    return (
        <div className="pt-6 space-y-6">
             <h3 className="text-lg font-medium flex items-center"><Layers3 className="mr-2 h-5 w-5"/>{t('layoutVisibilityTitle')}</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={control} name="sidebarVisible" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel className="flex items-center gap-2"><PanelLeft className="h-4 w-4"/> {t('leftSidebarVisible')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                <FormField control={control} name="topBarVisible" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel className="flex items-center gap-2"><PanelTop className="h-4 w-4"/> {t('topBarVisible')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                <FormField control={control} name="bottomBarVisible" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel className="flex items-center gap-2"><PanelBottom className="h-4 w-4"/> {t('bottomBarVisible')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="topBarMode" render={({ field }) => (<FormItem><FormLabel>{t('topBarMode')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">{t('modes.fixed')}</SelectItem><SelectItem value="floating">{t('modes.floating')}</SelectItem></SelectContent></Select></FormItem>)}/>
                <FormField control={control} name="bottomBarMode" render={({ field }) => (<FormItem><FormLabel>{t('bottomBarMode')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">{t('modes.fixed')}</SelectItem><SelectItem value="floating">{t('modes.floating')}</SelectItem></SelectContent></Select></FormItem>)}/>
             </div>
             <Separator/>

             <h3 className="text-lg font-medium flex items-center"><Sparkles className="mr-2 h-5 w-5"/>{t('elementStyleTitle')}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="layoutStyle" render={({ field }) => (<FormItem><FormLabel>{t('layoutStyle')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="default">{t('styles.default')}</SelectItem><SelectItem value="glassmorphism">{t('styles.glassmorphism')}</SelectItem></SelectContent></Select><FormDescription>{t('layoutStyleDescription')}</FormDescription></FormItem>)}/>
                <FormField control={control} name="layoutOpacity" render={({ field: { value, onChange } }) => (
                   <FormItem>
                    <FormLabel>{t('opacityLabel')}</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider defaultValue={[value ? value * 100 : 80]} max={100} step={1} onValueChange={(val) => onChange(val[0] / 100)} className="w-full" disabled={watchedLayoutStyle !== 'glassmorphism'}/>
                      </FormControl>
                      <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{Math.round((watchedOpacity ?? 0.8) * 100)}%</span>
                    </div>
                    <FormDescription>{t('opacityDescription')}</FormDescription>
                  </FormItem>
                )}/>
             </div>
             <Separator/>
              <h3 className="text-lg font-medium flex items-center"><Scan className="mr-2 h-5 w-5"/>{t('interactionFocusTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={control} name="focusRingStyle"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel className="flex items-center"><Disc className="mr-2 h-4 w-4"/>{t('focusRingStyle')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {ringStyleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(`ringStyles.${opt.labelKey}`)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('focusRingStyleDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={control} name="ringWidth"
                    render={({ field: { value, onChange } }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><MoveHorizontal className="mr-2 h-4 w-4" />{t('focusRingWidth')}</FormLabel>
                            <div className="flex items-center gap-4">
                               <FormControl>
                                 <Slider defaultValue={[value ?? 2]} min={1} max={4} step={1} onValueChange={(val) => onChange(val[0])} className="w-full"/>
                               </FormControl>
                               <span className="text-sm font-mono w-16 text-center border rounded-md py-1">{watchedRingWidth ?? 2}px</span>
                            </div>
                        </FormItem>
                    )}
                 />
              </div>
              <Separator />
             <PageTransitionSelector />
             {watchedEnableTransitions && (
                <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium flex items-center"><Film className="mr-2 h-4 w-4" />{t('transitionPreview')}</h4>
                    <div
                        key={watchedTransitionType + watchedTransitionDuration}
                        className={cn(
                            'animate__animated p-4 bg-primary/10 border border-primary/30 rounded-md text-center',
                             watchedTransitionType && watchedTransitionType !== 'none' && `animate__${watchedTransitionType}`
                        )}
                        style={{ animationDuration: `${(watchedTransitionDuration ?? 300) / 1000}s` }}
                    >
                        <p className="text-sm text-primary">{t('transitionBoxText')}</p>
                    </div>
                </div>
             )}
        </div>
    );
};
