# Guia de Erros Inaceitáveis (Padrão Nexie)

Este documento registra os erros de arquitetura e tipo que são recorrentes, mas **inaceitáveis** no padrão de desenvolvimento atual. A violação destes princípios resulta em bugs já conhecidos e corrigidos. **A consulta a este guia é obrigatória antes de qualquer modificação de código.**

---

## 1. Incompatibilidade com Next.js 15: `params` é uma `Promise`

-   **Sintoma:** O build falha com um erro de tipo complexo, informando que `{ locale: string }` não pode ser atribuído a um tipo `Promise<any>`.
-   **Causa Raiz:** Componentes de Página ou Layout (que por padrão são **Server Components**) recebem as props dinâmicas (`params`, `searchParams`) como **Promises**, não como objetos diretos. Tentar desestruturá-los sem `await` causa a falha.
-   **Solução Definitiva (Padrão Obrigatório):**
    1.  O componente de página/layout **DEVE** ser uma `async function`.
    2.  A prop `params` na assinatura de tipo **DEVE** ser explicitamente tipada como uma `Promise`.
    3.  Os valores **DEVEM** ser extraídos usando `await` antes do uso.

    ```typescript
    // PADRÃO CORRETO E OBRIGATÓRIO para páginas/layouts dinâmicos
    export default async function MinhaPaginaDinamica({ 
      params 
    }: { 
      params: Promise<{ slug: string; locale: string }> 
    }) {
      const { slug, locale } = await params; // Extração com AWAIT

      // ... resto da lógica do Server Component ...
    }
    ```
-   **Erro Inaceitável:** Tentar usar `use(params)` ou qualquer outra abordagem que não siga o padrão `async/await` com a tipagem de `Promise`. Consulte `docs/dev/framework/nextjs15-async-props.md` para a análise completa.

## 2. Mistura de Tipos: `Timestamp` do Firestore vs. `Date` da UI

-   **Sintoma:** Erros de tipo, falhas em componentes de calendário (`DatePicker`), ou exibição de datas incorretas.
-   **Causa Raiz:** Passar um objeto `Timestamp` do Firestore diretamente como prop para um componente React da UI, que espera um objeto `Date` do JavaScript ou uma string.
-   **Solução Definitiva (Padrão Obrigatório):**
    1.  **A Fronteira é na Busca de Dados:** A conversão de `Timestamp` para `Date` (ou para uma string formatada) deve ocorrer **imediatamente** após os dados serem recebidos do Firestore.
    2.  **Componentes Puros:** Componentes da UI **NUNCA** devem ter conhecimento do tipo `Timestamp`. Eles devem receber apenas `Date`, `string`, ou tipos primitivos.

    ```typescript
    // Na camada de serviço ou hook que busca os dados:
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    // CORRETO ✅: Converte imediatamente
    const dadosParaUI = {
      ...data,
      createdAt: data.createdAt.toDate(), // Converte para objeto Date
    };
    
    // Incorreto ❌: Passar `data` diretamente para a UI
    ```

## 3. Acesso Direto a `localStorage` ou `window` no Nível Superior

-   **Sintoma:** Erros de `ReferenceError: localStorage is not defined` durante o build ou na renderização do lado do servidor (SSR).
-   **Causa Raiz:** O código no nível superior de um módulo é executado no servidor, onde os objetos `window` e `localStorage` não existem.
-   **Solução Definitiva (Padrão Obrigatório):**
    1.  O acesso a APIs do navegador **DEVE** ocorrer exclusivamente dentro de hooks `useEffect` ou em funções que são chamadas como resultado de uma interação do usuário (ex: `onClick`).
    2.  Use um estado (`useState`) para armazenar o valor lido do `localStorage` e só renderize o componente que depende desse valor quando o estado estiver pronto.

## 4. Referências Manuais ao Firestore

-   **Sintoma:** Dados sendo salvos ou lidos da coleção errada (ex: salvar em `master` quando deveria ser na `instância`).
-   **Causa Raiz:** Construir caminhos do Firestore manualmente com `collection(db, 'meu/caminho/hardcoded')`.
-   **Solução Definitiva (Padrão Obrigatório):**
    -   **SEMPRE** utilize o objeto `refs` do arquivo `src/lib/firestore-refs.ts`. Esta é a **única fonte da verdade** para os caminhos do banco de dados.

## 5. Uso Incorreto da Função de Tradução `useTranslations`

-   **Sintoma:**
    *   O texto renderizado na UI é `[object Object]`, `companyManagement.title` ou similar.
    *   Erros no console como `Functions are not valid as a React child`.
    *   Erros de `MISSING_MESSAGE` no console, mesmo que a chave pareça existir no arquivo JSON.
-   **Causa Raiz:** Acessar as chaves de tradução como propriedades de um objeto (`t.title`) em vez de chamar a função `t` com a chave como argumento (`t('title')`). O hook `useTranslations` retorna uma **função**, não um objeto de traduções.
-   **Solução Definitiva (Padrão Obrigatório):**
    1.  **SEMPRE** chame a função `t` para obter uma tradução.
    2.  Ao usar múltiplos namespaces (ex: `common` e `userManagement`), declare uma variável para cada um.

    ```typescript
    // No componente React
    import { useTranslations } from 'next-intl';

    export default function MeuComponente() {
      // Correto: Carrega o namespace 'userManagement' na função 't'
      const t = useTranslations('userManagement');
      
      // Correto: Carrega o namespace 'common' na função 'tCommon'
      const tCommon = useTranslations('common');

      return (
        <div>
          {/* PADRÃO CORRETO ✅: Chama a função com a string da chave */}
          <h1>{t('title')}</h1>
          <p>{t('componentDescription')}</p>
          <button>{tCommon('save')}</button>

          {/* ERRO INACEITÁVEL ❌: Tenta acessar como propriedade */}
          <h1>{t.title}</h1> 
        </div>
      );
    }
    ```
-   **Erro Inaceitável:** Qualquer tentativa de acessar chaves de tradução usando a sintaxe de ponto (`t.chave`) em vez da sintaxe de chamada de função (`t('chave')`).

## 6. Navegação sem Prefixo de Idioma

-   **Sintoma:** Erros de `404 Not Found` ou `Missing <html> and <body> tags` ao navegar para páginas dentro da aplicação.
-   **Causa Raiz:** Componentes `<Link>` ou chamadas `router.push` que usam uma URL absoluta (começando com `/`) mas não incluem o prefixo de idioma atual (ex: `/pt-BR`).
-   **Solução Definitiva (Padrão Obrigatório):**
    1.  Obtenha o `locale` atual através do hook `useParams()` de `next/navigation`.
    2.  **SEMPRE** construa a URL de destino incluindo a variável `locale` no início.

    ```tsx
    import { useParams } from 'next/navigation';
    import Link from 'next/link';

    // ...
    const params = useParams();
    const locale = params.locale as string;

    // ... no JSX
    <Link href={`/${locale}/settings/meu-caminho`}>
      Ir para Configurações
    </Link>
    ```
-   **Erro Inaceitável:** Usar `<Link href="/settings/caminho">` em vez de `<Link href={\`/${locale}/settings/caminho\`}>`.

## 7. Uso Indevido de `"use client"` em Páginas Proxy

-   **Sintoma:** O build falha com um erro de importação de um módulo "server-only" (como `firebase-admin`), mas o `Import trace` aponta para uma página "Proxy" que parece não ter lógica.
-   **Causa Raiz:** Uma página "Proxy", cuja única função é re-exportar uma página "Master" (que é um Server Component), foi incorretamente marcada com a diretiva `"use client"`. Isso transforma o proxy em um Componente de Cliente, que não pode importar um Componente de Servidor. A arquitetura Master/Proxy é violada.
-   **Solução Definitiva (Padrão Obrigatório):**
    1.  Páginas "Proxy" **NUNCA** devem conter a diretiva `"use client"`.
    2.  A responsabilidade de uma página proxy é exclusivamente re-exportar o componente "Master", sem nenhuma lógica ou diretiva adicional.

    ```typescript
    // Em: /users/[instanceId]/page.tsx
    
    // ERRADO ❌: Transforma o proxy em um Componente de Cliente
    "use client"; 

    import UsersMasterPage from "../page";
    export default UsersMasterPage;
    ```

    ```typescript
    // Em: /users/[instanceId]/page.tsx

    // CORRETO ✅: O proxy permanece um Server Component por padrão e apenas re-exporta.
    import UsersMasterPage from "../page";
    export default UsersMasterPage;
    ```
-   **Erro Inaceitável:** Adicionar a diretiva `"use client"` a qualquer página que funcione como um "proxy" na arquitetura Master/Proxy. Consulte o `estrutura.md` para mais detalhes.

---
A reintrodução de qualquer um desses erros indica uma falha no cumprimento dos padrões de arquitetura estabelecidos.
```