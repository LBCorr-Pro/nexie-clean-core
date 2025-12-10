// src/app/[locale]/(app)/settings/menus/left-sidebar/page.tsx
"use client";

import React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/nx-use-toast";
import { useMenuData, type ConfiguredMenuItem } from '@/hooks/use-menu-data';
import { useNxAppearance } from '@/hooks/use-nx-appearance';
import { useInstanceActingContext } from "@/contexts/instance-acting-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogAlertTitle } from "@/components/ui/alert-dialog";
import { BackButton } from "@/components/ui/back-button";

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i;

const LeftSidebarSettingsSchema = z.object({
  leftSidebarVisible: z.boolean().default(true),
  leftSidebarLogoSameAsExpanded: z.boolean().default(true),
  leftSidebarLogoCollapsedUrl: z.string().optional().or(z.literal('')),
  leftSidebarLogoExpandedUrl: z.string().optional().or(z.literal('')),
  leftSidebarLogoSize: z.enum(["small", "medium", "large"]).default("medium"),
  leftSidebarShowAppName: z.boolean().default(true),
  leftSidebarAppNameType: z.enum(["full", "nickname", "custom"]).default("full"),
  leftSidebarAppNameFont: z.string().optional().or(z.literal('')),
  leftSidebarAppNameColor: z.string().refine(val => val.trim() === "" || HEX_COLOR_REGEX.test(val), { message: "Cor inválida." }).optional().or(z.literal('')),
  leftSidebarAppNameEffect: z.string().optional().or(z.literal('')),
  leftSidebarLinkOnAppName: z.boolean().default(false),
  leftSidebarLinkToHome: z.boolean().default(true),
  leftSidebarAppNameLinkHref: z.string().optional().or(z.literal('')),
});

type LeftSidebarSettingsFormData = z.infer<typeof LeftSidebarSettingsSchema>;

export default function LeftSidebarSettingsPage() {
  const { toast } = useToast();
  const { actingAsInstanceId, actingAsInstanceName } = useInstanceActingContext();
  const { allCombinedItems, isLoading: isLoadingMenu } = useMenuData();
  const { appearanceSettings, saveAppearanceSettings, revertToInheritedSettings, isLoading: isLoadingAppearance } = useNxAppearance();

  const [isSaving, setIsSaving] = React.useState(false);
  const [showRevertDialog, setShowRevertDialog] = React.useState(false);
  const [isReverting, setIsReverting] = React.useState(false);

  const contextType = React.useMemo(() => {
    if (actingAsInstanceId) return 'instance';
    return 'master';
  }, [actingAsInstanceId]);
  
  const isLoadingSettings = isLoadingMenu || isLoadingAppearance;

  const isFormEffectivelyDisabled = isLoadingSettings || isSaving;

  const form = useForm<LeftSidebarSettingsFormData>({
    resolver: zodResolver(LeftSidebarSettingsSchema),
  });
  
  React.useEffect(() => {
    if(appearanceSettings) {
      const validAppNameTypes = ["full", "nickname"];
      const appNameType = appearanceSettings.leftSidebarAppNameType && validAppNameTypes.includes(appearanceSettings.leftSidebarAppNameType) 
        ? appearanceSettings.leftSidebarAppNameType 
        : "full";

      form.reset({
        leftSidebarVisible: appearanceSettings.leftSidebarVisible ?? true,
        leftSidebarLogoSameAsExpanded: appearanceSettings.leftSidebarLogoSameAsExpanded ?? true,
        leftSidebarLogoCollapsedUrl: appearanceSettings.leftSidebarLogoCollapsedUrl || '',
        leftSidebarLogoExpandedUrl: appearanceSettings.leftSidebarLogoExpandedUrl || '',
        leftSidebarLogoSize: appearanceSettings.leftSidebarLogoSize || "medium",
        leftSidebarShowAppName: appearanceSettings.leftSidebarShowAppName ?? true,
        leftSidebarAppNameType: appNameType,
        leftSidebarAppNameFont: appearanceSettings.leftSidebarAppNameFont || "",
        leftSidebarAppNameColor: appearanceSettings.leftSidebarAppNameColor || "",
        leftSidebarAppNameEffect: appearanceSettings.leftSidebarAppNameEffect || "",
        leftSidebarLinkOnAppName: appearanceSettings.leftSidebarLinkOnAppName ?? false,
        leftSidebarLinkToHome: appearanceSettings.leftSidebarLinkToHome ?? true,
        leftSidebarAppNameLinkHref: appearanceSettings.leftSidebarAppNameLinkHref || "",
      })
    }
  }, [appearanceSettings, form])


  const onSubmit = async (data: LeftSidebarSettingsFormData) => {
    setIsSaving(true);
    const result = await saveAppearanceSettings(data);
    if(result.success) {
        toast({ title: "Configurações do Menu Salvas!" });
        form.reset(data);
    } else {
        toast({ title: "Erro ao Salvar", description: (result as any).error, variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const handleRevert = async () => {
      setIsReverting(true);
      await revertToInheritedSettings();
      setIsReverting(false);
      setShowRevertDialog(false);
  }

  const watchedSameLogo = useWatch({ control: form.control, name: "leftSidebarLogoSameAsExpanded" });
  const watchedShowAppName = useWatch({ control: form.control, name: "leftSidebarShowAppName" });
  const watchedLinkOnAppName = useWatch({ control: form.control, name: "leftSidebarLinkOnAppName" });
  const watchedLinkToHome = useWatch({ control: form.control, name: "leftSidebarLinkToHome" });


  const pageContextName = React.useMemo(() => {
    if (contextType === 'instance') return actingAsInstanceName || 'Instância';
    return 'Master';
  }, [contextType, actingAsInstanceName]);

  if (isLoadingSettings) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Menu Esquerdo ({pageContextName})</CardTitle>
          <CardDescription>Personalize a aparência e comportamento do menu lateral principal.</CardDescription>
        </CardHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={isFormEffectivelyDisabled}>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="leftSidebarVisible" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Menu Esquerdo Visível?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                <Separator />
                <h3 className="text-lg font-medium">Logo</h3>
                 <FormField control={form.control} name="leftSidebarLogoSameAsExpanded" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Usar mesmo logo para menu aberto e fechado?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                 <FormField control={form.control} name="leftSidebarLogoExpandedUrl" render={({ field }) => (<FormItem><FormLabel>Logo (Menu Aberto)</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl></FormItem>)}/>
                {!watchedSameLogo && <FormField control={form.control} name="leftSidebarLogoCollapsedUrl" render={({ field }) => (<FormItem><FormLabel>Logo (Menu Fechado)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />}
                
                <Separator />
                <h3 className="text-lg font-medium">Nome da Aplicação</h3>
                <FormField control={form.control} name="leftSidebarShowAppName" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Exibir Nome do App?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                 {watchedShowAppName && (
                  <div className="pl-4 space-y-2">
                    <FormField control={form.control} name="leftSidebarAppNameType" render={({ field }) => (<FormItem><FormLabel>Qual nome exibir?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="full">Nome Completo</SelectItem><SelectItem value="nickname">Apelido</SelectItem></SelectContent></Select></FormItem>)}/>
                    <FormField control={form.control} name="leftSidebarAppNameColor" render={({ field }) => (<FormItem><FormLabel>Cor do Nome</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? ''}/></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="leftSidebarLinkOnAppName" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Ativar link no nome?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                    {watchedLinkOnAppName && (
                      <div className="pl-4 space-y-2">
                        <FormField control={form.control} name="leftSidebarLinkToHome" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Link para a home?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                        {!watchedLinkToHome && 
                          <FormField control={form.control} name="leftSidebarAppNameLinkHref" render={({ field }) => (
                            <FormItem><FormLabel>Página de Destino</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{allCombinedItems.map((p: ConfiguredMenuItem) => <SelectItem key={p.menuKey} value={p.originalHref}>{p.displayName}</SelectItem>)}</SelectContent>
                            </Select>
                            </FormItem>
                          )} />
                        }
                      </div>
                    )}
                  </div>
                 )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <div className="flex w-full justify-between items-center">
                    <div>
                        {contextType !== 'master' && <Button type="button" variant="outline" onClick={() => setShowRevertDialog(true)}><RotateCcw className="mr-2 h-4 w-4" />Reverter para Padrão</Button>}
                    </div>
                    <Button type="submit" disabled={isFormEffectivelyDisabled}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Alterações
                    </Button>
                </div>
              </CardFooter>
            </fieldset>
          </form>
        </FormProvider>
        <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
           <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogAlertTitle>Confirmar Reversão</AlertDialogAlertTitle>
                  <AlertDialogDescription>
                      Tem certeza de que deseja reverter as configurações de aparência para o padrão herdado? Quaisquer personalizações feitas neste contexto serão perdidas.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel disabled={isReverting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevert} disabled={isReverting}>
                      {isReverting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Confirmar
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
