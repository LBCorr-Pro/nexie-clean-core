// src/hooks/use-nx-dynamic-menu.ts
"use client";

import { useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useMenuData, type UserMenuItemConfig, type MenuGroupFromFirestore, type ConfiguredMenuItem, type MenuPreset } from './use-menu-data';
import { useNxAppearance, type AppearanceSettings } from './use-nx-appearance'; 
import { useNxGeneralSettings, type GeneralSettings, type GeneralSettingsDebugInfo } from './use-nx-general-settings';

export type { UserMenuItemConfig, MenuGroupFromFirestore, ConfiguredMenuItem, MenuPreset, GeneralSettings, AppearanceSettings, GeneralSettingsDebugInfo };

export function useNxDynamicMenu() {
    const { user: currentUser, loading: isAuthLoading } = useAuthContext();
    
    const { appearanceSettings, isLoading: isLoadingAppearance } = useNxAppearance();
    
    // O hook agora retorna as informações de debug.
    const { 
        generalSettings, 
        isLoading: isLoadingGeneral, 
        isSaving: isSavingGeneral,
        saveGeneralSettings,
        debugInfo: generalSettingsDebugInfo, 
    } = useNxGeneralSettings();
    
    const { 
        finalGroups,
        ungroupedTopLevelItems,
        allManagedModules,
        allCombinedItems,
        instanceData,
        isLoading: isLoadingMenu,
        refetchMenuData
    } = useMenuData();
    
    return {
        // From Appearance
        appearanceSettings,
        
        // From General Settings
        generalSettings,
        saveGeneralSettings,
        isSaving: isSavingGeneral,
        generalSettingsDebugInfo, 

        // From Menu Data
        finalGroups,
        ungroupedTopLevelItems,
        allManagedModules,
        allCombinedItems,
        instanceData,
        refetchMenuData,
        defaultEditorModuleId: instanceData?.defaultEditorModuleId,
        defaultInitialPage: instanceData?.defaultInitialPage,
        
        // Combined Loading State
        isLoading: isAuthLoading || isLoadingAppearance || isLoadingGeneral || isLoadingMenu,
    };
}
