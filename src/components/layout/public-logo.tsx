// src/components/layout/public-logo.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import logoUrl from '@/../public/system-assets/logos/logo-texto-512x512.svg';

interface PublicLogoProps {
  width?: number;
  height?: number;
}

export function PublicLogo({ width = 200, height = 50 }: PublicLogoProps) {
  return (
    <div className="flex items-center justify-center">
      <Image 
        src={logoUrl}
        alt="Nexie Logo" 
        width={width} 
        height={height} 
        className="h-auto object-contain"
        priority
      />
    </div>
  );
}