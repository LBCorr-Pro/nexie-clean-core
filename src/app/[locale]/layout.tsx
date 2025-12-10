// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import React, { ReactNode } from 'react';
import { Providers } from '@/app/providers'; // Importa o novo provedor central
import { Bebas_Neue, Inter } from 'next/font/google';
import { locales } from '@/i18n/i18n-config';
import { DebugMenu } from '@/components/layout/DebugMenu';

import '@/app/globals.css';
import '@/styles/theme.css';
import '@/styles/sidebar.css';
import '@/styles/top-bar.css';
import '@/styles/bottom-bar.css';
import '@/styles/acting-bar.css';

const bebas_neue = Bebas_Neue({ subsets: ['latin'], weight: ['400'], variable: '--font-bebas-neue' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' });

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();
  const fontVariables = [bebas_neue.variable, inter.variable].join(' ');

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <DebugMenu /> 
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
