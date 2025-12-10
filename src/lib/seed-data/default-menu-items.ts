// src/lib/seed-data/default-menu-items.ts
import { Timestamp } from "firebase/firestore";

// Interface para tipagem
export interface MenuItemSeed {
  menuKey: string;
  displayName: string;
  originalName: string;
  originalHref: string;
  originalIcon: string;
  groupId: string;
  parentId: string;
  order: number;
  isHidden: boolean;
  isModule: boolean;
  useSameColor: boolean;
  unifiedColor?: string;
  iconColor?: string;
  textColor?: string;
  customized: boolean;
  masterOnly: boolean;
  canBeInitialPage: boolean;
  canBeBottomBarItem?: boolean;
}

export const defaultMenuItemsData: Omit<MenuItemSeed, 'createdAt' | 'updatedAt'>[] = [
  // --- Dashboard (Sem Grupo) ---
  {
    "menuKey": "static-home-dashboard", "displayName": "Dashboard", "originalName": "Dashboard", "originalHref": "/dashboard", "originalIcon": "Home", "groupId": "", "parentId": "", "order": 0, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": true, "canBeBottomBarItem": true
  },
  // --- Gerenciamento ---
  {
    "menuKey": "static-access-instances", "displayName": "Gerenciar Instâncias (Clientes)", "originalName": "Gerenciar Instâncias (Clientes)", "originalHref": "/access/instances", "originalIcon": "Building", "groupId": "group-management", "parentId": "", "order": 10, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-users-manage-global", "displayName": "Gerenciar Usuários Globais", "originalName": "Gerenciar Usuários Globais", "originalHref": "/users", "originalIcon": "Users", "groupId": "group-management", "parentId": "", "order": 20, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-access-companies", "displayName": "Gerenciar Empresas Globais", "originalName": "Gerenciar Empresas Globais", "originalHref": "/companies", "originalIcon": "Briefcase", "groupId": "group-management", "parentId": "", "order": 30, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  // --- Configurações ---
  {
    "menuKey": "static-settings-appearance", "displayName": "Aparência Visual", "originalName": "Aparência", "originalHref": "/settings/appearance", "originalIcon": "Paintbrush", "groupId": "group-settings", "parentId": "", "order": 10, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-settings-general", "displayName": "Configurações Gerais", "originalName": "Configurações Gerais", "originalHref": "/settings/general", "originalIcon": "SlidersHorizontal", "groupId": "group-settings", "parentId": "", "order": 20, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-menus-overview", "displayName": "Menus e Navegação", "originalName": "Menus e Navegação", "originalHref": "/settings/menus", "originalIcon": "LayoutGrid", "groupId": "group-settings", "parentId": "", "order": 30, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": true, "canBeBottomBarItem": true
  },
  {
    "menuKey": "static-settings-splash-screen", "displayName": "Campanhas (Splash Screen)", "originalName": "Campanhas (Splash Screen)", "originalHref": "/settings/campaigns", "originalIcon": "Presentation", "groupId": "group-settings", "parentId": "", "order": 40, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-settings-default-editor", "displayName": "Editor de Texto Padrão", "originalName": "Editor de Texto Padrão", "originalHref": "/settings/default-editor", "originalIcon": "AudioLines", "groupId": "group-settings", "parentId": "", "order": 50, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-settings-plans", "displayName": "Planos e Assinaturas", "originalName": "Planos e Assinaturas", "originalHref": "/settings/plans", "originalIcon": "CreditCard", "groupId": "group-settings", "parentId": "", "order": 60, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  // --- Acesso e Segurança ---
  {
    "menuKey": "static-access-methods", "displayName": "Formas de Acesso", "originalName": "Formas de Acesso", "originalHref": "/access/methods", "originalIcon": "KeyRound", "groupId": "group-access", "parentId": "", "order": 10, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-access-levels-global-templates", "displayName": "Níveis de Acesso (Templates)", "originalName": "Níveis de Acesso (Templates Globais)", "originalHref": "/access/levels", "originalIcon": "Layers", "groupId": "group-access", "parentId": "", "order": 20, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-access-login-page-settings", "displayName": "Página de Login", "originalName": "Página de Login", "originalHref": "/access/login-page-settings", "originalIcon": "LogIn", "groupId": "group-access", "parentId": "", "order": 30, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-access-landing-page", "displayName": "Página de Abertura (Landing)", "originalName": "Página de Abertura", "originalHref": "/access/landing", "originalIcon": "DoorOpen", "groupId": "group-access", "parentId": "", "order": 40, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": true, "canBeBottomBarItem": true
  },
  // --- Definições de Cadastros ---
  {
    "menuKey": "static-access-user-registration-fields", "displayName": "Campos de Cadastro (Usuário)", "originalName": "Campos de Cadastro (Usuário)", "originalHref": "/access/registration-fields-settings", "originalIcon": "ClipboardEdit", "groupId": "group-registration-definitions", "parentId": "", "order": 10, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-access-company-registration-fields", "displayName": "Campos de Cadastro (Empresa)", "originalName": "Campos de Cadastro (Empresa)", "originalHref": "/access/company-registration-fields-settings", "originalIcon": "ClipboardCheck", "groupId": "group-registration-definitions", "parentId": "", "order": 20, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  // --- Sistema ---
  {
    "menuKey": "static-system-manage-modules", "displayName": "Gerenciar Módulos", "originalName": "Gerenciar Módulos", "originalHref": "/settings/modules/manage", "originalIcon": "Package", "groupId": "group-system", "parentId": "", "order": 10, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-system-stats", "displayName": "Estatísticas Gerais", "originalName": "Estatísticas", "originalHref": "/stats/general", "originalIcon": "BarChart3", "groupId": "group-system", "parentId": "", "order": 20, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": true, "canBeBottomBarItem": true
  },
  {
    "menuKey": "static-system-performance", "displayName": "Otimizações de Performance", "originalName": "Otimizações de Performance", "originalHref": "/performance", "originalIcon": "Zap", "groupId": "group-system", "parentId": "", "order": 30, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-system-sync-states", "displayName": "Sincronização de Estados", "originalName": "Sincronização de Estados", "originalHref": "/sync/states", "originalIcon": "RefreshCw", "groupId": "group-system", "parentId": "", "order": 40, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  {
    "menuKey": "static-system-dev-tools", "displayName": "Ferramentas Dev (Master)", "originalName": "Ferramentas Dev (Master)", "originalHref": "/admin/dev-tools", "originalIcon": "DatabaseZap", "groupId": "group-system", "parentId": "", "order": 50, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  },
  // --- Suporte ---
  {
    "menuKey": "static-manual-main", "displayName": "Manual do Usuário", "originalName": "Manual do Usuário", "originalHref": "/manual", "originalIcon": "BookOpen", "groupId": "group-support", "parentId": "", "order": 10, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": false, "canBeInitialPage": true, "canBeBottomBarItem": true
  },
  {
    "menuKey": "static-settings-manual", "displayName": "Gerenciar Manual", "originalName": "Gerenciar Manual", "originalHref": "/settings/manual", "originalIcon": "BookHeart", "groupId": "group-support", "parentId": "", "order": 20, "isHidden": false, "isModule": false, "useSameColor": true, "unifiedColor": "", "iconColor": "", "textColor": "", "customized": false, "masterOnly": true, "canBeInitialPage": false, "canBeBottomBarItem": false
  }
];
