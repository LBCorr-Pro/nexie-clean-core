
// src/components/shared/form/ColorPresetSelector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/nx-use-toast';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { onSnapshot, query } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { FormLabel } from '@/components/ui/form';
import { useTranslations } from 'next-intl';

interface ColorPresetSelectorProps {
    onPresetSelect: (settings: Partial<AppearanceSettings>) => void;
}

export const ColorPresetSelector: React.FC<ColorPresetSelectorProps> = ({ onPresetSelect }) => {
  const { toast } = useToast();
  const t = useTranslations('appearance.colorPresets');
  const [dynamicPresets, setDynamicPresets] = useState<{name: string, settings: Partial<AppearanceSettings>}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(refs.master.colorPresets());
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPresets = snapshot.docs.map(doc => ({
        name: doc.id,
        settings: doc.data() as Partial<AppearanceSettings>
      }));
      setDynamicPresets(fetchedPresets);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching dynamic color presets: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePresetChange = (presetName: string) => {
    const selectedPreset = dynamicPresets.find(p => p.name === presetName);
    if (selectedPreset?.settings) {
      onPresetSelect(selectedPreset.settings);
    }
  };

  return (
    <div>
      <FormLabel>{t('label')}</FormLabel>
      <Select onValueChange={handlePresetChange} disabled={isLoading || dynamicPresets.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Carregando..." : (dynamicPresets.length === 0 ? t('placeholderEmpty') : t('placeholder'))} />
        </SelectTrigger>
        <SelectContent>
          {dynamicPresets.map((preset) => (
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
  );
};
