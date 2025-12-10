// src/app/[locale]/(app)/settings/appearance/components/LeftSidebarTab.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { GradientDirectionInput } from '@/components/shared/form/GradientDirectionInput';
import { FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { GoogleFontSelect } from '@/components/shared/form/GoogleFontSelect';
import { useMenuData, type ConfiguredMenuItem } from '@/hooks/use-menu-data';
import { Link2, Pilcrow, CaseSensitive } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { ComponentStyleControls } from '@/components/shared/form/ComponentStyleControls';
import { TextEffectsControl } from '@/components/shared/form/TextEffectsControl';
import { TextAnimationsControl } from '@/components/shared/form/TextAnimationsControl';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
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

export const LeftSidebarTab = () => {
    const t = useTranslations('appearance.sidebar');
    const tShared = useTranslations('appearance.shared');
    const { control } = useFormContext();
    const { allCombinedItems } = useMenuData();
    
    const backgroundType = useWatch({ control, name: "sidebarBackgroundType" });
    const showAppName = useWatch({ control, name: "leftSidebarShowAppName" });
    const linkOnAppName = useWatch({ control, name: "leftSidebarLinkOnAppName" });
    const linkToHome = useWatch({ control, name: "leftSidebarLinkToHome" });
    const appNameType = useWatch({ control, name: "leftSidebarAppNameType" });

    const mainLogoUrl = useWatch({ control, name: "logoUrl" });
    const collapsedLogoUrl = useWatch({ control, name: "logoCollapsedUrl" });
    const hasDefinedLogos = !!mainLogoUrl || !!collapsedLogoUrl;

    const logoExpandedSelection = useWatch({ control, name: "leftSidebarLogoExpandedUrl" });
    const logoCollapsedSelection = useWatch({ control, name: "leftSidebarLogoCollapsedUrl" });
    
    const isCustomExpanded = logoExpandedSelection !== LOGO_REFERENCE_MAIN && logoExpandedSelection !== LOGO_REFERENCE_COLLAPSED;
    const isCustomCollapsed = logoCollapsedSelection !== LOGO_REFERENCE_MAIN && logoCollapsedSelection !== LOGO_REFERENCE_COLLAPSED;

    const destinationPages = allCombinedItems.filter(item => item.canBeInitialPage);
    const sidebarContextPath = 'identity_assets/sidebar';

    return (
        <div className="pt-6 space-y-6">
            <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-base font-medium">{t('branding.title')}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <FormField
                        control={control}
                        name="leftSidebarLogoExpandedUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('branding.logoExpanded')}</FormLabel>
                                {hasDefinedLogos ? (
                                    <Select onValueChange={(value) => field.onChange(value === LOGO_REFERENCE_CUSTOM ? '' : value)} value={isCustomExpanded ? LOGO_REFERENCE_CUSTOM : field.value || LOGO_REFERENCE_MAIN}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {mainLogoUrl && <SelectItem value={LOGO_REFERENCE_MAIN}>{t('branding.useMainLogo')}</SelectItem>}
                                            {collapsedLogoUrl && <SelectItem value={LOGO_REFERENCE_COLLAPSED}>{t('branding.useCollapsedLogo')}</SelectItem>}
                                            <SelectItem value={LOGO_REFERENCE_CUSTOM}>{t('branding.customUrl')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : null}
                                {(isCustomExpanded || !hasDefinedLogos) && (
                                    <div className="pt-2">
                                        <FormControl>
                                            <ImageUploadField
                                                value={field.value}
                                                onChange={field.onChange}
                                                aihint="sidebar logo"
                                                contextPath={sidebarContextPath}
                                            />
                                        </FormControl>
                                    </div>
                                )}
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name="leftSidebarLogoCollapsedUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('branding.logoCollapsed')}</FormLabel>
                                 {hasDefinedLogos ? (
                                    <Select onValueChange={(value) => field.onChange(value === LOGO_REFERENCE_CUSTOM ? '' : value)} value={isCustomCollapsed ? LOGO_REFERENCE_CUSTOM : field.value || LOGO_REFERENCE_COLLAPSED}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {mainLogoUrl && <SelectItem value={LOGO_REFERENCE_MAIN}>{t('branding.useMainLogo')}</SelectItem>}
                                            {collapsedLogoUrl && <SelectItem value={LOGO_REFERENCE_COLLAPSED}>{t('branding.useCollapsedLogo')}</SelectItem>}
                                            <SelectItem value={LOGO_REFERENCE_CUSTOM}>{t('branding.customUrl')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                 ) : null}
                                {(isCustomCollapsed || !hasDefinedLogos) && (
                                     <div className="pt-2">
                                        <FormControl>
                                            <ImageUploadField
                                                value={field.value}
                                                onChange={field.onChange}
                                                aihint="sidebar icon"
                                                contextPath={sidebarContextPath}
                                            />
                                        </FormControl>
                                     </div>
                                )}
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField control={control} name="leftSidebarLogoSize" render={({ field }) => ( <FormItem><FormLabel>{t('branding.logoSize')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="small">{t('sizes.small')}</SelectItem><SelectItem value="medium">{t('sizes.medium')}</SelectItem><SelectItem value="large">{t('sizes.large')}</SelectItem></SelectContent></Select></FormItem> )}/>
            </div>
             <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-base font-medium">{t('appName.title')}</h3>
                <FormField control={control} name="leftSidebarShowAppName" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between"><FormLabel>{t('appName.show')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                {showAppName && (
                    <div className="pl-4 space-y-4 pt-4 border-t">
                        <FormField control={control} name="leftSidebarAppNameType" render={({ field }) => ( <FormItem><FormLabel>{t('appName.source')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="full">{t('appName.sources.full')}</SelectItem><SelectItem value="nickname">{t('appName.sources.nickname')}</SelectItem><SelectItem value="custom">{t('appName.sources.custom')}</SelectItem></SelectContent></Select></FormItem> )}/>
                         {appNameType === 'custom' && (
                            <FormField control={control} name="leftSidebarAppNameCustomText" render={({ field }) => ( <FormItem><FormLabel>{t('appName.customText')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem> )}/>
                        )}
                        <GoogleFontSelect name="leftSidebarAppNameFont" label={t('appName.fontFamily')} />
                        <FormField control={control} name="leftSidebarAppNameFontWeight" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Pilcrow className="mr-2 h-4 w-4" />{t('appName.fontWeight')}</FormLabel><Select onValueChange={field.onChange} value={field.value ?? '600'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                        <FormField control={control} name="leftSidebarAppNameLetterSpacing" render={({ field: { value, onChange } }) => (<FormItem><FormLabel className="flex items-center"><CaseSensitive className="mr-2 h-4 w-4"/>{t('appName.letterSpacing')}</FormLabel><div className="flex items-center gap-4"><FormControl><Slider value={[value ?? 0]} onValueChange={(val) => onChange(val[0])} min={-0.1} max={0.1} step={0.005} /></FormControl><span className="text-sm font-mono w-20 text-center border rounded-md py-1">{(value ?? 0).toFixed(3)}em</span></div></FormItem>)}/>
                        <Controller name="leftSidebarAppNameColor" control={control} render={({ field }) => <ColorPickerInput label={t('appName.color')} value={field.value} onValueChange={field.onChange} />} />
                        
                        <TextEffectsControl prefix="leftSidebarAppName" t={tShared} />
                        <TextAnimationsControl prefix="leftSidebarAppNameAnimation" t={tShared} />

                        <FormField control={control} name="leftSidebarLinkOnAppName" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between"><FormLabel>{t('appName.enableLink')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                        {linkOnAppName && (
                             <div className="pl-4 space-y-4 pt-4 border-t">
                                 <FormField control={control} name="leftSidebarLinkToHome" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between"><FormLabel>{t('appName.linkToHome')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                                 {!linkToHome && (
                                    <FormField
                                        control={control}
                                        name="leftSidebarAppNameLinkHref"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><Link2 className="mr-2 h-4 w-4"/>{t('appName.linkHref')}</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('appName.selectDestination')}/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {destinationPages.map(page => 
                                                            <SelectItem key={page.menuKey} value={page.originalHref}>
                                                                {page.displayName}
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>{t('appName.destinationDescription')}</FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                 )}
                             </div>
                        )}
                    </div>
                )}
            </div>
            
            <ComponentStyleControls prefix="sidebar" t={tShared} />

            <div className="space-y-6 rounded-lg border p-4">
                <div>
                    <h3 className="text-base font-medium">{t('background.title')}</h3>
                    <p className="text-xs text-muted-foreground">{t('background.description')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={control} name="sidebarBackgroundType" render={({ field }) => (
                        <FormItem className="space-y-3"><Label>{t('background.typeLabel')}</Label><RadioGroup value={field.value} onValueChange={field.onChange} className="flex items-center gap-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="solid" /></FormControl><Label className="font-normal cursor-pointer">{t('background.solid')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="gradient" /></FormControl><Label className="font-normal cursor-pointer">{t('background.gradient')}</Label></FormItem></RadioGroup></FormItem>
                    )}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller name="sidebarBackgroundColor1" control={control} render={({ field }) => <ColorPickerInput label={backgroundType === 'gradient' ? t('background.gradientColor1') : t('background.colorLabel')} value={field.value} onValueChange={field.onChange} />} />
                    {backgroundType === 'gradient' && (
                        <Controller name="sidebarBackgroundColor2" control={control} render={({ field }) => <ColorPickerInput label={t('background.gradientColor2')} value={field.value} onValueChange={field.onChange} />} />
                    )}
                </div>
                {backgroundType === 'gradient' && (
                    <div className="pt-2">
                       <GradientDirectionInput name="sidebarGradientDirection" label={t('background.gradientDirection')} />
                    </div>
                )}
            </div>
            
            <Separator />
            
            <div className="space-y-4 rounded-lg border p-4">
                 <h3 className="text-base font-medium">{t('items.title')}</h3>
                 <p className="text-xs text-muted-foreground">{t('items.description')}</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Controller name="sidebarForegroundColor" control={control} render={({ field }) => <ColorPickerInput label={t('items.defaultColor')} value={field.value} onValueChange={field.onChange} />} />
                    <Controller name="sidebarItemActiveBackgroundColor" control={control} render={({ field }) => <ColorPickerInput label={t('items.activeBackground')} value={field.value} onValueChange={field.onChange} />} />
                    <Controller name="sidebarItemActiveTextColor" control={control} render={({ field }) => <ColorPickerInput label={t('items.activeColor')} value={field.value} onValueChange={field.onChange} />} />
                 </div>
            </div>
        </div>
    );
};
