# Documentação da Página: Configurar Campos de Cadastro (Empresa)

Este documento detalha o funcionamento e a lógica da página de "Configurar Campos de Cadastro (Empresa)", localizada em `src/app/[locale]/(app)/access/company-registration-fields-settings/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Configurar Campos de Cadastro (Empresa)** é uma ferramenta de nível **Master** que permite ao administrador do sistema definir quais campos estarão disponíveis no formulário de criação e edição de empresas.

A funcionalidade principal desta página é a **customização do formulário**, permitindo:
-   **Adicionar** campos customizados.
-   **Reordenar** todos os campos (customizados e pré-definidos) através de drag-and-drop.
-   **Controlar a visibilidade e obrigatoriedade** da maioria dos campos.
-   **Ativar validação específica** para campos como CNPJ.

## 2. Funcionalidades Detalhadas

### a. Listagem e Ordenação
-   **Visualização:** Os campos são listados em um formato de "acordeão", permitindo que os detalhes de cada um sejam expandidos ou recolhidos.
-   **Ordenação (Drag and Drop):** É possível reordenar os campos arrastando-os pela alça (`<GripVertical />`). A nova ordem é salva ao clicar em "Salvar Campos".
-   **Ordenação (Setas):** Controles de seta permitem ajustes finos na ordem dos campos.

### b. Controles Rápidos
Cada item na lista possui controles rápidos para as ações mais comuns:
-   **Obrigatoriedade (`<Asterisk />`):** Um botão de ícone permite alternar rapidamente se o campo é obrigatório.
-   **Visibilidade (`<Eye />`):** Permite mostrar ou ocultar o campo do formulário. Campos obrigatórios pelo sistema não podem ser ocultados.

### c. Edição de Campos (Dentro do Acordeão)
Ao expandir um item, são reveladas todas as opções de configuração:
-   **Rótulo:** O nome do campo exibido para o usuário.
-   **Chave do Campo (ID):** O identificador único usado no banco de dados. Não pode ser alterado para campos pré-definidos.
-   **Tipo do Campo:** Permite escolher o tipo de input (texto, número, e-mail, etc.). Não pode ser alterado para campos pré-definidos.
-   **Descrição:** Um texto de ajuda exibido abaixo do campo no formulário.
-   **Switches de Controle:** Versões em `Switch` dos controles rápidos de visibilidade e obrigatoriedade.
-   **Ativar Validação:** Um `Switch` que aparece para campos específicos (como CNPJ), permitindo ativar ou desativar a validação de formato.

### d. Campos Pré-definidos vs. Customizados
-   **Campos Pré-definidos:** São os campos padrão do sistema (Nome Fantasia, CNPJ, Endereço, etc.). Eles não podem ser excluídos, e suas chaves e tipos de campo não podem ser alterados.
-   **Campos Customizados:** Campos criados pelo administrador. Podem ser totalmente editados e excluídos.

## 3. Lógica de Salvamento

-   Ao clicar em "Salvar Campos", a ordem atual da lista e todas as configurações de cada campo (visibilidade, obrigatoriedade, etc.) são salvas no Firestore, na coleção `Global/master/config/company_registration_settings/field_configs`.
-   A operação é realizada em um `writeBatch` para garantir que todas as alterações sejam aplicadas de forma atômica.

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/access/company-registration-fields-settings/page.tsx
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import {
  collection, doc, writeBatch, serverTimestamp, Timestamp, onSnapshot,
  query, orderBy, setDoc,
} from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useUserPermissions, PermissionId } from '@/hooks/use-user-permissions';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, Briefcase, AlertTriangle, PlusCircle, Trash2, GripVertical, ShieldCheck as SystemDefaultIcon, Eye, EyeOff, ArrowUp, ArrowDown, MoreVertical, Edit, Asterisk } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { refs } from '@/lib/firestore-refs';
import { OrderControls } from '@/components/shared/form/OrderControls';
import { SortableList } from '@/components/shared/dnd/SortableList';
import { BackButton } from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const fieldTypeEnum = z.enum([
  "text", "number", "email", "date", "url", "dropdown", "checkbox", "switch", "file", "cnpj", "address_group", "textarea", "social"
]);

const ValidationConfigSchema = z.object({
  active: z.boolean().default(true),
  type: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  regex: z.string().optional(),
  script: z.string().optional(),
});

const CompanyFieldConfigSchema = z.object({
  fieldKey: z.string().min(1, "Chave do campo é obrigatória."),
  label: z.string().min(1, "Rótulo é obrigatório."),
  fieldType: fieldTypeEnum,
  isVisible: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  order: z.number().int().default(0),
  description: z.string().optional().or(z.literal('')),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  isPredefinedField: z.boolean().default(false).optional(),
  validationConfig: ValidationConfigSchema.optional(),
  createdAt: z.custom<Timestamp>((val) => val instanceof Timestamp).optional(),
  updatedAt: z.custom<Timestamp>((val) => val instanceof Timestamp).optional(),
  id: z.string(),
});

type CompanyFieldConfigFormData = z.infer<typeof CompanyFieldConfigSchema>;

const CompanyFieldsFormSchema = z.object({
  fields: z.array(CompanyFieldConfigSchema),
});
type CompanyRegistrationFieldsForm = z.infer<typeof CompanyFieldsFormSchema>;

const PREDEFINED_COMPANY_FIELDS: Array<Omit<CompanyFieldConfigFormData, 'order' | 'createdAt' | 'updatedAt' | 'id' | 'isVisible'>> = [
    { fieldKey: "companyName", label: "Nome Fantasia", fieldType: "text", isRequired: true, isUnique: false, isPredefinedField: true },
    { fieldKey: "legalName", label: "Razão Social", fieldType: "text", isRequired: true, isUnique: false, isPredefinedField: true },
    { fieldKey: "cnpj", label: "CNPJ", fieldType: "cnpj", isRequired: true, isUnique: true, isPredefinedField: true },
    { fieldKey: "status", label: "Status", fieldType: "switch", isRequired: true, isUnique: false, isPredefinedField: true, description: "Controla se a empresa está ativa ou inativa no sistema." },
    { fieldKey: "companyLogoUrl", label: "Logo da Empresa", fieldType: "file", isRequired: false, isUnique: false, isPredefinedField: true, description: "URL ou upload da imagem principal da empresa." },
    { fieldKey: "companyEmail", label: "E-mail da Empresa", fieldType: "email", isRequired: false, isUnique: true, isPredefinedField: true },
    { fieldKey: "socialLinks", label: "Redes Sociais", fieldType: "social", isRequired: false, isUnique: false, isPredefinedField: true, description: "Gerencia múltiplos links de redes sociais." },
    { fieldKey: "companyPhone", label: "Telefone da Empresa", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "primaryContact", label: "Responsável Primário", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "companyWebsite", label: "Site da Empresa", fieldType: "url", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "secondaryContact", label: "Responsável Secundário", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "companyAddress", label: "Endereço da Empresa", fieldType: "address_group", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressCep", label: "CEP", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressStreet", label: "Rua", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressNumber", label: "Número", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressComplement", label: "Complemento", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressDistrict", label: "Bairro", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressCity", label: "Cidade", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressState", label: "Estado", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
    { fieldKey: "addressCountry", label: "País", fieldType: "text", isRequired: false, isUnique: false, isPredefinedField: true },
];

export default function CompanyRegistrationFieldsSettingsPage() {
  const { toast } = useToast();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [openAccordion, setOpenAccordion] = React.useState<string[]>([]);

  const form = useForm<CompanyRegistrationFieldsForm>({
    resolver: zodResolver(CompanyFieldsFormSchema),
    defaultValues: { fields: [] },
  });

  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "fields", keyName: "dndId" });

  const permissionId: PermissionId = 'master.settings.company_fields.edit';
  const canEditFields = hasPermission(permissionId);
  
  const isPageEffectivelyDisabled = isLoadingData || isLoadingPermissions || isSaving || !canEditFields || (isActingAsMaster && !!actingAsInstanceId);

  React.useEffect(() => {
    setIsLoadingData(true);
    const q = query(refs.master.companyRegistrationFields(), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedFieldsMap = new Map<string, CompanyFieldConfigFormData>();
        snapshot.docs.forEach(docSnap => {
            fetchedFieldsMap.set(docSnap.id, { 
                fieldKey: docSnap.id, 
                ...(docSnap.data() as Omit<CompanyFieldConfigFormData, 'fieldKey' | 'id'>), 
                id: docSnap.id 
            });
        });

        const combinedFields: CompanyFieldConfigFormData[] = PREDEFINED_COMPANY_FIELDS.map((predefined, index) => {
            const existingField = fetchedFieldsMap.get(predefined.fieldKey);
            if (existingField) {
                fetchedFieldsMap.delete(predefined.fieldKey);
            }
            return existingField ? 
                { ...predefined, ...existingField, isPredefinedField: true, id: existingField.id } :
                { ...predefined, order: index * 10, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), isPredefinedField: true, id: predefined.fieldKey, isVisible: true, validationConfig: { active: true } };
        });

        fetchedFieldsMap.forEach(customField => {
            combinedFields.push({ ...customField, isPredefinedField: false });
        });
        
        combinedFields.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

        form.reset({ fields: combinedFields as any[] });
        setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching company field configs: ", error);
      toast({ title: "Erro ao carregar configurações", variant: "destructive" });
      setIsLoadingData(false);
    });
    return () => unsubscribe();
  }, [form, toast]);

   const handleSortEnd = (newItems: any[]) => {
      const reorderedItems = newItems.map((item, index) => ({...item, order: index * 10}));
      form.setValue('fields', reorderedItems, { shouldDirty: true, shouldValidate: true });
  };
  
  const handleMove = (from: number, to: number) => {
      if(to < 0 || to >= fields.length) return;
      move(from, to);
  };

  const onSubmit = async (data: CompanyRegistrationFieldsForm) => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const collectionRef = refs.master.companyRegistrationFields();
      
      data.fields.forEach((field, index) => {
        const { id, fieldKey, ...fieldData } = field;
        const docRef = doc(collectionRef, fieldKey);
        const dataToSave: any = {
            ...fieldData,
            isVisible: typeof fieldData.isVisible === 'boolean' ? fieldData.isVisible : true,
            isRequired: typeof fieldData.isRequired === 'boolean' ? fieldData.isRequired : false,
            isUnique: typeof fieldData.isUnique === 'boolean' ? fieldData.isUnique : false,
            description: fieldData.description || "",
            isPredefinedField: fieldData.isPredefinedField || false,
            order: index * 10,
            updatedAt: serverTimestamp()
        };
        if (!fieldData.createdAt) dataToSave.createdAt = serverTimestamp();
        batch.set(docRef, dataToSave, { merge: true });
      });
      await batch.commit();
      toast({ title: "Configurações Salvas", description: "Campos de cadastro de empresa atualizados." });
      form.reset(data, { keepValues: true, keepDirty: false });
    } catch (error) {
      console.error("Error saving company field configs:", error);
      toast({ title: "Erro ao Salvar", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const addNewField = () => {
    const newKey = `custom_company_field_${Date.now()}`;
    append({
      id: newKey,
      fieldKey: newKey, label: "Novo Campo Customizado", fieldType: "text",
      isVisible: true, isRequired: false, isUnique: false, order: (fields.length + 1) * 10,
      description: "", options: [], isPredefinedField: false,
      validationConfig: { active: false },
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    setOpenAccordion(prev => [...prev, newKey]);
  };

  if (isLoadingPermissions) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  
  if (isActingAsMaster && actingAsInstanceId) {
    return (
      <Card>
        <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <div className="pt-2">
                <CardTitle className="section-title !border-none !pb-0"><Briefcase className="section-title-icon"/>Configurar Campos de Cadastro (Empresa)</CardTitle>
                <CardDescription>Defina os campos para o formulário de cadastro de empresas.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="mt-3 text-sm bg-sky-50 border-sky-300 dark:bg-sky-900/30 dark:border-sky-700">
              <SystemDefaultIcon className="h-4 w-4 !text-sky-600 dark:!text-sky-400" />
              <AlertTitle className="font-semibold text-sky-700 dark:text-sky-300">Configuração Global</AlertTitle>
              <AlertBoxDescription className="text-sky-600 dark:text-sky-400">Esta configuração é global. Para editar, retorne ao contexto Master.</AlertBoxDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="relative">
         <BackButton className="absolute right-6 top-3"/>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2">
            <div>
                <CardTitle className="section-title !border-none !pb-0"><Briefcase className="section-title-icon"/>Configurar Campos de Cadastro (Empresa)</CardTitle>
                <CardDescription>Defina os campos para o formulário de cadastro de empresas. Alterações são globais (Master).</CardDescription>
            </div>
            <Button onClick={addNewField} disabled={isPageEffectivelyDisabled} className="shrink-0 w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Campo</Button>
        </div>
        {!canEditFields && isActingAsMaster && !actingAsInstanceId && (
            <Alert variant="destructive" className="mt-3 text-sm"><SystemDefaultIcon className="h-4 w-4" /><AlertTitle className="font-semibold">Permissão Necessária</AlertTitle><AlertBoxDescription>Você não tem permissão ('{permissionId}') para editar estes campos.</AlertBoxDescription></Alert>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isPageEffectivelyDisabled}>
            <CardContent>
              {isLoadingData ? (<div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : (
                <SortableList
                    items={fields}
                    onSortEnd={(newItems) => handleSortEnd(newItems as CompanyFieldConfigFormData[])}
                    listContainerClassName="w-full space-y-2"
                    renderItem={(field: any, { attributes, listeners, isDragging }) => {
                        const index = fields.findIndex(f => f.id === field.id);
                        if (index === -1) return null;
                        const isPredefined = field.isPredefinedField;
                        
                        const isVisibleWatcher = form.watch(`fields.${index}.isVisible`);
                        const isRequiredWatcher = form.watch(`fields.${index}.isRequired`);

                        return (
                             <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
                                <AccordionItem value={field.id} className="border rounded-md bg-card shadow-sm group">
                                <div className="flex items-center p-2 rounded-t-md data-[state=open]:bg-muted/30">
                                    <div {...attributes} {...listeners} className="drag-handle cursor-grab p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 touch-none sm:touch-auto">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <AccordionTrigger className="flex-1 p-2 hover:no-underline" onClick={() => setOpenAccordion(prev => prev.includes(field.id) ? prev.filter(id => id !== field.id) : [...prev, field.id])}>
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <span className="font-medium text-sm truncate">{field.label || `Campo: ${field.fieldKey}`}</span>
                                            {isPredefined && (
                                                <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild><span className="flex items-center" onClick={(e) => e.stopPropagation()}><SystemDefaultIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" /></span></TooltipTrigger><TooltipContent><p>Campo Padrão do Sistema</p></TooltipContent></Tooltip></TooltipProvider>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                     <div className="flex items-center gap-0.5 shrink-0">
                                        <TooltipProvider delayDuration={100}>
                                             <Tooltip><TooltipTrigger asChild>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); form.setValue(`fields.${index}.isRequired`, !isRequiredWatcher, { shouldDirty: true, shouldValidate: true });}} className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50"><Asterisk className={cn("h-4 w-4", isRequiredWatcher ? "text-destructive" : "text-muted-foreground")} /></button>
                                            </TooltipTrigger><TooltipContent><p>{isRequiredWatcher ? 'Campo Obrigatório' : 'Campo Opcional'}</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); form.setValue(`fields.${index}.isVisible`, !isVisibleWatcher, { shouldDirty: true, shouldValidate: true });}} className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50"><Eye className={cn("h-4 w-4", isVisibleWatcher ? "text-green-600 dark:text-green-500" : "text-muted-foreground")} /></button>
                                            </TooltipTrigger><TooltipContent><p>{isVisibleWatcher ? 'Visível no Formulário' : 'Oculto do Formulário'}</p></TooltipContent></Tooltip>
                                        </TooltipProvider>
                                        <OrderControls onMoveUp={() => handleMove(index, index - 1)} onMoveDown={() => handleMove(index, index + 1)} isFirst={index === 0} isLast={index === fields.length - 1} disabled={isPageEffectivelyDisabled}/>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPageEffectivelyDisabled}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => setOpenAccordion(prev => prev.includes(field.id) ? prev.filter(id => id !== field.id) : [...prev, field.id])}><Edit className="mr-2 h-4 w-4"/>Editar Detalhes</DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem className="text-destructive" disabled={isPredefined} onClick={() => remove(index)}><Trash2 className="mr-2 h-4 w-4"/>Excluir Campo</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <AccordionContent className="px-4 pt-2 pb-4 border-t bg-background rounded-b-md">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <FormField control={form.control} name={`fields.${index}.label`} render={({ field: formField }) => ( <FormItem><FormLabel>Rótulo</FormLabel><FormControl><Input {...formField} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name={`fields.${index}.fieldKey`} render={({ field: formField }) => ( <FormItem><FormLabel>Chave do Campo (ID)</FormLabel><FormControl><Input {...formField} disabled={isPredefined} /></FormControl><FormDescription>Não altere para campos pré-definidos.</FormDescription><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name={`fields.${index}.fieldType`} render={({ field: formField }) => ( <FormItem><FormLabel>Tipo do Campo</FormLabel><Select onValueChange={formField.onChange} value={formField.value} disabled={isPredefined}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{fieldTypeEnum.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name={`fields.${index}.description`} render={({ field: formField }) => ( <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea {...formField} value={formField.value ?? ""} placeholder="Instrução para o usuário ou nota." rows={2} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <FormField control={form.control} name={`fields.${index}.isVisible`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} /></FormControl><FormLabel className="text-sm mb-0">Visível no Formulário?</FormLabel></FormItem> )} />
                                        <FormField control={form.control} name={`fields.${index}.isRequired`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} /></FormControl><FormLabel className="text-sm mb-0">Campo Obrigatório?</FormLabel></FormItem> )} />
                                        <FormField control={form.control} name={`fields.${index}.isUnique`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} /></FormControl><FormLabel className="text-sm mb-0">Valor Único?</FormLabel></FormItem> )} />
                                         {(field.fieldType === 'cnpj') && (
                                            <FormField control={form.control} name={`fields.${index}.validationConfig.active`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md bg-sky-50 dark:bg-sky-900/30"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} /></FormControl><FormLabel className="text-sm mb-0">Ativar Validação?</FormLabel></FormItem> )}/>
                                        )}
                                    </div>
                                </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        )
                    }}
                />
              )}
            </CardContent>
            <CardFooter className="flex-col sm:flex-row sm:justify-end border-t pt-6">
                <Button type="submit" disabled={isPageEffectivelyDisabled || !form.formState.isDirty} className="w-full sm:w-auto">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Save className="mr-2 h-4 w-4" /> Salvar Campos</Button>
            </CardFooter>
          </fieldset>
        </form>
      </Form>
    </Card>
  );
}
