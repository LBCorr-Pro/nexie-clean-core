
// src/components/shared/form/ThemePresetSelector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { themePresets as staticPresets, type ThemePreset } from '@/lib/data/theme-presets';
import { useToast } from '@/hooks/nx-use-toast';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { onSnapshot, query } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';

interface ThemePresetSelectorProps {
    onPresetSelect: (settings: Partial<AppearanceSettings>) => void;
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({ onPresetSelect }) => {
  const { toast } = useToast();
  const t = useTranslations('appearance.themePresets');
  const [dynamicPresets, setDynamicPresets] = useState<ThemePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(refs.master.appearancePresets());
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPresets = snapshot.docs.map(doc => ({
        name: doc.id,
        settings: doc.data() as Partial<AppearanceSettings>
      }));
      setDynamicPresets(fetchedPresets);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching dynamic presets: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const allPresets = [...staticPresets, ...dynamicPresets].sort((a, b) => a.name.localeCompare(b.name));

  const handlePresetChange = (presetName: string) => {
    const selectedPreset = allPresets.find(p => p.name === presetName);
    if (selectedPreset?.settings) {
      onPresetSelect(selectedPreset.settings);
    }
  };

  return (
    <div>
      <FormLabel>{t('label')}</FormLabel>
      <div className="flex items-center gap-2">
        <Select onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Carregando presets..." : t('placeholder')} />
            </SelectTrigger>
          <SelectContent>
            {allPresets.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: preset.settings?.primaryColor || '#000000' }} />
                  <span>{preset.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
