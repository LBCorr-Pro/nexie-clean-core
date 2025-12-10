// src/components/auth/RootOrchestrator.tsx
"use client";

import React, { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useNxLoginPageLoader } from '@/hooks/use-nx-login-page-loader';
import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions'; // Import the updated hook

function FullPageLoader() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}

interface RootOrchestratorProps {
    children: ReactNode;
}

export function RootOrchestrator({ children }: RootOrchestratorProps) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();

    // The new hook provides user, auth loading state, and the crucial access state.
    const { currentUser, accessState, denialInfo, isLoadingPermissions } = useUserPermissions();
    const { isContextLoading } = useInstanceActingContext();
    const { isLoading: isSettingsLoading } = useNxLoginPageLoader();

    const user = currentUser;

    const isBlockedPage = pathname.includes('/blocked');
    const isPublicRoute = ['/login', '/register', '/forgot-password', '/plans'].some(path => pathname.includes(path));
    const isPublicHome = pathname === `/${locale}`;

    // The primary loading state now includes the permission and access state check.
    const isLoading = isLoadingPermissions || isContextLoading || (isPublicRoute && isSettingsLoading);

    useEffect(() => {
        if (isLoading) {
            return; // Wait until all data is loaded.
        }

        // --- 1. NEW: Handle Access Denied --- 
        // If access is denied, redirect to the blocked page immediately.
        // This rule has the highest priority for any logged-in user.
        if (accessState === 'denied' && !isBlockedPage) {
            const params = new URLSearchParams();
            if (denialInfo?.reason) params.set('reason', denialInfo.reason);
            if (denialInfo?.instanceName) params.set('instanceName', denialInfo.instanceName);
            if (denialInfo?.contactEmail) params.set('contact', denialInfo.contactEmail);
            
            router.replace(`/${locale}/blocked?${params.toString()}`);
            return; // Stop further processing
        }

        // --- 2. Prevent redirect loop if access is restored while on blocked page ---
        if (accessState !== 'denied' && isBlockedPage) {
            router.replace(`/${locale}/dashboard`);
            return;
        }

        // --- 3. Existing Logic for routing users ---
        
        // Logged-in user on a public-only route (like /login) -> redirect to dashboard.
        if (user && (isPublicRoute || isPublicHome)) {
            router.replace(`/${locale}/dashboard`);
            return;
        }
        
        // Logged-out user on a private route -> redirect to login.
        if (!user && !isPublicRoute && !isPublicHome) {
            const callbackUrl = pathname.startsWith('/') ? pathname : `/${pathname}`;
            router.replace(`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            return;
        }

    }, [isLoading, user, accessState, denialInfo, isPublicRoute, isPublicHome, isBlockedPage, router, locale, pathname]);


    // --- RENDER LOGIC ---

    if (isLoading) {
        return <FullPageLoader />;
    }

    // Show a loader during the redirection process to prevent content flashing.
    const needsRedirect = 
        (accessState === 'denied' && !isBlockedPage) ||
        (accessState !== 'denied' && isBlockedPage) ||
        (user && (isPublicRoute || isPublicHome)) || 
        (!user && !isPublicRoute && !isPublicHome);

    if (needsRedirect) {
        return <FullPageLoader />;
    }

    // If no loading and no redirect needed, the route is valid for the current state.
    return <>{children}</>;
}
