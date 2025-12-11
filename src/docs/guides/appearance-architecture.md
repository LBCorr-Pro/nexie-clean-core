# Arquitetura de Aparência Segmentada

Este documento detalha a arquitetura de arquivos implementada para gerenciar a lógica de aparência (temas, cores, estilos) e o sistema de preview em tempo real. O objetivo principal desta estrutura é o **isolamento de responsabilidades** para prevenir regressões e garantir que alterações em um componente não afetem outros.

A arquitetura é dividida em duas frentes principais: a **Lógica de Geração de Estilos (TypeScript)** e a **Aplicação dos Estilos (CSS)**.

---

## 1. Lógica de Geração de Estilos (TypeScript)

A lógica que traduz as configurações do formulário de aparência em CSS foi movida de um único componente para um conjunto de arquivos utilitários dentro do diretório `src/lib/appearance/`.

### 1.1. Arquivos de Responsabilidade Única

Cada arquivo nesta pasta tem um propósito específico e isolado:

-   **`src/lib/appearance/colors-layout.ts`**
    -   **Função:** `generateColorVariables()` e `generateLayoutVariables()`.
    -   **Responsabilidade:** Gerar as **variáveis CSS** que são aplicadas globalmente no `:root`. Isso inclui cores (`--primary`, `--card`), fontes (`--font-family-page-title`), raio da borda (`--radius`), etc. Esta é a base do tema.
    -   **IMPORTANTE:** Este arquivo é crítico para a renderização no servidor. A omissão de qualquer mapeamento de cor esperado por um componente pode resultar em um "Internal Server Error", pois o componente tentará renderizar com uma variável CSS indefinida.

-   **`src/lib/appearance/background.ts`**
    -   **Função:** `generateBodyBackgroundCss()`.
    -   **Responsabilidade:** Gerar exclusivamente a regra de CSS para o `background` do `<body>` da página (cor sólida, gradiente ou imagem).

-   **`src/lib/appearance/nav-bars.ts`**
    -   **Função:** `generateNavBarsCss()`.
    -   **Responsabilidade:** Contém a lógica mais complexa e sensível. Gera as regras de estilo específicas para as três barras de navegação:
        -   Menu Esquerdo (`.main-sidebar`)
        -   Barra Superior (`.main-content-wrapper > header`)
        -   Barra Inferior (`div[aria-label="Navegação Inferior"] > nav`)
    -   É aqui que a lógica para diferenciar `background-type` (solid vs. gradient) e `style` (flat, glass, bordered) é aplicada.

### 1.2. O Orquestrador

-   **`src/lib/appearance-utils.ts`**
    -   **Função:** `generateAppearanceCss()`.
    -   **Responsabilidade:** Atua como um orquestrador. Ele **importa** as funções dos outros arquivos (`colors-layout`, `background`, `nav-bars`) e as chama em sequência para montar a folha de estilo final completa. Ele não contém lógica de estilo direta, apenas coordena a montagem.

### 1.3. O Aplicador no DOM

-   **`src/components/dynamic-theme-applicator.tsx`**
    -   **Responsabilidade:** Este componente é o ponto de contato com a UI. Ele é usado tanto no preview da página de Aparência quanto no layout global da aplicação.
    -   Sua única função é chamar o orquestrador (`generateAppearanceCss`) para obter a string de CSS e injetá-la em uma tag `<style>` no `<head>` do documento.
    -   Ele também aplica os atributos `data-style` e `data-background-type` nos elementos do DOM, permitindo que o CSS os estilize.

---

## 2. Aplicação dos Estilos (CSS)

Para complementar a separação da lógica, o CSS também foi segmentado.

### 2.1. Arquivos CSS Dedicados

As regras de estilo que antes estavam todas em `globals.css` foram movidas para arquivos dedicados na pasta `src/styles/`:

-   **`src/styles/sidebar.css`**: Contém apenas as regras de estilo para o `.main-sidebar`.
-   **`src/styles/top-bar.css`**: Contém apenas as regras de estilo para o `header`.
-   **`src/styles/bottom-bar.css`**: Contém apenas as regras de estilo para a barra de navegação inferior.

### 2.2. Importação no Layout Global

Esses novos arquivos CSS são importados diretamente no layout principal da aplicação (`src/app/[locale]/(app)/layout.tsx`). Isso garante que os estilos estejam disponíveis em todas as páginas autenticadas.

---

## Conclusão: Benefícios da Segmentação

Essa arquitetura nos protege contra regressões porque:

1.  **Isolamento Físico:** Para ajustar o gradiente da barra superior, um desenvolvedor (ou a IA) só precisa modificar `src/lib/appearance/nav-bars.ts` e `src/styles/top-bar.css`. Não há necessidade de tocar nos arquivos que cuidam das cores gerais ou da tipografia, eliminando o risco de quebras inesperadas.
2.  **Responsabilidades Claras:** Cada arquivo tem um propósito único e bem definido, tornando o código mais fácil de entender, depurar e manter.
3.  **Estabilidade:** Uma vez que uma parte (ex: a barra inferior) está finalizada e testada, seus arquivos correspondentes (`bottom-bar.css` e a lógica relevante em `nav-bars.ts`) podem ser considerados "congelados", diminuindo a necessidade de retestar toda a aplicação a cada pequena mudança.