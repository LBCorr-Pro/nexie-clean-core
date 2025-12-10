// src/lib/data/theme-presets.ts
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { defaultAppearance } from '@/lib/default-appearance'; // Importar o tema padrão

export type FontSettings = {
    fontFamilyTitle?: string;
    fontFamilyBody?: string;
};

export type ThemePreset = {
  name: string;
  settings: Partial<AppearanceSettings>;
}

// Todos os presets agora incluem todas as propriedades para garantir a completude.
// Se uma propriedade não for especificada, ela usará o valor de 'defaultAppearance'.
const mergeWithDefaults = (settings: Partial<AppearanceSettings>): Partial<AppearanceSettings> => {
    // Isso garante que qualquer preset sempre tenha a estrutura completa.
    return { ...defaultAppearance, ...settings };
};


export const themePresets: ThemePreset[] = [
  {
    name: "Padrão (Nexie Azul)",
    settings: defaultAppearance,
  },
  {
    name: "Laranja Quente",
    settings: mergeWithDefaults({
      primaryColor: "#F97316",
      primaryForegroundColor: "#FFFFFF",
      backgroundColor: "#FFF7ED",
      foregroundColor: "#332211",
      cardColor: "#FFFFFF",
      cardForegroundColor: "#332211",
      popoverColor: "#FFFFFF",
      popoverForegroundColor: "#332211",
      secondaryColor: "#FED7AA",
      secondaryForegroundColor: "#7C2D12",
      accentColor: "#FB923C",
      accentForegroundColor: "#FFFFFF",
      destructiveColor: "#DC2626",
      destructiveForegroundColor: "#FFFFFF",
      borderColor: "#FDE68A",
      inputBorderColor: "#FDE68A",
      inputBackgroundColor: "#FFFFFF",
      ringColor: "#FB923C",
      fontFamilyPageTitle: "Oswald",
      fontFamilyBody: "Roboto",
      layoutStyle: "default",
      backgroundType: "color",
      backgroundEffect: "none",
      sidebarStyle: 'flat',
      sidebarBackgroundType: 'solid',
      sidebarBackgroundColor1: '#FFF7ED',
      topBarStyle: 'flat',
      topBarBackgroundType: 'solid',
      topBarBackgroundColor1: '#FFFFFF',
      bottomBarStyle: 'flat',
      bottomBarBackgroundType: 'solid',
      bottomBarBackgroundColor1: '#FFFFFF'
    })
  },
  {
    name: "Violeta Moderno",
    settings: mergeWithDefaults({
      primaryColor: "#8B5CF6",
      primaryForegroundColor: "#FFFFFF",
      backgroundColor: "#F5F3FF",
      foregroundColor: "#282137",
      cardColor: "#FFFFFF",
      cardForegroundColor: "#282137",
      popoverColor: "#FFFFFF",
      popoverForegroundColor: "#282137",
      secondaryColor: "#EDE9FE",
      secondaryForegroundColor: "#5B21B6",
      accentColor: "#A78BFA",
      accentForegroundColor: "#FFFFFF",
      destructiveColor: "#EF4444",
      destructiveForegroundColor: "#FFFFFF",
      borderColor: "#DDD6FE",
      inputBorderColor: "#DDD6FE",
      inputBackgroundColor: "#FFFFFF",
      ringColor: "#A78BFA",
      fontFamilyPageTitle: "Poppins",
      fontFamilyBody: "Inter",
      layoutStyle: "glassmorphism",
      layoutOpacity: 0.7,
      backgroundType: "gradient",
      backgroundEffect: "animated-grid",
      backgroundGradientFrom: "#a78bfa",
      backgroundGradientTo: "#db2777",
      backgroundGradientDirection: 'to top right',
      sidebarStyle: 'glass',
      sidebarBackgroundType: 'solid',
      sidebarBackgroundColor1: '#FFFFFF',
      topBarStyle: 'glass',
      topBarBackgroundType: 'solid',
      topBarBackgroundColor1: '#FFFFFF',
      bottomBarStyle: 'glass',
      bottomBarBackgroundType: 'solid',
      bottomBarBackgroundColor1: '#FFFFFF',
    })
  },
  {
    name: "Neptune (Modo Escuro)",
    settings: mergeWithDefaults({
      themePreference: 'dark',
      primaryColor: "#38BDF8", // Light Blue
      primaryForegroundColor: "#071726", // Dark Blue
      backgroundColor: "#0F172A", // Slate 900
      foregroundColor: "#E2E8F0", // Slate 200
      cardColor: "rgba(30, 41, 59, 0.6)", // Slate 800 with transparency
      cardForegroundColor: "#E2E8F0",
      popoverColor: "rgba(22, 31, 45, 0.8)",
      popoverForegroundColor: "#E2E8F0",
      secondaryColor: "#334155", // Slate 700
      secondaryForegroundColor: "#E2E8F0",
      accentColor: "#38BDF8",
      accentForegroundColor: "#071726",
      destructiveColor: "#F43F5E", // Rose 500
      destructiveForegroundColor: "#FFFFFF",
      mutedColor: "#1E293B",
      mutedForegroundColor: "#94A3B8",
      borderColor: "rgba(51, 65, 85, 0.5)", // Slate 700 with transparency
      inputBorderColor: "rgba(51, 65, 85, 0.5)",
      inputBackgroundColor: "rgba(30, 41, 59, 0.6)",
      ringColor: "#38BDF8",
      fontFamilyPageTitle: "Orbitron",
      fontFamilyBody: "Source Code Pro",
      layoutStyle: "glassmorphism",
      layoutOpacity: 0.6,
      backgroundType: "color",
      backgroundEffect: "subtle-dust",
      sidebarStyle: 'glass',
      sidebarBackgroundType: 'solid',
      sidebarBackgroundColor1: '#1E293B',
      topBarStyle: 'glass',
      topBarBackgroundType: 'solid',
      topBarBackgroundColor1: '#1E293B',
      bottomBarStyle: 'glass',
      bottomBarBackgroundType: 'solid',
      bottomBarBackgroundColor1: '#1E293B'
    })
  },
  {
    name: "Creme Elegante",
    settings: mergeWithDefaults({
      primaryColor: "#834D2A", // Dark Brown
      primaryForegroundColor: "#FDFBF7",
      backgroundColor: "#FDFBF7", // Off-white cream
      foregroundColor: "#533527",
      cardColor: "#FAF5EF",
      cardForegroundColor: "#533527",
      popoverColor: "#FAF5EF",
      popoverForegroundColor: "#533527",
      secondaryColor: "#EAE0D5",
      secondaryForegroundColor: "#834D2A",
      accentColor: "#C6A487",
      accentForegroundColor: "#FDFBF7",
      destructiveColor: "#C70039",
      destructiveForegroundColor: "#FDFBF7",
      borderColor: "#EAE0D5",
      inputBorderColor: "#EAE0D5",
      inputBackgroundColor: "#FAF5EF",
      ringColor: "#C6A487",
      fontFamilyTitle: "Playfair Display",
      fontFamilyBody: "Lora",
      layoutStyle: "default",
      backgroundType: "color",
      backgroundEffect: "none",
      sidebarStyle: 'flat',
      sidebarBackgroundType: 'solid',
      sidebarBackgroundColor1: '#FAF5EF',
      topBarStyle: 'flat',
      topBarBackgroundType: 'solid',
      topBarBackgroundColor1: '#FAF5EF',
      bottomBarStyle: 'flat',
      bottomBarBackgroundType: 'solid',
      bottomBarBackgroundColor1: '#FAF5EF'
    })
  },
  {
    name: "Floresta Terrosa",
    settings: mergeWithDefaults({
        primaryColor: "#556B2F", // Dark Olive Green
        primaryForegroundColor: "#FFFFFF",
        backgroundColor: "#F0F3E8",
        foregroundColor: "#2F3D2F",
        cardColor: "#FFFFFF",
        cardForegroundColor: "#2F3D2F",
        popoverColor: "#FFFFFF",
        popoverForegroundColor: "#2F3D2F",
        secondaryColor: "#DADDD8",
        secondaryForegroundColor: "#556B2F",
        accentColor: "#93A866",
        accentForegroundColor: "#FFFFFF",
        destructiveColor: "#A94442",
        destructiveForegroundColor: "#FFFFFF",
        borderColor: "#C3C9B8",
        inputBorderColor: "#C3C9B8",
        inputBackgroundColor: "#FFFFFF",
        ringColor: "#93A866",
        fontFamilyTitle: "Merriweather",
        fontFamilyBody: "Nunito",
        layoutStyle: "default",
        backgroundType: "image",
        backgroundImageUrl: "https://www.transparenttextures.com/patterns/wood-pattern.png",
        backgroundEffect: "none",
        sidebarStyle: 'flat',
        sidebarBackgroundType: 'solid',
        sidebarBackgroundColor1: '#FFFFFF',
        topBarStyle: 'flat',
        topBarBackgroundType: 'solid',
        topBarBackgroundColor1: '#FFFFFF',
        bottomBarStyle: 'flat',
        bottomBarBackgroundType: 'solid',
        bottomBarBackgroundColor1: '#FFFFFF'
    })
  },
];
