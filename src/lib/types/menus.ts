// src/lib/types/menus.ts
import { z } from "zod";

// Schema para os itens individuais da barra inferior
export const BottomBarItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  href: z.string(),
  order: z.number(),
});

// Schema para as abas da barra inferior
export const BottomBarTabSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  order: z.number(),
  items: z.array(BottomBarItemSchema).default([]),
  enableScroll: z.boolean().default(false),
  maxItems: z.coerce.number().min(1).default(5),
});

// Schema para a configuração completa da barra inferior
export const BottomBarConfigSchema = z.object({
    enabledOnDesktop: z.boolean().default(false),
    desktopPosition: z.enum(['bottom', 'right']).default('bottom'),
    enableTabs: z.boolean().default(false),
    showTitleOnSingleTab: z.boolean().default(false),
    tabsAlignment: z.enum(['start', 'center', 'end']).default('start'),
    tabsDisplayMode: z.enum(['icon_and_text', 'icon_only', 'text_only']).default('icon_and_text'),
    tabs: z.array(BottomBarTabSchema).default([]),
});

// Schema para a configuração da sidebar dentro de um preset
export const SidebarPresetConfigSchema = z.object({
  visibleGroups: z.array(z.string()).optional(),
  visibleItems: z.array(z.string()).optional(),
});

// Schema principal para um Menu Preset
export const MenuPresetSchema = z.object({
  presetName: z.string().min(3, "Nome do modelo deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  leftSidebarConfig: SidebarPresetConfigSchema.optional(),
  bottomBarConfig: BottomBarConfigSchema.optional(),
});

export type MenuPreset = z.infer<typeof MenuPresetSchema>;
export type BottomBarItem = z.infer<typeof BottomBarItemSchema>;
export type BottomBarTab = z.infer<typeof BottomBarTabSchema>;
export type BottomBarConfig = z.infer<typeof BottomBarConfigSchema>;
