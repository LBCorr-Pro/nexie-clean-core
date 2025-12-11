// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import React, { ReactNode } from 'react';
import { Providers } from '@/app/providers';
import { Bebas_Neue, Inter } from 'next/font/google';
// import { locales } from '@/i18n/i18n-config'; // Removido - O middleware agora controla isso
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
  params: { locale: string }; // Simplificado
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  // A validação de locale agora é feita no middleware.
  // if (!locales.includes(locale)) notFound(); // Removido

  let messages;
  try {
    messages = await getMessages();
  } catch (error) {
    // Se as traduções não puderem ser carregadas (ex: locale inválido),
    // o que não deve acontecer graças ao middleware, redirecionamos para notFound.
    notFound();
  }

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
