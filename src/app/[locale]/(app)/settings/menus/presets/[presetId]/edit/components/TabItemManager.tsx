// src/app/[locale]/(app)/settings/menus/presets/[presetId]/edit/components/TabItemManager.tsx
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

interface TabItemManagerProps {
  tabIndex: number;
  namePrefix: string; // Ex: "bottomBarConfig.tabs.0.items"
}

type DraggableBottomBarItem = BottomBarItem & { dndId: string };

export const TabItemManager: React.FC<TabItemManagerProps> = ({ tabIndex, namePrefix }) => {
  const { control, getValues, setValue } = useFormContext();
  const { allCombinedItems } = useMenuData();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: namePrefix,
    keyName: 'dndId',
  });

  const availableItems = React.useMemo(() => {
    const currentItemIds = new Set(fields.map((f: any) => f.id));
    return allCombinedItems.filter((item: ConfiguredMenuItem) => item.canBeBottomBarItem && !currentItemIds.has(item.menuKey));
  }, [allCombinedItems, fields]);

  const handleAddItem = () => {
    if (!selectedItem) {
      toast({ title: "Nenhum item selecionado", description: "Por favor, escolha um item no menu para adicionar.", variant: "destructive" });
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
  
  const handleSortEnd = (newItems: DraggableBottomBarItem[]) => {
      const reordered = newItems.map((item, index) => ({...item, order: index}));
      setValue(namePrefix, reordered, { shouldDirty: true, shouldValidate: true });
  };
  
  const handleMove = (from: number, to: number) => {
      if (to < 0 || to >= fields.length) return;
      const currentItems = getValues(namePrefix);
      const reorderedItems = arrayMove(currentItems, from, to).map((item: any, index: number) => ({...item, order: index}));
      setValue(namePrefix, reorderedItems, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select onValueChange={setSelectedItem} value={selectedItem || ""}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um item para adicionar..." />
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
              <div className="p-2 text-sm text-muted-foreground">Nenhum item disponível para adicionar.</div>
            )}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleAddItem} disabled={!selectedItem}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground p-4">Nenhum item adicionado a esta aba.</p>
        ) : (
          <SortableList
            items={fields.map((f: any) => ({ ...f, id: f.id }))}
            onSortEnd={handleSortEnd}
            listContainerClassName="space-y-2"
            renderItem={(field: any, { attributes, listeners, isDragging }) => {
                const currentIndex = fields.findIndex((f: any) => f.id === field.id);
                return(
                    <div key={field.id} className={cn("flex items-center justify-between p-2 border rounded-md bg-muted/50", isDragging && "shadow-lg")}>
                        <div className="flex items-center gap-2">
                            <button type="button" {...attributes} {...listeners} className="cursor-grab p-1.5 touch-none">
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
