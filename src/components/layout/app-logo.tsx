// src/components/layout/app-logo.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useNxDynamicMenu } from '@/hooks/use-nx-dynamic-menu';
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDebugMenu } from '@/contexts/DebugMenuContext';
import { defaultAppearance } from '@/lib/default-appearance';

const DEFAULT_FALLBACK_LOGO_EXPANDED = "Package";

function isUrl(str?: string): boolean {
  if (!str) return false;
  return str.startsWith('http') || str.startsWith('/system-assets/') || str.startsWith('data:image/');
}

const useSafeSidebar = () => {
    try {
        return useSidebar();
    } catch (e) {
        return { 
            isCollapsed: false, 
            toggle: () => console.warn("Sidebar context not found."),
            setOpen: () => {}
        };
    }
}

const FormValueWatcher = ({ setLiveSettings }: { setLiveSettings: (settings: any) => void }) => {
    const { bottomBarPreviewConfig } = useDebugMenu();
    const watchedFormValues = useWatch();

    useEffect(() => {
        let settings = { ...defaultAppearance, ...(watchedFormValues || {}) };
        if (bottomBarPreviewConfig) {
            (settings as any).bottomBarConfig = {
                ...(settings.bottomBarConfig || {}),
                ...bottomBarPreviewConfig,
            };
        }
        setLiveSettings(settings);
    }, [watchedFormValues, bottomBarPreviewConfig, setLiveSettings]);

    return null;
}

export function AppLogo() {
  const { isCollapsed, toggle: toggleSidebar } = useSafeSidebar();
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string || 'pt-BR';
  
  const { 
    appearanceSettings: hookAppearanceSettings,
    generalSettings,
    isLoading: isLoadingSettings 
  } = useNxDynamicMenu();

  const { bottomBarPreviewConfig } = useDebugMenu();
  const formMethods = useFormContext(); 
  const isAppearancePage = pathname.includes('/settings/appearance');
  
  const [formLiveSettings, setFormLiveSettings] = useState<Partial<AppearanceSettings> | null>(null);

  const nonFormSettings = useMemo(() => {
    let settings = { ...defaultAppearance, ...(hookAppearanceSettings || {}) };
    if (bottomBarPreviewConfig) {
        (settings as any).bottomBarConfig = {
            ...(settings.bottomBarConfig || {}),
            ...bottomBarPreviewConfig,
        };
    }
    return settings;
  }, [hookAppearanceSettings, bottomBarPreviewConfig]);

  const liveSettings = (isAppearancePage && formMethods && formLiveSettings) 
    ? formLiveSettings 
    : nonFormSettings;

  const appearanceSettings: AppearanceSettings = liveSettings as AppearanceSettings;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const currentIsCollapsedOnDesktop = mounted ? isCollapsed : false;

  const showAppName = appearanceSettings?.leftSidebarShowAppName ?? true;
  
  const appNameToDisplay = useMemo(() => {
      const nameType = appearanceSettings.leftSidebarAppNameType || 'full';
      if (nameType === 'nickname' && generalSettings?.nickname) {
          return generalSettings.nickname;
      }
      if (nameType === 'custom' && appearanceSettings.leftSidebarAppNameCustomText) {
          return appearanceSettings.leftSidebarAppNameCustomText;
      }
      return generalSettings?.systemName || "Nexie";
  }, [appearanceSettings, generalSettings]);
  
  const logoUrlToUse = useMemo(() => {
    let identifier;
    if (currentIsCollapsedOnDesktop) {
        identifier = appearanceSettings?.leftSidebarLogoCollapsedUrl;
    } else {
        identifier = appearanceSettings?.leftSidebarLogoExpandedUrl;
    }

    if (identifier === 'logoUrl') return generalSettings?.logoUrl;
    if (identifier === 'logoCollapsedUrl') return generalSettings?.logoCollapsedUrl;
    
    return (identifier && identifier.trim() !== "") ? identifier : DEFAULT_FALLBACK_LOGO_EXPANDED;
  }, [currentIsCollapsedOnDesktop, appearanceSettings, generalSettings]);


  const logoSize = appearanceSettings?.leftSidebarLogoSize ?? "medium";
  const logoImageSizeClasses = cn({
    "h-5 w-5": logoSize === "small",
    "h-7 w-7": logoSize === "medium",
    "h-9 w-9": logoSize === "large",
  }, currentIsCollapsedOnDesktop && { 
    "h-6 w-6": logoSize === "small",
    "h-7 w-7": logoSize === "medium",
    "h-8 w-8": logoSize === "large",
  });

  const buttonClassName = cn(
    "flex h-14 items-center gap-2.5 border-b border-sidebar-border w-full",
    "hover:bg-sidebar-accent focus-visible:bg-sidebar-accent",
    "focus-visible:ring-0 focus-visible:ring-offset-0",
    currentIsCollapsedOnDesktop
      ? "justify-center p-2"
      : "justify-start px-3"
  );
  
  const linkOnAppName = appearanceSettings?.leftSidebarLinkOnAppName ?? false;
  const linkToHome = appearanceSettings?.leftSidebarLinkToHome ?? true;
  const customHref = appearanceSettings?.leftSidebarAppNameLinkHref || '/dashboard';
  const finalHref = `/${locale}${linkToHome ? '/dashboard' : (customHref || '/dashboard')}`;
  
  const renderLogo = () => {
    if (isLoadingSettings && !isAppearancePage) {
        return <Skeleton className={cn("shrink-0 bg-muted-foreground/20", logoImageSizeClasses, "rounded-md")} />;
    }
    if (isUrl(logoUrlToUse)) {
        return (
            <div className={cn("relative shrink-0", logoImageSizeClasses)}>
                <Image
                    key={logoUrlToUse!}
                    src={logoUrlToUse!}
                    alt={`Application Logo`}
                    fill
                    sizes={logoSize === "small" ? "20px" : logoSize === "medium" ? "28px" : "36px"}
                    className="object-contain"
                    priority
                    data-ai-hint="application logo"
                    onError={() => console.warn(`AppLogo: Error loading image ${logoUrlToUse}`)}
                />
            </div>
        )
    }
    return <Icon name={logoUrlToUse as any} className={cn("shrink-0 text-sidebar-foreground", logoImageSizeClasses)} />;
  }

  const renderContent = () => (
    <>
      {renderLogo()}
      {!currentIsCollapsedOnDesktop && showAppName && (
        <span id="sidebar-app-name-content" className="text-xl whitespace-nowrap app-name-span">
            {appNameToDisplay}
        </span>
      )}
    </>
  );

  const watcher = isAppearancePage && formMethods 
    ? <FormValueWatcher setLiveSettings={setFormLiveSettings} /> 
    : null;

  return (
    <>
      {watcher}
      {linkOnAppName ? (
        <Link href={finalHref} passHref legacyBehavior>
          <Button
            variant="ghost"
            asChild={linkOnAppName}
            className={buttonClassName}
            aria-label="Toggle Sidebar"
          >
            <div className="flex h-full w-full items-center gap-2.5">
              {renderContent()}
            </div>
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className={buttonClassName}
          aria-label="Toggle Sidebar"
        >
          {renderContent()}
        </Button>
      )}
    </>
  );
}
