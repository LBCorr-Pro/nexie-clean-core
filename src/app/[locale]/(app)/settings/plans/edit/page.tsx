// src/app/[locale]/(app)/settings/plans/edit/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Save, Package, ShieldCheck, FileDigit, Image } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { refs } from '@/lib/firestore-refs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { useUserPermissions, availablePermissions } from '@/hooks/use-user-permissions';
import { useMenuData } from '@/hooks/use-menu-data'; // Atualizado
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import type { Plan } from '../types';
import { AccessDenied } from '@/components/ui/access-denied';

const PlanFormSchema = z.object({
  name: z.string().min(3, "Nome do plano é obrigatório."),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'legacy']).default('active'),
  order: z.coerce.number().default(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  // Features
  maxUsers: z.coerce.number().optional(),
  maxSubInstances: z.coerce.number().optional(),
  storageLimitMB: z.coerce.number().optional(),
  allowCustomDomain: z.boolean().default(false),
  // Modules
  enabledModuleIds: z.array(z.string()).optional(),
  // Permissions
  defaultPermissionsTemplate: z.record(z.boolean()).optional(),
});

type PlanFormData = z.infer<typeof PlanFormSchema>;

export default function EditPlanPage() {
  const params = useParams();
  const locale = params.locale as string;
  const planId = params.planId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();
  const { allManagedModules, isLoading: isLoadingModules } = useMenuData(); // Atualizado

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const canManage = hasPermission('master.instance.edit_details');
  
  const form = useForm<PlanFormData>({
    resolver: zodResolver(PlanFormSchema),
  });

  useEffect(() => {
    if (!planId) return;
    const docRef = doc(refs.master.plans(), planId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        form.reset(docSnap.data());
      } else {
        toast({ title: "Erro", description: "Plano não encontrado.", variant: "destructive" });
        router.push(`/${locale}/settings/plans`);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [planId, router, locale, toast, form]);

  const onSubmit = async (data: PlanFormData) => {
    if (!canManage) return;
    setIsSaving(true);
    try {
      const docRef = doc(refs.master.plans(), planId);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      toast({ title: "Plano Atualizado!" });
      form.reset(data, { keepDirty: false });
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingModules) {
    return <div className="flex h-96 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!canManage) {
    return <AccessDenied />;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="relative">
            <BackButton href={`/${locale}/settings/plans`} className="absolute right-6 top-3"/>
            <div className="pt-2"> 
                <CardTitle className="section-title !border-none !pb-0">
                    <Edit className="section-title-icon"/>
                    Editar Plano: {form.getValues('name')}
                </CardTitle>
                <CardDescription>Ajuste os detalhes, recursos e permissões deste plano.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="features">Recursos</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="pt-6 space-y-6">
                 <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Plano</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem><SelectItem value="legacy">Legado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 </div>
              </TabsContent>

              <TabsContent value="features" className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="maxUsers" render={({ field }) => (<FormItem><FormLabel>Máx. Usuários</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Deixe em branco para ilimitado</FormDescription></FormItem>)}/>
                  <FormField control={form.control} name="maxSubInstances" render={({ field }) => (<FormItem><FormLabel>Máx. Sub-instâncias</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Deixe em branco para ilimitado</FormDescription></FormItem>)}/>
                  <FormField control={form.control} name="storageLimitMB" render={({ field }) => (<FormItem><FormLabel>Armazenamento (MB)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/>
                </div>
                <FormField control={form.control} name="allowCustomDomain" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Permitir Domínio Customizado?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              </TabsContent>
              
              <TabsContent value="modules" className="pt-6">
                <div className="space-y-2">
                  {allManagedModules.map(module => (
                    <FormField key={module.id} control={form.control} name="enabledModuleIds" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value?.includes(module.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), module.id]) : field.onChange((field.value || []).filter(id => id !== module.id)) }}/></FormControl>
                        <div className="space-y-1 leading-none"><FormLabel>{module.name}</FormLabel><FormDescription>{module.description}</FormDescription></div>
                      </FormItem>
                    )}/>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="pt-6">
                 <ScrollArea className="h-96 w-full rounded-md border p-4">
                   {availablePermissions.filter(p => !p.masterOnly).map(perm => (
                       <FormField key={perm.id} control={form.control} name={`defaultPermissionsTemplate.${perm.id}`} render={({ field }) => (
                           <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><div className="space-y-1 leading-none"><FormLabel>{perm.name}</FormLabel><FormDescription>{perm.description}</FormDescription></div></FormItem>
                       )}/>
                   ))}
                </ScrollArea>
              </TabsContent>

            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
              Salvar Alterações
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
