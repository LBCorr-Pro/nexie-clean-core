# Arquitetura de Rotas: O Padrão "Proxy"

Este documento detalha a estratégia de roteamento adotada no projeto para garantir que o código seja limpo, reutilizável e fácil de manter, seguindo o princípio DRY (Don't Repeat Yourself).

## O Problema: Duplicação de Código em Rotas

Uma aplicação multi-instância complexa frequentemente precisa renderizar a mesma interface em diferentes contextos de URL. Por exemplo, a página de gerenciamento de usuários pode precisar ser acessada por:

-   Um administrador Master: `/users`
-   Um administrador de instância: `/instances/{id}/users`

A abordagem ingênua seria criar componentes de página separados para cada uma dessas rotas, resultando em uma duplicação massiva de código. Manter esses arquivos sincronizados se tornaria um pesadelo.

## A Solução: Componentes "Reais" e "Proxies"

Para resolver isso, adotamos uma arquitetura que separa a **lógica da UI** da **lógica de roteamento**.

### 1. Componentes "Reais" (A Fonte da Verdade)

-   **Localização:** `src/modules/[nome-do-modulo]/page.tsx`
-   **Responsabilidade:** Este arquivo contém **100% da lógica e da UI** da funcionalidade. Ele é o componente "real", que busca dados, renderiza formulários, tabelas, etc. Ele é projetado para ser agnóstico à URL, obtendo seu contexto (como `instanceId`) de hooks (`useParams`, `useInstanceActingContext`) em vez de props.

**Exemplo:**
O arquivo `src/modules/invite/page.tsx` contém toda a interface e lógica para o gerenciamento de convites.

### 2. Componentes "Proxy" (Os Roteadores)

-   **Localização:** `src/app/[locale]/(app)/[...caminho...]/page.tsx`
-   **Responsabilidade:** Este arquivo atua como um simples "atalho" ou "ponteiro" para o componente real. Seu único trabalho é importar o componente de `src/modules` e re-exportá-lo. Ele **não contém nenhuma lógica de UI**.

**Exemplo de Código para um Proxy:**
```tsx
// Caminho do arquivo: src/app/[locale]/(app)/modules/meu-novo-modulo/page.tsx

"use client"; // Obrigatório para a re-exportação funcionar no App Router

// 1. Importe o componente "real" da sua pasta em /src/modules
import MeuNovoModuloPage from '@/modules/meu-novo-modulo/page';

// 2. Apenas re-exporte-o como o default
export default MeuNovoModuloPage;
```

### Benefícios

-   **Manutenção Centralizada:** Para alterar a página de convites, você só precisa editar um arquivo: `src/modules/invite/page.tsx`. A mudança será refletida automaticamente em todas as URLs que usam aquele proxy.
-   **Código Limpo:** A estrutura de pastas em `src/app` permanece limpa e focada exclusivamente no roteamento, sem ser poluída com lógica de negócio.
-   **Clareza Arquitetural:** Fica claro para qualquer desenvolvedor onde a lógica "real" de uma página vive, evitando confusão e edições no lugar errado.

**Regra de Ouro:** A pasta `src/app` define **O QUÊ** e **ONDE** é renderizado. A pasta `src/modules` define **COMO** é renderizado.
