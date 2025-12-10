// src/components/shared/form/SocialLinksInput.tsx
"use client";

import React from 'react';
import { useFieldArray, useFormContext, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, GripVertical, Star } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useTranslations } from 'next-intl';

// Tipos e Esquemas
import { z } from "zod";

const socialValues = ["instagram", "facebook", "youtube", "linkedin", "tiktok", "other"] as const;

export const SocialLinkSchema = z.object({
  type: z.enum(socialValues),
  url: z.string().url({ message: "URL inválida." }).min(1, "URL é obrigatória."),
  label: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const socialOptions = [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "tiktok", label: "TikTok" },
    { value: "other", label: "Outro" },
];

const SortableItem = ({ id, index, field, remove, disabled, primaryIndex, setPrimary }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const { control } = useFormContext();

    const isPrimary = primaryIndex === index;

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 border rounded-md bg-background">
            <div {...attributes} {...listeners} className="cursor-grab touch-none py-4">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-grow space-y-2">
                <div className="flex gap-2">
                     <Controller
                        control={control}
                        name={`socialLinks.${index}.type`}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                <SelectContent>
                                    {socialOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    <Controller
                        control={control}
                        name={`socialLinks.${index}.url`}
                        render={({ field }) => (
                            <Input {...field} placeholder="https://..." className="flex-grow" disabled={disabled} />
                        )}
                    />
                </div>
                {field.type === 'other' && (
                     <Controller
                        control={control}
                        name={`socialLinks.${index}.label`}
                        render={({ field }) => (
                            <Input {...field} placeholder="Rótulo (ex: Blog, Site)" disabled={disabled} />
                        )}
                    />
                )}
            </div>
            <Button type="button" variant={isPrimary ? "default" : "outline"} size="icon" onClick={() => setPrimary(index)} disabled={disabled} className="shrink-0 mt-1">
                 <Star className={`h-4 w-4 ${isPrimary ? 'fill-current' : ''}`} />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={disabled} className="shrink-0 text-destructive mt-1">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

interface SocialLinksInputProps {
    value?: any[];
    onChange: (value: any[]) => void;
    disabled?: boolean;
    name: string; // Adicionado 'name' para ser usado com useFieldArray
}

export const SocialLinksInput = ({ value, onChange, disabled, name }: SocialLinksInputProps) => {
    const t = useTranslations('generalSettings');
    const { control, getValues } = useFormContext<any>();
    const { fields, append, remove, move } = useFieldArray({ control, name });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex(f => f.id === active.id);
            const newIndex = fields.findIndex(f => f.id === over!.id);
            move(oldIndex, newIndex);
        }
    };
    
    const primaryIndex = fields.findIndex(field => (field as any).isPrimary);

    const setPrimary = (clickedIndex: number) => {
        const currentFields: any[] = getValues("socialLinks");
        const updatedFields = currentFields.map((field: any, index: number) => ({
            ...field,
            isPrimary: index === clickedIndex
        }));
        onChange(updatedFields);
    };
    
    React.useEffect(() => {
        if (primaryIndex === -1 && fields.length > 0) {
           setPrimary(0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields.length, primaryIndex]);

    return (
        <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <SortableItem 
                                key={field.id} 
                                id={field.id} 
                                index={index} 
                                field={field}
                                remove={remove} 
                                disabled={disabled} 
                                primaryIndex={primaryIndex}
                                setPrimary={setPrimary}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ type: "other", url: "", label: "", isPrimary: fields.length === 0 })}
                disabled={disabled}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('socialSection.addLinkButton')}
            </Button>
        </div>
    );
};
