// src/app/[locale]/(app)/settings/menus/presets/create/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusSquare } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { refs } from '@/lib/firestore-refs';
import { BackButton } from "@/components/ui/back-button";

const MenuPresetSchema = z.object({
  presetName: z.string().min(3, "Nome do modelo deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
});

type MenuPresetFormData = z.infer<typeof MenuPresetSchema>;

export default function CreateMenuPresetPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<MenuPresetFormData>({
    resolver: zodResolver(MenuPresetSchema),
    defaultValues: { presetName: "", description: "" },
  });

  const onSubmit = async (data: MenuPresetFormData) => {
    setIsSaving(true);
    try {
      const newPresetRef = await addDoc(refs.master.menuPresets(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        leftSidebarConfig: { visibleGroups: [], visibleItems: [] },
        topBarConfig: { visible: true },
        bottomBarConfig: { visible: true, items: [] },
      });
      toast({ title: "Modelo Criado!", description: `O modelo "${data.presetName}" foi criado. Agora, edite-o para adicionar menus.` });
      router.push(`/${locale}/settings/menus/presets/${newPresetRef.id}/edit`);
    } catch (error) {
      console.error("Error creating menu preset:", error);
      toast({ title: "Erro ao Criar Modelo", variant: "destructive" });
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
            <BackButton href={`/${locale}/settings/menus/presets`} className="absolute right-6 top-3"/>
            <div className="pt-2">
                <CardTitle className="section-title !border-none !pb-0">
                    <PlusSquare className="section-title-icon" />
                    Criar Novo Modelo de Menu
                </CardTitle>
                <CardDescription>
                Defina um nome e uma descrição para este novo modelo. Após salvar, você será redirecionado para a página de edição para montar a estrutura.
                </CardDescription>
            </div>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="presetName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome do Modelo</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Plano Pro, Admin de Instância" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Para quem ou para que este modelo de menu se destina." {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter className="flex-col sm:flex-row sm:justify-end border-t pt-6">
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Salvar e Continuar
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
    </div>
  );
}
