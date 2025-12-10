// src/components/layout/bottom-navigation-bar.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '../ui/icon';
import type { BottomBarTab, BottomBarItem, BottomBarConfig } from '@/lib/types/menus';
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { useDebugMenu } from '@/contexts/DebugMenuContext';
import { useMenuData, type ConfiguredMenuItem } from '@/hooks/use-menu-data'; // Importar o hook de menu

const ACTIVE_TAB_ID_STORAGE_KEY = "bottom-bar-active-tab";

// Função para obter a aba ativa inicial, com lógica de fallback
const getInitialTabId = (tabs: BottomBarTab[], currentPath: string): string | null => {
    if (tabs.length === 0) return null;

    // 1. Tenta encontrar uma aba cujo item corresponde à rota atual
    for (const tab of tabs) {
        if (tab.items?.some(item => currentPath.startsWith(item.href || '___'))) {
            return tab.id;
        }
    }

    // 2. Se não encontrar, tenta usar o valor salvo na sessão
    if (typeof window !== 'undefined') {
        try {
            const storedValue = sessionStorage.getItem(ACTIVE_TAB_ID_STORAGE_KEY);
            if (storedValue) {
                const storedId = JSON.parse(storedValue);
                if (tabs.some(t => t.id === storedId)) {
                    return storedId;
                }
            }
        } catch (error) {
            console.warn("Could not parse active tab from sessionStorage", error);
        }
    }
    
    // 3. Como último recurso, usa a primeira aba da lista
    return tabs[0]?.id || null;
};


const RenderBarItems: React.FC<{ items: BottomBarItem[], displayMode: string, enableScroll?: boolean }> = ({ items, displayMode, enableScroll }) => {
  const pathname = usePathname();
  const sortedItems = useMemo(() => 
    Array.isArray(items) ? [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [],
    [items]
  );
  
  return (
    <>
      {sortedItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href || '___'));
        
        return (
          <Link
            href={item.href || '#'}
            key={item.id || item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-full flex-col px-1 group text-center transition-colors duration-200 focus:outline-none",
               "shrink-0 basis-16 sm:basis-20" 
            )}
            style={{
                justifyContent: 'var(--bottom-bar-item-vertical-align, center)',
                gap: `var(--bottom-bar-icon-label-spacing, 2px)`,
                paddingTop: `var(--bottom-bar-padding-vertical, 0px)`,
                paddingBottom: `var(--bottom-bar-padding-vertical, 0px)`,
            }}
          >
            {displayMode !== 'text_only' && (
                <Icon name={item.icon as any}
                className="transition-colors mx-auto"
                style={{ 
                    color: isActive ? 'hsl(var(--bottom-bar-icon-active))' : 'hsl(var(--bottom-bar-icon-inactive))',
                    width: `var(--bottom-bar-icon-size, 20px)`,
                    height: `var(--bottom-bar-icon-size, 20px)`,
                }}
                aria-hidden="true"
                />
            )}
            {displayMode !== 'icon_only' && (
                <span style={{ 
                    color: isActive ? 'hsl(var(--bottom-bar-text-active))' : 'hsl(var(--bottom-bar-text-inactive))',
                    fontFamily: `var(--bottom-bar-font-family, var(--font-family-body))`,
                    fontSize: `var(--bottom-bar-font-size)`,
                }}
                className="whitespace-nowrap"
                >
                    {item.label}
                </span>
            )}
          </Link>
        );
      })}
    </>
  );
};

export function BottomNavigationBar() {
  const { appearanceSettings } = useNxAppearance();
  const { bottomBarPreviewConfig } = useDebugMenu();
  const { allCombinedItems } = useMenuData(); // Buscar todos os itens de menu
  const pathname = usePathname();

  const finalConfig: BottomBarConfig | undefined = useMemo(() => {
      const config = bottomBarPreviewConfig ?? appearanceSettings?.bottomBarConfig;

      // LÓGICA DE FALLBACK: Se não há abas definidas, cria uma aba padrão
      if (!config || !config.tabs || config.tabs.length === 0) {
          const defaultItems = allCombinedItems
              .filter(item => item.canBeBottomBarItem)
              .map((item, index) => ({
                  id: item.menuKey,
                  label: item.displayName,
                  icon: item.originalIcon,
                  href: item.originalHref,
                  order: item.order ?? index,
              }));

          if (defaultItems.length > 0) {
              return {
                  ...config,
                  enableTabs: false, // Desabilita o sistema de "orelhas" se estivermos no modo padrão
                  tabs: [{
                      id: 'default_tab',
                      name: 'Principal',
                      icon: 'Home',
                      order: 0,
                      items: defaultItems,
                      enableScroll: false,
                      maxItems: 5,
                  }],
              };
          }
      }
      return config;
  }, [bottomBarPreviewConfig, appearanceSettings, allCombinedItems]);


  const sortedTabs = useMemo(() => [...(finalConfig?.tabs || [])].sort((a,b) => (a.order ?? 0) - (b.order ?? 0)), [finalConfig?.tabs]);
  
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTabId(getInitialTabId(sortedTabs, pathname));
  }, [sortedTabs, pathname]);


  const handleSetTab = (tabId: string | null) => {
    setActiveTabId(tabId);
    if (typeof window !== 'undefined' && tabId) {
        try {
            sessionStorage.setItem(ACTIVE_TAB_ID_STORAGE_KEY, JSON.stringify(tabId));
        } catch (error) {
            console.warn("Could not write active tab to sessionStorage", error);
        }
    }
  };

  const isTabsEnabled = finalConfig?.enableTabs === true;
  
  const navMode = appearanceSettings?.bottomBarMode || 'fixed';
  const isVisible = appearanceSettings?.bottomBarVisible !== false;
  
  const activeTabDetails = useMemo(() => {
    if (!isTabsEnabled) return sortedTabs[0] || null; // Se abas não estão habilitadas, usa a primeira como fonte de itens
    if (!activeTabId && sortedTabs.length > 0) return sortedTabs[0];
    return sortedTabs.find(t => t.id === activeTabId);
  }, [isTabsEnabled, activeTabId, sortedTabs]);

  const itemsToRender = useMemo(() => activeTabDetails?.items || [], [activeTabDetails]);


  const displayMode = finalConfig?.tabsDisplayMode || 'icon_and_text';
  const showTitleOnSingleTab = finalConfig?.showTitleOnSingleTab === true;
  const shouldShowTabsEars = isTabsEnabled && (sortedTabs.length > 1 || (sortedTabs.length === 1 && showTitleOnSingleTab));
  
  const hasContentToShow = itemsToRender && itemsToRender.length > 0;
  const shouldRenderBar = isVisible && hasContentToShow;
  
  const enableScroll = activeTabDetails?.enableScroll === true;

  if (!shouldRenderBar) return null;

  return (
    <div
      className={cn(
        "fixed md:hidden z-30 bottom-0 left-0 right-0",
        navMode === 'floating' && "bar-floating"
      )}
      aria-label="Navegação Inferior"
    >
      <div id="bottom-bar-tabs-container" className={cn(
        "flex h-8 items-end gap-1.5 px-4",
        !shouldShowTabsEars && "hidden",
        finalConfig?.tabsAlignment === 'center' && "justify-center",
        finalConfig?.tabsAlignment === 'end' && "justify-end",
        finalConfig?.tabsAlignment !== 'center' && finalConfig?.tabsAlignment !== 'end' && "justify-start"
      )}>
            {sortedTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => handleSetTab(tab.id)}
                    className={cn(
                        "flex items-center gap-1.5 rounded-t-md px-3 py-1.5 transition-all relative",
                        tab.id === activeTabId 
                          ? 'bg-card shadow-connected-tab z-10 -mb-px border-t border-l border-r border-border' 
                          : 'bg-muted/50 hover:bg-muted'
                    )}
                    data-active={tab.id === activeTabId}
                >
                    {displayMode !== 'text_only' && <Icon name={tab.icon as any} className="h-4 w-4 text-muted-foreground"/>}
                    {displayMode !== 'icon_only' && <span className="text-xs font-medium text-muted-foreground">{tab.name}</span>}
                </button>
            ))}
      </div>

      
      <nav>
        <div
          className={cn(
              "relative z-0 h-14 w-full border-t flex bg-card text-card-foreground",
              shouldShowTabsEars ? "rounded-b-md" : "rounded-md",
              {"overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none]": enableScroll,
              "[&::-webkit-scrollbar]:hidden": enableScroll}
          )}
          style={{
              justifyContent: enableScroll ? 'flex-start' : 'var(--bottom-bar-items-alignment, space-around)',
              gap: `var(--bottom-bar-items-gap, 0px)`,
          }}
        >
            <RenderBarItems items={itemsToRender} displayMode={displayMode} enableScroll={enableScroll} />
        </div>
      </nav>
      
    </div>
  );
}

BottomNavigationBar.displayName = 'BottomNavigationBar';