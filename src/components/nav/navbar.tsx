"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { PublicLogo } from '@/components/layout/public-logo';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={cn("text-sm font-medium transition-colors hover:text-primary", isActive ? "text-primary" : "text-muted-foreground")}>
      {children}
    </Link>
  );
};

export function Navbar() {
  const t = useTranslations('navbar');
  const params = useParams();
  const { user, loading } = useAuth();
  const locale = params.locale as string;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href={`/${locale}`} className="mr-6 flex items-center space-x-2">
            <PublicLogo width={80} height={20} />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink href={`/${locale}`}>{t('home')}</NavLink>
            <NavLink href={`/${locale}/plans`}>{t('plans')}</NavLink>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <Button asChild size="sm">
              <Link href={`/${locale}/dashboard`}>{t('dashboard')}</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                    <Link href={`/${locale}/login`}>{t('login')}</Link>
                </Button>
                 <Button asChild size="sm">
                    <Link href={`/${locale}/register`}>{t('register')}</Link>
                </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
