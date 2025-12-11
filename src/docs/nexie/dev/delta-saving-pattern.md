# Guia do Padrão de Salvamento "Delta" (Overrides)

Este documento detalha a estratégia de salvamento de configurações para a arquitetura multi-instância, garantindo que a herança de configurações seja preservada.

## O Problema: Sobrescrevendo Configurações Herdadas

Em um sistema com herança em cascata, se um administrador de uma sub-instância salva uma configuração (ex: muda a cor primária), ele não deve recriar *todas* as configurações de aparência no seu próprio nível. Se fizesse isso, perderia a capacidade de herdar futuras atualizações do tema da instância pai ou do master.

## A Solução: Salvar Apenas o "Delta"

A lógica de salvamento adotada é a de **"override"** ou **"delta"**. Apenas as alterações específicas feitas pelo usuário no contexto atual são salvas no banco de dados.

### Como Funciona:

1.  **Carregamento:** O hook `useNxDynamicMenu` (ou hook similar) carrega o objeto de configuração completo, já resolvido através da cascata de herança. Este objeto é usado para popular o formulário.

2.  **Edição:** O usuário modifica um ou mais campos no formulário. A biblioteca `react-hook-form` rastreia quais campos estão "sujos" (`dirtyFields`).

3.  **Salvamento (`setDoc` com `merge: true`):**
    -   Quando o usuário clica em "Salvar", a função de salvamento (ex: uma `Server Action`) **não** salva o objeto de formulário inteiro.
    -   Ela constrói um novo objeto contendo **apenas** os campos que foram modificados (`dirtyFields`).
    -   Ela chama `setDoc` com a opção `{ merge: true }`. Isso instrui o Firestore a "mesclar" os novos dados com o documento existente, em vez de sobrescrevê-lo completamente.
    -   Crucialmente, ela também define o campo `customized: true` no documento do contexto atual para indicar que ele agora tem configurações próprias e não deve mais herdar tudo cegamente.

**Exemplo de Fluxo:**

-   **Contexto:** Administrador da `sub-instancia-A`.
-   **Configuração Herdada:** `primaryColor: #0000FF` (do Master).
-   **Ação:** O admin muda a `primaryColor` para `#FF0000` e o `borderRadius` para `0.75rem`, mas não toca na cor de fundo.
-   **Objeto a ser salvo:** A função de salvamento criará um objeto contendo apenas as alterações:
    ```json
    {
      "primaryColor": "#FF0000",
      "borderRadius": "0.75rem",
      "customized": true,
      "updatedAt": "..."
    }
    ```
-   **Resultado no Firestore:** O documento em `.../subinstances/sub-instancia-A/config/appearance_settings` conterá apenas esses campos.
-   **Próximo Carregamento:** Quando um hook como `useInstanceData` for carregar as configurações para a `sub-instancia-A` novamente:
    1.  Ele encontrará o documento da sub-instância com `customized: true`.
    2.  Ele carregará os valores de `primaryColor` e `borderRadius` deste documento.
    3.  Para a cor de fundo (e todas as outras propriedades que não foram salvas), ele continuará subindo na cascata de herança, buscando na instância pai, na master, etc.

## Exclusão de Itens Herdados

Quando um item herdado (como um grupo de menu) é "excluído" no contexto de uma instância, ele não é removido do documento master. Em vez disso, um registro de "oculto" é criado no nível da instância.

-   **Ação:** Admin da `instancia-B` exclui o grupo de menu "Suporte", que é herdado do Master.
-   **Lógica de Salvamento:** A função de salvamento cria ou atualiza a configuração de menu da `instancia-B`, adicionando uma entrada para o grupo "Suporte" com uma propriedade `isHidden: true`.
-   **Resultado:** O hook `useMenuData`, ao montar o menu para a `instancia-B`, verá a configuração local `isHidden: true` e não renderizará o grupo "Suporte", mesmo que ele ainda exista no Master.

Este padrão garante um sistema flexível, eficiente e que respeita a hierarquia de configurações, evitando a duplicação desnecessária de dados.
