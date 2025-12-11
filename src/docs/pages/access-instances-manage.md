# Documentação da Página: Gestão de Instâncias

Este documento detalha o funcionamento, a estrutura e a lógica da página de "Gestão de Instâncias", localizada em `src/app/[locale]/(app)/access/instances/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Gestão de Instâncias** é o painel de controle principal para o Administrador Master. Sua função é listar todas as instâncias (clientes) do sistema, permitindo visualizar informações essenciais, pesquisar, e acessar ações de gerenciamento para cada uma.

Esta página é acessível apenas quando o administrador está atuando no contexto Master Global, garantindo a separação entre a gestão global de instâncias e as operações dentro de uma instância específica.

## 2. Funcionalidades Principais

### a. Listagem e Pesquisa
-   **Visualização em Tabela:** As instâncias são listadas em uma tabela que exibe Nome, Slug, Tipo (Padrão, Dev, Master), Plano, Status e Data de Criação.
-   **Busca Dinâmica:** Uma barra de pesquisa permite filtrar a lista em tempo real por nome, slug ou nome do plano.
-   **Ordenação:** As colunas da tabela podem ser clicadas para ordenar a lista de forma ascendente ou descendente.

### b. Controle de Acesso e Permissões
-   A visibilidade da página e de cada ação é estritamente controlada pelo sistema de permissões (`useUserPermissions`):
    -   `master.instance.view_all`: Necessária para visualizar a lista de instâncias.
    -   `master.instance.create`: Habilita o botão "Criar Nova Instância".
    -   `master.instance.edit_details`: Habilita a ação de "Editar" no menu de cada instância.
    -   `master.instance.delete`: Habilita a ação de "Excluir".
    -   `instance.users.view_list`: Habilita a ação "Gerenciar Usuários".

### c. Ações por Instância
Cada instância na tabela possui um conjunto de ações rápidas:

-   **Atuar Como (`<Eye />`):** Esta é a ação principal. Ao clicar, o administrador assume a "identidade" daquela instância, e toda a aplicação passa a operar dentro do contexto daquele cliente. Uma barra de notificação no topo da tela indicará que ele está "Atuando como" e permitirá que ele volte ao contexto Master.
-   **Menu de Ações (`<MoreVertical />`):** Agrupa as ações secundárias em um dropdown:
    -   **Gerenciar Usuários:** Leva para a página de gerenciamento de usuários específica daquela instância.
    -   **Editar:** Redireciona para a página de edição detalhada da instância.
    -   **Excluir:** Permite excluir a instância após uma caixa de diálogo de confirmação.

## 3. Padrões de Design e UI
-   **Layout Padrão:** A página segue estritamente o `page-creation-standard.md`, com o `<Card>` como contêiner principal e um cabeçalho responsivo que acomoda o título e o botão de ação.
-   **Feedback ao Usuário:**
    -   Um estado de carregamento (`<Loader2 />`) é exibido enquanto os dados são buscados.
    -   Se nenhuma instância for encontrada, uma mensagem informativa é exibida.
    -   Alertas de permissão são mostrados se o usuário não tiver o acesso necessário.
    -   O status e o tipo da instância são exibidos com componentes `<Badge>` coloridos para fácil identificação.

## 4. Código-Fonte da Página

```tsx
// src/app/[locale]/(app)/access/instances/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Loader2, PlusCircle, Eye, ShieldCheck, AlertTriangle, Globe, Search, MoreVertical, Edit, Trash2, ArrowUp, ArrowDown, Users, CreditCard, Server, Code, Star } from 'lucide-react';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import Link from 'next/link';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogBoxDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/nx-use-toast';
import type { Plan } from '../../settings/plans/types';
import { refs } from '@/lib/firestore-refs';
import { BackButton } from "@/components/ui/back-button";
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface Instance {
  id: string;
  instanceName: string;
  slug: string;
  status: boolean;
  instanceType?: 'default' | 'dev' | 'master';
  createdAt?: Timestamp;
  planId?: string; 
}

type SortKey = 'instanceName' | 'instanceType' | 'planId' | 'createdAt';

export default function ManageInstancesPage() {
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { isActingAsMaster, setActingAs } = useInstanceActingContext();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const { actingAsInstanceId } = useInstanceActingContext();

  const canViewInstances = hasPermission('master.instance.view_all');
  const canCreateInstance = hasPermission('master.instance.create');
  const canEditInstance = hasPermission('master.instance.edit_details');
  const canDeleteInstance = hasPermission('master.instance.delete');
  const canManageInstanceUsers = hasPermission('instance.users.view_list');
  
  const plansMap = useMemo(() => {
    return new Map(plans.map(plan => [plan.id, plan.planName]));
  }, [plans]);

  useEffect(() => {
    if (!canViewInstances || !isActingAsMaster) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    
    const instancesQuery = query(refs.instances(), orderBy("createdAt", "desc"));
    const unsubInstances = onSnapshot(instancesQuery, (snapshot) => {
      const fetchedInstances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instance));
      setInstances(fetchedInstances);
      if(plans.length > 0 || snapshot.empty) setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching instances: ", error);
      toast({ title: "Erro ao carregar instâncias", variant: "destructive" });
      setIsLoadingData(false);
    });

    const plansQuery = query(refs.master.plans(), orderBy("order", "asc"));
    const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
        const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
        setPlans(fetchedPlans);
        if(instances.length > 0 || snapshot.empty) setIsLoadingData(false);
    }, (error) => {
        console.error("Error fetching plans: ", error);
        toast({ title: "Erro ao carregar planos", variant: "destructive" });
        setIsLoadingData(false);
    });

    return () => {
        unsubInstances();
        unsubPlans();
    };
  }, [canViewInstances, isActingAsMaster, toast]);
  
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedInstances = useMemo(() => {
    let sortableItems = instances.filter(instance =>
        instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (instance.planId && plansMap.get(instance.planId)?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      let comparison = 0;
      if (sortConfig.key === 'planId') {
        const aPlanName = a.planId ? plansMap.get(a.planId) || '' : '';
        const bPlanName = b.planId ? plansMap.get(b.planId) || '' : '';
        comparison = aPlanName.localeCompare(bPlanName);
      } else if (aVal === undefined || aVal === null) {
        comparison = 1;
      } else if (bVal === undefined || bVal === null) {
        comparison = -1;
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal instanceof Timestamp && bVal instanceof Timestamp) {
        comparison = aVal.toMillis() - bVal.toMillis();
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sortableItems;
  }, [searchTerm, instances, plansMap, sortConfig]);

  const handleDeleteInstance = async () => {
    if (!instanceToDelete || !canDeleteInstance) {
        toast({ title: "Ação não permitida", variant: "destructive" });
        return;
    }
    setIsDeleting(true);
    try {
        await deleteDoc(refs.instanceDoc(instanceToDelete.id));
        toast({ title: "Instância Excluída", description: `A instância "${instanceToDelete.instanceName}" foi removida.`});
        setInstanceToDelete(null);
    } catch (error) {
        console.error("Error deleting instance: ", error);
        toast({ title: "Erro ao excluir", description: "Não foi possível remover a instância.", variant: "destructive"});
    } finally {
        setIsDeleting(false);
    }
  };
  
  const getInstanceTypeProps = (type?: string) => {
    switch (type) {
        case 'dev':
            return { label: 'Dev', Icon: Code, className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' };
        case 'master':
            return { label: 'Master', Icon: Star, className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' };
        default:
            return { label: 'Padrão', Icon: Server, className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700' };
    }
  }


  if (isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2">
                <div>
                    <CardTitle className="section-title !border-none !pb-0">
                        <Building className="section-title-icon" />
                        Gestão de Instâncias
                    </CardTitle>
                    <CardDescription>
                        Crie, visualize e gerencie as diferentes instâncias de cliente do sistema.
                    </CardDescription>
                </div>
                 {canCreateInstance && (
                    <Button asChild className="shrink-0 w-full md:w-auto">
                        <Link href={`/${locale}/access/instances/create`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Nova Instância
                        </Link>
                    </Button>
                )}
            </div>
             {!isActingAsMaster ? (
             <Alert variant="default" className="mt-3 text-sm bg-sky-50 border-sky-300 dark:bg-sky-900/30 dark:border-sky-700">
              <AlertTriangle className="h-4 w-4 !text-sky-600 dark:!text-sky-400" />
              <AlertTitle className="font-semibold text-sky-700 dark:text-sky-300">Contexto de Instância</AlertTitle>
              <AlertBoxDescription className="text-sky-600 dark:text-sky-400">
                A gestão de instâncias é uma funcionalidade do nível Master. Você está atualmente atuando como uma instância.
              </AlertBoxDescription>
            </Alert>
          ) : !canViewInstances ? (
             <Alert variant="destructive" className="mt-3 text-sm">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle className="font-semibold">Permissão Necessária</AlertTitle>
              <AlertBoxDescription>
                Você não tem permissão ('master.instance.view_all') para visualizar instâncias.
              </AlertBoxDescription>
            </Alert>
          ) : null}
        </CardHeader>
        <CardContent>
          {isActingAsMaster && canViewInstances && (
            <>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                 <div className="relative w-full md:w-1/2 lg:w-1/3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, slug ou plano..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {isLoadingData ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : filteredAndSortedInstances.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{searchTerm ? "Nenhuma instância encontrada para sua busca." : "Nenhuma instância cadastrada."}</p>
            ) : (
              <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('instanceName')}>
                        Nome da Instância
                        {sortConfig.key === 'instanceName' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('instanceType')}>
                        Tipo
                        {sortConfig.key === 'instanceType' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('planId')}>
                        Plano
                        {sortConfig.key === 'planId' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                        Criada em
                        {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                       </Button>
                    </TableHead>
                    <TableHead className="table-header-actions text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedInstances.map((instance) => {
                    const typeProps = getInstanceTypeProps(instance.instanceType);
                    return (
                        <TableRow key={instance.id}>
                          <TableCell className="table-cell-main">
                            <p>{instance.instanceName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{instance.slug}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("flex items-center gap-1.5 w-fit", typeProps.className)}>
                                <typeProps.Icon className="h-3 w-3" />
                                {typeProps.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {instance.planId ? (
                               <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                                    <CreditCard className="h-3.5 w-3.5"/>
                                    {plansMap.get(instance.planId) || instance.planId}
                               </Badge>
                            ) : (
                               <span className="text-xs text-muted-foreground">Nenhum</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={instance.status ? "success" : "secondary"}>
                              {instance.status ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {instance.createdAt ? format(instance.createdAt.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}
                          </TableCell>
                          <TableCell className="table-cell-actions">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 dark:text-blue-400" onClick={() => setActingAs(instance.id, instance.instanceName)} aria-label={`Atuar como ${instance.instanceName}`}>
                               <Eye className="h-4 w-4"/>
                               <span className="sr-only">Atuar como</span>
                             </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu de ações</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild disabled={!canManageInstanceUsers}>
                                      <Link href={`/${locale}/instances/${instance.id}/users`}>
                                        <Users className="mr-2 h-4 w-4"/>
                                        <span>Gerenciar Usuários</span>
                                      </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild disabled={!canEditInstance}>
                                    <Link href={`/${locale}/access/instances/${instance.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>Editar</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setInstanceToDelete(instance)} disabled={!canDeleteInstance || isDeleting} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
            </>
          )}
        </CardContent>
        {isActingAsMaster && canViewInstances && instances.length > 0 && (
          <CardFooter>
              <p className="text-xs text-muted-foreground">
                  Total de instâncias: {filteredAndSortedInstances.length}.
              </p>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={!!instanceToDelete} onOpenChange={(open) => !open && setInstanceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogBoxDesc>
              Tem certeza que deseja excluir a instância "{instanceToDelete?.instanceName}"? Esta ação é irreversível e removerá todos os dados associados a ela.
            </AlertDialogBoxDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInstance} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```