# Documentação da Página: Editor de Texto Padrão

Este documento detalha o funcionamento e a lógica da página de "Editor de Texto Padrão", localizada em `src/app/[locale]/(app)/settings/default-editor/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Editor de Texto Padrão** é uma configuração **exclusivamente do nível Master Global**. Seu objetivo é permitir que o administrador do sistema defina qual módulo de editor de texto rico (WYSIWYG) será utilizado como padrão em toda a aplicação. Além disso, ela serve como um painel central para gerenciar "presets" de conteúdo para cada contexto específico onde o editor é utilizado.

Isso centraliza a decisão tecnológica e garante uma experiência de edição consistente para todos os usuários em todas as instâncias.

## 2. Estrutura e Funcionalidades das Abas

A página é dividida em duas abas principais:

### a. Aba "Configuração"

Esta aba é focada na seleção do editor padrão.

-   **Acesso Restrito:** A página é funcional apenas no contexto Master Global. Se um administrador estiver "atuando como" uma instância, a página ficará em modo somente leitura.
-   **Permissão:** A edição é controlada pela permissão `master.settings.general.edit`.
-   **Listagem de Módulos:** O seletor de "Editor Padrão" é populado dinamicamente. Ele busca por todos os módulos que atendem a três critérios:
    1.  Estão registrados no sistema (existem no Firestore em `Global/master/config/modules_config/definitions`).
    2.  Estão com o status `ativo` (globalmente).
    3.  Possuem a flag `isRichTextEditor: true` em sua definição.
-   **Salvamento de Dados:** Ao salvar, a preferência (o ID do módulo selecionado) é salva em um documento de configuração específico no Firestore, localizado em `Global/master/config/editor_preferences`.

### b. Aba "Presets por Contexto"

Esta aba funciona como um painel de controle para todos os conteúdos pré-definidos dos editores.

-   **Manifesto de Contextos:** A lista exibida é baseada no arquivo-manifesto `src/lib/data/editor-contexts.ts`. Cada entrada neste arquivo representa um local na aplicação onde o `<SmartRichTextEditor />` é utilizado.
-   **Verificação de Status:** Para cada contexto listado, a página verifica no Firestore se um preset com aquele ID já foi criado e salvo.
-   **Feedback Visual:** Um ícone verde (`CheckCircle`) indica que um preset já existe para aquele contexto, enquanto um ícone cinza (`XCircle`) indica que ainda não foi criado.
-   **Ação Rápida:** Um botão "Criar/Editar Preset" ao lado de cada item leva o administrador diretamente para a página de configuração do editor de texto padrão, onde ele pode criar ou modificar o conteúdo para aquele contexto específico.

## 3. Padrões de Design e UI

-   **Layout:** A página utiliza o componente `<Card>` como contêiner principal, com um `<BackButton>` padronizado.
-   **Feedback ao Usuário:** A interface exibe alertas informativos caso o administrador não esteja no contexto correto, não tenha permissão, ou se nenhum módulo de editor estiver disponível para seleção.
-   **Abas (`<Tabs>`):** A organização em abas separa claramente a configuração principal do gerenciamento de presets.

---

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/settings/default-editor/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs,
  Timestamp, doc, setDoc, onSnapshot, getDoc,
} from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';
import { useParams } from 'next/navigation';

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
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { refs } from '@/lib/firestore-refs';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { editorContexts, type EditorContextDefinition } from '@/lib/data/editor-contexts';

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
    const [contextStatuses, setContextStatuses] = useState<ContextPresetStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!defaultEditorId) {
            setContextStatuses(editorContexts.map(ctx => ({ ...ctx, hasPreset: false })));
            setIsLoading(false);
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

            const statusPromises = editorContexts.map(async (ctx) => {
                const presetDocRef = doc(presetCollectionRef, ctx.id);
                const docSnap = await getDoc(presetDocRef);
                return { ...ctx, hasPreset: docSnap.exists() };
            });

            const results = await Promise.all(statusPromises);
            setContextStatuses(results);
            setIsLoading(false);
        };

        checkPresets();

    }, [defaultEditorId]);

    const getEditUrl = (editorId: string | null) => {
        if (!editorId) return '#';
        // A lógica do editor agora é uma página de módulo.
        return `/${locale}/modules/${editorId}`;
    };
    
    return (
        <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
                Esta lista mostra todos os locais na aplicação que usam o componente de editor de texto rico. Você pode criar um preset de conteúdo padrão para cada um.
            </p>
            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : !defaultEditorId ? (
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Editor Padrão Não Definido</AlertTitle>
                    <AlertBoxDescription>
                        É necessário selecionar e salvar um editor padrão na aba "Configuração" para gerenciar os presets.
                    </AlertBoxDescription>
                </Alert>
            ) : (
                <div className="space-y-4">
                    {contextStatuses.map(ctx => (
                        <div key={ctx.id} className="flex flex-col gap-3 justify-between p-4 border rounded-md">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">{ctx.name}</h4>
                                    <p className="text-sm text-muted-foreground">{ctx.description}</p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="ml-4 shrink-0">
                                    <Link href={getEditUrl(defaultEditorId)}>
                                        <Edit className="h-4 w-4 mr-2"/>
                                        {ctx.hasPreset ? 'Editar Preset' : 'Criar Preset'}
                                    </Link>
                                </Button>
                           </div>
                           <div className="space-y-2 pt-2 border-t border-dashed">
                               <p className="text-xs font-mono text-blue-600 dark:text-blue-400">ID do Contexto: {ctx.id}</p>
                                <div className="flex items-center gap-2">
                                     {ctx.hasPreset ? (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4"/>
                                            <span className="text-xs font-semibold">Preset Existe</span>
                                        </div>
                                    ) : (
                                         <div className="flex items-center gap-2 text-muted-foreground">
                                            <XCircle className="h-4 w-4"/>
                                            <span className="text-xs">Não Existe</span>
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
  const { toast } = useToast();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { allManagedModules, isLoading: isLoadingModules } = useDynamicMenu();
  const [activeTab, setActiveTab] = useState('config');

  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const form = useForm<EditorPreferencesFormData>({
    resolver: zodResolver(EditorPreferencesSchema),
    defaultValues: { defaultEditorModuleId: "", customized: false, },
  });
  
  const watchedEditorId = form.watch('defaultEditorModuleId');

  const canEditGlobalSettings = hasPermission('master.settings.general.edit');
  const pageEffectivelyDisabled = isLoadingPage || isLoadingPermissions || isSaving || !isActingAsMaster || !!actingAsInstanceId || !canEditGlobalSettings;

  const availableEditorModules = useMemo(() => {
    if (isLoadingModules) return [];
    return allManagedModules
      .filter(module => module.isRichTextEditor && module.status && module.isRegistered)
      .map(module => ({ id: module.id, name: module.name }));
  }, [allManagedModules, isLoadingModules]);

  useEffect(() => {
    setIsLoadingPage(true);
    const fetchCurrentSettings = async () => {
      try {
        const docRef = doc(db, "Global/master/config/editor_preferences");
        const settingsSnapshot = await getDoc(docRef);

        if (settingsSnapshot.exists()) {
          const currentData = settingsSnapshot.data() as EditorPreferencesFormData;
          form.reset({ defaultEditorModuleId: currentData.defaultEditorModuleId || "", customized: false });
        }
      } catch (error) {
        console.error("Error fetching default editor settings:", error);
        toast({ title: "Erro ao carregar dados", description: "Verifique o console para mais detalhes.", variant: "destructive" });
      } finally {
        setIsLoadingPage(false);
      }
    };

    if (!isLoadingPermissions && isActingAsMaster && !actingAsInstanceId) {
      fetchCurrentSettings();
    } else {
      setIsLoadingPage(false);
    }
  }, [form, toast, isActingAsMaster, actingAsInstanceId, isLoadingPermissions]);

  const onSubmit = async (data: EditorPreferencesFormData) => {
    if (pageEffectivelyDisabled) return;
    setIsSaving(true);
    const dataToSave: Omit<EditorPreferencesFormData, 'customized' | 'createdAt'> & { updatedAt: Timestamp } = { defaultEditorModuleId: data.defaultEditorModuleId, updatedAt: serverTimestamp() as Timestamp, };
    try {
      const docRef = doc(db, "Global/master/config/editor_preferences");
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: "Configuração Salva", description: "O editor de texto padrão do sistema foi atualizado." });
    } catch (error) {
      console.error("Error saving default editor preference:", error);
      toast({ title: "Erro ao Salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingPermissions || isLoadingPage || isLoadingModules;
  const params = useParams();
  const locale = params.locale as string || 'pt-BR';

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <div className="pt-2">
                <CardTitle className="section-title !border-none !pb-0">
                    <AudioLines className="section-title-icon"/>
                    Editor de Texto Padrão (Global)
                </CardTitle>
                <CardDescription>Gerencie o editor de texto rico padrão e seus presets contextuais.</CardDescription>
            </div>
            {isLoading ? <Skeleton className="h-20 w-full mt-4" /> : (
              (isActingAsMaster && actingAsInstanceId) ? (
                  <Alert variant="info" className="mt-4"><Globe className="h-4 w-4" /><AlertTitle>Contexto de Instância</AlertTitle><AlertBoxDescription>Esta é uma configuração global. Volte ao contexto Master para editar.</AlertBoxDescription></Alert>
              ) : !canEditGlobalSettings ? (
                  <Alert variant="destructive" className="mt-4"><ShieldCheck className="h-4 w-4" /><AlertTitle>Permissão Negada</AlertTitle><AlertBoxDescription>Você não tem permissão para editar esta configuração.</AlertBoxDescription></Alert>
              ) : null
            )}
          </CardHeader>
           <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="config">Configuração</TabsTrigger>
                    <TabsTrigger value="presets">Presets por Contexto</TabsTrigger>
                </TabsList>
                <TabsContent value="config">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                        <fieldset disabled={pageEffectivelyDisabled || availableEditorModules.length === 0}>
                            <CardContent className="space-y-6 pt-6">
                            {isLoading ? <Skeleton className="h-24 w-full" /> : (
                                 availableEditorModules.length === 0 ? (
                                    <Alert variant="warning" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Nenhum Editor Disponível</AlertTitle><AlertBoxDescription>Nenhum módulo de editor está ativo/importado. Vá para "Gerenciar Módulos" e verifique suas configurações.</AlertBoxDescription></Alert>
                                ) : (
                                <FormField
                                    control={form.control}
                                    name="defaultEditorModuleId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Editor Padrão</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um editor..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {availableEditorModules.map(module => (
                                            <SelectItem key={module.id} value={module.id}>{module.name} (ID: {module.id})</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormDescription>O editor selecionado será usado onde quer que um campo de texto rico seja necessário.</FormDescription>
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
                                <Save className="mr-2 h-4 w-4" />Salvar Preferência
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
```