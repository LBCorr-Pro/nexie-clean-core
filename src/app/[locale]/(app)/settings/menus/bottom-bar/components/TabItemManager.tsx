// src/app/[locale]/(app)/settings/menus/bottom-bar/components/TabItemManager.tsx
"use client";

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useMenuData, type ConfiguredMenuItem } from '@/hooks/use-menu-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/nx-use-toast';
import { SortableList } from '@/components/shared/dnd/SortableList';
import { OrderControls } from '@/components/shared/form/OrderControls';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import type { BottomBarItem } from '@/lib/types/menus';
import { useTranslations } from 'next-intl';

interface TabItemManagerProps {
  tabIndex: number;
  namePrefix: string; // Ex: "bottomBarConfig.tabs.0.items"
}

export const TabItemManager: React.FC<TabItemManagerProps> = ({ tabIndex, namePrefix }) => {
  const t = useTranslations('menus.bottomBar.itemManager');
  const { control, getValues, setValue } = useFormContext();
  const { allCombinedItems } = useMenuData();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: namePrefix,
    keyName: 'rhfId', // Use a key that doesn't conflict with the data's 'id' field
  });

  const availableItems = React.useMemo(() => {
    const currentItemIds = new Set(fields.map((f: any) => f.id));
    return allCombinedItems.filter((item: ConfiguredMenuItem) => item.canBeBottomBarItem && !currentItemIds.has(item.menuKey));
  }, [allCombinedItems, fields]);

  const handleAddItem = () => {
    if (!selectedItem) {
      toast({ title: t('noItemSelected'), description: t('selectItemDescription'), variant: "destructive" });
      return;
    }
    const itemToAdd = allCombinedItems.find((item: ConfiguredMenuItem) => item.menuKey === selectedItem);
    if (itemToAdd) {
      append({
        id: itemToAdd.menuKey,
        label: itemToAdd.displayName,
        icon: itemToAdd.originalIcon,
        href: itemToAdd.originalHref,
        order: fields.length,
      });
      setSelectedItem(null);
    }
  };
  
  const handleSortEnd = (sortedItems: any[]) => {
      const newFormValues = sortedItems.map((item, index) => {
          const { id, rhfId, dataId, ...rest } = item;
          return {
            ...rest,
            id: dataId, // Restore the original data ID
            order: index,
          };
      });
      setValue(namePrefix, newFormValues, { shouldDirty: true });
  };
  
  const handleMove = (from: number, to: number) => {
      if (to < 0 || to >= fields.length) return;
      const currentItems = getValues(namePrefix) as BottomBarItem[];
      const reorderedItems = arrayMove(currentItems, from, to).map((item: BottomBarItem, index: number) => ({...item, order: index}));
      setValue(namePrefix, reorderedItems, { shouldDirty: true, shouldValidate: true });
  };

  const mappedItemsForSortableList = React.useMemo(() => {
    return fields.map(field => {
      const f = field as any;
      return {
        ...f,
        id: f.rhfId,     // Pass RHF's unique ID to the dnd component
        dataId: f.id,    // Keep the original data ID separately
      };
    });
  }, [fields]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Select onValueChange={setSelectedItem} value={selectedItem || ""}>
          <SelectTrigger className="w-full sm:flex-1">
            <SelectValue placeholder={t('selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {availableItems.length > 0 ? (
              availableItems.map((item: ConfiguredMenuItem) => (
                <SelectItem key={item.menuKey} value={item.menuKey}>
                  <div className="flex items-center gap-2">
                    <Icon name={item.originalIcon} className="h-4 w-4" />
                    <span>{item.displayName}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">{t('noItemsAvailable')}</div>
            )}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleAddItem} disabled={!selectedItem} className="w-full sm:w-auto shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" /> {t('addButton')}
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">{t('noItemsAdded')}</p>
        ) : (
          <SortableList
            items={mappedItemsForSortableList}
            onSortEnd={handleSortEnd}
            listContainerClassName="space-y-2"
            renderItem={(item: any, { attributes, listeners, isDragging }) => {
                const currentIndex = fields.findIndex((f: any) => f.rhfId === item.id);
                if (currentIndex === -1) return null;
                const field = fields[currentIndex] as any;

                return(
                    <div key={item.id} className={cn("flex items-center justify-between p-2 border rounded-md bg-muted/50", isDragging && "shadow-lg")}>
                        <div className="flex items-center gap-2">
                            <button type="button" {...attributes} {...listeners} className="drag-handle cursor-grab p-1.5 touch-none sm:touch-auto">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <Icon name={field.icon} className="h-5 w-5" />
                            <span>{field.label}</span>
                        </div>
                         <div className="flex items-center gap-0.5">
                            <OrderControls
                                onMoveUp={() => handleMove(currentIndex, currentIndex - 1)}
                                onMoveDown={() => handleMove(currentIndex, currentIndex + 1)}
                                isFirst={currentIndex === 0}
                                isLast={currentIndex === fields.length - 1}
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(currentIndex)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
            }}
          />
        )}
      </div>
    </div>
  );
};
