// src/lib/seed-data/default-menu-groups.ts
import type { Timestamp } from "firebase/firestore";

// Interface para tipagem, se desejar usar em outros lugares
export interface MenuGroupSeed {
  docId: string;
  name: string;
  icon: string;
  useSameColor: boolean;
  unifiedColor?: string;
  iconColor?: string;
  textColor?: string;
  order: number;
  customized: boolean;
  createdAt?: Timestamp; // Mantido opcional para Omit funcionar
  updatedAt?: Timestamp; // Mantido opcional para Omit funcionar
}

export const defaultMenuGroupsData: Omit<MenuGroupSeed, 'createdAt' | 'updatedAt'>[] = [
  {
    "docId": "group-management",
    "name": "Gerenciamento",
    "icon": "AppWindow",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 10,
    "customized": false
  },
  {
    "docId": "group-modules",
    "name": "Módulos",
    "icon": "Puzzle",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 15,
    "customized": false
  },
  {
    "docId": "group-settings",
    "name": "Configurações",
    "icon": "Settings",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 20,
    "customized": false
  },
  {
    "docId": "group-access",
    "name": "Acesso e Segurança",
    "icon": "ShieldCheck",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 30,
    "customized": false
  },
  {
    "docId": "group-registration-definitions",
    "name": "Definições de Cadastros",
    "icon": "ClipboardEdit",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 40,
    "customized": false
  },
  {
    "docId": "group-system",
    "name": "Sistema",
    "icon": "Server",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 50,
    "customized": false
  },
  {
    "docId": "group-support",
    "name": "Suporte",
    "icon": "LifeBuoy",
    "useSameColor": true,
    "unifiedColor": "",
    "iconColor": "",
    "textColor": "",
    "order": 60,
    "customized": false
  }
];
