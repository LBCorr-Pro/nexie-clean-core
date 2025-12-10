// src/app/layout.tsx
import 'animate.css';
import type { Metadata } from 'next';
import '@/app/globals.css';
import React from 'react';

// This is now the single source of truth for the root layout.
// It wraps the entire application, including the [locale] segment.
// The actual <html> and <body> tags are defined in the [locale]/layout.tsx file.

export const metadata: Metadata = {
  title: 'Nexie',
  description: 'Configure everything with Nexie',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/system-assets/favicons/favicon32x32.svg', type: 'image/svg+xml' },
      { url: '/system-assets/favicons/favicon-32x32.ico', sizes: '32x32', type: 'image/x-icon', rel: 'alternate icon' },
      { url: '/system-assets/favicons/favicon-16x16.ico', sizes: '16x16', type: 'image/x-icon', rel: 'alternate icon' },
    ],
    apple: '/system-assets/icons/apple-touch-icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // It just renders children, as the <html> and <body> structure is now
  // handled inside the [locale] layout, which has access to the `lang` param.
  return children;
}
