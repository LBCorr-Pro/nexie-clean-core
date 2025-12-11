# Documentação da Página: Cadastrar Nova Empresa Global

Este documento detalha o funcionamento e a lógica da página de "Cadastrar Nova Empresa Global", localizada em `src/app/[locale]/(app)/companies/create/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Cadastrar Nova Empresa Global** é a interface dedicada para adicionar novas empresas diretamente ao nível **Master** do sistema. Essas empresas não estão vinculadas a nenhuma instância específica.

O formulário exibido nesta página é **dinâmico**, construído com base nas configurações definidas em "Configurações > Definições de Cadastro > Campos de Cadastro (Empresa)". Isso garante que o formulário de criação seja sempre consistente com as regras de negócio atuais.

## 2. Lógica de Funcionamento

### a. Geração Dinâmica do Formulário
Ao carregar, a página executa os seguintes passos:
1.  **Busca Configurações:** Busca as configurações de campos do Firestore (de `Global/master/config/company_registration_settings/field_configs`).
2.  **Constrói o Schema de Validação (Zod):** Com base nos campos configurados como visíveis e obrigatórios, constrói um schema de validação Zod dinamicamente. Isso inclui validações específicas para CNPJ, se ativadas.
3.  **Define Valores Padrão:** Preenche o formulário com valores padrão (ex: Status "Ativo").
4.  **Renderiza os Campos:** Itera sobre os campos configurados como visíveis e renderiza o componente de input apropriado para cada um (ex: `<Input />`, `<CnpjInput />`, `<ImageUploadField />`). O agrupamento visual dos campos de endereço também é feito nesta etapa.

### b. Processo de Submissão
Ao submeter o formulário:
1.  **Validação:** Os dados são validados contra o schema Zod gerado dinamicamente.
2.  **Criação no Firestore:** Os dados da empresa são salvos em um novo documento na coleção `/companies`.
3.  **Redirecionamento:** O administrador é redirecionado de volta para a lista de empresas globais com uma mensagem de sucesso.

## 3. Padrões de Design e UI
-   **Layout Padrão:** A página segue estritamente o `page-creation-standard.md`, com o `<Card>` como contêiner, um cabeçalho responsivo e um `<BackButton>` posicionado corretamente.
-   **Feedback ao Usuário:** Indicadores de carregamento (`<Loader2 />`) e mensagens de `toast` são usados para informar o usuário sobre o status das operações.
-   **Componentes Reutilizáveis:** O formulário faz uso extensivo dos componentes de `components/shared/form` para garantir consistência visual e funcional (ex: `CnpjInput`, `ImageUploadField`).

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/companies/create/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, Timestamp, doc, getDoc, FieldPath } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useRouter, useParams } from "next/navigation";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useUserPermissions } from '@/hooks/use-user-permissions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusSquare, Info, AlertTriangle, Save, Loader2, Briefcase, ShieldCheck, ArrowLeft, Globe, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import Link from 'next/link'; 
import { refs } from '@/lib/firestore-refs';
import { CnpjInput } from '@/components/shared/form/CnpjInput';
import { isValidCPF, isValidCnpj } from '@/lib/utils';
import { BackButton } from '@/components/ui/back-button';
import { Separator } from '@/components/ui/separator';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { Switch } from '@/components/ui/switch';

interface FieldConfig {
  key: string; 
  label: string;
  fieldType: "text" | "number" | "email" | "date" | "url" | "dropdown" | "checkbox" | "switch" | "file" | "cnpj" | "address_group" | "textarea" | "social";
  isVisible: boolean;
  isRequired: boolean;
  order: number;
  description?: string;
  options?: { value: string; label: string }[];
  validationConfig?: { active?: boolean };
}

const PREDEFINED_FIELDS_META: Array<{
  key: string;
  label: string;
  isAddressSubField?: boolean;
}> = [
    { key: "companyName", label: "Nome Fantasia" },
    { key: "legalName", label: "Razão Social" },
    { key: "cnpj", label: "CNPJ" },
    { key: "status", label: "Status" },
    { key: "companyLogoUrl", label: "Logo da Empresa" },
    { key: "companyEmail", label: "E-mail da Empresa" },
    { key: "socialLinks", label: "Redes Sociais" },
    { key: "companyPhone", label: "Telefone da Empresa" },
    { key: "primaryContact", label: "Responsável Primário" },
    { key: "companyWebsite", label: "Site da Empresa" },
    { key: "secondaryContact", label: "Responsável Secundário" },
    { key: "companyAddress", label: "Endereço da Empresa" },
    { key: "addressCep", label: "CEP", isAddressSubField: true },
    { key: "addressStreet", label: "Rua", isAddressSubField: true },
    { key: "addressNumber", label: "Número", isAddressSubField: true },
    { key: "addressComplement", label: "Complemento", isAddressSubField: true },
    { key: "addressDistrict", label: "Bairro", isAddressSubField: true },
    { key: "addressCity", label: "Cidade", isAddressSubField: true },
    { key: "addressState", label: "Estado", isAddressSubField: true },
    { key: "addressCountry", label: "País", isAddressSubField: true },
];

const getZodTypeFromFieldConfig = (config: FieldConfig): z.ZodTypeAny => {
  let zodType: z.ZodTypeAny;
  switch (config.fieldType) {
    case "text":
    case "textarea":
    case "file":
    case "social":
      zodType = z.string();
      break;
    case "cnpj":
        zodType = z.string();
        if (config.validationConfig?.active) {
            zodType = zodType.refine(val => val === '' || val === null || val === undefined || isValidCnpj(val), { message: `${config.label} é um CNPJ inválido.` });
        }
      break;
    case "url":
      zodType = z.string().url({ message: `${config.label} deve ser uma URL válida.` });
      break;
    case "number":
      zodType = z.coerce.number();
      break;
    case "email":
      zodType = z.string().email({ message: `${config.label} deve ser um e-mail válido.` });
      break;
    case "date":
      zodType = z.string(); 
      break;
    case "dropdown":
      const enumValues = config.options?.map(opt => opt.value) || [];
      if (enumValues.length > 0) {
        zodType = z.enum(enumValues as [string, ...string[]]);
      } else {
        zodType = z.string(); 
      }
      break;
    case "checkbox":
    case "switch":
      zodType = z.boolean();
      break;
    case "address_group": 
      // Esta lógica agora será tratada de forma diferente na construção do schema principal
      return z.object({}).passthrough(); 
    default:
      zodType = z.string();
  }

  if (config.isRequired && zodType instanceof z.ZodString) {
      return zodType.min(1, `${config.label} é obrigatório.`);
  }

  if (!config.isRequired) {
    return zodType.optional().or(z.literal('')); 
  }
  
  return zodType;
};


export default function CreateCompanyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams(); 
  const locale = params.locale as string;
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();

  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const dynamicSchema = useMemo(() => {
    if (fieldConfigs.length === 0) return z.object({});
    
    const shape: Record<string, z.ZodTypeAny> = {};
    const addressSubFields = fieldConfigs.filter(fc => PREDEFINED_FIELDS_META.find(m => m.key === fc.key)?.isAddressSubField && fc.isVisible);
    const addressGroupField = fieldConfigs.find(fc => fc.key === 'companyAddress' && fc.isVisible);

    // Process main fields (non-address)
    fieldConfigs.filter(fc => fc.isVisible && !PREDEFINED_FIELDS_META.find(m => m.key === fc.key)?.isAddressSubField && fc.key !== 'companyAddress').forEach(config => {
      shape[config.key] = getZodTypeFromFieldConfig(config);
    });

    // Process address fields
    if (addressGroupField && addressSubFields.length > 0) {
        const addressShape: Record<string, z.ZodTypeAny> = {};
        addressSubFields.forEach(config => {
            const subKey = config.key.replace('address', '').charAt(0).toLowerCase() + config.key.replace('address', '').slice(1);
            addressShape[subKey] = getZodTypeFromFieldConfig(config);
        });
        shape.address = z.object(addressShape);
        if(!addressGroupField.isRequired){
            shape.address = shape.address.optional().nullable();
        }
    }

    return z.object(shape);
  }, [fieldConfigs]);

  const defaultValues = useMemo(() => {
    if (fieldConfigs.length === 0) return {};
    const defaults: Record<string, any> = {};
    fieldConfigs.filter(fc => fc.isVisible).forEach(config => {
        const meta = PREDEFINED_FIELDS_META.find(m => m.key === config.key);
        if (meta?.isAddressSubField) {
            if(!defaults.address) defaults.address = {};
            const subKey = config.key.replace('address', '').charAt(0).toLowerCase() + config.key.replace('address', '').slice(1);
            defaults.address[subKey] = '';
        } else if (config.key !== 'companyAddress') {
            defaults[config.key] = config.fieldType === 'checkbox' || config.fieldType === 'switch' ? false : '';
        }
    });
    // Adiciona o status como padrão
    defaults.status = true;
    return defaults;
  }, [fieldConfigs]);

  const form = useForm<any>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(defaultValues); 
  }, [defaultValues, dynamicSchema, form]);

  useEffect(() => {
    async function fetchFieldConfigs() {
      setIsLoadingSchema(true);
      try {
        const q = query(refs.master.companyRegistrationFields(), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        const fetchedConfigs = snapshot.docs.map(docSnap => ({ key: docSnap.id, ...docSnap.data() } as FieldConfig));
        setFieldConfigs(fetchedConfigs);
      } catch (error) {
        toast({ title: "Erro ao carregar campos", variant: "destructive" });
      } finally {
        setIsLoadingSchema(false);
      }
    }
    if (isActingAsMaster && !actingAsInstanceId) { 
        fetchFieldConfigs();
    } else {
        setIsLoadingSchema(false);
    }
  }, [toast, isActingAsMaster, actingAsInstanceId]);

  const canCreateCompanies = hasPermission('master.companies.create');
  const pageEffectivelyDisabled = isLoadingSchema || isLoadingPermissions || !isActingAsMaster || !!actingAsInstanceId || !canCreateCompanies;


  const onInvalid = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
        const element = document.getElementsByName(firstErrorKey)[0];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => element.focus(), 500);
        }
    }
    toast({ title: "Erro de Validação", description: "Corrija os campos marcados.", variant: "destructive" });
  };

  const onSubmit = async (data: Record<string, any>) => {
    if (pageEffectivelyDisabled) return;
    setIsSaving(true);
    const companyData: Record<string, any> = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const config = fieldConfigs.find(fc => fc.key === key || key === 'address');
        if (config && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
          companyData[key] = data[key];
        }
      }
    }
    companyData.createdAt = serverTimestamp();
    companyData.updatedAt = serverTimestamp();
    companyData.status = data.status === undefined ? true : data.status;

    try {
      await addDoc(refs.companies(), companyData);
      toast({ title: "Empresa Cadastrada!", description: `A empresa ${companyData.companyName || companyData.legalName || 'Nova Empresa'} foi adicionada.` });
      form.reset(defaultValues);
      router.push(`/${locale}/companies`);
    } catch (error: any) {
      toast({ title: "Erro ao Cadastrar Empresa", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const visibleFormFields = fieldConfigs.filter(fc => fc.isVisible && !PREDEFINED_FIELDS_META.find(m => m.key === fc.key)?.isAddressSubField && fc.key !== 'companyAddress');
  const addressGroupConfig = fieldConfigs.find(fc => fc.key === 'companyAddress' && fc.isVisible);
  const visibleAddressSubFields = fieldConfigs.filter(fc => PREDEFINED_FIELDS_META.find(m => m.key === fc.key)?.isAddressSubField && fc.isVisible);

  if (isLoadingPermissions) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (isActingAsMaster && actingAsInstanceId) {
     return (
      <Card>
        <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-6 w-6"/>Acesso Restrito</CardTitle></CardHeader>
        <CardContent>
            <Alert variant="default" className="mt-3 text-sm bg-sky-50 border-sky-300 dark:bg-sky-900/30 dark:border-sky-700">
              <Globe className="h-4 w-4 !text-sky-600 dark:!text-sky-400" /><AlertTitle className="font-semibold text-sky-700 dark:text-sky-300">Contexto Master Necessário</AlertTitle><AlertBoxDescription className="text-sky-600 dark:text-sky-400">O cadastro de empresas globais é exclusivo do contexto Master.</AlertBoxDescription>
            </Alert>
            <Button onClick={() => router.back()} variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!canCreateCompanies && isActingAsMaster && !actingAsInstanceId) {
     return (
      <Card>
        <CardHeader><CardTitle className="flex items-center text-destructive"><ShieldCheck className="mr-2 h-6 w-6"/>Permissão Necessária</CardTitle><CardDescription>Você não tem permissão ('master.companies.create') para cadastrar novas empresas.</CardDescription></CardHeader>
         <CardContent><Button onClick={() => router.back()} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button></CardContent>
      </Card>
    );
  }

  if (fieldConfigs.length > 0 && visibleFormFields.length === 0 && !addressGroupConfig) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center"><Info className="mr-2 h-6 w-6 text-orange-500"/>Campos Não Configurados</CardTitle><CardDescription>Nenhum campo de cadastro está configurado. Ajuste em "Configurar Campos de Cadastro (Empresa)".</CardDescription></CardHeader>
         <CardContent><Button asChild variant="default"><Link href={`/${locale}/access/company-registration-fields-settings`}>Configurar Campos</Link></Button></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
       <CardHeader className="relative">
            <BackButton href={`/${locale}/companies`} className="absolute right-6 top-3"/>
            <div className="pt-2"> 
                <CardTitle className="section-title !border-none !pb-0">
                    <Briefcase className="section-title-icon" />
                    Cadastrar Nova Empresa Global
                </CardTitle>
                <CardDescription>Preencha os campos para adicionar uma nova empresa no nível Master.</CardDescription>
            </div>
        </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
          <fieldset disabled={pageEffectivelyDisabled || isSaving}>
            <CardContent className="space-y-6">
              {isLoadingSchema ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>))}
                </div>
              ) : (
                <>
                  {visibleFormFields.map(config => (
                    <FormField
                      key={config.key}
                      control={form.control}
                      name={config.key}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{config.label} {config.isRequired && <span className="text-destructive">*</span>}</FormLabel>
                          <FormControl>
                            {config.fieldType === "textarea" ? (
                              <Textarea placeholder={config.description || `Digite ${config.label.toLowerCase()}`} {...field} />
                            ) : config.fieldType === "dropdown" && config.options ? (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder={`Selecione ${config.label.toLowerCase()}`} /></SelectTrigger>
                                <SelectContent>{config.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                              </Select>
                            ) : config.fieldType === "cnpj" ? (
                              <CnpjInput {...field} value={field.value || ''} onChange={field.onChange} />
                            ) : config.fieldType === "file" ? (
                              <ImageUploadField
                                  value={field.value}
                                  onChange={field.onChange}
                                  aihint="company logo"
                                  contextPath="company_assets/logos"
                                  disabled={isSaving}
                              />
                            ) : config.fieldType === "switch" ? (
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            ) : (
                              <Input
                                type={config.fieldType === "email" ? "email" : config.fieldType === "number" ? "number" : config.fieldType === "url" ? "url" : "text"}
                                placeholder={config.description || `Digite ${config.label.toLowerCase()}`}
                                {...field}
                              />
                            )}
                          </FormControl>
                          {config.description && config.fieldType !== "textarea" && <FormDescription>{config.description}</FormDescription>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  {addressGroupConfig && visibleAddressSubFields.length > 0 && (
                    <div className="space-y-4 pt-4 mt-6 border-t">
                      <h3 className="text-md font-medium flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary/80" />{addressGroupConfig.label} {addressGroupConfig.isRequired && <span className="text-destructive ml-1">*</span>}</h3>
                      {addressGroupConfig.description && <p className="text-sm text-muted-foreground -mt-3 mb-3">{addressGroupConfig.description}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleAddressSubFields.map(config => {
                           const subKey = config.key.replace('address','').charAt(0).toLowerCase() + config.key.replace('address','').slice(1);
                           return (
                               <FormField
                                 key={config.key}
                                 control={form.control}
                                 name={`address.${subKey}`}
                                 render={({ field }) => (
                                   <FormItem>
                                     <FormLabel>{config.label} {config.isRequired && <span className="text-destructive">*</span>}</FormLabel>
                                     <FormControl>
                                       <Input placeholder={config.description || `Digite ${config.label.toLowerCase()}`} {...field} value={field.value || ''} />
                                     </FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )}
                               />
                           )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex-col sm:flex-row sm:justify-end border-t pt-6">
              <Button type="submit" disabled={pageEffectivelyDisabled || isSaving} className="w-full sm:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Nova Empresa
              </Button>
            </CardFooter>
          </fieldset>
        </form>
      