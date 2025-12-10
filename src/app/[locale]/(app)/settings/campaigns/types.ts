// src/app/[locale]/(app)/settings/campaigns/types.ts
import type { Timestamp } from "firebase/firestore";

// NOTE: This file is the source of truth for the Campaign data structure, reflecting the Firestore database.
// Do not change existing field names, as other parts of the system depend on them.
// The form component is responsible for mapping this structure to its own state.

interface PhraseConfig {
  id?: string;
  text: string;
  effect_entry?: string;
  effect_exit?: string;
  effect_repeat?: "once" | "twice" | "thrice" | "infinite";
  delay_seconds_after_previous?: number;
  duration_seconds_entry?: number;
  duration_seconds_exit?: number;
  font_family?: string;
  text_color?: string;
  use_gradient?: boolean;
  gradient_from?: string;
  gradient_to?: string;
  use_shadow?: boolean;
  order?: number;
}

interface CampaignSettings {
  mainElementType?: 'image' | 'video' | 'text'; // Corrected
  mainElementSource?: string; // Corrected
  mainElementEffectEntry?: string; // Corrected
  mainElementEffectExit?: string; // Corrected
  mainElementEffectRepeat?: "once" | "twice" | "thrice" | "infinite"; // Corrected
  mainElementDelaySeconds?: number; // Corrected
  mainElementDurationSeconds?: number;
  mainElementEffectExitDelaySeconds?: number; // Corrected
  mainElementEffectExitDurationSeconds?: number;
  mainElementPosition?: "top-left" | "top-center" | "top-right" | "center-left" | "center-center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"; // Corrected
  mainElementPadding?: string; // Corrected
  phrases?: PhraseConfig[];
  backgroundType?: 'color' | 'gradient' | 'image' | 'video'; // Corrected
  backgroundColor?: string; // Changed from background_source_color
  backgroundGradientFrom?: string; // New
  backgroundGradientTo?: string; // New
  backgroundGradientDirection?: string; // New
  backgroundImageUrl?: string; // Changed from background_source_url
  backgroundVideoUrl?: string; // New, for clarity
  totalDurationSeconds?: number; // Corrected
  showSkipButton?: boolean; // Corrected
  skipDelaySeconds?: number; // Corrected
  destinationPageDefault?: string; // Corrected
  customCss?: string; // Corrected
}

export interface Campaign {
  id: string;
  // Core fields
  campaignName: string;
  campaignType: 'app_opening' | 'banner';
  status: 'active' | 'inactive' | 'draft' | 'archived'; 
  startDate?: Timestamp | Date | null;
  endDate?: Timestamp | Date | null;
  displayFrequency: 'once_ever' | 'once_per_day' | 'once_per_session' | 'every_time';
  targetAudience: {
    type: 'public' | 'all_logged_in' | 'specific_groups';
    accessLevelIds?: string[];
  };
  settings: CampaignSettings; // Settings are now nested
  createdAt?: Timestamp;
  
  // Optional fields
  description?: string;
  birthdayCampaign?: boolean; // Corrected
  last_updated?: Timestamp;
}

export interface AccessLevelTemplate {
  docId: string;
  templateName: string;
}

export interface CampaignView {
    id: string;
    userId: string;
    userName: string; 
    viewedAt: Date;
}
