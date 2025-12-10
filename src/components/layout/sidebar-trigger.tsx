// src/components/layout/sidebar-trigger.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/sidebar-context';
import { Icon } from '@/components/ui/icon';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SidebarTriggerProps {
  iconName?: string;
  isImage?: boolean;
  imageUrl?: string;
}

export const SidebarTrigger = ({ iconName = 'Menu', isImage = false, imageUrl }: SidebarTriggerProps) => {
  const { toggle } = useSidebar();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggle} 
      className={cn("sidebar-trigger-button")}
      aria-label="Abrir/Fechar menu"
    >
      {isImage && imageUrl ? (
        <div className="h-6 w-6 relative">
            <Image src={imageUrl} alt="Menu trigger logo" layout="fill" className="object-contain" />
        </div>
      ) : (
        <Icon name={iconName} className="h-6 w-6" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};
