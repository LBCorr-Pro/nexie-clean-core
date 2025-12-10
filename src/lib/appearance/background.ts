// src/lib/appearance/background.ts
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';

const isHex = (value: any): value is string => typeof value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(value);

/**
 * Gera a string de CSS para o fundo do body.
 * @param settings - As configurações de aparência (garantido que não seja nulo).
 * @returns Uma string CSS.
 */
export function generateBodyBackgroundCss(settings: Partial<AppearanceSettings>): string {
    let bodyCss = '';
    
    if (settings.backgroundType === 'image' && settings.backgroundImageUrl) {
        bodyCss += `background-image: url('${settings.backgroundImageUrl}') !important; background-size: cover; background-position: center; background-attachment: fixed;`;
    } else if (settings.backgroundType === 'gradient' && isHex(settings.backgroundGradientFrom) && isHex(settings.backgroundGradientTo)) {
        bodyCss += `background: linear-gradient(${settings.backgroundGradientDirection || 'to right'}, ${settings.backgroundGradientFrom}, ${settings.backgroundGradientTo}) !important;`;
    } else {
        // A cor de fundo principal é aplicada através da variável CSS --page-background
        // para manter a consistência e permitir que o !important no globals.css funcione.
        bodyCss += `background: var(--page-background) !important;`;
    }
    
    return `body { ${bodyCss} }\n`;
}
