// src/components/splash-screen.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { useSplashScreenCampaigns } from '@/hooks/use-splash-screen-campaigns';

// --- Type Definitions ---
export interface PhraseConfig {
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

export interface CampaignSettings {
  main_element_type?: 'image' | 'text';
  main_element_source?: string;
  main_element_effect_entry?: string;
  main_element_effect_exit?: string;
  main_element_effect_repeat?: "once" | "twice" | "thrice" | "infinite";
  main_element_delay_seconds?: number;
  main_element_duration_seconds?: number;
  main_element_effect_exit_delay_seconds?: number;
  main_element_effect_exit_duration_seconds?: number;
  main_element_position?: "top-left" | "top-center" | "top-right" | "center-left" | "center-center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
  main_element_padding?: string;
  phrases?: PhraseConfig[];
  background_type?: 'color' | 'gradient' | 'image' | 'video';
  background_source_color?: string;
  background_source_gradient_from?: string;
  background_source_gradient_to?: string;
  background_source_gradient_direction?: string;
  background_source_url?: string;
  total_duration_seconds?: number;
  show_skip_button?: boolean;
  skip_delay_seconds?: number;
  destination_page_default?: string;
  custom_css?: string;
}

export interface Campaign {
  id: string;
  campaignName: string;
  campaignType: 'app_opening' | 'banner';
  status: 'active' | 'inactive' | 'draft';
  startDate?: Timestamp;
  endDate?: Timestamp;
  displayFrequency: 'once_ever' | 'once_per_day' | 'once_per_session' | 'every_time';
  targetAudience: {
    type: 'public' | 'all_logged_in' | 'specific_groups';
    accessLevelIds?: string[];
  };
  settings: CampaignSettings;
}

interface SplashScreenProps {
  onComplete: () => void;
}

const getEffectRepeatClass = (repeatType?: "once" | "twice" | "thrice" | "infinite"): string => {
  if (repeatType === "infinite") return "animate__infinite";
  if (repeatType === "twice") return "animate__repeat-2";
  if (repeatType === "thrice") return "animate__repeat-3";
  return "";
};

const CampaignAnimationPlayer = ({ campaign, onComplete }: { campaign: Campaign, onComplete: () => void }) => {
  const settings = campaign.settings;
  const [showSkip, setShowSkip] = useState(false);
  const [activePhrase, setActivePhrase] = useState<PhraseConfig | null>(null);
  const [showMainElement, setShowMainElement] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const totalDurationMs = (settings.total_duration_seconds || 8) * 1000;
    timersRef.current.push(setTimeout(onComplete, totalDurationMs));

    let cumulativeDelay = 0;
    const sortedPhrases = settings.phrases?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [];

    sortedPhrases.forEach((phrase) => {
      const entryDelay = cumulativeDelay + (phrase.delay_seconds_after_previous || 0.5) * 1000;
      timersRef.current.push(setTimeout(() => setActivePhrase(phrase), entryDelay));

      const exitDelay = entryDelay + (phrase.duration_seconds_entry || 1) * 1000;
      timersRef.current.push(setTimeout(() => setActivePhrase(null), exitDelay));

      cumulativeDelay = exitDelay + (phrase.duration_seconds_exit || 0.5) * 1000;
    });

    const mainElementEntryDelay = cumulativeDelay + (settings.main_element_delay_seconds || 0.5) * 1000;
    timersRef.current.push(setTimeout(() => setShowMainElement(true), mainElementEntryDelay));

    if (settings.main_element_effect_exit) {
      const mainElementExitDelay = mainElementEntryDelay + (settings.main_element_duration_seconds || 3) * 1000 + (settings.main_element_effect_exit_delay_seconds || 0) * 1000;
      timersRef.current.push(setTimeout(() => {
        const mainEl = document.getElementById('splash-main-element');
        if (mainEl && settings.main_element_effect_exit) {
          mainEl.classList.add(`animate__${settings.main_element_effect_exit}`);
        }
      }, mainElementExitDelay));
    }

    if (settings.show_skip_button) {
      const skipDelayMs = (settings.skip_delay_seconds || 1) * 1000;
      timersRef.current.push(setTimeout(() => setShowSkip(true), skipDelayMs));
    }
    
    // CORREÇÃO: Salva uma cópia da referência atual para usar na função de limpeza.
    // Isso evita o problema de 'stale closure'.
    const currentTimers = timersRef.current;
    return () => {
        currentTimers.forEach(clearTimeout);
    };
  }, [campaign, settings, onComplete]);

  const positionClassesMap: Record<string, string> = { 'top-left': 'items-start justify-start', 'top-center': 'items-start justify-center', 'top-right': 'items-start justify-end', 'center-left': 'items-center justify-start', 'center-center': 'items-center justify-center', 'center-right': 'items-center justify-end', 'bottom-left': 'items-end justify-start', 'bottom-center': 'items-end justify-center', 'bottom-right': 'items-end justify-end' };
  const mainElementPositionClass = positionClassesMap[settings.main_element_position || "center-center"];
  const mainElementStyle: React.CSSProperties = { padding: settings.main_element_padding || '2rem' };
  const backgroundStyle: React.CSSProperties = {};
  if (settings.background_type === 'color' && settings.background_source_color) backgroundStyle.backgroundColor = settings.background_source_color;
  else if (settings.background_type === 'gradient' && settings.background_source_gradient_from && settings.background_source_gradient_to) backgroundStyle.backgroundImage = `linear-gradient(${settings.background_source_gradient_direction || 'to bottom'}, ${settings.background_source_gradient_from}, ${settings.background_source_gradient_to})`;
  else if (settings.background_type === 'image' && settings.background_source_url) { backgroundStyle.backgroundImage = `url(${settings.background_source_url})`; backgroundStyle.backgroundSize = 'cover'; backgroundStyle.backgroundPosition = 'center'; }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden" style={backgroundStyle}>
      {settings.custom_css && <style>{settings.custom_css}</style>}
      {settings.background_type === 'video' && settings.background_source_url && <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover -z-10"><source src={settings.background_source_url} type="video/mp4" /></video>}

      <div className={cn("absolute inset-0 flex pointer-events-none", mainElementPositionClass)}>
        {activePhrase && (
          <div style={activePhrase.font_family ? { fontFamily: activePhrase.font_family } : {}} className={cn("animate__animated text-4xl font-bold text-center", activePhrase.effect_entry ? `animate__${activePhrase.effect_entry}` : 'animate__fadeIn', getEffectRepeatClass(activePhrase.effect_repeat))}>
            {activePhrase.text}
          </div>
        )}
        {showMainElement && (
          <div id="splash-main-element" style={mainElementStyle} className={cn('animate__animated', settings.main_element_effect_entry ? `animate__${settings.main_element_effect_entry}` : 'animate__fadeIn', getEffectRepeatClass(settings.main_element_effect_repeat))}>
            {settings.main_element_type === 'image' && settings.main_element_source ? <Image src={settings.main_element_source} alt="Splash Main Image" width={200} height={200} className="max-w-xs max-h-60 object-contain" data-ai-hint="logo company" />
              : settings.main_element_type === 'text' && settings.main_element_source ? <h1 className="text-5xl font-bold text-foreground text-center">{settings.main_element_source}</h1> : null}
          </div>
        )}
      </div>

      {settings.show_skip_button && showSkip && <Button onClick={onComplete} variant="ghost" size="sm" className="absolute bottom-8 right-8 pointer-events-auto z-10 bg-background/30 hover:bg-background/50 backdrop-blur-sm text-foreground/80 hover:text-foreground">Pular</Button>}
    </div>
  );
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { campaigns, isLoading, markCampaignAsViewed } = useSplashScreenCampaigns();
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const handleNextCampaign = useCallback(async () => {
    const viewedCampaign = campaigns[currentCampaignIndex];
    if (viewedCampaign) {
      await markCampaignAsViewed(viewedCampaign);
    }

    if (currentCampaignIndex < campaigns.length - 1) {
      setCurrentCampaignIndex(prev => prev + 1);
    } else {
      onCompleteRef.current();
    }
  }, [currentCampaignIndex, campaigns, markCampaignAsViewed]);

  useEffect(() => {
    if (!isLoading && campaigns.length === 0) {
      onCompleteRef.current();
    }
  }, [isLoading, campaigns, onComplete]);

  const currentCampaign = campaigns[currentCampaignIndex];

  if (isLoading || !currentCampaign) {
    return null; // Mostra nada enquanto carrega ou se não houver campanha ativa.
  }

  return (
    <CampaignAnimationPlayer
      key={currentCampaign.id} // Chave dinâmica para forçar a remontagem do componente
      campaign={currentCampaign}
      onComplete={handleNextCampaign}
    />
  );
}
