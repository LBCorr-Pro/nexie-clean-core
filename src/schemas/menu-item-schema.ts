
import { z } from "zod";

export const MenuItemConfigSchema = z.object({
  menuKey: z.string(),
  displayName: z.string().min(1, "Nome de exibição é obrigatório."),
  groupId: z.string().optional().default(""),
  parentId: z.string().optional().default(""),
  order: z.coerce.number().int().default(0),
  isHidden: z.boolean().default(false),
  isModule: z.boolean(),
  originalHref: z.string().optional().or(z.literal('')),
  originalIcon: z.string().min(1, "Ícone é obrigatório."),
  canBeInitialPage: z.boolean().default(false),
  canBeBottomBarItem: z.boolean().default(false),
  customized: z.boolean().optional(),
  _isSelected: z.boolean().optional(),
  formId: z.string(),
});

export type MenuItemConfig = z.infer<typeof MenuItemConfigSchema>;
