# Documentação da Página: Criar Nova Instância

Este documento detalha o funcionamento e a lógica da página de "Criar Nova Instância", localizada em `src/app/[locale]/(app)/access/instances/create/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Criar Nova Instância** é uma ferramenta de nível **Master** que permite ao administrador do sistema registrar um novo cliente ou ambiente na plataforma.

As principais funcionalidades incluem:
-   Definição do nome e do slug (identificador de URL).
-   Geração automática de slug a partir do nome.
-   Verificação de disponibilidade do slug em tempo real.
-   Associação de um Plano de Assinatura.
-   Definição do tipo e status da instância.

## 2. Lógica de Funcionamento

### a. Geração e Validação de Slug
-   **Geração Automática:** Conforme o administrador digita o "Nome da Instância", um hook `useEffect` com um `setTimeout` (debounce) aguarda um momento e chama uma Server Action de IA (`translateToEnglish`) para traduzir o nome e convertê-lo em um formato de slug (minúsculas, hífens).
-   **Verificação em Tempo Real:** Outro `useEffect` usa o hook `useDebounce` para monitorar o campo "Slug". A cada alteração, ele aguarda 500ms e faz uma consulta ao Firestore para verificar se o slug digitado já está em uso. Uma mensagem de erro é exibida se o slug não estiver disponível.
-   **Travas:** A geração automática é interrompida se o usuário começar a editar o campo de slug manualmente (`formState.dirtyFields.slug`).

### b. Associação de Planos
-   A lista de "Planos" é preenchida dinamicamente buscando todos os planos com status "ativo" da coleção `Global/master/plans`. Isso garante que apenas planos válidos possam ser associados a novas instâncias.

### c. Submissão do Formulário
-   Ao salvar, o formulário realiza uma última verificação de disponibilidade do slug para evitar condições de corrida.
-   Se tudo estiver correto, um novo documento é criado na coleção `Global` com o slug como ID do documento, contendo todos os dados da nova instância.

## 3. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/access/instances/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setDoc, serverTimestamp, getDocs, query, where, limit, doc, onSnapshot } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, PlusSquare, ShieldCheck, Star, Code, Server, CreditCard, Save } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useDebounce } from '@/hooks/use-debounce';
import { refs } from '@/lib/firestore-refs';
import { BackButton } from '@/components/ui/back-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Plan } from '@/app/[locale]/(app)/settings/plans/types';
import { translateToEnglish } from '@/ai/flows/translate-to-english-flow