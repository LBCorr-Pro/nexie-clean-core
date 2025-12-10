// src/components/ui/icon.tsx
"use client";

import React, { useMemo } from 'react';
import { LucideProps, icons as lucideIcons, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const FallbackIcon = AlertTriangle;

const kebabToPascalCase = (kebab?: string): string => {
  if (typeof kebab !== 'string' || kebab.trim() === "") return 'AlertTriangle';
  // If it's already PascalCase, return as is.
  if (!kebab.includes('-') && kebab.charAt(0) === kebab.charAt(0).toUpperCase()) {
    return kebab;
  }
  return kebab.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};

const getIconNameFromComponent = (component: any): string => {
    if (typeof component !== 'function') return 'AlertTriangle';
    if (component.displayName) return component.displayName;
    const lucideKey = Object.keys(lucideIcons).find(key => lucideIcons[key as keyof typeof lucideIcons] === component);
    if (lucideKey) return kebabToPascalCase(lucideKey);
    const funcName = component.name;
    return funcName ? kebabToPascalCase(funcName) : 'AlertTriangle';
};


interface IconProps extends Omit<LucideProps, 'name'> {
  name: string | React.ElementType; 
  library?: string; // Kept for API compatibility, but currently unused
}

export const Icon = React.memo(({ name, className, ...props }: IconProps) => {
  
  const iconNameString = useMemo(() => {
    if (typeof name === 'string') return name;
    if (typeof name === 'function') {
        return getIconNameFromComponent(name);
    }
    return 'CircleHelp'; // Fallback for unknown types
  }, [name]);
  
  // Handle external URLs or local assets
  if (iconNameString && (iconNameString.startsWith('http') || iconNameString.startsWith('/'))) {
     return (
      <Image
        src={iconNameString}
        alt={`${iconNameString} icon`}
        className={cn("h-4 w-4 shrink-0", className)}
        style={{ color: 'currentColor' }}
        width={16}
        height={16}
        unoptimized
      />
    );
  }

  const LucideComponent = lucideIcons[kebabToPascalCase(iconNameString) as keyof typeof lucideIcons] || FallbackIcon;
  
  return <LucideComponent className={cn("h-4 w-4 shrink-0", className)} strokeWidth={1.75} {...props} />;
});

Icon.displayName = 'Icon';
