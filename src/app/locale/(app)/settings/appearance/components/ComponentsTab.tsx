// src/app/locale/(app)/settings/appearance/components/ComponentsTab.tsx
"use client";

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ColorPickerInput } from '@/components/shared/form/ColorPickerInput';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

export const ComponentsTab = () => {
    const t = useTranslations('appearance.components');
    const { control } = useFormContext();

    const backgroundFields = [
        { name: "foregroundColor", label: t('mainText') },
        { name: "baseBackgroundColor", label: t('baseBackground') },
        { name: "cardColor", label: t('cardBackground') },
        { name: "cardForegroundColor", label: t('cardText') },
        { name: "popoverColor", label: t('popoverBackground') },
        { name: "popoverForegroundColor", label: t('popoverText') },
        { name: "secondaryColor", label: t('secondaryBackground') },
        { name: "secondaryForegroundColor", label: t('secondaryText') },
        { name: "mutedColor", label: t('mutedBackground') },
        { name: "mutedForegroundColor", label: t('mutedText') },
    ];

    const interactionFields = [
        { name: "borderColor", label: t('defaultBorder') },
        { name: "inputBorderColor", label: t('inputBorder') },
        { name: "ringColor", label: t('focusRing') },
    ];

    return (
        <div className="pt-6 space-y-6">
            <h3 className="text-lg font-medium">{t('backgroundsTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {backgroundFields.map(({ name, label }) => (
                    <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                            <ColorPickerInput
                                label={label}
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                ))}
            </div>
            <Separator />
            <h3 className="text-lg font-medium">{t('interactionsTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interactionFields.map(({ name, label }) => (
                    <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                            <ColorPickerInput
                                label={label}
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
