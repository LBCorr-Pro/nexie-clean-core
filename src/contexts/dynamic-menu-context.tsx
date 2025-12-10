import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { BottomBarConfig } from '@/lib/types/menus';

export interface GeneralSettings {
  bottomBarSettings?: Partial<BottomBarConfig>;
}

interface DynamicMenuContextType {
  generalSettings: GeneralSettings | null;
  setBottomBarPreviewConfig: (config: Partial<BottomBarConfig> | null) => void;
}

const DynamicMenuContext = createContext<DynamicMenuContextType | undefined>(undefined);

export const DynamicMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [previewConfig, setPreviewConfig] = useState<Partial<BottomBarConfig> | null>(null);

  const mergedSettings = useMemo(() => {
    if (!previewConfig) return generalSettings;
    return {
      ...generalSettings,
      bottomBarSettings: {
        ...generalSettings?.bottomBarSettings,
        ...previewConfig,
      },
    };
  }, [generalSettings, previewConfig]);

  const value = {
    generalSettings: mergedSettings,
    setBottomBarPreviewConfig: setPreviewConfig,
  };

  return (
    <DynamicMenuContext.Provider value={value}>
      {children}
    </DynamicMenuContext.Provider>
  );
};

export const useDynamicMenu = (): { generalSettings: GeneralSettings | null } => {
  const context = useContext(DynamicMenuContext);
  if (context === undefined) {
    throw new Error('useDynamicMenu must be used within a DynamicMenuProvider');
  }
  return { generalSettings: context.generalSettings };
};

export const useDebugMenu = (): { setBottomBarPreviewConfig: (config: Partial<BottomBarConfig> | null) => void } => {
  const context = useContext(DynamicMenuContext);
  if (context === undefined) {
    throw new Error('useDebugMenu must be used within a DynamicMenuProvider');
  }
  return { setBottomBarPreviewConfig: context.setBottomBarPreviewConfig };
};
