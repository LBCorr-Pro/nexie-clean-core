// src/components/layout/DebugMenuTrigger.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { useDebugMenu } from '@/contexts/DebugMenuContext';

// O componente não precisa mais da prop `color`. Ele herdará a cor do pai.
export const DebugMenuTrigger = () => {
  const { toggleLogVisibility } = useDebugMenu();

  return (
    <Button variant="ghost" size="icon" onClick={toggleLogVisibility} aria-label="Toggle Log Window">
      <Bug className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
};
