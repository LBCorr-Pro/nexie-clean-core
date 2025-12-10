// src/modules/lexical-editor/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { useTranslations } from 'next-intl';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, deleteField, onSnapshot, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { defaultLexicalOptions, type EditorOption } from './components/editor-options';
import LexicalEditor from './components/LexicalEditor';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BackButton } from '@/components/ui/back-button';
import { AudioLines, Loader2, Save, Wand2, GripVertical, PlusCircle, Trash2, ChevronDown, MoreVertical, FileJson, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { dequal } from 'dequal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { editorContexts } from '@/lib/data/editor-contexts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserPermissions } from '@/hooks/use-user-permissions';

interface Preset {
  id: string;
  name: string;
  content?: string;
  settings?: {
    toolbar: Omit<EditorOption, 'label'>[];
  };
}

export default function LexicalEditorModulePage() {
  const t = useTranslations('lexical');
  const tToolbar = useTranslations('lexical.toolbar');
  const { hasPermission } = useUserPermissions();
  const { toast } = useToast();

  const canConfigure = hasPermission('master.lexical.configure');
  const canManagePresets = hasPermission('master.lexical.presets.manage');

  const [content, setContent] = useState('');
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
  const [selectedContext, setSelectedContext] = useState<string>('_default_');

  const toolbarConfigDocRef = useMemo(() => {
    return doc(refs.master.lexicalEditorModuleCollection(), 'default_toolbar_config');
  }, []);
  
  const presetsCollectionRef = useMemo(() => {
    return refs.master.lexicalEditorPresets();
  }, []);
  
  const getTranslatedOptions = useCallback((opts: Omit<EditorOption, 'label'>[]): EditorOption[] => {
    const keyMap: Record<string, string> = {
        'heading-1': 'h1',
        'heading-2': 'h2',
        'heading-3': 'h3',
        'align-left': 'alignLeft',
        'align-center': 'alignCenter',
        'align-right': 'alignRight',
        'align-justify': 'alignJustify',
    };
    return opts.map(opt => ({
      ...opt,
      label: opt.key.startsWith('separator_') ? t('separatorLabel') : tToolbar((keyMap[opt.key] || opt.key) as any)
    }));
  }, [t, tToolbar]);


  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const docSnap = await getDoc(toolbarConfigDocRef);
      const baseOptions = getTranslatedOptions(defaultLexicalOptions);
      if (docSnap.exists()) {
        const savedOptions = docSnap.data().toolbar as Omit<EditorOption, 'label'>[];
        const mergedOptions = baseOptions.map(defaultOpt => {
          const savedOpt = savedOptions.find(opt => opt.key === defaultOpt.key);
          return savedOpt ? { ...defaultOpt, active: savedOpt.active } : defaultOpt;
        });
        setOptions(mergedOptions);
      } else {
        setOptions(baseOptions);
      }
    } catch (error) {
      console.error("Failed to fetch Lexical config:", error);
      toast({ title: t('toasts.loadConfigErrorTitle'), description: t('toasts.loadConfigErrorDesc'), variant: "destructive" });
      setOptions(getTranslatedOptions(defaultLexicalOptions));
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, [toolbarConfigDocRef, toast, t, getTranslatedOptions]);
  
  useEffect(() => {
    const q = query(presetsCollectionRef, orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPresets = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            content: doc.data().content,
            settings: doc.data().settings,
        }));
        setDynamicPresets(fetchedPresets as Preset[]);
        setIsLoadingPresets(false);
    }, (error) => {
        console.error("Error fetching Lexical presets:", error);
        toast({title: t('toasts.loadPresetsErrorTitle'), description: t('toasts.loadPresetsErrorDesc'), variant: "destructive"});
        setIsLoadingPresets(false);
    });
    return () => unsubscribe();
}, [presetsCollectionRef, toast, t]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  
  useEffect(() => {
    if (!isLoading) {
        setDisplayOptions(prev => {
            if (dequal(prev, options)) return prev;
            return [...options];
        });
    }
  }, [options, isLoading]);

  const handleOptionToggle = (key: string, checked: boolean) => {
    if (!canConfigure) return;
    setDisplayOptions(prevOptions =>
      prevOptions.map(opt => (opt.key === key ? { ...opt, active: checked } : opt))
    );
    setHasUnsavedChanges(true);
  };
  
  const handleSortEnd = (newItems: any[]) => {
    if (!canConfigure) return;
    setDisplayOptions(newItems as EditorOption[]);
    setHasUnsavedChanges(true);
  };
  
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
    if (!canConfigure) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= displayOptions.length) return;
    
    setDisplayOptions(prev => {
        const newItems = arrayMove(prev, currentIndex, newIndex);
        return newItems;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddSeparator = () => {
    if (!canConfigure) return;
    const newSeparator: EditorOption = {
      key: `separator_${Date.now()}`,
      label: 'Separator', // Internal label, UI uses translation
      icon: 'Minus',
      active: true,
    };
    setDisplayOptions(prev => [...prev, newSeparator]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveOption = (key: string) => {
    if (!canConfigure) return;
    setDisplayOptions(prev => prev.filter(opt => opt.key !== key));
    setHasUnsavedChanges(true);
  };

  const handleSaveConfig = async () => {
    if (!canConfigure) return;
    setIsSaving(true);
    try {
      const optionsToSave = displayOptions.map(({ label, ...rest }) => rest);
      await setDoc(toolbarConfigDocRef, { toolbar: optionsToSave, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: t('toasts.saveConfigSuccessTitle'), description: t('toasts.saveConfigSuccessDesc') });
      setHasUnsavedChanges(false);
      setOptions(displayOptions);
    } catch (error: any) {
      toast({ title: t('toasts.saveConfigErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const executeSavePreset = async (presetName: string) => {
    if (!canManagePresets) return false;
    setIsSaving(true);
    try {
        const presetRef = doc(presetsCollectionRef, presetName);
        const optionsToSave = displayOptions.map(({ label, ...rest }) => rest);
        await setDoc(presetRef, { name: presetName, content: content, settings: { toolbar: optionsToSave }, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: t('toasts.savePresetSuccessTitle'), description: t('toasts.savePresetSuccessDesc', { name: presetName }) });
        return true;
    } catch (error: any) {
        console.error("Error saving preset:", error);
        toast({ title: t('toasts.savePresetErrorTitle'), description: error.message, variant: "destructive" });
        return false;
    } finally {
        setIsSaving(false);
        setIsSavePresetDialogOpen(false);
        setPresetToOverwrite(null);
    }
  };

  const handleSavePreset = async (name?: string) => {
    const presetName = name || (selectedContext === '_default_' ? newPresetName : selectedContext);
    if (!presetName.trim()) {
        toast({ title: t('toasts.invalidPresetNameTitle'), description: t('toasts.invalidPresetNameDesc'), variant: "destructive" });
        return;
    }

    const isExisting = dynamicPresets.some(p => p.name.toLowerCase() === presetName.toLowerCase());
    
    if (isExisting && presetToOverwrite !== presetName) { 
        setPresetToOverwrite(presetName);
    } else {
        if (await executeSavePreset(presetName)) {
            setNewPresetName('');
        }
    }
  };
  
  const handlePresetSelect = (presetName: string) => {
    const selectedPreset = dynamicPresets.find(p => p.name === presetName);
    if (selectedPreset) {
        if(selectedPreset.settings?.toolbar && canConfigure) {
            setDisplayOptions(getTranslatedOptions(selectedPreset.settings.toolbar));
        }
        if(selectedPreset.content) setContent(selectedPreset.content);
        if(canConfigure) setHasUnsavedChanges(true);
        toast({ title: t('toasts.loadPresetSuccessTitle'), description: t('toasts.loadPresetSuccessDesc', { name: presetName }) });
    }
  };

  useEffect(() => {
    const contextPreset = dynamicPresets.find(p => p.id === selectedContext);
    if (contextPreset?.content) {
        setContent(contextPreset.content);
    } else {
        setContent('');
    }
  }, [selectedContext, dynamicPresets]);
  
  const handleDeletePreset = async () => {
    if (!presetToDelete || !canManagePresets) return;
    setIsSaving(true);
    try {
        await deleteDoc(doc(presetsCollectionRef, presetToDelete.id));
        toast({ title: t('toasts.deletePresetSuccessTitle') });
        setPresetToDelete(null);
    } catch (e: any) {
        toast({ title: t('toasts.deletePresetErrorTitle'), description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const activeOptions = useMemo(() => displayOptions.filter(opt => opt.active), [displayOptions]);
  const formMethods = useForm();
  
  return (
    <>
      <FormProvider {...formMethods}>
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardHeader className="relative">
                <BackButton className="absolute right-6 top-3"/>
                <div className="pt-2">
                    <CardTitle className="section-title !border-none !pb-0">
                        <AudioLines className="section-title-icon" />
                        {t('title')}
                    </CardTitle>
                    <CardDescription>
                      {t('description')}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Accordion type="single" collapsible className="w-full border rounded-lg" defaultValue='item-1' disabled={!canConfigure}>
                        <AccordionItem value="item-1">
                             <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-2 px-4 py-3">
                                <AccordionTrigger className="flex-1 text-lg font-semibold">{t('toolbarAccordionTitle')}</AccordionTrigger>
                                {canConfigure && (
                                    <Button variant="outline" size="sm" onClick={handleAddSeparator} className="w-full sm:w-auto shrink-0">
                                        <PlusCircle className="mr-2 h-4 w-4" />{t('addSeparatorButton')}
                                    </Button>
                                )}
                            </div>
                            <AccordionContent className="p-4 pt-2">
                                {!canConfigure && <div className="flex items-center text-sm text-muted-foreground p-4 border bg-muted rounded-md"><AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />{t('configureDenied')}</div>}
                                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8"/></div> : (
                                <fieldset disabled={!canConfigure}>
                                    <SortableList
                                        items={displayOptions.map(opt => ({ ...opt, id: opt.key }))}
                                        onSortEnd={handleSortEnd}
                                        listContainerClassName="space-y-2"
                                        renderItem={(opt, { attributes, listeners }) => {
                                            const isSeparator = opt.key.startsWith('separator_');
                                            const currentIndex = displayOptions.findIndex(o => o.key === opt.key);
                                            return (
                                              <div className={cn("flex items-center gap-2 p-2 border rounded-md", isSeparator ? "bg-muted/50" : "bg-background")}>
                                                  <div {...attributes} {...listeners} className={cn("drag-handle p-1.5 text-muted-foreground", canConfigure ? "cursor-grab hover:text-foreground touch-none sm:touch-auto" : "cursor-not-allowed")}>
                                                      <GripVertical className="h-5 w-5" />
                                                  </div>
                                                  {isSeparator ? (
                                                      <div className="flex-grow text-left text-xs text-muted-foreground font-semibold">{t('separatorLabel')}</div>
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
                                </fieldset>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
              
                <div className="mb-6">
                    <Accordion type="single" collapsible className="w-full border rounded-lg" disabled={!canManagePresets}>
                        <AccordionItem value="item-1">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-2 px-4 py-3">
                                <AccordionTrigger className="flex-1 text-lg font-semibold">{t('presets.accordionTitle')}</AccordionTrigger>
                                {canManagePresets && (
                                    <Dialog open={isSavePresetDialogOpen} onOpenChange={setIsSavePresetDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                                                <PlusCircle className="mr-2 h-4 w-4" /> {t('presets.savePresetButton')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md p-0">
                                            <form onSubmit={(e) => { e.preventDefault(); handleSavePreset(); }}>
                                                <DialogHeader className="p-6 pb-4">
                                                    <DialogTitle>{t('dialogs.savePreset.title')}</DialogTitle>
                                                    <DialogDescription>{t('dialogs.savePreset.description')}</DialogDescription>
                                                </DialogHeader>
                                                <div className="px-6 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="preset-context">{t('dialogs.savePreset.contextLabel')}</Label>
                                                        <Select value={selectedContext} onValueChange={setSelectedContext}>
                                                            <SelectTrigger id="preset-context"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="_default_">{t('dialogs.savePreset.noContextOption')}</SelectItem>
                                                                {editorContexts.map(ctx => <SelectItem key={ctx.id} value={ctx.id}>{ctx.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {selectedContext === '_default_' && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor="preset-name">{t('dialogs.savePreset.customNameLabel')}</Label>
                                                            <Input id="preset-name" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
                                                        </div>
                                                    )}
                                                </div>
                                                <DialogFooter className="p-6 pt-4 border-t">
                                                    <DialogClose asChild><Button type="button" variant="ghost">{t('dialogs.savePreset.cancelButton')}</Button></DialogClose>
                                                    <Button type="submit" disabled={isSaving}>
                                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('dialogs.savePreset.savingButton')}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <AccordionContent className="p-4 pt-2">
                                {!canManagePresets && <div className="flex items-center text-sm text-muted-foreground p-4 border bg-muted rounded-md"><AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />{t('presetsDenied')}</div>}
                                {isLoadingPresets ? <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> :
                                dynamicPresets.length === 0 ? <p className="text-sm text-center text-muted-foreground p-4">{t('presets.noPresetsMessage')}</p> :
                                (<fieldset disabled={!canManagePresets} className="border rounded-md">
                                    {dynamicPresets.map(preset => (
                                        <div key={preset.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                            <span className="font-medium text-sm">{preset.name}</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">{t('presets.actions.srLabel', { presetName: preset.name })}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handlePresetSelect(preset.name)}>{t('presets.actions.load')}</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleSavePreset(preset.name)}>{t('presets.actions.overwrite')}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => setPresetToDelete(preset)} className="text-destructive">{t('presets.actions.delete')}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </fieldset>)}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
              
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold mb-4">{t('previewTitle')}</h3>
              <LexicalEditor
                  content={content}
                  onChange={setContent}
                  activeOptions={activeOptions}
                  placeholderText={t('placeholder')}
                  editable={canConfigure}
              />
              </CardContent>
              {canConfigure && (
                  <CardFooter className="flex flex-col sm:flex-row sm:justify-end border-t pt-6">
                      <Button onClick={handleSaveConfig} disabled={isSaving || !hasUnsavedChanges}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          {t('saveDefaultConfigButton')}
                      </Button>
                  </CardFooter>
              )}
            </form>
          </Card>
      </FormProvider>
      
       <AlertDialog open={!!presetToDelete} onOpenChange={() => setPresetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deletePreset.title')}</AlertDialogTitle>
            <AlertDialogDescription>
                {t('dialogs.deletePreset.description', { name: presetToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>{t('dialogs.deletePreset.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset} disabled={isSaving || !canManagePresets} className="bg-destructive hover:bg-destructive/90">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dialogs.deletePreset.deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!presetToOverwrite} onOpenChange={() => setPresetToOverwrite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.overwritePreset.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.overwritePreset.description', { name: presetToOverwrite })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>{t('dialogs.overwritePreset.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeSavePreset(presetToOverwrite!)} disabled={isSaving || !canManagePresets}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dialogs.overwritePreset.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
