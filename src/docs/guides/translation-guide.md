# Guia Definitivo de Tradução (i18n) com `next-intl`

Este documento é a **fonte única da verdade** sobre como o sistema de internacionalização funciona neste projeto.

## 1. O Fluxo de Detecção de Idioma

O sistema determina o idioma do usuário de forma inteligente:

1.  **Cookie Primeiro:** O `middleware.ts` verifica o cookie `NEXT_LOCALE`. Se existir, usa seu valor.
2.  **Fallback para o Navegador:** Se não houver cookie, inspeciona o cabeçalho `Accept-Language` da requisição.
3.  **Fallback para Inglês:** Se o idioma do navegador não for suportado, redireciona para Inglês (`/en`).
4.  **Padrão do Sistema:** Se tudo falhar, usa o `defaultLocale` (`pt-BR`).

## 2. A Estrutura de Tradução Correta

A estrutura de arquivos foi consolidada para simplificar a manutenção.

### ⚠️ Ponto Crítico: Localização e Estrutura

-   **Diretório Raiz:** O diretório `locales` DEVE estar na **raiz do projeto**.
-   **Arquivo Único por Idioma:** Cada idioma (`en.json`, `pt-BR.json`, `es.json`) possui um **único arquivo JSON**.
-   **Namespaces:** Dentro de cada arquivo, os textos são organizados em objetos de nível superior chamados "namespaces" (ex: `common`, `dashboard`).

**Exemplo (`locales/pt-BR.json`):**
```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar"
  },
  "dashboard": {
    "title": "Painel de Controle"
  }
}
```

### Carregando as Traduções

O `NextIntlClientProvider` em `src/app/[locale]/layout.tsx` carrega o arquivo JSON correspondente ao idioma ativo, tornando as traduções disponíveis para toda a aplicação.

## 3. Padrão de Uso em Componentes (Obrigatório)

Para usar as traduções, siga **exatamente** este padrão.

1.  **Importe `useTranslations`:**
    ```javascript
    import { useTranslations } from 'next-intl';
    ```

2.  **Carregue o Namespace:** Dentro do seu componente (`"use client";`), chame `useTranslations` passando o nome do namespace.
    ```javascript
    const t = useTranslations('dashboard');
    ```

3.  **Chame a Função `t`:** O hook retorna uma **função**. Você **deve chamar esta função** com a chave da tradução.

### Erro Comum e Inaceitável
-   **Sintoma:** O texto na UI aparece como `[object Object]` ou `dashboard.title`.
-   **Causa Raiz:** Tentar acessar a tradução como uma propriedade de objeto (`t.title`) em vez de chamar a função (`t('title')`).
-   **Exemplo:**
    ```tsx
    // ✅ CORRETO: Chama a função com a chave.
    <h1>{t('title')}</h1>

    // ❌ ERRADO: Tenta acessar como uma propriedade.
    <h1>{t.title}</h1>
    ```

## 4. Resumo das Regras Inquebráveis

1.  A estrutura é `locales/[idioma].json` na raiz do projeto.
2.  Use `useTranslations('meu-namespace')` para carregar as traduções.
3.  **SEMPRE** chame a função `t` para obter o texto: `t('minha-chave')`.
