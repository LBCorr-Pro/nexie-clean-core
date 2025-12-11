# Documentação da Página: Menus e Layout

Este documento descreve a página principal de "Menus e Layout", localizada em `src/app/[locale]/(app)/settings/menus/page.tsx`.

---

## 1. Visão Geral e Propósito

Esta página funciona como um **hub central** para todas as configurações relacionadas à navegação da aplicação. Ela não contém configurações diretas, mas sim organiza e fornece acesso a todas as sub-seções de gerenciamento de menus.

O seu principal objetivo é fornecer uma experiência de usuário clara e organizada, agrupando funcionalidades complexas em seções lógicas e fáceis de encontrar.

## 2. Seções Disponíveis

A partir desta página, o administrador pode navegar para as seguintes áreas de configuração, cada uma com sua própria responsabilidade:

-   **Modelos de Menu (Presets):**
    -   **Descrição:** Permite criar "templates" de menus completos (barra lateral, inferior, etc.) que podem ser associados a diferentes Níveis de Acesso. Isso possibilita, por exemplo, que um usuário "Básico" veja menos opções de menu que um usuário "Pro".
    -   **Link:** Leva para `/settings/menus/presets`.

-   **Grupos de Menu:**
    -   **Descrição:** Focado no menu lateral esquerdo, esta seção permite criar, editar e reordenar os "agrupadores" que separam visualmente os itens de menu (ex: um grupo "Configurações" que contém todos os itens relacionados a configurações).
    -   **Link:** Leva para `/settings/menus/groups`.

-   **Itens de Menu:**
    -   **Descrição:** Permite gerenciar cada item de menu individualmente. Aqui você pode atribuir um item a um grupo, alterar sua ordem, ícone, visibilidade e definir se ele pode ser uma página inicial ou aparecer na barra inferior.
    -   **Link:** Leva para `/settings/menus/items`.

-   **Barra Inferior (Mobile):**
    -   **Descrição:** Uma seção dedicada para configurar a barra de navegação que aparece na parte inferior da tela em dispositivos móveis. Permite criar abas e adicionar itens específicos a cada uma.
    -   **Link:** Leva para `/settings/menus/bottom-bar`.

Essa estrutura modular facilita a manutenção e a localização de configurações específicas, tornando o gerenciamento de uma navegação complexa uma tarefa mais simples e organizada.
