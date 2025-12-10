// src/lib/config.ts
import type { LucideIcon } from 'lucide-react';

/**
 * Interface para um item de navegação.
 * Mantida para tipagem em outras partes do sistema.
 */
export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon | string; // Permitindo string para ícones de URL/Data URI
  label?: string;
  disabled?: boolean;
  subItems?: NavItem[];
  order?: number;
  originalName?: string;
  isModule?: boolean;
  menuKey?: string;
  masterOnly?: boolean;
  canBeInitialPage?: boolean;
  canBeBottomBarItem?: boolean;
  isRichTextEditor?: boolean;
}

/**
 * Interface para um grupo de itens de navegação.
 * Mantida para tipagem em outras partes do sistema.
 */
export interface NavItemGroup {
  groupTitle: string;
  groupIcon?: LucideIcon | string;
  items: NavItem[];
}

// O array estático navItemGroups foi esvaziado para garantir que o menu
// seja sempre construído dinamicamente a partir dos dados do Firestore.
// Esta é a única fonte da verdade.
export const navItemGroups: NavItemGroup[] = [];
