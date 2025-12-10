"use client";

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Film, Clock } from 'lucide-react';

const transitionOptions = [
    { value: "none", label: "Nenhuma" },
    { value: "fade", label: "Fade (Esmaecer)" },
    { value: "slide-up", label: "Slide para Cima" },
    { value: "slide-down", label: "Slide para Baixo" },
    { value: "slide-left", label: "Slide para Esquerda" },
    { value: "slide-right", label: "Slide para Direita" },
    { value: "zoom-in", label: "Zoom In (Aproximar)" },
    { value: "zoom-out", label: "Zoom Out (Afastar)" },
];

export const PageTransitionSelector = () => {
  const { control } = useFormContext();
  const watchedEnableTransitions = useWatch({ control, name: "enablePageTransitions" });
  const watchedDuration = useWatch({ control, name: "pageTransitionDurationMs" });

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center"><Film className="mr-2 h-5 w-5"/>Transições de Página</h3>
        <div className="space-y-4 rounded-lg border p-4">
            <FormField 
                control={control} 
                name="enablePageTransitions" 
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                            <FormLabel>Ativar Transições Entre Páginas?</FormLabel>
                            <FormDescription>Aplica uma animação suave ao navegar entre páginas.</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            {watchedEnableTransitions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <FormField 
                        control={control} 
                        name="pageTransitionType" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Animação</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {transitionOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField 
                        control={control} 
                        name="pageTransitionDurationMs" 
                        render={({ field: { value, onChange } }) => (
                           <FormItem>
                            <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4"/>Duração da Animação (ms)</FormLabel>
                            <div className="flex items-center gap-4">
                                <FormControl>
                                    <Slider defaultValue={[value ?? 300]} min={100} max={1000} step={50} onValueChange={(val) => onChange(val[0])} className="w-full"/>
                                </FormControl>
                                <span className="text-sm font-mono w-20 text-center border rounded-md py-1">{watchedDuration ?? 300} ms</span>
                            </div>
                           </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    </div>
  );
};
