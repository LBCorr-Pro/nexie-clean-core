# Guia de Erros Comuns de Tipo no TypeScript

Este documento serve como um guia de referência para os erros de tipo mais comuns encontrados durante o desenvolvimento e como resolvê-los.

---

## 1. Erro: `Parameter 'acc' implicitly has an 'any' type.` (em `reduce`)

- **Contexto:** Ocorre ao usar `Array.prototype.reduce` para transformar um array em um novo objeto.
- **Causa:** O TypeScript não consegue inferir o tipo do objeto acumulador (`acc`) a partir de um objeto inicial vazio (`{}`).
- **Solução:** Forneça um tipo explícito para o objeto inicial usando `as Record<string, MyType>`.

## 2. Erro: `Element implicitly has an 'any' type because expression of type 'string' can't be used to index type...`

- **Contexto:** Ocorre ao tentar acessar a propriedade de um objeto usando uma chave que é uma variável do tipo `string`.
- **Causa:** O TypeScript não pode garantir que a string corresponde a uma das chaves do objeto.
- **Solução:** Adicione tipos explícitos aos parâmetros da função de callback (ex: `(a: MyType, b: MyType) => ...`).

## 3. Erro: `... has no index signature` (ao acessar módulo dinamicamente)

- **Contexto:** Ao tentar acessar uma propriedade de um módulo importado (como `lucide-react`) usando uma chave dinâmica.
- **Causa:** O objeto do módulo não possui uma "assinatura de índice" (`index signature`), então o TypeScript não sabe que pode ser acessado com uma string arbitrária.
- **Solução:** Faça um type-cast do objeto para um tipo que tenha uma assinatura de índice, como `Record<string, ComponentType>`.

## 4. Erro: `React Hook useEffect has a missing dependency...`

- **Contexto:** O linter do React detecta que uma variável usada dentro de um `useEffect` não está listada em seu array de dependências.
- **Causa:** O `useEffect` só é re-executado quando um dos valores no array de dependências muda. Se você usa uma variável de fora sem listá-la, o *closure* do `useEffect` pode capturar um valor obsoleto.
- **Solução:** Adicione a variável ou função ausente ao array de dependências.

## 5. Erro: `Argument of type 'Date | Timestamp' is not assignable...`

- **Contexto:** Passar um valor que pode ser um `Timestamp` do Firestore para uma função que espera um `Date`.
- **Causa:** O tipo `Timestamp` do Firestore não é o mesmo que o tipo `Date` nativo do JavaScript.
- **Solução:** Converta o valor para `Date` antes de passá-lo para a função, usando o método `.toDate()`.

## 6. Erro: `Type 'number' is not assignable to type 'boolean'`

- **Contexto:** Passar um número para uma propriedade que espera um booleano.
- **Causa:** Um erro de lógica. Por exemplo, passar `array.length - 1` para uma prop `isLast`, em vez da expressão `index === array.length - 1`.
- **Solução:** Corrija a expressão para que ela retorne um booleano.
