# Documentação da Página: Módulo de Convites

Este documento detalha o funcionamento e a lógica da página do "Módulo de Convites", localizada em `src/modules/invite/page.tsx`.

---

## 1. Visão Geral e Propósito

A página do **Módulo de Convites** é a interface central para gerenciar o sistema de convites para novos usuários. Ela é projetada para ser sensível ao contexto, permitindo que tanto o Administrador Master quanto os administradores de instância gerenciem os convites e as configurações relevantes para seu escopo de atuação.

A página é dividida em duas abas principais para separar as responsabilidades: **Gerenciar Convites** e **Configurações do Módulo**.

## 2. Aba: Gerenciar Convites

Esta aba é focada na criação e monitoramento de convites.

-   **Gerar Novo Convite:**
    -   **E-mail (Opcional):** Permite vincular um convite a um e-mail específico. Se deixado em branco, o convite é "aberto".
    -   **Nível de Acesso (Opcional):** Permite pré-definir qual nível de acesso o usuário receberá ao se registrar com aquele convite.
    -   **Resultado:** Ao gerar, um modal exibe o código do convite e o link de registro, com botões para copiar facilmente.

-   **Lista de Convites Gerados:**
    -   Uma tabela exibe todos os convites criados para o contexto atual (seja Master ou Instância).
    -   Mostra informações cruciais como o código, status (`pendente`, `aceito`, `revogado`), e-mail do destinatário (se houver), nível de acesso alvo e as datas de criação e expiração.
    -   **Ação de Revogar:** Convites pendentes podem ser revogados, impedindo seu uso.

## 3. Aba: Configurações do Módulo

Esta aba permite personalizar o comportamento dos convites. As configurações podem ser definidas globalmente (pelo Master) ou sobrescritas por instância.

-   **Configurações do Código:**
    -   **Prefixo:** Um texto curto que precede a parte aleatória do código (ex: `EMP-`).
    -   **Tamanho:** O número de caracteres aleatórios no código.

-   **Configurações de Validade:**
    -   Define por quanto tempo um convite será válido (em dias ou horas).

-   **Templates de Mensagem:**
    -   **E-mail e WhatsApp:** Permite personalizar o texto padrão das mensagens de convite, utilizando *placeholders* como `{{user_name}}` e `{{invite_link}}` que serão substituídos dinamicamente.

## 4. Lógica Contextual e Estrutura de Dados

-   **`useInstanceActingContext`:** O hook é usado para determinar se a página está sendo visualizada no contexto Master ou de uma Instância, adaptando a busca e o salvamento de dados.
-   **Herança de Configurações:** Uma instância, por padrão, herda as configurações operacionais do Master. Ao salvar uma configuração pela primeira vez em uma instância, ela cria uma cópia "customizada", permitindo a personalização sem afetar o padrão global.
-   **Armazenamento de Dados:**
    -   **Configurações:** `Global/master/config/modules/invite/settings/{configId}` (e caminhos análogos para instâncias)
    -   **Convites Gerados:** `Global/master/config/modules/invite/generated_invites/{inviteId}` (e caminhos análogos para instâncias)

## 5. Código-Fonte da Página

```tsx
// src/modules/invite/page.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailPlus, Settings, ListChecks } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { SettingsTab } from './components/SettingsTab';
import { ManageInvitesTab } from './components/ManageInvitesTab';

export default function InviteModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') || 'manage_invites';

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="relative">
        <BackButton className="absolute right-6 top-3" />
        <div className="pt-2"> 
            <CardTitle className="section-title !border-none !pb-0">
                <MailPlus className="section-title-icon"/>
                Módulo de Convites
            </CardTitle>
            <CardDescription>
                Gerencie as configurações para geração de convites e visualize os convites já criados.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manage_invites"><ListChecks className="mr-2 h-4 w-4" />Gerenciar Convites</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Configurações do Módulo</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="pt-6">
              <SettingsTab />
            </TabsContent>
            <TabsContent value="manage_invites" className="pt-6">
              <ManageInvitesTab />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```
