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

const GoogleIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.62-3.82 1.62-3.32 0-6.03-2.75-6.03-6.14s2.71-6.14 6.03-6.14c1.88 0 3.13.77 3.88 1.48l2.54-2.54C18.33 1.8 15.86 1 12.48 1 7.02 1 3 5.02 3 10.5S7.02 20 12.48 20c2.9 0 4.96-.99 6.58-2.62 1.7-1.7 2.36-4.02 2.36-6.38 0-.5-.07-.92-.15-1.34H12.48z"/>
  </svg>
);


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
  
  if (iconNameString.toLowerCase() === 'google') {
    return <GoogleIcon />;
  }
  
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
