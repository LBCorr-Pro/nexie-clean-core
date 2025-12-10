// src/lib/appearance/nav-bars.ts
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';

/**
 * Helper function to generate the correct background CSS value based on style and settings.
 * This is the core logic to prevent the transparency bug.
 * @returns A complete CSS background value string.
 */
const getBackgroundCssValue = (
  style: string | undefined,
  bgType: 'solid' | 'gradient' | undefined,
  color1Var: string,
  color2Var: string | undefined,
  gradientDir: string | undefined
): string => {
  // For 'glass' style, we always use a hsla value derived from the solid color, with opacity.
  if (style === 'glass') {
    return `hsla(var(${color1Var}-hsl), var(--layout-opacity, 0.8))`;
  }

  // For all other styles (flat, bordered, etc.), we apply the background directly.
  if (bgType === 'gradient' && color2Var) {
    return `linear-gradient(${gradientDir || 'to bottom'}, hsl(var(${color1Var}-hsl)), hsl(var(${color2Var}-hsl)))`;
  }
  
  // Default to solid color.
  return `hsl(var(${color1Var}-hsl))`;
};

/**
 * Generates the CSS rules for the three main navigation bars: sidebar, topbar, and bottombar.
 * This function now contains the corrected logic to avoid unwanted transparent backgrounds.
 * @param settings - The appearance settings object.
 * @returns A string containing the final CSS rules.
 */
export function generateNavBarsCss(settings: Partial<AppearanceSettings>): string {
    
  const sidebarBgValue = getBackgroundCssValue(
    settings.sidebarStyle,
    settings.sidebarBackgroundType,
    '--sidebar-bg-1',
    '--sidebar-bg-2',
    settings.sidebarGradientDirection,
  );

  const topBarBgValue = getBackgroundCssValue(
    settings.topBarStyle,
    settings.topBarBackgroundType,
    '--top-bar-bg-1',
    '--top-bar-bg-2',
    settings.topBarGradientDirection,
  );

  const bottomBarBgValue = getBackgroundCssValue(
    settings.bottomBarStyle,
    settings.bottomBarBackgroundType,
    '--bottom-bar-bg-1',
    '--bottom-bar-bg-2',
    settings.bottomBarGradientDirection,
  );
  
  const activeTabBgValue = bottomBarBgValue;

  // A diretiva !important foi removida daqui. A prioridade agora é controlada pelo globals.css.
  return `
    .main-sidebar { background: ${sidebarBgValue}; }
    .main-content-wrapper > header { background: ${topBarBgValue}; }
    div[aria-label="Navegação Inferior"] > nav { background: ${bottomBarBgValue}; }
    #bottom-bar-tabs-container button[data-active='true'] { background: ${activeTabBgValue}; }
  `;
}
