// src/components/shared/form/IconPickerInput.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormControl, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { SmilePlus } from 'lucide-react';

interface IconPickerInputProps {
  name: string;
  label: string;
  disabled?: boolean;
}

export const IconPickerInput: React.FC<IconPickerInputProps> = ({ name, label, disabled }) => {
  const { control, watch } = useFormContext();
  const watchedIcon = watch(name);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center">
            <SmilePlus className="mr-2 h-4 w-4 text-primary/80" />
            {label}
          </FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                placeholder="Ex: Home, Users, Settings"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <div className="p-2 border rounded-md bg-muted">
              <Icon name={(watchedIcon || 'Blocks') as any} className="h-5 w-5 shrink-0" />
            </div>
          </div>
          <FormDescription>
            Nome de um ícone da biblioteca{' '}
            <a
              href="https://lucide.dev/icons/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-primary hover:text-primary/80"
            >
              Lucide Icons
            </a>.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
