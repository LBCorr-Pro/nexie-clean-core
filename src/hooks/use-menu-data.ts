// src/hooks/use-menu-data.ts
"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  query, orderBy, getDocs, CollectionReference, doc, onSnapshot, DocumentData, Timestamp
} from "firebase/firestore";
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useInstanceActingContext, ModuleDefinition, InstanceModuleDefinition } from '@/contexts/instance-acting-context';
import { useLog } from '@/contexts/LogContext';
import { refs } from '@/lib/firestore-refs';
import { dequal } from 'dequal';
import { knownModuleFolderSlugs } from "@/lib/known-module-folders";
import { useNxAppearance } from './use-nx-appearance';
import type { MenuPreset } from '@/lib/types/menus'; 

// --- Types ---
export type { MenuPreset }
export interface UserMenuItemConfig { menuKey: string; displayName: string; groupId: string; parentId: string; order: number; isHidden: boolean; isModule: boolean; originalHref: string; originalIcon: string; originalName: string; isColorUnified: boolean; unifiedColor?: string; iconColor?: string; textColor?: string; canBeInitialPage?: boolean; canBeBottomBarItem?: boolean; customized?: boolean; masterOnly?: boolean; isRichTextEditor?: boolean; }
export interface ConfiguredMenuItem extends UserMenuItemConfig { level: number; subItems: ConfiguredMenuItem[]; isRegistered?: boolean; effectiveModuleStatus?: boolean; iconComponent?: React.ElementType; }
export interface MenuGroupFromFirestore { docId: string; name: string; icon: string; colorApplyTo: 'none' | 'group_only' | 'group_and_items'; isColorUnified: boolean; unifiedColor?: string; iconColor?: string; textColor?: string; order: number; items: ConfiguredMenuItem[]; finalDisplayGroupIconColor?: string; finalDisplayGroupTextColor?: string; createdAt?: Timestamp; updatedAt?: Timestamp; }
export interface ManagedModule extends ModuleDefinition { isRegistered: boolean; instanceStatus?: boolean | null;}
export interface InstanceData { defaultEditorModuleId?: string; defaultInitialPage?: string; [key: string]: any; }

const kebabToPascalCase = (kebab?: string): string => kebab ? kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') : 'Blocks';
const FallbackIcon = LucideIcons.Blocks;

export function useMenuData() {
    const { user: currentUser, loading: isAuthLoading } = useAuth();
    const {
        actingAsInstanceId,
        subInstanceId,
        globalModuleDefinitions,
        instanceModuleDefinitions,
        isLoadingModuleConfigs
    } = useInstanceActingContext();

    const { logEvent } = useLog();
    const { appearanceSettings, isLoading: isLoadingAppearance } = useNxAppearance();

    const [menuGroups, setMenuGroups] = useState<DocumentData[]>([]);
    const [itemConfigs, setItemConfigs] = useState<Map<string, UserMenuItemConfig>>(new Map());
    const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingInstanceData, setIsLoadingInstanceData] = useState(true);
    
    const authStatus = useMemo(() => {
        if (isAuthLoading) return 'loading';
        return currentUser ? 'authenticated' : 'unauthenticated';
    }, [isAuthLoading, currentUser]);

    // Listener for instance data
    useEffect(() => {
        if (actingAsInstanceId) {
            setIsLoadingInstanceData(true);
            const instanceRef = doc(refs.instances(), actingAsInstanceId);
            const unsubscribe = onSnapshot(instanceRef, (docSnap) => {
                if (docSnap.exists()) {
                    setInstanceData(docSnap.data() as InstanceData);
                } else {
                    setInstanceData(null);
                }
                setIsLoadingInstanceData(false);
            }, (error) => {
                logEvent('error', '[useMenuData] Error fetching instance data', { message: error.message });
                setIsLoadingInstanceData(false);
            });
            return () => unsubscribe();
        } else {
            setInstanceData(null);
            setIsLoadingInstanceData(false);
        }
    }, [actingAsInstanceId, logEvent]);
    

    const getContextPaths = useCallback(() => {
        let groupsPathRef: CollectionReference;
        let itemsPathRef: CollectionReference;

        if (actingAsInstanceId && subInstanceId) {
            groupsPathRef = refs.subinstance.menuGroups(actingAsInstanceId, subInstanceId);
            itemsPathRef = refs.subinstance.menuItems(actingAsInstanceId, subInstanceId);
        } else if (actingAsInstanceId) {
            groupsPathRef = refs.instance.menuGroups(actingAsInstanceId);
            itemsPathRef = refs.instance.menuItems(actingAsInstanceId);
        } else {
            groupsPathRef = refs.master.menuGroups();
            itemsPathRef = refs.master.menuItems();
        }
        return { groupsPathRef, itemsPathRef };
    }, [actingAsInstanceId, subInstanceId]);

    const fetchMenuData = useCallback(async () => {
        if (isAuthLoading || authStatus !== 'authenticated' || actingAsInstanceId === undefined) return;
        
        setIsLoadingData(true);
        const { groupsPathRef, itemsPathRef } = getContextPaths();
        
        const masterGroupsRef = refs.master.menuGroups();
        const instanceGroupsRef = actingAsInstanceId ? refs.instance.menuGroups(actingAsInstanceId) : null;
        const masterItemsRef = refs.master.menuItems();
        const instanceItemsRef = actingAsInstanceId ? refs.instance.menuItems(actingAsInstanceId) : null;

        try {
            let groupSnap = await getDocs(query(groupsPathRef, orderBy("order", "asc")));
            let groupsData = groupSnap.docs.map(d => ({...d.data(), docId: d.id, customized: true }));

            if (groupSnap.empty && instanceGroupsRef) {
                groupSnap = await getDocs(query(instanceGroupsRef, orderBy("order", "asc")));
                groupsData = groupSnap.docs.map(d => ({...d.data(), docId: d.id, customized: true }));
            }
            if (groupSnap.empty) {
                groupSnap = await getDocs(query(masterGroupsRef, orderBy("order", "asc")));
                groupsData = groupSnap.docs.map(d => ({...d.data(), docId: d.id, customized: false }));
            }
            setMenuGroups(prev => dequal(prev, groupsData) ? prev : groupsData);
    
            let itemSnap = await getDocs(query(itemsPathRef, orderBy("order", "asc")));
            let isCustom = !itemSnap.empty;

            if (itemSnap.empty && instanceItemsRef) {
                itemSnap = await getDocs(query(instanceItemsRef, orderBy("order", "asc")));
                isCustom = !itemSnap.empty;
            }
            if (itemSnap.empty) {
                itemSnap = await getDocs(query(masterItemsRef, orderBy("order", "asc")));
                isCustom = false;
            }
            
            const newItemsMap = new Map<string, UserMenuItemConfig>();
            itemSnap.docs.forEach(doc => newItemsMap.set(doc.id, { ...doc.data(), menuKey: doc.id, customized: isCustom } as UserMenuItemConfig));
            setItemConfigs(prev => dequal(prev, newItemsMap) ? prev : newItemsMap);
    
        } catch (error) {
            logEvent('error', `[useMenuData] Error in fetchMenuData`, { message: (error as Error).message });
        } finally {
            setIsLoadingData(false);
        }
    }, [isAuthLoading, authStatus, actingAsInstanceId, getContextPaths, logEvent]);

    useEffect(() => {
        fetchMenuData(); 
    }, [fetchMenuData]);

    const allManagedModules = useMemo(() => {
        if (isLoadingModuleConfigs) return [];
    
        return knownModuleFolderSlugs.map(slug => {
            const registeredDef = globalModuleDefinitions.get(slug);
            const instanceDef = instanceModuleDefinitions.get(slug);
            const isRegistered = !!registeredDef;
    
            const moduleObject = {
                id: slug,
                name: registeredDef?.name || slug,
                docId: registeredDef?.docId || slug,
                isRegistered,
                status: registeredDef?.status || false,
                instanceStatus: instanceDef?.status,
                description: registeredDef?.description || 'Módulo detectado no sistema de arquivos, mas sem descrição no banco de dados.',
                icon: registeredDef?.icon || 'Package',
                parentId: registeredDef?.parentId || '',
                useSameColor: registeredDef?.useSameColor || false,
                wasCreatedInImportMode: registeredDef?.wasCreatedInImportMode || false,
                imported: registeredDef?.imported || false,
                isRichTextEditor: registeredDef?.isRichTextEditor,
                canBeInitialPage: registeredDef?.canBeInitialPage,
                canBeBottomBarItem: registeredDef?.canBeBottomBarItem,
                color: registeredDef?.color,
                unifiedColor: registeredDef?.unifiedColor,
                iconColor: registeredDef?.iconColor,
                textColor: registeredDef?.textColor,
                createdAt: registeredDef?.createdAt,
                updatedAt: registeredDef?.updatedAt,
            };
            return moduleObject as ManagedModule;
        });
    }, [globalModuleDefinitions, instanceModuleDefinitions, isLoadingModuleConfigs]);

    const { finalGroups, ungroupedTopLevelItems, allCombinedItems } = useMemo(() => {
        const itemMap = new Map<string, ConfiguredMenuItem>();
    
        itemConfigs.forEach((config, key) => {
             itemMap.set(key, {
                ...config,
                level: 0,
                subItems: [],
                isRegistered: !config.isModule, 
                iconComponent: (LucideIcons as any)[kebabToPascalCase(config.originalIcon)] || FallbackIcon,
            });
        });
    
        allManagedModules.forEach((moduleDef: any) => {
            const menuKey = `module_${moduleDef.id}`;
            const instanceDef = instanceModuleDefinitions.get(moduleDef.id);
            const isGloballyActive = moduleDef.status === true;
            const isInstanceActive = instanceDef ? instanceDef.status === true : true; // Default to true if no instance-specific setting
            const effectiveModuleStatus = isGloballyActive && isInstanceActive;

            let finalIconColor = moduleDef.unifiedColor || 'hsl(var(--sidebar-foreground))';
            if (!moduleDef.useSameColor && moduleDef.iconColor) {
                finalIconColor = moduleDef.iconColor;
            }
            
            const statusColor = !moduleDef.imported
                ? 'orange'
                : effectiveModuleStatus
                ? 'green'
                : 'gray'; 
                
            if (!itemMap.has(menuKey)) {
                itemMap.set(menuKey, {
                    menuKey,
                    displayName: moduleDef.name,
                    originalName: moduleDef.name,
                    originalHref: `/modules/${moduleDef.id}`,
                    originalIcon: moduleDef.icon || 'Blocks',
                    groupId: moduleDef.parentId || '',
                    parentId: '',
                    order: 500, // Or use a specific order from moduleDef if available
                    isHidden: false,
                    isModule: true,
                    isColorUnified: true,
                    unifiedColor: statusColor,
                    iconColor: finalIconColor,
                    textColor: moduleDef.useSameColor ? finalIconColor : moduleDef.textColor || 'hsl(var(--sidebar-foreground))',
                    customized: false,
                    masterOnly: false,
                    canBeInitialPage: moduleDef.canBeInitialPage,
                    canBeBottomBarItem: moduleDef.canBeBottomBarItem,
                    level: 0,
                    subItems: [],
                    isRegistered: true,
                    effectiveModuleStatus,
                    iconComponent: (LucideIcons as any)[kebabToPascalCase(moduleDef.icon)] || FallbackIcon,
                } as ConfiguredMenuItem);
            }
        });
    
        const allItems = Array.from(itemMap.values());
        const hierarchicalItems: ConfiguredMenuItem[] = [];
        allItems.forEach(item => {
            if (item.parentId && itemMap.has(item.parentId)) {
                const parent = itemMap.get(item.parentId)!;
                if (!parent.subItems) parent.subItems = [];
                parent.subItems.push(item);
                item.level = parent.level + 1;
            } else {
                item.level = 0;
                hierarchicalItems.push(item);
            }
        });
    
        const sortItemsRecursive = (items: ConfiguredMenuItem[]) => {
            items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            items.forEach(item => { if (item.subItems.length > 0) sortItemsRecursive(item.subItems); });
        };
        sortItemsRecursive(hierarchicalItems);
    
        const finalGroupsData: MenuGroupFromFirestore[] = menuGroups.map(g => {
            const currentAppearance = appearanceSettings;
            const sidebarFg = currentAppearance?.sidebarForegroundColor;
            const defaultSidebarTextColor = sidebarFg || 'hsl(var(--sidebar-foreground))';

            let finalIconColor = defaultSidebarTextColor;
            let finalTextColor = defaultSidebarTextColor;

            if (g.colorApplyTo !== 'none') {
                if (g.isColorUnified) {
                    if (g.unifiedColor) {
                        finalIconColor = g.unifiedColor;
                        finalTextColor = g.unifiedColor;
                    }
                } else {
                    if (g.iconColor) finalIconColor = g.iconColor;
                    if (g.textColor) finalTextColor = g.textColor;
                }
            }
            
            return { ...g, items: [], finalDisplayGroupIconColor: finalIconColor, finalDisplayGroupTextColor: finalTextColor } as unknown as MenuGroupFromFirestore
        });
        const groupMap = finalGroupsData.reduce((acc: Record<string, MenuGroupFromFirestore>, group) => {
            acc[group.docId] = group;
            return acc;
        }, {});
    
        const ungroupedItems: ConfiguredMenuItem[] = [];
    
        hierarchicalItems.forEach(item => {
            if (!item.isHidden) {
              if (item.groupId && groupMap[item.groupId]) {
                  groupMap[item.groupId].items.push(item);
              } else {
                  ungroupedItems.push(item);
              }
            }
        });
        
        return { 
            finalGroups: finalGroupsData,
            ungroupedTopLevelItems: ungroupedItems, 
            allCombinedItems: allItems 
        };
    }, [menuGroups, itemConfigs, instanceModuleDefinitions, appearanceSettings, allManagedModules]);

    return {
        finalGroups,
        ungroupedTopLevelItems,
        allManagedModules,
        allCombinedItems,
        instanceData,
        defaultEditorModuleId: instanceData?.defaultEditorModuleId,
        defaultInitialPage: instanceData?.defaultInitialPage,
        isLoading: isAuthLoading || isLoadingData || isLoadingModuleConfigs || isLoadingAppearance || isLoadingInstanceData,
        refetchMenuData: fetchMenuData,
    };
}
