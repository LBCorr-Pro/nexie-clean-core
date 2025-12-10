// src/app/[locale]/(app)/settings/menus/structure/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useMenuData, type ConfiguredMenuItem } from '@/hooks/use-menu-data';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, GripVertical, Save, ArrowLeft, Settings, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { useRouter, useParams } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";

const MenuItemSchema = z.object({
  menuKey: z.string(),
  displayName: z.string(),
  order: z.number(),
  level: z.number(),
  originalIcon: z.string(),
  customized: z.boolean().optional(),
});

const MenuSettingsSchema = z.object({
  menuStructure: z.array(MenuItemSchema),
  createdAt: z.any().optional(),
  customized: z.boolean().optional(),
});

type MenuSettingsFormData = z.infer<typeof MenuSettingsSchema>;

const SortableMenuItem = ({ item, isFirst, isLast, onMove }: { item: any, isFirst: boolean, isLast: boolean, onMove: (from: number, to: number) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.menuKey });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 p-2 border rounded-md", isDragging && "opacity-75 shadow-lg", `ml-${item.level * 4}`)}>
            <button {...attributes} {...listeners} className="cursor-grab p-1.5"><GripVertical className="h-5 w-5" /></button>
            <Icon name={item.originalIcon} className="h-5 w-5" />
            <span>{item.displayName}</span>
        </div>
    );
};

export default function MenuStructurePage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const { finalGroups, ungroupedTopLevelItems, isLoading: isLoadingMenu } = useMenuData();
    const [isSaving, setIsSaving] = useState(false);
    
    const flattenedMenu = useMemo(() => {
        const result: ConfiguredMenuItem[] = [];
        const traverse = (items: ConfiguredMenuItem[]) => {
            items.forEach(item => {
                result.push(item);
                if(item.subItems) traverse(item.subItems);
            });
        };
        finalGroups.forEach(group => traverse(group.items));
        traverse(ungroupedTopLevelItems);
        return result.sort((a,b) => (a.order || 0) - (b.order || 0));
    }, [finalGroups, ungroupedTopLevelItems]);

    const [menuItems, setMenuItems] = useState(flattenedMenu);

    useEffect(() => {
        setMenuItems(flattenedMenu);
    }, [flattenedMenu]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setMenuItems((items) => {
                const oldIndex = items.findIndex((item) => item.menuKey === active.id);
                const newIndex = items.findIndex((item) => item.menuKey === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        // Logic to save the new order to Firestore
        // This will likely involve updating the `order` field of each item config.
        console.log("Saving new order for", menuItems.map(m => ({key: m.menuKey, order: m.order})));
        await new Promise(res => setTimeout(res, 1000));
        toast({ title: "Ordem do Menu Salva!" });
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-primary"/>Estrutura e Ordem do Menu</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/settings/menus`)}>
                        <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar para Menus
                    </Button>
                </div>
                <CardDescription>Arraste e solte para reordenar os itens do menu lateral.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="info" className="mb-4">
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Em Desenvolvimento</AlertTitle>
                    <AlertBoxDescription>
                        Esta página é um trabalho em progresso para a ordenação visual. A lógica para salvar a ordem ainda está sendo implementada. As alterações aqui não serão persistidas.
                    </AlertBoxDescription>
                </Alert>
                {isLoadingMenu ? <Skeleton className="h-40 w-full" /> : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={menuItems.map(item => item.menuKey)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                        {menuItems.map((item, index) => (
                           <SortableMenuItem key={item.menuKey} item={item} isFirst={index === 0} isLast={index === menuItems.length - 1} onMove={()=>{}}/>
                        ))}
                        </div>
                    </SortableContext>
                </DndContext>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveOrder} disabled={isLoadingMenu || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Ordem
                </Button>
            </CardFooter>
        </Card>
    );
}
