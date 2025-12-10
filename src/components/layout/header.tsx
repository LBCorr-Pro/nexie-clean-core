// src/components/layout/header.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button"; 
import { SidebarTrigger } from "@/components/layout/sidebar-trigger";
import { UserNav } from "@/components/user-nav";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { Icon } from "../ui/icon";
import { DebugMenuTrigger } from './DebugMenuTrigger'; // Correctly import the trigger
import { ActingBar } from './ActingBar';
import { refs } from '@/lib/firestore-refs';
import { useDebugMenu } from '@/contexts/DebugMenuContext';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import { usePathname, useParams } from "next/navigation";
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { defaultAppearance } from '@/lib/default-appearance';
import { LanguageSwitcher } from '../language-switcher';

function InstanceActingBanner() {
  const { actingAsInstanceId, actingAsInstanceName, setActingAs, isActingAsMaster } = useInstanceActingContext();
  const [instanceIsActive, setInstanceIsActive] = React.useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (actingAsInstanceId && !isActingAsMaster) {
      setIsLoadingStatus(true);
      const instanceDocRef = refs.instanceDoc(actingAsInstanceId);
      const unsubscribe = onSnapshot(instanceDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setInstanceIsActive(docSnap.data()?.status === true);
        } else {
          setInstanceIsActive(null);
        }
        setIsLoadingStatus(false);
      }, (error) => {
        console.error("Error fetching instance status for banner:", error);
        setInstanceIsActive(null);
        setIsLoadingStatus(false);
      });
      return () => unsubscribe();
    } else {
      setInstanceIsActive(null);
      setIsLoadingStatus(false);
    }
  }, [actingAsInstanceId, isActingAsMaster]);

  if (!isActingAsMaster || !actingAsInstanceName || !actingAsInstanceId) {
    return null;
  }

  const isInactive = instanceIsActive === false;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-sm shadow-md print:hidden",
       "md:ml-[var(--sidebar-width-collapsed)] group-data-[sidebar-collapsed=false]:md:ml-[var(--sidebar-width)]",
      isInactive ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
    )}>
      {isInactive && <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />}
      <span className="font-semibold mr-1.5">Atuando como:</span>
      <Link href={`/access/instances/${actingAsInstanceId}`} className="truncate hover:underline focus:underline">
        {actingAsInstanceName}
      </Link>
      {isLoadingStatus && <Loader2 className="ml-2 h-4 w-4 animate-spin shrink-0" />}
      {!isLoadingStatus && isInactive && <span className="ml-1 font-bold">(INATIVA)</span>}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "ml-auto h-auto py-1 px-2",
          isInactive ? "text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground" : "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
        )}
        onClick={() => setActingAs(null, null)}
      >
        <LogOut className="mr-1.5 h-3.5 w-3.5" />
        Voltar ao Master
      </Button>
    </div>
  );
}

export function Header() {
  const { actingAsInstanceId, isActingAsMaster } = useInstanceActingContext();
  const { isActingBarVisible } = useDebugMenu();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string || 'pt-BR';
  
  const { 
    appearanceSettings: hookAppearanceSettings
  } = useNxAppearance();

  const formMethods = useFormContext(); 
  const isAppearancePage = pathname.includes('/settings/appearance');

  const watchedValues = isAppearancePage && formMethods ? formMethods.watch() : null;

  const appearanceSettings: Partial<AppearanceSettings> = watchedValues || hookAppearanceSettings || defaultAppearance;

  const isVisible = appearanceSettings?.topBarVisible ?? true;
  
  const appNameToDisplay = React.useMemo(() => {
    const nameType = appearanceSettings.topBarBrandingTextType || 'full';
    if (nameType === 'nickname' && appearanceSettings?.identity?.nickname) {
        return appearanceSettings.identity.nickname;
    }
    if (nameType === 'custom' && appearanceSettings.topBarBrandingTextCustom) {
        return appearanceSettings.topBarBrandingTextCustom;
    }
    return appearanceSettings?.identity?.systemName || "Nexie";
  }, [appearanceSettings]);

  if (!isVisible) return null;
  
  const brandingType = appearanceSettings?.topBarBrandingType || 'text';
  const triggerType = appearanceSettings?.topBarTriggerType || 'icon';
  const triggerIconName = appearanceSettings?.topBarTriggerIconName || 'Menu';
  const triggerLogoUrl = appearanceSettings?.topBarTriggerLogoUrl;
  
  const linkOnBranding = appearanceSettings?.topBarLinkOnBranding ?? false;
  const linkToHome = appearanceSettings?.topBarLinkToHome ?? true;
  const customHref = appearanceSettings?.topBarAppNameLinkHref || '/dashboard';
  const finalHref = `/${locale}${linkToHome ? '/dashboard' : (customHref || '/dashboard')}`;
  
  const renderBranding = () => {
    return (
      <div id="header-branding-container" className="flex-1 flex items-center gap-3">
        {brandingType === 'image' && appearanceSettings?.topBarBrandingLogoUrl && (
          <Image id="header-branding-logo" src={appearanceSettings.topBarBrandingLogoUrl} alt="Logo" width={96} height={24} className="h-full w-auto object-contain" />
        )}
        {brandingType === 'text' && (
          <span id="header-text-content">
            {appNameToDisplay}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <InstanceActingBanner />
      <header
        className={cn(
          "flex h-14 items-center gap-4 px-4 sm:px-6 print:hidden z-30",
           isActingAsMaster && actingAsInstanceId && "mt-[40px]"
        )}
      >
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger iconName={triggerIconName} isImage={triggerType === 'image'} imageUrl={triggerLogoUrl} />
          
          {linkOnBranding ? (
            <Link href={finalHref} className="flex-1 flex items-center gap-3">
              {renderBranding()}
            </Link>
          ) : (
            renderBranding()
          )}
        </div>
        
        <div className="flex items-center gap-2">
            {isActingBarVisible && <ActingBar />}
            {/* CORREÇÃO: O DebugMenuTrigger foi adicionado novamente aqui, dentro da verificação de modo de desenvolvimento */}
            {process.env.NODE_ENV === 'development' && <DebugMenuTrigger />}
            <LanguageSwitcher />
            <UserNav />
        </div>
      </header>
    </>
  );
}
