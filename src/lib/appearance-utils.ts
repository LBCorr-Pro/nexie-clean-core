// src/lib/appearance-utils.ts
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { generateColorVariables, generateLayoutVariables } from './appearance/colors-layout';
import { generateBodyBackgroundCss } from './appearance/background';
import { generateNavBarsCss } from './appearance/nav-bars';
import { defaultAppearance } from '@/lib/default-appearance';
import { defaultDarkColorsForTheme } from '@/lib/default-dark-theme';

/**
 * Função principal que orquestra a geração de toda a folha de estilo dinâmica.
 * @param settings As configurações de aparência recebidas.
 * @param resolvedTheme O tema ativo ('light' ou 'dark'), fornecido pelo next-themes.
 */
export const generateAppearanceCss = (settings: Partial<AppearanceSettings> | null, resolvedTheme?: 'light' | 'dark'): string => {
    const isDarkMode = resolvedTheme === 'dark';
    
    // Começa com a aparência padrão, mescla as cores padrão do tema escuro se aplicável,
    // e finalmente mescla as configurações personalizadas do usuário/instância.
    const baseSettings = isDarkMode
        ? { ...defaultAppearance, ...defaultDarkColorsForTheme }
        : { ...defaultAppearance };

    const safeSettings: AppearanceSettings = { ...baseSettings, ...(settings || {}) };

    // Gera as variáveis de cores e layout
    const colorVars = generateColorVariables(safeSettings, resolvedTheme);
    const layoutVars = generateLayoutVariables(safeSettings);
    
    const allVars = { ...colorVars, ...layoutVars };

    const cssString = Object.entries(allVars).map(([key, value]) => `${key}: ${value};`).join(' ');

    // Gera o bloco de CSS para o seletor correto (:root ou .dark).
    // Usamos :root para ambos para garantir que as variáveis dinâmicas sempre sobrescrevam
    // as do globals.css, e o seletor de classe .dark no HTML controlará qual conjunto é usado.
    const themeSelector = isDarkMode ? '.dark' : ':root';
    const mainBlock = `${themeSelector} { ${cssString} }\n`;
    
    // Gera os estilos que não dependem de variáveis CSS, como o fundo da página e das barras.
    const bodyBackgroundBlock = generateBodyBackgroundCss(safeSettings);
    const navBarsBlock = generateNavBarsCss(safeSettings);
    
    let focusRingCss = `*:focus-visible { outline-style: solid !important; }`;
    if (safeSettings.focusRingStyle && safeSettings.focusRingStyle !== 'default') {
        focusRingCss = `*:focus-visible { outline-style: ${safeSettings.focusRingStyle} !important; }`;
    }

    // Retorna a folha de estilo completa
    return mainBlock + bodyBackgroundBlock + navBarsBlock + focusRingCss;
};
