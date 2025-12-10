// src/lib/appearance/colors-layout.ts
import { hexToHslParts } from '@/lib/color-utils';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';

const isHex = (value: any): value is string => typeof value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(value);

/**
 * Generates an object with all the CSS color variables based on the settings.
 * This version includes a fix to correctly apply dark theme text colors for navigation elements.
 * @param settings - The appearance settings.
 * @param resolvedTheme - The currently active theme ('light' or 'dark').
 * @returns An object mapping CSS variable names to their HSL values.
 */
export function generateColorVariables(settings: Partial<AppearanceSettings>, resolvedTheme?: 'light' | 'dark'): Record<string, string> {
    const isDarkMode = resolvedTheme === 'dark';
    const variables: Record<string, string> = {};
    const values = settings;

    const colorMappings: Partial<Record<keyof AppearanceSettings, string>> = {
        primaryColor: '--primary', primaryForegroundColor: '--primary-foreground',
        accentColor: '--accent', accentForegroundColor: '--accent-foreground',
        destructiveColor: '--destructive', destructiveForegroundColor: '--destructive-foreground',
        
        background: '--background',
        foreground: '--foreground',
        
        cardColor: '--card', cardForegroundColor: '--card-foreground',
        popoverColor: '--popover', popoverForegroundColor: '--popover-foreground',
        secondaryColor: '--secondary', secondaryForegroundColor: '--secondary-foreground',
        mutedColor: '--muted', mutedForegroundColor: '--muted-foreground',
        
        borderColor: '--border', inputBorderColor: '--input', ringColor: '--ring',
        inputBackgroundColor: '--input-background',
        
        headerBackgroundColor: '--header-background',
        tabsTriggerActiveBackgroundColor: '--tabs-trigger-active-background',
        skeletonBaseColor: '--skeleton-base-color',
        skeletonHighlightColor: '--skeleton-highlight-color',
        
        // Sidebar Colors
        sidebarForegroundColor: '--sidebar-foreground',
        sidebarItemActiveBackgroundColor: '--sidebar-accent',
        sidebarItemActiveTextColor: '--sidebar-accent-foreground',
        sidebarPrimaryColor: '--sidebar-primary',
        sidebarPrimaryForegroundColor: '--sidebar-primary-foreground',
        sidebarBackgroundColor1: '--sidebar-bg-1',
        sidebarBackgroundColor2: '--sidebar-bg-2',
        sidebarBorderColor1: '--sidebar-border-color-1',
        sidebarBorderColor2: '--sidebar-border-color-2',
        leftSidebarAppNameColor: '--left-sidebar-app-name-color',
        leftSidebarAppNameTextColor1: '--left-sidebar-app-name-text-color-1',
        leftSidebarAppNameTextColor2: '--left-sidebar-app-name-text-color-2',
        leftSidebarAppNameTextShadowColor: '--left-sidebar-app-name-text-shadow-color',
        leftSidebarAppNameTextGlowColor: '--left-sidebar-app-name-text-glow-color',
        
        // Top Bar Colors
        topBarIconColor: '--header-foreground',
        topBarTriggerIconColor: '--top-bar-trigger-icon-color',
        topBarBackgroundColor1: '--top-bar-bg-1',
        topBarBackgroundColor2: '--top-bar-bg-2',
        topBarBorderColor1: '--top-bar-border-color-1',
        topBarBorderColor2: '--top-bar-border-color-2',
        topBarTextColor: '--top-bar-text-color',
        topBarBrandingTextTextColor1: '--top-bar-branding-text-text-color-1',
        topBarBrandingTextTextColor2: '--top-bar-branding-text-text-color-2',
        topBarBrandingTextShadowColor: '--top-bar-branding-text-shadow-color',
        topBarBrandingTextGlowColor: '--top-bar-branding-text-glow-color',

        // Bottom Bar Colors
        bottomBarIconColorActive: '--bottom-bar-icon-active',
        bottomBarIconColorInactive: '--bottom-bar-icon-inactive',
        bottomBarTextColorActive: '--bottom-bar-text-active',
        bottomBarTextColorInactive: '--bottom-bar-text-inactive',
        bottomBarBackgroundColor1: '--bottom-bar-bg-1',
        bottomBarBackgroundColor2: '--bottom-bar-bg-2',
        bottomBarBorderColor1: '--bottom-bar-border-color-1',
        bottomBarBorderColor2: '--bottom-bar-border-color-2',
    };

    for (const key in colorMappings) {
        const hex = values[key as keyof typeof values] as string | undefined;
        const varName = colorMappings[key as keyof typeof colorMappings];

        if (hex && isHex(hex)) {
            const hsl = hexToHslParts(hex);
            if (hsl && varName) {
                variables[varName] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
                
                // Specific HSL values for glass effect
                if (['sidebarBackgroundColor1', 'topBarBackgroundColor1', 'bottomBarBackgroundColor1', 'cardColor'].includes(key)) {
                    variables[`--${key.replace('Color1', '-bg-1-hsl').replace('Color', '-hsl')}`] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
                }
            }
        }
    }

    // *** DARK THEME TEXT COLOR FIX ***
    // If dark mode is active, and no specific color is set for sidebar/topbar text,
    // force it to use the main foreground color (which is light in dark mode).
    if (isDarkMode) {
        if (!settings.sidebarForegroundColor) {
            variables['--sidebar-foreground'] = 'var(--foreground)';
        }
        if (!settings.topBarTextColor) {
            variables['--top-bar-text-color'] = 'var(--foreground)';
        }
    }
    
    // Handle special case for page background color (which can be a direct HEX value)
    if (isHex(values.backgroundColor)) {
        variables['--page-background'] = values.backgroundColor;
    }
    
    return variables;
}


/**
 * Genera um objeto com todas as variáveis de layout (não-cor) CSS.
 * @param settings - As configurações de aparência.
 * @returns Um objeto mapeando nomes de variáveis CSS para seus valores.
 */
export function generateLayoutVariables(settings: Partial<AppearanceSettings>): Record<string, string> {
    const layoutVariables: Record<string, string> = {};
    const values = settings;

    // ... (toda a lógica de layout permanece a mesma)

    layoutVariables['--layout-opacity'] = values.layoutOpacity?.toString() ?? '0.8';

    const radiusMap = { sharp: '0rem', subtle: '0.3rem', smooth: '0.5rem', rounded: '0.75rem', pill: '1.5rem' };
    layoutVariables['--radius'] = radiusMap[values.borderRadiusPreset as keyof typeof radiusMap] || '0.5rem';

    // Tipografia Geral
    if (values.fontFamilyPageTitle) layoutVariables['--font-family-page-title'] = `'${values.fontFamilyPageTitle}', sans-serif`;
    if (values.fontFamilyPageSubtitle) layoutVariables['--font-family-page-subtitle'] = `'${values.fontFamilyPageSubtitle}', sans-serif`;
    if (values.fontFamilySectionTitle) layoutVariables['--font-family-section-title'] = `'${values.fontFamilySectionTitle}', sans-serif`;
    if (values.fontFamilyBody) layoutVariables['--font-family-body'] = `'${values.fontFamilyBody}', sans-serif`;
    
    if (values.fontSizePageTitle) layoutVariables['--font-size-page-title'] = `${values.fontSizePageTitle}px`;
    if (values.fontSizePageSubtitle) layoutVariables['--font-size-page-subtitle'] = `${values.fontSizePageSubtitle}px`;
    if (values.fontSizeSectionTitle) layoutVariables['--font-size-section-title'] = `${values.fontSizeSectionTitle}px`;
    if (values.fontSizeBody) layoutVariables['--font-size-body'] = `${values.fontSizeBody}px`;

    if (values.fontWeightPageTitle) layoutVariables['--font-weight-page-title'] = values.fontWeightPageTitle;
    if (values.fontWeightPageSubtitle) layoutVariables['--font-weight-page-subtitle'] = values.fontWeightPageSubtitle;
    if (values.fontWeightSectionTitle) layoutVariables['--font-weight-section-title'] = values.fontWeightSectionTitle;
    if (values.fontWeightBody) layoutVariables['--font-weight-body'] = values.fontWeightBody;
    
    if (typeof values.letterSpacingPageTitle === 'number') layoutVariables['--letter-spacing-page-title'] = `${values.letterSpacingPageTitle}em`;
    if (typeof values.letterSpacingPageSubtitle === 'number') layoutVariables['--letter-spacing-page-subtitle'] = `${values.letterSpacingPageSubtitle}em`;
    if (typeof values.letterSpacingSectionTitle === 'number') layoutVariables['--letter-spacing-section-title'] = `${values.letterSpacingSectionTitle}em`;
    if (typeof values.letterSpacingBody === 'number') layoutVariables['--letter-spacing-body'] = `${values.letterSpacingBody}em`;

    if (typeof values.lineHeightPageTitle === 'number') layoutVariables['--line-height-page-title'] = `${values.lineHeightPageTitle}`;
    if (typeof values.lineHeightPageSubtitle === 'number') layoutVariables['--line-height-page-subtitle'] = `${values.lineHeightPageSubtitle}`;
    if (typeof values.lineHeightSectionTitle === 'number') layoutVariables['--line-height-section-title'] = `${values.lineHeightSectionTitle}`;
    if (typeof values.lineHeightBody === 'number') layoutVariables['--line-height-body'] = `${values.lineHeightBody}`;

    if (values.ringWidth) layoutVariables['--ring-width'] = `${values.ringWidth}px`;
    if (values.skeletonAnimationSpeed) layoutVariables['--skeleton-animation-duration'] = `${values.skeletonAnimationSpeed}s`;

    // Barras de Navegação - Bordas
    if (typeof values.sidebarBorderWidth === 'number') layoutVariables['--sidebar-border-width'] = `${values.sidebarBorderWidth}px`;
    if (values.sidebarGradientDirection) layoutVariables['--sidebar-border-gradient-direction'] = values.sidebarGradientDirection;
    if (typeof values.topBarBorderWidth === 'number') layoutVariables['--top-bar-border-width'] = `${values.topBarBorderWidth}px`;
    if (values.topBarBorderGradientDirection) layoutVariables['--top-bar-border-gradient-direction'] = values.topBarBorderGradientDirection;
    if (typeof values.bottomBarBorderWidth === 'number') layoutVariables['--bottom-bar-border-width'] = `${values.bottomBarBorderWidth}px`;
    if (values.bottomBarBorderGradientDirection) layoutVariables['--bottom-bar-border-gradient-direction'] = values.bottomBarBorderGradientDirection;

    // Barra Inferior - Layout
    if (values.bottomBarFontFamily) layoutVariables['--bottom-bar-font-family'] = `'${values.bottomBarFontFamily}', sans-serif`;
    if (typeof values.bottomBarFontSize === 'number') layoutVariables['--bottom-bar-font-size'] = `${values.bottomBarFontSize}px`;
    if (typeof values.bottomBarIconSize === 'number') layoutVariables['--bottom-bar-icon-size'] = `${values.bottomBarIconSize}px`;
    if (typeof values.bottomBarIconLabelSpacing === 'number') layoutVariables['--bottom-bar-icon-label-spacing'] = `${values.bottomBarIconLabelSpacing}px`;
    layoutVariables['--bottom-bar-items-alignment'] = values.bottomBarItemsAlignment || 'space-around';
    layoutVariables['--bottom-bar-items-gap'] = `${values.bottomBarItemsGap || 0}px`;
    layoutVariables['--bottom-bar-item-vertical-align'] = values.bottomBarItemVerticalAlign || 'center';
    layoutVariables['--bottom-bar-padding-vertical'] = `${values.bottomBarPaddingVertical || 0}px`;
    
    // Barra Superior - Layout & Efeitos de Texto de Branding
    if (values.topBarBrandingTextFontFamily) layoutVariables['--top-bar-font-family'] = `'${values.topBarBrandingTextFontFamily}', sans-serif`;
    if (typeof values.topBarBrandingTextFontSize === 'number') layoutVariables['--top-bar-font-size'] = `${values.topBarBrandingTextFontSize}px`;
    if (values.topBarBrandingTextFontWeight) layoutVariables['--top-bar-font-weight'] = values.topBarBrandingTextFontWeight;
    if (typeof values.topBarBrandingTextLetterSpacing === 'number') layoutVariables['--top-bar-letter-spacing'] = `${values.topBarBrandingTextLetterSpacing}em`;
    if (typeof values.topBarBrandingTextGlowStrength === 'number') layoutVariables['--top-bar-text-glow-strength'] = `${values.topBarBrandingTextGlowStrength}px`;

    // Menu Esquerdo - App Name & Efeitos de Texto
    if (values.leftSidebarAppNameFont) layoutVariables['--left-sidebar-app-name-font'] = `'${values.leftSidebarAppNameFont}', sans-serif`;
    if (values.leftSidebarAppNameFontWeight) layoutVariables['--left-sidebar-app-name-font-weight'] = values.leftSidebarAppNameFontWeight;
    if (typeof values.leftSidebarAppNameLetterSpacing === 'number') layoutVariables['--left-sidebar-app-name-letter-spacing'] = `${values.leftSidebarAppNameLetterSpacing}em`;
    if (typeof values.leftSidebarAppNameTextGlowStrength === 'number') layoutVariables['--left-sidebar-app-name-text-glow-strength'] = `${values.leftSidebarAppNameTextGlowStrength}px`;
    
    return layoutVariables;
}
