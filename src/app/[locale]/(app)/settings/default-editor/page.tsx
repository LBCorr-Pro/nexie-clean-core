// src/app/[locale]/(app)/settings/default-editor/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import {
  Timestamp, doc, setDoc, onSnapshot, getDoc, serverTimestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, AlertTriangle, Edit, AudioLines, ShieldCheck, Globe, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuData } from '@/hooks/use-menu-data'; // NOVO HOOK
import { refs } from '@/lib/firestore-refs';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { editorContexts, type EditorContextDefinition } from '@/lib/data/editor-contexts';
import { AccessDenied } from '@/components/ui/access-denied';

const EDITOR_PREFERENCES_CONTAINER_DOC_PATH = "master/config/editor_preferences/default";

const EditorPreferencesSchema = z.object({
  defaultEditorModuleId: z.string().min(1, "É necessário selecionar um editor padrão."),
  customized: z.boolean().optional(),
  createdAt: z.instanceof(Timestamp).optional(),
});

type EditorPreferencesFormData = z.infer<typeof EditorPreferencesSchema>;

interface EditorModuleChoice {
  id: string;
  name: string;
}

interface ContextPresetStatus extends EditorContextDefinition {
  hasPreset: boolean;
}

const ContextPresetsTab = ({ defaultEditorId, locale }: { defaultEditorId: string | null; locale: string; }) => {
    const t = useTranslations('defaultEditor.presetsTab');
    const [fetchedStatuses, setFetchedStatuses] = useState<ContextPresetStatus[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!defaultEditorId) {
            setFetchedStatuses(null);
            return;
        }

        const checkPresets = async () => {
            setIsLoading(true);
            
            let presetCollectionRef;
            if (defaultEditorId === 'lexical-editor') {
                presetCollectionRef = refs.master.lexicalEditorPresets();
            } else if (defaultEditorId === 'tiptap-editor') {
                presetCollectionRef = refs.master.tiptapEditorPresets();
            } else {
                setIsLoading(false);
                return;
            }

            try {
                const statusPromises = editorContexts.map(async (ctx) => {
                    const presetDocRef = doc(presetCollectionRef, ctx.id);
                    const docSnap = await getDoc(presetDocRef);
                    return { ...ctx, hasPreset: docSnap.exists() };
                });
                const results = await Promise.all(statusPromises);
                setFetchedStatuses(results);
            } catch (error) {
                console.error("Error checking presets:", error);
                setFetchedStatuses([]);
            } finally {
                setIsLoading(false);
            }
        };

        checkPresets();

    }, [defaultEditorId]);

    const contextStatuses = useMemo(() => {
        if (!defaultEditorId) {
            return editorContexts.map(ctx => ({ ...ctx, hasPreset: false }));
        }
        return fetchedStatuses;
    }, [defaultEditorId, fetchedStatuses]);

    const getEditUrl = (editorId: string | null) => {
        if (!editorId) return '#';
        // A lógica do editor agora é uma página de módulo.
        return `/${locale}/modules/${editorId}`;
    };
    
    const showLoading = isLoading || (defaultEditorId && !fetchedStatuses);

    return (
        <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">{t('description')}</p>
            {showLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : !defaultEditorId ? (
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>{t('noEditorSelectedTitle')}</AlertTitle>
                    <AlertBoxDescription>{t('noEditorSelectedDesc')}</AlertBoxDescription>
                </Alert>
            ) : (
                <div className="space-y-4">
                    {contextStatuses && contextStatuses.map(ctx => (
                        <div key={ctx.id} className="flex flex-col gap-3 justify-between p-4 border rounded-md">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">{ctx.name}</h4>
                                    <p className="text-sm text-muted-foreground">{ctx.description}</p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="ml-4 shrink-0">
                                    <Link href={getEditUrl(defaultEditorId)}>
                                        <Edit className="h-4 w-4 mr-2"/>
                                        {ctx.hasPreset ? t('editButton') : t('createButton')}
                                    </Link>
                                </Button>
                           </div>
                           <div className="space-y-2 pt-2 border-t border-dashed">
                               <p className="text-xs font-mono text-blue-600 dark:text-blue-400">{t('contextIdLabel')}: {ctx.id}</p>
                                <div className="flex items-center gap-2">
                                     {ctx.hasPreset ? (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4"/>
                                            <span className="text-xs font-semibold">{t('presetExists')}</span>
                                        </div>
                                    ) : (
                                         <div className="flex items-center gap-2 text-muted-foreground">
                                            <XCircle className="h-4 w-4"/>
                                            <span className="text-xs">{t('presetMissing')}</span>
                                        </div>
                                    )}
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default function DefaultEditorSettingsPage() {
  const t = useTranslations('defaultEditor');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  // CORREÇÃO: Usa o novo hook de dados de menu
  const { allManagedModules, isLoading: isLoadingModules, defaultEditorModuleId: initialEditorId } = useMenuData();
  const [activeTab, setActiveTab] = useState('config');

  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const form = useForm<EditorPreferencesFormData>({
    resolver: zodResolver(EditorPreferencesSchema.refine(data => data.defaultEditorModuleId !== "", {
        message: t('form.defaultEditorRequired'),
        path: ["defaultEditorModuleId"],
    })),
    defaultValues: { defaultEditorModuleId: "", customized: false, },
  });
  
  useEffect(() => {
    if (!isLoadingModules && initialEditorId !== undefined) {
      form.reset({ defaultEditorModuleId: initialEditorId || "", customized: false });
      setIsLoadingPage(false);
    }
  }, [initialEditorId, isLoadingModules, form]);

  const watchedEditorId = form.watch('defaultEditorModuleId');
  const canEditGlobalSettings = hasPermission('master.settings.general.edit');
  const pageEffectivelyDisabled = isLoadingPage || isLoadingPermissions || isSaving || !isActingAsMaster || !!actingAsInstanceId || !canEditGlobalSettings;

  const availableEditorModules = useMemo(() => {
    if (isLoadingModules || !allManagedModules) return [];
    return allManagedModules
      .filter(module => module.isRichTextEditor && module.status && module.isRegistered)
      .map(module => ({ id: module.id, name: module.name }));
  }, [allManagedModules, isLoadingModules]);

  const onSubmit = async (data: EditorPreferencesFormData) => {
    if (pageEffectivelyDisabled) return;
    setIsSaving(true);
    const dataToSave: Omit<EditorPreferencesFormData, 'customized' | 'createdAt'> & { updatedAt: Timestamp } = { defaultEditorModuleId: data.defaultEditorModuleId, updatedAt: serverTimestamp() as Timestamp, };
    try {
      const docRef = refs.master.editorPreferencesDoc();
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: t('toasts.saveSuccessTitle'), description: t('toasts.saveSuccessDesc') });
    } catch (error) {
      console.error("Error saving default editor preference:", error);
      toast({ title: t('toasts.saveErrorTitle'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingPermissions || isLoadingPage || isLoadingModules;
  const params = useParams();
  const locale = params.locale as string || 'pt-BR';

  if (isLoading) {
    return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!canEditGlobalSettings) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <div className="pt-2">
                <CardTitle className="section-title !border-none !pb-0">
                    <AudioLines className="section-title-icon"/>
                    {t('pageTitle')}
                </CardTitle>
                <CardDescription>{t('pageDescription')}</CardDescription>
            </div>
            {isLoading ? <Skeleton className="h-20 w-full mt-4" /> : (
              (isActingAsMaster && actingAsInstanceId) ? (
                  <Alert variant="info" className="mt-4"><Globe className="h-4 w-4" /><AlertTitle>{t('alerts.instanceContextTitle')}</AlertTitle><AlertBoxDescription>{t('alerts.instanceContextDesc')}</AlertBoxDescription></Alert>
              ) : !canEditGlobalSettings ? (
                  <Alert variant="destructive" className="mt-4"><ShieldCheck className="h-4 w-4" /><AlertTitle>{t('alerts.permissionDeniedTitle')}</AlertTitle><AlertBoxDescription>{t('alerts.permissionDeniedDesc')}</AlertBoxDescription></Alert>
              ) : null
            )}
          </CardHeader>
           <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="config">{t('tabs.config')}</TabsTrigger>
                    <TabsTrigger value="presets">{t('tabs.presets')}</TabsTrigger>
                </TabsList>
                <TabsContent value="config">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                        <fieldset disabled={pageEffectivelyDisabled || availableEditorModules.length === 0}>
                            <CardContent className="space-y-6 pt-6">
                            {isLoading ? <Skeleton className="h-24 w-full" /> : (
                                 availableEditorModules.length === 0 ? (
                                    <Alert variant="warning" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('alerts.noEditorTitle')}</AlertTitle><AlertBoxDescription>{t('alerts.noEditorDesc')}</AlertBoxDescription></Alert>
                                ) : (
                                <FormField
                                    control={form.control}
                                    name="defaultEditorModuleId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.defaultEditorLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder={t('form.selectPlaceholder')} /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {availableEditorModules.map(module => (
                                            <SelectItem key={module.id} value={module.id}>{module.name} (ID: {module.id})</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormDescription>{t('form.defaultEditorDesc')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />)
                            )}
                            </CardContent>
                            <CardFooter className="border-t pt-6">
                            <div className="flex w-full justify-end">
                                <Button type="submit" disabled={pageEffectivelyDisabled || availableEditorModules.length === 0 || !form.formState.isDirty}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />{t('form.saveButton')}
                                </Button>
                            </div>
                            </CardFooter>
                        </fieldset>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="presets">
                    <ContextPresetsTab defaultEditorId={watchedEditorId} locale={locale} />
                </TabsContent>
            </Tabs>
           </CardContent>
        </Card>
    </div>
  );
}
