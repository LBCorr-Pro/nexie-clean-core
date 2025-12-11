# Guia de Limpeza e Padronização de Dados

Este documento registra o processo de limpeza e padronização dos IDs (slugs) de grupos e itens de menu, que eram inconsistentes no banco de dados.

---

## 1. O Problema: Inconsistência de IDs

Durante a fase inicial de desenvolvimento, os identificadores únicos (slugs) para os grupos e itens de menu foram criados usando diferentes convenções, resultando em uma mistura de:

-   **`snake_case`**: `group_access`, `group_system`
-   **`kebab-case`**: `group-management`, `group-settings`
-   **IDs Automáticos do Firestore**: `bdV5kRBq4NmtitpvE1h6`

Essa inconsistência tornava a lógica de busca e referência de dados frágil, complexa e propensa a erros.

## 2. A Solução: Padronização e Limpeza Centralizada

A decisão foi padronizar todos os IDs para usar exclusivamente o formato **kebab-case** (ex: `meu-grupo-novo`), que é o padrão mais comum para slugs e URLs.

Para corrigir o banco de dados, foi adotada uma abordagem de "limpeza e repovoamento" (`clean and seed`).

### Passo 1: Atualização das Fontes da Verdade

Os arquivos que contêm os dados padrão para grupos e itens de menu foram atualizados para usar a convenção de `kebab-case` em todos os `docId` e `menuKey`.

-   **Grupos:** `src/lib/seed-data/default-menu-groups.ts`
-   **Itens:** `src/lib/seed-data/default-menu-items.ts`

### Passo 2: Criação de Server Actions de Reset

Duas `Server Actions` foram criadas em `src/lib/actions/dev-actions.ts` para executar a limpeza:

1.  **`seedDefaultMenuGroupsAction()`:**
    -   Esta função **apaga todos os documentos** da coleção `Global/master/config/app_menu_config/app_menu_groups`.
    -   Em seguida, ela itera sobre o array `defaultMenuGroupsData` e recria cada grupo com o ID correto e os dados padrão.

2.  **`seedDefaultMenuItemsAction()`:**
    -   Executa a mesma lógica para os itens de menu, limpando a coleção `app_menu_item_configs` e repovoando-a com os dados de `defaultMenuItemsData`.

### Passo 3: Execução via Ferramentas de Desenvolvimento

Para facilitar a execução dessas ações, dois botões temporários ("Resetar Grupos de Menu" e "Resetar Itens de Menu") foram adicionados à página de **Ferramentas de Desenvolvimento** (`/admin/dev-tools`).

Após a execução bem-sucedida de ambas as ações, o banco de dados ficou alinhado com a arquitetura padronizada.

### Passo 4: Remoção das Ferramentas (Concluído)

Uma vez que a limpeza foi concluída e validada, os botões de "Reset" foram **removidos** da página de Ferramentas de Desenvolvimento para prevenir execuções acidentais no futuro.

## Conclusão

Este processo garantiu a integridade e consistência da estrutura de navegação do sistema. A padronização dos IDs simplifica a lógica de código e torna o sistema mais robusto e fácil de manter. Qualquer nova entidade que utilize slugs como identificadores deve seguir a convenção de `kebab-case`.
