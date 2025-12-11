# Guia Consolidado de Erros Comuns e Suas Soluções

Este documento é um guia de referência rápida para os erros mais frequentes encontrados durante o desenvolvimento, suas causas e as soluções padronizadas. A leitura deste guia é **obrigatória** para evitar a reintrodução de bugs já corrigidos.

---

## 1. Erros de Tipo (TypeScript)

- **Incompatibilidade `Date` vs. `Timestamp`:** Crie tipos separados para a UI e o Firestore, e converta os dados na fronteira.
- **Incompatibilidade em Formulários (Zod):** O schema Zod é a fonte da verdade. Mantenha os `defaultValues` sincronizados com o schema.

---

## 2. Erros de Lógica e Renderização

#### 2.1. Campos do Formulário Não Aparecem

- **Sintoma:** Uma página de criação ou edição não exibe os campos de formulário, mesmo que eles estejam configurados no backend.
- **Causa Raiz:** Uma condição em um `useEffect` que é responsável por construir o formulário está impedindo a sua execução. Isso geralmente acontece por uma verificação incorreta, como `if (fieldConfigs.length === 0) return;`, que bloqueia a renderização se os dados chegam de forma assíncrona.
- **Solução:** Remova a condição de bloqueio do `useEffect`. A lógica de renderização (JSX) deve ser responsável por exibir um estado de carregamento (`isLoading`) ou uma mensagem de "nenhum campo", e não o `useEffect`.

#### 2.2. Perda de Estado do Formulário ao Falhar a Validação

- **Sintoma:** Após o usuário submeter um formulário com dados inválidos, a página rola para o erro, mas os campos do formulário desaparecem.
- **Causa:** Este é um efeito colateral do problema anterior. Como o `useEffect` que constrói o formulário não é re-executado corretamente, o estado do formulário é perdido, e o React remove os campos do DOM.
- **Solução:** Corrija o problema 2.1. Ao garantir que o `useEffect` de construção do formulário seja executado de forma confiável, o estado do formulário será preservado entre as tentativas de submissão.

#### 2.3. Ordenação de Lista (Drag-and-Drop) Não Salva ou "Pula de Volta"

- **Sintoma:** Ao arrastar um item ou usar setas de ordenação, o item volta para sua posição original. A nova ordem não é mantida visualmente nem salva.
- **Causa:** A lógica do componente não está atualizando o estado local do React que renderiza a lista. A interface é re-renderizada com a ordem antiga antes que a nova seja persistida.
- **Solução:** Siga a arquitetura padrão para componentes de ordenação.
- **--> Para a explicação completa e o código de exemplo que deve ser seguido, leia o guia dedicado:
[`docs/dev/troubleshooting/dnd-and-ordering-guide.md`](./troubleshooting/dnd-and-ordering-guide.md)**

#### 2.4. Inconsistência de Layout Entre Páginas de Criação e Edição

- **Sintoma:** A página de edição de um item (ex: usuário) tem um layout ou conjunto de campos diferente da página de criação.
- **Causa:** A lógica para buscar e renderizar os campos do formulário é diferente entre a página de criação e a de edição, levando a uma divergência.
- **Solução:** Refatorar a página de edição para reutilizar exatamente o mesmo componente e lógica de construção de formulário da página de criação. A única diferença deve estar na busca dos dados iniciais (para preencher o formulário) e na ação de submissão (criar vs. atualizar).

---

## 3. Erros de Banco de Dados (Firestore)

#### 3.1. Dados Salvos na Coleção Errada

- **Sintoma:** Um novo documento é criado, mas não aparece no local esperado no Firestore.
- **Causa:** A função de salvamento não está usando a referência de coleção correta, especialmente em contextos de `master` vs. `instance`.
- **Solução:** **NUNCA** construa referências do Firestore manualmente. **SEMPRE** utilize as funções centralizadas em `src/lib/firestore-refs.ts` para garantir que a hierarquia de dados seja respeitada.

#### 3.2. Falha em Operações Atômicas (Múltiplas Escritas)

- **Sintoma:** Ao criar uma entidade que precisa existir em duas coleções diferentes (ex: um usuário global e sua associação a uma instância), apenas uma das operações de escrita funciona, deixando o sistema em um estado inconsistente.
- **Causa:** As operações de escrita estão sendo executadas em sequência, e uma delas pode falhar sem que a outra seja revertida.
- **Solução:** Use um `writeBatch` do Firestore. Adicione todas as suas operações (`set`, `update`, `delete`) ao batch e, em seguida, chame `batch.commit()` uma única vez. Isso garante que todas as operações sejam bem-sucedidas ou que nenhuma delas seja aplicada.

---

## 4. Erros de Runtime

### 4.1. Análise e Solução do Erro "Illegal constructor"

Este documento detalha a causa e a solução para o erro de runtime `TypeError: Illegal constructor` que ocorreu na página de criação de usuário (`src/app/[locale]/(app)/users/create/page.tsx`).

#### O Erro

O erro se manifestou durante a renderização de um formulário dinâmico, com a seguinte mensagem no console:

```
Error Type: Runtime TypeError
Error Message: Illegal constructor

Stack Trace:
  at Object.render (src/app/[locale]/(app)/users/create/page.tsx:406:27)
  // ...
```

A linha 406, apontada no erro, correspondia à tentativa de renderizar um componente de ícone:

```tsx
<FieldIcon className="mr-2 h-4 w-4 text-primary/80" />
```

Isso indicava que a variável `FieldIcon` não continha um componente React válido no momento da renderização.

#### Causa Raiz: Colisão de Nomes com a API do Navegador

A investigação revelou que o problema estava na fonte de dados que alimenta o formulário, especificamente na constante `PREDEFINED_FIELDS_META`. Esta estrutura define metadados para cada campo, incluindo um ícone a ser exibido.

```typescript
// src/app/[locale]/(app)/users/create/page.tsx

const PREDEFINED_FIELDS_META = [
    // ... outros campos
    { key: 'password', label: 'Senha', defaultZod: z.string().min(6, "..."), icon: Lock, fieldType: "password" },
    // ...
];
```

O erro ocorria porque:

1.  **Ícone Não Importado:** O ícone `Lock`, associado ao campo de senha, **não havia sido importado** da biblioteca `lucide-react` no topo do arquivo.

2.  **Resolução de Nome Global:** Em ambientes de navegador e sem o "strict mode" impondo restrições, quando uma variável não é encontrada no escopo local, o JavaScript a procura no objeto global (`window`).

3.  **API Web Locks:** Por coincidência, o navegador expõe globalmente um objeto chamado `Lock` (`window.Lock`), que faz parte da [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API). Este objeto é um construtor nativo e não pode ser invocado ou renderizado como um componente React.

Quando o código tentou renderizar `<FieldIcon />` (que, para o campo de senha, continha a referência ao `window.Lock` global), o React tentou tratar esse construtor nativo como um componente, resultando no erro `Illegal constructor`.

#### Solução Aplicada

A solução foi direta e consistiu em corrigir a referência quebrada, garantindo que a variável `Lock` apontasse para o componente de ícone correto.

Foi adicionada a importação do ícone `Lock` da biblioteca `lucide-react` no topo do arquivo `page.tsx`:

```typescript
// src/app/[locale]/(app)/users/create/page.tsx

import { ..., Lock } from "lucide-react";

// ... resto do código
```

Com essa correção, a variável `Lock` dentro do `PREDEFINED_FIELDS_META` passou a referenciar corretamente o componente de ícone do `lucide-react`, eliminando a colisão de nomes e resolvendo o erro de renderização.