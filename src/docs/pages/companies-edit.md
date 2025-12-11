# Documentação da Página: Editar Empresa Global

Este documento detalha o funcionamento e a lógica da página de "Editar Empresa Global", localizada em `src/app/[locale]/(app)/companies/[companyId]/edit/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Editar Empresa Global** permite que administradores com a permissão `master.companies.edit` modifiquem os dados de uma empresa existente no nível Master.

Assim como a página de criação, esta interface é construída dinamicamente com base nas configurações definidas em "Campos de Cadastro (Empresa)", garantindo consistência entre a criação e a edição.

## 2. Estrutura e Lógica

### a. Lógica de Carregamento de Dados
Ao carregar, a página executa as seguintes etapas:
1.  **Busca de Dados:** Realiza duas buscas no Firestore para obter:
    -   As configurações de campos de empresa (`company_registration_settings`).
    -   Os dados específicos da empresa que está sendo editada (de `/companies/{companyId}`).
2.  **Construção do Formulário:** Assim como no modo de criação, constrói o schema Zod e os valores padrão, mas desta vez, **popula os campos do formulário com os dados da empresa buscada**.

### b. Processo de Submissão
Ao salvar as alterações, a lógica é projetada para ser robusta e corrigir dados legados:
1.  **Validação:** Os dados do formulário são validados contra o schema Zod dinâmico.
2.  **Atualização Atômica (`writeBatch`):**
    -   A função `onSubmit` utiliza um `writeBatch` para garantir que todas as operações de escrita sejam bem-sucedidas ou nenhuma delas seja aplicada.
    -   **Atualização do Documento Principal:** Ela atualiza o documento principal da empresa em `/companies/{companyId}` com os novos dados.
    -   **Verificação e Criação da Associação:** Ela verifica se o documento de associação correspondente já existe em `/Global/master/companies/{companyId}`. Se não existir (o caso de uma empresa antiga), ele o cria. Isso "conserta" os dados legados de forma transparente.
3.  **Limpeza de Dados:** Antes de salvar, a lógica remove quaisquer campos com valor `undefined` para evitar erros do Firestore.
4.  **Redirecionamento:** Após salvar, o administrador é redirecionado de volta para a página de listagem de empresas.

## 3. Padrões de Design e UI
-   **Layout Padrão:** A página segue o `page-creation-standard.md`, com o `<Card>` como contêiner, um cabeçalho responsivo e um `<BackButton>` posicionado corretamente.
-   **Feedback ao Usuário:** A interface exibe um estado de carregamento enquanto busca os dados e usa `toast` para notificar sobre o sucesso ou falha da operação de salvamento.
-   **Componentes Reutilizáveis:** O formulário faz uso extensivo dos componentes de `components/shared/form` para garantir consistência visual e funcional.

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/companies/[companyId]/edit/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, serverTimestamp, query, orderBy, getDocs, Timestamp, DocumentData, setDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useRouter, useParams } from "next/navigation";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { isValidCnpj } from '@/lib/utils';
import { refs } from '@/lib/firestore-refs';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Briefcase, Info, AlertTriangle, Save, MapPin, Edit } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { CnpjInput } from '@/components/shared/form/CnpjInput';
import { BackButton } from '@/components/ui/back-button';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { Switch } from '@/components/ui/switch';

// --- Types and Schemas ---

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

// ... (Restante da lógica do componente, como getZodTypeFromFieldConfig, etc.)

export default function EditCompanyPage() {
    // ... (Hooks e estados)
  
    const onSubmit = async (data: Record<string, any>) => {
        if (pageEffectivelyDisabled) return;
        setIsSaving(true);
        
        try {
            const batch = writeBatch(db);
            const companyDocRef = doc(refs.companies(), companyId);

            const cleanedData: Record<string, any> = {};
            for (const key in data) {
                if (data[key] !== undefined) {
                    cleanedData[key] = data[key];
                } else {
                    cleanedData[key] = null;
                }
            }

            const dataToUpdate = { ...cleanedData, updatedAt: serverTimestamp() };
            batch.update(companyDocRef, dataToUpdate);

            // Garante que a referência no Master exista
            const masterCompanyRef = doc(refs.master.companies(), companyId);
            const masterCompanySnap = await getDoc(masterCompanyRef);
            if (!masterCompanySnap.exists()) {
                 batch.set(masterCompanyRef, { status: true, createdAt: serverTimestamp() });
            }

            await batch.commit();
            
            toast({ title: "Empresa Atualizada!", description: `Os dados de ${data.companyName || 'Empresa'} foram salvos.` });
            router.push(`/${locale}/companies`);

        } catch (error: any) {
            console.error("Error updating company:", error);
            toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // ... (Restante do componente JSX)
}
```