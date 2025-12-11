# Documentação da Página: Editar Instância

Este documento detalha o funcionamento e a lógica da página de "Editar Instância", localizada em `src/app/[locale]/(app)/access/instances/[instanceId]/edit/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Editar Instância** é a central de gerenciamento para uma instância específica. Ela permite a edição de detalhes, a gestão de usuários e, crucialmente, o gerenciamento de sub-instâncias.

A página utiliza um sistema de abas para organizar as diferentes seções de gerenciamento.

## 2. Funcionalidades Detalhadas

### a. Aba "Detalhes"
-   Permite a edição das informações principais da instância, como Nome, Tipo, Plano associado, Domínio Personalizado e Status.
-   O campo "Slug" é exibido, mas desabilitado, pois não pode ser alterado após a criação.
-   A lógica de permissão (`canEditDetails`) controla se o formulário está habilitado ou em modo somente leitura.

### b. Aba "Usuários"
-   Esta aba serve como um portal para a página de gerenciamento de usuários da instância.
-   Um botão "Gerenciar Usuários" leva o administrador para a rota `/instances/[instanceId]/users`, onde ele pode ver, convidar e gerenciar os usuários pertencentes àquela instância.
-   O acesso a esta funcionalidade é controlado pela permissão `instance.users.view_list`.

### c. Aba "Sub-Instâncias"
-   Esta é a seção para gerenciar a hierarquia de entidades dentro da instância principal.
-   **Listagem e Pesquisa:** Exibe uma tabela com todas as sub-instâncias criadas, com uma barra de busca para filtragem rápida.
-   **Criação:** Um botão "Criar Sub-instância" leva para um formulário de criação dedicado.
-   **Ações:** Para cada sub-instância na lista, estão disponíveis as seguintes ações:
    -   **Atuar Como (`<Eye />`):** Permite que o administrador Master "entre" no contexto da sub-instância. A URL é atualizada com o parâmetro `?subInstanceId=...` e a aplicação inteira passa a operar sob a perspectiva daquela sub-instância.
    -   **Editar:** Leva para a página de edição da sub-instância.
    -   **Excluir:** Permite a exclusão da sub-instância.

## 3. Lógica Contextual
-   **Carregamento de Dados:** Ao carregar, a página usa `onSnapshot` para buscar e ouvir em tempo real as atualizações dos dados da instância principal e da lista de sub-instâncias.
-   **Controle de Abas:** O estado da aba ativa é controlado via `searchParams` na URL (`?tab=...`), garantindo que o estado seja preservado ao recarregar ou compartilhar o link.
-   **Permissões:** O hook `useUserPermissions` é usado extensivamente para habilitar ou desabilitar botões e seções inteiras com base nas permissões do administrador logado.

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/access/instances/[instanceId]/edit/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { onSnapshot, updateDoc, serverTimestamp, query, orderBy, where, deleteDoc, Timestamp, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useDebounce } from '@/hooks/use-debounce';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
// ... (outras importações)
import { refs } from '@/lib/firestore-refs'; 
import type { SubInstance } from './types';

// ... (schemas e lógica do componente) ...
```