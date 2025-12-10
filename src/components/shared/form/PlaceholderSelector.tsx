// src/components/shared/form/PlaceholderSelector.tsx
"use client";

import React from 'react';
import { Placeholder, availablePlaceholders } from '@/lib/data/placeholders';
import { useToast } from '@/hooks/nx-use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardCopy } from 'lucide-react';

interface PlaceholderSelectorProps {
  /** Um título opcional a ser exibido acima dos placeholders. */
  title?: string;
  /** Uma lista específica de placeholders a serem exibidos. Se não for fornecida, usará a lista padrão. */
  placeholders?: Placeholder[];
}

/**
 * Um componente de UI que exibe uma lista de placeholders clicáveis.
 * Ao clicar em um placeholder, seu valor é copiado para a área de transferência.
 */
export function PlaceholderSelector({ 
  title = "Placeholders disponíveis", 
  placeholders = availablePlaceholders 
}: PlaceholderSelectorProps) {
  const { toast } = useToast();

  const handleCopy = (placeholder: Placeholder) => {
    navigator.clipboard.writeText(placeholder.value);
    toast({
      title: "Copiado!",
      description: `O placeholder ${placeholder.value} foi copiado para a área de transferência.`,
    });
  };

  return (
    <div className="rounded-md border border-dashed p-4">
      <h3 className="text-sm font-semibold mb-2 flex items-center">
        <ClipboardCopy className="h-4 w-4 mr-2" />
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Clique em uma variável abaixo para copiar e colar no campo de texto.
      </p>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider delayDuration={100}>
          {placeholders.map((placeholder) => (
            <Tooltip key={placeholder.value}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleCopy(placeholder)}
                >
                  {placeholder.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{placeholder.description}</p>
                <p className="text-xs text-muted-foreground">Clique para copiar: <code>{placeholder.value}</code></p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
