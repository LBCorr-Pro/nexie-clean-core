# Documentação da Página: Gerenciar Empresas Globais

Este documento detalha o funcionamento e a lógica da página de "Gerenciar Empresas Globais", localizada em `src/app/[locale]/(app)/companies/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Gerenciar Empresas Globais** é a interface central para a administração de empresas no nível **Master**. Seu propósito é listar todas as empresas cadastradas no sistema que não estão vinculadas a uma instância específica, permitindo que administradores com as permissões corretas possam visualizá-las, pesquisá-las e executar ações.

Esta página é acessível apenas quando o administrador está atuando no contexto Master Global.

## 2. Funcionalidades Principais

### a. Listagem e Pesquisa
-   **Visualização em Tabela:** As empresas são listadas em uma tabela que exibe informações chave como Nome Fantasia, Razão Social, CNPJ, Status e Data de Criação.
-   **Busca Dinâmica:** Uma barra de pesquisa permite filtrar a lista em tempo real por nome, razão social ou CNPJ.
-   **Ordenação:** As colunas da tabela podem ser clicadas para ordenar a lista de forma ascendente ou descendente.

### b. Controle de Acesso e Permissões
-   A visibilidade da página e das ações disponíveis é controlada pelo sistema de permissões:
    -   `master.companies.view`: Necessária para visualizar a lista de empresas.
    -   `master.companies.create`: Habilita o botão "Cadastrar Nova Empresa".
    -   `master.companies.edit`: Habilita a ação de "Editar" para uma empresa.
    -   `master.companies.delete`: Habilita a ação de "Excluir".

### c. Ações
-   **Cadastrar Nova Empresa:** Um botão de ação principal leva para a página `companies/create`.
-   **Editar:** Um botão na linha de cada empresa leva para a página `companies/[companyId]/edit`, onde os dados da empresa podem ser modificados.
-   **Excluir:** Permite a exclusão de uma empresa após uma caixa de diálogo de confirmação.

## 3. Padrões de Design e UI
-   **Layout Padrão:** A página segue o `page-creation-standard.md`, utilizando `<Card>` como contêiner e um cabeçalho responsivo que acomoda o título e o botão de ação.
-   **Feedback ao Usuário:**
    -   Um estado de carregamento (`<Loader2 />`) é exibido enquanto os dados são buscados.
    -   Se nenhuma empresa for encontrada, uma mensagem informativa é exibida.
    -   Alertas de permissão são mostrados se o usuário não tiver o acesso necessário.

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/companies/page.tsx
"use client"; 

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Loader2, PlusCircle, ShieldCheck, AlertTriangle, Globe, Search, MoreVertical, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'; 
import Link from 'next/link';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { useInstanceActingContext } from '@/contexts/instance-acting-context'; 
import { useParams, useRouter } from 'next/navigation'; 
import { refs } from '@/lib/firestore-refs';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/nx-use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// ... (interfaces e lógica do componente) ...

export default function ManageCompaniesPage() {
    // ...
}
```