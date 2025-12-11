# Documento de Decisões Críticas de Arquitetura

Este documento registra as decisões de arquitetura mais importantes e as lições aprendidas durante o desenvolvimento, especialmente após a resolução de bugs críticos de tipo. A adesão a estes princípios é obrigatória para todo o novo código.

## 1. A Fronteira Inflexível: Firestore vs. UI

A causa raiz de bugs de tipo complexos e persistentes foi a mistura de tipos de dados do Firestore (como `Timestamp`) com tipos de dados da interface do usuário (UI) do JavaScript (como `Date`).

**Decisão Arquitetônica:**

- **Separação Estrita de Tipos:** Deve haver uma fronteira clara e inflexível entre os dados como eles existem no Firestore e como eles são usados na UI.
- **Conversão na Camada de Dados:** Os dados do Firestore **DEVEM** ser convertidos para tipos seguros para a UI (ex: `Timestamp` para `Date`) **imediatamente** após serem recebidos do banco de dados.
- **Tipos de UI Puros:** Os componentes React **NÃO DEVEM** ter conhecimento dos tipos de dados do Firestore. Eles devem operar exclusivamente com tipos primitivos do JavaScript e objetos `Date`.

## 2. Inconsistência de Versões de Pacotes (`@lexical`)

Um erro de tipo `Type '...' is not assignable to type 'Readonly<...>'` ocorreu nos componentes que usavam o editor Lexical. A causa foi um desalinhamento de versões entre os diferentes pacotes do ecossistema `@lexical` (ex: `@lexical/react`, `@lexical/table`, `lexical`).

**Decisão e Procedimento:**

- **Sintoma:** Erros de tipo envolvendo `Readonly` ou incompatibilidade entre `Nodes` e o `LexicalComposer`.
- **Diagnóstico:** Inspecionar o `package.json` para verificar se todas as dependências `lexical` e `@lexical/*` estão fixadas na **mesma versão exata**.
- **Solução:** Alinhar todas as versões no `package.json`, remover `node_modules` e o `package-lock.json`, e executar `npm install` novamente.

## 3. Cache Corrompido do Next.js

Em algumas situações, mesmo com o código correto, os erros de tipo persistem. Isso geralmente indica um cache de tipos corrompido na pasta `.next`.

**Decisão e Procedimento:**

- **Sintoma:** `npm run typecheck` falha com erros nos arquivos gerados em `.next/types/...`, e as correções no código-fonte não surtem efeito.
- **Solução Definitiva:** Remover completamente o diretório `.next` com o comando `rm -rf .next` para forçar uma reconstrução completa.

## 4. APIs Assíncronas no Next.js 15: A Solução para `params`

Com a atualização para o Next.js 15, APIs dinâmicas como `params` e `searchParams` tornaram-se `Promises` em Server Components. Isso causou um erro de tipo complexo que afirmava que a propriedade `params` não satisfazia o tipo esperado.

**Análise do Problema:**

O erro `Type '{ locale: string; }' is missing the following properties from type 'Promise<any>'` indicava que o Next.js estava passando uma `Promise` para o nosso componente, mas a assinatura de tipo do componente esperava um objeto simples. Tentativas de usar `await` dentro da função sem corrigir a tipagem falharam porque a incompatibilidade ocorria na própria assinatura do componente.

**Decisão Arquitetônica (Padrão Obrigatório):**

- **Tipagem Explícita como Promise:** A propriedade `params` na assinatura de tipo de um componente de página ou layout **DEVE** ser explicitamente tipada como uma `Promise`.
- **Uso de `await` para Resolução:** O valor dos parâmetros deve ser extraído usando `await` no corpo da função.

---

### Código Completo e Funcional: `src/app/[locale]/layout.tsx`

Abaixo está o código completo e correto que implementa a solução. **Este padrão deve ser seguido em todos os layouts e páginas que acessam `params`.**

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/auth-context';

const locales = ['en', 'pt-BR'];

// Correção Definitiva para Next.js 15:
// 1. O tipo da propriedade `params` é definido como `Promise<{ locale: string }>`.
// 2. O valor de `locale` é extraído usando `await` no corpo da função.
export default async function LocaleLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validação do locale
  if (!locales.includes(locale)) {
    notFound();
  }

  let messages;
  try {
    // A importação dinâmica continua sendo a forma correta de carregar os JSONs.
    messages = (await import(`../../../locales/${locale}.json`)).default;
  } catch (error) {
    console.error(`[DIAGNOSTIC LocaleLayout] Could not load messages for locale: ${locale}`, error);
    notFound();
  }

  const now = new Date();
  const timeZone = 'America/Sao_Paulo'; 
  
  return (
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        now={now}
        timeZone={timeZone}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextIntlClientProvider>
  );
}

```
---
Este documento é um registro vivo. Ele deve ser atualizado à medida que novas decisões críticas forem tomadas.