// src/app/[locale]/(app)/settings/campaigns/schemas.ts
import { z } from "zod";

// Schema for a single phrase
const PhraseSchema = z.object({
  text: z.string(),
  effect_entry: z.string().optional(),
  effect_exit: z.string().optional(),
  // ... other phrase fields
});

// Schema for the settings object
const CampaignSettingsSchema = z.object({
  mainElementType: z.enum(["image", "video", "text"]),
  mainElementSource: z.string().optional(),
  backgroundType: z.enum(["color", "gradient", "image", "video"]),
  backgroundColor: z.string().optional(),
  backgroundGradientFrom: z.string().optional(),
  backgroundGradientTo: z.string().optional(),
  backgroundGradientDirection: z.string().optional(),
  backgroundImageUrl: z.string().url().optional().or(z.literal('')),
  backgroundVideoUrl: z.string().url().optional().or(z.literal('')),
  totalDurationSeconds: z.number().min(1, "A duração deve ser de pelo menos 1 segundo."),
  destinationPageDefault: z.string().optional(),
  // ... add other settings fields
});

// Main schema for the campaign form
export const campaignSchema = z.object({
  campaignName: z.string().min(1, "O nome da campanha é obrigatório."),
  description: z.string().optional(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  status: z.enum(["active", "inactive", "draft", "archived"]),
  birthdayCampaign: z.boolean().default(false),
  settings: CampaignSettingsSchema,
  targetAudience: z.object({
    type: z.enum(["public", "all_logged_in", "specific_groups"]),
    accessLevelIds: z.array(z.string()).optional(),
  }),
}).refine(data => {
    if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: "A data de fim não pode ser anterior à data de início.",
    path: ["endDate"],
});
