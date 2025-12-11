# Guia do Padrão de Refatoração "nx-"

Este documento detalha a estratégia de "versionamento por prefixo" adotada para realizar refatorações complexas na aplicação sem introduzir quebras ou instabilidade no código existente.

## O Problema: O Risco de Refatorações em Larga Escala

Alterar um hook central, um provedor de contexto ou uma `Server Action` que é usada por dezenas de componentes é uma operação de alto risco. Uma única mudança na assinatura de uma função ou no formato de um objeto de retorno pode causar uma cascata de erros de tipo (`typecheck`) e de runtime em toda a aplicação, tornando o processo de depuração e correção lento e frustrante.

## A Solução: O Padrão de Transição `nx-`

Para mitigar esse risco, adotamos uma estratégia de migração incremental, onde a "nova" versão de uma peça de código coexiste com a "antiga" durante o período de transição.

### Como Funciona:

1.  **Criação com Prefixo:**
    -   Quando um hook, componente ou serviço crítico precisa ser refatorado, em vez de alterá-lo diretamente, criamos uma **cópia** dele.
    -   Esta nova cópia é prefixada com `nx-` (de "Nexie").
    -   **Exemplo:** Se vamos refatorar `useDynamicMenu`, criamos um novo arquivo e hook chamado `useNxDynamicMenu`.

2.  **Implementação Isolada:**
    -   Toda a nova lógica e as novas dependências (ex: `nx-firestore-refs`) são implementadas exclusivamente dentro do novo arquivo `use-nx-dynamic-menu.ts`.
    -   O hook original (`useDynamicMenu`) permanece **intocado**.

3.  **Migração Componente por Componente:**
    -   Escolhemos uma única página ou componente para migrar.
    -   Dentro desse componente, alteramos a importação para usar o novo hook:
        ```typescript
        // Antes
        import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
        
        // Depois
        import { useNxDynamicMenu } from '@/hooks/use-nx-dynamic-menu'; // Usando o novo hook
        ```
    -   Ajustamos o componente para funcionar com a nova estrutura de dados ou assinatura de função retornada pelo `useNxDynamicMenu`.

4.  **Validação Contínua:**
    -   Após migrar cada componente, executamos `npm run typecheck` e `npm run build`.
    -   Como o resto da aplicação ainda usa os hooks antigos e estáveis, apenas o componente recém-migrado precisa ser validado. O resto do build não deve quebrar.

5.  **Conclusão da Migração (Cleanup):**
    -   Uma vez que **todos** os componentes da aplicação tenham sido migrados para usar os novos hooks e serviços com prefixo `nx-`, realizamos a etapa final de limpeza:
        1.  Excluímos o arquivo do hook antigo (ex: `use-dynamic-menu.ts`).
        2.  Renomeamos o novo hook, removendo o prefixo (ex: `use-nx-dynamic-menu.ts` -> `use-dynamic-menu.ts`).
        3.  Usamos a função "Find and Replace" do IDE para atualizar todas as importações em massa (de `useNxDynamicMenu` para `useDynamicMenu`).

### Benefícios

-   **Estabilidade:** A aplicação principal nunca fica em um estado quebrado.
-   **Progresso Incremental:** Permite que o trabalho seja feito em pequenas partes, com validação a cada passo.
-   **Facilidade de Reversão:** Se a nova abordagem se mostrar problemática, reverter um único componente de volta para o hook antigo é uma tarefa trivial.
-   **Clareza:** O prefixo `nx-` deixa claro para todos os desenvolvedores qual código é parte da nova arquitetura e qual é legado.

Este padrão é a nossa principal ferramenta para evoluir a base de código de forma segura e gerenciável.