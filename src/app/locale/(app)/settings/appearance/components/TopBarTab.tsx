// src/app/locale/(app)/settings/appearance/components/TopBarTab.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { GradientDirectionInput } from '@/components/shared/form/GradientDirectionInput';
import { FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ComponentStyleControls } from '@/components/shared/form/ComponentStyleControls';
import { Slider } from '@/components/ui/slider';
import { GoogleFontSelect } from '@/components/shared/form/GoogleFontSelect';
import { CaseSensitive, Sparkles, Pilcrow, MousePointerClick, Link2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { TextEffectsControl } from '@/components/shared/form/TextEffectsControl';
import { TextAnimationsControl } from '@/components/shared/form/TextAnimationsControl';
import { useMenuData, type ConfiguredMenuItem } from '@/hooks/use-menu-data';
import { useTranslations } from 'next-intl';

const LOGO_REFERENCE_MAIN = 'logoUrl';
const LOGO_REFERENCE_COLLAPSED = 'logoCollapsedUrl';
const LOGO_REFERENCE_CUSTOM = '_custom_';

const fontWeights = [
    { value: '300', label: 'Leve (300)' },
    { value: '400', label: 'Normal (400)' },
    { value: '500', label: 'Médio (500)' },
    { value: '600', label: 'Semi-Negrito (600)' },
    { value: '700', label: 'Negrito (700)' },
];

export const TopBarTab = () => {
    const t = useTranslations('appearance.topBar');
    const tShared = useTranslations('appearance.shared');
    const { control } = useFormContext();
    const { allCombinedItems } = useMenuData();
    
    const backgroundType = useWatch({ control, name: "topBarBackgroundType" });
    const brandingTextFontSize = useWatch({ control, name: "topBarBrandingTextFontSize" });
    const brandingTextLetterSpacing = useWatch({ control, name: "topBarBrandingTextLetterSpacing" });

    const mainLogoUrl = useWatch({ control, name: "logoUrl" });
    const collapsedLogoUrl = useWatch({ control, name: "logoCollapsedUrl" });
    const hasDefinedLogos = !!mainLogoUrl || !!collapsedLogoUrl;
    
    const topBarContextPath = 'identity_assets/topbar';
    const appNameType = useWatch({ control, name: "topBarBrandingTextType" });
    
    const triggerType = useWatch({ control, name: "topBarTriggerType" });
    const brandingElementType = useWatch({ control, name: "topBarBrandingType" });
    
    const triggerLogoSelection = useWatch({ control, name: "topBarTriggerLogoUrl" });
    const isCustomTriggerLogo = triggerLogoSelection !== LOGO_REFERENCE_MAIN && triggerLogoSelection !== LOGO_REFERENCE_COLLAPSED;

    const brandingLogoSelection = useWatch({ control, name: "topBarBrandingLogoUrl" });
    const isCustomBrandingLogo = brandingLogoSelection !== LOGO_REFERENCE_MAIN && brandingLogoSelection !== LOGO_REFERENCE_COLLAPSED;
    
    const linkOnBranding = useWatch({ control, name: "topBarLinkOnBranding" });
    const linkToHome = useWatch({ control, name: "topBarLinkToHome" });
    const destinationPages = allCombinedItems.filter((item: ConfiguredMenuItem) => item.canBeInitialPage);

    return (
        <div className="pt-6 space-y-6">
            <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-base font-medium">{t('content.title')}</h3>
                <p className="text-xs text-muted-foreground">{t('content.description')}</p>
                
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm flex items-center"><MousePointerClick className="mr-2 h-4 w-4 text-primary/80"/>{t('trigger.title')}</h4>
                    <FormField control={control} name="topBarTriggerType" render={({ field }) => (
                        <FormItem className="space-y-3"><Label>{t('trigger.typeLabel')}</Label><RadioGroup value={field.value} onValueChange={field.onChange} className="flex items-center gap-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="icon" /></FormControl><Label className="font-normal cursor-pointer">{t('trigger.icon')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="image" /></FormControl><Label className="font-normal cursor-pointer">{t('trigger.image')}</Label></FormItem></RadioGroup></FormItem>
                    )}/>
                    {triggerType === 'icon' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name="topBarTriggerIconName" render={({ field }) => (<FormItem><FormLabel>{t('trigger.iconName')}</FormLabel><FormControl><Input placeholder="Ex: Menu, PanelLeft" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                            <Controller name="topBarTriggerIconColor" control={control} render={({ field }) => <ColorPickerInput label={t('trigger.iconColor')} value={field.value} onValueChange={field.onChange} />} />
                        </div>
                    ) : (
                        <FormField control={control} name="topBarTriggerLogoUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('trigger.logoLabel')}</FormLabel>
                                {hasDefinedLogos ? (<Select onValueChange={(value) => field.onChange(value === LOGO_REFERENCE_CUSTOM ? '' : value)} value={isCustomTriggerLogo ? LOGO_REFERENCE_CUSTOM : field.value || LOGO_REFERENCE_COLLAPSED}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{mainLogoUrl && <SelectItem value={LOGO_REFERENCE_MAIN}>{t('trigger.useMainLogo')}</SelectItem>}{collapsedLogoUrl && <SelectItem value={LOGO_REFERENCE_COLLAPSED}>{t('trigger.useCollapsedLogo')}</SelectItem>}<SelectItem value={LOGO_REFERENCE_CUSTOM}>{t('trigger.customUrl')}</SelectItem></SelectContent></Select>) : null}
                                {(isCustomTriggerLogo || !hasDefinedLogos) && (<div className="pt-2"><FormControl><ImageUploadField value={field.value} onChange={field.onChange} aihint="menu trigger icon" contextPath={topBarContextPath} /></FormControl></div>)}
                            </FormItem>
                        )}/>
                    )}
                </div>

                 <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm flex items-center"><Sparkles className="mr-2 h-4 w-4 text-primary/80"/>{t('branding.title')}</h4>
                    <FormField control={control} name="topBarBrandingType" render={({ field }) => (
                        <FormItem className="space-y-3"><Label>{t('branding.typeLabel')}</Label><RadioGroup value={field.value} onValueChange={field.onChange} className="flex items-center gap-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="text" /></FormControl><Label className="font-normal cursor-pointer">{t('branding.text')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="image" /></FormControl><Label className="font-normal cursor-pointer">{t('branding.image')}</Label></FormItem></RadioGroup></FormItem>
                    )}/>
                    {brandingElementType === 'text' ? (
                         <div className="space-y-4">
                            <FormField control={control} name="topBarBrandingTextType" render={({ field }) => ( <FormItem><FormLabel>{t('branding.textSource')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="full">{t('branding.sources.full')}</SelectItem><SelectItem value="nickname">{t('branding.sources.nickname')}</SelectItem><SelectItem value="custom">{t('branding.sources.custom')}</SelectItem></SelectContent></Select></FormItem> )}/>
                            {appNameType === 'custom' && (<FormField control={control} name="topBarBrandingTextCustom" render={({ field }) => ( <FormItem><FormLabel>{t('branding.customText')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem> )}/>)}
                            <GoogleFontSelect name="topBarBrandingTextFontFamily" label={t('branding.fontFamily')} />
                            <FormField control={control} name="topBarBrandingTextFontWeight" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Pilcrow className="mr-2 h-4 w-4" />{t('branding.fontWeight')}</FormLabel><Select onValueChange={field.onChange} value={field.value ?? '600'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                            <FormField control={control} name="topBarBrandingTextFontSize" render={({ field: { value, onChange } }) => (
                                <FormItem><FormLabel>{t('branding.fontSize')}</FormLabel><div className="flex items-center gap-4"><FormControl><Slider value={[value ?? 16]} onValueChange={(val) => onChange(val[0])} min={12} max={24} step={1} /></FormControl><span className="text-sm font-mono w-16 text-center border rounded-md py-1">{brandingTextFontSize ?? 16}px</span></div></FormItem>
                            )}/>
                            <FormField control={control} name="topBarBrandingTextLetterSpacing" render={({ field: { value, onChange } }) => (
                                <FormItem><FormLabel className="flex items-center"><CaseSensitive className="mr-2 h-4 w-4"/>{t('branding.letterSpacing')}</FormLabel><div className="flex items-center gap-4"><FormControl><Slider value={[value ?? 0]} onValueChange={(val) => onChange(val[0])} min={-0.1} max={0.1} step={0.005} /></FormControl><span className="text-sm font-mono w-20 text-center border rounded-md py-1">{(brandingTextLetterSpacing ?? 0).toFixed(3)}em</span></div></FormItem>
                            )}/>
                            <Controller name="topBarTextColor" control={control} render={({ field }) => <ColorPickerInput label={t('branding.textColor')} value={field.value} onValueChange={field.onChange} />} />
                            
                            <TextEffectsControl prefix="topBarBrandingTextEffects" t={tShared} />
                            <TextAnimationsControl prefix="topBarBrandingTextAnimation" t={tShared} />
                        </div>
                    ) : (
                        <FormField control={control} name="topBarBrandingLogoUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('branding.logoLabel')}</FormLabel>
                                {hasDefinedLogos ? (<Select onValueChange={(value) => field.onChange(value === LOGO_REFERENCE_CUSTOM ? '' : value)} value={isCustomBrandingLogo ? LOGO_REFERENCE_CUSTOM : field.value || LOGO_REFERENCE_MAIN}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{mainLogoUrl && <SelectItem value={LOGO_REFERENCE_MAIN}>{t('branding.useMainLogo')}</SelectItem>}{collapsedLogoUrl && <SelectItem value={LOGO_REFERENCE_COLLAPSED}>{t('branding.useCollapsedLogo')}</SelectItem>}<SelectItem value={LOGO_REFERENCE_CUSTOM}>{t('branding.customUrl')}</SelectItem></SelectContent></Select>) : null}
                                {(isCustomBrandingLogo || !hasDefinedLogos) && (<div className="pt-2"><FormControl><ImageUploadField value={field.value} onChange={field.onChange} aihint="topbar branding logo" contextPath={topBarContextPath} /></FormControl></div>)}
                            </FormItem>
                        )}/>
                    )}
                     <div className="space-y-4 pt-4 border-t">
                        <FormField control={control} name="topBarLinkOnBranding" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between"><FormLabel>{t('branding.enableLink')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                        {linkOnBranding && (
                             <div className="pl-4 space-y-4 pt-4 border-t">
                                 <FormField control={control} name="topBarLinkToHome" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between"><FormLabel>{t('branding.linkToHome')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                                 {!linkToHome && (
                                    <FormField
                                        control={control}
                                        name="topBarAppNameLinkHref"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><Link2 className="mr-2 h-4 w-4"/>{t('branding.linkHref')}</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('branding.selectDestination')}/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {destinationPages.map((page: ConfiguredMenuItem) => 
                                                            <SelectItem key={page.menuKey} value={page.originalHref}>
                                                                {page.displayName}
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>{t('branding.destinationDescription')}</FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                 )}
                             </div>
                        )}
                    </div>
                </div>
            </div>

            <ComponentStyleControls prefix="topBar" t={tShared} />
            
             <div className="space-y-6 rounded-lg border p-4">
                <div>
                    <h3 className="text-base font-medium">{t('background.title')}</h3>
                     <p className="text-xs text-muted-foreground">{t('background.description')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={control} name="topBarBackgroundType" render={({ field }) => (
                            <FormItem className="space-y-3"><Label>{t('background.typeLabel')}</Label><RadioGroup value={field.value} onValueChange={field.onChange} className="flex items-center gap-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="solid"/></FormControl><Label className="font-normal cursor-pointer">{t('background.solid')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="gradient" /></FormControl><Label className="font-normal cursor-pointer">{t('background.gradient')}</Label></FormItem></RadioGroup></FormItem>
                        )}/>
                </div>
                
                <Separator/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Controller name="topBarBackgroundColor1" control={control} render={({ field }) => <ColorPickerInput label={backgroundType === 'gradient' ? t('background.gradientColor1') : t('background.colorLabel')} value={field.value} onValueChange={field.onChange} />} />
                   {backgroundType === 'gradient' && (<Controller name="topBarBackgroundColor2" control={control} render={({ field }) => <ColorPickerInput label={t('background.gradientColor2')} value={field.value} onValueChange={field.onChange} />} />)}
                </div>

                 {backgroundType === 'gradient' && (<div className="pt-2"><GradientDirectionInput name="topBarGradientDirection" label={t('background.gradientDirection')} /></div>)}
            </div>
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-base font-medium">{t('actionIcons.title')}</h3>
                <Controller name="topBarIconColor" control={control} render={({ field }) => <ColorPickerInput label={t('actionIcons.color')} value={field.value} onValueChange={field.onChange} />} />
            </div>
        </div>
    );
};
