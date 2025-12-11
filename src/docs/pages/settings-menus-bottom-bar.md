# Documentação da Página: Configurar Barra Inferior

Este documento detalha o funcionamento, a estrutura e a lógica da página de "Configurar Barra Inferior", localizada em `src/app/[locale]/(app)/settings/menus/bottom-bar/page.tsx`.

---

## 1. Visão Geral e Propósito

A página de **Configurar Barra Inferior** é a ferramenta dedicada para personalizar completamente a barra de navegação principal que aparece na parte inferior da tela, especialmente em dispositivos móveis. Ela oferece controle granular sobre a estrutura, comportamento e aparência da barra.

Uma das principais características desta página é o **preview em tempo real**. Todas as alterações feitas nos controles são aplicadas instantaneamente à barra de navegação real da aplicação, permitindo que o administrador veja exatamente como suas configurações se comportarão antes de salvar.

## 2. Estrutura de Arquivos

Para manter a organização e a manutenibilidade, a funcionalidade foi dividida em componentes com responsabilidades claras:

-   **`page.tsx`**: O arquivo principal da rota. Ele contém o formulário principal, os controles de configuração geral (como habilitar no desktop), e o componente `PreviewSync` que aplica os estilos e configurações do formulário em tempo real no contexto de preview.
-   **`components/BottomBarTabManager.tsx`**: Este componente é o coração da organização das abas. Ele é responsável por listar, criar, editar e excluir as "orelhas" das abas de navegação.
-   **`components/TabItemManager.tsx`**: Um subcomponente que vive dentro de cada aba no `BottomBarTabManager`. Sua função é permitir a adição, remoção e reordenação (com drag-and-drop e setas) de itens de menu específicos para aquela aba. Este componente agora é desacoplado e recebe o prefixo do seu campo (`namePrefix`) como uma propriedade para funcionar corretamente em diferentes contextos de formulário.

## 3. Funcionalidades Detalhadas

### a. Configurações Gerais
-   **Habilitar em Desktops:** Uma chave para ativar ou desativar a exibição da barra de navegação em telas grandes.
-   **Posição no Desktop:** Se habilitada, permite escolher se a barra aparecerá na parte inferior ou em uma coluna vertical à direita.

### b. Sistema de Abas
Esta é a funcionalidade central que transforma a barra de navegação em um sistema de abas poderoso.

-   **Habilitar Sistema de Abas:** Ativa a lógica de "orelhas" (tabs), permitindo agrupar itens de menu em diferentes seções.
-   **Exibir "Orelha" com Apenas 1 Aba:** Quando ativado, mesmo que apenas uma aba exista, sua "orelha" com o título será exibida. Se desativado, a "orelha" só aparece quando há duas ou mais abas.
-   **Alinhamento das Abas:** Controla a posição horizontal das "orelhas" (Esquerda, Centro ou Direita).
-   **Exibição do Conteúdo da Aba:** Define o que é mostrado dentro do botão de cada aba:
    -   Ícone e Texto (padrão)
    -   Somente Ícone
    -   Somente Texto

### c. Gerenciador de Abas (`BottomBarTabManager`)
-   **Criação/Edição de Abas:** Um modal permite criar novas abas ou editar as existentes, definindo seu **Nome** e **Ícone**. O botão "Salvar" no modal só é habilitado quando os campos obrigatórios (como o nome) estão preenchidos corretamente.
-   **Gerenciamento de Itens por Aba (`TabItemManager`):** Dentro de cada aba (em um "acordeão"), há um seletor que lista todos os itens de menu do sistema (definidos em "Gerenciar Itens de Menu") que foram marcados como "Pode ir para Barra Inferior". Isso permite adicionar e remover itens específicos para cada aba.
-   **Reordenação de Itens:** Os itens dentro de uma aba podem ser reordenados arrastando-os pela alça ou usando os botões de seta para cima/baixo.

## 4. Lógica de Preview em Tempo Real

O preview instantâneo é orquestrado pelo `DebugMenuContext`, que serve como um estado global para fins de desenvolvimento e preview.

1.  **`PreviewSync` Component:** Um pequeno componente dentro da `page.tsx` usa o hook `useWatch` do `react-hook-form` para observar todas as alterações no formulário em tempo real.
2.  **Atualização do Contexto:** A cada mudança, o `PreviewSync` chama a função `setBottomBarPreviewConfig` do `DebugMenuContext`, atualizando um estado global com a configuração de preview da barra inferior.
3.  **Consumo do Contexto:** O componente `BottomNavigationBar`, que faz parte do layout principal da aplicação, também consome o `DebugMenuContext`. Ele tem a seguinte lógica:
    -   **Se** `bottomBarPreviewConfig` existir no contexto, ele ignora as configurações salvas e renderiza a si mesmo usando exclusivamente os dados do preview.
    -   **Se** `bottomBarPreviewConfig` for `null` (o que acontece em todas as outras páginas ou quando o usuário sai da página de edição), ele volta a renderizar usando as configurações normais salvas.

Esta arquitetura garante uma comunicação limpa e eficiente entre a página de configuração e o componente de layout, resultando em um preview instantâneo e fiel para todas as alterações.