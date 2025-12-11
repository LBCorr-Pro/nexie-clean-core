# Guia do Sistema de Tipografia Granular

Este documento detalha a arquitetura do sistema de personalização de tipografia da aplicação, permitindo um controle preciso sobre a aparência de cada nível de texto na interface.

## 1. O Objetivo: Controle Semântico

O objetivo do sistema de tipografia é permitir a personalização de fontes, tamanhos, pesos e espaçamentos com base no **significado semântico** do texto, e não em componentes específicos. Isso garante consistência visual e facilita a manutenção.

A personalização é dividida em quatro níveis principais:

1.  **Título da Página:** O título principal de cada página (normalmente um `h1` dentro de um `CardHeader`).
2.  **Subtítulo da Página:** A descrição que aparece logo abaixo do título principal.
3.  **Título de Seção:** Títulos secundários que dividem o conteúdo dentro de uma página (normalmente `h3`).
4.  **Corpo do Texto:** O texto padrão para todo o resto da aplicação (parágrafos, labels de formulário, itens de menu, etc.).

## 2. Controles Disponíveis

Para cada um dos quatro níveis semânticos, a aba "Aparência > Tipografia" oferece os seguintes controles:

*   **Família da Fonte:** Um seletor de fontes do Google Fonts.
*   **Tamanho da Fonte:** Um slider para ajustar o tamanho do texto em pixels.
*   **Peso da Fonte:** Um seletor para definir a "grossura" da fonte (ex: Normal, Semi-Negrito, Negrito).
*   **Espaçamento entre Letras:** Um slider para ajustar o `letter-spacing`, permitindo um texto mais condensado ou arejado.
*   **Altura da Linha:** Um slider para controlar o `line-height`, ajustando o espaço vertical entre as linhas de texto.

## 3. Implementação Técnica

A personalização é alcançada através de uma combinação de CSS dinâmico e variáveis CSS.

1.  **`AppearancePreviewManager.tsx`**: Este componente é o cérebro do preview. Ele monitora as alterações no formulário de aparência e gera uma folha de estilo em tempo real. Para cada controle de tipografia, ele cria uma variável CSS específica, como por exemplo:
    *   `--font-family-page-title`
    *   `--font-size-page-subtitle`
    *   `--line-height-body`

2.  **`globals.css`**: Este arquivo contém as regras que aplicam essas variáveis aos elementos HTML corretos. Por exemplo:

    ```css
    /* Título da Página */
    h1.card-title {
      font-family: var(--font-family-page-title);
      font-size: var(--font-size-page-title);
      /* ... etc ... */
    }

    /* Corpo do Texto */
    body, label, p, div, span {
      font-family: var(--font-family-body);
      font-size: var(--font-size-body) !important;
      line-height: var(--line-height-body) !important;
      /* ... etc ... */
    }
    ```

### O Uso Estratégico do `!important`

Durante a implementação, foi identificado que os estilos padrão de alguns componentes (especialmente aqueles vindos de bibliotecas como ShadCN/Radix) sobrescreviam as nossas variáveis CSS, impedindo que as alterações de tamanho, peso e altura de linha funcionassem.

Para resolver isso, a diretiva `!important` foi adicionada **estrategicamente** apenas às propriedades que não estavam sendo aplicadas.

**Crucialmente, a propriedade `font-family` para o corpo do texto foi deixada *sem* `!important`.** Isso foi intencional para permitir que o componente de seletor de fontes (`GoogleFontSelect`) pudesse aplicar um estilo de `fontFamily` inline para gerar o preview de cada fonte na lista, uma funcionalidade que seria bloqueada por uma regra `!important` global.

Essa abordagem híbrida garante que as personalizações do usuário sejam respeitadas em toda a UI, sem sacrificar a experiência de usuário no painel de administração.
