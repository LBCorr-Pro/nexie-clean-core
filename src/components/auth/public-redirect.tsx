// src/components/auth/public-redirect.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { SplashScreen } from '../splash-screen'; // Assuming SplashScreen exists

interface PublicRedirectProps {
  children: ReactNode;
}

export function PublicRedirect({ children }: PublicRedirectProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    // If the page is loading or there's no user, do nothing.
    if (loading || !user) {
      return;
    }
    
    // Check if the current path is the database page.
    const isDatabasePage = pathname.includes('/database');

    // If the user is logged in AND is NOT on the database page, redirect them.
    if (user && !isDatabasePage) {
      router.replace(`/${locale}/dashboard`);
    }

  }, [user, loading, router, locale, pathname]);
  
  const isDatabasePage = pathname.includes('/database');

  // If auth is loading, or if the user is logged in (and about to be redirected),
  // show a loading screen to prevent a flash of the public page content.
  // We make an exception for the database page, which should render its content for the logged-in dev user.
  if ((loading || user) && !isDatabasePage) {
    return <SplashScreen onComplete={() => {}} />;
  }

  // If the user is not authenticated, or if it's the database page, render the public page.
  return <>{children}</>;
}
