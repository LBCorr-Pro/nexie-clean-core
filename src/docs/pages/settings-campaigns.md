# Documentação da Página: Campanhas de Splash Screen

Este documento detalha o funcionamento, a estrutura e a lógica da página de "Campanhas", localizada em `src/app/[locale]/(app)/settings/campaigns/`.

---

## 1. Visão Geral e Propósito

A página de **Campanhas** permite aos administradores criar, gerenciar e visualizar relatórios de campanhas de "Splash Screen" (telas de abertura do aplicativo) e banners. O objetivo é fornecer uma ferramenta para exibir mensagens, promoções ou anúncios aos usuários em momentos estratégicos, como na inicialização do app.

A funcionalidade suporta a hierarquia completa do sistema (Master > Instância > Sub-instância), com herança de configurações e personalização em cada nível.

## 2. Estrutura de Arquivos

Seguindo as boas práticas do projeto, a funcionalidade foi dividida para garantir a manutenibilidade:

-   **`page.tsx`**: Este é o arquivo principal da rota. Suas responsabilidades são:
    -   Listar as campanhas existentes para o contexto atual (Master, Instância ou Sub-instância).
    -   Controlar a exibição da tabela, o carregamento de dados e a paginação.
    -   Gerenciar a abertura dos modais de criação/edição e de exclusão.
    -   Chamar o `actions.ts` para buscar relatórios.

-   **`components/CampaignFormDialog.tsx`**: Um componente reutilizável que encapsula toda a complexidade do formulário de criação e edição de uma campanha. Suas responsabilidades são:
    -   Renderizar o modal (`<Dialog>`).
    -   Gerenciar o estado do formulário com `react-hook-form` e a validação com `zod`.
    -   Dividir o formulário em abas (Detalhes, Conteúdo, Público-Alvo) para melhor organização.
    -   Lidar com a lógica de salvamento (criação ou atualização) da campanha no Firestore.
    -   Incluir os componentes de upload de imagem (`<ImageUploadField />`).

-   **`components/ReportDialog.tsx`**: Um modal simples para exibir o relatório de visualizações de uma campanha.

-   **`actions.ts`**: Um arquivo de "Server Actions" que contém a lógica de backend para buscar dados complexos, como o relatório de visualizações, que precisa consultar e cruzar dados de diferentes coleções.

-   **`types.ts`**: Define as interfaces TypeScript para os objetos `Campaign` e `CampaignView`, garantindo a consistência dos tipos em toda a funcionalidade.

## 3. Estrutura do Formulário e Campos (`CampaignFormDialog.tsx`)

O formulário é validado pelo schema `campaignFormSchema` e dividido em três abas:

### a. Detalhes
-   **Nome da Campanha:** Um nome para identificação interna.
-   **Tipo:** `Abertura de App` ou `Banner`.
-   **Status:** `Rascunho`, `Ativa` ou `Inativa`.
-   **Frequência de Exibição:** Define quantas vezes um usuário verá a campanha (ex: uma vez por dia, apenas uma vez na vida, etc.).
-   **Data de Início/Fim:** Período em que a campanha estará ativa. Utiliza o componente `<DatePickerInput />`.

### b. Conteúdo
-   **Elemento Principal:** O conteúdo visual primário, que pode ser uma **Imagem** ou um **Texto**.
-   **Fundo:** O fundo da tela, que pode ser uma **Cor Sólida**, **Gradiente**, **Imagem** ou **Vídeo**.
-   **Duração Total:** Tempo em segundos que a splash screen permanecerá na tela.
-   **Página de Destino:** A URL para a qual o usuário será redirecionado ao interagir com a campanha.

### c. Público-Alvo
-   **Tipo de Público:**
    -   **Público:** Visível para todos, mesmo usuários não logados.
    -   **Todos os Usuários Logados:** Visível para qualquer usuário autenticado.
    -   **Grupos Específicos:** Permite selecionar um ou mais Níveis de Acesso, restringindo a campanha apenas a usuários nesses grupos.

---

## 4. Fluxo de Dados e Lógica Contextual

-   **`useDynamicMenu`:** É utilizado para obter as configurações de aparência e os itens de menu, que podem ser usados como página de destino.
-   **`useInstanceActingContext`:** Crucial para determinar o contexto atual (Master, Instância, Sub-instância) e adaptar as chamadas ao Firestore.
-   **`refs` de `firestore-refs.ts`:** Todas as interações com o Firestore usam as referências centralizadas para garantir que os dados sejam lidos e escritos nos locais corretos da hierarquia, respeitando a lógica de personalização de cada nível.