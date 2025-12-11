# Documentação da Página: Módulo de Editor TipTap

Este documento detalha o funcionamento e a lógica da página de "Módulo de Editor (TipTap)", localizada em `src/modules/tiptap-editor/page.tsx`.

---

## 1. Visão Geral e Propósito

A página do **Módulo de Editor TipTap** serve como uma vitrine e área de configuração para o editor de texto rico baseado na biblioteca TipTap. Seus principais objetivos são:

1.  **Configuração da Barra de Ferramentas:** Permite que o administrador personalize a barra de ferramentas, ativando ou desativando funcionalidades e reordenando-as com drag-and-drop.
2.  **Gerenciamento de Presets:** Oferece uma interface para salvar a configuração atual como um "preset" reutilizável, carregar presets existentes, sobrescrevê-los ou excluí-los.
3.  **Demonstração e Teste:** Fornece uma instância funcional do editor para que as configurações possam ser testadas em tempo real.

## 2. Lógica de Funcionamento

### a. Gerenciamento de Configuração
-   **Fonte de Dados:** As configurações da barra de ferramentas são salvas no Firestore, em `Global/master/config/modules/tiptap-editor/default_toolbar_config`.
-   **Carregamento:** Ao carregar, a página busca a configuração salva. Se não existir, usa as opções padrão.
-   **Salvamento:** Ao clicar em "Salvar Configuração Padrão", o estado atual das ferramentas é persistido no Firestore.

### b. Gerenciamento de Presets
-   **Fonte de Dados:** Os presets são salvos em `Global/master/config/modules/tiptap-editor/presets`.
-   **Ações:** Através de um menu de contexto ("3 pontinhos"), o usuário pode carregar, sobrescrever ou excluir presets.
-   **Confirmação:** Ações de sobrescrever e excluir exigem confirmação para evitar perdas acidentais de dados.

### c. Editor de Preview Dinâmico
-   O componente `TiptapEditor` é renderizado abaixo da seção de configuração.
-   Sua barra de ferramentas (`Toolbar.tsx`) recebe a lista de opções ativas e renderiza dinamicamente apenas os botões correspondentes, fornecendo um feedback visual imediato das alterações.

## 3. Código-Fonte da Página

```tsx
// src/modules/tiptap-editor/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BackButton } from '@/components/ui/back-button';
import { PilcrowSquare, Info, Loader2, Save, Wand2, GripVertical, PlusCircle, Trash2, ChevronDown, MoreVertical } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { defaultTiptapOptions, type EditorOption } from './components/editor-options';
import TiptapEditor from './components/TiptapEditor';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { refs } from '@/lib/firestore-refs';
import { SortableList } from '@/components/shared/dnd/SortableList';
import { OrderControls } from '@/components/shared/form/OrderControls';
import { arrayMove } from '@dnd-kit/sortable';
import { Icon } from '@/components/ui/icon';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { FormProvider, useForm } from 'react-hook-form';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { dequal } from 'dequal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface Preset {
  id: string;
  name: string;
  settings: {
    toolbar: EditorOption[];
  };
}

export default function TiptapEditorPage() {
  const [content, setContent] = React.useState(`
    <h2>
      Olá! Este é o Editor TipTap.
    </h2>
    <p>
      Este é um editor de texto rico <strong>(WYSIWYG)</strong> moderno e extensível, construído sobre o Prosemirror.
    </p>
    <ul>
      <li><p>Fácil de usar e configurar.</p></li>
      <li><p>Suporta listas, títulos, links e muito mais.</p></li>
      <li><p>Ative/desative funcionalidades na barra de ferramentas.</p></li>
    </ul>
    <p>
      Sinta-se à vontade para testar as funcionalidades e explorar o que ele pode fazer!
    </p>
  `);
  
  const [options, setOptions] = useState<EditorOption[]>([]);
  const [displayOptions, setDisplayOptions] = useState<EditorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false);
  const [dynamicPresets, setDynamicPresets] = useState<Preset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);
  const [presetToOverwrite, setPresetToOverwrite] = useState<string | null>(null);
  
  const { toast } = useToast();

  const toolbarConfigDocRef = useMemo(() => {
    return doc(refs.master.tiptapEditorModuleCollection(), 'default_toolbar_config');
  }, []);
  
  const presetsDocRef = useMemo(() => {
    return doc(refs.master.tiptapEditorModuleCollection(), 'presets');
  }, []);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const docSnap = await getDoc(toolbarConfigDocRef);
      if (docSnap.exists()) {
        const savedOptions = docSnap.data().toolbar as EditorOption[];
        const mergedOptions = defaultTiptapOptions.map(defaultOpt => {
          const savedOpt = savedOptions.find(opt => opt.key === defaultOpt.key);
          return savedOpt ? { ...defaultOpt, active: savedOpt.active } : defaultOpt;
        });
        setOptions(mergedOptions);
      } else {
        setOptions(defaultTiptapOptions);
      }
    } catch (error) {
      console.error("Failed to fetch Tiptap config:", error);
      toast({ title: "Erro ao Carregar Configuração", description: "Usando configurações padrão.", variant: "destructive" });
      setOptions(defaultTiptapOptions);
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, [toolbarConfigDocRef, toast]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(presetsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const presetsMap = docSnap.data().presets || {};
        const fetchedPresets = Object.keys(presetsMap).map(key => ({ id: key, name: key, settings: presetsMap[key] }));
        setDynamicPresets(fetchedPresets as Preset[]);
      } else {
        setDynamicPresets([]);
      }
      setIsLoadingPresets(false);
    }, (error) => {
      console.error("Error fetching Tiptap presets:", error);
      toast({title: "Erro", description: "Não foi possível carregar os presets.", variant: "destructive"});
      setIsLoadingPresets(false);
    });
    return () => unsubscribe();
  }, [presetsDocRef, toast]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  
  useEffect(() => {
    if (!isLoading) {
        setDisplayOptions(prev => dequal(prev, options) ? prev : [...options]);
    }
  }, [options, isLoading]);

  const handleOptionToggle = (key: string, checked: boolean) => {
    setDisplayOptions(prevOptions => prevOptions.map(opt => (opt.key === key ? { ...opt, active: checked } : opt)));
    setHasUnsavedChanges(true);
  };
  
  const handleSortEnd = (newItems: any[]) => {
    setDisplayOptions(newItems as EditorOption[]);
    setHasUnsavedChanges(true);
  };
  
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= displayOptions.length) return;
    
    setDisplayOptions(prev => {
        const newItems = arrayMove(prev, currentIndex, newIndex);
        return newItems;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddSeparator = () => {
    const newSeparator: EditorOption = { key: `separator_${Date.now()}`, label: 'Separador', icon: 'Minus', active: true };
    setDisplayOptions(prev => [...prev, newSeparator]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveOption = (key: string) => {
    setDisplayOptions(prev => prev.filter(opt => opt.key !== key));
    setHasUnsavedChanges(true);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(toolbarConfigDocRef, { toolbar: displayOptions, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Configuração Padrão Salva!", description: "A barra de ferramentas do Tiptap foi atualizada." });
      setHasUnsavedChanges(false);
      setOptions(displayOptions);
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const executeSavePreset = async (presetName: string) => {
    setIsSaving(true);
    try {
        await setDoc(presetsDocRef, { presets: { [presetName]: { toolbar: displayOptions } } }, { merge: true });
        toast({ title: "Preset Salvo!", description: `O preset "${presetName}" foi salvo com sucesso.` });
        return true;
    } catch (error: any) {
        console.error("Error saving preset:", error);
        toast({ title: "Erro ao Salvar Preset", description: error.message, variant: "destructive" });
        return false;
    } finally {
        setIsSaving(false);
        setIsSavePresetDialogOpen(false);
        setPresetToOverwrite(null);
    }
  };

  const handleSavePreset = async (presetName: string) => {
    if (!presetName.trim()) {
        toast({ title: "Nome Inválido", description: "Por favor, insira um nome para o preset.", variant: "destructive" });
        return;
    }

    const isExisting = dynamicPresets.some(p => p.name.toLowerCase() === presetName.toLowerCase());
    
    if (isExisting && presetToOverwrite !== presetName) { // Evita re-confirmar
        setPresetToOverwrite(presetName);
    } else {
        await executeSavePreset(presetName);
    }
  };
  
  const handlePresetSelect = (presetName: string) => {
    const selectedPreset = dynamicPresets.find(p => p.name === presetName);
    if (selectedPreset?.settings?.toolbar) {
        setDisplayOptions(selectedPreset.settings.toolbar);
        setHasUnsavedChanges(true);
        toast({ title: "Preset Carregado", description: `A configuração "${presetName}" foi aplicada.` });
    }
  };
  
  const handleDeletePreset = async () => {
    if (!presetToDelete) return;
    setIsSaving(true);
    try {
        await updateDoc(presetsDocRef, { [`presets.${presetToDelete.name}`]: deleteField() });
        toast({ title: "Preset Excluído!" });
        setPresetToDelete(null);
    } catch (e: any) {
        toast({ title: "Erro ao Excluir", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const activeOptions = useMemo(() => displayOptions.filter(opt => opt.active), [displayOptions]);
  const formMethods = useForm();
  
  return (
    <Card>
      <FormProvider {...formMethods}>
        <form onSubmit={(e) => e.preventDefault()}>
          <CardHeader className="relative">
              <BackButton className="absolute right-6 top-3"/>
              <div className="pt-2"> 
                  <CardTitle className="section-title !border-none !pb-0">
                      <PilcrowSquare className="section-title-icon"/>
                      Módulo de Editor (TipTap)
                  </CardTitle>
                  <CardDescription>
                  Configure a barra de ferramentas e teste o editor de texto rico TipTap.
                  </CardDescription>
              </div>
          </CardHeader>
          <CardContent>
              <div className="mb-6">
                <Accordion type="single" collapsible className="w-full border rounded-lg" defaultValue='item-1'>
                    <AccordionItem value="item-1">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-2 px-4 py-3">
                            <AccordionTrigger className="flex-1 text-lg font-semibold">Ferramentas da Barra</AccordionTrigger>
                            <Button variant="outline" size="sm" onClick={handleAddSeparator} className="w-full sm:w-auto shrink-0">
                                <PlusCircle className="mr-2 h-4 w-4" />Adicionar Separador
                            </Button>
                        </div>
                        <AccordionContent className="p-4 pt-2">
                            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8"/></div> : (
                            <SortableList
                                items={displayOptions.map(opt => ({ ...opt, id: opt.key }))}
                                onSortEnd={handleSortEnd}
                                listContainerClassName="space-y-2"
                                renderItem={(opt, { attributes, listeners }) => {
                                    const isSeparator = opt.key.startsWith('separator_');
                                    const currentIndex = displayOptions.findIndex(o => o.key === opt.key);
                                    return (
                                      <div className={cn("flex items-center gap-2 p-2 border rounded-md", isSeparator ? "bg-muted/50" : "bg-background")}>
                                          <div {...attributes} {...listeners} className="drag-handle cursor-grab p-1.5 text-muted-foreground hover:text-foreground touch-none sm:touch-auto">
                                              <GripVertical className="h-5 w-5" />
                                          </div>
                                          {isSeparator ? (
                                              <div className="flex-grow text-left text-xs text-muted-foreground font-semibold">| Separador |</div>
                                          ) : (
                                              <>
                                                  <Icon name={opt.icon || 'HelpCircle'} className="h-5 w-5 text-muted-foreground"/>
                                                  <Label htmlFor={opt.key} className="flex-grow text-sm">{opt.label}</Label>
                                                  <Switch id={opt.key} checked={opt.active} onCheckedChange={(checked) => handleOptionToggle(opt.key, checked)} />
                                              </>
                                          )}
                                          <div className="flex items-center gap-1 ml-auto">
                                              <OrderControls
                                                  onMoveUp={() => handleMove(currentIndex, 'up')}
                                                  onMoveDown={() => handleMove(currentIndex, 'down')}
                                                  isFirst={currentIndex === 0}
                                                  isLast={currentIndex === displayOptions.length - 1}
                                              />
                                              {isSeparator && (
                                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveOption(opt.key)}><Trash2 className="h-4 w-4"/></Button>
                                              )}
                                          </div>
                                      </div>
                                    );
                                }}
                            />
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </div>
              
               <div className="mb-6">
                    <Accordion type="single" collapsible className="w-full border rounded-lg">
                        <AccordionItem value="item-1">
                             <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-2 px-4 py-3">
                                <AccordionTrigger className="flex-1 text-lg font-semibold">Gerenciar Presets</AccordionTrigger>
                                <Dialog open={isSavePresetDialogOpen} onOpenChange={setIsSavePresetDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                                            <PlusCircle className="mr-2 h-4 w-4" /> Salvar como Preset
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md p-0">
                                        <form onSubmit={(e) => { e.preventDefault(); handleSavePreset(newPresetName); }}>
                                            <DialogHeader className="p-6 pb-4">
                                                <DialogTitle>Salvar Configuração como Preset</DialogTitle>
                                                <DialogDescription>Dê um nome para a configuração atual da barra de ferramentas.</DialogDescription>
                                            </DialogHeader>
                                            <div className="px-6 space-y-2">
                                                <Label htmlFor="preset-name">Nome do Preset</Label>
                                                <Input id="preset-name" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
                                            </div>
                                            <DialogFooter className="p-6 pt-4 border-t">
                                                <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                                                <Button type="submit" disabled={isSaving}>
                                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Salvar
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <AccordionContent className="p-4 pt-2">
                                {isLoadingPresets ? <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> :
                                dynamicPresets.length === 0 ? <p className="text-sm text-center text-muted-foreground p-4">Nenhum preset salvo.</p> :
                                (<div className="border rounded-md">
                                    {dynamicPresets.map(preset => (
                                        <div key={preset.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                            <span className="font-medium text-sm">{preset.name}</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Ações para {preset.name}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handlePresetSelect(preset.name)}>Carregar</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleSavePreset(preset.name)}>Sobrescrever com Atual</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => setPresetToDelete(preset)} className="text-destructive">Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>)}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
              
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold mb-4">Preview do Editor</h3>
              <TiptapEditor
                  content={content}
                  onChange={(newContent: string) => setContent(newContent)}
                  config={{ enablePlaceholder: true, placeholderText: 'Comece a escrever...' }}
                  activeOptions={activeOptions}
              />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-end border-t pt-6">
              <Button onClick={handleSaveConfig} disabled={isSaving || !hasUnsavedChanges}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Configuração Padrão
              </Button>
          </CardFooter>
        </form>
      </FormProvider>
      
      <AlertDialog open={!!presetToDelete} onOpenChange={() => setPresetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o preset "{presetToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!presetToOverwrite} onOpenChange={() => setPresetToOverwrite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sobrescrever Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um preset com o nome "{presetToOverwrite}". Deseja substituí-lo com a configuração atual?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeSavePreset(presetToOverwrite!)} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
```