// src/app/[locale]/(app)/settings/appearance/components/IdentityTab.tsx
"use client";

import React from 'react';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

interface IdentityTabProps {}

export const IdentityTab: React.FC<IdentityTabProps> = (props: IdentityTabProps) => {
    const t = useTranslations('appearance.identity');
    const { control } = useFormContext();
    const identityContextPath = 'identity_assets';

    return (
        <div className="pt-6 space-y-6">
           <h3 className="text-lg font-medium">{t('browserIconsTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('browserIconsDescription')}</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <FormField
                    control={control}
                    name="appleTouchIconUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('appleTouchIconLabel')}</FormLabel>
                            <FormControl>
                                <ImageUploadField 
                                    value={field.value}
                                    onChange={field.onChange}
                                    aihint="icon apple"
                                    contextPath={`${identityContextPath}/favicons`}
                                />
                            </FormControl>
                            <FormDescription>{t('appleTouchIconDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={control}
                    name="pwaIcon192Url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('pwaIcon192Label')}</FormLabel>
                            <FormControl>
                                <ImageUploadField 
                                    value={field.value}
                                    onChange={field.onChange}
                                    aihint="icon pwa"
                                    contextPath={`${identityContextPath}/favicons`}
                                />
                            </FormControl>
                            <FormDescription>{t('pwaIcon192Description')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="pwaIcon512Url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('pwaIcon512Label')}</FormLabel>
                            <FormControl>
                                <ImageUploadField 
                                    value={field.value}
                                    onChange={field.onChange}
                                    aihint="icon pwa large"
                                    contextPath={`${identityContextPath}/favicons`}
                                />
                            </FormControl>
                            <FormDescription>{t('pwaIcon512Description')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};
