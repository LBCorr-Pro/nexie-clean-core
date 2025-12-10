// src/components/settings/appearance/components/AppearancePreviewManager.tsx
"use client";

import React from 'react';
import { DynamicThemeApplicator } from '@/components/dynamic-theme-applicator';

/**
 * @deprecated This component is being phased out. Its logic has been merged into
 * the more generic DynamicThemeApplicator. This component now simply acts as a wrapper
 * to call DynamicThemeApplicator from within the form context on the appearance page.
 */
export const AppearancePreviewManager = () => {
    // O DynamicThemeApplicator usará internamente o contexto do formulário (de FormProvider em page.tsx)
    // para obter os valores observados e gerar os estilos de preview.
    return <DynamicThemeApplicator />;
};
