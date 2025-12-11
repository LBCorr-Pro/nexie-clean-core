// src/components/auth/auth-guard.tsx
'use client';

import { useAuthContext } from '@/context/AuthContext';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { SplashScreen } from '../splash-screen'; // Assuming SplashScreen exists

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // If not loading and no user is found, redirect to the login page.
    if (!loading && !user) {
      // Preserve the intended destination for redirection after login.
      const callbackUrl = pathname.includes(`/${locale}`) ? pathname.substring(`/${locale}`.length) : pathname;
      router.replace(`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [user, loading, router, pathname, locale]);

  // While loading or if there's no user (and redirection is pending), show a loading screen.
  if (loading || !user) {
    return <SplashScreen onComplete={() => {}} />; // or any other full-page loader
  }

  // If the user is authenticated, render the children components.
  return <>{children}</>;
}
