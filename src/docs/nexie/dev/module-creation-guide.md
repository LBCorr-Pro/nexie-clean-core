# Guia Completo para Criação de Módulos Externos

Este documento é a **fonte única da verdade** para o desenvolvimento de novas funcionalidades como **módulos externos e plugáveis**. O objetivo desta arquitetura é garantir que cada módulo seja uma unidade de código autossuficiente e portátil.

---

## 1. A Arquitetura de Módulos: Encapsulamento Total

Um módulo em nosso sistema é composto por duas partes principais, cada uma com uma responsabilidade clara: a pasta de **código-fonte** e o **arquivo proxy de roteamento**.

### a. A Pasta do Código-Fonte (`src/modules/[slug-do-modulo]/`)

Esta é a pasta principal e **única** onde todo o código do seu módulo deve residir.

-   **Responsabilidade:** Conter 100% da lógica, componentes de UI, páginas, estilos e assets específicos do módulo. O objetivo é que esta pasta seja totalmente portátil.
-   **Conteúdo Obrigatório:**
    -   `page.tsx`: O componente React que renderiza a página principal do módulo.

### b. O Arquivo Proxy de Roteamento (`src/app/[locale]/(app)/modules/[slug-do-modulo]/page.tsx`)

Para que o Next.js App Router encontre e renderize seu módulo, precisamos criar um "atalho" ou **proxy** dentro da estrutura de `app`.

-   **Responsabilidade:** Servir como um ponto de entrada para o Next.js, importando o componente de página real de `src/modules` e re-exportando-o.
-   **Conteúdo Obrigatório:** Este arquivo deve conter **apenas** o seguinte código, adaptado para o seu módulo:

    ```tsx
    // Exemplo para um módulo com slug "meu-novo-modulo"
    // Caminho do arquivo: src/app/[locale]/(app)/modules/meu-novo-modulo/page.tsx

    "use client"; // Obrigatório para a re-exportação

    // 1. Importe o componente de página da sua pasta em src/modules
    import MeuNovoModuloPage from '@/modules/meu-novo-modulo/page';

    // 2. Exporte-o como default
    export default MeuNovoModuloPage;
    ```

**ERRO COMUM A EVITAR:** Nunca coloque a lógica ou a UI principal do seu módulo na pasta `src/app/.../modules/`. Esta pasta deve conter apenas o arquivo proxy.

---

## 2. Passo a Passo para Criar um Novo Módulo Externo

### Passo 1: Criar as Estruturas de Pasta e Arquivo

1.  **Crie a Pasta do Módulo:** Crie a pasta principal para seu código em `src/modules/[meu-novo-modulo]/`.
2.  **Crie a Página Principal:** Dentro da nova pasta, crie o arquivo `page.tsx` com a interface do seu módulo.
3.  **Crie a Pasta do Proxy:** Crie a pasta para o roteamento em `src/app/[locale]/(app)/modules/[meu-novo-modulo]/`.
4.  **Crie o Arquivo Proxy:** Dentro da pasta do proxy, crie o arquivo `page.tsx` e adicione o código de re-exportação, conforme o exemplo acima.

### Passo 2: Informar ao Sistema que o Módulo Existe

O sistema não "lê" o sistema de arquivos diretamente. Ele depende de um manifesto manual para saber quais módulos estão "instalados".

1.  Abra o arquivo `src/lib/known-module-folders.ts`.
2.  Adicione o slug do seu novo módulo (o nome da pasta) ao array `knownModuleFolderSlugs`.
    ```typescript
    export const knownModuleFolderSlugs: string[] = [
        "invite",
        "meu-novo-modulo" // Adicione aqui
    ];
    ```

### Passo 3: Registrar o Módulo no Sistema

Após os passos anteriores, seu módulo aparecerá como **"Não Registrado"** na página de "Gerenciar Módulos". Agora você precisa criar sua definição no banco de dados.

1.  Acesse **Sistema -> Gerenciar Módulos**.
2.  Encontre seu novo módulo na lista.
3.  Clique no menu de ações (`...`) ao lado do módulo e selecione **"Registrar Módulo"**.
4.  Um modal se abrirá. Preencha os detalhes (Nome, Ícone, etc.). O ID (Slug) já virá preenchido. **Não altere este campo.**
5.  Salve. O status do módulo mudará para **"Registrado"**.

### Passo 4: Adicionar ao Menu (se necessário)

Se o módulo deve aparecer no menu lateral, acesse **Configurações -> Menus -> Gerenciar Itens de Menu** e crie um novo item apontando para a URL do seu módulo (ex: `/modules/meu-novo-modulo`), marcando a opção "É um Módulo?".

---

Seguir este fluxo de trabalho garante que os módulos sejam encapsulados, portáteis e integrados de forma limpa e consistente na arquitetura do sistema.