# Arquitetura de Múltiplas Instâncias (Nexie)

Este documento detalha a arquitetura de múltiplas instâncias, o sistema de herança de configurações e as regras de manipulação de dados, servindo como a fonte única da verdade para este tópico.

## 1. Roteamento e "Proxys"

Para evitar a duplicação de código e centralizar a manutenção, o sistema utiliza um padrão de "proxy" para as páginas. As páginas específicas de instâncias e sub-instâncias (ex: `src/app/[locale]/(app)/users/[instanceId]/page.tsx`) não contêm a lógica de negócio ou a UI da página. Em vez disso, elas atuam como roteadores (proxys) que:

1.  Extraem os parâmetros da URL (como `instanceId` e `subInstanceId`).
2.  Carregam o contexto de dados correto para aquele nível hierárquico.
3.  Renderizam o componente "real" e "master" (ex: `src/app/[locale]/(app)/users/page.tsx`), que contém a lógica e a UI compartilhada.

**Benefício Principal:** Manutenção simplificada. Uma alteração feita no componente master é automaticamente refletida em todos os níveis da hierarquia, sem necessidade de edições múltiplas.

## 2. Sistema de URLs

O sistema é projetado para identificar a instância e/ou sub-instância correta a partir de três formatos de URL possíveis:

-   **Domínio Exclusivo:** `www.empresa-x.com`
-   **Subdomínio:** `empresa-x.nossoapp.com`
-   **Path (Caminho na URL):**
    -   **Instância:** `www.nossoapp.com/empresa-x`
    -   **Sub-instância:** `www.nossoapp.com/empresa-x/setor-y`

Um middleware é responsável por analisar a URL da requisição e determinar o contexto correto antes da renderização da página.

## 3. Hierarquia de Herança de Configurações

Quando o sistema precisa resolver uma configuração (ex: um tema, uma cor, uma lista de itens de menu, etc.), ele busca em uma cadeia de prioridade estrita, parando e utilizando o valor do primeiro local onde a configuração é encontrada.

A ordem de busca é do mais específico para o mais genérico:

1.  **Sub-instância:** A configuração salva diretamente na sub-instância que o usuário está acessando.
2.  **Sub-instância Master do Plano:** O modelo ("template") para todas as sub-instâncias que pertencem ao mesmo plano.
3.  **Sub-instância Master Geral:** O modelo padrão para todas as sub-instâncias, caso não haja um master específico para o seu plano.
4.  **Instância Pai:** A configuração da instância à qual a sub-instância diretamente pertence.
5.  **Instância Master do Plano:** O modelo para todas as instâncias que pertencem ao mesmo plano.
6.  **Instância Master Geral:** O modelo padrão para todas as instâncias.
7.  **Master (Tenant/Empresa):** A configuração no nível raiz da empresa (considerada a instância "master" principal).
8.  **Hardcoded:** Um valor padrão de fallback definido diretamente no código (ex: em `src/lib/default-appearance.ts`) para garantir que o sistema nunca fique sem um valor essencial.

### Diagrama de Fluxo de Herança:
`Sub-instância` → `Sub-instância Master (Plano)` → `Sub-instância Master (Geral)` → `Instância Pai` → `Instância Master (Plano)` → `Instância Master (Geral)` → `Master (Tenant)` → `Hardcoded`

## 4. O Papel das Instâncias "Master" e "Dev"

-   **Propósito:** Instâncias e sub-instâncias podem ser designadas como **"Master"** ou **"Dev"**. Elas servem como **modelos de configuração centralizados** (templates) para outras entidades na hierarquia.
-   **Unicidade:** A regra de negócio é estrita: só pode existir **uma** instância/sub-instância "Master" e **uma** "Dev" para cada escopo:
    -   **Geral:** Um template para todos.
    -   **Por Plano:** Um template específico para cada plano (ex: "Master do Plano Pro", "Dev do Plano Básico").
-   **Interface do Usuário:**
    -   Os formulários de criação e edição de instâncias/sub-instâncias devem conter seletores (switches) para "É Master" e "É Dev".
    -   A lógica de negócio no backend deve validar e garantir a regra de unicidade ao salvar.
    -   A barra de topo da aplicação deve exibir ícones distintivos para alertar o usuário quando ele está navegando e editando uma instância "Master" ou "Dev", devido ao seu impacto amplo.

## 5. Regras de Salvamento: O Padrão de "Delta Saving"

Para manter a integridade dos modelos (instâncias master), nenhuma edição feita em uma instância "filha" (seja ela normal ou sub) pode alterar os dados de um nível superior na hierarquia. As alterações são sempre salvas como uma "diferença" ou "delta" no nível atual que está sendo editado.

-   **Exclusão Lógica:** Quando um usuário "exclui" um item herdado (ex: um assessor de IA de uma lista), o item não é removido do modelo master. Em vez disso, uma entrada é criada no banco de dados do nível atual, marcando aquele item específico como "desativado" ou "oculto". O sistema então filtra esse item ao exibir a lista consolidada.
-   **Edição (Sobrescrita):** Quando um usuário edita um item herdado, uma **cópia** completa e modificada do item é salva no nível atual. Ao renderizar, o sistema identificará que existem duas versões do mesmo item (a herdada e a local) e dará prioridade à versão local. O item original no modelo permanece intacto.
-   **Criação:** Itens novos são, por padrão, sempre salvos e vinculados ao nível atual.

Este padrão garante que as personalizações sejam não-destrutivas, permitindo que o sistema sempre possa reverter para o comportamento do modelo simplesmente removendo as entradas de "delta" locais.
