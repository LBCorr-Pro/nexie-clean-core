// src/components/shared/form/OrderControls.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderControlsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  className?: string;
}

export const OrderControls: React.FC<OrderControlsProps> = ({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled = false,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
        disabled={disabled || isFirst}
        aria-label="Mover para cima"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
        disabled={disabled || isLast}
        aria-label="Mover para baixo"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
