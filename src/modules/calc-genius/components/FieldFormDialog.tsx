"use client";

import React, { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { useCalcGenius } from './CalcGeniusContext';
import { FieldFormData, getFieldFormSchema } from '../types';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';

const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '').substring(0, 50);

export const FieldFormDialog: React.FC = () => {
    const t = useTranslations('calcGenius.fieldForm');
    const commonT = useTranslations('common');
    const zodT = useTranslations('calcGenius.zod');

    const {
        showFieldDialog,
        closeFieldDialog,
        editingField,
        saveField,
        isSaving,
        groups,
        canManageFields,
        fields
    } = useCalcGenius();

    const FieldFormSchema = useMemo(() => getFieldFormSchema(zodT), [zodT]);
    const form = useForm<FieldFormData>({ 
        resolver: zodResolver(FieldFormSchema),
        shouldUnregister: true 
    });

    const watchedLabel = form.watch('label');
    const watchedGroupIds = form.watch('groupIds');

    const memoizedWatchedGroupIds = useMemo(() => watchedGroupIds || [], [watchedGroupIds]);

    useEffect(() => {
        if (!editingField && watchedLabel) {
            form.setValue('id', generateSlug(watchedLabel), { shouldValidate: true });
        }
    }, [watchedLabel, editingField, form]);

    useEffect(() => {
        if (showFieldDialog) {
            const defaultValues: FieldFormData = {
                id: '', label: '', description: '', data_type: 'number', origin_type: 'manual', 
                groupIds: [], mainGroupId: '', editable_by_user: false, 
                origin_config: { use_fixed_source: false }, order: (fields.length + 1) * 10
            };
            
            if (editingField) {
                const allGroupIds = new Set([...(editingField.groupIds || []), editingField.mainGroupId].filter(Boolean));
                form.reset({ ...editingField, groupIds: Array.from(allGroupIds) });
            } else {
                form.reset(defaultValues);
            }
        }
    }, [editingField, showFieldDialog, form, fields.length]);
    
    useEffect(() => {
        const currentMainGroupId = form.getValues('mainGroupId');
        if (memoizedWatchedGroupIds.length === 1 && currentMainGroupId !== memoizedWatchedGroupIds[0]) {
            form.setValue('mainGroupId', memoizedWatchedGroupIds[0]);
        } else if (memoizedWatchedGroupIds.length === 0 && currentMainGroupId) {
            form.setValue('mainGroupId', '');
        }
    }, [memoizedWatchedGroupIds, form]);


    const onSubmit = async (data: FieldFormData) => {
        const result = await saveField(data, editingField as any);
        if (result.success) {
            closeFieldDialog();
        } else if(result.error) {
            form.setError("id", { type: "manual", message: result.error });
        }
    };
    
    const groupOptions: MultiSelectOption[] = groups.map(g => ({ value: g.docId, label: g.label }));

    return (
        <Dialog open={showFieldDialog} onOpenChange={closeFieldDialog}>
            <DialogContent className="sm:max-w-2xl p-0">
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="field-form" className="flex flex-col h-full max-h-[90vh]">
                        <DialogHeader className="p-6 pb-4 shrink-0">
                            <DialogTitle>{editingField ? t('editTitle') : t('createTitle')}</DialogTitle>
                        </DialogHeader>

                        <ScrollArea className="flex-grow px-6">
                            <div className="space-y-4 py-4 pr-2">
                                <FormField control={form.control} name="label" render={({ field }) => ( <FormItem><FormLabel>{t('label.label')}</FormLabel><FormControl><Input placeholder={t('label.placeholder')} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="id" render={({ field }) => ( <FormItem><FormLabel>{t('id.label')}</FormLabel><FormControl><Input variant="slug" placeholder={t('id.placeholder')} {...field} disabled={!!editingField} /></FormControl><ShadFormDescription>{t('id.description')}</ShadFormDescription><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>{t('description.label')}</FormLabel><FormControl><Textarea placeholder={t('description.placeholder')} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="data_type" render={({ field }) => ( <FormItem><FormLabel>{t('dataType.label')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="number">{t('dataType.options.number')}</SelectItem><SelectItem value="string">{t('dataType.options.string')}</SelectItem><SelectItem value="boolean">{t('dataType.options.boolean')}</SelectItem><SelectItem value="date">{t('dataType.options.date')}</SelectItem></SelectContent></Select><FormMessage/></FormItem> )}/>
                                    <FormField control={form.control} name="origin_type" render={({ field }) => ( <FormItem><FormLabel>{t('originType.label')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="manual">{t('originType.options.manual')}</SelectItem><SelectItem value="fixed">{t('originType.options.fixed')}</SelectItem><SelectItem value="formula">{t('originType.options.formula')}</SelectItem><SelectItem value="linked">{t('originType.options.linked')}</SelectItem></SelectContent></Select><FormMessage/></FormItem> )}/>
                                </div>
                                <FormField control={form.control} name="groupIds" render={({ field }) => ( <FormItem><FormLabel>{t('groups.label')}</FormLabel><FormControl><MultiSelect options={groupOptions} selected={field.value || []} onChange={field.onChange} placeholder={t('groups.placeholder')}/></FormControl></FormItem> )}/>
                                {memoizedWatchedGroupIds.length > 1 && ( <FormField control={form.control} name="mainGroupId" render={({ field }) => ( <FormItem><FormLabel>{t('mainGroup.label')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('mainGroup.placeholder')}/></SelectTrigger></FormControl><SelectContent>{groups.filter(g => memoizedWatchedGroupIds.includes(g.docId)).map(g => <SelectItem key={g.docId} value={g.docId}>{g.label}</SelectItem>)}</SelectContent></Select><ShadFormDescription>{t('mainGroup.description')}</ShadFormDescription><FormMessage/></FormItem> )}/> )}
                                <FormField control={form.control} name="editable_by_user" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6"><div className="space-y-0.5"><FormLabel>{t('editableByUser.label')}</FormLabel><ShadFormDescription>{t('editableByUser.description')}</ShadFormDescription></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                            </div>
                        </ScrollArea>
                        
                        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 p-6 pt-4 border-t shrink-0">
                            <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto" disabled={isSaving}>{commonT('cancel')}</Button></DialogClose>
                            <Button type="submit" form="field-form" disabled={isSaving || !canManageFields} className="w-full sm:w-auto">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                                {commonT('save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
};
