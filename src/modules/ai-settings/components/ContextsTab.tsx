'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { onSnapshot, setDoc, serverTimestamp, query } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import type { AIAssistant, AIContext } from '@/modules/ai-settings/types';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const NO_ASSISTANT_VALUE = "_NONE_";

type ContextsFormData = Record<string, string | undefined>;

export function ContextsTab() {
    const t = useTranslations('aiSettings.contextsTab');
    const { toast } = useToast();
    const { hasPermission } = useUserPermissions();
    
    const [assistants, setAssistants] = useState<AIAssistant[]>([]);
    const [contexts, setContexts] = useState<AIContext[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const canManage = hasPermission('master.ia_integrations.manage');

    const dynamicSchema = useMemo(() => {
        const shape: { [key: string]: z.ZodOptional<z.ZodString> } = {};
        contexts.forEach(ctx => {
            shape[ctx.id] = z.string().optional();
        });
        return z.object(shape);
    }, [contexts]);

    const categorizedContexts = useMemo(() => {
        return contexts.reduce((acc, ctx) => {
            const category = ctx.category || t('defaultCategory');
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(ctx);
            return acc;
        }, {} as Record<string, AIContext[]>);
    }, [contexts, t]);

    const form = useForm<ContextsFormData>({
        resolver: zodResolver(dynamicSchema),
        defaultValues: {},
    });

    useEffect(() => {
        setIsLoading(true);

        const unsubAssistants = onSnapshot(query(refs.master.aiAssistants()), (snapshot) => {
            setAssistants(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AIAssistant)));
        }, (error) => {
            console.error("Error fetching AI assistants:", error);
            toast({ title: t('toasts.loadingError'), variant: "destructive" });
        });

        const unsubContexts = onSnapshot(query(refs.master.aiContexts()), (snapshot) => {
            setContexts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AIContext)));
        }, (error) => {
            console.error("Error fetching AI contexts:", error);
            toast({ title: t('toasts.loadingError'), variant: "destructive" });
        });

        const unsubAssignments = onSnapshot(refs.master.aiContextAssignmentsDoc(), (docSnap) => {
            if (docSnap.exists()) {
                form.reset(docSnap.data().assignments || {});
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching AI context assignments:", error);
            toast({ title: t('toasts.loadingError'), variant: "destructive" });
            setIsLoading(false);
        });

        return () => {
            unsubAssistants();
            unsubContexts();
            unsubAssignments();
        };
    }, [form, toast, t]);

    const onSubmit = async (data: ContextsFormData) => {
        if (!canManage) return;
        
        setIsSaving(true);
        try {
            await setDoc(refs.master.aiContextAssignmentsDoc(), {
                assignments: data,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDescription') });
            form.reset(data, { keepValues: true, keepDirty: false });
        } catch (error: any) {
            toast({ title: t('toasts.saveErrorTitle'), description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(categorizedContexts).map(([category, contextItems]) => (
                                    <div key={category}>
                                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">{category}</h3>
                                        <div className="space-y-6">
                                            {contextItems.map(context => (
                                                <FormField
                                                    key={context.id}
                                                    control={form.control}
                                                    name={context.id}
                                                    render={({ field }) => (
                                                        <FormItem className="p-4 border rounded-lg bg-muted/20">
                                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <FormLabel className="font-semibold flex items-center">{context.name}</FormLabel>
                                                                    <FormDescription className="mt-1">{context.description}</FormDescription>
                                                                </div>
                                                                <div className="w-full md:w-auto md:min-w-[250px]">
                                                                     <Select onValueChange={field.onChange} value={field.value || NO_ASSISTANT_VALUE} disabled={!canManage}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder={t('selectPlaceholder')}/></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value={NO_ASSISTANT_VALUE}>{t('noAssistantOption')}</SelectItem>
                                                                            {assistants.map(assistant => (
                                                                                <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <div className="flex w-full justify-end">
                            <Button type="submit" disabled={isSaving || isLoading || !form.formState.isDirty || !canManage}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                {isSaving ? t('savingButton') : t('saveButton')}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </form>
        </FormProvider>
    );
}
