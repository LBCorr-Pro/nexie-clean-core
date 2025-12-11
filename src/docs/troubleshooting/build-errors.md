# Guia de Solução: Erros de Build

Este documento centraliza as causas e soluções para os erros mais comuns que ocorrem durante o processo de `npm run build`.

---

## 1. Erro: `You're importing a component that needs "server-only"`

-   **Sintoma:** O build falha com uma mensagem indicando que um módulo `server-only` (como `firebase-admin`) está sendo importado em um Client Component.
-   **Causa Raiz:** Arquitetura Master/Proxy aplicada incorretamente. Um arquivo de página "Proxy" (ex: `.../[instanceId]/page.tsx`) foi marcado com a diretiva `"use client";`. Isso força o proxy a ser um Client Component, que por sua vez importa uma página "Master" (um Server Component), criando uma cadeia de importação ilegal.
-   **Solução Definitiva:**
    1.  **Remova a diretiva `"use client";` de TODOS os arquivos de página proxy.**
    2.  Páginas proxy devem ser Server Components puros que apenas re-exportam a página Master.
    -   **Exemplo Correto (Proxy):**
        ```typescript
        // Em: /feature/[instanceId]/page.tsx
        import MasterPage from "../../page"; // Importa o Master (Server Component)
        export default MasterPage; // Apenas re-exporta
        ```

---

## 2. Erro: `PageNotFoundError: Cannot find module for page...`

-   **Sintoma:** O build falha ao tentar coletar os dados da página (`collecting page data`), indicando que não encontrou o módulo para uma rota específica (ex: `/_not-found`).
-   **Causa Raiz:** Este erro geralmente ocorre quando há uma inconsistência nos arquivos de layout, especialmente após uma refatoração. O Next.js pode se confundir sobre qual layout se aplica a qual rota, incluindo as rotas internas como `_not-found`.
-   **Solução:**
    1.  **Verifique a Hierarquia de Layouts:** Garanta que você tenha um `layout.tsx` na raiz do `src/app` e, se usar internacionalização, um em `src/app/[locale]`.
    2.  **Separação de Responsabilidades:**
        -   **`src/app/layout.tsx`:** Deve ser o mais simples possível, definindo apenas as tags `<html>` e `<body>`. Ele não deve ser `async` nem tentar acessar `params`.
        -   **`src/app/[locale]/layout.tsx`:** Deve ser um componente `async` que recebe os `params` como `Promise` e configura os provedores de contexto, como o `NextIntlClientProvider`. **Não deve conter `<html>` ou `<body>`**.
    3.  **Para a solução detalhada deste problema, consulte o guia de `troubleshooting/layout-and-hydration-errors.md`.**

---

## 3. Erro: `Type '...' does not satisfy the constraint 'PageProps'` (Next.js 15+)

-   **Sintoma:** O `next build` falha com um erro de tipo, informando que a prop `params` de uma página ou layout é incompatível com o tipo `Promise<any>`.
-   **Causa Raiz:** O componente é um Server Component (`async`) que acessa `params`, mas sua assinatura de tipo define `params` como um objeto simples, não como uma `Promise`.
-   **Solução Definitiva:**
    1.  O componente **DEVE** ser uma `async function`.
    2.  A prop `params` na interface de props **DEVE** ser tipada como `Promise<{...}>`.
    3.  Os valores **DEVEM** ser extraídos com `await` antes do uso.
    -   **Exemplo Correto:**
        ```typescript
        export default async function MinhaPagina({ 
          params 
        }: { 
          params: Promise<{ slug: string }> 
        }) {
          const { slug } = await params;
          // ...
        }
        ```
    -   **Para a análise completa, consulte `docs/dev/framework/nextjs15-async-props.md`.**
