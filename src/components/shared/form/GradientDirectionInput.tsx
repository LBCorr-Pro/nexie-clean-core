// src/components/shared/form/GradientDirectionInput.tsx
"use client";

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GradientDirectionInputProps {
  name: string;
  label: string;
  disabled?: boolean;
}

const presetDirections = [
  { value: 'to top', label: 'Para Cima' },
  { value: 'to top right', label: 'Para Cima (Diagonal Direita)' },
  { value: 'to right', label: 'Para Direita' },
  { value: 'to bottom right', label: 'Para Baixo (Diagonal Direita)' },
  { value: 'to bottom', label: 'Para Baixo' },
  { value: 'to bottom left', label: 'Para Baixo (Diagonal Esquerda)' },
  { value: 'to left', label: 'Para Esquerda' },
  { value: 'to top left', label: 'Para Cima (Diagonal Esquerda)' },
  { value: 'circle at center', label: 'Radial (do Centro)'},
];
const CUSTOM_VALUE_KEY = "_CUSTOM_";

export const GradientDirectionInput: React.FC<GradientDirectionInputProps> = ({ name, label, disabled }) => {
  const { control, setValue } = useFormContext();
  const watchedValue = useWatch({ control, name });

  // Determina se o valor atual é um preset.
  const isPresetValue = presetDirections.some(p => p.value === watchedValue);

  // Mantém o estado se o modo "Personalizado" foi selecionado,
  // pois um valor personalizado pode ser uma string vazia.
  const [isCustomMode, setIsCustomMode] = React.useState(!isPresetValue);

  const handleSelectChange = (value: string) => {
    if (value === CUSTOM_VALUE_KEY) {
      setIsCustomMode(true);
      // Se estava usando um preset, define um valor customizado padrão.
      if (isPresetValue) {
        setValue(name, '45deg', { shouldDirty: true, shouldValidate: true });
      }
    } else {
      setIsCustomMode(false);
      setValue(name, value, { shouldDirty: true, shouldValidate: true });
    }
  };
  
  // O valor para o Select: ou um preset, ou a chave para customizado.
  const selectValue = isCustomMode ? CUSTOM_VALUE_KEY : watchedValue;

  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
                <Select
                  onValueChange={handleSelectChange}
                  value={selectValue || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma direção..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {presetDirections.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_VALUE_KEY}>
                      Personalizado (Ex: 45deg)
                    </SelectItem>
                  </SelectContent>
                </Select>
                 {isCustomMode && (
                    <div className="pt-2">
                        <FormControl>
                            <Input
                                placeholder="Ex: 45deg, to right"
                                {...field} // Conecta o input ao formulário
                                value={field.value ?? ''}
                                disabled={disabled}
                                className="font-mono"
                            />
                        </FormControl>
                    </div>
                )}
              <FormMessage className="pt-1" />
            </FormItem>
        )}
      />
    </div>
  );
};
