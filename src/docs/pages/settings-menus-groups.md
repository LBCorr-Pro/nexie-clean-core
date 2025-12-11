# Documentação da Página: Gerenciar Grupos de Menu

Este documento detalha o funcionamento, a estrutura e a lógica da página de "Gerenciar Grupos de Menu", localizada em `src/app/[locale]/(app)/settings/menus/groups/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Gerenciar Grupos de Menu** é a ferramenta central para organizar a navegação do menu lateral esquerdo. Sua função é permitir que administradores criem, editem, personalizem e reordenem os "agrupadores" que separam visualmente os itens de menu em seções lógicas.

A funcionalidade suporta a hierarquia completa do sistema, permitindo que a configuração de grupos seja personalizada em nível de **Instância** e **Sub-instância**, ou herdada da configuração **Master Global**.

## 2. Funcionalidades Principais

### a. Listagem e Ordenação
-   **Visualização:** Todos os grupos de menu para o contexto atual são listados em um formato de "acordeão". Grupos vazios (sem itens de menu associados) são exibidos aqui para permitir o gerenciamento.
-   **Ordenação (Drag and Drop):** É possível reordenar os grupos arrastando-os pela alça (`<GripVertical />`) para a posição desejada.
-   **Ordenação (Setas):** Controles de seta para cima e para baixo permitem ajustes finos na ordem.
-   **Salvar Ordem:** Após reordenar, é necessário clicar no botão **"Salvar Ordem dos Grupos"** para persistir as alterações.

### b. Criação e Edição de Grupos (Modal)
Ao clicar em "Criar Novo Grupo" ou "Editar", um modal é aberto com os seguintes campos:

-   **Nome do Grupo:** O título que será exibido no menu lateral.
-   **ID (Slug):** Um identificador único em `kebab-case` (ex: `meu-grupo-novo`). Este campo é preenchido automaticamente com base no nome, mas pode ser ajustado. **Não pode ser alterado após a criação.**
-   **Ícone:** Permite definir um ícone da biblioteca [Lucide Icons](https://lucide.dev/icons/) para o grupo.
-   **Sugerir Estilo com IA:** Um botão que utiliza IA para sugerir um ícone e uma cor com base no nome do grupo.
-   **Aplicação de Cor:** Uma seleção com três opções para controlar como as cores personalizadas são aplicadas:
    -   **Nenhum (herdar do tema):** O grupo e seus itens herdarão as cores do tema padrão (definido em Aparência > Menu Esquerdo).
    -   **Apenas no Título do Grupo:** A cor personalizada será aplicada somente ao título do grupo, permitindo destaque sem afetar os itens.
    -   **No Grupo e nos Itens:** A cor personalizada será aplicada tanto ao título do grupo quanto a todos os itens de menu dentro dele.
-   **Cores:**
    -   É possível definir uma **cor unificada** para o ícone e o texto.
    -   Alternativamente, pode-se desmarcar a opção "Usar mesma cor" para definir cores distintas para o ícone e para o texto.

### c. Lógica de Cores (Prioridade)
-   **Prioridade Alta:** As cores definidas diretamente em um grupo (seja unificada ou separada para ícone/texto) têm **prioridade máxima**, respeitando a regra de "Aplicação de Cor" selecionada.
-   **Fallback:** Se a aplicação de cor estiver como "Nenhum", o grupo utilizará as cores padrão do menu, que são herdadas das configurações de "Aparência" (especificamente da aba "Menu Esquerdo").
-   **Implementação:** A lógica para essa priorização é centralizada no hook `useDynamicMenu`, que calcula as cores finais (`finalDisplayGroupIconColor` e `finalDisplayGroupTextColor`) e as disponibiliza para todos os componentes que renderizam o menu.

### d. Exclusão de Grupos
-   Grupos podem ser excluídos através do menu de opções (três pontos) em cada item da lista.
-   A exclusão de um grupo não exclui os itens de menu que pertenciam a ele. Esses itens passarão a ser exibidos na seção "Outros" (itens não agrupados) do menu lateral.
-   A exclusão é refletida imediatamente na interface, sem necessidade de recarregar a página.

### e. Visualização de Itens
-   Cada grupo na lista funciona como um "acordeão". Clicar nele expande a visualização e mostra uma lista somente leitura de todos os itens de menu que atualmente pertencem àquele grupo.
