// src/app/locale/(app)/settings/appearance/components/MainColorsTab.tsx
"use client";

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { useTranslations } from 'next-intl';

export const MainColorsTab = () => {
    const t = useTranslations('appearance.mainColors');
    const { control } = useFormContext();

    const colorFields: { name: string; label: string }[] = [
        { name: "primaryColor", label: t('primary') },
        { name: "primaryForegroundColor", label: t('primaryForeground') },
        { name: "accentColor", label: t('accent') },
        { name: "accentForegroundColor", label: t('accentForeground') },
        { name: "destructiveColor", label: t('destructive') },
        { name: "destructiveForegroundColor", label: t('destructiveForeground') },
    ];

    return (
        <div className="pt-6 space-y-6">
            <h3 className="text-lg font-medium">{t('title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colorFields.map(({ name, label }) => (
                    <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <ColorPickerInput
                                label={label}
                                value={value}
                                onValueChange={onChange}
                            />
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
