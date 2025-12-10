
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { PaintBucket, Blend, ImageIcon } from 'lucide-react';
import { GradientDirectionInput } from '@/components/shared/form/GradientDirectionInput';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

export const BackgroundTab = () => {
    const t = useTranslations('appearance');
    const { control } = useFormContext();
    const watchedBackgroundType = useWatch({ control, name: "backgroundType" });

    return (
        <div className="pt-6 space-y-6">
            <h3 className="text-lg font-medium">{t('background.title')}</h3>
            <FormField
                control={control} name="backgroundType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>{t('background.typeLabel')}</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormItem><FormControl><RadioGroupItem value="color" id="bg-color" className="peer sr-only" /></FormControl><Label htmlFor="bg-color" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><PaintBucket className="mb-2 h-6 w-6"/>{t('background.solidColor')}</Label></FormItem>
                        <FormItem><FormControl><RadioGroupItem value="gradient" id="bg-gradient" className="peer sr-only" /></FormControl><Label htmlFor="bg-gradient" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><Blend className="mb-2 h-6 w-6"/>{t('background.gradient')}</Label></FormItem>
                        <FormItem><FormControl><RadioGroupItem value="image" id="bg-image" className="peer sr-only" /></FormControl><Label htmlFor="bg-image" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><ImageIcon className="mb-2 h-6 w-6"/>{t('background.image')}</Label></FormItem>
                        </RadioGroup>
                    </FormControl>
                    </FormItem>
                )}
            />
            
            {watchedBackgroundType === 'color' && (
                <Controller
                    name="backgroundColor"
                    control={control}
                    render={({ field }) => (
                        <ColorPickerInput 
                            label={t('background.colorLabel')} 
                            value={field.value}
                            onValueChange={field.onChange}
                        />
                    )}
                />
            )}
            
            {watchedBackgroundType === 'gradient' && (
                <div className="space-y-4 border p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                          name="backgroundGradientFrom"
                          control={control}
                          render={({ field }) => (
                              <ColorPickerInput 
                                  label={t('background.gradientColor1')} 
                                  value={field.value}
                                  onValueChange={field.onChange}
                              />
                          )}
                      />
                      <Controller
                          name="backgroundGradientTo"
                          control={control}
                          render={({ field }) => (
                              <ColorPickerInput 
                                  label={t('background.gradientColor2')} 
                                  value={field.value}
                                  onValueChange={field.onChange}
                              />
                          )}
                      />
                    </div>
                    <GradientDirectionInput name="backgroundGradientDirection" label={t('background.gradientDirection')} />
                </div>
            )}

            {watchedBackgroundType === 'image' && ( <FormField control={control} name="backgroundImageUrl" render={({ field }) => (<FormItem><FormLabel>{t('background.imageUrl')}</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/> )}
            <Separator />
            <FormField control={control} name="backgroundEffect" render={({ field }) => (<FormItem><FormLabel>{t('background.animatedEffect')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('background.selectEffect')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">{t('background.effects.none')}</SelectItem><SelectItem value="aurora">{t('background.effects.aurora')}</SelectItem><SelectItem value="stars">{t('background.effects.stars')}</SelectItem><SelectItem value="bubbles">{t('background.effects.bubbles')}</SelectItem><SelectItem value="diamonds">{t('background.effects.diamonds')}</SelectItem><SelectItem value="lines">{t('background.effects.lines')}</SelectItem><SelectItem value="grid">{t('background.effects.grid')}</SelectItem><SelectItem value="bokeh">{t('background.effects.bokeh')}</SelectItem><SelectItem value="waves">{t('background.effects.waves')}</SelectItem><SelectItem value="noise">{t('background.effects.noise')}</SelectItem><SelectItem value="floating-shapes">{t('background.effects.floatingShapes')}</SelectItem><SelectItem value="animated-grid">{t('background.effects.animatedGrid')}</SelectItem><SelectItem value="subtle-dust">{t('background.effects.subtleDust')}</SelectItem></SelectContent></Select><FormDescription>{t('background.effectDescription')}</FormDescription></FormItem>)}/>
        </div>
    );
};
