# Guia de Solução: Erros de Login e Autenticação

Este documento detalha os erros comuns relacionados ao fluxo de login, autenticação e gerenciamento de sessão, e suas soluções arquiteturais.

---

## 1. Tela Branca ou Redirecionamento Incorreto no Login

-   **Sintoma:** Após o login, o usuário vê uma tela branca, ou a página de login é exibida incorretamente dentro do layout principal da aplicação (com sidebars e headers).
-   **Causa Raiz:** Estrutura de rotas e layouts inadequada. A página pública de login estava incorretamente agrupada com as rotas privadas, fazendo com que ela herdasse o `AuthGuard` e o layout principal que exigem autenticação.
-   **Solução Definitiva:** **Separar Rotas Públicas e Privadas.**
    1.  **Crie um Grupo de Rota `(public)`:** Em `src/app/[locale]/`, crie uma pasta `(public)`.
    2.  **Mova as Páginas Públicas:** Mova todas as páginas que não exigem login (ex: `/login`, `/register`, `/forgot-password`) para dentro de `(public)`.
    3.  **Crie um Layout Público:** Dentro de `(public)`, crie um `layout.tsx` que seja minimalista e apenas renderize `{children}`, sem nenhum componente de UI da aplicação principal.
    4.  As rotas privadas (`/dashboard`, `/settings`) devem permanecer no grupo `(app)`, que usa o layout principal com `AuthGuard`.

---

## 2. Persistência de Sessão e Uso de Cookies

-   **Sintoma:** O usuário é deslogado a cada atualização da página.
-   **Causa Raiz:** A sessão de autenticação não está sendo persistida entre as requisições.
-   **Solução Arquitetural:** **Uso de Session Cookies.**
    1.  **Criação do Cookie (Server Action):** Após um login bem-sucedido no cliente, o cliente envia o `idToken` para uma **Server Action** (`createSessionCookieAction`).
    2.  **Lógica da Server Action:**
        -   Usa o **Firebase Admin SDK** para verificar o `idToken`.
        -   Se válido, cria um *session cookie* com um tempo de expiração.
        -   Usa a função `cookies().set()` do Next.js para definir este cookie como `httpOnly`.
    3.  **Validação no Middleware:** O `middleware.ts` intercepta todas as requisições, verifica a validade do cookie e, se válido, permite o acesso.

### Por que `js-cookie`?

-   A biblioteca `js-cookie` é uma ferramenta para gerenciar cookies **no lado do cliente**. Foi usada para depuração e para a funcionalidade "Lembrar-me", mas o pilar da autenticação é o *session cookie* `httpOnly`.

---

## 3. Depuração de Contexto (`DebugInfo` e `ActingBar`)

-   **Problema:** Dificuldade em validar o estado de autenticação, permissões e o contexto de "atuar como".
-   **Solução Implementada:**
    1.  **`<DebugInfo>` na Dashboard:** Um painel foi adicionado à `dashboard/page.tsx` que exibe o `currentUser`, as `permissions` e os `cookies`.
    2.  **`<ActingBar>` no Header:** Uma barra de ferramentas no topo da página permite trocar rapidamente entre o contexto "Master Global" e qualquer uma das instâncias.

-   **Correção de `TypeError: Cannot read properties of undefined (reading 'length')`:**
    -   **Causa:** O `DebugInfo` tentava acessar `permissions.length` antes que o `useUserPermissions` tivesse terminado de carregar os dados.
    -   **Solução:** Ao desestruturar o valor do hook, um valor padrão é fornecido: `const { ..., permissions = [] } = useUserPermissions();`.
