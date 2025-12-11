# Manual de Boas Práticas de Desenvolvimento

Este manual estabelece as diretrizes e padrões a serem seguidos para garantir a qualidade, consistência e manutenibilidade do código em nosso projeto.

---

### 1. Gerenciamento de Estado e Contexto

*   **Princípio:** A aplicação opera em diferentes níveis de contexto (Master, Instância, Sub-instância). A lógica de negócio deve ser agnóstica a esse contexto, adaptando-se dinamicamente.
*   **Diretriz:**
    *   Utilize o hook `useInstanceActingContext()` para obter o `actingAsInstanceId` e `subInstanceId` atuais.
    *   **NÃO** acesse o `searchParams` ou `useParams` diretamente nos componentes para determinar o contexto. Deixe que os hooks de contexto gerenciem isso.
    *   Essa prática centraliza a lógica de determinação de contexto e torna os componentes mais reutilizáveis e fáceis de testar.

### 2. Interações com o Firestore

*   **Princípio:** As referências do Firestore são a fonte mais comum de bugs relacionados a dados. A criação dessas referências deve ser centralizada e padronizada.
*   **Diretriz:**
    1.  **Centralize as Referências:** TODAS as referências a coleções e documentos do Firestore DEVEM ser criadas usando o objeto `refs` de `src/lib/firestore-refs.ts`. **Sempre verifique este arquivo primeiro** para garantir que você está usando o caminho correto e atualizado para os dados que precisa acessar.
    2.  **Passe Referências, Não IDs:** Ao invocar funções que interagem com o Firestore (especialmente em Server Actions), prefira passar a `CollectionReference` ou `DocumentReference` completa em vez de apenas os IDs. Isso desacopla a função da necessidade de conhecer o contexto da aplicação.
        *   **Exemplo (Corrigido):** A action `fetchCampaignReport` agora recebe a `campaignsRef` completa, permitindo que ela funcione em qualquer nível (Master, Instância, etc.) sem precisar de lógica condicional interna.

### 3. Nomenclatura e Estrutura de Dados

*   **Princípio:** A consistência na nomenclatura previne bugs e melhora a legibilidade.
*   **Diretriz:**
    1.  **Use Prefixos para Agrupamento Lógico:** Para objetos de configuração grandes, como o de aparência, agrupe propriedades relacionadas com um prefixo comum.
        *   **Exemplo:** `leftSidebarBackgroundColor`, `leftSidebarForegroundColor`, `leftSidebarBorderColor`.
    2.  **Schema Zod como Fonte da Verdade:** O schema de validação (Zod) de um formulário deve ser a autoridade máxima sobre os nomes dos campos. Sempre defina e consulte o schema ao trabalhar em formulários.
    3.  **Use `camelCase`** para variáveis, funções e nomes de campos. Use `PascalCase` para componentes React e tipos TypeScript.

### 4. Componentização e Reutilização

*   **Princípio:** Evite duplicação de código. Crie componentes genéricos para elementos de UI e lógica reutilizável.
*   **Diretriz:**
    *   Antes de criar um novo componente de UI, verifique a pasta `src/components/ui` (componentes base do ShadCN) e `src/components/shared` (componentes customizados da aplicação).
    *   Ao desenvolver uma nova feature, identifique padrões de UI ou lógica que possam ser extraídos para um hook ou componente customizado.

### 5. Tratamento de Erros e Feedback ao Usuário

*   **Princípio:** O usuário deve sempre ser informado sobre o resultado de suas ações.
*   **Diretriz:**
    *   Utilize o hook `useToast()` para fornecer feedback sobre operações bem-sucedidas ou malsucedidas.
    *   Em blocos `try...catch`, sempre inclua um `toast` no bloco `catch` para informar o usuário sobre o erro. Forneça uma mensagem clara e, se possível, acionável.
    *   Use o estado de `isSaving` ou `isLoading` para desabilitar botões de submissão e exibir indicadores de carregamento (`<Loader2 />`), prevenindo cliques duplos e informando ao usuário que uma operação está em andamento.

### 6. Padrões de Layout Responsivo

*   **Princípio:** A interface deve ser funcional e esteticamente agradável em todos os tamanhos de tela.
*   **Diretriz:**
    *   **Botões de Ação em Cabeçalhos:** Botões de ação primária (como "Criar Novo") posicionados ao lado de títulos de seção devem usar um layout flexível responsivo. Em telas pequenas (mobile), o botão deve se mover para uma nova linha abaixo do título e da descrição para evitar comprimir o texto.
        *   **Implementação:** Use classes do Tailwind como `flex flex-col md:flex-row md:items-center md:justify-between gap-2`.
---