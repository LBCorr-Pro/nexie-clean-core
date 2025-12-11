# Guia Definitivo de Migração para a Arquitetura "NX"

Este documento é o guia oficial e obrigatório para refatorar páginas e funcionalidades existentes para a arquitetura "NX", o padrão de desenvolvimento do sistema Nexie. Seguir estes passos garante a conformidade com os princípios de modularidade, manutenibilidade e consistência.

---

## O Objetivo

Migrar uma página para a arquitetura "NX" significa:
1.  **Centralizar a Lógica:** Mover toda a UI e lógica de negócio para a pasta `/src/modules`.
2.  **Simplificar o Roteamento:** Usar a pasta `/src/app` apenas para "proxies" que apontam para os componentes reais.
3.  **Padronizar a Implementação:** Garantir que a página adote todos os padrões do sistema, como i18n, permissões e formatação de dados.

## Fluxo de Trabalho de Migração (Passo a Passo)

### Passo 1: Preparação e Estrutura de Arquivos (Proxy)

**Onde começar? Na estrutura de arquivos.**

1.  **Identifique a Funcionalidade:** Escolha a página a ser migrada (ex: `access/instances`).
2.  **Crie a Pasta do Módulo:** Crie uma nova pasta em `/src/modules/` que represente a funcionalidade (ex: `/src/modules/instance-management/`).
3.  **Mova o Código "Real":** Mova o arquivo `page.tsx` (e seus `components`, se houver) da pasta `/src/app/...` para a nova pasta em `/src/modules/...`. Este se torna o componente "real".
4.  **Crie o Arquivo "Proxy":** No local original em `/src/app/.../page.tsx`, substitua todo o conteúdo pelo código do proxy, que apenas importa e re-exporta o componente "real".
    ```tsx
    // Ex: /src/app/[locale]/(app)/access/instances/page.tsx
    "use client";
    import InstanceManagementPage from '@/modules/instance-management/page';
    export default InstanceManagementPage;
    ```
5.  **Declare o Padrão "Client-Side First":** Certifique-se de que o componente "real" (`/src/modules/.../page.tsx`) tenha a diretiva `"use client";` no topo.

### Passo 2: Internacionalização (i18n)

**Onde? No componente "real" em `/src/modules/...`**

1.  **Remova Textos Fixos:** Substitua **todo** o texto visível na UI (títulos, descrições, labels de botões, etc.) por chamadas ao hook `useTranslations`.
    ```tsx
    import { useTranslations } from 'next-intl';
    
    // ... dentro do componente
    const t = useTranslations('instanceManagement'); // 'instanceManagement' é o namespace
    
    // ... no JSX
    <CardTitle>{t('title')}</CardTitle>
    ```
2.  **Atualize os Arquivos de Localidade:** Adicione o novo namespace e todas as chaves de tradução aos arquivos na pasta `/locales` na raiz do projeto (`pt-BR.json`, `en.json`, `es.json`).

### Passo 3: Formatação de Dados (Datas e Moedas)

**Onde? No componente "real" em `/src/modules/...`**

1.  **Use o Hook `useFormatters`:** Para qualquer data, hora ou valor monetário exibido, utilize o hook `useFormatters` para garantir a formatação correta de acordo com o idioma do usuário.
    ```tsx
    import { useFormatters } from '@/hooks/use-formatters';

    // ... dentro do componente
    const { formatDate } = useFormatters();

    // ... no JSX (ex: dentro de uma tabela)
    <TableCell>{formatDate(instance.createdAt)}</TableCell>
    ```

### Passo 4: Verificação de Permissões

**Onde? No componente "real" em `/src/modules/...`**

1.  **Use o Hook `useUserPermissions`:** Importe o hook para obter a função `hasPermission`.
2.  **Proteja a Página:** Verifique se o usuário tem a permissão principal para visualizar a página. Se não tiver, exiba um componente de "Acesso Negado".
3.  **Proteja as Ações:** Envolva **cada botão ou link** que executa uma ação (Criar, Editar, Excluir, Atuar Como) em uma verificação `hasPermission('permissao.especifica')`. Desabilite o elemento se a permissão for negada.
    ```tsx
    const { hasPermission } = useUserPermissions();
    const canCreate = hasPermission('master.instance.create');

    // ... no JSX
    <Button disabled={!canCreate}>
      Criar Instância
    </Button>
    ```

### Passo 5: Conformidade com Padrões de UI e Hooks

**Onde? No componente "real" em `/src/modules/...`**

1.  **Estrutura da Página:** Garanta que a página segue a estrutura padrão definida em `page-creation-guide.md` (`Card`, `CardHeader` responsivo, `BackButton` no canto superior direito, etc.).
2.  **Hooks Centralizados:** Verifique se a página está usando os hooks corretos para obter seu contexto (ex: `useInstanceActingContext`), em vez de lógica manual.
3.  **Referências do Firestore:** Confirme que **TODAS** as consultas e operações no Firestore estão usando o `refs` de `src/lib/nx-firestore-refs.ts` (ou a versão mais atual).

### Passo 6: Verificação Final (Checklist)

Antes de finalizar, revise o arquivo `check.md` e responda mentalmente a cada um dos pontos para garantir que todos os requisitos da arquitetura foram atendidos. Este é o passo final de garantia de qualidade.

Seguindo este guia, a migração resultará em um código mais limpo, padronizado, seguro e alinhado com a visão de longo prazo do projeto Nexie.
