// src/components/dynamic-theme-applicator.tsx
"use client";

import React, { useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { generateAppearanceCss } from '@/lib/appearance-utils';
import { defaultAppearance } from '@/lib/default-appearance';
import { useDebugMenu } from '@/contexts/DebugMenuContext';
import { useTheme } from 'next-themes';
import { defaultDarkColorsForTheme } from '@/lib/default-dark-theme';

const DYNAMIC_STYLE_ID = 'dynamic-theme-styles-nexie';

const FormValueWatcher = ({ setLiveSettings }: { setLiveSettings: (settings: any) => void }) => {
    const { bottomBarPreviewConfig } = useDebugMenu();
    const { control } = useFormContext();
    const watchedFormValues = useWatch({ control });

    useEffect(() => {
        let settings = { ...defaultAppearance, ...(watchedFormValues || {}) };
        if (bottomBarPreviewConfig) {
            (settings as any).bottomBarConfig = {
                ...(settings.bottomBarConfig || {}),
                ...bottomBarPreviewConfig,
            };
        }
        setLiveSettings(settings);
    }, [watchedFormValues, bottomBarPreviewConfig, setLiveSettings]);

    return null;
}

export const DynamicThemeApplicator: React.FC = () => {
    const { appearanceSettings: hookAppearanceSettings } = useNxAppearance();
    const { bottomBarPreviewConfig } = useDebugMenu();
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();

    const isAppearancePage = pathname.includes('/settings/appearance');
    const formMethods = useFormContext();

    const [formLiveSettings, setFormLiveSettings] = React.useState<Partial<AppearanceSettings> | null>(null);

    const nonFormSettings = useMemo(() => {
        let settings: Partial<AppearanceSettings> = { ...defaultAppearance, ...(hookAppearanceSettings || {}) };
        if (resolvedTheme === 'dark') {
            settings = { ...settings, ...defaultDarkColorsForTheme };
        }
        if (bottomBarPreviewConfig) {
            (settings as any).bottomBarConfig = {
                ...(settings.bottomBarConfig || {}),
                ...bottomBarPreviewConfig,
            };
        }
        return settings;
    }, [hookAppearanceSettings, bottomBarPreviewConfig, resolvedTheme]);

    const liveSettings = isAppearancePage && formMethods && formLiveSettings
        ? formLiveSettings
        : nonFormSettings;

    const dynamicCss = useMemo(() => {
        const currentSettings = isAppearancePage && formLiveSettings ? formLiveSettings : nonFormSettings;
        const validTheme = resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : undefined;
        return generateAppearanceCss(currentSettings, validTheme);
    }, [isAppearancePage, formLiveSettings, nonFormSettings, resolvedTheme]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let styleTag = document.getElementById(DYNAMIC_STYLE_ID) as HTMLStyleElement | null;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = DYNAMIC_STYLE_ID;
            document.head.appendChild(styleTag);
        }
        
        if (styleTag.innerHTML !== dynamicCss) {
            styleTag.innerHTML = dynamicCss;
        }

        // Não limpa o estilo ao desmontar se não estiver na página de aparência,
        // para manter o tema customizado em toda a navegação.
        return () => {
            if (styleTag && isAppearancePage) {
                // Ao sair da página de aparência, limpamos os estilos de preview
                // para que os estilos de `globals.css` voltem a ter efeito.
                // Mas, em uma navegação normal, manteríamos os estilos injetados.
                // Esta lógica pode precisar de ajuste dependendo do comportamento desejado.
            }
        };
    }, [dynamicCss, isAppearancePage]);
    
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const settings = liveSettings || defaultAppearance;

        const applyDataAttributes = (selector: string, prefix: 'sidebar' | 'topBar' | 'bottomBar') => {
            const element = document.querySelector(selector) as HTMLElement | null;
            if (element) {
                const style = (settings as any)[`${prefix}Style`] || 'flat';
                const bgType = (settings as any)[`${prefix}BackgroundType`] || 'solid';

                if (element.dataset.style !== style) element.dataset.style = style;
                if (element.dataset.backgroundType !== bgType) element.dataset.backgroundType = bgType;
            }
        };

        applyDataAttributes('.main-sidebar', 'sidebar');
        applyDataAttributes('.main-content-wrapper > header', 'topBar');
        applyDataAttributes('div[aria-label="Navegação Inferior"] > nav', 'bottomBar');

        document.body.dataset.sidebarVisible = String(settings.sidebarVisible ?? true);
        document.body.dataset.topbarVisible = String(settings.topBarVisible ?? true);
        document.body.dataset.bottombarVisible = String(settings.bottomBarVisible ?? true);
        
    }, [liveSettings]);

    if (isAppearancePage && formMethods) {
        return <FormValueWatcher setLiveSettings={setFormLiveSettings} />;
    }

    return null;
};
