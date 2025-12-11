// src/components/layout/sidebar-nav.tsx
"use client";

import LinkFromNext from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { Loader2, Inbox } from 'lucide-react'; 
import React, { useCallback, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMenuData } from '@/hooks/use-menu-data';
import { useNxAppearance, type AppearanceSettings } from '@/hooks/use-nx-appearance';
import type { ConfiguredMenuItem, MenuGroupFromFirestore } from '@/hooks/use-menu-data';
import { useSidebar } from '@/contexts/sidebar-context';
import { Separator } from '@/components/ui/separator';
import { defaultAppearance } from '@/lib/default-appearance';
import { useUserPermissions } from '@/hooks/use-user-permissions'; // Adicionado para verificação de permissão

export function SidebarNav() {
  const { isCollapsed, setOpen } = useSidebar();
  const currentPathname = usePathname();
  const params = useParams(); 
  const locale = params.locale as string; 

  const { isLoadingPermissions } = useUserPermissions(); // Adicionado

  const {
    finalGroups,
    ungroupedTopLevelItems,
    isLoading: isLoadingMenu,
  } = useMenuData();

  const { appearanceSettings, isLoading: isLoadingAppearance } = useNxAppearance();
  
  const handleLinkClick = useCallback(() => {
      if (window.innerWidth < 768) { // md breakpoint
        setOpen(false);
      }
  }, [setOpen]);

  const renderMenuItem = useMemo(() => {
    const renderFunction = (item: ConfiguredMenuItem, group?: MenuGroupFromFirestore): JSX.Element | null => {
        if (item.isHidden) { return null; }
    
        const href = item.originalHref ? `/${locale}${item.originalHref}` : '#';
        const isLink = href !== '#';

        const pathWithoutLocale = currentPathname.substring(currentPathname.indexOf('/', 1));
        const isActive = isLink && (pathWithoutLocale === item.originalHref || (item.originalHref !== '/' && item.originalHref !== '/dashboard' && pathWithoutLocale.startsWith(item.originalHref || '___')));

        const currentAppearance = appearanceSettings || defaultAppearance;
        const useGroupColorForItem = group?.colorApplyTo === 'group_and_items';
        const inheritedSidebarFg = currentAppearance.sidebarForegroundColor || 'hsl(var(--sidebar-foreground))';
        
        const iconColor = useGroupColorForItem ? (group?.finalDisplayGroupIconColor || inheritedSidebarFg) : inheritedSidebarFg;
        const textColor = useGroupColorForItem ? (group?.finalDisplayGroupTextColor || inheritedSidebarFg) : inheritedSidebarFg;
        
        const finalIconColor = isActive ? 'hsl(var(--sidebar-accent-foreground))' : iconColor;
        const finalTextColor = isActive ? 'hsl(var(--sidebar-accent-foreground))' : textColor;

        const linkStyle: React.CSSProperties = { 
            backgroundColor: isActive ? 'hsl(var(--sidebar-accent))' : 'transparent',
        };
        const iconStyle: React.CSSProperties = { color: finalIconColor };
        const textStyle: React.CSSProperties = { color: finalTextColor };

        const paddingLeftClass = cn({
            "pl-3": item.level === 0,
            "pl-7": item.level === 1,
            "pl-11": item.level === 2,
        }, item.level > 2 && `pl-${11 + (item.level - 2) * 4}`);

        const interactiveElement = (
            <LinkFromNext
            href={href}
            className={cn(
                "flex items-center p-2 rounded-md h-auto w-full transition-colors nav-item",
                isCollapsed ? "justify-center" : paddingLeftClass,
                isActive ? "font-medium active" : "hover:bg-accent/10",
                !isLink && "cursor-default hover:bg-transparent"
            )}
            style={linkStyle}
            onClick={(e) => {
                if (!isLink) e.preventDefault();
                else handleLinkClick();
            }}
            aria-label={item.displayName}
            >
            <div className={cn("flex items-center flex-grow min-w-0 gap-2", isCollapsed ? "justify-center" : "justify-start")}>
                <Icon 
                name={item.originalIcon || 'CircleHelp'} 
                library="lucide" 
                className={cn("shrink-0 nav-icon", isCollapsed ? "h-5 w-5" : "h-4 w-4")} 
                style={iconStyle} 
                aria-hidden="true"
                />
                {!isCollapsed && (
                    <span 
                    className={cn("text-sm flex-grow block overflow-hidden text-ellipsis whitespace-nowrap nav-text")} 
                    style={textStyle}
                    >
                    {item.displayName}
                    </span>
                )}
            </div>
            </LinkFromNext>
        );

        const mainElement = (
        <li className="w-full relative">
            {isCollapsed ? (
            <Tooltip>
                <TooltipTrigger asChild>{interactiveElement}</TooltipTrigger>
                <TooltipContent side="right" align="center">{item.displayName}</TooltipContent>
            </Tooltip>
            ) : interactiveElement}
            {!isCollapsed && item.subItems && item.subItems.length > 0 && (
            <ul className="flex flex-col space-y-px pt-0.5 overflow-hidden">
                {item.subItems.map(subItem => <React.Fragment key={subItem.menuKey}>{renderFunction(subItem, group)}</React.Fragment>)}
            </ul>
            )}
        </li>
        );

        return mainElement;
    };
    return renderFunction;
  }, [isCollapsed, currentPathname, handleLinkClick, appearanceSettings, locale]);


  const isLoading = isLoadingMenu || isLoadingAppearance || isLoadingPermissions; // Adicionado

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 h-full">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  const renderGroup = (group: MenuGroupFromFirestore) => {
    if (!group || !group.docId || group.items.length === 0) return null;
    const groupIconColor = group.finalDisplayGroupIconColor || 'hsl(var(--sidebar-foreground))';
    const groupTextColor = group.finalDisplayGroupTextColor || 'hsl(var(--sidebar-foreground))';
    
    return (
      <React.Fragment key={group.docId}>
        <Separator className="my-2 bg-border/50" />
        <li className={cn("px-2 pt-1 pb-0.5", isCollapsed && "flex justify-center")}>
          <div className={cn("flex items-center gap-2 text-sm font-semibold", isCollapsed && "justify-center" )}>
            <Icon 
              name={group.icon || 'LayoutGrid'} 
              library="lucide" 
              className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} 
              style={{ color: groupIconColor }}
            />
            {!isCollapsed && 
              <span className="truncate" style={{ color: groupTextColor }}>
                {group.name}
              </span>
            }
          </div>
        </li>
        {group.items.map((item: ConfiguredMenuItem) => <React.Fragment key={item.menuKey}>{renderMenuItem(item, group)}</React.Fragment>)}
      </React.Fragment>
    );
  }
  
  const renderUngrouped = () => {
    if (ungroupedTopLevelItems.length === 0) return null;
    const ungroupedTextColor = 'hsl(var(--sidebar-foreground), 0.7)';
    return (
        <>
        <Separator className="my-2 bg-border/50" />
        <li className={cn("px-2 pt-1 pb-0.5", isCollapsed && "flex justify-center")}>
            <div className={cn("flex items-center gap-2 text-sm font-semibold", isCollapsed && "justify-center" )} style={{ color: ungroupedTextColor }}>
                <Icon name="CircleHelp" library="lucide" className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!isCollapsed && <span>Outros</span>}
            </div>
        </li>
        {ungroupedTopLevelItems.map((item: ConfiguredMenuItem) => <React.Fragment key={item.menuKey}>{renderMenuItem(item)}</React.Fragment>)}
        </>
    )
  }

  if (!isLoadingMenu && finalGroups.length === 0 && ungroupedTopLevelItems.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <Inbox className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhum item de menu disponível.</p>
        </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ul className="flex flex-col gap-1 p-2">
        {finalGroups.map((group: MenuGroupFromFirestore) => renderGroup(group))}
        {renderUngrouped()}
      </ul>
    </TooltipProvider>
  );
}
